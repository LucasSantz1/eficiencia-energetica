import "server-only"; // primeiro import: casos de uso das métricas, só no servidor (ADR-009)
import { conferirOpiniao, ehEventoDeUso } from "@ee/core";
import { dentroDoLimite, ligada, type Contexto, type RespostaDaConta } from "./conta.servidor";

/**
 * Métricas de uso e "Isto te ajudou?" (E12, ADR-009). Sem cookie, sem conta e sem nada da casa: o navegador manda só
 * o nome do evento (ou a nota), o servidor confere a lista e soma no banco. A contagem de uso não usa o IP para nada.
 * A opinião passa pelo limite de tentativas (ADR-008): um código do IP fica de 1 a 2 dias. Sem a conta ligada no
 * site, nada é contado.
 */
const SEM_CONTEUDO: RespostaDaConta = { status: 204, corpo: {} };

export async function contarUso(ctx: Contexto, corpo: Record<string, unknown>): Promise<RespostaDaConta> {
  if (!ligada(ctx)) return SEM_CONTEUDO;
  const evento = corpo["evento"];
  if (!ehEventoDeUso(evento)) return { status: 400, corpo: { erro: "entrada" } };
  // Sem limite por IP de propósito (A1 da seguranca): até o código do IP ficaria guardado. O banco tem um teto por dia.
  await ctx.gateway.contarUso(ctx.config, evento);
  return SEM_CONTEUDO;
}

export async function registrarOpiniao(ctx: Contexto, corpo: Record<string, unknown>): Promise<RespostaDaConta> {
  if (!ligada(ctx)) return { status: 503, corpo: { erro: "desligada" } };
  const opiniao = conferirOpiniao(corpo["momento"], corpo["nota"], corpo["texto"]);
  if (!opiniao.ok) return { status: 400, corpo: { erro: "entrada", mensagem: opiniao.mensagem } };
  const limite = await dentroDoLimite(ctx, [{ acao: "opiniao-ip", tipo: "ip", valor: ctx.ip }]);
  if (limite !== "ok") return { status: limite === "muitas-tentativas" ? 429 : 503, corpo: { erro: limite } };
  const gravou = await ctx.gateway.registrarOpiniao(ctx.config, opiniao.momento, opiniao.nota, opiniao.texto);
  return gravou.ok ? { status: 200, corpo: { ok: true } } : { status: 503, corpo: { erro: "indisponivel" } };
}
