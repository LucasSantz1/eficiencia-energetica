/**
 * Saída segura para o log do GitHub Actions (HIS-111, R2 da seguranca).
 *
 * O runner lê como comando toda linha do log que começa com "::" (ex.: `::add-mask::`, `::stop-commands::`).
 * Siglas, nomes e cabeçalhos vêm do CSV da ANEEL e podem trazer quebra de linha dentro de um campo entre aspas.
 * Sem escape, um texto assim abriria uma linha nova começando com "::" e viraria comando.
 * Regras de escape: https://github.com/actions/toolkit/blob/main/packages/core/src/command.ts
 */

/** Escapa o texto de uma anotação (`::notice::texto`): `%`, `\r` e `\n`, nessa ordem. */
export function escaparDadoDeComando(texto: string): string {
  return texto.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
}

/** Escapa uma propriedade da anotação (`title=`): além do texto, `:` e `,` separam propriedades. */
export function escaparPropriedadeDeComando(texto: string): string {
  return escaparDadoDeComando(texto).replace(/:/g, "%3A").replace(/,/g, "%2C");
}

/** Monta a linha `::notice title=…::texto` (ou `::warning`) já escapada. */
export function anotacao(tipo: "notice" | "warning", titulo: string, texto: string): string {
  return `::${tipo} title=${escaparPropriedadeDeComando(titulo)}::${escaparDadoDeComando(texto)}`;
}

/**
 * Deixa um texto em uma linha só, para o log comum: troca quebras de linha e outros caracteres de controle por
 * espaço. Assim nenhum texto de fora consegue começar uma linha nova do log.
 */
export function umaLinha(texto: string): string {
  return texto.replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, " ");
}

/** Maior pedaço de texto de uma célula do resumo do job (R2). */
export const LIMITE_CELULA = 80;
/** O GitHub aceita até 1 MiB no `$GITHUB_STEP_SUMMARY`; 64 KiB bastam e deixam o resumo legível (R2). */
export const LIMITE_RESUMO_BYTES = 64 * 1024;

/**
 * Texto de fora numa tabela Markdown do resumo: uma linha só, sem `|` (quebraria a tabela), sem `<` (HTML) e sem
 * crase (código), cortado em 80 caracteres (as listas do portão, fora de tabela, usam um limite maior).
 */
export function celulaMarkdown(texto: string, limite: number = LIMITE_CELULA): string {
  const limpo = umaLinha(texto).replace(/[|<`]/g, "").trim();
  return limpo.length > limite ? `${limpo.slice(0, limite - 1)}…` : limpo;
}

/** Corta o resumo inteiro em 64 KiB, sem partir um caractere no meio. */
export function limitarResumo(texto: string): string {
  const bytes = Buffer.from(texto, "utf8");
  if (bytes.length <= LIMITE_RESUMO_BYTES) return texto;
  const aviso = "\n\n_(resumo cortado em 64 KiB; o log do job tem tudo)_\n";
  const espaco = LIMITE_RESUMO_BYTES - Buffer.byteLength(aviso, "utf8");
  // O decodificador troca o pedaço de caractere cortado por U+FFFD; tirar esse resto deixa o texto limpo.
  const cortado = new TextDecoder("utf-8").decode(bytes.subarray(0, espaco)).replace(/\uFFFD+$/, "");
  return cortado + aviso;
}

/** O GitHub mostra até 10 anotações de cada tipo por passo; 9 deixam uma livre para avisos da própria rotina. */
export const MAXIMO_ANOTACOES_DO_RESUMO = 9;
/** Tamanho de cada pedaço do resumo numa anotação (caracteres antes do escape). */
export const TAMANHO_PEDACO_ANOTACAO = 6000;

/**
 * O resumo do diagnóstico também sai como anotações `::notice`. O log do job e o `$GITHUB_STEP_SUMMARY` não podem ser
 * lidos pela API a partir do ambiente da equipe (o download do log dá 403), mas as anotações podem
 * (`check-runs/{id}/annotations`), como já fazia a rotina diária. O texto é cortado em linhas inteiras e escapado (R2).
 */
export function anotacoesDoResumo(markdown: string): string[] {
  const pedacos: string[] = [];
  let atual = "";
  for (const linha of markdown.split("\n")) {
    const limpa = umaLinha(linha);
    if (atual && atual.length + limpa.length + 1 > TAMANHO_PEDACO_ANOTACAO) {
      pedacos.push(atual);
      atual = "";
    }
    atual = atual ? `${atual}\n${limpa.slice(0, TAMANHO_PEDACO_ANOTACAO)}` : limpa.slice(0, TAMANHO_PEDACO_ANOTACAO);
  }
  if (atual) pedacos.push(atual);
  const total = pedacos.length;
  return pedacos
    .slice(0, MAXIMO_ANOTACOES_DO_RESUMO)
    .map((pedaco, i) => anotacao("notice", `Diagnóstico ${i + 1}/${total}`, pedaco));
}
