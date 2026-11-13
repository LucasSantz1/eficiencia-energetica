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
