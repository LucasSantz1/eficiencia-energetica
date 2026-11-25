import type { NextRequest } from "next/server";
import { apagarConta } from "@/aplicacao/conta.servidor";
import { responder } from "@/app/api/_http/responder.servidor";

/** Apagar a conta, a casa e os links de convidado (LGPD). */
export const POST = (pedido: NextRequest) => responder(pedido, (ctx, cookie) => apagarConta(ctx, cookie));
