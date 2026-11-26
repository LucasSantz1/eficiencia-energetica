import type { NextRequest } from "next/server";
import { sair } from "@/aplicacao/conta.servidor";
import { responder } from "@/app/api/_http/responder.servidor";

// Funções na região de São Paulo, perto do Supabase e da família (B9 da seguranca; LGPD: dados no Brasil).
export const preferredRegion = "gru1";

/** Sair: o Supabase invalida a sessão e o cookie sai deste aparelho. `{ todos: true }`: de todos os aparelhos. */
export const POST = (pedido: NextRequest) => responder(pedido, (ctx, cookie, corpo) => sair(ctx, cookie, corpo));
