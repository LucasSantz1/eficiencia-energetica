/*
 * Service worker do Eficiência Energética (HIS-301). Escrito à mão, sem biblioteca (ADR-006): é pequeno, dá para ler
 * inteiro numa revisão e não traz dependência de build.
 *
 * O que ele guarda, e só isso: as páginas do site (todas estáticas, sem dado da pessoa), os arquivos de /_next/static
 * (nome com hash, nunca mudam), os ícones e os arquivos públicos de /dados (preços da ANEEL e cidades). A casa da
 * pessoa continua só no localStorage; o service worker nunca a lê. Nada vai para terceiros: só pedidos GET do
 * próprio site passam por aqui.
 *
 * Estratégias:
 * - Páginas e /dados: primeiro a rede, com um tempo máximo (internet fraca); sem resposta a tempo, a cópia guardada.
 * - /_next/static e ícones: primeiro a cópia guardada (o nome muda quando o conteúdo muda).
 * - Pedidos de navegação dentro do site (RSC, `?_rsc=`) seguem direto para a rede: se falharem, o Next abre a página
 *   inteira, e aí a cópia guardada responde.
 */

// Trocar a versão apaga as cópias antigas na ativação.
const VERSAO = "v1";
const PAGINAS = `paginas-${VERSAO}`;
const ARQUIVOS = `arquivos-${VERSAO}`;
const DADOS = `dados-${VERSAO}`;
const CACHES_DESTA_VERSAO = [PAGINAS, ARQUIVOS, DADOS];

/** Páginas guardadas já na instalação, para o site abrir sem internet mesmo nas telas que a pessoa ainda não abriu. */
const PAGINAS_DO_SITE = ["/", "/comecar", "/casa", "/casa/comodos", "/casa/dicas", "/casa/ajustes", "/tarifa-social", "/sobre"];
const DADOS_INICIAIS = ["/dados/tarifas.json"];

/** Celular com 3G fraco: depois disso, a cópia guardada responde (e a rede, se chegar, atualiza a cópia). */
const TEMPO_MAXIMO_DA_REDE_MS = 4000;

/** Arquivos que cada página usa (`/_next/static/...`), lidos do próprio HTML. Para no `"`, no `'` e no `\`. */
const ARQUIVO_DO_NEXT = /\/_next\/static\/[A-Za-z0-9_\-./~%]+/g;

self.addEventListener("install", (evento) => {
  evento.waitUntil(guardarOSite().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((nome) => !CACHES_DESTA_VERSAO.includes(nome)).map((nome) => caches.delete(nome))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;
  if (pedido.method !== "GET") return;
  const url = new URL(pedido.url);
  if (url.origin !== self.location.origin) return;
  if (url.searchParams.has("_rsc") || pedido.headers.get("RSC") === "1") return;

  if (url.pathname.startsWith("/_next/static/")) {
    evento.respondWith(primeiroAGuardada(pedido, ARQUIVOS));
  } else if (url.pathname.startsWith("/dados/")) {
    evento.respondWith(primeiroARede(evento, pedido, DADOS, pedido).then((resposta) => resposta ?? Response.error()));
  } else if (pedido.mode === "navigate") {
    // A página é a mesma com qualquer ?visao= ou #comodo-id: a tela lê o endereço no navegador.
    evento.respondWith(primeiroARede(evento, pedido, PAGINAS, url.origin + url.pathname).then((resposta) => resposta ?? paginaSemInternet()));
  } else if (/\.(png|svg|ico|webmanifest)$/.test(url.pathname) || url.pathname === "/manifest.webmanifest") {
    evento.respondWith(primeiroAGuardada(pedido, ARQUIVOS));
  }
});

/** Só guarda resposta completa do próprio site: nada de erro, de redirecionamento nem de resposta opaca. */
function podeGuardar(resposta) {
  return resposta.ok && resposta.type === "basic" && !resposta.redirected;
}

async function guardarOSite() {
  const paginas = await caches.open(PAGINAS);
  const arquivos = await caches.open(ARQUIVOS);
  const dados = await caches.open(DADOS);
  const doHtml = new Set();
  await Promise.allSettled(
    PAGINAS_DO_SITE.map(async (caminho) => {
      const resposta = await fetch(caminho, { cache: "reload" });
      if (!podeGuardar(resposta)) return;
      const html = await resposta.clone().text();
      for (const arquivo of html.match(ARQUIVO_DO_NEXT) ?? []) doHtml.add(arquivo);
      await paginas.put(caminho, resposta);
    }),
  );
  await Promise.allSettled([...doHtml].map((arquivo) => guardarSeVier(arquivos, arquivo)));
  await Promise.allSettled(DADOS_INICIAIS.map((arquivo) => guardarSeVier(dados, arquivo)));
}

async function guardarSeVier(cache, caminho) {
  const resposta = await fetch(caminho);
  if (podeGuardar(resposta)) await cache.put(caminho, resposta);
}

async function primeiroAGuardada(pedido, nomeDoCache) {
  const cache = await caches.open(nomeDoCache);
  const guardada = await cache.match(pedido);
  if (guardada) return guardada;
  const resposta = await fetch(pedido);
  if (podeGuardar(resposta)) await cache.put(pedido, resposta.clone());
  return resposta;
}

/**
 * Pede à rede e guarda a resposta. Se a rede falhar ou demorar mais que o tempo máximo, responde com a cópia guardada;
 * sem cópia, espera a rede (ou devolve `undefined` na falha, para quem chamou decidir).
 */
async function primeiroARede(evento, pedido, nomeDoCache, chave) {
  const cache = await caches.open(nomeDoCache);
  const daRede = fetch(pedido).then(async (resposta) => {
    if (podeGuardar(resposta)) await cache.put(chave, resposta.clone());
    return resposta;
  });
  // A rede que chegar depois do tempo máximo ainda atualiza a cópia.
  evento.waitUntil(daRede.catch(() => undefined));
  const tempoEsgotado = new Promise((resolver) => setTimeout(resolver, TEMPO_MAXIMO_DA_REDE_MS, "tempo"));
  const primeira = await Promise.race([daRede.catch(() => "falhou"), tempoEsgotado]);
  if (primeira instanceof Response) return primeira;
  const guardada = await cache.match(chave);
  if (guardada) return guardada;
  return primeira === "tempo" ? daRede.catch(() => undefined) : undefined;
}

/** Página que nunca foi guardada e a internet caiu: um aviso curto, em vez da tela de erro do navegador. */
function paginaSemInternet() {
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Sem internet · Eficiência Energética</title><style>body{font-family:system-ui,sans-serif;background:#f2f2f7;color:#14213d;margin:0;padding:2rem 1rem;font-size:1.15rem;line-height:1.5}main{max-width:32rem;margin:0 auto}a{display:inline-block;margin-top:1rem;padding:.75rem 1.25rem;border-radius:.75rem;background:#0a7356;color:#fff;font-weight:700;text-decoration:none}</style></head><body><main><h1>Você está sem internet.</h1><p>Esta página ainda não tinha sido aberta neste celular. A sua casa continua salva.</p><a href="/casa">Abrir minha casa</a></main></body></html>`;
  return new Response(html, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
