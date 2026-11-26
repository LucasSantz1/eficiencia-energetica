import "server-only"; // primeiro import: cifra a sessão com o segredo do servidor (ADR-007)
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

/**
 * O cookie da sessão (ADR-007): um só, `__Host-sessao`, com os tokens do Supabase CIFRADOS (AES-256-GCM). Sem a chave,
 * ele não diz nada (nem e-mail, nem id, nem token legível), e o GCM recusa qualquer mudança no texto. `HttpOnly`: o
 * JavaScript da página não o lê. `Secure` + `__Host-`: só por HTTPS, só deste site, sem `Domain`. `SameSite=Lax`:
 * outro site não consegue mandar um POST com ele.
 */
export const NOME_DO_COOKIE = "__Host-sessao";
/**
 * O refresh token do Supabase não expira sozinho. Aqui a sessão dura no máximo 30 dias desde que a pessoa entrou, com
 * ou sem uso (B4 da seguranca): depois disso, entra de novo com a senha. O cookie também some 30 dias sem uso.
 */
export const DURACAO_DA_SESSAO_S = 30 * 24 * 60 * 60;

export interface TokensDaSessao {
  acesso: string;
  renovacao: string;
  /** Quando o token de acesso expira, em segundos desde 1970. */
  expiraEm: number;
  /** Quando a pessoa entrou com a senha (ou pelo link do e-mail), em segundos desde 1970. Renovar não muda. */
  inicio?: number;
}

/** 2: com `i` (início da sessão, B4). O cookie 1, de antes, ainda abre: conta o início a partir de agora. */
const VERSAO = 2;
const TAMANHO_DO_IV = 12;
const TAMANHO_DA_ETIQUETA = 16;
/** Teto do texto do cookie: o navegador aceita 4 096 bytes; um cookie maior que isso é lixo. */
const TAMANHO_MAXIMO_DO_COOKIE = 4096;

function chaveDe(segredo: Uint8Array): Buffer {
  return Buffer.from(hkdfSync("sha256", segredo, new Uint8Array(0), "eficiencia-energetica:sessao:v1", 32));
}

export function cifrarSessao(tokens: TokensDaSessao, segredo: Uint8Array): string {
  const iv = randomBytes(TAMANHO_DO_IV);
  const cifra = createCipheriv("aes-256-gcm", chaveDe(segredo), iv);
  const texto = JSON.stringify({ v: VERSAO, a: tokens.acesso, r: tokens.renovacao, e: tokens.expiraEm, i: tokens.inicio });
  const corpo = Buffer.concat([cifra.update(texto, "utf8"), cifra.final()]);
  return Buffer.concat([iv, cifra.getAuthTag(), corpo]).toString("base64url");
}

/** `undefined` para qualquer cookie que não foi este servidor que cifrou (ou que alguém mexeu). Nunca lança. */
export function decifrarSessao(cookie: string | undefined, segredo: Uint8Array): TokensDaSessao | undefined {
  if (!cookie || cookie.length > TAMANHO_MAXIMO_DO_COOKIE || !/^[A-Za-z0-9_-]+$/.test(cookie)) return undefined;
  try {
    const bruto = Buffer.from(cookie, "base64url");
    if (bruto.length <= TAMANHO_DO_IV + TAMANHO_DA_ETIQUETA) return undefined;
    const decifra = createDecipheriv("aes-256-gcm", chaveDe(segredo), bruto.subarray(0, TAMANHO_DO_IV));
    decifra.setAuthTag(bruto.subarray(TAMANHO_DO_IV, TAMANHO_DO_IV + TAMANHO_DA_ETIQUETA));
    const texto = Buffer.concat([decifra.update(bruto.subarray(TAMANHO_DO_IV + TAMANHO_DA_ETIQUETA)), decifra.final()]).toString("utf8");
    const dados: unknown = JSON.parse(texto);
    if (typeof dados !== "object" || dados === null || Array.isArray(dados)) return undefined;
    // Só propriedade própria (nada de __proto__), como os leitores do ADR-004.
    const [v, a, r, e, i] = ["v", "a", "r", "e", "i"].map((chave) => (Object.hasOwn(dados, chave) ? Reflect.get(dados, chave) : undefined));
    if ((v !== 1 && v !== VERSAO) || typeof a !== "string" || typeof r !== "string" || typeof e !== "number") return undefined;
    return { acesso: a, renovacao: r, expiraEm: e, ...(typeof i === "number" ? { inicio: i } : {}) };
  } catch {
    return undefined;
  }
}

/** Atributos do cookie. Em `next dev` (http://localhost) o `Secure` continua: o Chrome aceita em localhost. */
export const ATRIBUTOS_DO_COOKIE = { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: DURACAO_DA_SESSAO_S } as const;
