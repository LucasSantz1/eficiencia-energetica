/**
 * Chaves de recursos do site. Ligar um recurso aqui não exige mudar as telas.
 *
 * `espacosReservados`: posições já reservadas no layout para conteúdo de parceiros no futuro.
 * Enquanto estiver `false`, nada é renderizado (nem espaço em branco, nem texto) — o site
 * continua exatamente igual. Regras para quando for ligado: docs/equipe/espacos-reservados.md.
 */
export const RECURSOS = {
  espacosReservados: false,
} as const;

/** Onde cada espaço reservado fica. Os nomes descrevem a posição, não o conteúdo. */
export type PosicaoReservada = "inicio-antes-perguntas" | "painel-apos-ranking" | "dicas-apos-lista";
