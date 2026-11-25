// Sem "use client": só textos, usados pelo cartão da meta, que já é de cliente.

import { formatarReais, LIMITES, type Beneficio, type Ligacao } from "@ee/core";
import type { Confianca, SituacaoDaMeta } from "@ee/core/meta";
import type { MensagensDoCampo } from "@/ui/campos/mensagens";

/** Textos da HIS-104 (domínio, ajustados pela ux). Todo valor chega em centavos do core e sai por `formatarReais`. */
export const reais = (centavos: number) => formatarReais(centavos / 100);

export const ROTULO_DA_META = "Quanto você quer pagar de luz por mês?";
export const AJUDA_DA_META = "Escreva o valor que cabe no seu bolso. A gente mostra quanto falta.";
export const META_SALVA = "Meta salva neste aparelho.";
export const SO_NESTE_APARELHO = "Sua meta fica só neste aparelho. Não enviamos para ninguém.";
export const E_ESTIMATIVA = "É uma estimativa. A conta de verdade pode ser um pouco diferente.";
export const SEM_CIP_NA_ECONOMIA = "A economia pode ser um pouco menor, porque a iluminação pública não muda com o quanto você gasta.";

/**
 * Mensagens do campo da meta. É função, não constante: formatar no carregamento do módulo faria um erro de formatação
 * (o T3 do erros.spec) ficar preso no módulo, e o "Tentar de novo" nunca mais traria a tela de volta.
 */
export function mensagensDaMeta(): MensagensDoCampo {
  const { min, max } = LIMITES.metaMensal;
  const fora = `Escreva um valor entre ${formatarReais(min)} e ${formatarReais(max)}.`;
  return {
    vazio: fora,
    malEscrito: fora,
    fora,
    confere: (valor) => `${formatarReais(valor)} é muito para uma conta de luz. Veja se a vírgula está no lugar certo.`,
  };
}

/** Título do estado: é ele que o leitor de tela anuncia depois de "Salvar meta". */
export function tituloDaMeta(s: SituacaoDaMeta): string {
  switch (s.tipo) {
    case "sem-dados":
      return "Falta o preço da luz para calcular a meta.";
    case "abaixo-do-piso":
      return "Essa meta está abaixo do que dá para pagar.";
    case "dentro":
      return s.confianca.tipo === "completa" ? "Boa notícia: sua conta já cabe na meta." : "Pela estimativa, a conta fica abaixo da meta.";
    case "falta":
      if (s.confianca.tipo === "parcial") return `Falta economizar pelo menos ${reais(s.faltaCentavos)} por mês.`;
      if (!s.chegaLa && s.passos.length > 0) return "Estas dicas ajudam, mas ainda não chegam lá.";
      return `Falta economizar ${reais(s.faltaCentavos)} por mês.`;
  }
}

/** Linha que explica por que a estimativa é parcial (sem conta de luz ou aparelhos que não explicam a conta). */
export function linhaDaConfianca(confianca: Confianca, contaCentavos: number): string | undefined {
  if (confianca.tipo === "completa") return undefined;
  if (confianca.motivo === "sem-conta") return "Esse valor é só da energia, sem impostos. Coloque sua última conta de luz para ver o valor completo.";
  return `Os aparelhos que você colocou somam ${reais(contaCentavos)}, mas sua última conta foi ${reais(confianca.contaInformadaCentavos)}. Pode faltar algum aparelho.`;
}

export function linhaDoDentro(contaCentavos: number, folgaCentavos: number, metaCentavos: number, confianca: Confianca): string {
  if (confianca.tipo === "parcial" && confianca.motivo === "sem-conta") return "Sem os impostos, já está abaixo da meta. Coloque sua conta de luz para confirmar.";
  if (folgaCentavos === 0) return "A conta estimada é igual à meta.";
  return `A conta estimada é ${reais(contaCentavos)} e a meta é ${reais(metaCentavos)}. Sobram ${reais(folgaCentavos)}.`;
}

export function cabecalhoDasDicas(quantidade: number, chegaLa: boolean): string {
  if (quantidade === 1) return chegaLa ? "Esta dica chega lá" : "Esta dica ajuda";
  return chegaLa ? `Estas ${quantidade} dicas chegam lá` : `Estas ${quantidade} dicas ajudam`;
}

/** Linhas do piso (estado 2): o mínimo de cada ligação (REN ANEEL 1.000/2021, art. 291), a iluminação pública e a Tarifa Social. */
export function linhasDoPiso(pisoCentavos: number, ligacao: Ligacao | undefined, beneficio: Beneficio | undefined, cipReais: number | undefined): string[] {
  const linhas = [
    `Toda casa paga um mínimo de energia, mesmo sem ligar nada: 30 kWh se a ligação tem 1 fase, 50 kWh com 2 e 100 kWh com 3. Para a sua casa isso dá ${reais(pisoCentavos)} por mês.`,
    cipReais ? `Já somamos a iluminação pública de ${formatarReais(cipReais)}.` : "Fora a taxa de iluminação pública da sua cidade, que está na sua conta de luz.",
  ];
  if (beneficio === "tarifa-social") linhas.push("Com a Tarifa Social, os primeiros 80 kWh não são cobrados, mas impostos e iluminação pública continuam.");
  if (!ligacao || ligacao === "nao-sei") linhas.push("Se a sua ligação tiver 2 ou 3 fases, o mínimo é maior. Veja na sua conta.");
  return linhas;
}

/** Linha curta do bloco "Sua meta" no painel em grade: o detalhe fica na folha. */
export function legendaDoBlocoDaMeta(s: SituacaoDaMeta | undefined): string {
  if (!s) return "Toque para dizer quanto quer pagar.";
  switch (s.tipo) {
    case "sem-dados":
      return "Falta o preço da luz.";
    case "abaixo-do-piso":
      return `Abaixo do mínimo de ${reais(s.pisoCentavos)}.`;
    case "dentro":
      return s.confianca.tipo === "completa" ? "Sua conta já cabe." : "Pela estimativa, cabe.";
    case "falta":
      return s.confianca.tipo === "parcial" ? `Faltam pelo menos ${reais(s.faltaCentavos)}.` : `Faltam ${reais(s.faltaCentavos)}.`;
  }
}
