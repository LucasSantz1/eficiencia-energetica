/*
 * Exceções do axe (critério 3, D10, D16): violação séria ou crítica que só se corrige mudando o que a pessoa vê
 * (cor, tamanho, layout) não é corrigida na E0. Ela entra aqui, um elemento por entrada, com a história da E1 que
 * corrige — nunca desligando a regra. Quem revisa a lista: ux-acessibilidade.
 *
 * Regras de cada entrada (conferidas pelo acessibilidade.spec.ts e pelo sanidade.spec.ts):
 *   - `alvo` é um seletor CSS que acha EXATAMENTE 1 elemento na tela, e esse elemento é um dos nós da violação;
 *     mais de 1 elemento = erro ("exceção cobre mais de um elemento"); nenhum nó = erro ("exceção velha").
 *   - `pagina` + `estado` são uma das telas que o axe confere (TELAS_AXE em apoio/axe.ts).
 *   - `historia` existe como linha `| HIS-NNN |` em docs/planejamento.md.
 * Dois elementos com o mesmo defeito = duas entradas: um elemento novo com o defeito falha sozinho.
 */
import type { EstadoAxe } from "./apoio/axe";

export interface ExcecaoAxe {
  regra: string; // id da regra do axe, ex.: "color-contrast"
  pagina: string; // ex.: "/"
  estado: EstadoAxe;
  alvo: string; // seletor CSS que casa com exatamente 1 elemento da página
  historia: `HIS-${number}`; // história da E1 que corrige; tem que existir em docs/planejamento.md
  motivo: string;
}

const PILULA_FAIXA_D = "texto branco sobre o laranja da faixa D (#ec7a1a), 2,85:1; a HIS-110 troca por text-tinta (5,50:1)";
const DD_TARIFA_SOCIAL = "texto text-white/85 nos cartões da faixa \"Tarifa Social\"; corrigir a cor muda a tela";

/** As mesmas 4 na `/` sem e com casa (a casa ilustrada e a faixa "Tarifa Social" são iguais para todos); confirmadas no A5 nos 2 projetos. */
function contrasteDaPaginaInicial(estado: EstadoAxe): ExcecaoAxe[] {
  return [
    { regra: "color-contrast", pagina: "/", estado, alvo: 'button[aria-label^="Quarto,"] .numeros', historia: "HIS-110", motivo: `pílula do Quarto: ${PILULA_FAIXA_D}` },
    { regra: "color-contrast", pagina: "/", estado, alvo: 'button[aria-label^="Cozinha,"] .numeros', historia: "HIS-110", motivo: `pílula da Cozinha: ${PILULA_FAIXA_D}` },
    { regra: "color-contrast", pagina: "/", estado, alvo: "div.bg-white\\/10:nth-child(1) > dd.text-white\\/85", historia: "HIS-110", motivo: `cartão "Tarifa Social": ${DD_TARIFA_SOCIAL}` },
    { regra: "color-contrast", pagina: "/", estado, alvo: "div.bg-white\\/10:nth-child(2) > dd.text-white\\/85", historia: "HIS-110", motivo: `cartão "Desconto Social": ${DD_TARIFA_SOCIAL}` },
  ];
}

export const EXCECOES_AXE: readonly ExcecaoAxe[] = [...contrasteDaPaginaInicial("sem casa"), ...contrasteDaPaginaInicial("com casa")];
