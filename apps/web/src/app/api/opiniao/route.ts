import type { NextRequest } from "next/server";
import { registrarOpiniao } from "@/aplicacao/metricas.servidor";
import { responder } from "@/app/api/_http/responder.servidor";

export const preferredRegion = "gru1";

/** "Isto te ajudou?" (ADR-009): `{ momento, nota, texto? }`, anônimo. */
export const POST = (pedido: NextRequest) => responder(pedido, (ctx, _cookie, corpo) => registrarOpiniao(ctx, corpo));
