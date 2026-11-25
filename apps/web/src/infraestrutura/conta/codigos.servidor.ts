import "server-only"; // primeiro import: gera e confere o código do link de convidado (ADR-007)
import { createHash, randomBytes } from "node:crypto";

/** 32 bytes do gerador seguro do sistema, em base64url (43 caracteres): impossível de adivinhar. */
export function novoCodigoDeConvite(): string {
  return randomBytes(32).toString("base64url");
}

/** SHA-256 do código: é isso que o banco guarda e procura. O código mesmo nunca chega ao banco. */
export function hashDoCodigo(codigo: string): Buffer {
  return createHash("sha256").update(codigo, "utf8").digest();
}
