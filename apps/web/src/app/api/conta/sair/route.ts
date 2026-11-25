import type { NextRequest } from "next/server";
import { sair } from "@/aplicacao/conta.servidor";
import { responder } from "@/app/api/_http/responder.servidor";

/** Sair: o Supabase invalida a sessão e o cookie sai deste aparelho. */
export const POST = (pedido: NextRequest) => responder(pedido, (ctx, cookie) => sair(ctx, cookie));
