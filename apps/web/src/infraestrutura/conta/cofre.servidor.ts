import "server-only"; // primeiro import: cifra a casa com a chave do servidor antes de ir para o banco (ADR-008)
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * A casa vai para o banco cifrada (pedido do dono em 26/11, ADR-008): AES-256-GCM com a chave CASA_SEGREDO, que só
 * existe nas variáveis da Vercel. O banco guarda "v1." + base64url(iv | etiqueta | cifra). Quem só LÊ o banco sem a
 * chave (um backup vazado, uma consulta de leitura) não lê nada, e uma cifra mexida não abre (o GCM confere). A cifra é
 * amarrada ao dono (AAD): copiada para a linha de outra pessoa, não abre (M1 da seguranca). Não protege de quem pode
 * ESCREVER no banco: esse troca a senha da pessoa no auth e entra pelo site (M2; ADR-008).
 *
 * A chave é outra que a da sessão de propósito: trocar o SESSAO_SEGREDO (a resposta a um vazamento do cookie) tira todo
 * mundo da conta, mas não pode deixar as casas ilegíveis. Perder o CASA_SEGREDO perde as casas guardadas na conta (as
 * dos aparelhos continuam): o guia manda guardar uma cópia num gerenciador de senhas.
 */
const VERSAO = "v1";
/** Amarra a cifra a este uso e ao dono: uma cifra da sessão, ou a casa de outra pessoa, não abre aqui. */
function contexto(dono: string): Buffer {
  return Buffer.from(`eficiencia-energetica:casa:v1:${dono}`, "utf8");
}
const TAMANHO_DO_IV = 12;
const TAMANHO_DA_ETIQUETA = 16;

export function cifrarCasa(dados: unknown, chave: Uint8Array, dono: string): string {
  const iv = randomBytes(TAMANHO_DO_IV);
  const cifra = createCipheriv("aes-256-gcm", chave, iv);
  cifra.setAAD(contexto(dono));
  const corpo = Buffer.concat([cifra.update(JSON.stringify(dados), "utf8"), cifra.final()]);
  return `${VERSAO}.${Buffer.concat([iv, cifra.getAuthTag(), corpo]).toString("base64url")}`;
}

/** A casa de volta, ou `undefined` se a cifra estiver mexida, for de outra chave ou de outro formato. */
export function decifrarCasa(texto: string, chave: Uint8Array, dono: string): unknown {
  if (!texto.startsWith(`${VERSAO}.`)) return undefined;
  const bytes = Buffer.from(texto.slice(VERSAO.length + 1), "base64url");
  if (bytes.length <= TAMANHO_DO_IV + TAMANHO_DA_ETIQUETA) return undefined;
  try {
    const decifra = createDecipheriv("aes-256-gcm", chave, bytes.subarray(0, TAMANHO_DO_IV));
    decifra.setAAD(contexto(dono));
    decifra.setAuthTag(bytes.subarray(TAMANHO_DO_IV, TAMANHO_DO_IV + TAMANHO_DA_ETIQUETA));
    const json = Buffer.concat([decifra.update(bytes.subarray(TAMANHO_DO_IV + TAMANHO_DA_ETIQUETA)), decifra.final()]).toString("utf8");
    const dados: unknown = JSON.parse(json);
    return dados;
  } catch {
    return undefined;
  }
}
