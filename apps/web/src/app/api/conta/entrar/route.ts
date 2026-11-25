import type { NextRequest } from "next/server";
import { entrar } from "@/aplicacao/conta.servidor";
import { responder } from "@/app/api/_http/responder.servidor";

// Funções na região de São Paulo, perto do Supabase e da família (B9 da seguranca; LGPD: dados no Brasil).
export const preferredRegion = "gru1";

/** Entrar com e-mail e senha; grava o cookie cifrado da sessão. */
export const POST = (pedido: NextRequest) => responder(pedido, (ctx, _cookie, corpo) => entrar(ctx, corpo));
