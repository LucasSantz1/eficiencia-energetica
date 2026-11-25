import type { NextRequest } from "next/server";
import { trocarSenhaPeloLink } from "@/aplicacao/conta.servidor";
import { responder } from "@/app/api/_http/responder.servidor";

/** O link de "esqueci a senha" com a senha nova. */
export const POST = (pedido: NextRequest) => responder(pedido, (ctx, _cookie, corpo) => trocarSenhaPeloLink(ctx, corpo));
