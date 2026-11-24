import type { NextConfig } from "next";

/**
 * CSP sem nonce (que obrigaria toda página a ser dinâmica, contra "internet fraca" e custo zero). Por isso
 * `'unsafe-inline'` em script e estilo: o Next põe o conteúdo da página em scripts inline (`self.__next_f.push`), que
 * mudam a cada página e a cada revalidação da `/`; hash e `experimental.sri` não os cobrem (provado na HIS-117).
 * `script-src-attr 'none'` fecha o caminho mais comum de XSS (`<img onerror=...>`): nem o React nem o Next usam
 * atributo de evento no HTML. NUNCA pôr hash ou nonce no `script-src` junto com `'unsafe-inline'`: o navegador passa a
 * ignorar o `'unsafe-inline'` e o site para de funcionar (HIS-117; o csp.spec reprova). Estilo: o React vira
 * `style="..."` e o `global-error` usa `<style>`. Tudo é `'self'`: nada sai do aparelho para terceiros (A10). Domínio
 * novo aqui = revisão da seguranca. `'unsafe-eval'` só no `next dev`, que precisa dele; o build de produção, não.
 */
const POLITICA_DE_CONTEUDO = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

/** Os 7 cabeçalhos de segurança (critério 1; tabela da seguranca na HIS-003a). */
const CABECALHOS_DE_SEGURANCA = [
  { key: "Content-Security-Policy", value: POLITICA_DE_CONTEUDO },
  // Sem `preload` até o site ter domínio próprio.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Câmera, microfone e localização desligados por enquanto; o OCR futuro não precisa de `camera` (usa <input capture>).
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  // Para navegador antigo que ignora `frame-ancestors`.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const config: NextConfig = {
  // O pacote @ee/core é TypeScript puro dentro do monorepo; o Next compila junto.
  transpilePackages: ["@ee/core"],
  poweredByHeader: false,
  async headers() {
    return [
      // Vale para páginas, /dados, /_next/static e a 404.
      { source: "/:caminho*", headers: CABECALHOS_DE_SEGURANCA },
      {
        // Os dados da ANEEL mudam no máximo uma vez por dia. Chave diferente: o Next aplica as duas regras.
        source: "/dados/:caminho*",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default config;
