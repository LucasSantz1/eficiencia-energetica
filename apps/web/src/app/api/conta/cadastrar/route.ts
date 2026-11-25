import type { NextRequest } from "next/server";
import { cadastrar } from "@/aplicacao/conta.servidor";
import { responder } from "@/app/api/_http/responder.servidor";

/** Criar conta com e-mail e senha; o Supabase manda o link de confirmação. */
export const POST = (pedido: NextRequest) => responder(pedido, (ctx, _cookie, corpo) => cadastrar(ctx, corpo));
