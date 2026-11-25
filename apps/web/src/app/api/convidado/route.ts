import type { NextRequest } from "next/server";
import { casaDoConvidado } from "@/aplicacao/conta.servidor";
import { responder } from "@/app/api/_http/responder.servidor";

/** O convidado manda o código do link (no corpo, nunca no endereço) e recebe a casa, só para ler. */
export const POST = (pedido: NextRequest) => responder(pedido, (ctx, _cookie, corpo) => casaDoConvidado(ctx, corpo));
