/**
 * Põe o foco no título da tela, ou no da folha aberta (fora de um <dialog> modal o foco não chega). Usado quando o
 * botão que tinha o foco some (T1 "Entendi", T2 que voltou a dar certo) e ao abrir a tela de erro (T3): o leitor de
 * tela lê o título, e o próximo Tab segue a ordem da tela. Nunca deixa o foco cair no `body`.
 */
export function focarTitulo(): void {
  if (typeof document === "undefined") return;
  const titulo =
    document.querySelector<HTMLElement>("dialog[open] h2") ?? document.querySelector<HTMLElement>("main h1") ?? document.querySelector<HTMLElement>("h1");
  if (!titulo) return;
  if (!titulo.hasAttribute("tabindex")) titulo.tabIndex = -1;
  titulo.focus();
}

/**
 * Põe o foco no primeiro campo que não passou (T5: erro; T6: "Confere?" sem resposta), na ordem da tela. Espera o
 * próximo quadro: a mensagem e o `aria-describedby` entram na mesma troca de estado, e o leitor de tela precisa
 * encontrá-los ao chegar no campo. Devolve `true` se algum campo não passou (a tela não segue).
 */
export function focarPrimeiroErro(campos: readonly { id: string; resultado: "ok" | "erro" | "alerta" }[]): boolean {
  const primeiro = campos.find((campo) => campo.resultado !== "ok");
  if (!primeiro) return false;
  requestAnimationFrame(() => document.getElementById(primeiro.id)?.focus());
  return true;
}
