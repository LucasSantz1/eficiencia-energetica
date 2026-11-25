import type { NextRequest } from "next/server";
import { gravarCasa, lerCasa } from "@/aplicacao/conta.servidor";
import { responder } from "@/app/api/_http/responder.servidor";

// Funções na região de São Paulo, perto do Supabase e da família (B9 da seguranca; LGPD: dados no Brasil).
export const preferredRegion = "gru1";

/** A casa guardada na conta (sincronização entre aparelhos). */
export const GET = (pedido: NextRequest) => responder(pedido, (ctx, cookie) => lerCasa(ctx, cookie));
export const PUT = (pedido: NextRequest) => responder(pedido, (ctx, cookie, corpo) => gravarCasa(ctx, cookie, corpo));
