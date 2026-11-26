import "server-only"; // primeiro import: usa o segredo do servidor (ADR-008)
import { createHmac, hkdfSync } from "node:crypto";
import { isIPv4, isIPv6 } from "node:net";

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
  const normalizado = tipo === "ip" ? redeDoIp(valor) : valor.trim().toLowerCase();
  return createHmac("sha256", chaveDoHmac(segredo)).update(`${tipo}:${normalizado}`, "utf8").digest();
}

/**
 * O que conta como "o mesmo lugar" (B4 da seguranca): IPv4 inteiro; IPv6 pela rede /64, que é o que uma casa ou um
 * celular recebe da operadora (trocar só o fim do endereço não zera o limite). IPv4 dentro de IPv6 (`::ffff:1.2.3.4`)
 * vira o IPv4.
 */
export function redeDoIp(ip: string): string {
  const valor = ip.trim().toLowerCase().replace(/%.*$/, "");
  if (isIPv4(valor)) return valor;
  const mapeado = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(valor)?.[1];
  if (mapeado && isIPv4(mapeado)) return mapeado;
  if (!isIPv6(valor)) return valor;
  const [antes = "", depois] = valor.split("::");
  const inicio = antes ? antes.split(":") : [];
  const fim = depois ? depois.split(":") : [];
  const grupos = depois === undefined ? inicio : [...inicio, ...Array<string>(Math.max(0, 8 - inicio.length - fim.length)).fill("0"), ...fim];
  return `${grupos
    .slice(0, 4)
    .map((grupo) => Number.parseInt(grupo || "0", 16).toString(16))
    .join(":")}::/64`;
}
