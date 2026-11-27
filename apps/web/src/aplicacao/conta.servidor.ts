import "server-only"; // primeiro import: casos de uso da conta, só no servidor (ADR-007)
import { conferirEmail, conferirNomeDoConvite, conferirSenha, FORMATO_DO_CODIGO_DO_CONVITE, lerCasaSalva, VERSAO_DO_FORMATO_DA_CASA } from "@ee/core";
import { VERSAO_DOS_TERMOS } from "@/config/termos";
import { hashDoCodigo, novoCodigoDeConvite } from "@/infraestrutura/conta/codigos.servidor";
import { configuracaoDaConta, type ConfiguracaoDaConta } from "@/infraestrutura/conta/configuracao.servidor";
import { cifrarSessao, decifrarSessao, DURACAO_DA_SESSAO_S, type TokensDaSessao } from "@/infraestrutura/conta/sessao.servidor";
import * as supabase from "@/infraestrutura/conta/supabase.servidor";
import { chaveDaTentativa } from "@/infraestrutura/conta/tentativas.servidor";

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
  /** O IP de quem pediu, posto pela Vercel. Só vira HMAC para contar tentativas (ADR-008); nunca é guardado. */
  ip: string | undefined;
  agora: () => number;
}

/** Se este site tem a conta ligada (as variáveis do Supabase na Vercel). Só diz sim ou não: nada do valor sai daqui. */
export function contaLigadaNoSite(): boolean {
  return configuracaoDaConta() !== undefined;
}

export function contextoReal(enderecoDoSite: string, ip: string | undefined): Contexto {
  return { config: configuracaoDaConta(), gateway: supabase, enderecoDoSite, ip, agora: () => Date.now() };
}

const DESLIGADA: RespostaDaConta = { status: 503, corpo: { erro: "desligada" } };
const SEM_SESSAO: RespostaDaConta = { status: 401, corpo: { erro: "sessao" }, cookie: { tipo: "apagar" } };
const ENTRADA_INVALIDA = (mensagem: string): RespostaDaConta => ({ status: 400, corpo: { erro: "entrada", mensagem } });
/** Renova o token de acesso quando falta menos que isso para ele vencer. */
const MARGEM_DE_RENOVACAO_S = 60;

function falha(erro: supabase.ErroDaConta, cookie?: AcaoNoCookie): RespostaDaConta {
  const status = { credenciais: 401, "nao-confirmado": 403, "muitas-tentativas": 429, "link-vencido": 410, sessao: 401, conflito: 409, limite: 409, "senha-fraca": 400, indisponivel: 503 }[erro];
  return { status, corpo: { erro }, cookie: erro === "sessao" ? { tipo: "apagar" } : cookie };
}

function comSessao(config: ConfiguracaoDaConta, tokens: TokensDaSessao): AcaoNoCookie {
  return { tipo: "gravar", valor: cifrarSessao(tokens, config.segredoDaSessao) };
}

/** Sessão nova (senha ou link do e-mail): marca o início, que conta o limite total de 30 dias (B4). */
function sessaoNova(ctx: Contexto, tokens: TokensDaSessao): TokensDaSessao {
  return { ...tokens, inicio: Math.floor(ctx.agora() / 1000) };
}

type Autenticado = { ok: true; tokens: TokensDaSessao; cookie: AcaoNoCookie; id: string; email: string } | { ok: false; resposta: RespostaDaConta };

/**
 * Quem é o dono do cookie, conferido NO SUPABASE a cada pedido (M3 da seguranca): depois de "Sair" ou de trocar a
 * senha, uma cópia antiga do cookie não lê nem apaga nada, mesmo com o token de acesso ainda dentro da validade.
 * Renova o token quando está para vencer (`cookie` volta preenchido: o refresh token troca a cada renovação).
 * Falha passageira (Supabase fora do ar, limite de pedidos) NÃO apaga o cookie (M2): a pessoa só sai da conta quando
 * o Supabase diz que a sessão acabou.
 */
async function autenticar(ctx: Contexto & { config: ConfiguracaoDaConta }, cookie: string | undefined): Promise<Autenticado> {
  let tokens = decifrarSessao(cookie, ctx.config.segredoDaSessao);
  if (!tokens) return { ok: false, resposta: SEM_SESSAO };
  const agoraS = Math.floor(ctx.agora() / 1000);
  // Cookie de antes do limite total (sem início): conta a partir de agora.
  const inicio = tokens.inicio ?? agoraS;
  // Limite total de 30 dias desde que a pessoa entrou (B4): depois disso, só com a senha de novo.
  if (agoraS - inicio > DURACAO_DA_SESSAO_S) {
    await ctx.gateway.sair(ctx.config, tokens).catch(() => undefined);
    return { ok: false, resposta: SEM_SESSAO };
  }
  let novoCookie: AcaoNoCookie;
  if (tokens.expiraEm - ctx.agora() / 1000 <= MARGEM_DE_RENOVACAO_S) {
    const renovado = await ctx.gateway.renovar(ctx.config, tokens.renovacao);
    if (!renovado.ok) return { ok: false, resposta: renovado.erro === "sessao" ? SEM_SESSAO : falha(renovado.erro) };
    tokens = { ...renovado.valor, inicio };
    novoCookie = comSessao(ctx.config, tokens);
  }
  const quem = await ctx.gateway.quemEsta(ctx.config, tokens.acesso);
  if (!quem.ok) return { ok: false, resposta: quem.erro === "sessao" ? SEM_SESSAO : falha(quem.erro, novoCookie) };
  return { ok: true, tokens, cookie: novoCookie, ...quem.valor };
}

export function ligada(ctx: Contexto): ctx is Contexto & { config: ConfiguracaoDaConta } {
  return ctx.config !== undefined;
}

type Limite = { acao: supabase.AcaoLimitada; tipo: "ip" | "email"; valor: string | undefined };

/**
 * Limite de tentativas (ADR-008), pedido do dono em 26/11: conta por IP e, onde há, por e-mail. O Supabase também
 * limita, mas por IP do servidor da Vercel, que é o mesmo para todo mundo; este é o da pessoa. Passou do limite:
 * "muitas-tentativas" (429). Banco sem resposta: "indisponivel" (falha fechada). Sem IP (fora da Vercel), conta tudo
 * junto numa chave só.
 */
export async function dentroDoLimite(ctx: Contexto & { config: ConfiguracaoDaConta }, limites: Limite[]): Promise<"ok" | supabase.ErroDaConta> {
  for (const { acao, tipo, valor } of limites) {
    const contado = await ctx.gateway.contarTentativa(ctx.config, acao, chaveDaTentativa(ctx.config.segredoDaSessao, tipo, valor ?? "desconhecido"));
    if (!contado.ok) return contado.erro;
    if (!contado.valor) return "muitas-tentativas";
  }
  return "ok";
}

export async function estado(ctx: Contexto, cookie: string | undefined): Promise<RespostaDaConta> {
  if (!ligada(ctx)) return { status: 200, corpo: { conta: "desligada" } };
  if (!cookie) return { status: 200, corpo: { conta: "sem-conta" } };
  const quem = await autenticar(ctx, cookie);
  if (!quem.ok) return quem.resposta.status === 401 ? { status: 200, corpo: { conta: "sem-conta" }, cookie: { tipo: "apagar" } } : quem.resposta;
  return { status: 200, corpo: { conta: "conectada", email: quem.email }, cookie: quem.cookie };
}

export async function cadastrar(ctx: Contexto, corpo: Record<string, unknown>): Promise<RespostaDaConta> {
  if (!ligada(ctx)) return DESLIGADA;
  const email = conferirEmail(corpo["email"]);
  if (!email.ok) return ENTRADA_INVALIDA(email.mensagem);
  const senha = conferirSenha(corpo["senha"]);
  if (!senha.ok) return ENTRADA_INVALIDA(senha.mensagem);
  // LGPD: a casa só vai para o servidor com o "concordo" marcado na hora de criar a conta.
  if (corpo["concordo"] !== true) return ENTRADA_INVALIDA("Marque que concorda com os termos e em guardar a sua casa na conta.");
  const limite = await dentroDoLimite(ctx, [{ acao: "cadastrar-ip", tipo: "ip", valor: ctx.ip }]);
  if (limite !== "ok") return falha(limite);
  const feito = await ctx.gateway.cadastrar(ctx.config, email.valor, senha.valor, ctx.enderecoDoSite, { versao: VERSAO_DOS_TERMOS, em: new Date(ctx.agora()).toISOString() });
  return feito.ok ? { status: 200, corpo: { ok: true } } : falha(feito.erro);
}

export async function entrar(ctx: Contexto, corpo: Record<string, unknown>): Promise<RespostaDaConta> {
  if (!ligada(ctx)) return DESLIGADA;
  const email = conferirEmail(corpo["email"]);
  // Senha errada ou e-mail sem conta: a mesma resposta (ninguém descobre quais e-mails têm conta).
  if (!email.ok || typeof corpo["senha"] !== "string" || corpo["senha"] === "" || corpo["senha"].length > 200) return falha("credenciais");
  // Conta toda tentativa, certa ou errada, exista o e-mail ou não: a resposta do limite não revela conta nenhuma.
  const limite = await dentroDoLimite(ctx, [
    { acao: "entrar-ip", tipo: "ip", valor: ctx.ip },
    { acao: "entrar-email", tipo: "email", valor: email.valor },
  ]);
  if (limite !== "ok") return falha(limite);
  const tokens = await ctx.gateway.entrar(ctx.config, email.valor, corpo["senha"]);
  if (!tokens.ok) return falha(tokens.erro);
  return { status: 200, corpo: { ok: true }, cookie: comSessao(ctx.config, sessaoNova(ctx, tokens.valor)) };
}

const HASH_DO_TOKEN = /^[A-Za-z0-9_-]{8,200}$/;

export async function confirmarEmail(ctx: Contexto, corpo: Record<string, unknown>): Promise<RespostaDaConta> {
  if (!ligada(ctx)) return DESLIGADA;
  const hash = corpo["tokenHash"];
  if (typeof hash !== "string" || !HASH_DO_TOKEN.test(hash)) return falha("link-vencido");
  const limite = await dentroDoLimite(ctx, [{ acao: "link-ip", tipo: "ip", valor: ctx.ip }]);
  if (limite !== "ok") return falha(limite);
  const tokens = await ctx.gateway.confirmarLink(ctx.config, hash, "email");
  if (!tokens.ok) return falha(tokens.erro);
  // Contagem anônima (ADR-009): falhar aqui não atrapalha a pessoa.
  await ctx.gateway.contarUso(ctx.config, "conta-confirmada").catch(() => undefined);
  return { status: 200, corpo: { ok: true }, cookie: comSessao(ctx.config, sessaoNova(ctx, tokens.valor)) };
}

export async function pedirNovaSenha(ctx: Contexto, corpo: Record<string, unknown>): Promise<RespostaDaConta> {
  if (!ligada(ctx)) return DESLIGADA;
  const email = conferirEmail(corpo["email"]);
  if (!email.ok) return ENTRADA_INVALIDA(email.mensagem);
  const porIp = await dentroDoLimite(ctx, [{ acao: "esqueci-ip", tipo: "ip", valor: ctx.ip }]);
  if (porIp !== "ok") return falha(porIp);
  // Muitos pedidos para o mesmo e-mail: não manda mais nenhum, mas responde igual (não revela se há conta).
  const porEmail = await dentroDoLimite(ctx, [{ acao: "esqueci-email", tipo: "email", valor: email.valor }]);
  if (porEmail === "muitas-tentativas") return { status: 200, corpo: { ok: true } };
  if (porEmail !== "ok") return falha(porEmail);
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
  const limite = await dentroDoLimite(ctx, [{ acao: "link-ip", tipo: "ip", valor: ctx.ip }]);
  if (limite !== "ok") return falha(limite);
  const tokens = await ctx.gateway.confirmarLink(ctx.config, hash, "recovery");
  if (!tokens.ok) return falha(tokens.erro);
  const trocou = await ctx.gateway.trocarSenha(ctx.config, tokens.valor, senha.valor);
  // O link já foi gasto e a pessoa já entrou: mesmo com a senha recusada (fraca), ela fica na conta e pode tentar de
  // novo sem outro e-mail (B7 da seguranca).
  if (!trocou.ok) return falha(trocou.erro, comSessao(ctx.config, sessaoNova(ctx, tokens.valor)));
  return { status: 200, corpo: { ok: true }, cookie: comSessao(ctx.config, sessaoNova(ctx, tokens.valor)) };
}

/**
 * Sair. `{ todos: true }`: sai de todos os aparelhos (B4 da seguranca). Aí o Supabase TEM de confirmar: se não
 * responder, a pessoa fica na conta e recebe erro, para não achar que os outros aparelhos saíram. Só deste aparelho:
 * mesmo se o Supabase não responder, o cookie sai.
 */
export async function sair(ctx: Contexto, cookie: string | undefined, corpo: Record<string, unknown> = {}): Promise<RespostaDaConta> {
  if (!ligada(ctx)) return { status: 200, corpo: { ok: true }, cookie: { tipo: "apagar" } };
  const tokens = decifrarSessao(cookie, ctx.config.segredoDaSessao);
  if (corpo["todos"] === true) {
    if (!tokens) return SEM_SESSAO;
    const saiu = await ctx.gateway.sair(ctx.config, tokens, "global");
    if (!saiu.ok) return saiu.erro === "sessao" ? SEM_SESSAO : falha(saiu.erro);
    return { status: 200, corpo: { ok: true }, cookie: { tipo: "apagar" } };
  }
  if (tokens) await ctx.gateway.sair(ctx.config, tokens).catch(() => undefined);
  return { status: 200, corpo: { ok: true }, cookie: { tipo: "apagar" } };
}

export async function apagarConta(ctx: Contexto, cookie: string | undefined): Promise<RespostaDaConta> {
  if (!ligada(ctx)) return DESLIGADA;
  const quem = await autenticar(ctx, cookie);
  if (!quem.ok) return quem.resposta;
  const apagou = await ctx.gateway.apagarConta(ctx.config, quem.tokens.acesso);
  return apagou.ok ? { status: 200, corpo: { ok: true }, cookie: { tipo: "apagar" } } : falha(apagou.erro, quem.cookie);
}

/** A casa só passa pelo mesmo leitor do aparelho (ADR-004): nada estranho entra no banco nem volta dele. */
function casaLida(dados: unknown) {
  return lerCasaSalva(dados).casa;
}

export async function lerCasa(ctx: Contexto, cookie: string | undefined): Promise<RespostaDaConta> {
  if (!ligada(ctx)) return DESLIGADA;
  const sessao = await autenticar(ctx, cookie);
  if (!sessao.ok) return sessao.resposta;
  const casa = await ctx.gateway.lerCasa(ctx.config, sessao.tokens.acesso, sessao.id);
  if (!casa.ok) return falha(casa.erro, sessao.cookie);
  const corpo = casa.valor ? { casa: casaLida(casa.valor.dados), versaoDoFormato: casa.valor.versaoDoFormato, atualizadaEm: casa.valor.atualizadaEm } : { casa: null };
  return { status: 200, corpo, cookie: sessao.cookie };
}


export async function gravarCasa(ctx: Contexto, cookie: string | undefined, corpo: Record<string, unknown>): Promise<RespostaDaConta> {
  if (!ligada(ctx)) return DESLIGADA;
  const quem = await autenticar(ctx, cookie);
  if (!quem.ok) return quem.resposta;
  const versao = corpo["versaoDoFormato"];
  // Só o formato desta versão do site (M4 da seguranca): uma aba antiga, ou o código guardado pelo modo sem internet,
  // cortaria os campos novos ao regravar. Ela recebe 409 "versao" e para de sincronizar até abrir a versão nova.
  if (versao !== VERSAO_DO_FORMATO_DA_CASA) return { status: 409, corpo: { erro: "versao" }, cookie: quem.cookie };
  const conhecida = corpo["atualizadaEm"];
  if (conhecida !== null && (typeof conhecida !== "string" || conhecida.length > 40)) return ENTRADA_INVALIDA("Data inválida.");
  const gravou = await ctx.gateway.gravarCasa(ctx.config, quem.tokens.acesso, quem.id, { dados: casaLida(corpo["casa"]), versaoDoFormato: versao }, conhecida ?? undefined);
  if (!gravou.ok) return falha(gravou.erro, quem.cookie);
  return { status: 200, corpo: { atualizadaEm: gravou.valor }, cookie: quem.cookie };
}

export async function listarConvites(ctx: Contexto, cookie: string | undefined): Promise<RespostaDaConta> {
  if (!ligada(ctx)) return DESLIGADA;
  const sessao = await autenticar(ctx, cookie);
  if (!sessao.ok) return sessao.resposta;
  const lista = await ctx.gateway.listarConvites(ctx.config, sessao.tokens.acesso);
  return lista.ok ? { status: 200, corpo: { convites: lista.valor }, cookie: sessao.cookie } : falha(lista.erro, sessao.cookie);
}

/**
 * Cria um link de convidado. O código (32 bytes aleatórios) volta UMA vez, para o dono copiar ou compartilhar; o banco
 * só guarda o hash. Quem perder o link cria outro.
 */
export async function criarConvite(ctx: Contexto, cookie: string | undefined, corpo: Record<string, unknown>): Promise<RespostaDaConta> {
  if (!ligada(ctx)) return DESLIGADA;
  const quem = await autenticar(ctx, cookie);
  if (!quem.ok) return quem.resposta;
  const nome = conferirNomeDoConvite(corpo["nome"]);
  if (!nome.ok) return ENTRADA_INVALIDA(nome.mensagem);
  const codigo = novoCodigoDeConvite();
  const criado = await ctx.gateway.criarConvite(ctx.config, quem.tokens.acesso, quem.id, hashDoCodigo(codigo), nome.valor);
  if (!criado.ok) return falha(criado.erro, quem.cookie);
  await ctx.gateway.contarUso(ctx.config, "convite-criado").catch(() => undefined);
  return { status: 200, corpo: { convite: criado.valor, codigo }, cookie: quem.cookie };
}

const ID_DO_CONVITE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function apagarConvite(ctx: Contexto, cookie: string | undefined, corpo: Record<string, unknown>): Promise<RespostaDaConta> {
  if (!ligada(ctx)) return DESLIGADA;
  const id = corpo["id"];
  if (typeof id !== "string" || !ID_DO_CONVITE.test(id)) return ENTRADA_INVALIDA("Link inválido.");
  const sessao = await autenticar(ctx, cookie);
  if (!sessao.ok) return sessao.resposta;
  const apagou = await ctx.gateway.apagarConvite(ctx.config, sessao.tokens.acesso, id);
  return apagou.ok ? { status: 200, corpo: { ok: true }, cookie: sessao.cookie } : falha(apagou.erro, sessao.cookie);
}

/** O convidado: sem conta e sem cookie, só com o código do link. Só leitura. */
export async function casaDoConvidado(ctx: Contexto, corpo: Record<string, unknown>): Promise<RespostaDaConta> {
  if (!ligada(ctx)) return DESLIGADA;
  const codigo = corpo["codigo"];
  // Conta também o código fora do formato: quem varre códigos é barrado do mesmo jeito.
  const limite = await dentroDoLimite(ctx, [{ acao: "convidado-ip", tipo: "ip", valor: ctx.ip }]);
  if (limite !== "ok") return falha(limite);
  if (typeof codigo !== "string" || !FORMATO_DO_CODIGO_DO_CONVITE.test(codigo)) return { status: 404, corpo: { erro: "convite" } };
  const casa = await ctx.gateway.casaDoConvite(ctx.config, hashDoCodigo(codigo));
  if (!casa.ok) return falha(casa.erro);
  if (!casa.valor) return { status: 404, corpo: { erro: "convite" } };
  return { status: 200, corpo: { casa: soOQueOConvidadoVe(casaLida(casa.valor.dados)), atualizadaEm: casa.valor.atualizadaEm } };
}

/**
 * O convidado recebe só o que a tela dele mostra ou precisa para calcular (M5 da seguranca): cidade, distribuidora,
 * benefício e ligação (mudam o preço), a conta de referência (preço do kWh), cômodos, aparelhos e as 3 últimas contas.
 * Ficam de fora: quantas pessoas moram, a meta, as leituras do relógio, o plano de dicas e as contas antigas. O texto
 * da tela do dono diz o que o convidado vê.
 */
function soOQueOConvidadoVe(casa: ReturnType<typeof casaLida>) {
  const residencia = casa.residencia && (({ pessoas: _pessoas, ...resto }) => resto)(casa.residencia);
  const contas = [...casa.contas].sort((a, b) => a.competencia.localeCompare(b.competencia)).slice(-3);
  return { residencia, comodos: casa.comodos, aparelhos: casa.aparelhos, contas, leituras: [], plano: [] };
}
