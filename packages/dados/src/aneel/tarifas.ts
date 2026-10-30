import { acharColuna, dataISO, diaSeguinte, normalizar, numeroBR, semValor, subtrairMeses, type Linha } from "../util";

/**
 * Conjunto "Tarifas de aplicação das distribuidoras de energia elétrica" da ANEEL.
 * https://dadosabertos.aneel.gov.br/dataset/tarifas-distribuidoras-energia-eletrica
 */
export const URL_TARIFAS =
  "https://dadosabertos.aneel.gov.br/dataset/5a583f3e-1646-4f67-bf0f-69db4203e89e/resource/fcf2906c-7c32-4b9b-a637-054e7a5234f4/download/tarifas-homologadas-distribuidoras-energia-eletrica.csv";

export interface TarifaVigente {
  sigla: string;
  cnpj?: string;
  teKwh: number;
  tusdKwh: number;
  inicioVigencia: string;
  fimVigencia?: string;
  resolucao?: string;
}

/**
 * D4 da HIS-111: tarifa vencida há mais que isso não é publicada; entre o 1º dia vencida e esse limite, é
 * publicada com aviso. Regra do dominio-energia (30/10/2026): o reajuste das distribuidoras é anual (PRORET,
 * Módulo 3, reajuste tarifário anual), e um reajuste perdido erra a conta em 5% a 19% (ESS, 2025). Descartar por
 * engano leva a "use o valor da sua conta de luz", que é honesto; manter por engano mostra um número errado.
 */
export const MESES_DE_TOLERANCIA_DA_TARIFA_VENCIDA = 6;

/** Tarifa cuja vigência já terminou (D4). */
export interface TarifaVencida {
  sigla: string;
  cnpj?: string;
  fimVigencia: string;
}

export interface SelecaoDeTarifas {
  tarifas: TarifaVigente[];
  /** Motivo de cada sigla que ficou de fora, para o log. */
  descartadas: string[];
  /** D4: vencidas há mais de 6 meses; ficam fora do arquivo. */
  vencidasDescartadas: TarifaVencida[];
  /** D4: vencidas há 6 meses ou menos; entram, com aviso no relatório. */
  vencidasEmUso: TarifaVencida[];
  /** V7: siglas com mais de um valor (TE, TUSD) na vigência escolhida. */
  comMaisDeUmValor: { sigla: string; cnpj?: string; valores: number }[];
}

export interface ColunasTarifas {
  agente: string;
  te: string;
  tusd: string;
  inicio: string;
  fim?: string;
  cnpj?: string;
  base?: string;
  subgrupo?: string;
  modalidade?: string;
  classe?: string;
  subclasse?: string;
  detalhe?: string;
  posto?: string;
  unidade?: string;
  acessante?: string;
  resolucao?: string;
}

export function mapearColunasTarifas(cabecalho: string[]): ColunasTarifas {
  const obrigatoria = (nome: string, ...c: (string | RegExp)[]) => {
    const col = acharColuna(cabecalho, ...c);
    if (!col) throw new Error(`Coluna "${nome}" não encontrada no CSV de tarifas. Cabeçalho: ${cabecalho.join(" | ")}`);
    return col;
  };
  return {
    agente: obrigatoria("SigAgente", "SigAgente", "SiglaAgente", /^sigagente$/),
    te: obrigatoria("VlrTE", "VlrTE", "ValorTE", /^vlrte$/),
    tusd: obrigatoria("VlrTUSD", "VlrTUSD", "ValorTUSD", /^vlrtusd$/),
    inicio: obrigatoria("DatInicioVigencia", "DatInicioVigencia", /inicio.*vigencia/),
    fim: acharColuna(cabecalho, "DatFimVigencia", /fim.*vigencia/),
    cnpj: acharColuna(cabecalho, "NumCNPJDistribuidora", /cnpj/),
    base: acharColuna(cabecalho, "DscBaseTarifaria", /basetarifaria/),
    subgrupo: acharColuna(cabecalho, "DscSubGrupo", /subgrupo/),
    modalidade: acharColuna(cabecalho, "DscModalidadeTarifaria", /modalidade/),
    classe: acharColuna(cabecalho, "DscClasse", /^dscclasse$/),
    subclasse: acharColuna(cabecalho, "DscSubClasse", /subclasse/),
    detalhe: acharColuna(cabecalho, "DscDetalhe", /^dscdetalhe$/),
    posto: acharColuna(cabecalho, "NomPostoTarifario", /posto/),
    unidade: acharColuna(cabecalho, "DscUnidadeTerciaria", /unidade/),
    acessante: acharColuna(cabecalho, "SigAgenteAcessante", /acessante/),
    resolucao: acharColuna(cabecalho, "DscREH", /reh|resolucao/),
  };
}

/**
 * Filtro rápido (aplicado durante a leitura) para guardar só as linhas que interessam:
 * tarifa de aplicação, subgrupo B1, classe e subclasse residencial, modalidade convencional.
 * Isso deixa de fora a baixa renda, que é calculada pelas regras da Tarifa Social.
 */
export function ehTarifaResidencialB1(linha: Linha, c: ColunasTarifas): boolean {
  if (c.subgrupo && normalizar(linha[c.subgrupo]) !== "b1") return false;
  if (c.classe && normalizar(linha[c.classe]) !== "residencial") return false;
  if (c.subclasse && !["residencial", "nao se aplica", ""].includes(normalizar(linha[c.subclasse]))) return false;
  if (c.modalidade && normalizar(linha[c.modalidade]) !== "convencional") return false;
  if (c.base && !normalizar(linha[c.base]).includes("aplicacao")) return false;
  if (c.acessante && !semValor(linha[c.acessante])) return false;
  if (c.posto && !semValor(linha[c.posto])) return false;
  return true;
}

/**
 * Escolhe, para cada distribuidora, a tarifa vigente na data de referência:
 * a vigência mais recente que já começou e ainda não terminou. Se nenhuma cobrir a data
 * (atraso na publicação), usa a mais recente que já começou, desde que tenha vencido há no máximo 6 meses (D4);
 * mais velha que isso, a sigla fica fora, com o motivo "vencida desde AAAA-MM-DD".
 *
 * Também conta quantos valores diferentes há na vigência escolhida (V7): depois de um agrupamento, a ANEEL pode
 * manter um preço por área, e aí um valor qualquer seria o errado para metade das cidades.
 *
 * Os valores da ANEEL vêm em R$/MWh; aqui convertemos para R$/kWh.
 */
export function selecionarTarifasVigentes(linhas: Linha[], c: ColunasTarifas, hoje: string): SelecaoDeTarifas {
  type Candidata = TarifaVigente & { detalheVazio: boolean };
  const porAgente = new Map<string, Candidata[]>();
  const descartadas: string[] = [];
  const vencidasDescartadas: TarifaVencida[] = [];
  const vencidasEmUso: TarifaVencida[] = [];
  const comMaisDeUmValor: SelecaoDeTarifas["comMaisDeUmValor"] = [];
  const limiteDeVencimento = subtrairMeses(hoje, MESES_DE_TOLERANCIA_DA_TARIFA_VENCIDA);

  for (const linha of linhas) {
    const sigla = (linha[c.agente] ?? "").trim();
    const inicio = dataISO(linha[c.inicio]);
    const te = numeroBR(linha[c.te]);
    const tusd = numeroBR(linha[c.tusd]);
    if (!sigla || semValor(sigla) || normalizar(sigla) === "nao informado" || !inicio || te === undefined || tusd === undefined) continue;
    const unidade = c.unidade ? normalizar(linha[c.unidade]) : "mwh";
    const divisor = unidade === "kwh" ? 1 : 1000;
    const candidata: Candidata = {
      sigla,
      cnpj: c.cnpj ? soDigitos(linha[c.cnpj]) || undefined : undefined,
      teKwh: te / divisor,
      tusdKwh: tusd / divisor,
      inicioVigencia: inicio,
      fimVigencia: c.fim ? dataISO(linha[c.fim]) : undefined,
      resolucao: c.resolucao ? linha[c.resolucao]?.trim() || undefined : undefined,
      detalheVazio: c.detalhe ? semValor(linha[c.detalhe]) : true,
    };
    const lista = porAgente.get(sigla) ?? [];
    lista.push(candidata);
    porAgente.set(sigla, lista);
  }

  const tarifas: TarifaVigente[] = [];
  for (const [sigla, todas] of porAgente) {
    // Linhas com "DscDetalhe" preenchido (ex.: compensação de geração distribuída) só se não houver outra.
    const semDetalhe = todas.filter((t) => t.detalheVazio);
    const lista = semDetalhe.length > 0 ? semDetalhe : todas;
    const iniciadas = lista.filter((t) => t.inicioVigencia <= hoje);
    const vigentes = iniciadas.filter((t) => !t.fimVigencia || t.fimVigencia >= hoje);
    const escolhidas = (vigentes.length > 0 ? vigentes : iniciadas).sort((a, b) => b.inicioVigencia.localeCompare(a.inicioVigencia));
    const escolhida = escolhidas[0];
    if (!escolhida) {
      descartadas.push(`${sigla}: nenhuma vigência iniciada até ${hoje}`);
      continue;
    }
    if (vigentes.length === 0 && escolhida.fimVigencia !== undefined) {
      const vencida = { sigla, cnpj: escolhida.cnpj, fimVigencia: escolhida.fimVigencia };
      if (escolhida.fimVigencia < limiteDeVencimento) {
        descartadas.push(`${sigla}: vencida desde ${diaSeguinte(escolhida.fimVigencia)} (vigência até ${escolhida.fimVigencia})`);
        vencidasDescartadas.push(vencida);
        continue;
      }
      vencidasEmUso.push(vencida);
    }
    const valores = new Set(lista.filter((t) => t.inicioVigencia === escolhida.inicioVigencia).map((t) => `${t.teKwh.toFixed(6)}|${t.tusdKwh.toFixed(6)}`));
    if (valores.size > 1) comMaisDeUmValor.push({ sigla, cnpj: escolhida.cnpj, valores: valores.size });
    const total = escolhida.teKwh + escolhida.tusdKwh;
    if (total <= 0.05 || total > 5) {
      descartadas.push(`${sigla}: tarifa fora do esperado (R$ ${total.toFixed(4)}/kWh)`);
      continue;
    }
    const { detalheVazio: _ignorar, ...tarifa } = escolhida;
    tarifas.push(tarifa);
  }

  tarifas.sort((a, b) => a.sigla.localeCompare(b.sigla));
  const porSigla = (a: { sigla: string }, b: { sigla: string }) => a.sigla.localeCompare(b.sigla);
  return {
    tarifas,
    descartadas,
    vencidasDescartadas: vencidasDescartadas.sort(porSigla),
    vencidasEmUso: vencidasEmUso.sort(porSigla),
    comMaisDeUmValor: comMaisDeUmValor.sort(porSigla),
  };
}

/** O que o CSV de tarifas diz de cada sigla, vigente ou não (HIS-111: diagnóstico, V9 e V10). */
export interface AgenteDaTarifa {
  sigla: string;
  cnpj?: string;
  /** Inícios de vigência distintos, em ordem. */
  inicios: string[];
  /** Início da vigência mais recente que já começou (ou a mais antiga, se nenhuma começou). */
  ultimoInicio: string;
  /** Fim dessa vigência, quando informado. */
  ultimoFim?: string;
  /** Alguma vigência cobre o dia de hoje. */
  vigente: boolean;
}

/**
 * Resume as linhas B1 por sigla **e CNPJ**, sem escolher valor: serve para saber quem existe, com qual CNPJ e até quando.
 * A mesma sigla pode ter dois CNPJs: "RGE" é a RGE antiga (02016439000138) até 2019 e a RGE de hoje (02016440000162,
 * ex-RGE Sul) depois. Juntar as duas dava à antiga a vigência de hoje, e o V9 e o V10 reprovavam a linha certa da
 * sucessão (passo 0, 3ª execução). Linha sem CNPJ entra no grupo da sigla quando ela tem um CNPJ só.
 */
export function resumirAgentes(linhas: Linha[], c: ColunasTarifas, hoje: string): AgenteDaTarifa[] {
  type Grupo = { sigla: string; cnpj?: string; vigencias: { inicio: string; fim?: string }[] };
  const grupos = new Map<string, Grupo>();
  for (const linha of linhas) {
    const sigla = (linha[c.agente] ?? "").trim();
    const inicio = dataISO(linha[c.inicio]);
    if (!sigla || semValor(sigla) || normalizar(sigla) === "nao informado" || !inicio) continue;
    const cnpj = c.cnpj ? soDigitos(linha[c.cnpj]) || undefined : undefined;
    const chave = `${sigla}\u0000${cnpj ?? ""}`;
    const atual = grupos.get(chave) ?? { sigla, cnpj, vigencias: [] };
    atual.vigencias.push({ inicio, fim: c.fim ? dataISO(linha[c.fim]) : undefined });
    grupos.set(chave, atual);
  }
  for (const [chave, grupo] of grupos) {
    if (grupo.cnpj !== undefined) continue;
    const comCnpj = [...grupos.values()].filter((g) => g.sigla === grupo.sigla && g.cnpj !== undefined);
    const unico = comCnpj.length === 1 ? comCnpj[0] : undefined;
    if (!unico) continue;
    unico.vigencias.push(...grupo.vigencias);
    grupos.delete(chave);
  }
  const agentes: AgenteDaTarifa[] = [];
  for (const { sigla, cnpj, vigencias } of grupos.values()) {
    const iniciadas = vigencias.filter((v) => v.inicio <= hoje);
    const base = iniciadas.length > 0 ? iniciadas : vigencias;
    const ultimoInicio = base.reduce((maior, v) => (v.inicio > maior ? v.inicio : maior), base[0]?.inicio ?? "");
    const fins = base.filter((v) => v.inicio === ultimoInicio).map((v) => v.fim);
    const ultimoFim = fins.includes(undefined) ? undefined : fins.reduce<string | undefined>((maior, f) => (f && (!maior || f > maior) ? f : maior), undefined);
    agentes.push({
      sigla,
      cnpj,
      inicios: [...new Set(vigencias.map((v) => v.inicio))].sort(),
      ultimoInicio,
      ultimoFim,
      vigente: iniciadas.some((v) => !v.fim || v.fim >= hoje),
    });
  }
  return agentes.sort((a, b) => a.sigla.localeCompare(b.sigla) || (a.cnpj ?? "").localeCompare(b.cnpj ?? ""));
}

export function soDigitos(texto: string | undefined): string {
  return (texto ?? "").replace(/\D/g, "");
}
