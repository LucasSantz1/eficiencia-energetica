import "server-only"; // primeiro import: lê segredos do ambiente, nunca vai para o navegador (ADR-001, ADR-007)

/**
 * Configuração da conta (E4). Os três valores ficam só nas variáveis de ambiente da Vercel, sem `NEXT_PUBLIC_`: o
 * navegador nunca os vê. Sem eles, a conta fica desligada e o site funciona como antes (só no aparelho).
 * - SUPABASE_URL e SUPABASE_ANON_KEY: o projeto do Supabase. A chave "anon" é pública por natureza, mas mesmo assim
 *   fica no servidor: o navegador só fala com o nosso site (CSP `connect-src 'self'`). A `service_role` NUNCA entra aqui.
 * - SESSAO_SEGREDO: 32 bytes aleatórios (base64), para cifrar o cookie da sessão.
 */
export interface ConfiguracaoDaConta {
  urlDoSupabase: string;
  chaveAnonima: string;
  segredoDaSessao: Uint8Array;
}

export function configuracaoDaConta(): ConfiguracaoDaConta | undefined {
  const url = process.env.SUPABASE_URL?.trim();
  const chave = process.env.SUPABASE_ANON_KEY?.trim();
  const segredo = process.env.SESSAO_SEGREDO?.trim();
  if (!url || !chave || !segredo) return undefined;
  // Só https (ou localhost nos testes): a senha da pessoa passa por aqui.
  if (!/^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)+\/?$/i.test(url) && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/.test(url)) return undefined;
  const bytes = Buffer.from(segredo, "base64");
  if (bytes.length < 32) return undefined;
  return { urlDoSupabase: url.replace(/\/$/, ""), chaveAnonima: chave, segredoDaSessao: new Uint8Array(bytes) };
}
