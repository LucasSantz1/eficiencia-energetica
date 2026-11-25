"use client";

import { useEffect, useSyncExternalStore } from "react";
import { lerCasaSalva, type DadosCasa } from "@ee/core";
import { useCasa, VERSAO_DA_CASA } from "@/infraestrutura/armazenamento/casa";
import { dadosSalvaveis } from "@/infraestrutura/armazenamento/hidratacao";
import { pedirApi } from "@/infraestrutura/conta/api";

/**
 * Conta opcional e sincronização da casa (E4, ADR-007). A casa continua sendo a do aparelho (localStorage): com conta,
 * ela também vai para o servidor, e volta em outro aparelho. Sem conta, nada sai do aparelho.
 */

export type EstadoDaConta =
  | { tipo: "carregando" }
  | { tipo: "desligada" }
  | { tipo: "sem-conta" }
  | { tipo: "conectada"; email: string }
  | { tipo: "sem-internet" };

export type Sincronia =
  | { tipo: "parada" }
  | { tipo: "sincronizando" }
  | { tipo: "em-dia" }
  | { tipo: "pendente" }
  /** Casas diferentes no aparelho e na conta: a pessoa escolhe qual fica. */
  | { tipo: "escolher"; daConta: DadosCasa }
  /** Outro aparelho mudou a casa: trouxemos a versão da conta. */
  | { tipo: "atualizada-de-outro-aparelho" };

/** Textos de erro das rotas /api, em linguagem simples. */
export function mensagemDoErro(resposta: { status: number; corpo: Record<string, unknown> }): string {
  const mensagem = resposta.corpo["mensagem"];
  if (typeof mensagem === "string") return mensagem;
  switch (resposta.corpo["erro"]) {
    case "credenciais":
      return "E-mail ou senha não conferem. Confira e tente de novo.";
    case "nao-confirmado":
      return "Falta confirmar o e-mail: abra o link que mandamos para a sua caixa de entrada.";
    case "muitas-tentativas":
      return "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.";
    case "link-vencido":
      return "Este link já foi usado ou venceu. Peça um novo.";
    case "sessao":
      return "Você saiu da conta. Entre de novo.";
    case "limite":
      return "Você chegou ao limite de 20 links. Apague um para criar outro.";
    case "desligada":
      return "A conta ainda não está ligada neste site.";
    default:
      return resposta.status === 0 ? "Sem internet. Confira a conexão e tente de novo." : "Não deu certo agora. Tente de novo daqui a pouco.";
  }
}

/* ---------- Estado da conta (um só para a página toda) ---------- */

let estadoAtual: EstadoDaConta = { tipo: "carregando" };
let pedido: Promise<void> | undefined;
const ouvintesDaConta = new Set<() => void>();
const avisarConta = () => ouvintesDaConta.forEach((avisar) => avisar());

function mudarConta(novo: EstadoDaConta) {
  estadoAtual = novo;
  avisarConta();
}

/** Pergunta ao servidor quem está na conta. Uma vez por página, a não ser que `deNovo`. */
export function atualizarConta(deNovo = false): Promise<void> {
  if (pedido && !deNovo) return pedido;
  pedido = pedirApi("/api/conta").then(({ status, corpo }) => {
    if (status === 0) return mudarConta({ tipo: "sem-internet" });
    const email = corpo["email"];
    if (corpo["conta"] === "conectada" && typeof email === "string") return mudarConta({ tipo: "conectada", email });
    mudarConta({ tipo: corpo["conta"] === "sem-conta" ? "sem-conta" : "desligada" });
  });
  return pedido;
}

const assinarConta = (avisar: () => void) => {
  ouvintesDaConta.add(avisar);
  return () => ouvintesDaConta.delete(avisar);
};
const naHidratacao: EstadoDaConta = { tipo: "carregando" };

export function useConta(): EstadoDaConta {
  useEffect(() => {
    void atualizarConta();
  }, []);
  return useSyncExternalStore(assinarConta, () => estadoAtual, () => naHidratacao);
}

/* ---------- Ações da conta ---------- */

export async function entrar(email: string, senha: string) {
  const resposta = await pedirApi("/api/conta/entrar", "POST", { email, senha });
  if (resposta.status === 200) await atualizarConta(true);
  return resposta;
}

export function cadastrar(email: string, senha: string, concordo: boolean) {
  return pedirApi("/api/conta/cadastrar", "POST", { email, senha, concordo });
}

export async function confirmarEmail(tokenHash: string) {
  const resposta = await pedirApi("/api/conta/confirmar", "POST", { tokenHash });
  if (resposta.status === 200) await atualizarConta(true);
  return resposta;
}

export function pedirNovaSenha(email: string) {
  return pedirApi("/api/conta/esqueci", "POST", { email });
}

export async function trocarSenhaPeloLink(tokenHash: string, senha: string) {
  const resposta = await pedirApi("/api/conta/nova-senha", "POST", { tokenHash, senha });
  if (resposta.status === 200) await atualizarConta(true);
  return resposta;
}

/** Sair: a casa continua neste aparelho; só deixa de ir para a conta. */
export async function sair() {
  pararSincronia();
  const resposta = await pedirApi("/api/conta/sair", "POST", {});
  await atualizarConta(true);
  return resposta;
}

/** LGPD: apaga a conta, a casa no servidor e os links de convidado. A casa do aparelho sai pelo "Apagar tudo". */
export async function apagarConta() {
  pararSincronia();
  const resposta = await pedirApi("/api/conta/apagar", "POST", {});
  await atualizarConta(true);
  return resposta;
}

/* ---------- Links de convidado ---------- */

export interface Convite {
  id: string;
  nome: string | undefined;
  criadoEm: string;
}

function lerConvite(bruto: unknown): Convite | undefined {
  if (typeof bruto !== "object" || bruto === null) return undefined;
  const id = Reflect.get(bruto, "id");
  const nome = Reflect.get(bruto, "nome");
  const criadoEm = Reflect.get(bruto, "criadoEm");
  if (typeof id !== "string" || typeof criadoEm !== "string") return undefined;
  return { id, nome: typeof nome === "string" ? nome : undefined, criadoEm };
}

export async function listarConvites(): Promise<Convite[] | undefined> {
  const { status, corpo } = await pedirApi("/api/convites");
  const lista = corpo["convites"];
  if (status !== 200 || !Array.isArray(lista)) return undefined;
  return lista.map(lerConvite).filter((c): c is Convite => c !== undefined);
}

/** O endereço do link: o código vai depois do `#`, que o navegador nunca manda a servidor nenhum. */
export function enderecoDoConvite(codigo: string): string {
  return `${window.location.origin}/convidado#${codigo}`;
}

export async function criarConvite(nome: string) {
  const resposta = await pedirApi("/api/convites", "POST", { nome });
  const codigo = resposta.corpo["codigo"];
  const convite = lerConvite(resposta.corpo["convite"]);
  return resposta.status === 200 && typeof codigo === "string" && convite ? { ok: true as const, convite, endereco: enderecoDoConvite(codigo) } : { ok: false as const, mensagem: mensagemDoErro(resposta) };
}

export async function apagarConvite(id: string) {
  return pedirApi("/api/convites", "DELETE", { id });
}

/** O convidado: a casa do dono, só para ler. Passa pelo leitor da casa salva, como tudo que vem de fora. */
export async function casaDoConvidado(codigo: string): Promise<{ ok: true; casa: DadosCasa; atualizadaEm: string } | { ok: false; status: number; mensagem: string }> {
  const resposta = await pedirApi("/api/convidado", "POST", { codigo });
  const atualizadaEm = resposta.corpo["atualizadaEm"];
  if (resposta.status !== 200 || typeof atualizadaEm !== "string") {
    return { ok: false, status: resposta.status, mensagem: resposta.status === 404 ? "Este link não vale mais. Peça um novo a quem mandou." : mensagemDoErro(resposta) };
  }
  return { ok: true, casa: lerCasaSalva(resposta.corpo["casa"]).casa, atualizadaEm };
}

/* ---------- Sincronização da casa ---------- */

let sincronia: Sincronia = { tipo: "parada" };
let atualizadaEm: string | null = null;
let deixarDeOuvir: (() => void) | undefined;
let espera: ReturnType<typeof setTimeout> | undefined;
const ouvintesDaSincronia = new Set<() => void>();

function mudarSincronia(nova: Sincronia) {
  sincronia = nova;
  ouvintesDaSincronia.forEach((avisar) => avisar());
}

/** A casa do aparelho no mesmo formato da conta (o mesmo leitor dos dois lados). */
function casaDoAparelho(): DadosCasa {
  return lerCasaSalva(dadosSalvaveis(useCasa.getState())).casa;
}

const mesmaCasa = (a: DadosCasa, b: DadosCasa) => JSON.stringify(a) === JSON.stringify(b);
const temCasa = (casa: DadosCasa) => casa.residencia !== undefined || casa.aparelhos.length > 0;

/** Espera de 2 s depois da última mudança: digitar um número não vira dez gravações. */
const ESPERA_PARA_GRAVAR_MS = 2000;

async function gravar(): Promise<void> {
  mudarSincronia({ tipo: "sincronizando" });
  const resposta = await pedirApi("/api/casa", "PUT", { casa: casaDoAparelho(), versaoDoFormato: VERSAO_DA_CASA, atualizadaEm });
  const nova = resposta.corpo["atualizadaEm"];
  if (resposta.status === 200 && typeof nova === "string") {
    atualizadaEm = nova;
    return mudarSincronia({ tipo: "em-dia" });
  }
  if (resposta.status === 409) return trazerDaConta(true);
  if (resposta.status === 401) {
    pararSincronia();
    return atualizarConta(true);
  }
  mudarSincronia({ tipo: "pendente" });
}

/** Outro aparelho gravou antes: a versão da conta vale, e a pessoa é avisada. */
async function trazerDaConta(porConflito: boolean): Promise<void> {
  const { status, corpo } = await pedirApi("/api/casa");
  const data = corpo["atualizadaEm"];
  if (status !== 200) return mudarSincronia({ tipo: "pendente" });
  atualizadaEm = typeof data === "string" ? data : null;
  if (corpo["casa"]) useCasa.getState().trocarPelaCasaDaConta(corpo["casa"]);
  mudarSincronia({ tipo: porConflito ? "atualizada-de-outro-aparelho" : "em-dia" });
}

function ouvirMudancas() {
  deixarDeOuvir?.();
  deixarDeOuvir = useCasa.subscribe((agora, antes) => {
    if (mesmaCasa(lerCasaSalva(dadosSalvaveis(agora)).casa, lerCasaSalva(dadosSalvaveis(antes)).casa)) return;
    clearTimeout(espera);
    mudarSincronia({ tipo: "pendente" });
    espera = setTimeout(() => void gravar(), ESPERA_PARA_GRAVAR_MS);
  });
}

function pararSincronia() {
  deixarDeOuvir?.();
  deixarDeOuvir = undefined;
  clearTimeout(espera);
  atualizadaEm = null;
  mudarSincronia({ tipo: "parada" });
}

/**
 * Começa quando há conta e a casa do aparelho já foi lida:
 * - conta sem casa: envia a do aparelho (a pessoa concordou ao criar a conta);
 * - aparelho sem casa: traz a da conta;
 * - as duas iguais: nada a fazer;
 * - as duas diferentes: a pessoa escolhe qual fica.
 */
async function comecarSincronia(): Promise<void> {
  if (sincronia.tipo !== "parada" || useCasa.getState().versaoAntigaDoSite) return;
  mudarSincronia({ tipo: "sincronizando" });
  const { status, corpo } = await pedirApi("/api/casa");
  if (status !== 200) return mudarSincronia({ tipo: status === 401 ? "parada" : "pendente" });
  const data = corpo["atualizadaEm"];
  atualizadaEm = typeof data === "string" ? data : null;
  const local = casaDoAparelho();
  if (!corpo["casa"]) {
    ouvirMudancas();
    return temCasa(local) ? gravar() : mudarSincronia({ tipo: "em-dia" });
  }
  const daConta = lerCasaSalva(corpo["casa"]).casa;
  if (!temCasa(local)) {
    useCasa.getState().trocarPelaCasaDaConta(daConta);
    ouvirMudancas();
    return mudarSincronia({ tipo: "em-dia" });
  }
  if (mesmaCasa(local, daConta)) {
    ouvirMudancas();
    return mudarSincronia({ tipo: "em-dia" });
  }
  mudarSincronia({ tipo: "escolher", daConta });
}

/** A escolha da pessoa quando as casas são diferentes. */
export function escolherCasa(qual: "deste-aparelho" | "da-conta") {
  if (sincronia.tipo !== "escolher") return;
  if (qual === "da-conta") useCasa.getState().trocarPelaCasaDaConta(sincronia.daConta);
  ouvirMudancas();
  if (qual === "deste-aparelho") void gravar();
  else mudarSincronia({ tipo: "em-dia" });
}

export function dispensarAvisoDeOutroAparelho() {
  if (sincronia.tipo === "atualizada-de-outro-aparelho") mudarSincronia({ tipo: "em-dia" });
}

const assinarSincronia = (avisar: () => void) => {
  ouvintesDaSincronia.add(avisar);
  return () => ouvintesDaSincronia.delete(avisar);
};
const paradaNoServidor: Sincronia = { tipo: "parada" };

/**
 * Na Casca: liga a sincronização quando há conta e a casa já foi carregada. Sem internet, a mudança fica "pendente" e
 * vai quando a conexão volta.
 */
export function useSincronia(casaCarregada: boolean): Sincronia {
  const conta = useConta();
  useEffect(() => {
    if (conta.tipo === "conectada" && casaCarregada) void comecarSincronia();
  }, [conta.tipo, casaCarregada]);
  useEffect(() => {
    const aoVoltar = () => {
      if (sincronia.tipo === "pendente") void gravar();
    };
    window.addEventListener("online", aoVoltar);
    return () => window.removeEventListener("online", aoVoltar);
  }, []);
  return useSyncExternalStore(assinarSincronia, () => sincronia, () => paradaNoServidor);
}

export function useSincroniaAtual(): Sincronia {
  return useSyncExternalStore(assinarSincronia, () => sincronia, () => paradaNoServidor);
}
