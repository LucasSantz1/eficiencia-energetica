/*
 * Cabeçalhos de segurança (HIS-003a, critério 1; R1 da seguranca; D8). Os valores estão escritos aqui, à mão, e não
 * importados do `next.config.ts`: se alguém mudar a configuração, este teste reprova e a mudança passa pela
 * seguranca. Vale para página, 404, `/dados` e `/_next/static`. Não depende da largura: roda uma vez (celular).
 */
import { expect, test } from "./apoio/teste";

const CSP =
  "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; " +
  "font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; " +
  "form-action 'self'; frame-ancestors 'none'";

const CABECALHOS: Record<string, string> = {
  "content-security-policy": CSP,
  "strict-transport-security": "max-age=63072000; includeSubDomains",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  "x-frame-options": "DENY",
  "cross-origin-opener-policy": "same-origin",
};

test("os 7 cabeçalhos de segurança, com o valor exato, em página, 404, /dados e /_next/static", async ({ request }) => {
  const html = await (await request.get("/")).text();
  const script = html.match(/<script[^>]*\ssrc="(\/_next\/static\/[^"]+\.js)"/)?.[1];
  expect(script, "a / referencia algum JS de /_next/static").toBeTruthy();

  const caminhos: [string, number][] = [
    ["/", 200],
    ["/casa", 200],
    ["/sobre", 200],
    ["/dados/tarifas.json", 200],
    [script ?? "/_next/static/sem-script.js", 200],
    ["/nao-existe", 404],
  ];
  for (const [caminho, status] of caminhos) {
    const resposta = await request.get(caminho, { maxRedirects: 0 });
    expect.soft(resposta.status(), `status de ${caminho}`).toBe(status);
    const recebidos = resposta.headers();
    for (const [nome, valor] of Object.entries(CABECALHOS)) expect.soft(recebidos[nome], `${nome} em ${caminho}`).toBe(valor);
    expect.soft(recebidos["content-security-policy"] ?? "", `CSP sem unsafe-eval em ${caminho}`).not.toContain("unsafe-eval");
    expect.soft(recebidos["x-powered-by"], `x-powered-by em ${caminho}`).toBeUndefined();
  }
});

test("/dados continua com o cache de 1 hora (a regra própria não some com os cabeçalhos novos)", async ({ request }) => {
  const resposta = await request.get("/dados/tarifas.json");
  expect(resposta.headers()["cache-control"]).toBe("public, max-age=3600, stale-while-revalidate=86400");
});
