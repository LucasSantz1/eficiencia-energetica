import type { NextRequest } from "next/server";
import { apagarConvite, criarConvite, listarConvites } from "@/aplicacao/conta.servidor";
import { responder } from "@/app/api/_http/responder.servidor";

// Funções na região de São Paulo, perto do Supabase e da família (B9 da seguranca; LGPD: dados no Brasil).
export const preferredRegion = "gru1";

/** Os links de convidado do dono: listar, criar (o código volta uma vez) e apagar. */
export const GET = (pedido: NextRequest) => responder(pedido, (ctx, cookie) => listarConvites(ctx, cookie));
export const POST = (pedido: NextRequest) => responder(pedido, (ctx, cookie, corpo) => criarConvite(ctx, cookie, corpo));
export const DELETE = (pedido: NextRequest) => responder(pedido, (ctx, cookie, corpo) => apagarConvite(ctx, cookie, corpo));
