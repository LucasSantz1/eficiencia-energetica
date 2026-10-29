const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const reaisSemCentavos = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const numero1 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const numero0 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

/** R$ 35,10 */
export function formatarReais(valor: number, opcoes: { semCentavos?: boolean } = {}): string {
  const v = Number.isFinite(valor) ? valor : 0;
  // Normaliza o espaço não separável do Intl para um espaço comum (mais previsível em testes e no app).
  return (opcoes.semCentavos ? reaisSemCentavos : reais).format(v).replace(/ /g, " ");
}

/** 54 kWh / 1,8 kWh */
export function formatarKwh(kwh: number): string {
  const v = Number.isFinite(kwh) ? kwh : 0;
  return `${(v >= 10 ? numero0 : numero1).format(v)} kWh`;
}

/** 5.500 W */
export function formatarWatts(w: number): string {
  return `${numero0.format(w)} W`;
}

/** 90 → "1 h 30 min"; 1440 → "o dia todo" */
export function formatarTempo(minutos: number): string {
  if (minutos >= 1440) return "o dia todo";
  const h = Math.floor(minutos / 60);
  const m = Math.round(minutos % 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return h === 1 ? "1 hora" : `${h} horas`;
  return `${h} h ${m} min`;
}

/** 7 → "todos os dias"; 1 → "1 dia por semana"; 7/30 → "1 vez por mês" */
export function formatarDias(dias: number): string {
  if (dias >= 7) return "todos os dias";
  if (dias < 1) {
    const vezes = Math.max(1, Math.round((dias * 30) / 7));
    return vezes === 1 ? "1 vez por mês" : `${vezes} vezes por mês`;
  }
  const d = Math.round(dias * 10) / 10;
  return d === 1 ? "1 dia por semana" : `${numero1.format(d)} dias por semana`;
}

/** 0,234 → "23%" */
export function formatarPorcentagem(fracao: number): string {
  const p = fracao * 100;
  if (p > 0 && p < 1) return "menos de 1%";
  return `${numero0.format(p)}%`;
}

/** "2026-10" → "outubro de 2026" */
export function formatarCompetencia(competencia: string): string {
  const [ano, mes] = competencia.split("-").map(Number);
  if (!ano || !mes) return competencia;
  const nome = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(ano, mes - 1, 1)));
  return `${nome} de ${ano}`;
}
