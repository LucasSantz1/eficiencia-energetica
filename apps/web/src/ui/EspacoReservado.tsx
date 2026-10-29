import { RECURSOS, type PosicaoReservada } from "@/config/recursos";

/**
 * Posição reservada no layout para uso futuro. Desligada, não renderiza nada.
 * Nunca aparece no cadastro nem em telas que pedem decisão da pessoa (veja docs/equipe/espacos-reservados.md).
 */
export function EspacoReservado({ posicao }: { posicao: PosicaoReservada }) {
  if (!RECURSOS.espacosReservados) return null;
  return <aside data-posicao={posicao} aria-label="Conteúdo de parceiro" className="min-h-24 rounded-[var(--radius-cartao)] border border-linha bg-papel" />;
}
