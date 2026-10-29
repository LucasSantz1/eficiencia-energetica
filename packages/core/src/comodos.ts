import { consumoMensalKwh, DIAS_NO_MES } from "./calculos";
import { itemDoCatalogo } from "./catalogo";
import type { Aparelho, Comodo, TipoComodo } from "./tipos";

export interface SugestaoComodo {
  catalogoId: string;
  /** Quantidade sugerida quando o aparelho vem marcado. */
  quantidade: number;
  /** Já vem marcado (é comum ter esse aparelho nesse cômodo). */
  marcado: boolean;
  /** Tempo por dia diferente do padrão do catálogo, para esse cômodo (minutos). */
  minutosPorDia?: number;
}

/**
 * Aparelhos que costumam aparecer em cada cômodo. Os marcados já vêm com quantidade 1;
 * os outros aparecem com quantidade 0, prontos para a pessoa aumentar.
 * As lâmpadas são tratadas à parte (veja ILUMINACAO_PADRAO).
 */
export const SUGESTOES_COMODO: Record<TipoComodo, SugestaoComodo[]> = {
  cozinha: [
    { catalogoId: "geladeira", quantidade: 1, marcado: true },
    { catalogoId: "micro-ondas", quantidade: 1, marcado: false },
    { catalogoId: "liquidificador", quantidade: 1, marcado: false },
    { catalogoId: "air-fryer", quantidade: 1, marcado: false },
    { catalogoId: "cafeteira", quantidade: 1, marcado: false },
    { catalogoId: "panela-eletrica", quantidade: 1, marcado: false },
    { catalogoId: "sanduicheira", quantidade: 1, marcado: false },
    { catalogoId: "forno-eletrico", quantidade: 1, marcado: false },
    { catalogoId: "purificador", quantidade: 1, marcado: false },
    { catalogoId: "freezer", quantidade: 1, marcado: false },
    { catalogoId: "torneira-eletrica", quantidade: 1, marcado: false },
    { catalogoId: "lava-loucas", quantidade: 1, marcado: false },
  ],
  sala: [
    { catalogoId: "tv", quantidade: 1, marcado: true },
    { catalogoId: "roteador", quantidade: 1, marcado: true },
    { catalogoId: "tv-box", quantidade: 1, marcado: false },
    { catalogoId: "ventilador", quantidade: 1, marcado: false, minutosPorDia: 240 },
    { catalogoId: "ar-condicionado", quantidade: 1, marcado: false, minutosPorDia: 240 },
    { catalogoId: "videogame", quantidade: 1, marcado: false },
    { catalogoId: "som", quantidade: 1, marcado: false },
    { catalogoId: "computador", quantidade: 1, marcado: false },
  ],
  quarto: [
    { catalogoId: "ventilador", quantidade: 1, marcado: true },
    { catalogoId: "carregador-celular", quantidade: 1, marcado: true },
    { catalogoId: "tv", quantidade: 1, marcado: false, minutosPorDia: 120 },
    { catalogoId: "ar-condicionado", quantidade: 1, marcado: false },
    { catalogoId: "notebook", quantidade: 1, marcado: false },
    { catalogoId: "computador", quantidade: 1, marcado: false },
    { catalogoId: "videogame", quantidade: 1, marcado: false },
    { catalogoId: "luminaria", quantidade: 1, marcado: false },
    { catalogoId: "aquecedor", quantidade: 1, marcado: false },
  ],
  banheiro: [
    { catalogoId: "chuveiro", quantidade: 1, marcado: true },
    { catalogoId: "secador-cabelo", quantidade: 1, marcado: false },
    { catalogoId: "chapinha", quantidade: 1, marcado: false },
  ],
  lavanderia: [
    { catalogoId: "maquina-lavar", quantidade: 1, marcado: true },
    { catalogoId: "ferro", quantidade: 1, marcado: false },
    { catalogoId: "secadora", quantidade: 1, marcado: false },
    { catalogoId: "centrifuga", quantidade: 1, marcado: false },
    { catalogoId: "bomba-dagua", quantidade: 1, marcado: false },
  ],
  escritorio: [
    { catalogoId: "computador", quantidade: 1, marcado: true },
    { catalogoId: "notebook", quantidade: 1, marcado: false },
    { catalogoId: "monitor", quantidade: 1, marcado: false },
    { catalogoId: "impressora", quantidade: 1, marcado: false },
    { catalogoId: "carregador-celular", quantidade: 1, marcado: false },
    { catalogoId: "ventilador", quantidade: 1, marcado: false, minutosPorDia: 240 },
    { catalogoId: "ar-condicionado", quantidade: 1, marcado: false, minutosPorDia: 240 },
  ],
  "area-externa": [
    { catalogoId: "refletor", quantidade: 1, marcado: false },
    { catalogoId: "bomba-dagua", quantidade: 1, marcado: false },
    { catalogoId: "portao", quantidade: 1, marcado: false },
    { catalogoId: "camera-seguranca", quantidade: 1, marcado: false },
    { catalogoId: "bomba-piscina", quantidade: 1, marcado: false },
    { catalogoId: "lavadora-alta-pressao", quantidade: 1, marcado: false },
  ],
  outro: [],
};

/** Lâmpadas sugeridas por cômodo: quantas e por quanto tempo ficam acesas (minutos por dia). */
export const ILUMINACAO_PADRAO: Record<TipoComodo, { quantidade: number; minutosPorDia: number }> = {
  cozinha: { quantidade: 1, minutosPorDia: 240 },
  sala: { quantidade: 2, minutosPorDia: 300 },
  quarto: { quantidade: 1, minutosPorDia: 180 },
  banheiro: { quantidade: 1, minutosPorDia: 60 },
  lavanderia: { quantidade: 1, minutosPorDia: 60 },
  escritorio: { quantidade: 1, minutosPorDia: 240 },
  "area-externa": { quantidade: 1, minutosPorDia: 600 },
  outro: { quantidade: 1, minutosPorDia: 120 },
};

export const TIPOS_LAMPADA = ["lampada-led", "lampada-fluorescente", "lampada-incandescente"] as const;

export function ehLampada(a: Pick<Aparelho, "catalogoId">): boolean {
  return (TIPOS_LAMPADA as readonly string[]).includes(a.catalogoId ?? "");
}

/** Tempo que o aparelho fica ligado por mês, em horas, por unidade (geladeira: o mês inteiro). */
export function horasPorMes(a: Pick<Aparelho, "minutosPorDia" | "diasPorSemana" | "kwhMesInformado">): number {
  if (a.kwhMesInformado !== undefined && a.kwhMesInformado > 0) return 24 * DIAS_NO_MES;
  return (Math.max(0, a.minutosPorDia) / 60) * (Math.min(7, Math.max(0, a.diasPorSemana)) / 7) * DIAS_NO_MES;
}

/** Média de horas por dia ao longo do mês, por unidade. */
export function horasPorDiaMedia(a: Pick<Aparelho, "minutosPorDia" | "diasPorSemana" | "kwhMesInformado">): number {
  return horasPorMes(a) / DIAS_NO_MES;
}

export interface ItemAgregado {
  /** Agrupa aparelhos do mesmo tipo (catálogo) ou com o mesmo nome. */
  chave: string;
  nome: string;
  catalogoId?: string;
  /** Total de unidades na casa. */
  quantidade: number;
  /** Onde estão: quantas unidades em cada cômodo. */
  porComodo: { comodoId: string; quantidade: number }[];
  kwhMes: number;
  /** Soma das horas ligadas de todas as unidades no mês. */
  horasMes: number;
}

/**
 * Painel geral: junta os aparelhos iguais de todos os cômodos.
 * Ex.: 1 TV na sala + 1 TV em cada quarto = "TV: 3".
 */
export function agregarAparelhos(aparelhos: Aparelho[], comodos: Comodo[]): ItemAgregado[] {
  const ordemComodo = new Map(comodos.map((c, i) => [c.id, i]));
  const grupos = new Map<string, ItemAgregado>();
  for (const a of aparelhos) {
    const chave = a.catalogoId && a.catalogoId !== "outro" ? a.catalogoId : `nome:${a.nome.trim().toLowerCase()}`;
    const g = grupos.get(chave) ?? {
      chave,
      nome: a.catalogoId && a.catalogoId !== "outro" ? (itemDoCatalogo(a.catalogoId)?.nome ?? a.nome) : a.nome,
      catalogoId: a.catalogoId,
      quantidade: 0,
      porComodo: [],
      kwhMes: 0,
      horasMes: 0,
    };
    g.quantidade += a.quantidade;
    g.kwhMes += consumoMensalKwh(a);
    g.horasMes += horasPorMes(a) * a.quantidade;
    const noComodo = g.porComodo.find((p) => p.comodoId === a.comodoId);
    if (noComodo) noComodo.quantidade += a.quantidade;
    else g.porComodo.push({ comodoId: a.comodoId, quantidade: a.quantidade });
    grupos.set(chave, g);
  }
  for (const g of grupos.values()) g.porComodo.sort((x, y) => (ordemComodo.get(x.comodoId) ?? 0) - (ordemComodo.get(y.comodoId) ?? 0));
  return [...grupos.values()].sort((x, y) => y.kwhMes - x.kwhMes);
}

/** Nomes para cômodos repetidos: "Quarto 1", "Quarto 2"... (ou só "Quarto" quando há um). */
export function nomesPadrao(tipo: TipoComodo, nomeBase: string, quantidade: number): string[] {
  if (quantidade <= 1) return [nomeBase];
  return Array.from({ length: quantidade }, (_, i) => `${nomeBase} ${i + 1}`);
}
