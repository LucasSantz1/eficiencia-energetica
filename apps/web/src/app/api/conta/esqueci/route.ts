import type { NextRequest } from "next/server";
import { pedirNovaSenha } from "@/aplicacao/conta.servidor";
import { responder } from "@/app/api/_http/responder.servidor";

/** Esqueci a senha: o Supabase manda o link para criar outra. */
export const POST = (pedido: NextRequest) => responder(pedido, (ctx, _cookie, corpo) => pedirNovaSenha(ctx, corpo));
