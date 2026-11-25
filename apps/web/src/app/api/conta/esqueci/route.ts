import type { NextRequest } from "next/server";
import { pedirNovaSenha } from "@/aplicacao/conta.servidor";
import { responder } from "@/app/api/_http/responder.servidor";

// Funções na região de São Paulo, perto do Supabase e da família (B9 da seguranca; LGPD: dados no Brasil).
export const preferredRegion = "gru1";

/** Esqueci a senha: o Supabase manda o link para criar outra. */
export const POST = (pedido: NextRequest) => responder(pedido, (ctx, _cookie, corpo) => pedirNovaSenha(ctx, corpo));
