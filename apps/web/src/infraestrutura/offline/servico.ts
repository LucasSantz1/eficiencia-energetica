/**
 * Service worker (HIS-301), conexão (HIS-303) e o "Instalar" do navegador (HIS-302). Só navegador: no servidor, cada
 * função não faz nada e os valores são os de "com internet, sem instalação".
 */

/** Liga o `public/sw.js`. Fora do build de produção não: no `next dev` ele guardaria arquivos que mudam a cada edição. */
export function registrarServicoOffline(): void {
  if (process.env.NODE_ENV !== "production" || typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  // Falhar aqui só tira o modo sem internet; o site funciona igual.
  navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
}

/**
 * "Apagar todos os meus dados" (LGPD): as cópias de /dados dizem de que estado é a cidade da pessoa (municipios/SP.json).
 * As páginas e os arquivos do site não dizem nada sobre ela e ficam.
 */
export async function apagarDadosGuardadosOffline(): Promise<void> {
  if (typeof caches === "undefined") return;
  const nomes = await caches.keys();
  await Promise.all(nomes.filter((nome) => nome.startsWith("dados-")).map((nome) => caches.delete(nome)));
}

/* Conexão: `navigator.onLine` e os eventos `online`/`offline`. */
export function assinarConexao(avisar: () => void): () => void {
  window.addEventListener("online", avisar);
  window.addEventListener("offline", avisar);
  return () => {
    window.removeEventListener("online", avisar);
    window.removeEventListener("offline", avisar);
  };
}
export const estaSemInternet = () => !navigator.onLine;
export const comInternetNoServidor = () => false;

/* Instalação: o Chrome do Android avisa com `beforeinstallprompt` que dá para instalar; o Safari do iPhone, não. */
interface PedidoDeInstalacao extends Event {
  prompt: () => Promise<void>;
}

function ehPedidoDeInstalacao(evento: Event): evento is PedidoDeInstalacao {
  return "prompt" in evento && typeof evento.prompt === "function";
}

let pedidoGuardado: PedidoDeInstalacao | undefined;
const ouvintes = new Set<() => void>();
const avisarTodos = () => ouvintes.forEach((avisar) => avisar());

/** Precisa rodar cedo (no layout): o navegador avisa uma vez, logo que a página abre. */
export function ouvirPedidoDeInstalacao(): () => void {
  const aoPedir = (evento: Event) => {
    if (!ehPedidoDeInstalacao(evento)) return;
    // Sem isso, o Chrome mostra a barra dele na hora; a pessoa instala quando quiser, pelo botão de Minha casa.
    evento.preventDefault();
    pedidoGuardado = evento;
    avisarTodos();
  };
  const aoInstalar = () => {
    pedidoGuardado = undefined;
    avisarTodos();
  };
  window.addEventListener("beforeinstallprompt", aoPedir);
  window.addEventListener("appinstalled", aoInstalar);
  return () => {
    window.removeEventListener("beforeinstallprompt", aoPedir);
    window.removeEventListener("appinstalled", aoInstalar);
  };
}

export function assinarInstalacao(avisar: () => void): () => void {
  ouvintes.add(avisar);
  return () => ouvintes.delete(avisar);
}
export const podeInstalarAgora = () => pedidoGuardado !== undefined;
export const naoPodeInstalarNoServidor = () => false;

/** Abre a janela "Instalar" do navegador. O pedido só vale uma vez. */
export async function pedirInstalacao(): Promise<void> {
  const pedido = pedidoGuardado;
  if (!pedido) return;
  pedidoGuardado = undefined;
  avisarTodos();
  await pedido.prompt();
}

/* Aberto como aplicativo (pela tela inicial): `display-mode: standalone`. */
const COMO_APLICATIVO = "(display-mode: standalone)";
export function assinarModoDeExibicao(avisar: () => void): () => void {
  const lista = window.matchMedia(COMO_APLICATIVO);
  lista.addEventListener("change", avisar);
  return () => lista.removeEventListener("change", avisar);
}
export const abertoComoAplicativo = () => window.matchMedia(COMO_APLICATIVO).matches;
export const naoAbertoComoAplicativoNoServidor = () => false;
