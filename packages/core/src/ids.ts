/**
 * Id de uma distribuidora a partir da sigla da ANEEL ("RGE SUL" → "rge-sul", "Âmbar Roraima" → "ambar-roraima").
 * É a regra única do id: a rotina de dados (`packages/dados`) publica os ids com ela, e o site usa a mesma para achar
 * o nome de um id que já saiu do `tarifas.json`. Tira acentos, troca o que não é letra ou número por hífen e corta os
 * hífens das pontas. O resultado cabe no formato do V8 (`^[a-z0-9]+(-[a-z0-9]+)*$`) ou é vazio.
 */
export function idDaSigla(sigla: string): string {
  return sigla
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
