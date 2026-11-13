// Textos do painel "Por que perguntamos" do /comecar no computador (HIS-112, L7). Textos do ux, com os ajustes da
// seguranca (empresa de luz, conta e a linha fixa), conferidos contra o que o site faz hoje.

/** Explicação de cada passo do cadastro. É explicação extra: nada essencial vive só aqui. */
export const PORQUE_PERGUNTAMOS = {
  estado: { titulo: "Por que perguntamos o estado?", texto: "Cada estado tem empresas de luz diferentes. Com o estado, achamos a sua." },
  cidade: { titulo: "Por que perguntamos a cidade?", texto: "O preço da luz muda de cidade para cidade. Com a cidade, usamos o preço certo." },
  distribuidora: {
    titulo: "Onde vejo o nome da empresa?",
    texto: "Está no alto da sua conta de luz. Se não achar, peça a conta a alguém da casa ou veja no site da distribuidora.",
  },
  beneficio: {
    titulo: "O que é a Tarifa Social?",
    texto: "É um desconto na conta para famílias de baixa renda. Se a sua família tem direito, a conta fica mais barata.",
  },
  pessoas: {
    titulo: "Por que perguntamos quantas pessoas?",
    texto: "Mais gente em casa costuma gastar mais água quente e mais energia. Isso ajuda a estimar a conta.",
  },
  comodos: { titulo: "Por que perguntamos os cômodos?", texto: "Mostramos quanto cada cômodo pesa na conta. Pode ser só um palpite, depois você ajusta." },
  comodo: { titulo: "Não sabe a potência?", texto: "Sem problema. Escolha o aparelho mais parecido com o seu e usamos um valor médio." },
  revisao: { titulo: "Dá para mudar depois?", texto: "Dá. Tudo isto fica em \"Minha casa\" e você muda quando quiser." },
  conta: { titulo: "Para que serve a conta de luz?", texto: "Comparamos o valor com a nossa estimativa, para você ver a diferença." },
} satisfies Record<string, { titulo: string; texto: string }>;

/** Linha fixa embaixo de todo texto do painel (redação da seguranca: o site busca /dados, mas nada sobre a casa sai). */
export const NADA_SAI_DA_CASA = "Suas respostas ficam só neste aparelho. Não enviamos nada sobre a sua casa.";

type PassoComTexto = Exclude<keyof typeof PORQUE_PERGUNTAMOS, "comodo"> | `comodo:${number}`;

const ehPassoDeComodo = (passo: PassoComTexto): passo is `comodo:${number}` => passo.startsWith("comodo:");

/**
 * Texto do painel para um passo. Todo passo do cadastro tem que caber em `PassoComTexto`: um passo novo sem texto
 * reprova no typecheck do Cadastro.
 */
export function textoDoPasso(passo: PassoComTexto): { titulo: string; texto: string } {
  return PORQUE_PERGUNTAMOS[ehPassoDeComodo(passo) ? "comodo" : passo];
}
