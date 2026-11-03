// Confere as regras de camadas que dependem de outro arquivo ou da estrutura das pastas (ADR-001; HIS-002b, D5).
// As regras que se decidem olhando só o próprio arquivo (matriz de camadas, zustand, módulos do Node, server-only,
// require e import dinâmico, sintaxe proibida) ficam no ESLint (eslint.config.mjs). Os casos de cada regra estão em
// scripts/testes/casos-de-camadas.mjs. Roda dentro do `pnpm typecheck` e, por isso, no CI de todo PR.
//
// O script só LÊ: usa o parser do TypeScript só para a sintaxe (ts.createSourceFile; nunca o programa inteiro do TS, tsconfig
// ou plugins), não executa nem importa os arquivos lidos, não usa rede, não escreve e não abre outros processos.
// Não tem try/catch: qualquer exceção termina com código diferente de 0, para a barreira nunca dizer "tudo certo"
// por engano (sem o typescript instalado, o import abaixo falha).

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

/** `--raiz=<pasta>` só para os testes (scripts/testes/); sem ele, a raiz vem do lugar do script, não da pasta atual. */
function lerRaiz(argumentos) {
  const raiz = path.resolve(import.meta.dirname, "..");
  if (argumentos.length === 0) return raiz;
  const [unico] = argumentos;
  if (argumentos.length > 1 || unico === undefined || !unico.startsWith("--raiz=") || unico.length === "--raiz=".length) {
    throw new Error("uso: node scripts/verificar-camadas.mjs [--raiz=<pasta>]");
  }
  return path.resolve(unico.slice("--raiz=".length));
}

const RAIZ = lerRaiz(process.argv.slice(2));
const SITE = path.join(RAIZ, "apps", "web", "src");
const DOMINIO = path.join(RAIZ, "packages", "core", "src");

// C5 (S1-c): toda extensão de código, nas duas pastas.
const EXTENSOES = [".js", ".jsx", ".cjs", ".mjs", ".ts", ".tsx", ".cts", ".mts"];
const CAMADAS_SIMPLES = new Set(["app", "ui", "aplicacao", "infraestrutura", "config"]);
const ARQUIVO_SERVIDOR = /\.servidor\.(js|jsx|cjs|mjs|ts|tsx|cts|mts)$/;
const ESPECIFICADOR_SERVIDOR = /\.servidor(\.[a-z]+)?$/;

// C10 (Ab3 da seguranca): a única forma aceita de comentário que muda regra do ESLint é a da HIS-109.
const EXCECAO_HIS_109 = /^\/\/ eslint-disable-next-line react-hooks\/set-state-in-effect -- \S.{9,} \(HIS-109\)$/;
const COMECO_DE_DIRETIVA = /^(eslint|(global|globals|exported)\s)/;
const DIRETIVA_EM_QUALQUER_PONTO = /eslint-(disable|enable)/;

const problemas = [];
let comentariosDaHis109 = 0;

function relativoARaiz(arquivo) {
  return path.relative(RAIZ, arquivo).split(path.sep).join("/");
}

function anotar(arquivo, especificador, mensagem) {
  const destino = especificador === undefined ? "" : ` → ${especificador}`;
  problemas.push(`${relativoARaiz(arquivo)}${destino}: ${mensagem}`);
}

/** Lista os arquivos de código da pasta. Link simbólico é erro (C4), conferido antes de ler qualquer coisa. */
function listarArquivos(pasta) {
  const encontrados = [];
  for (const entrada of readdirSync(pasta, { withFileTypes: true })) {
    const caminho = path.join(pasta, entrada.name);
    if (entrada.isSymbolicLink()) {
      anotar(caminho, undefined, "link simbólico não é permitido (HIS-002b, C4): troque pelo arquivo ou pasta de verdade");
    } else if (entrada.isDirectory()) {
      if (entrada.name !== "node_modules") encontrados.push(...listarArquivos(caminho));
    } else if (entrada.isFile() && EXTENSOES.includes(path.extname(entrada.name))) {
      encontrados.push(caminho);
    }
  }
  return encontrados;
}

function tipoDeScript(arquivo) {
  const extensao = path.extname(arquivo);
  if (extensao === ".tsx") return ts.ScriptKind.TSX;
  if (extensao === ".jsx") return ts.ScriptKind.JSX;
  if ([".js", ".cjs", ".mjs"].includes(extensao)) return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

/** A diretiva sai do prólogo do AST (as primeiras instruções que são só texto), não do texto cru. */
function temDiretivaCliente(arquivoTs) {
  for (const instrucao of arquivoTs.statements) {
    if (!ts.isExpressionStatement(instrucao) || !ts.isStringLiteral(instrucao.expression)) return false;
    if (instrucao.expression.text === "use client") return true;
  }
  return false;
}

/** import, import type, export … from, export * e import x = …: tudo que traz algo de outro módulo. */
function lerImports(arquivoTs) {
  const imports = [];
  for (const instrucao of arquivoTs.statements) {
    if (ts.isImportDeclaration(instrucao) && ts.isStringLiteral(instrucao.moduleSpecifier)) {
      imports.push({ especificador: instrucao.moduleSpecifier.text, instrucao, ehEfeito: instrucao.importClause === undefined });
    } else if (ts.isExportDeclaration(instrucao) && instrucao.moduleSpecifier && ts.isStringLiteral(instrucao.moduleSpecifier)) {
      imports.push({ especificador: instrucao.moduleSpecifier.text, instrucao, ehEfeito: false });
    } else if (
      ts.isImportEqualsDeclaration(instrucao) &&
      ts.isExternalModuleReference(instrucao.moduleReference) &&
      ts.isStringLiteral(instrucao.moduleReference.expression)
    ) {
      imports.push({ especificador: instrucao.moduleReference.expression.text, instrucao, ehEfeito: false });
    }
  }
  return imports;
}

/**
 * Todos os comentários do arquivo, com a posição. Percorre os tokens que o parser montou (assim um "//" dentro de
 * texto de JSX ou de uma string não vira comentário) e lê os comentários antes e depois de cada um.
 */
function lerComentarios(arquivoTs) {
  const texto = arquivoTs.text;
  const tokens = [];
  const visitar = (no) => {
    const filhos = no.kind === ts.SyntaxKind.JsxText ? [] : no.getChildren(arquivoTs);
    if (filhos.length === 0) tokens.push(no);
    else filhos.forEach(visitar);
  };
  visitar(arquivoTs);

  const porPosicao = new Map();
  const guardar = (faixas) => {
    for (const faixa of faixas ?? []) porPosicao.set(faixa.pos, texto.slice(faixa.pos, faixa.end));
  };
  const ehTextoDeJsx = (token) => token !== undefined && token.kind === ts.SyntaxKind.JsxText;
  tokens.forEach((token, indice) => {
    if (ehTextoDeJsx(token)) return;
    // Comentário na linha de cima fica antes do token; na mesma linha, depois do token anterior.
    guardar(ts.getLeadingCommentRanges(texto, token.pos));
    if (!ehTextoDeJsx(tokens[indice + 1])) guardar(ts.getTrailingCommentRanges(texto, token.end));
  });
  return [...porPosicao].map(([posicao, comentario]) => ({ posicao, comentario }));
}

function ehComentarioDeLinhaInteira(texto, posicao) {
  const inicioDaLinha = texto.lastIndexOf("\n", posicao - 1) + 1;
  return texto.slice(inicioDaLinha, posicao).trim() === "";
}

/** C10: comentário que muda regra do ESLint (Ab3 da seguranca; critério 11 automático). */
function conferirComentarios(arquivo, arquivoTs) {
  for (const { posicao, comentario } of lerComentarios(arquivoTs)) {
    const corpo = comentario.startsWith("//") ? comentario.slice(2) : comentario.slice(2, -2);
    const semComeco = corpo.replace(/^[\s*]+/, "");
    if (!COMECO_DE_DIRETIVA.test(semComeco) && !DIRETIVA_EM_QUALQUER_PONTO.test(comentario)) continue;
    if (EXCECAO_HIS_109.test(comentario) && ehComentarioDeLinhaInteira(arquivoTs.text, posicao)) {
      comentariosDaHis109 += 1;
      continue;
    }
    const linha = arquivoTs.getLineAndCharacterOfPosition(posicao).line + 1;
    anotar(arquivo, undefined, `comentário que muda regra do ESLint não é permitido (só o da HIS-109): ${relativoARaiz(arquivo)}:${linha}`);
  }
}

function ehArquivo(caminho) {
  return existsSync(caminho) && statSync(caminho).isFile();
}

/** Caminho do arquivo de destino de um import interno (`@/` ou relativo), sem extensão ou com uma das 8. */
function resolverInterno(arquivo, especificador) {
  const base = especificador.startsWith("@/") ? path.join(SITE, especificador.slice(2)) : path.resolve(path.dirname(arquivo), especificador);
  return [base, ...EXTENSOES.map((extensao) => base + extensao)].find(ehArquivo);
}

function ehInterno(especificador, noSite) {
  return (noSite && especificador.startsWith("@/")) || especificador.startsWith("./") || especificador.startsWith("../");
}

/** "app", "ui", "funcionalidades/<nome>"... ou undefined quando o arquivo está fora das camadas. */
function camadaDe(caminho) {
  const partes = path.relative(SITE, caminho).split(path.sep);
  const [primeira] = partes;
  if (partes.length < 2 || primeira === undefined) return undefined;
  if (primeira === "funcionalidades") return partes.length < 3 ? undefined : `funcionalidades/${partes[1]}`;
  return CAMADAS_SIMPLES.has(primeira) ? primeira : undefined;
}

function lerArquivo(arquivo) {
  const texto = readFileSync(arquivo, "utf8");
  const arquivoTs = ts.createSourceFile(arquivo, texto, ts.ScriptTarget.Latest, true, tipoDeScript(arquivo));
  return { arquivo, arquivoTs, imports: lerImports(arquivoTs), ehCliente: temDiretivaCliente(arquivoTs) };
}

/** C6: todo *.servidor.* tem `import "server-only";` como primeiro import. */
function conferirServidor({ arquivo, imports }) {
  const [primeiro] = imports;
  const ok = primeiro !== undefined && primeiro.ehEfeito && primeiro.especificador === "server-only";
  if (!ok) anotar(arquivo, undefined, 'todo *.servidor.ts começa com import "server-only"; como primeiro import (ADR-001)');
}

// C8 (S2): componente é nome em PascalCase com ao menos uma minúscula (TransicaoTela sim; VOLTAR, novoId, useCasa não).
const NOME_DE_COMPONENTE = /^[A-Z](?=[A-Za-z0-9]*[a-z])[A-Za-z0-9]*$/;

/**
 * Nomes de valor que um import ou reexport traz, sem os tipos. `undefined` quando traz o módulo inteiro
 * (`import * as`, `export *`, `import x = …`), o que de um módulo "use client" nunca é permitido.
 */
function valoresTrazidos(instrucao) {
  const nomeImportado = (elemento) => (elemento.propertyName && elemento.propertyName.text !== "default" ? elemento.propertyName.text : elemento.name.text);
  if (ts.isImportDeclaration(instrucao)) {
    const clausula = instrucao.importClause;
    if (clausula === undefined || clausula.isTypeOnly) return [];
    const nomes = clausula.name ? [clausula.name.text] : []; // no default, vale o nome local
    const ligacoes = clausula.namedBindings;
    if (ligacoes && ts.isNamespaceImport(ligacoes)) return undefined;
    for (const elemento of ligacoes?.elements ?? []) if (!elemento.isTypeOnly) nomes.push(nomeImportado(elemento));
    return nomes;
  }
  if (ts.isExportDeclaration(instrucao)) {
    if (instrucao.isTypeOnly) return [];
    const clausula = instrucao.exportClause;
    if (clausula === undefined || ts.isNamespaceExport(clausula)) return undefined;
    return clausula.elements.filter((elemento) => !elemento.isTypeOnly).map(nomeImportado);
  }
  return undefined;
}

/** C8: arquivo sem "use client" só leva componentes (e tipos) de um módulo "use client" do site. */
function conferirValoresDeCliente({ arquivo, imports, ehCliente }, clientes) {
  if (ehCliente) return;
  for (const { especificador, instrucao } of imports) {
    if (!ehInterno(especificador, true)) continue;
    const destino = resolverInterno(arquivo, especificador);
    if (destino === undefined || !clientes.has(destino)) continue;
    const nomes = valoresTrazidos(instrucao);
    const proibidos = nomes === undefined ? [ts.isExportDeclaration(instrucao) ? "export *" : "import * as"] : nomes.filter((nome) => !NOME_DE_COMPONENTE.test(nome));
    for (const nome of proibidos) {
      anotar(arquivo, undefined, `arquivo sem "use client" só importa componentes de um módulo "use client" (S2): ${nome} de ${especificador}`);
    }
  }
}

/** C7 e C9: destino interno existe; arquivo "use client" não importa *.servidor (nem com import type). */
function conferirDestinos({ arquivo, imports, ehCliente }, noSite) {
  for (const { especificador } of imports) {
    if (!ehInterno(especificador, noSite)) continue;
    const destino = resolverInterno(arquivo, especificador);
    if (destino === undefined) {
      anotar(arquivo, especificador, "destino não encontrado (HIS-002b, C9): confira o caminho do import");
      continue;
    }
    if (ehCliente && (ESPECIFICADOR_SERVIDOR.test(especificador) || ARQUIVO_SERVIDOR.test(destino))) {
      anotar(arquivo, especificador, 'arquivo com "use client" não pode importar código só de servidor (ADR-001)');
    }
  }
}

for (const antiga of ["components", "lib"]) {
  const pasta = path.join(SITE, antiga);
  if (existsSync(pasta)) anotar(pasta, undefined, "pasta antiga ainda existe (HIS-001): mova o conteúdo para as camadas");
}

const arquivosDoSite = existsSync(SITE) ? listarArquivos(SITE) : [];
const arquivosDoDominio = existsSync(DOMINIO) ? listarArquivos(DOMINIO) : [];
for (const [pasta, arquivos] of [[SITE, arquivosDoSite], [DOMINIO, arquivosDoDominio]]) {
  if (arquivos.length === 0) anotar(pasta, undefined, `nenhum arquivo lido em ${relativoARaiz(pasta)}`);
}

const lidosDoSite = arquivosDoSite.map(lerArquivo);
const lidosDoDominio = arquivosDoDominio.map(lerArquivo);
const modulosDeCliente = new Set(lidosDoSite.filter((lido) => lido.ehCliente).map((lido) => lido.arquivo));

for (const lido of lidosDoSite) {
  if (camadaDe(lido.arquivo) === undefined) {
    anotar(lido.arquivo, undefined, "arquivo fora das camadas (ADR-001): mova para app, funcionalidades/<nome>, ui, aplicacao, infraestrutura ou config");
  }
  if (ARQUIVO_SERVIDOR.test(lido.arquivo)) conferirServidor(lido);
  conferirDestinos(lido, true);
  conferirValoresDeCliente(lido, modulosDeCliente);
  conferirComentarios(lido.arquivo, lido.arquivoTs);
}
for (const lido of lidosDoDominio) {
  conferirDestinos(lido, false);
  conferirComentarios(lido.arquivo, lido.arquivoTs);
}

const total = lidosDoSite.length + lidosDoDominio.length;
if (problemas.length > 0) {
  for (const problema of problemas) console.error(problema);
  console.error(`${problemas.length} problema(s)`);
  process.exitCode = 1;
} else {
  console.log(`Camadas: tudo certo (${total} arquivos; ${comentariosDaHis109} comentário(s) da HIS-109)`);
}
