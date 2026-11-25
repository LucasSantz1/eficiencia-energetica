/**
 * O navegador falando com as rotas /api do próprio site (E4, ADR-007). Nunca com o Supabase: a CSP (`connect-src
 * 'self'`) nem deixaria. O cookie da sessão vai sozinho (HttpOnly; esta página não o lê). Nunca lança: falha de rede
 * vira `status: 0`.
 */
export interface RespostaDaApi {
  status: number;
  corpo: Record<string, unknown>;
}

export async function pedirApi(caminho: string, metodo: "GET" | "POST" | "PUT" | "DELETE" = "GET", corpo?: Record<string, unknown>): Promise<RespostaDaApi> {
  try {
    const resposta = await fetch(caminho, {
      method: metodo,
      credentials: "same-origin",
      cache: "no-store",
      headers: corpo ? { "Content-Type": "application/json" } : undefined,
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
    const lido: unknown = await resposta.json().catch(() => ({}));
    return { status: resposta.status, corpo: typeof lido === "object" && lido !== null && !Array.isArray(lido) ? Object.fromEntries(Object.entries(lido)) : {} };
  } catch {
    return { status: 0, corpo: {} };
  }
}
