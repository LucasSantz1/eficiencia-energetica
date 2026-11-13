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

// Vazia desde a HIS-110: as 8 exceções de contraste da `/` (pílulas da faixa D e os 2 <dd> da Tarifa Social, sem e
// com casa) foram corrigidas, e o axe passa a provar. Exceção nova só com a história que a corrige.
export const EXCECOES_AXE: readonly ExcecaoAxe[] = [];
