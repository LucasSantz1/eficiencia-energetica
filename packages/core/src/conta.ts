/**
 * Regras da conta opcional e do link de convidado (E4, ADR-007): o que o formulário aceita e o que o servidor confere
 * de novo antes de mandar ao Supabase. Mesmas regras nos dois lados, sem depender de nenhum dos dois.
 */

/** RFC 5321: um endereço de e-mail tem no máximo 254 caracteres. */
export const TAMANHO_MAXIMO_DO_EMAIL = 254;
/** Senha curta cai fácil por tentativa; 8 é o mínimo do NIST SP 800-63B (2017, revisão 4 em 2025). */
export const TAMANHO_MINIMO_DA_SENHA = 8;
/** O Supabase guarda a senha com bcrypt, que só usa os primeiros 72 bytes: além disso a senha "encurta" sem avisar. */
export const BYTES_MAXIMOS_DA_SENHA = 72;
/** Nome do link de convidado ("Mãe", "Vizinha"): só para o dono reconhecer na lista. Igual ao limite do banco. */
export const TAMANHO_MAXIMO_DO_NOME_DO_CONVITE = 40;

const FORMATO_DO_EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

/** Tamanho em bytes no UTF-8 (o que o bcrypt conta), sem depender de TextEncoder: o core não tem as APIs do navegador. */
function bytesEmUtf8(texto: string): number {
  let bytes = 0;
  for (const letra of texto) {
    const codigo = letra.codePointAt(0) ?? 0;
    bytes += codigo < 0x80 ? 1 : codigo < 0x800 ? 2 : codigo < 0x10000 ? 3 : 4;
  }
  return bytes;
}

export type Conferido<T> = { ok: true; valor: T } | { ok: false; mensagem: string };

/** Tira espaços e deixa minúsculo: "Ana@Exemplo.org " e "ana@exemplo.org" são a mesma conta. */
export function conferirEmail(texto: unknown): Conferido<string> {
  if (typeof texto !== "string" || texto.trim() === "") return { ok: false, mensagem: "Escreva o seu e-mail." };
  const email = texto.trim().toLowerCase();
  if (email.length > TAMANHO_MAXIMO_DO_EMAIL || !FORMATO_DO_EMAIL.test(email)) return { ok: false, mensagem: "Confira o e-mail: ele tem um @ e um ponto, como ana@gmail.com." };
  return { ok: true, valor: email };
}

/** A senha não é mudada (nem os espaços): o que a pessoa digitou é o que vale. */
export function conferirSenha(texto: unknown): Conferido<string> {
  if (typeof texto !== "string" || texto === "") return { ok: false, mensagem: "Escreva uma senha." };
  if (texto.length < TAMANHO_MINIMO_DA_SENHA) return { ok: false, mensagem: `A senha precisa ter pelo menos ${TAMANHO_MINIMO_DA_SENHA} letras ou números.` };
  if (bytesEmUtf8(texto) > BYTES_MAXIMOS_DA_SENHA) return { ok: false, mensagem: "A senha está grande demais. Use uma mais curta." };
  return { ok: true, valor: texto };
}

/** Nome opcional do link: vazio vira `undefined`; sem quebra de linha nem caractere de controle. */
export function conferirNomeDoConvite(texto: unknown): Conferido<string | undefined> {
  if (texto === undefined || texto === null) return { ok: true, valor: undefined };
  if (typeof texto !== "string") return { ok: false, mensagem: "Escreva um nome curto." };
  // \p{Cc}: caracteres de controle (quebra de linha, tabulação, NUL).
  const nome = texto.replace(/\p{Cc}/gu, " ").trim();
  if (nome === "") return { ok: true, valor: undefined };
  if ([...nome].length > TAMANHO_MAXIMO_DO_NOME_DO_CONVITE) return { ok: false, mensagem: `Use até ${TAMANHO_MAXIMO_DO_NOME_DO_CONVITE} letras.` };
  return { ok: true, valor: nome };
}

/** O código do link de convidado: 32 bytes aleatórios em base64url (43 caracteres, sem "="). */
export const FORMATO_DO_CODIGO_DO_CONVITE = /^[A-Za-z0-9_-]{43}$/;
