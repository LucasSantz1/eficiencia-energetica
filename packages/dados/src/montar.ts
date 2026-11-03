import type { ArquivoMunicipios, ArquivoTarifas, BandeiraMes, Distribuidora, Estado, Municipio } from "@ee/core";
import type { VinculoMunicipio } from "./aneel/municipios";
import type { AgenteDaTarifa, SelecaoDeTarifas, TarifaVencida, TarifaVigente } from "./aneel/tarifas";
import { MESES_DE_TOLERANCIA_DA_TARIFA_VENCIDA } from "./aneel/tarifas";
import { conferirSucessoesNaAneel, indexarSucessoes, seguirCadeia, type DadosDaAneelParaSucessoes, type Sucessao } from "./sucessoes";
import { diaSeguinte, normalizar, slug, subtrairMeses } from "./util";

export interface Localidades {
  estados: { uf: string; nome: string }[];
  municipios: { ibge: number; nome: string; uf: string }[];
}

/** Quantos municípios cada sigla afetou. */
export interface ContagemPorSigla {
  sigla: string;
  municipios: number;
}

export interface Relatorio {
  distribuidoras: number;
  distribuidorasSemMunicipio: string[];
  agentesSemTarifa: string[];
  municipios: number;
  municipiosSemDistribuidora: number;
  municipiosComVariasDistribuidoras: number;
  // HIS-111, D6: o que a rotina trocou ou deixou de fora, em toda execução.
  /** Maior `AnoIndice` dos conjuntos elétricos (0 = arquivo sem a coluna). */
  anoMaisRecenteDosConjuntos: number;
  /** D1: sigla vencida com o CNPJ de uma vigente (RGE SUL → RGE). */
  renomeacoesPorCnpj: { de: string; para: string; cnpj: string; municipios: number }[];
  /** D2: linha do `sucessoes.json` usada, com os municípios que ela trocou. */
  sucessoesAplicadas: { de: string; para: string; municipios: number }[];
  /** D3: vínculo de conjunto que parou de reportar e não chega a tarifa publicada, tirado porque a cidade tem outro. */
  vinculosExtintosDescartados: ContagemPorSigla[];
  /** D3: vínculo de conjunto que parou de reportar e não chega a tarifa publicada, mantido por ser o único (aviso). */
  vinculosExtintosMantidos: ContagemPorSigla[];
  /** D4: vencidas há mais de 6 meses, fora do arquivo. */
  tarifasDescartadasPorVencimento: TarifaVencida[];
  /** D4: vencidas há 6 meses ou menos, publicadas (aviso). */
  tarifasVencidasEmUso: TarifaVencida[];
  /** V7: mais de um valor B1 na vigência escolhida. */
  tarifasComMaisDeUmValor: { sigla: string; cnpj?: string; valores: number }[];
  /** Só informação: vigências que começam no dia seguinte ao fim de uma vencida sem sucessão. Nunca troca sozinha. */
  sucessorasCandidatas: { de: string; fimVigencia: string; candidatas: string[] }[];
  /** Mesmo id antigo levando a dois ids diferentes (quebra o V8). */
  substituicoesEmConflito: string[];
  /**
   * ADR-005: vínculo cuja sigla bate com uma tarifa de outro CNPJ, e que por isso ficou sem tarifa (o V5 acusa).
   * Quase sempre é uma sucessão que falta no sucessoes.json; quem confirma é o dominio-energia.
   */
  ligacoesPelaSiglaRecusadas: { sigla: string; cnpj: string; siglaDaTarifa: string; cnpjDaTarifa: string; municipios: number }[];
}

export interface Montagem {
  tarifas: ArquivoTarifas & { substituidas: Readonly<Record<string, string>> };
  municipiosPorUF: ArquivoMunicipios[];
  relatorio: Relatorio;
}

export interface EntradaDaMontagem {
  tarifas: TarifaVigente[];
  bandeiras: BandeiraMes[];
  vinculos: Map<number, VinculoMunicipio[]>;
  localidades: Localidades;
  geradoEm: string;
  origem: "aneel" | "exemplo";
  fontes: string[];
  /** Data de referência (AAAA-MM-DD, Brasília): decide o que está vigente no D1. */
  hoje: string;
  /** O resto da seleção (D4 e V7). Sem ele, nada vencido entra no relatório nem vira renomeação. */
  analiseDasTarifas?: Pick<SelecaoDeTarifas, "vencidasDescartadas" | "vencidasEmUso" | "comMaisDeUmValor">;
  /** Todas as siglas do CSV de tarifas: dão os ids antigos de cada CNPJ (D2) e as candidatas do relatório. */
  agentesDaTarifa?: readonly AgenteDaTarifa[];
  /** Só as linhas em vigor (`sucessoesEmVigor`). */
  sucessoes?: readonly Sucessao[];
  /** Maior `AnoIndice` dos conjuntos; sem ele o D3 fica desligado. */
  anoMaisRecenteDosConjuntos?: number;
}

/**
 * D3: a ANEEL publica o ano anterior com atraso, então um conjunto só conta como "parou de reportar" quando o
 * último ano dele é anterior a `ano máximo − 1`.
 */
const ANOS_DE_FOLGA_DO_CONJUNTO = 1;
/** Quantas sucessoras candidatas mostrar por empresa vencida no relatório. */
const MAXIMO_DE_CANDIDATAS = 5;

const compacto = (t: string | undefined) => normalizar(t).replace(/[^a-z0-9]/g, "");

/** Como um vínculo chegou à tarifa: direto, por renomeação de mesmo CNPJ (D1) ou por linha de sucessão (D2). */
type Resolucao = { tarifa: TarifaVigente; via: "direta" } | { tarifa: TarifaVigente; via: "renomeacao"; de: string } | { tarifa: TarifaVigente; via: "sucessao"; linha: Sucessao };

/** Junta tarifas, bandeiras, vínculos município→distribuidora e a lista do IBGE nos arquivos finais. */
export function montarArquivos(entrada: EntradaDaMontagem): Montagem {
  const { bandeiras, vinculos, localidades, geradoEm, origem, fontes, hoje } = entrada;
  const vencidasDescartadas = entrada.analiseDasTarifas?.vencidasDescartadas ?? [];
  const sucessoes = entrada.sucessoes ?? [];
  const anoMaximo = entrada.anoMaisRecenteDosConjuntos ?? 0;

  // Siglas que viram o mesmo id (ex.: "CPFL Santa Cruz" e "CPFL SANTA CRUZ"): fica a vigência mais recente.
  const unicas = new Map<string, TarifaVigente>();
  for (const t of entrada.tarifas) {
    const atual = unicas.get(slug(t.sigla));
    if (!atual || t.inicioVigencia > atual.inicioVigencia) unicas.set(slug(t.sigla), t);
  }

  // D1: mesmo CNPJ é a mesma empresa. Fica a vigência mais recente; a sigla mais antiga, se não está vigente,
  // vira renomeação (sai do arquivo e entra em `substituidas`). Duas vigentes com o mesmo CNPJ ficam as duas:
  // a ANEEL tarifa áreas diferentes, e o V2 para a rotina em vez de adivinhar (T2).
  const principalDoCnpj = new Map<string, TarifaVigente>();
  for (const t of unicas.values()) {
    if (!t.cnpj) continue;
    const atual = principalDoCnpj.get(t.cnpj);
    if (!atual || t.inicioVigencia > atual.inicioVigencia) principalDoCnpj.set(t.cnpj, t);
  }
  const renomeadas = new Map<string, { principal: TarifaVigente; cnpj: string }>(); // slug antigo → principal
  for (const t of unicas.values()) {
    const principal = t.cnpj ? principalDoCnpj.get(t.cnpj) : undefined;
    if (!t.cnpj || !principal || principal === t) continue;
    if (t.fimVigencia !== undefined && t.fimVigencia < hoje) renomeadas.set(slug(t.sigla), { principal, cnpj: t.cnpj });
  }
  for (const v of vencidasDescartadas) {
    const principal = v.cnpj ? principalDoCnpj.get(v.cnpj) : undefined;
    if (v.cnpj && principal && slug(v.sigla) !== slug(principal.sigla)) renomeadas.set(slug(v.sigla), { principal, cnpj: v.cnpj });
  }
  const tarifas = [...unicas.values()].filter((t) => !renomeadas.has(slug(t.sigla)));
  const publicados = new Set(tarifas.map((t) => slug(t.sigla)));

  // Índices para achar a tarifa: pelo CNPJ (a vigência mais nova) e pela sigla compacta.
  const porCnpj = new Map<string, TarifaVigente>();
  for (const t of tarifas) {
    const atual = t.cnpj ? porCnpj.get(t.cnpj) : undefined;
    if (t.cnpj && (!atual || t.inicioVigencia > atual.inicioVigencia)) porCnpj.set(t.cnpj, t);
  }
  const porSigla = new Map(tarifas.map((t) => [compacto(t.sigla), t]));
  for (const t of entrada.tarifas) {
    const vencedora = unicas.get(slug(t.sigla));
    if (!porSigla.has(compacto(t.sigla)) && vencedora && publicados.has(slug(vencedora.sigla))) porSigla.set(compacto(t.sigla), vencedora);
  }
  const siglasRenomeadas = new Set<string>();
  for (const t of [...entrada.tarifas, ...vencidasDescartadas]) {
    const r = renomeadas.get(slug(t.sigla));
    if (!r) continue;
    siglasRenomeadas.add(compacto(t.sigla));
    if (!porSigla.has(compacto(t.sigla))) porSigla.set(compacto(t.sigla), r.principal);
  }

  // D2: cadeia de sucessão pelo CNPJ do vínculo; pela sigla compacta só quando o vínculo não tem CNPJ (T2).
  const sucessaoPorCnpj = indexarSucessoes(sucessoes);
  const sucessaoPorSigla = new Map<string, Sucessao>();
  for (const s of sucessoes) sucessaoPorSigla.set(compacto(s.siglaAntiga), s);
  for (const a of entrada.agentesDaTarifa ?? []) {
    const linha = a.cnpj ? sucessaoPorCnpj.get(a.cnpj) : undefined;
    if (linha && !sucessaoPorSigla.has(compacto(a.sigla))) sucessaoPorSigla.set(compacto(a.sigla), linha);
  }
  // ADR-005, item 2: CNPJ diferente só troca por linha do sucessoes.json. A sigla só liga quando um dos lados não tem
  // CNPJ ou os dois têm a mesma raiz (8 primeiros dígitos = mesma pessoa jurídica). No passo 0, a antiga CPFL SANTA
  // CRUZ (61116265000144) caía na CPFL Santa Cruz de hoje (53859112000169) só porque o nome é igual.
  const mesmaEmpresa = (a: string | undefined, b: string | undefined) => !a || !b || a.slice(0, 8) === b.slice(0, 8);
  const pelaSigla = (sigla: string | undefined) => (sigla ? porSigla.get(compacto(sigla)) : undefined);
  const tarifaFinal = (cnpj: string | undefined, sigla: string | undefined): TarifaVigente | undefined => {
    const direta = cnpj ? porCnpj.get(cnpj) : undefined;
    if (direta) return direta;
    const candidata = pelaSigla(sigla);
    return candidata && mesmaEmpresa(cnpj, candidata.cnpj) ? candidata : undefined;
  };

  const resolver = (v: VinculoMunicipio): Resolucao | undefined => {
    // Sem CNPJ, a sigla de uma empresa publicada é ela mesma, e não a antiga de nome igual (CPFL SANTA CRUZ, passo 0).
    const pelaSiglaAntiga = v.agente && !porSigla.has(compacto(v.agente)) ? sucessaoPorSigla.get(compacto(v.agente)) : undefined;
    const primeira = v.cnpj ? sucessaoPorCnpj.get(v.cnpj) : pelaSiglaAntiga;
    if (primeira) {
      const cadeia = seguirCadeia(sucessaoPorCnpj, primeira.cnpjAntigo);
      const tarifa = tarifaFinal(cadeia.cnpj, cadeia.sigla);
      return tarifa ? { tarifa, via: "sucessao", linha: primeira } : undefined;
    }
    const tarifa = tarifaFinal(v.cnpj, v.agente);
    if (!tarifa) return undefined;
    const sigla = compacto(v.agente);
    if (sigla && sigla !== compacto(tarifa.sigla) && siglasRenomeadas.has(sigla)) return { tarifa, via: "renomeacao", de: slug(v.agente ?? "") };
    return { tarifa, via: "direta" };
  };

  // Vínculos podem vir com código IBGE de 7 ou de 6 dígitos.
  const vinculosDe = (ibge: number) => vinculos.get(ibge) ?? vinculos.get(Math.floor(ibge / 10)) ?? [];
  const extinto = (v: VinculoMunicipio) => anoMaximo > 0 && v.ano !== undefined && v.ano > 0 && v.ano < anoMaximo - ANOS_DE_FOLGA_DO_CONJUNTO;

  const agentesSemTarifa = new Set<string>();
  const contar = (mapa: Map<string, Set<number>>, chave: string, ibge: number) => mapa.set(chave, (mapa.get(chave) ?? new Set<number>()).add(ibge));
  const usoDasSucessoes = new Map<string, Set<number>>();
  const usoDasRenomeacoes = new Map<string, Set<number>>();
  const extintosDescartados = new Map<string, Set<number>>();
  const extintosMantidos = new Map<string, Set<number>>();
  const siglaDeOutroCnpj = new Map<string, Set<number>>();
  const linhaDaSucessao = new Map<string, Sucessao>();

  const ufsPorSigla = new Map<string, Set<string>>();
  const municipios: Municipio[] = localidades.municipios.map((m) => {
    const ids = new Set<string>(); // Set: Campina Grande com EPB e EBO fica com a EPB uma vez só
    const lista = vinculosDe(m.ibge).map((v) => ({ v, r: resolver(v) }));
    // D3 só vale para o vínculo que não chega a nenhuma tarifa publicada. Um dono com tarifa publicada (direto, pelo
    // D1 ou pelo D2) é a empresa de hoje: o conjunto antigo dele não diz que ele saiu da cidade. No passo 0 o arquivo
    // de conjuntos parou em 2014, e a regra antiga marcava a EQUATORIAL PI (vigente) como extinta em 222 cidades e
    // tirava 63 vínculos de empresas vigentes (ELETROCAR, RGE, CEMIG-D, COELBA e outras).
    const extintoSemTarifa = (x: (typeof lista)[number]) => x.r === undefined && extinto(x.v);
    const temVinculoQueFica = lista.some((x) => !extintoSemTarifa(x));
    for (const x of lista) {
      const { v, r } = x;
      const sigla = v.agente ?? v.cnpj ?? "?";
      // Regra segura (T2): o vínculo extinto só sai se a cidade tiver outro que fica.
      if (extintoSemTarifa(x)) {
        if (temVinculoQueFica) {
          contar(extintosDescartados, sigla, m.ibge);
          continue;
        }
        contar(extintosMantidos, sigla, m.ibge);
      }
      if (!r) {
        agentesSemTarifa.add(sigla);
        const recusada = pelaSigla(v.agente);
        if (recusada && !mesmaEmpresa(v.cnpj, recusada.cnpj)) contar(siglaDeOutroCnpj, `${sigla}\u0000${v.cnpj ?? ""}\u0000${recusada.sigla}\u0000${recusada.cnpj ?? ""}`, m.ibge);
        continue;
      }
      const id = slug(r.tarifa.sigla);
      if (r.via === "sucessao") {
        const chave = `${r.linha.siglaAntiga}\u0000${r.tarifa.sigla}`;
        linhaDaSucessao.set(chave, r.linha);
        contar(usoDasSucessoes, chave, m.ibge);
      }
      if (r.via === "renomeacao") contar(usoDasRenomeacoes, r.de, m.ibge);
      ids.add(id);
      ufsPorSigla.set(id, (ufsPorSigla.get(id) ?? new Set<string>()).add(m.uf));
    }
    return { ibge: m.ibge, nome: m.nome, uf: m.uf, distribuidoras: [...ids] };
  });

  // Quando a cidade tem mais de uma distribuidora, a que atende mais cidades (a concessionária principal)
  // aparece primeiro; cooperativas locais vêm depois.
  const abrangencia = new Map<string, number>();
  for (const m of municipios) for (const id of m.distribuidoras) abrangencia.set(id, (abrangencia.get(id) ?? 0) + 1);
  for (const m of municipios) m.distribuidoras.sort((a, b) => (abrangencia.get(b) ?? 0) - (abrangencia.get(a) ?? 0) || a.localeCompare(b));

  const distribuidoras: Distribuidora[] = tarifas.map((t) => ({
    id: slug(t.sigla),
    sigla: t.sigla,
    cnpj: t.cnpj,
    ufs: [...(ufsPorSigla.get(slug(t.sigla)) ?? [])].sort(),
    teKwh: arredondar(t.teKwh),
    tusdKwh: arredondar(t.tusdKwh),
    tarifaKwh: arredondar(t.teKwh + t.tusdKwh),
    inicioVigencia: t.inicioVigencia,
    fimVigencia: t.fimVigencia,
    resolucao: t.resolucao,
  }));

  const { substituidas, conflitos } = montarSubstituidas({ renomeadas, sucessoes, sucessaoPorCnpj, tarifaFinal, publicados, agentes: entrada.agentesDaTarifa ?? [], vencidasDescartadas });

  const estados: Estado[] = localidades.estados.map((e) => ({
    uf: e.uf,
    nome: e.nome,
    distribuidoras: distribuidoras.filter((d) => d.ufs.includes(e.uf)).map((d) => d.id).sort(),
  }));

  const municipiosPorUF: ArquivoMunicipios[] = localidades.estados.map((e) => ({
    uf: e.uf,
    geradoEm,
    origem,
    municipios: municipios.filter((m) => m.uf === e.uf).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
  }));

  const porQuantidade = (mapa: Map<string, Set<number>>): ContagemPorSigla[] =>
    [...mapa].map(([sigla, ibges]) => ({ sigla, municipios: ibges.size })).sort((a, b) => b.municipios - a.municipios || a.sigla.localeCompare(b.sigla));

  return {
    tarifas: { geradoEm, origem, fontes, distribuidoras, bandeiras, estados, substituidas },
    municipiosPorUF,
    relatorio: {
      distribuidoras: distribuidoras.length,
      distribuidorasSemMunicipio: distribuidoras.filter((d) => d.ufs.length === 0).map((d) => d.sigla),
      agentesSemTarifa: [...agentesSemTarifa].sort(),
      municipios: municipios.length,
      municipiosSemDistribuidora: municipios.filter((m) => m.distribuidoras.length === 0).length,
      municipiosComVariasDistribuidoras: municipios.filter((m) => m.distribuidoras.length > 1).length,
      anoMaisRecenteDosConjuntos: anoMaximo,
      renomeacoesPorCnpj: [...renomeadas]
        .map(([de, { principal, cnpj }]) => ({ de, para: slug(principal.sigla), cnpj, municipios: usoDasRenomeacoes.get(de)?.size ?? 0 }))
        .sort((a, b) => a.de.localeCompare(b.de)),
      sucessoesAplicadas: [...usoDasSucessoes]
        .map(([chave, ibges]) => {
          const [de = "", para = ""] = chave.split("\u0000");
          return { de, para, municipios: ibges.size };
        })
        .sort((a, b) => b.municipios - a.municipios || a.de.localeCompare(b.de)),
      vinculosExtintosDescartados: porQuantidade(extintosDescartados),
      vinculosExtintosMantidos: porQuantidade(extintosMantidos),
      tarifasDescartadasPorVencimento: vencidasDescartadas,
      tarifasVencidasEmUso: entrada.analiseDasTarifas?.vencidasEmUso ?? [],
      tarifasComMaisDeUmValor: entrada.analiseDasTarifas?.comMaisDeUmValor ?? [],
      sucessorasCandidatas: acharCandidatas(vencidasDescartadas, entrada.agentesDaTarifa ?? [], sucessaoPorCnpj, renomeadas),
      substituicoesEmConflito: conflitos,
      ligacoesPelaSiglaRecusadas: [...siglaDeOutroCnpj]
        .map(([chave, ibges]) => {
          const [sigla = "", cnpj = "", siglaDaTarifa = "", cnpjDaTarifa = ""] = chave.split("\u0000");
          return { sigla, cnpj, siglaDaTarifa, cnpjDaTarifa, municipios: ibges.size };
        })
        .sort((a, b) => b.municipios - a.municipios || a.sigla.localeCompare(b.sigla)),
    },
  };
}

/**
 * `substituidas` (T1): id antigo → id final, das renomeações (D1) e das sucessões (D2), mesmo que nenhuma cidade
 * use mais o id antigo: uma casa salva no aparelho ainda pode ter ele. Nenhuma chave é id publicado; chaves em ordem,
 * para a assinatura do arquivo ficar estável.
 */
function montarSubstituidas(p: {
  renomeadas: ReadonlyMap<string, { principal: TarifaVigente }>;
  sucessoes: readonly Sucessao[];
  sucessaoPorCnpj: ReadonlyMap<string, Sucessao>;
  tarifaFinal: (cnpj: string | undefined, sigla: string | undefined) => TarifaVigente | undefined;
  publicados: ReadonlySet<string>;
  agentes: readonly AgenteDaTarifa[];
  vencidasDescartadas: readonly TarifaVencida[];
}): { substituidas: Readonly<Record<string, string>>; conflitos: string[] } {
  const mapa = new Map<string, string>();
  const conflitos: string[] = [];
  const registrar = (de: string, para: string) => {
    if (!de || de === para || p.publicados.has(de)) return;
    const atual = mapa.get(de);
    if (atual !== undefined && atual !== para) conflitos.push(`${de} → ${atual} e ${para}`);
    else mapa.set(de, para);
  };
  for (const [de, { principal }] of p.renomeadas) registrar(de, slug(principal.sigla));
  for (const s of p.sucessoes) {
    const cadeia = seguirCadeia(p.sucessaoPorCnpj, s.cnpjAntigo);
    const final = p.tarifaFinal(cadeia.cnpj, cadeia.sigla);
    if (!final) continue; // o V4 acusa
    const idsAntigos = new Set([slug(s.siglaAntiga)]);
    for (const a of [...p.agentes, ...p.vencidasDescartadas]) if (a.cnpj === s.cnpjAntigo) idsAntigos.add(slug(a.sigla));
    for (const de of idsAntigos) registrar(de, slug(final.sigla));
  }
  return { substituidas: Object.fromEntries([...mapa].sort(([a], [b]) => a.localeCompare(b))), conflitos };
}

/** Vigência que começa no dia seguinte ao fim de uma vencida sem sucessão: só ajuda quem revisa (D2). */
function acharCandidatas(
  vencidas: readonly TarifaVencida[],
  agentes: readonly AgenteDaTarifa[],
  sucessaoPorCnpj: ReadonlyMap<string, Sucessao>,
  renomeadas: ReadonlyMap<string, unknown>,
): Relatorio["sucessorasCandidatas"] {
  return vencidas
    .filter((v) => !(v.cnpj && sucessaoPorCnpj.has(v.cnpj)) && !renomeadas.has(slug(v.sigla)))
    .map((v) => {
      const dia = diaSeguinte(v.fimVigencia);
      const candidatas = agentes.filter((a) => a.vigente && a.cnpj !== v.cnpj && a.inicios.includes(dia)).map((a) => a.sigla);
      return { de: v.sigla, fimVigencia: v.fimVigencia, candidatas: candidatas.slice(0, MAXIMO_DE_CANDIDATAS) };
    })
    .filter((c) => c.candidatas.length > 0);
}

/** V8 (T1): formato do id nas chaves e valores de `substituidas`, o mesmo do `slug`. */
const FORMATO_DO_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const TAMANHO_MAXIMO_DO_ID = 64;
/** V8 e R7: o leitor do site (HIS-003a) recusa mais que isso; a rotina não pode publicar um arquivo que ele recusa. */
export const MAXIMO_DE_SUBSTITUIDAS = 500;

export interface ContextoDaCoerencia extends DadosDaAneelParaSucessoes {
  hoje: string;
  /** Só as linhas em vigor, as mesmas que entraram na montagem. */
  sucessoes: readonly Sucessao[];
}

/**
 * Barreira de número errado e de contrato (HIS-111, D5 e R3; ADR-005, item 5). **Não passa com `--forcar`**, como o
 * `conferirFormato` do ADR-004: quebrar qualquer regra quer dizer conta errada na tela ou arquivo que o site recusa.
 * - V1: nenhuma distribuidora publicada vencida há mais de 6 meses;
 * - V2: nenhum CNPJ em duas distribuidoras publicadas (a ANEEL tarifa áreas diferentes: não adivinhamos);
 * - V3: nenhum município lista um id que é chave de `substituidas`;
 * - V4: a sucessora final de cada linha do `sucessoes.json` está publicada (e, pelo V1, dentro dos 6 meses);
 * - V7: a sucessora tem um só valor B1 na vigência;
 * - V8: `substituidas` com ids válidos, valores publicados, chaves não publicadas, sem cadeia, até 500 entradas;
 * - V9 e V10: a linha de sucessão bate com a ANEEL (empresa antiga sem tarifa vigente; siglas do CNPJ).
 */
export function conferirCoerencia(m: Montagem, contexto: ContextoDaCoerencia): string[] {
  const erros: string[] = [];
  const publicadas = m.tarifas.distribuidoras;
  const ids = new Set(publicadas.map((d) => d.id));

  const limite = subtrairMeses(contexto.hoje, MESES_DE_TOLERANCIA_DA_TARIFA_VENCIDA);
  for (const d of publicadas) {
    if (d.fimVigencia !== undefined && d.fimVigencia < limite) erros.push(`V1: ${d.sigla} está publicada com tarifa vencida em ${d.fimVigencia} (limite ${limite}).`);
  }

  const siglasDoCnpj = new Map<string, string[]>();
  for (const d of publicadas) if (d.cnpj) siglasDoCnpj.set(d.cnpj, [...(siglasDoCnpj.get(d.cnpj) ?? []), d.sigla]);
  for (const [cnpj, siglas] of siglasDoCnpj) {
    if (siglas.length > 1) erros.push(`V2: o CNPJ ${cnpj} aparece em ${siglas.length} distribuidoras publicadas (${siglas.join(", ")}). Áreas com preços diferentes: separar antes de publicar.`);
  }

  const substituidas = m.tarifas.substituidas;
  const ehSubstituida = (id: string) => Object.hasOwn(substituidas, id);
  const municipiosComAntigo = m.municipiosPorUF.flatMap((a) => a.municipios).filter((x) => x.distribuidoras.some(ehSubstituida));
  if (municipiosComAntigo.length > 0) {
    const exemplos = municipiosComAntigo.slice(0, 5).map((x) => `${x.nome} (${x.uf})`);
    erros.push(`V3: ${municipiosComAntigo.length} municípios listam um id substituído (ex.: ${exemplos.join(", ")}).`);
  }

  const indice = indexarSucessoes(contexto.sucessoes);
  const porCnpj = new Map(publicadas.filter((d) => d.cnpj).map((d) => [d.cnpj, d]));
  for (const s of contexto.sucessoes) {
    const cadeia = seguirCadeia(indice, s.cnpjAntigo);
    const final = porCnpj.get(cadeia.cnpj);
    if (!final) {
      erros.push(`V4: sucessoes[${s.indice}] (${s.siglaAntiga}): a sucessora final (${cadeia.sigla ?? "?"}, ${cadeia.cnpj}) não está no tarifas.json.`);
      continue;
    }
    const varios = m.relatorio.tarifasComMaisDeUmValor.find((v) => (v.cnpj !== undefined && v.cnpj === final.cnpj) || slug(v.sigla) === final.id);
    if (varios) {
      erros.push(
        `V7: ${final.sigla} (sucessora de ${s.siglaAntiga}, sucessoes[${s.indice}]) tem ${varios.valores} valores B1 diferentes na vigência. ` +
          "As cidades da área antiga não recebem tarifa até separarmos as áreas: tirar a linha e falar com o dominio-energia.",
      );
    }
  }

  erros.push(...conferirSubstituidas(substituidas, ids, m.relatorio.substituicoesEmConflito));
  erros.push(...conferirSucessoesNaAneel(contexto.sucessoes, contexto).erros);
  return erros;
}

/** V8: as regras olham o objeto inteiro, não o que sobra depois de cada descarte (R7). */
export function conferirSubstituidas(substituidas: Readonly<Record<string, string>>, idsPublicados: ReadonlySet<string>, conflitos: readonly string[] = []): string[] {
  const erros: string[] = [];
  const entradas = Object.entries(substituidas);
  if (entradas.length > MAXIMO_DE_SUBSTITUIDAS) erros.push(`V8: substituidas tem ${entradas.length} entradas (o máximo é ${MAXIMO_DE_SUBSTITUIDAS}).`);
  const idValido = (id: string) => id.length <= TAMANHO_MAXIMO_DO_ID && FORMATO_DO_ID.test(id);
  for (const [de, para] of entradas) {
    if (!idValido(de) || !idValido(para)) erros.push(`V8: "${de}" → "${para}" não tem o formato de id.`);
    else if (!idsPublicados.has(para)) erros.push(`V8: "${de}" → "${para}", mas "${para}" não está publicada.`);
    else if (idsPublicados.has(de)) erros.push(`V8: "${de}" é chave de substituidas e também está publicada.`);
    else if (Object.hasOwn(substituidas, para)) erros.push(`V8: "${de}" → "${para}", e "${para}" também é substituída (o valor precisa ser o id final).`);
  }
  for (const c of conflitos) erros.push(`V8: o mesmo id antigo leva a duas distribuidoras: ${c}.`);
  return erros;
}

/** Na HIS-111 (V6): hoje são 10 cidades sem distribuidora; 30 pega uma perda grande antes do limite de 5% (278). */
const MAXIMO_DE_MUNICIPIOS_SEM_DISTRIBUIDORA = 30;

/**
 * Confere se os dados fazem sentido antes de publicar — evita trocar dados bons por dados quebrados.
 * Estas regras são de cobertura e passam com `--forcar`: uma pessoa pode decidir publicar sabendo que algumas cidades
 * vão pedir a conta de luz. As de número errado ficam em `conferirCoerencia`.
 */
export function validar(m: Montagem, hoje: string): string[] {
  const erros: string[] = [];
  const r = m.relatorio;
  if (r.distribuidoras < 40) erros.push(`Poucas distribuidoras com tarifa (${r.distribuidoras}); o esperado é mais de 50.`);
  if (r.municipios < 5000) erros.push(`Poucos municípios (${r.municipios}).`);
  if (r.municipiosSemDistribuidora > r.municipios * 0.05) erros.push(`${r.municipiosSemDistribuidora} municípios ficaram sem distribuidora (mais de 5%).`);
  const ufsSemDistribuidora = m.tarifas.estados.filter((e) => e.distribuidoras.length === 0).map((e) => e.uf);
  if (ufsSemDistribuidora.length > 0) erros.push(`Estados sem distribuidora: ${ufsSemDistribuidora.join(", ")}.`);
  const fora = m.tarifas.distribuidoras.filter((d) => d.tarifaKwh < 0.3 || d.tarifaKwh > 2);
  if (fora.length > 0) erros.push(`Tarifas fora da faixa R$ 0,30–2,00/kWh: ${fora.map((d) => `${d.sigla}=${d.tarifaKwh}`).join(", ")}.`);
  const ultima = m.tarifas.bandeiras.at(-1)?.competencia;
  const limite = mesesAntes(hoje.slice(0, 7), 3);
  if (!ultima || ultima < limite) erros.push(`Bandeira mais recente (${ultima ?? "nenhuma"}) é anterior a ${limite}.`);
  // HIS-111, V5: empresa nova sem tarifa quer dizer uma sucessão que ainda não está no sucessoes.json.
  if (r.agentesSemTarifa.length > 0) {
    erros.push(`V5: ${r.agentesSemTarifa.length} agentes dos conjuntos sem tarifa publicada (${r.agentesSemTarifa.slice(0, 10).join(", ")}). Sucessão nova sem linha no sucessoes.json?`);
  }
  if (r.municipiosSemDistribuidora > MAXIMO_DE_MUNICIPIOS_SEM_DISTRIBUIDORA) {
    erros.push(`V6: ${r.municipiosSemDistribuidora} municípios sem distribuidora (o máximo é ${MAXIMO_DE_MUNICIPIOS_SEM_DISTRIBUIDORA}).`);
  }
  return erros;
}

function mesesAntes(competencia: string, meses: number): string {
  const [a, m] = competencia.split("-").map(Number) as [number, number];
  const d = new Date(Date.UTC(a, m - 1 - meses, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function arredondar(n: number): number {
  return Number(n.toFixed(6));
}
