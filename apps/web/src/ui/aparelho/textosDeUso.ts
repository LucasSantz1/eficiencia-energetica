import { formatarDias, formatarTempo, horasPorDiaMedia, type Aparelho } from "@ee/core";

/** Frase curta com o tempo de uso estimado, como aparece nas listas. */
export function descreverUso(a: Pick<Aparelho, "minutosPorDia" | "diasPorSemana" | "kwhMesInformado" | "banho">): string {
  if (a.kwhMesInformado !== undefined) return "Fica ligada o dia todo";
  if (a.banho) return `${a.banho.banhosPorDia} ${a.banho.banhosPorDia === 1 ? "banho" : "banhos"} de ${a.banho.minutosPorBanho} min por dia`;
  if (a.diasPorSemana < 1) return `Usado ${formatarTempo(a.minutosPorDia)}, ${formatarDias(a.diasPorSemana)}`;
  const tempo = a.minutosPorDia >= 1440 ? "o dia todo" : `${formatarTempo(a.minutosPorDia)} por dia`;
  if (a.diasPorSemana >= 7) return `Ligado ${tempo}`;
  return `Ligado ${tempo}, ${formatarDias(a.diasPorSemana)}`;
}

/** Média de uso em horas por dia, para o painel ("≈ 2,1 h/dia"). */
export function horasPorDiaTexto(a: Pick<Aparelho, "minutosPorDia" | "diasPorSemana" | "kwhMesInformado">): string {
  const h = horasPorDiaMedia(a);
  if (h >= 24) return "24 h/dia";
  if (h < 1) return `${Math.round(h * 60)} min/dia`;
  return `${h.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} h/dia`;
}
