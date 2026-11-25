import type { NextRequest } from "next/server";
import { confirmarEmail } from "@/aplicacao/conta.servidor";
import { responder } from "@/app/api/_http/responder.servidor";

/** O link do e-mail de confirmação: confere e já entra. */
export const POST = (pedido: NextRequest) => responder(pedido, (ctx, _cookie, corpo) => confirmarEmail(ctx, corpo));
