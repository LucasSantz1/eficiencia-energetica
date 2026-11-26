import "server-only"; // primeiro import: usa o segredo do servidor (ADR-008)
import { createHmac, hkdfSync } from "node:crypto";

/**
 * A chave com que o banco conta as tentativas (ADR-008): um HMAC do IP ou do e-mail, nunca o valor. Sem o segredo
 * do servidor, ninguém descobre de quem é uma linha nem consegue gastar as tentativas de outra pessoa chamando a
 * função do banco direto. Vem do SESSAO_SEGREDO: trocar o segredo só zera as contagens.
 */
export type ChaveDaTentativa = Buffer;

function chaveDoHmac(segredo: Uint8Array): Buffer {
  return Buffer.from(hkdfSync("sha256", segredo, new Uint8Array(0), "eficiencia-energetica:tentativas:v1", 32));
}

export function chaveDaTentativa(segredo: Uint8Array, tipo: "ip" | "email", valor: string): ChaveDaTentativa {
  return createHmac("sha256", chaveDoHmac(segredo)).update(`${tipo}:${valor.trim().toLowerCase()}`, "utf8").digest();
}
