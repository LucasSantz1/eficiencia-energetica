import "server-only"; // primeiro import: lê segredos do ambiente, nunca vai para o navegador (ADR-001, ADR-007)

/**
 * Configuração da conta (E4). Os três valores ficam só nas variáveis de ambiente da Vercel, sem `NEXT_PUBLIC_`: o
 * navegador nunca os vê. Sem eles, a conta fica desligada e o site funciona como antes (só no aparelho).
 * - SUPABASE_URL e SUPABASE_ANON_KEY: o projeto do Supabase. A chave é a pública: a "publishable" (`sb_publishable_…`,
 *   a dos projetos novos) ou a "anon" antiga. É pública por natureza, mas mesmo assim fica no servidor: o navegador só
 *   fala com o nosso site (CSP `connect-src 'self'`). A chave secreta (`sb_secret_…` ou a `service_role`) passa por
 *   cima da RLS e NUNCA entra aqui: se alguém colar uma delas por engano, a conta fica desligada.
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
  if (eChaveSecreta(chave)) return undefined;
  const bytes = Buffer.from(segredo, "base64");
  if (bytes.length < 32) return undefined;
  return { urlDoSupabase: url.replace(/\/$/, ""), chaveAnonima: chave, segredoDaSessao: new Uint8Array(bytes) };
}

/**
 * A chave secreta do Supabase ignora a RLS: com ela, uma pessoa leria a casa de outra. Recusa as duas formas: a nova
 * (`sb_secret_…`) e a antiga, um JWT com `"role": "service_role"` (docs do Supabase, "API keys").
 */
function eChaveSecreta(chave: string): boolean {
  if (chave.startsWith("sb_secret_")) return true;
  const partes = chave.split(".");
  if (partes.length !== 3 || partes[1] === undefined) return false;
  try {
    const conteudo: unknown = JSON.parse(Buffer.from(partes[1], "base64url").toString("utf8"));
    return typeof conteudo === "object" && conteudo !== null && Reflect.get(conteudo, "role") === "service_role";
  } catch {
    return false;
  }
}
