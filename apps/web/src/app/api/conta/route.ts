import type { NextRequest } from "next/server";
import { estado } from "@/aplicacao/conta.servidor";
import { responder } from "@/app/api/_http/responder.servidor";

/** Se há conta ligada neste site e quem está nela (só o e-mail, para a tela). */
export const GET = (pedido: NextRequest) => responder(pedido, (ctx, cookie) => estado(ctx, cookie));
