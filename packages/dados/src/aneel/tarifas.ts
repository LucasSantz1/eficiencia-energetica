import { acharColuna, dataISO, normalizar, numeroBR, semValor, type Linha } from "../util";

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
 * (atraso na publicação), usa a mais recente que já começou.
 *
 * Os valores da ANEEL vêm em R$/MWh; aqui convertemos para R$/kWh.
 */
export function selecionarTarifasVigentes(linhas: Linha[], c: ColunasTarifas, hoje: string): { tarifas: TarifaVigente[]; descartadas: string[] } {
  type Candidata = TarifaVigente & { detalheVazio: boolean };
  const porAgente = new Map<string, Candidata[]>();
  const descartadas: string[] = [];

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
    const total = escolhida.teKwh + escolhida.tusdKwh;
    if (total <= 0.05 || total > 5) {
      descartadas.push(`${sigla}: tarifa fora do esperado (R$ ${total.toFixed(4)}/kWh)`);
      continue;
    }
    const { detalheVazio: _ignorar, ...tarifa } = escolhida;
    tarifas.push(tarifa);
  }

  tarifas.sort((a, b) => a.sigla.localeCompare(b.sigla));
  return { tarifas, descartadas };
}

export function soDigitos(texto: string | undefined): string {
  return (texto ?? "").replace(/\D/g, "");
}
