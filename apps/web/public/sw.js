/*
 * Service worker do Eficiência Energética (HIS-301). Escrito à mão, sem biblioteca (ADR-006): é pequeno, dá para ler
 * inteiro numa revisão e não traz dependência de build. Passa pelo lint com a sintaxe proibida do site, sem
 * importScripts e sem comentário que desliga regra (bloco "projeto/public" do eslint.config.mjs).
 *
 * O que ele guarda, e só isso: as páginas do site (todas estáticas, sem dado da pessoa), os arquivos de /_next/static
 * (nome com hash, nunca mudam), os ícones e os arquivos públicos de /dados (preços da ANEEL e cidades). A casa da
 * pessoa continua só no localStorage; o service worker nunca a lê. Nada vai para terceiros: só pedidos GET do
 * próprio site passam por aqui, e resposta marcada como pessoal (no-store, private, Set-Cookie) nunca é guardada.
 *
 * Estratégias:
 * - Páginas, /dados, ícones e manifest: primeiro a rede, com um tempo máximo (internet fraca); sem resposta boa a
 *   tempo, a cópia guardada.
 * - /_next/static: primeiro a cópia guardada (o nome muda quando o conteúdo muda).
 * - Pedidos de navegação dentro do site (RSC, `?_rsc=`) seguem direto para a rede: se falharem, o Next abre a página
 *   inteira, e aí a cópia guardada responde.
 *
 * A casa salva por uma versão mais nova do site não é regravada por uma página antiga daqui (A1 da seguranca): quem
 * cuida disso é o armazenamento do site (`casaDeVersaoMaisNova`). Mudar VERSAO_DA_CASA conta com essa trava.
 */

// Trocar a versão apaga as cópias antigas na ativação. Troque a cada mudança grande do site (ADR-006).
const VERSAO = "v1";
const PAGINAS = `paginas-${VERSAO}`;
const ARQUIVOS = `arquivos-${VERSAO}`;
const DADOS = `dados-${VERSAO}`;
const CACHES_DESTA_VERSAO = [PAGINAS, ARQUIVOS, DADOS];

/** Páginas guardadas já na instalação, para o site abrir sem internet mesmo nas telas que a pessoa ainda não abriu. */
const PAGINAS_DO_SITE = ["/", "/comecar", "/casa", "/casa/comodos", "/casa/dicas", "/casa/ajustes", "/casa/antes-de-comprar", "/tarifa-social", "/sobre", "/privacidade", "/termos"];
const DADOS_INICIAIS = ["/dados/tarifas.json"];
/** Arquivos sem hash que toda tela usa: o desenho dos ícones (as telas citam por <use href>, que o HTML não lista). */
const ARQUIVOS_INICIAIS = ["/icones-v1.svg"];

/** Celular com 3G fraco: depois disso, a cópia guardada responde (e a rede, se chegar, atualiza a cópia). */
const TEMPO_MAXIMO_DA_REDE_MS = 4000;

/** Arquivos que o HTML cita (`/_next/static/...`). Para no `"`, no `'` e no `\`. */
const ARQUIVO_NO_HTML = /\/_next\/static\/[A-Za-z0-9_\-./~%]+/g;
/** Arquivos que um JS do Next carrega depois (`"static/chunks/x.js"`, ex.: as perguntas do "Não sei qual é o meu"). */
const ARQUIVO_NO_JS = /["']static\/(?:chunks|media)\/[A-Za-z0-9_\-./~%]+["']/g;
/**
 * Fontes que o CSS cita (`url(../media/x.woff2)`). Só o pedaço "latin" (português), não latin-ext, cirílico etc.:
 * os outros só baixam se a página tiver esses caracteres (QA da Sprint 3, D-S3-5: o título da / perdia a Archivo).
 */
const FONTE_NO_CSS = /url\(\.\.\/media\/([A-Za-z0-9_\-.~%]*-latin-(?!ext)[A-Za-z0-9_\-.~%]*\.woff2)\)/g;
/** Teto de arquivos por página, contra um HTML estranho que cite milhares. */
const MAXIMO_DE_ARQUIVOS = 300;

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
    evento.respondWith(primeiroAGuardada(pedido));
  } else if (url.pathname.startsWith("/dados/")) {
    evento.respondWith(primeiroARede(evento, pedido, DADOS, pedido, jsonQueAbre).then((resposta) => resposta ?? Response.error()));
  } else if (pedido.mode === "navigate") {
    // A página é a mesma com qualquer ?visao= ou #comodo-id: a tela lê o endereço no navegador.
    const chave = url.origin + url.pathname;
    evento.respondWith(primeiroARede(evento, pedido, PAGINAS, chave, htmlComArquivos(evento)).then((resposta) => resposta ?? paginaSemInternet()));
  } else if (/\.(png|svg|ico|webmanifest)$/.test(url.pathname) || url.pathname === "/manifest.webmanifest") {
    // Sem hash no nome: primeiro a rede, para um ícone novo chegar (B5 da seguranca).
    evento.respondWith(primeiroARede(evento, pedido, ARQUIVOS, pedido).then((resposta) => resposta ?? Response.error()));
  }
});

/**
 * Só guarda resposta completa do próprio site: nada de erro, de redirecionamento, de resposta opaca nem de resposta
 * marcada como pessoal. Hoje nenhuma é pessoal; com conta e login (E4), uma página da pessoa nunca fica no celular
 * para outra pessoa ver (B2 da seguranca).
 */
function podeGuardar(resposta) {
  if (!resposta.ok || resposta.type !== "basic" || resposta.redirected) return false;
  const cache = (resposta.headers.get("Cache-Control") ?? "").toLowerCase();
  return !/\b(no-store|private)\b/.test(cache) && !resposta.headers.has("Set-Cookie");
}

async function guardarOSite() {
  const paginas = await caches.open(PAGINAS);
  const dados = await caches.open(DADOS);
  await Promise.allSettled(
    PAGINAS_DO_SITE.map(async (caminho) => {
      const resposta = await fetch(caminho, { cache: "reload" });
      if (!podeGuardar(resposta)) return;
      await guardarArquivosDaPagina(await resposta.clone().text());
      await paginas.put(caminho, resposta);
    }),
  );
  const arquivos = await caches.open(ARQUIVOS);
  await Promise.allSettled(
    ARQUIVOS_INICIAIS.map(async (caminho) => {
      const resposta = await fetch(caminho, { cache: "reload" });
      if (podeGuardar(resposta)) await arquivos.put(caminho, resposta);
    }),
  );
  await Promise.allSettled(
    DADOS_INICIAIS.map(async (caminho) => {
      const resposta = await fetch(caminho);
      if (podeGuardar(resposta) && (await jsonQueAbre(resposta.clone()))) await dados.put(caminho, resposta);
    }),
  );
}

/**
 * Guarda os arquivos que a página cita e os que esses arquivos carregam depois (M1 da seguranca: sem isso, as
 * perguntas do "Não sei qual é o meu" não abriam sem internet). Os que já estão guardados não baixam de novo.
 */
async function guardarArquivosDaPagina(html) {
  const arquivos = await caches.open(ARQUIVOS);
  const vistos = new Set();
  let fila = [...new Set(html.match(ARQUIVO_NO_HTML) ?? [])];
  while (fila.length > 0 && vistos.size < MAXIMO_DE_ARQUIVOS) {
    const proximos = [];
    await Promise.allSettled(
      fila.map(async (caminho) => {
        if (vistos.has(caminho)) return;
        vistos.add(caminho);
        let resposta = await arquivos.match(caminho);
        if (!resposta) {
          resposta = await fetch(caminho);
          if (!podeGuardar(resposta)) return;
          await arquivos.put(caminho, resposta.clone());
        }
        if (caminho.endsWith(".css")) {
          for (const [, fonte] of (await resposta.text()).matchAll(FONTE_NO_CSS)) proximos.push(`/_next/static/media/${fonte}`);
          return;
        }
        if (!caminho.endsWith(".js")) return;
        for (const citado of (await resposta.text()).match(ARQUIVO_NO_JS) ?? []) proximos.push(`/_next/${citado.slice(1, -1)}`);
      }),
    );
    fila = proximos.filter((caminho) => !vistos.has(caminho));
  }
}

async function primeiroAGuardada(pedido) {
  const cache = await caches.open(ARQUIVOS);
  const guardada = await cache.match(pedido);
  if (guardada) return guardada;
  const resposta = await fetch(pedido);
  if (podeGuardar(resposta)) await cache.put(pedido, resposta.clone());
  return resposta;
}

/** /dados: só guarda JSON que abre, para um arquivo quebrado não tomar o lugar da cópia boa (B4 da seguranca). */
async function jsonQueAbre(resposta) {
  if (!(resposta.headers.get("Content-Type") ?? "").includes("json")) return false;
  try {
    JSON.parse(await resposta.text());
    return true;
  } catch {
    return false;
  }
}

/** Página nova que chega da rede: guarda junto os arquivos dela, para ela abrir sem internet depois (M1). */
function htmlComArquivos(evento) {
  return async (resposta) => {
    evento.waitUntil(resposta.text().then(guardarArquivosDaPagina).catch(() => undefined));
    return true;
  };
}

/**
 * Pede à rede e guarda a resposta boa. Se a rede falhar, demorar mais que o tempo máximo ou responder com erro (500),
 * responde com a cópia guardada; sem cópia, devolve o que a rede der (ou `undefined` na falha, para quem chamou
 * decidir). `aceitar` confere o conteúdo antes de guardar.
 */
async function primeiroARede(evento, pedido, nomeDoCache, chave, aceitar = async () => true) {
  const cache = await caches.open(nomeDoCache);
  const daRede = fetch(pedido).then(async (resposta) => {
    if (podeGuardar(resposta) && (await aceitar(resposta.clone()))) await cache.put(chave, resposta.clone());
    return resposta;
  });
  // A rede que chegar depois do tempo máximo ainda atualiza a cópia.
  evento.waitUntil(daRede.catch(() => undefined));
  const tempoEsgotado = new Promise((resolver) => setTimeout(resolver, TEMPO_MAXIMO_DA_REDE_MS, "tempo"));
  const primeira = await Promise.race([daRede.catch(() => "falhou"), tempoEsgotado]);
  if (primeira instanceof Response && primeira.ok) return primeira;
  const guardada = await cache.match(chave);
  if (guardada) return guardada;
  if (primeira instanceof Response) return primeira;
  return primeira === "tempo" ? daRede.catch(() => undefined) : undefined;
}

/**
 * Página que nunca foi guardada e a internet caiu: um aviso curto, em vez da tela de erro do navegador. Não repete
 * nada do endereço e não tem script; os cabeçalhos fecham o resto (B1 da seguranca).
 */
function paginaSemInternet() {
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Sem internet · Eficiência Energética</title><style>body{font-family:system-ui,sans-serif;background:#f2f2f7;color:#14213d;margin:0;padding:2rem 1rem;font-size:1.15rem;line-height:1.5}main{max-width:32rem;margin:0 auto}a{display:inline-block;margin-top:1rem;padding:.75rem 1.25rem;border-radius:.75rem;background:#0a7356;color:#fff;font-weight:700;text-decoration:none}</style></head><body><main><h1>Você está sem internet.</h1><p>Esta página ainda não tinha sido aberta neste aparelho. A sua casa continua salva.</p><a href="/casa">Abrir minha casa</a></main></body></html>`;
  return new Response(html, {
    status: 503,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  });
}
