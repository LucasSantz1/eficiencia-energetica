import type { NextRequest } from "next/server";
import { estado } from "@/aplicacao/conta.servidor";
import { responder } from "@/app/api/_http/responder.servidor";

// Funções na região de São Paulo, perto do Supabase e da família (B9 da seguranca; LGPD: dados no Brasil).
export const preferredRegion = "gru1";

/** Se há conta ligada neste site e quem está nela (só o e-mail, para a tela). */
export const GET = (pedido: NextRequest) => responder(pedido, (ctx, cookie) => estado(ctx, cookie));
