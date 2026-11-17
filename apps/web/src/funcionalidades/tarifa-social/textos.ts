// Sem "use client": só textos, usados pelos componentes do guia (que já são de cliente).

import {
  DESCONTO_SOCIAL_LIMITE_KWH,
  formatarReais,
  LIMITES,
  PRAZO_DA_CONVOCACAO,
  TARIFA_DE_EXEMPLO_KWH,
  TARIFA_SOCIAL_ISENCAO_KWH,
  valorDaEnergiaDeGracaNoExemplo,
  type CasoDaTarifaSocial,
  type ComparacaoDaRenda,
} from "@ee/core";

/**
 * Textos do guia da Tarifa Social, copiados do "Fluxo e textos" da HIS-103 (ux-acessibilidade, 2026-11-17). Os números
 * vêm do core (kWh, limites, salário mínimo e prazo), com a fonte lá.
 */

export const TOPO = {
  titulo: "Tarifa Social: será que a sua família pode ter?",
  texto: "São 6 perguntas rápidas. Não pedimos nome nem CPF. Suas respostas ficam só nesta tela e somem quando você sair.",
};

export type PerguntaDeEscolha = "bpc" | "cadUnico" | "saude" | "contaNoNome";
export type PerguntaDeNumero = "pessoas" | "renda";
export type Pergunta = PerguntaDeEscolha | PerguntaDeNumero;

export const ORDEM_DAS_PERGUNTAS: readonly Pergunta[] = ["bpc", "cadUnico", "pessoas", "renda", "saude", "contaNoNome"];

export const PERGUNTAS: Record<Pergunta, { titulo: string; ajuda: string }> = {
  bpc: {
    titulo: "Alguém da sua casa recebe o BPC?",
    ajuda: "BPC é o Benefício de Prestação Continuada: um salário mínimo por mês do INSS para idosos de 65 anos ou mais e pessoas com deficiência.",
  },
  cadUnico: {
    titulo: "Sua família está no CadÚnico?",
    ajuda: "CadÚnico é o Cadastro Único do governo. Faz-se no CRAS, de graça. CRAS é o Centro de Referência de Assistência Social da prefeitura.",
  },
  pessoas: { titulo: "Quantas pessoas moram na sua casa?", ajuda: "Conte você e todos que dividem a mesma casa e as mesmas despesas." },
  renda: { titulo: "Somando o que todos ganham por mês, quanto dá?", ajuda: "Conte salário, bico, aposentadoria e BPC. Não conte o Bolsa Família." },
  saude: { titulo: "Alguém da casa precisa de aparelho elétrico ligado para cuidar da saúde?", ajuda: "Por exemplo, aparelho de oxigênio." },
  contaNoNome: { titulo: "A conta de luz está no nome de alguém que mora na casa?", ajuda: "Veja o nome que aparece no alto da conta." },
};

/** Botões de cada pergunta de escolha, na ordem da tela. */
export const OPCOES: Record<PerguntaDeEscolha, readonly { valor: "sim" | "nao" | "nao-sei"; rotulo: string }[]> = {
  bpc: [
    { valor: "sim", rotulo: "Sim, recebe" },
    { valor: "nao", rotulo: "Não" },
    { valor: "nao-sei", rotulo: "Não sei" },
  ],
  cadUnico: [
    { valor: "sim", rotulo: "Sim, está" },
    { valor: "nao", rotulo: "Não" },
    { valor: "nao-sei", rotulo: "Não sei" },
  ],
  saude: [
    { valor: "sim", rotulo: "Sim" },
    { valor: "nao", rotulo: "Não" },
  ],
  contaNoNome: [
    { valor: "sim", rotulo: "Sim" },
    { valor: "nao", rotulo: "Não" },
    { valor: "nao-sei", rotulo: "Não sei" },
  ],
};

export const ERRO_DAS_PESSOAS = `Digite um número de ${LIMITES.pessoas.min} a ${LIMITES.pessoas.max}.`;
export const ERRO_DA_RENDA = "Digite quanto a família ganha por mês. Se for nada, digite 0.";
export const NAO_SEI_A_RENDA = { resumo: "Não sei o valor", texto: "Some o que cada um ganha em um mês comum." };
export const POR_QUE_PERGUNTAMOS = "Comparamos a renda de cada pessoa com meio salário mínimo. Nada sai do seu aparelho.";

/** "Confere?" da renda acima do comum (padrão da HIS-003). */
export function confereARenda(valor: string): string {
  return `A família ganha ${valor} por mês?`;
}

export const RESULTADOS: Record<CasoDaTarifaSocial, { titulo: string; texto: string; selo: string }> = {
  A: {
    titulo: "Sua família pode ter direito à Tarifa Social",
    texto: `A energia dos primeiros ${TARIFA_SOCIAL_ISENCAO_KWH} kWh do mês sai de graça. Numa conta de ${formatarReais(TARIFA_DE_EXEMPLO_KWH)} por kWh, são cerca de ${formatarReais(valorDaEnergiaDeGracaNoExemplo())} por mês (estimativa). Confira no CRAS.`,
    selo: "Pode ter",
  },
  B: {
    titulo: "Sua família pode ter direito ao Desconto Social",
    texto: `Você paga menos na conta até ${DESCONTO_SOCIAL_LIMITE_KWH} kWh por mês. O tamanho do desconto muda em cada distribuidora. Confira no CRAS.`,
    selo: "Pode ter",
  },
  C: {
    titulo: "Sua família pode ter direito à Tarifa Social, por causa do aparelho de saúde",
    texto: "Peça na distribuidora, com relatório e atestado do médico. A família precisa estar no CadÚnico.",
    selo: "Pode ter",
  },
  D: {
    titulo: "Pelo que você respondeu, não parece",
    texto: "Hoje a família não se encaixa nas regras. Se a renda ou a casa mudar, responda de novo. Em caso de dúvida, o CRAS pode confirmar.",
    selo: "Não parece",
  },
};

const [ANO_DO_PRAZO, MES_DO_PRAZO, DIA_DO_PRAZO] = PRAZO_DA_CONVOCACAO.split("-");

export const AVISOS = {
  fazerCadUnico: "Primeiro, faça o CadÚnico no CRAS. É de graça. Leve os documentos da lista abaixo.",
  trocarNomeDaConta: "O desconto só vem se a conta estiver no nome de alguém da família. Peça a troca na distribuidora (a empresa que manda a conta de luz).",
  convocacao: `Até ${DIA_DO_PRAZO}/${MES_DO_PRAZO}/${ANO_DO_PRAZO}, atenda se a distribuidora chamar para atualizar o cadastro. Quem não atender pode perder o desconto.`,
  salarioMinimoMudou: "O valor do salário mínimo mudou. Confira o valor de hoje no CRAS.",
};

const NOME_DO_LIMITE: Record<ComparacaoDaRenda["salariosMinimos"], string> = { 0.5: "meio salário mínimo", 1: "um salário mínimo", 3: "3 salários mínimos" };

/** "Renda por pessoa: R$ 750,00. O limite é R$ 810,50 (meio salário mínimo)." Só com o salário mínimo em vigor. */
export function explicarARenda(comparacao: ComparacaoDaRenda): string {
  const base = comparacao.base === "por-pessoa" ? "Renda por pessoa" : "Renda da família";
  return `${base}: ${formatarReais(comparacao.rendaCentavos / 100)}. O limite é ${formatarReais(comparacao.limiteCentavos / 100)} (${NOME_DO_LIMITE[comparacao.salariosMinimos]}).`;
}

export const BOTOES_DO_RESULTADO = { deNovo: "Responder de novo", inicio: "Voltar ao início" };
