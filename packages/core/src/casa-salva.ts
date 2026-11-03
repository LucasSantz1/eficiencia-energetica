import { ehUf } from "./estados";
import { ehCompetencia, ehData, ehObjeto, listaCompleta, numeroNaFaixa, propriedade, temPropriedade, textoLimitado, umaDas } from "./leitura-segura";
import { LIMITES, LIMITES_DE_LISTA, LIMITES_DE_TEXTO, type Faixa } from "./limites";
import type { Aparelho, Beneficio, Comodo, ContaMensal, ContaReferencia, DadosCasa, LeituraRelogio, Ligacao, Residencia, TipoComodo } from "./tipos";

/**
 * Leitor da casa salva no aparelho (chave `eficiencia-energetica:casa`), conforme o ADR-004 e as "Regras de validação"
 * da HIS-003. Dado corrompido (bug, versão antiga, extensão do navegador) não pode travar o site nem entrar na conta:
 * - o que é inválido sai **um a um** e é contado; o resto fica;
 * - nada é corrigido, salvo os dois consertos do dominio-energia, que não inventam número;
 * - o objeto devolvido é novo, montado campo a campo; o bruto nunca é espalhado;
 * - com valor vindo de `JSON.parse`, nunca lança (um `merge` que lança prende a hidratação, a falha P1).
 */

/** Quantos itens de cada tipo saíram. Só números: nenhum nome, valor ou id do que saiu. */
export interface ContagemDeDescartes {
  aparelhos: number;
  comodos: number;
  contas: number;
  leituras: number;
  plano: number;
}

export interface CasaLida {
  casa: DadosCasa;
  descartados: ContagemDeDescartes;
  /** A cidade saiu (UF, município ou distribuidora inválidos); cômodos e aparelhos ficam (T1b). */
  residenciaDescartada: boolean;
  /** Nada dava para ler: JSON quebrado ou raiz que não é objeto (T1c). */
  ilegivel: boolean;
}

/** Aviso para a pessoa (T1). Ordem de prioridade: nada aproveitável > sem cidade > saiu uma parte. */
export type AvisoDaCasaSalva = { tipo: "nada-aproveitavel" } | { tipo: "sem-residencia" } | { tipo: "parte"; descartados: ContagemDeDescartes };

const TIPOS_DE_COMODO = listaCompleta<TipoComodo>()(["cozinha", "sala", "quarto", "banheiro", "lavanderia", "escritorio", "area-externa", "outro"]);
const BENEFICIOS = listaCompleta<Beneficio>()(["nenhum", "tarifa-social", "desconto-social", "nao-sei"]);
const LIGACOES = listaCompleta<Ligacao>()(["monofasica", "bifasica", "trifasica", "nao-sei"]);

/**
 * Campos que cada leitor lê (R4c). O `typecheck` reprova se o tipo ganhar um campo que não está aqui, e o teste
 * `casa-salva.test.ts` reprova se o leitor não devolver todos eles. Assim um campo novo nunca some em silêncio.
 */
// `/* @__PURE__ */`: as listas só servem ao `typecheck` e aos testes (R4c); marcadas assim, saem do JS do site (D10, 1b).
export const CAMPOS_DA_CASA_SALVA = {
  casa: /* @__PURE__ */ listaCompleta<keyof DadosCasa>()(["residencia", "comodos", "aparelhos", "contas", "leituras", "plano"]),
  residencia: /* @__PURE__ */ listaCompleta<keyof Residencia>()(["uf", "municipioIbge", "municipioNome", "distribuidoraId", "beneficio", "ligacao", "contaReferencia", "pessoas"]),
  contaReferencia: /* @__PURE__ */ listaCompleta<keyof ContaReferencia>()(["kwh", "valor"]),
  comodo: /* @__PURE__ */ listaCompleta<keyof Comodo>()(["id", "tipo", "nome"]),
  aparelho: /* @__PURE__ */ listaCompleta<keyof Aparelho>()([
    "id",
    "comodoId",
    "catalogoId",
    "nome",
    "quantidade",
    "potenciaW",
    "minutosPorDia",
    "diasPorSemana",
    "banho",
    "fatorCiclo",
    "variantes",
    "kwhMesInformado",
  ]),
  banho: /* @__PURE__ */ listaCompleta<keyof NonNullable<Aparelho["banho"]>>()(["banhosPorDia", "minutosPorBanho"]),
  conta: /* @__PURE__ */ listaCompleta<keyof ContaMensal>()(["id", "competencia", "kwh", "valor"]),
  leitura: /* @__PURE__ */ listaCompleta<keyof LeituraRelogio>()(["id", "data", "valorKwh"]),
} as const;

/**
 * Para medidas, a casa salva confere só o limite físico, sem "inteiro" nem casas decimais. As telas antigas salvavam
 * "12340,5" na leitura e "135,905" na conta; o número é possível e não estraga a conta, e tirar o item seria perder
 * anotação verdadeira (risco 1 do D9: o rígido é o limite físico). As telas novas usam a faixa completa.
 */
function soLimiteFisico(faixa: Faixa): Faixa {
  return { min: faixa.min, max: faixa.max, minExclusivo: faixa.minExclusivo, tolerancia: faixa.tolerancia };
}

const NA_CASA_SALVA = {
  potenciaW: soLimiteFisico(LIMITES.potenciaW),
  minutosPorDia: soLimiteFisico(LIMITES.minutosPorDia),
  leituraKwh: soLimiteFisico(LIMITES.leituraKwh),
  contaKwh: soLimiteFisico(LIMITES.contaKwhAcompanhamento),
  contaValor: soLimiteFisico(LIMITES.contaValorAcompanhamento),
  contaReferenciaKwh: soLimiteFisico(LIMITES.contaKwhCalibracao),
  contaReferenciaValor: soLimiteFisico(LIMITES.contaValorCalibracao),
} as const;

/** Chave de `variantes`: barra `__proto__`, `constructor` e texto gigante. As de hoje (`modelo`, `tipo`, `idade`...) passam. */
const CHAVE_DE_VARIANTE = /^[a-z][a-z0-9-]{0,39}$/;

/** Marca de campo opcional que existe mas é inválido: tira o item inteiro. */
const INVALIDO = Symbol("invalido");

function opcional<T>(objeto: Record<string, unknown>, chave: string, ler: (valor: unknown) => T | undefined): T | undefined | typeof INVALIDO {
  if (!temPropriedade(objeto, chave)) return undefined;
  const lido = ler(propriedade(objeto, chave));
  return lido === undefined ? INVALIDO : lido;
}

const lerId = (valor: unknown) => textoLimitado(valor, LIMITES_DE_TEXTO.id);

export function lerComodo(bruto: unknown): Comodo | undefined {
  if (!ehObjeto(bruto)) return undefined;
  const id = lerId(propriedade(bruto, "id"));
  const tipo = umaDas(propriedade(bruto, "tipo"), TIPOS_DE_COMODO);
  const nome = textoLimitado(propriedade(bruto, "nome"), LIMITES_DE_TEXTO.nomeComodo);
  if (id === undefined || tipo === undefined || nome === undefined) return undefined;
  return { id, tipo, nome };
}

function lerBanho(bruto: unknown): NonNullable<Aparelho["banho"]> | undefined {
  if (!ehObjeto(bruto)) return undefined;
  const banhosPorDia = numeroNaFaixa(propriedade(bruto, "banhosPorDia"), LIMITES.banhosPorDia);
  const minutosPorBanho = numeroNaFaixa(propriedade(bruto, "minutosPorBanho"), LIMITES.minutosPorBanho);
  if (banhosPorDia === undefined || minutosPorBanho === undefined) return undefined;
  return { banhosPorDia, minutosPorBanho };
}

function lerVariantes(bruto: unknown): Record<string, string> | undefined {
  if (!ehObjeto(bruto)) return undefined;
  const chaves = Object.keys(bruto);
  if (chaves.length > LIMITES_DE_LISTA.variantes) return undefined;
  const variantes: Record<string, string> = {};
  for (const chave of chaves) {
    if (chave.length > LIMITES_DE_TEXTO.variante || !CHAVE_DE_VARIANTE.test(chave)) return undefined;
    const valor = textoLimitado(propriedade(bruto, chave), LIMITES_DE_TEXTO.variante);
    if (valor === undefined) return undefined;
    variantes[chave] = valor;
  }
  return variantes;
}

/**
 * Consumo da etiqueta. Conserto 1 do dominio-energia: zero ou negativo tira só o campo (volta ao cálculo potência ×
 * tempo, como `consumoMensalKwh` já faz). Fora disso, vale a faixa.
 */
function lerKwhMesInformado(objeto: Record<string, unknown>): number | undefined | typeof INVALIDO {
  const valor = propriedade(objeto, "kwhMesInformado");
  if (typeof valor === "number" && valor <= 0) return undefined;
  return opcional(objeto, "kwhMesInformado", (v) => numeroNaFaixa(v, LIMITES.kwhMesInformado));
}

/** Aparelho válido, ou `undefined`. Não confere se o cômodo existe: isso é do `lerCasaSalva` (e da ação do store). */
export function lerAparelho(bruto: unknown): Aparelho | undefined {
  if (!ehObjeto(bruto)) return undefined;
  const id = lerId(propriedade(bruto, "id"));
  const comodoId = lerId(propriedade(bruto, "comodoId"));
  const nome = textoLimitado(propriedade(bruto, "nome"), LIMITES_DE_TEXTO.nomeAparelho);
  const quantidade = numeroNaFaixa(propriedade(bruto, "quantidade"), LIMITES.quantidade);
  const potenciaW = numeroNaFaixa(propriedade(bruto, "potenciaW"), NA_CASA_SALVA.potenciaW);
  const diasPorSemana = numeroNaFaixa(propriedade(bruto, "diasPorSemana"), LIMITES.diasPorSemana);
  const catalogoId = opcional(bruto, "catalogoId", lerId);
  const banho = opcional(bruto, "banho", lerBanho);
  const fatorCiclo = opcional(bruto, "fatorCiclo", (v) => numeroNaFaixa(v, LIMITES.fatorCiclo));
  const variantes = opcional(bruto, "variantes", lerVariantes);
  const kwhMesInformado = lerKwhMesInformado(bruto);
  // Conserto 2 do dominio-energia: no chuveiro, o tempo por dia é sempre banhos × minutos.
  const minutosPorDia =
    banho !== undefined && banho !== INVALIDO ? banho.banhosPorDia * banho.minutosPorBanho : numeroNaFaixa(propriedade(bruto, "minutosPorDia"), NA_CASA_SALVA.minutosPorDia);

  if (id === undefined || comodoId === undefined || nome === undefined || quantidade === undefined || potenciaW === undefined) return undefined;
  if (minutosPorDia === undefined || diasPorSemana === undefined) return undefined;
  if (catalogoId === INVALIDO || banho === INVALIDO || fatorCiclo === INVALIDO || variantes === INVALIDO || kwhMesInformado === INVALIDO) return undefined;

  return {
    id,
    comodoId,
    ...(catalogoId === undefined ? {} : { catalogoId }),
    nome,
    quantidade,
    potenciaW,
    minutosPorDia,
    diasPorSemana,
    ...(banho === undefined ? {} : { banho }),
    ...(fatorCiclo === undefined ? {} : { fatorCiclo }),
    ...(variantes === undefined ? {} : { variantes }),
    ...(kwhMesInformado === undefined ? {} : { kwhMesInformado }),
  };
}

export function lerConta(bruto: unknown): ContaMensal | undefined {
  if (!ehObjeto(bruto)) return undefined;
  const id = lerId(propriedade(bruto, "id"));
  const competencia = propriedade(bruto, "competencia");
  const kwh = numeroNaFaixa(propriedade(bruto, "kwh"), NA_CASA_SALVA.contaKwh);
  const valor = numeroNaFaixa(propriedade(bruto, "valor"), NA_CASA_SALVA.contaValor);
  if (id === undefined || !ehCompetencia(competencia) || kwh === undefined || valor === undefined) return undefined;
  return { id, competencia, kwh, valor };
}

export function lerLeitura(bruto: unknown): LeituraRelogio | undefined {
  if (!ehObjeto(bruto)) return undefined;
  const id = lerId(propriedade(bruto, "id"));
  const data = propriedade(bruto, "data");
  const valorKwh = numeroNaFaixa(propriedade(bruto, "valorKwh"), NA_CASA_SALVA.leituraKwh);
  if (id === undefined || !ehData(data) || valorKwh === undefined) return undefined;
  return { id, data, valorKwh };
}

/** Conta usada para calibrar o preço: precisa de consumo e de valor. */
function lerContaReferencia(bruto: unknown): ContaReferencia | undefined {
  if (!ehObjeto(bruto)) return undefined;
  const kwh = numeroNaFaixa(propriedade(bruto, "kwh"), NA_CASA_SALVA.contaReferenciaKwh);
  const valor = numeroNaFaixa(propriedade(bruto, "valor"), NA_CASA_SALVA.contaReferenciaValor);
  if (kwh === undefined || valor === undefined) return undefined;
  return { kwh, valor };
}

/**
 * Residência e se a conta de referência saiu. A conta inválida sai sozinha e a residência fica (P-tl-1 b).
 * `pessoas` inválido sai sem aviso: só serve de sugestão no cadastro.
 */
function lerResidenciaContando(bruto: unknown): { residencia?: Residencia; contaDescartada: boolean } {
  if (!ehObjeto(bruto)) return { contaDescartada: false };
  const uf = propriedade(bruto, "uf");
  const municipioIbge = numeroNaFaixa(propriedade(bruto, "municipioIbge"), LIMITES.municipioIbge);
  const municipioNome = textoLimitado(propriedade(bruto, "municipioNome"), LIMITES_DE_TEXTO.nomeMunicipio);
  const distribuidoraId = lerId(propriedade(bruto, "distribuidoraId"));
  const beneficio = umaDas(propriedade(bruto, "beneficio"), BENEFICIOS);
  const ligacao = umaDas(propriedade(bruto, "ligacao"), LIGACOES);
  if (!ehUf(uf) || municipioIbge === undefined || municipioNome === undefined || distribuidoraId === undefined || beneficio === undefined || ligacao === undefined) {
    return { contaDescartada: false };
  }
  const contaReferencia = opcional(bruto, "contaReferencia", lerContaReferencia);
  const pessoas = opcional(bruto, "pessoas", (v) => numeroNaFaixa(v, LIMITES.pessoas));
  return {
    residencia: {
      uf,
      municipioIbge,
      municipioNome,
      distribuidoraId,
      beneficio,
      ligacao,
      ...(contaReferencia === undefined || contaReferencia === INVALIDO ? {} : { contaReferencia }),
      ...(pessoas === undefined || pessoas === INVALIDO ? {} : { pessoas }),
    },
    contaDescartada: contaReferencia === INVALIDO,
  };
}

export function lerResidencia(bruto: unknown): Residencia | undefined {
  return lerResidenciaContando(bruto).residencia;
}

/** Id de uma dica do plano de economia. */
export function lerIdDoPlano(bruto: unknown): string | undefined {
  return textoLimitado(bruto, LIMITES_DE_TEXTO.idDoPlano);
}

/**
 * Lê uma lista item por item. Lista que falta vira `[]` sem descarte (versão 1 não tinha contas, leituras nem plano);
 * lista que existe mas não é lista conta 1 descarte. Item repetido (mesma chave) sai e fica o primeiro. Acima do
 * máximo, ficam os primeiros e o resto conta como descartado sem ser lido (lista gigante não trava o celular).
 */
function lerLista<T>(bruto: unknown, maximo: number, ler: (item: unknown) => T | undefined, chaves: (item: T) => string[]): { itens: T[]; descartados: number } {
  if (bruto === undefined) return { itens: [], descartados: 0 };
  if (!Array.isArray(bruto)) return { itens: [], descartados: 1 };
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
    const chavesDoItem = lido === undefined ? [] : chaves(lido);
    if (lido === undefined || chavesDoItem.some((chave) => vistas.has(chave))) {
      descartados++;
      continue;
    }
    for (const chave of chavesDoItem) vistas.add(chave);
    itens.push(lido);
  }
  return { itens, descartados };
}

function casaVazia(): DadosCasa {
  return { comodos: [], aparelhos: [], contas: [], leituras: [], plano: [] };
}

function semDescartes(): ContagemDeDescartes {
  return { aparelhos: 0, comodos: 0, contas: 0, leituras: 0, plano: 0 };
}

/**
 * Lê a casa salva (o `state` do `persist`, versão 1 ou 2, ou maior quando o deploy voltou). `undefined` quer dizer
 * nada salvo: casa vazia, sem aviso. Datas no futuro ficam: um relógio de celular errado não pode apagar anotação.
 */
export function lerCasaSalva(bruto: unknown): CasaLida {
  if (bruto === undefined) return { casa: casaVazia(), descartados: semDescartes(), residenciaDescartada: false, ilegivel: false };
  if (!ehObjeto(bruto)) return { casa: casaVazia(), descartados: semDescartes(), residenciaDescartada: false, ilegivel: true };

  let residencia: Residencia | undefined;
  let residenciaDescartada = false;
  let contaReferenciaDescartada = false;
  if (temPropriedade(bruto, "residencia")) {
    const lida = lerResidenciaContando(propriedade(bruto, "residencia"));
    residencia = lida.residencia;
    residenciaDescartada = lida.residencia === undefined;
    contaReferenciaDescartada = lida.contaDescartada;
  }

  const comodos = lerLista(propriedade(bruto, "comodos"), LIMITES_DE_LISTA.comodos, lerComodo, (c) => [c.id]);
  const idsDosComodos = new Set(comodos.itens.map((c) => c.id));
  // Aparelho de cômodo que não existe (ou que saiu) também sai, e conta em `aparelhos`.
  const lerAparelhoDeComodoQueExiste = (item: unknown) => {
    const aparelho = lerAparelho(item);
    return aparelho && idsDosComodos.has(aparelho.comodoId) ? aparelho : undefined;
  };
  const aparelhos = lerLista(propriedade(bruto, "aparelhos"), LIMITES_DE_LISTA.aparelhos, lerAparelhoDeComodoQueExiste, (a) => [a.id]);
  // Um registro por mês e uma leitura por dia, como `salvarConta` e `salvarLeitura` já fazem.
  const contas = lerLista(propriedade(bruto, "contas"), LIMITES_DE_LISTA.contas, lerConta, (c) => [`id:${c.id}`, `mes:${c.competencia}`]);
  const leituras = lerLista(propriedade(bruto, "leituras"), LIMITES_DE_LISTA.leituras, lerLeitura, (l) => [`id:${l.id}`, `dia:${l.data}`]);
  const plano = lerLista(propriedade(bruto, "plano"), LIMITES_DE_LISTA.plano, lerIdDoPlano, (d) => [d]);

  return {
    casa: {
      ...(residencia === undefined ? {} : { residencia }),
      comodos: comodos.itens,
      aparelhos: aparelhos.itens,
      contas: contas.itens,
      leituras: leituras.itens,
      plano: plano.itens,
    },
    descartados: {
      aparelhos: aparelhos.descartados,
      comodos: comodos.descartados,
      contas: contas.descartados + (contaReferenciaDescartada ? 1 : 0),
      leituras: leituras.descartados,
      plano: plano.descartados,
    },
    residenciaDescartada,
    ilegivel: false,
  };
}

/** Qual aviso mostrar (T1), ou `undefined` quando nada saiu. Existe aviso exatamente quando houve descarte. */
export function avisoDaCasaSalva(lida: CasaLida): AvisoDaCasaSalva | undefined {
  const { descartados, residenciaDescartada, ilegivel, casa } = lida;
  const algoSaiu = residenciaDescartada || Object.values(descartados).some((quantos) => quantos > 0);
  const sobrouAlgo = casa.residencia !== undefined || casa.comodos.length > 0 || casa.aparelhos.length > 0;
  if (ilegivel || (algoSaiu && !sobrouAlgo)) return { tipo: "nada-aproveitavel" };
  if (residenciaDescartada) return { tipo: "sem-residencia" };
  if (algoSaiu) return { tipo: "parte", descartados: { ...descartados } };
  return undefined;
}
