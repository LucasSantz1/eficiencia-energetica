import { ehUf, type Uf } from "./estados";
import { ehCompetencia, ehData, ehObjeto, listaCompleta, numeroNaFaixa, propriedade, temPropriedade, textoLimitado, umaDas } from "./leitura-segura";
import { LIMITES, LIMITES_DE_TEXTO } from "./limites";
import type { ArquivoMunicipios, ArquivoTarifas, Bandeira, BandeiraMes, Distribuidora, Estado, Municipio } from "./tipos";

/**
 * Leitores dos arquivos públicos de /dados (`tarifas.json`, `municipios/{UF}.json`, `relatorio.json`), os mesmos no
 * navegador, no servidor do site e na rotina de dados (ADR-004). Cada lugar decide o que fazer com o resultado:
 * - estrutura errada (não é objeto, falta a lista, `origem` desconhecida, `uf` diferente da pedida) lança `ErroDeFormato`;
 * - entrada inválida (tarifa fora da faixa, município sem IBGE) sai e conta em `descartados`. Nada é corrigido: a
 *   pessoa daquela cidade vê "não encontramos", nunca um número inventado.
 * As faixas são as da P-tl-2 (dominio-energia, 2026-10-30), em `limites.ts`.
 */
export class ErroDeFormato extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroDeFormato";
  }
}

/** Limites técnicos dos arquivos públicos (não são regra do setor): só impedem texto e lista gigantes. */
const LIMITES_DOS_ARQUIVOS = {
  geradoEm: 40,
  fonte: 300,
  sigla: 60,
  resolucao: 200,
  nomeDaBandeira: 60,
  nomeDoEstado: 40,
  fontes: 20,
  distribuidoras: 500,
  bandeiras: 1_000,
  /** O maior estado (MG) tem 853 municípios. */
  municipios: 2_000,
  distribuidorasPorLugar: 50,
  /** O mesmo teto da rotina (`MAXIMO_DE_SUBSTITUIDAS` em `packages/dados/src/montar.ts`), que nunca publica mais. */
  substituidas: 500,
} as const;

/** Mesmo formato do `slug` da rotina (`packages/dados`): minúsculas, números e hífen. */
const FORMATO_DO_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
/** TE + TUSD tem que dar a tarifa: a rotina arredonda cada valor para 6 casas, então a diferença fica abaixo disto (P-tl-2). */
const TOLERANCIA_DA_SOMA_DA_TARIFA = 0.000_01;
const ORIGENS = listaCompleta<ArquivoTarifas["origem"]>()(["aneel", "exemplo"]);
const TIPOS_DE_BANDEIRA = listaCompleta<Bandeira>()(["verde", "amarela", "vermelha-1", "vermelha-2", "escassez-hidrica"]);

/** Campos que cada leitor lê (R4c): o `typecheck` reprova campo novo no tipo que não esteja aqui. */
// `/* @__PURE__ */`: as listas só servem ao `typecheck` e aos testes (R4c); marcadas assim, saem do JS do site (D10, 1b).
export const CAMPOS_DOS_ARQUIVOS_PUBLICOS = {
  tarifas: /* @__PURE__ */ listaCompleta<keyof ArquivoTarifas>()(["geradoEm", "origem", "fontes", "distribuidoras", "bandeiras", "estados", "substituidas"]),
  distribuidora: /* @__PURE__ */ listaCompleta<keyof Distribuidora>()(["id", "sigla", "cnpj", "ufs", "teKwh", "tusdKwh", "tarifaKwh", "inicioVigencia", "fimVigencia", "resolucao"]),
  bandeira: /* @__PURE__ */ listaCompleta<keyof BandeiraMes>()(["competencia", "bandeira", "nome", "adicionalKwh"]),
  estado: /* @__PURE__ */ listaCompleta<keyof Estado>()(["uf", "nome", "distribuidoras"]),
  municipios: /* @__PURE__ */ listaCompleta<keyof ArquivoMunicipios>()(["uf", "geradoEm", "origem", "municipios"]),
  municipio: /* @__PURE__ */ listaCompleta<keyof Municipio>()(["ibge", "nome", "uf", "distribuidoras"]),
} as const;

const INVALIDO = Symbol("invalido");

function opcional<T>(objeto: Record<string, unknown>, chave: string, ler: (valor: unknown) => T | undefined): T | undefined | typeof INVALIDO {
  if (!temPropriedade(objeto, chave)) return undefined;
  const lido = ler(propriedade(objeto, chave));
  return lido === undefined ? INVALIDO : lido;
}

function lerIdDeDistribuidora(valor: unknown): string | undefined {
  const texto = textoLimitado(valor, LIMITES_DE_TEXTO.id);
  return texto !== undefined && FORMATO_DO_ID.test(texto) ? texto : undefined;
}

/** Lista curta dentro de uma entrada (UFs, ids): um item que não passa invalida a lista e, com ela, a entrada. */
function listaDe<T>(valor: unknown, maximo: number, ler: (item: unknown) => T | undefined): T[] | undefined {
  if (!Array.isArray(valor) || valor.length > maximo) return undefined;
  const lidos: T[] = [];
  for (const item of valor) {
    const lido = ler(item);
    if (lido === undefined) return undefined;
    lidos.push(lido);
  }
  return lidos;
}

/** Lista obrigatória do arquivo: se falta ou não é lista, o arquivo inteiro falha. Entrada inválida ou repetida sai e conta. */
function lerEntradas<T>(arquivo: Record<string, unknown>, chave: string, maximo: number, ler: (item: unknown) => T | undefined, chaveUnica: (item: T) => string, nomeDoArquivo: string) {
  const bruto = propriedade(arquivo, chave);
  if (!Array.isArray(bruto)) throw new ErroDeFormato(`${nomeDoArquivo}: falta a lista "${chave}".`);
  const itens: T[] = [];
  const vistas = new Set<string>();
  let descartados = 0;
  for (let i = 0; i < bruto.length; i++) {
    if (itens.length >= maximo) {
      descartados += bruto.length - i;
      break;
    }
    const item: unknown = bruto[i];
    const lido = ler(item);
    if (lido === undefined || vistas.has(chaveUnica(lido))) {
      descartados++;
      continue;
    }
    vistas.add(chaveUnica(lido));
    itens.push(lido);
  }
  return { itens, descartados };
}

function lerCabecalho(arquivo: unknown, nomeDoArquivo: string): { arquivo: Record<string, unknown>; geradoEm: string; origem: ArquivoTarifas["origem"] } {
  if (!ehObjeto(arquivo)) throw new ErroDeFormato(`${nomeDoArquivo}: não é um objeto.`);
  const geradoEm = textoLimitado(propriedade(arquivo, "geradoEm"), LIMITES_DOS_ARQUIVOS.geradoEm);
  if (geradoEm === undefined) throw new ErroDeFormato(`${nomeDoArquivo}: "geradoEm" inválido.`);
  const origem = umaDas(propriedade(arquivo, "origem"), ORIGENS);
  if (origem === undefined) throw new ErroDeFormato(`${nomeDoArquivo}: "origem" desconhecida.`);
  return { arquivo, geradoEm, origem };
}

function lerDistribuidora(bruto: unknown): Distribuidora | undefined {
  if (!ehObjeto(bruto)) return undefined;
  const id = lerIdDeDistribuidora(propriedade(bruto, "id"));
  const sigla = textoLimitado(propriedade(bruto, "sigla"), LIMITES_DOS_ARQUIVOS.sigla);
  const cnpj = opcional(bruto, "cnpj", (v) => (typeof v === "string" && v.length === 14 && /^\d{14}$/.test(v) ? v : undefined));
  const ufs = listaDe(propriedade(bruto, "ufs"), 27, (v) => (ehUf(v) ? v : undefined));
  const teKwh = numeroNaFaixa(propriedade(bruto, "teKwh"), LIMITES.componenteDaTarifaKwh);
  const tusdKwh = numeroNaFaixa(propriedade(bruto, "tusdKwh"), LIMITES.componenteDaTarifaKwh);
  const tarifaKwh = numeroNaFaixa(propriedade(bruto, "tarifaKwh"), LIMITES.tarifaKwh);
  const inicioVigencia = propriedade(bruto, "inicioVigencia");
  const fimVigencia = opcional(bruto, "fimVigencia", (v) => (ehData(v) ? v : undefined));
  const resolucao = opcional(bruto, "resolucao", (v) => textoLimitado(v, LIMITES_DOS_ARQUIVOS.resolucao));

  if (id === undefined || sigla === undefined || ufs === undefined || !ehData(inicioVigencia)) return undefined;
  if (teKwh === undefined || tusdKwh === undefined || tarifaKwh === undefined) return undefined;
  if (cnpj === INVALIDO || fimVigencia === INVALIDO || resolucao === INVALIDO) return undefined;
  // Coerência (P-tl-2): pega a tarifa alterada à mão ou por extensão, que a faixa sozinha deixa passar.
  if (Math.abs(teKwh + tusdKwh - tarifaKwh) > TOLERANCIA_DA_SOMA_DA_TARIFA) return undefined;

  return {
    id,
    sigla,
    ...(cnpj === undefined ? {} : { cnpj }),
    ufs,
    teKwh,
    tusdKwh,
    tarifaKwh,
    inicioVigencia,
    ...(fimVigencia === undefined ? {} : { fimVigencia }),
    ...(resolucao === undefined ? {} : { resolucao }),
  };
}

function lerBandeiraMes(bruto: unknown): BandeiraMes | undefined {
  if (!ehObjeto(bruto)) return undefined;
  const competencia = propriedade(bruto, "competencia");
  const bandeira = umaDas(propriedade(bruto, "bandeira"), TIPOS_DE_BANDEIRA);
  const nome = textoLimitado(propriedade(bruto, "nome"), LIMITES_DOS_ARQUIVOS.nomeDaBandeira);
  const adicionalKwh = numeroNaFaixa(propriedade(bruto, "adicionalKwh"), LIMITES.adicionalDaBandeiraKwh);
  if (!ehCompetencia(competencia) || bandeira === undefined || nome === undefined || adicionalKwh === undefined) return undefined;
  // Coerência (P-tl-2): a verde não tem acréscimo; toda outra tem.
  if (bandeira === "verde" ? adicionalKwh !== 0 : adicionalKwh <= 0) return undefined;
  return { competencia, bandeira, nome, adicionalKwh };
}

function lerEstado(bruto: unknown): Estado | undefined {
  if (!ehObjeto(bruto)) return undefined;
  const uf = propriedade(bruto, "uf");
  const nome = textoLimitado(propriedade(bruto, "nome"), LIMITES_DOS_ARQUIVOS.nomeDoEstado);
  const distribuidoras = listaDe(propriedade(bruto, "distribuidoras"), LIMITES_DOS_ARQUIVOS.distribuidorasPorLugar, lerIdDeDistribuidora);
  if (!ehUf(uf) || nome === undefined || distribuidoras === undefined) return undefined;
  return { uf, nome, distribuidoras };
}

function lerMunicipio(bruto: unknown, ufPedida: Uf): Municipio | undefined {
  if (!ehObjeto(bruto)) return undefined;
  const ibge = numeroNaFaixa(propriedade(bruto, "ibge"), LIMITES.municipioIbge);
  const nome = textoLimitado(propriedade(bruto, "nome"), LIMITES_DE_TEXTO.nomeMunicipio);
  const uf = propriedade(bruto, "uf");
  const distribuidoras = listaDe(propriedade(bruto, "distribuidoras"), LIMITES_DOS_ARQUIVOS.distribuidorasPorLugar, lerIdDeDistribuidora);
  if (ibge === undefined || nome === undefined || uf !== ufPedida || distribuidoras === undefined) return undefined;
  return { ibge, nome, uf: ufPedida, distribuidoras };
}

/**
 * `substituidas` (id que saiu → id que ficou; HIS-111, P8 e V8). Ausente vira `{}`, sem descarte (arquivo antigo no
 * cache). Presente e não objeto simples, ou com mais de 500 entradas: `ErroDeFormato`. Cada entrada que quebra o V8 sai
 * e conta: chave e valor no formato de id; o valor é um id publicado; a chave não é id publicado; nenhum valor é chave.
 * As regras olham o objeto original inteiro, não o que sobrou depois de cada descarte, e o resultado é montado com
 * `Object.fromEntries` só no fim (R7 da seguranca na HIS-111): a ordem das entradas não muda o que fica.
 */
function lerSubstituidas(arquivo: Record<string, unknown>, publicados: ReadonlySet<string>, nomeDoArquivo: string): { substituidas: Record<string, string>; descartados: number } {
  if (!temPropriedade(arquivo, "substituidas")) return { substituidas: {}, descartados: 0 };
  const bruto = propriedade(arquivo, "substituidas");
  if (!ehObjeto(bruto)) throw new ErroDeFormato(`${nomeDoArquivo}: "substituidas" não é um objeto.`);
  const chaves = Object.keys(bruto);
  if (chaves.length > LIMITES_DOS_ARQUIVOS.substituidas) throw new ErroDeFormato(`${nomeDoArquivo}: "substituidas" tem entradas demais.`);
  const todasAsChaves = new Set(chaves);
  const ficam: [string, string][] = [];
  for (const chave of chaves) {
    const de = lerIdDeDistribuidora(chave);
    const para = lerIdDeDistribuidora(propriedade(bruto, chave));
    if (de !== undefined && para !== undefined && publicados.has(para) && !publicados.has(de) && !todasAsChaves.has(para)) ficam.push([de, para]);
  }
  return { substituidas: Object.fromEntries(ficam), descartados: chaves.length - ficam.length };
}

/** `tarifas.json`. Lança `ErroDeFormato` se a estrutura estiver errada; entrada inválida sai e conta em `descartados`. */
export function lerArquivoTarifas(bruto: unknown): { arquivo: ArquivoTarifas; descartados: number } {
  const nome = "tarifas.json";
  const { arquivo, geradoEm, origem } = lerCabecalho(bruto, nome);
  const fontes = lerEntradas(arquivo, "fontes", LIMITES_DOS_ARQUIVOS.fontes, (v) => textoLimitado(v, LIMITES_DOS_ARQUIVOS.fonte), (f) => f, nome);
  const distribuidoras = lerEntradas(arquivo, "distribuidoras", LIMITES_DOS_ARQUIVOS.distribuidoras, lerDistribuidora, (d) => d.id, nome);
  const bandeiras = lerEntradas(arquivo, "bandeiras", LIMITES_DOS_ARQUIVOS.bandeiras, lerBandeiraMes, (b) => b.competencia, nome);
  const estados = lerEntradas(arquivo, "estados", 27, lerEstado, (e) => e.uf, nome);
  // "Publicado" é o que ficou depois do leitor: um valor que aponta para uma distribuidora descartada também sai.
  const substituidas = lerSubstituidas(arquivo, new Set(distribuidoras.itens.map((d) => d.id)), nome);
  return {
    arquivo: {
      geradoEm,
      origem,
      fontes: fontes.itens,
      distribuidoras: distribuidoras.itens,
      bandeiras: bandeiras.itens,
      estados: estados.itens,
      substituidas: substituidas.substituidas,
    },
    descartados: fontes.descartados + distribuidoras.descartados + bandeiras.descartados + estados.descartados + substituidas.descartados,
  };
}

/** `municipios/{UF}.json`. O `uf` do arquivo precisa ser o pedido (senão lança); município de outra UF sai. */
export function lerArquivoMunicipios(bruto: unknown, uf: Uf): { arquivo: ArquivoMunicipios; descartados: number } {
  const nome = `municipios/${uf}.json`;
  const { arquivo, geradoEm, origem } = lerCabecalho(bruto, nome);
  if (propriedade(arquivo, "uf") !== uf) throw new ErroDeFormato(`${nome}: "uf" diferente da pedida.`);
  const municipios = lerEntradas(arquivo, "municipios", LIMITES_DOS_ARQUIVOS.municipios, (m) => lerMunicipio(m, uf), (m) => String(m.ibge), nome);
  return { arquivo: { uf, geradoEm, origem, municipios: municipios.itens }, descartados: municipios.descartados };
}

/** `relatorio.json`: só os dois números que a página inicial mostra. O resto do relatório é da rotina e fica de fora. */
export function lerRelatorioDosDados(bruto: unknown): { municipios: number; municipiosSemDistribuidora: number } {
  if (!ehObjeto(bruto)) throw new ErroDeFormato("relatorio.json: não é um objeto.");
  // O Brasil tem 5.571 municípios (IBGE); 10.000 é folga técnica.
  const contagem = { min: 0, max: 10_000, inteiro: true };
  const municipios = numeroNaFaixa(propriedade(bruto, "municipios"), contagem);
  const municipiosSemDistribuidora = numeroNaFaixa(propriedade(bruto, "municipiosSemDistribuidora"), contagem);
  if (municipios === undefined || municipiosSemDistribuidora === undefined || municipiosSemDistribuidora > municipios) {
    throw new ErroDeFormato("relatorio.json: contagem de municípios inválida.");
  }
  return { municipios, municipiosSemDistribuidora };
}
