import type { Bandeira } from "./tipos";

export interface InfoBandeira {
  id: Bandeira;
  nome: string;
  /** Cor oficial aproximada, para a interface. */
  cor: string;
  significado: string;
}

export const BANDEIRAS: Record<Bandeira, InfoBandeira> = {
  verde: { id: "verde", nome: "Verde", cor: "#1E9E4A", significado: "Condições boas para gerar energia. Não há cobrança extra." },
  amarela: { id: "amarela", nome: "Amarela", cor: "#F2B600", significado: "Condições menos favoráveis. A energia fica um pouco mais cara." },
  "vermelha-1": { id: "vermelha-1", nome: "Vermelha patamar 1", cor: "#E2513A", significado: "Geração mais cara, com mais usinas térmicas ligadas. A energia fica mais cara." },
  "vermelha-2": { id: "vermelha-2", nome: "Vermelha patamar 2", cor: "#B8202F", significado: "Geração bem mais cara. É o mês de economizar o máximo possível." },
  "escassez-hidrica": { id: "escassez-hidrica", nome: "Escassez hídrica", cor: "#6B1020", significado: "Bandeira de emergência por falta de chuva nos reservatórios." },
};

/** Converte o nome publicado pela ANEEL ("Vermelha P1", "Vermelha Patamar 2"...) para o identificador interno. */
export function normalizarBandeira(nome: string): Bandeira | undefined {
  const n = nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  if (n.startsWith("verde")) return "verde";
  if (n.startsWith("amarela")) return "amarela";
  if (n.includes("escassez")) return "escassez-hidrica";
  if (n.startsWith("vermelha")) {
    if (/(p|patamar)\s*2|ii\b/.test(n)) return "vermelha-2";
    return "vermelha-1";
  }
  return undefined;
}
