/**
 * Id para cômodos, aparelhos, contas e leituras guardados no aparelho da pessoa. Não é segredo: só precisa
 * ser único na casa. Navegadores antigos sem crypto.randomUUID usam data + número aleatório.
 */
export const novoId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
