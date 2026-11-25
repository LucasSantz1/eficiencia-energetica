import type { NextRequest } from "next/server";
import { apagarConta } from "@/aplicacao/conta.servidor";
import { responder } from "@/app/api/_http/responder.servidor";

// Funções na região de São Paulo, perto do Supabase e da família (B9 da seguranca; LGPD: dados no Brasil).
export const preferredRegion = "gru1";

/** Apagar a conta, a casa e os links de convidado (LGPD). */
export const POST = (pedido: NextRequest) => responder(pedido, (ctx, cookie) => apagarConta(ctx, cookie));
