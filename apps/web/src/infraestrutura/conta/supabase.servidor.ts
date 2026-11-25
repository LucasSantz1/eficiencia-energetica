import "server-only"; // primeiro import: fala com o Supabase com a senha e os tokens da pessoa (ADR-007)
import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import type { ConfiguracaoDaConta } from "./configuracao.servidor";
import type { TokensDaSessao } from "./sessao.servidor";

/**
 * Tudo o que o site pede ao Supabase (E4, ADR-007). Só o servidor chama: o navegador nunca vê a URL, a chave nem os
 * tokens. Cada chamada que mexe em dado da pessoa usa o token DELA, então quem decide o que pode é a RLS do banco
 * (supabase/migrations), não este arquivo. Os erros viram códigos curtos; a mensagem do Supabase nunca vai à tela.
 */

export type ErroDaConta = "credenciais" | "nao-confirmado" | "muitas-tentativas" | "link-vencido" | "sessao" | "conflito" | "limite" | "senha-fraca" | "indisponivel";
export type Resultado<T> = { ok: true; valor: T } | { ok: false; erro: ErroDaConta };

export interface CasaNoServidor {
  dados: unknown;
  versaoDoFormato: number;
  atualizadaEm: string;
}

export interface ConviteNoServidor {
  id: string;
  nome: string | undefined;
  criadoEm: string;
}

function cliente(config: ConfiguracaoDaConta, acesso?: string): SupabaseClient {
  return createClient(config.urlDoSupabase, config.chaveAnonima, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: acesso ? { headers: { Authorization: `Bearer ${acesso}` } } : {},
  });
}

function tokensDe(sessao: Session | null | undefined): TokensDaSessao | undefined {
  if (!sessao?.access_token || !sessao.refresh_token) return undefined;
  return { acesso: sessao.access_token, renovacao: sessao.refresh_token, expiraEm: sessao.expires_at ?? Math.floor(Date.now() / 1000) + 3600 };
}

/** O erro do Supabase em código nosso. O texto dele não sai daqui (pode trazer o e-mail). */
function erroDe(erro: { status?: number; code?: string; message?: string } | null): ErroDaConta {
  if (!erro) return "indisponivel";
  if (erro.code === "weak_password" || erro.code === "same_password") return "senha-fraca";
  if (erro.status === 429 || erro.code === "over_request_rate_limit" || erro.code === "over_email_send_rate_limit") return "muitas-tentativas";
  if (erro.code === "email_not_confirmed") return "nao-confirmado";
  if (erro.code === "invalid_credentials") return "credenciais";
  if (erro.code === "otp_expired" || erro.code === "flow_state_expired" || erro.code === "bad_jwt") return "link-vencido";
  if (erro.status === 401 || erro.status === 403 || erro.code === "refresh_token_not_found" || erro.code === "session_not_found") return "sessao";
  if (erro.status === 400 && erro.code === "invalid_credentials") return "credenciais";
  return "indisponivel";
}

/**
 * Cadastro com e-mail e senha. O Supabase manda o e-mail de confirmação (modelo com o link para /conta/confirmar).
 * Sempre a mesma resposta, exista ou não a conta: ninguém descobre pelo site quais e-mails têm conta.
 */
export async function cadastrar(config: ConfiguracaoDaConta, email: string, senha: string, enderecoDoSite: string): Promise<Resultado<null>> {
  const { error } = await cliente(config).auth.signUp({ email, password: senha, options: { emailRedirectTo: `${enderecoDoSite}/conta/confirmar` } });
  return respostaQueNaoRevela(error);
}

/**
 * Cadastro e "esqueci a senha" respondem igual, exista ou não a conta (M1 da seguranca):
 * - `over_email_send_rate_limit` ("espere 60 s para outro e-mail") só acontece com e-mail QUE TEM conta: vira sucesso;
 * - só o limite por pedidos (`over_request_rate_limit`, de todos) vira "muitas tentativas";
 * - senha fraca vira mensagem; Supabase fora do ar vira erro (a pessoa não pode achar que o e-mail saiu, B6).
 */
function respostaQueNaoRevela(error: { status?: number; code?: string } | null): Resultado<null> {
  if (!error || error.code === "over_email_send_rate_limit" || error.code === "user_already_exists" || error.code === "email_exists") return { ok: true, valor: null };
  if (error.code === "over_request_rate_limit" || error.status === 429) return { ok: false, erro: "muitas-tentativas" };
  if (error.code === "weak_password") return { ok: false, erro: "senha-fraca" };
  if (error.status === 400 || error.status === 422) return { ok: true, valor: null };
  return { ok: false, erro: "indisponivel" };
}

export async function entrar(config: ConfiguracaoDaConta, email: string, senha: string): Promise<Resultado<TokensDaSessao>> {
  const { data, error } = await cliente(config).auth.signInWithPassword({ email, password: senha });
  const tokens = tokensDe(data.session);
  if (error || !tokens) return { ok: false, erro: error?.status === 400 && !error.code ? "credenciais" : erroDe(error) };
  return { ok: true, valor: tokens };
}

/** O link do e-mail (confirmar o cadastro ou trocar a senha). O código vale uma vez só. */
export async function confirmarLink(config: ConfiguracaoDaConta, hashDoToken: string, tipo: "email" | "recovery"): Promise<Resultado<TokensDaSessao>> {
  const { data, error } = await cliente(config).auth.verifyOtp({ token_hash: hashDoToken, type: tipo });
  const tokens = tokensDe(data.session);
  if (error || !tokens) return { ok: false, erro: error ? (erroDe(error) === "indisponivel" ? "link-vencido" : erroDe(error)) : "link-vencido" };
  return { ok: true, valor: tokens };
}

/** Só "sessao" quando o Supabase diz que a sessão acabou; o resto é passageiro e não tira a pessoa da conta (M2). */
const SESSAO_ACABOU = new Set(["refresh_token_not_found", "refresh_token_already_used", "session_not_found", "session_expired", "user_not_found", "bad_jwt"]);

function erroDeSessao(error: { status?: number; code?: string } | null): ErroDaConta {
  if (!error) return "sessao";
  if (error.code && SESSAO_ACABOU.has(error.code)) return "sessao";
  if (error.status === 429) return "muitas-tentativas";
  if (error.status === 401 || error.status === 403) return "sessao";
  return "indisponivel";
}

export async function renovar(config: ConfiguracaoDaConta, renovacao: string): Promise<Resultado<TokensDaSessao>> {
  const { data, error } = await cliente(config).auth.refreshSession({ refresh_token: renovacao });
  const tokens = tokensDe(data.session);
  if (error || !tokens) return { ok: false, erro: erroDeSessao(error) };
  return { ok: true, valor: tokens };
}

/** Sair: o Supabase invalida a sessão dele (o refresh token não vale mais), além de o site apagar o cookie. */
export async function sair(config: ConfiguracaoDaConta, tokens: TokensDaSessao): Promise<void> {
  const sessao = cliente(config);
  const { error } = await sessao.auth.setSession({ access_token: tokens.acesso, refresh_token: tokens.renovacao });
  if (!error) await sessao.auth.signOut({ scope: "local" });
}

export async function pedirNovaSenha(config: ConfiguracaoDaConta, email: string, enderecoDoSite: string): Promise<Resultado<null>> {
  const { error } = await cliente(config).auth.resetPasswordForEmail(email, { redirectTo: `${enderecoDoSite}/conta/nova-senha` });
  return respostaQueNaoRevela(error);
}

export async function trocarSenha(config: ConfiguracaoDaConta, tokens: TokensDaSessao, senha: string): Promise<Resultado<null>> {
  const sessao = cliente(config);
  const entrou = await sessao.auth.setSession({ access_token: tokens.acesso, refresh_token: tokens.renovacao });
  if (entrou.error) return { ok: false, erro: "sessao" };
  const { error } = await sessao.auth.updateUser({ password: senha });
  return error ? { ok: false, erro: erroDe(error) } : { ok: true, valor: null };
}

/** E-mail e id de quem está logado. Confere o token no Supabase (não confia só no que está no cookie). */
export async function quemEsta(config: ConfiguracaoDaConta, acesso: string): Promise<Resultado<{ id: string; email: string }>> {
  const { data, error } = await cliente(config).auth.getUser(acesso);
  if (error) return { ok: false, erro: erroDeSessao(error) };
  if (!data.user?.email) return { ok: false, erro: "sessao" };
  return { ok: true, valor: { id: data.user.id, email: data.user.email } };
}

export async function lerCasa(config: ConfiguracaoDaConta, acesso: string): Promise<Resultado<CasaNoServidor | undefined>> {
  const { data, error } = await cliente(config, acesso).from("casas").select("dados, versao_do_formato, atualizada_em").maybeSingle();
  if (error) return { ok: false, erro: "indisponivel" };
  if (!data) return { ok: true, valor: undefined };
  return { ok: true, valor: { dados: data.dados, versaoDoFormato: Number(data.versao_do_formato), atualizadaEm: String(data.atualizada_em) } };
}

/**
 * Grava a casa. Com `atualizadaEmConhecida`, só grava se ninguém mudou a casa desde então (outro aparelho): senão,
 * "conflito", e o aparelho busca a versão nova antes de gravar de novo.
 */
export async function gravarCasa(
  config: ConfiguracaoDaConta,
  acesso: string,
  dono: string,
  casa: { dados: unknown; versaoDoFormato: number },
  atualizadaEmConhecida: string | undefined,
): Promise<Resultado<string>> {
  const agora = new Date().toISOString();
  const linha = { dados: casa.dados, versao_do_formato: casa.versaoDoFormato, atualizada_em: agora };
  const banco = cliente(config, acesso).from("casas");
  if (atualizadaEmConhecida === undefined) {
    const { error } = await banco.insert({ dono, ...linha });
    if (error) return { ok: false, erro: error.code === "23505" ? "conflito" : "indisponivel" };
    return { ok: true, valor: agora };
  }
  const { data, error } = await banco.update(linha).eq("dono", dono).eq("atualizada_em", atualizadaEmConhecida).select("atualizada_em");
  if (error) return { ok: false, erro: "indisponivel" };
  return data.length === 1 ? { ok: true, valor: agora } : { ok: false, erro: "conflito" };
}

export async function listarConvites(config: ConfiguracaoDaConta, acesso: string): Promise<Resultado<ConviteNoServidor[]>> {
  const { data, error } = await cliente(config, acesso).from("convites").select("id, nome, criado_em").order("criado_em", { ascending: true });
  if (error) return { ok: false, erro: "indisponivel" };
  return { ok: true, valor: data.map((c) => ({ id: String(c.id), nome: typeof c.nome === "string" ? c.nome : undefined, criadoEm: String(c.criado_em) })) };
}

/** `hashDoCodigo`: SHA-256 do código (32 bytes). O código mesmo nunca chega ao banco. */
export async function criarConvite(config: ConfiguracaoDaConta, acesso: string, dono: string, hashDoCodigo: Buffer, nome: string | undefined): Promise<Resultado<ConviteNoServidor>> {
  const { data, error } = await cliente(config, acesso)
    .from("convites")
    .insert({ dono, hash_do_codigo: `\\x${hashDoCodigo.toString("hex")}`, nome: nome ?? null })
    .select("id, nome, criado_em")
    .single();
  if (error) return { ok: false, erro: error.code === "23514" || /limite/.test(error.message) ? "limite" : error.code === "23503" ? "conflito" : "indisponivel" };
  return { ok: true, valor: { id: String(data.id), nome: typeof data.nome === "string" ? data.nome : undefined, criadoEm: String(data.criado_em) } };
}

export async function apagarConvite(config: ConfiguracaoDaConta, acesso: string, id: string): Promise<Resultado<null>> {
  const { error } = await cliente(config, acesso).from("convites").delete().eq("id", id);
  return error ? { ok: false, erro: "indisponivel" } : { ok: true, valor: null };
}

/** O convidado: sem conta, só com o hash do código. A função do banco só lê (security definer, ADR-007). */
export async function casaDoConvite(config: ConfiguracaoDaConta, hashDoCodigo: Buffer): Promise<Resultado<CasaNoServidor | undefined>> {
  const { data, error } = await cliente(config).rpc("casa_do_convite", { hash: `\\x${hashDoCodigo.toString("hex")}` });
  if (error) return { ok: false, erro: "indisponivel" };
  const [linha] = Array.isArray(data) ? data : [];
  if (!linha) return { ok: true, valor: undefined };
  return { ok: true, valor: { dados: linha.dados, versaoDoFormato: Number(linha.versao_do_formato), atualizadaEm: String(linha.atualizada_em) } };
}

/** Apaga a conta (e, em cascata no banco, a casa e os convites). */
export async function apagarConta(config: ConfiguracaoDaConta, acesso: string): Promise<Resultado<null>> {
  const { error } = await cliente(config, acesso).rpc("apagar_minha_conta");
  return error ? { ok: false, erro: "indisponivel" } : { ok: true, valor: null };
}
