import type { NextRequest } from "next/server";
import { entrar } from "@/aplicacao/conta.servidor";
import { responder } from "@/app/api/_http/responder.servidor";

/** Entrar com e-mail e senha; grava o cookie cifrado da sessão. */
export const POST = (pedido: NextRequest) => responder(pedido, (ctx, _cookie, corpo) => entrar(ctx, corpo));
