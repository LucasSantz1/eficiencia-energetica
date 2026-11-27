import "server-only"; // primeiro import: só as rotas de /api usam (ADR-007)
import { NextResponse, type NextRequest } from "next/server";
import { ATRIBUTOS_DO_COOKIE, contextoReal, NOME_DO_COOKIE, type Contexto, type RespostaDaConta } from "@/aplicacao/conta.servidor";

/** Teto do corpo: a casa cabe com folga (o banco aceita até 500 kB); mais que isso é abuso. */
const TAMANHO_MAXIMO_DO_CORPO = 600_000;

type Acao = (ctx: Contexto, cookie: string | undefined, corpo: Record<string, unknown>) => Promise<RespostaDaConta>;

function json(resposta: RespostaDaConta): NextResponse {
  // 204 não pode ter corpo (a contagem de uso responde assim).
  const saida =
    resposta.status === 204
      ? new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } })
      : NextResponse.json(resposta.corpo, { status: resposta.status, headers: { "Cache-Control": "no-store" } });
  if (resposta.cookie?.tipo === "gravar") saida.cookies.set(NOME_DO_COOKIE, resposta.cookie.valor, ATRIBUTOS_DO_COOKIE);
  if (resposta.cookie?.tipo === "apagar") saida.cookies.set(NOME_DO_COOKIE, "", { ...ATRIBUTOS_DO_COOKIE, maxAge: 0 });
  return saida;
}

/**
 * Toda rota de /api passa por aqui (ADR-007):
 * - pedido que muda algo só vem deste site: o `Origin` tem de ser o nosso (com o SameSite=Lax do cookie, fecha CSRF);
 * - corpo só JSON, objeto, até 600 kB;
 * - resposta sempre `no-store` (nada de conta em cache de navegador ou de CDN) e erro sem detalhe interno.
 */
/**
 * O endereço do site como o navegador o vê: na Vercel, `x-forwarded-host`/`-proto` (postos por ela); no `next start`,
 * o `Host`. O navegador não deixa uma página de outro site forjar esse cabeçalho, então comparar com o `Origin` fecha
 * CSRF. (O `nextUrl.origin` não serve: no `next start` ele vira "localhost" mesmo com o pedido para 127.0.0.1.)
 */
function enderecoDoSite(pedido: NextRequest): string {
  const host = pedido.headers.get("x-forwarded-host") ?? pedido.headers.get("host") ?? pedido.nextUrl.host;
  const protocolo = pedido.headers.get("x-forwarded-proto") ?? pedido.nextUrl.protocol.replace(":", "");
  return `${protocolo}://${host}`;
}

/**
 * O IP de quem pediu (ADR-008). Na Vercel, `x-real-ip` e o primeiro item de `x-forwarded-for` são postos pela própria
 * Vercel (ela sobrescreve o que o navegador mandar). Só serve para contar tentativas; nunca é guardado nem logado.
 * ATENÇÃO: só vale na Vercel. Em outro host, ou atrás de outro proxy, o navegador escolhe esse cabeçalho e o limite
 * por IP deixa de valer (o por e-mail continua). Mudar de host pede rever isto (B4 da seguranca).
 */
function ipDe(pedido: NextRequest): string | undefined {
  const ip = pedido.headers.get("x-real-ip") ?? pedido.headers.get("x-forwarded-for")?.split(",")[0];
  const limpo = ip?.trim();
  return limpo && limpo.length <= 64 ? limpo : undefined;
}

export async function responder(pedido: NextRequest, acao: Acao): Promise<NextResponse> {
  const muda = pedido.method !== "GET";
  const site = enderecoDoSite(pedido);
  if (muda && pedido.headers.get("origin") !== site) return json({ status: 403, corpo: { erro: "origem" } });
  let corpo: Record<string, unknown> = {};
  if (muda) {
    if (!(pedido.headers.get("content-type") ?? "").startsWith("application/json")) return json({ status: 415, corpo: { erro: "formato" } });
    const texto = await pedido.text();
    if (texto.length > TAMANHO_MAXIMO_DO_CORPO) return json({ status: 413, corpo: { erro: "grande" } });
    try {
      const lido: unknown = JSON.parse(texto);
      if (typeof lido !== "object" || lido === null || Array.isArray(lido)) return json({ status: 400, corpo: { erro: "formato" } });
      corpo = Object.fromEntries(Object.entries(lido));
    } catch {
      return json({ status: 400, corpo: { erro: "formato" } });
    }
  }
  try {
    // Os links dos e-mails usam o endereço fixo, quando há (B1 da seguranca): nunca o Host que veio no pedido.
    const enderecoFixo = process.env.ENDERECO_DO_SITE?.trim().replace(/\/$/, "");
    return json(await acao(contextoReal(enderecoFixo || site, ipDe(pedido)), pedido.cookies.get(NOME_DO_COOKIE)?.value, corpo));
  } catch {
    // Nada vai para o log nem para a tela: o erro do Supabase pode trazer o e-mail.
    return json({ status: 502, corpo: { erro: "indisponivel" } });
  }
}
