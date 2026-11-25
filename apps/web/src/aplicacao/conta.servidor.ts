import "server-only"; // primeiro import: casos de uso da conta, só no servidor (ADR-007)
import { conferirEmail, conferirNomeDoConvite, conferirSenha, FORMATO_DO_CODIGO_DO_CONVITE, lerCasaSalva } from "@ee/core";
import { hashDoCodigo, novoCodigoDeConvite } from "@/infraestrutura/conta/codigos.servidor";
import { configuracaoDaConta, type ConfiguracaoDaConta } from "@/infraestrutura/conta/configuracao.servidor";
import { cifrarSessao, decifrarSessao, type TokensDaSessao } from "@/infraestrutura/conta/sessao.servidor";
import * as supabase from "@/infraestrutura/conta/supabase.servidor";

export { ATRIBUTOS_DO_COOKIE, NOME_DO_COOKIE } from "@/infraestrutura/conta/sessao.servidor";

/**
 * Casos de uso da conta opcional e do link de convidado (E4, ADR-007). As rotas de /api só traduzem o pedido HTTP
 * para cá e a resposta daqui para HTTP. Nada de framework aqui: cada função recebe o cookie e devolve status, corpo
 * e o que fazer com o cookie, e os testes trocam o Supabase por um de mentira.
 */

export type AcaoNoCookie = { tipo: "gravar"; valor: string } | { tipo: "apagar" } | undefined;
export interface RespostaDaConta {
  status: number;
  corpo: Record<string, unknown>;
  cookie?: AcaoNoCookie;
}

/** O que os casos de uso usam do Supabase: o de verdade, ou um de mentira nos testes. */
export type Gateway = typeof supabase;

export interface Contexto {
  config: ConfiguracaoDaConta | undefined;
  gateway: Gateway;
  /** "https://site.vercel.app": para os links dos e-mails. */
  enderecoDoSite: string;
  agora: () => number;
}

export function contextoReal(enderecoDoSite: string): Contexto {
  return { config: configuracaoDaConta(), gateway: supabase, enderecoDoSite, agora: () => Date.now() };
}

const DESLIGADA: RespostaDaConta = { status: 503, corpo: { erro: "desligada" } };
const SEM_SESSAO: RespostaDaConta = { status: 401, corpo: { erro: "sessao" }, cookie: { tipo: "apagar" } };
const ENTRADA_INVALIDA = (mensagem: string): RespostaDaConta => ({ status: 400, corpo: { erro: "entrada", mensagem } });
/** Renova o token de acesso quando falta menos que isso para ele vencer. */
const MARGEM_DE_RENOVACAO_S = 60;

function falha(erro: supabase.ErroDaConta, cookie?: AcaoNoCookie): RespostaDaConta {
  const status = { credenciais: 401, "nao-confirmado": 403, "muitas-tentativas": 429, "link-vencido": 410, sessao: 401, conflito: 409, limite: 409, indisponivel: 502 }[erro];
  return { status, corpo: { erro }, cookie: erro === "sessao" ? { tipo: "apagar" } : cookie };
}

function comSessao(config: ConfiguracaoDaConta, tokens: TokensDaSessao): AcaoNoCookie {
  return { tipo: "gravar", valor: cifrarSessao(tokens, config.segredoDaSessao) };
}

/**
 * A sessão do cookie, já renovada se estiver para vencer. `cookie` volta preenchido quando os tokens mudaram (o
 * refresh token do Supabase troca a cada renovação).
 */
async function sessaoValida(ctx: Contexto & { config: ConfiguracaoDaConta }, cookie: string | undefined): Promise<{ tokens: TokensDaSessao; cookie: AcaoNoCookie } | undefined> {
  const tokens = decifrarSessao(cookie, ctx.config.segredoDaSessao);
  if (!tokens) return undefined;
  if (tokens.expiraEm - ctx.agora() / 1000 > MARGEM_DE_RENOVACAO_S) return { tokens, cookie: undefined };
  const renovado = await ctx.gateway.renovar(ctx.config, tokens.renovacao);
  if (!renovado.ok) return undefined;
  return { tokens: renovado.valor, cookie: comSessao(ctx.config, renovado.valor) };
}

/** Dono da sessão (id e e-mail), conferido no Supabase. */
async function usuario(ctx: Contexto & { config: ConfiguracaoDaConta }, cookie: string | undefined) {
  const sessao = await sessaoValida(ctx, cookie);
  if (!sessao) return undefined;
  const quem = await ctx.gateway.quemEsta(ctx.config, sessao.tokens.acesso);
  if (!quem.ok) return undefined;
  return { ...sessao, ...quem.valor };
}

function ligada(ctx: Contexto): ctx is Contexto & { config: ConfiguracaoDaConta } {
  return ctx.config !== undefined;
}

export async function estado(ctx: Contexto, cookie: string | undefined): Promise<RespostaDaConta> {
  if (!ligada(ctx)) return { status: 200, corpo: { conta: "desligada" } };
  if (!cookie) return { status: 200, corpo: { conta: "sem-conta" } };
  const quem = await usuario(ctx, cookie);
  if (!quem) return { status: 200, corpo: { conta: "sem-conta" }, cookie: { tipo: "apagar" } };
  return { status: 200, corpo: { conta: "conectada", email: quem.email }, cookie: quem.cookie };
}

export async function cadastrar(ctx: Contexto, corpo: Record<string, unknown>): Promise<RespostaDaConta> {
  if (!ligada(ctx)) return DESLIGADA;
  const email = conferirEmail(corpo["email"]);
  if (!email.ok) return ENTRADA_INVALIDA(email.mensagem);
  const senha = conferirSenha(corpo["senha"]);
  if (!senha.ok) return ENTRADA_INVALIDA(senha.mensagem);
  // LGPD: a casa só vai para o servidor com o "concordo" marcado na hora de criar a conta.
  if (corpo["concordo"] !== true) return ENTRADA_INVALIDA("Marque que concorda em guardar a sua casa na conta.");
  const feito = await ctx.gateway.cadastrar(ctx.config, email.valor, senha.valor, ctx.enderecoDoSite);
  return feito.ok ? { status: 200, corpo: { ok: true } } : falha(feito.erro);
}

export async function entrar(ctx: Contexto, corpo: Record<string, unknown>): Promise<RespostaDaConta> {
  if (!ligada(ctx)) return DESLIGADA;
  const email = conferirEmail(corpo["email"]);
  // Senha errada ou e-mail sem conta: a mesma resposta (ninguém descobre quais e-mails têm conta).
  if (!email.ok || typeof corpo["senha"] !== "string" || corpo["senha"] === "" || corpo["senha"].length > 200) return falha("credenciais");
  const tokens = await ctx.gateway.entrar(ctx.config, email.valor, corpo["senha"]);
  if (!tokens.ok) return falha(tokens.erro);
  return { status: 200, corpo: { ok: true }, cookie: comSessao(ctx.config, tokens.valor) };
}

const HASH_DO_TOKEN = /^[A-Za-z0-9_-]{8,200}$/;

export async function confirmarEmail(ctx: Contexto, corpo: Record<string, unknown>): Promise<RespostaDaConta> {
  if (!ligada(ctx)) return DESLIGADA;
  const hash = corpo["tokenHash"];
  if (typeof hash !== "string" || !HASH_DO_TOKEN.test(hash)) return falha("link-vencido");
  const tokens = await ctx.gateway.confirmarLink(ctx.config, hash, "email");
  if (!tokens.ok) return falha(tokens.erro);
  return { status: 200, corpo: { ok: true }, cookie: comSessao(ctx.config, tokens.valor) };
}

export async function pedirNovaSenha(ctx: Contexto, corpo: Record<string, unknown>): Promise<RespostaDaConta> {
  if (!ligada(ctx)) return DESLIGADA;
  const email = conferirEmail(corpo["email"]);
  if (!email.ok) return ENTRADA_INVALIDA(email.mensagem);
  const feito = await ctx.gateway.pedirNovaSenha(ctx.config, email.valor, ctx.enderecoDoSite);
  // Sempre "enviamos, se houver conta": não revela quais e-mails têm conta.
  return feito.ok ? { status: 200, corpo: { ok: true } } : falha(feito.erro);
}

/** O link de "esqueci a senha": confere o link e já grava a senha nova, numa ida só. */
export async function trocarSenhaPeloLink(ctx: Contexto, corpo: Record<string, unknown>): Promise<RespostaDaConta> {
  if (!ligada(ctx)) return DESLIGADA;
  const hash = corpo["tokenHash"];
  if (typeof hash !== "string" || !HASH_DO_TOKEN.test(hash)) return falha("link-vencido");
  const senha = conferirSenha(corpo["senha"]);
  if (!senha.ok) return ENTRADA_INVALIDA(senha.mensagem);
  const tokens = await ctx.gateway.confirmarLink(ctx.config, hash, "recovery");
  if (!tokens.ok) return falha(tokens.erro);
  const trocou = await ctx.gateway.trocarSenha(ctx.config, tokens.valor, senha.valor);
  if (!trocou.ok) return falha(trocou.erro);
  return { status: 200, corpo: { ok: true }, cookie: comSessao(ctx.config, tokens.valor) };
}

export async function sair(ctx: Contexto, cookie: string | undefined): Promise<RespostaDaConta> {
  if (!ligada(ctx)) return { status: 200, corpo: { ok: true }, cookie: { tipo: "apagar" } };
  const tokens = decifrarSessao(cookie, ctx.config.segredoDaSessao);
  // Mesmo se o Supabase não responder, o cookie sai deste aparelho.
  if (tokens) await ctx.gateway.sair(ctx.config, tokens).catch(() => undefined);
  return { status: 200, corpo: { ok: true }, cookie: { tipo: "apagar" } };
}

export async function apagarConta(ctx: Contexto, cookie: string | undefined): Promise<RespostaDaConta> {
  if (!ligada(ctx)) return DESLIGADA;
  const sessao = await sessaoValida(ctx, cookie);
  if (!sessao) return SEM_SESSAO;
  const apagou = await ctx.gateway.apagarConta(ctx.config, sessao.tokens.acesso);
  return apagou.ok ? { status: 200, corpo: { ok: true }, cookie: { tipo: "apagar" } } : falha(apagou.erro, sessao.cookie);
}

/** A casa só passa pelo mesmo leitor do aparelho (ADR-004): nada estranho entra no banco nem volta dele. */
function casaLida(dados: unknown) {
  return lerCasaSalva(dados).casa;
}

export async function lerCasa(ctx: Contexto, cookie: string | undefined): Promise<RespostaDaConta> {
  if (!ligada(ctx)) return DESLIGADA;
  const sessao = await sessaoValida(ctx, cookie);
  if (!sessao) return SEM_SESSAO;
  const casa = await ctx.gateway.lerCasa(ctx.config, sessao.tokens.acesso);
  if (!casa.ok) return falha(casa.erro, sessao.cookie);
  const corpo = casa.valor ? { casa: casaLida(casa.valor.dados), versaoDoFormato: casa.valor.versaoDoFormato, atualizadaEm: casa.valor.atualizadaEm } : { casa: null };
  return { status: 200, corpo, cookie: sessao.cookie };
}

/** Teto do formato salvo que o servidor aceita: o mesmo número do site, conferido pela trava da casa (A1, Sprint 3). */
const VERSOES_ACEITAS = { minima: 1, maxima: 1000 };

export async function gravarCasa(ctx: Contexto, cookie: string | undefined, corpo: Record<string, unknown>): Promise<RespostaDaConta> {
  if (!ligada(ctx)) return DESLIGADA;
  const quem = await usuario(ctx, cookie);
  if (!quem) return SEM_SESSAO;
  const versao = corpo["versaoDoFormato"];
  if (typeof versao !== "number" || !Number.isInteger(versao) || versao < VERSOES_ACEITAS.minima || versao > VERSOES_ACEITAS.maxima) return ENTRADA_INVALIDA("Versão da casa inválida.");
  const conhecida = corpo["atualizadaEm"];
  if (conhecida !== null && (typeof conhecida !== "string" || conhecida.length > 40)) return ENTRADA_INVALIDA("Data inválida.");
  const gravou = await ctx.gateway.gravarCasa(ctx.config, quem.tokens.acesso, quem.id, { dados: casaLida(corpo["casa"]), versaoDoFormato: versao }, conhecida ?? undefined);
  if (!gravou.ok) return falha(gravou.erro, quem.cookie);
  return { status: 200, corpo: { atualizadaEm: gravou.valor }, cookie: quem.cookie };
}

export async function listarConvites(ctx: Contexto, cookie: string | undefined): Promise<RespostaDaConta> {
  if (!ligada(ctx)) return DESLIGADA;
  const sessao = await sessaoValida(ctx, cookie);
  if (!sessao) return SEM_SESSAO;
  const lista = await ctx.gateway.listarConvites(ctx.config, sessao.tokens.acesso);
  return lista.ok ? { status: 200, corpo: { convites: lista.valor }, cookie: sessao.cookie } : falha(lista.erro, sessao.cookie);
}

/**
 * Cria um link de convidado. O código (32 bytes aleatórios) volta UMA vez, para o dono copiar ou compartilhar; o banco
 * só guarda o hash. Quem perder o link cria outro.
 */
export async function criarConvite(ctx: Contexto, cookie: string | undefined, corpo: Record<string, unknown>): Promise<RespostaDaConta> {
  if (!ligada(ctx)) return DESLIGADA;
  const quem = await usuario(ctx, cookie);
  if (!quem) return SEM_SESSAO;
  const nome = conferirNomeDoConvite(corpo["nome"]);
  if (!nome.ok) return ENTRADA_INVALIDA(nome.mensagem);
  const codigo = novoCodigoDeConvite();
  const criado = await ctx.gateway.criarConvite(ctx.config, quem.tokens.acesso, quem.id, hashDoCodigo(codigo), nome.valor);
  if (!criado.ok) return falha(criado.erro, quem.cookie);
  return { status: 200, corpo: { convite: criado.valor, codigo }, cookie: quem.cookie };
}

const ID_DO_CONVITE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function apagarConvite(ctx: Contexto, cookie: string | undefined, corpo: Record<string, unknown>): Promise<RespostaDaConta> {
  if (!ligada(ctx)) return DESLIGADA;
  const id = corpo["id"];
  if (typeof id !== "string" || !ID_DO_CONVITE.test(id)) return ENTRADA_INVALIDA("Link inválido.");
  const sessao = await sessaoValida(ctx, cookie);
  if (!sessao) return SEM_SESSAO;
  const apagou = await ctx.gateway.apagarConvite(ctx.config, sessao.tokens.acesso, id);
  return apagou.ok ? { status: 200, corpo: { ok: true }, cookie: sessao.cookie } : falha(apagou.erro, sessao.cookie);
}

/** O convidado: sem conta e sem cookie, só com o código do link. Só leitura. */
export async function casaDoConvidado(ctx: Contexto, corpo: Record<string, unknown>): Promise<RespostaDaConta> {
  if (!ligada(ctx)) return DESLIGADA;
  const codigo = corpo["codigo"];
  if (typeof codigo !== "string" || !FORMATO_DO_CODIGO_DO_CONVITE.test(codigo)) return { status: 404, corpo: { erro: "convite" } };
  const casa = await ctx.gateway.casaDoConvite(ctx.config, hashDoCodigo(codigo));
  if (!casa.ok) return falha(casa.erro);
  if (!casa.valor) return { status: 404, corpo: { erro: "convite" } };
  return { status: 200, corpo: { casa: casaLida(casa.valor.dados), atualizadaEm: casa.valor.atualizadaEm } };
}
