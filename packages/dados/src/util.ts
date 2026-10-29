/** Remove acentos, deixa minúsculo e junta espaços — para comparar textos da ANEEL com segurança. */
export function normalizar(texto: string | undefined): string {
  return (texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** "CEMIG-D" → "cemig-d"; "LIGHT SESA" → "light-sesa" */
export function slug(texto: string): string {
  return normalizar(texto)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Converte números no formato brasileiro ("1.234,56" ou "289,45") ou internacional ("289.45"). */
export function numeroBR(valor: string | undefined): number | undefined {
  if (valor === undefined) return undefined;
  let v = valor.trim();
  if (v === "") return undefined;
  if (v.includes(",")) v = v.replace(/\./g, "").replace(",", ".");
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** Converte "2026-10-01", "2026-10-01T00:00:00" ou "01/10/2026" para "2026-10-01". */
export function dataISO(valor: string | undefined): string | undefined {
  if (!valor) return undefined;
  const v = valor.trim();
  let m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  m = v.match(/^(\d{4})-(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-01`;
  m = v.match(/^(\d{2})\/(\d{4})$/);
  if (m) return `${m[2]}-${m[1]}-01`;
  return undefined;
}

/** Data de hoje em Brasília, no formato AAAA-MM-DD. */
export function hojeISO(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(agora);
}

export type Linha = Record<string, string>;

/**
 * Encontra o nome real de uma coluna no cabeçalho, comparando sem acento/maiúsculas.
 * Aceita nomes exatos e, em último caso, expressões regulares — os conjuntos da ANEEL às vezes
 * mudam a grafia das colunas entre versões.
 */
export function acharColuna(cabecalho: string[], ...candidatos: (string | RegExp)[]): string | undefined {
  const norm = cabecalho.map((c) => ({ original: c, n: normalizar(c).replace(/[^a-z0-9]/g, "") }));
  for (const cand of candidatos) {
    if (typeof cand === "string") {
      const alvo = normalizar(cand).replace(/[^a-z0-9]/g, "");
      const achada = norm.find((c) => c.n === alvo);
      if (achada) return achada.original;
    } else {
      const achada = norm.find((c) => cand.test(c.n));
      if (achada) return achada.original;
    }
  }
  return undefined;
}

/** "Não se aplica", vazio e similares contam como "sem valor". */
export function semValor(texto: string | undefined): boolean {
  const n = normalizar(texto);
  return n === "" || n === "nao se aplica" || n === "-" || n === "na";
}
