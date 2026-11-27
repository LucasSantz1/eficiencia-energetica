import type { NextRequest } from "next/server";
import { contarUso } from "@/aplicacao/metricas.servidor";
import { responder } from "@/app/api/_http/responder.servidor";

export const preferredRegion = "gru1";

/** Contagem anônima de uso (ADR-009): `{ evento }`, de uma lista fixa. Responde 204 e nada mais. */
export const POST = (pedido: NextRequest) => responder(pedido, (ctx, _cookie, corpo) => contarUso(ctx, corpo));
