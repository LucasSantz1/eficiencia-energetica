// Verifica as regras de dependência entre camadas do ADR-001 (docs/equipe/decisoes/ADR-001-camadas.md).
// Roda dentro do `pnpm typecheck` e, por isso, no CI de todo PR. Desenho: HIS-001, seção 6.
//
// O script só LÊ arquivos: não executa, não importa os arquivos lidos, não usa rede e não escreve nada.
// Ele não tem try/catch: qualquer exceção termina o processo com código diferente de 0, para a barreira
// nunca dizer "tudo certo" por engano. Na HIS-002 decide-se se o ESLint substitui ou convive com ele.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { builtinModules } from "node:module";
import path from "node:path";

// A raiz vem do lugar do script, não da pasta de onde ele foi chamado: assim funciona de qualquer `cwd`.
const RAIZ = path.resolve(import.meta.dirname, "..");
const SITE = path.join(RAIZ, "apps", "web", "src");
const DOMINIO = path.join(RAIZ, "packages", "core", "src");

const EXTENSOES_SITE = [".ts", ".tsx", ".mts", ".mjs"];
const EXTENSOES_DOMINIO = [".ts"];
const PASTAS_IGNORADAS = new Set(["node_modules", ".next"]);

/** Quem cada camada pode importar (destino interno). O resto é erro. */
const PERMITIDOS = {
  app: ["app", "funcionalidades/*", "ui", "aplicacao", "config"],
  "funcionalidades/*": ["mesma funcionalidade", "ui", "aplicacao", "config"],
  ui: ["ui", "config"],
  aplicacao: ["aplicacao", "infraestrutura", "config"],
  infraestrutura: ["infraestrutura", "config"],
  config: ["config"],
};

/** Número da regra no ADR-001, para a mensagem apontar onde ler. */
const REGRA_DO_ADR = { app: 1, "funcionalidades/*": 2, aplicacao: 3, ui: 4, infraestrutura: 5 };

const CAMADAS_SIMPLES = new Set(["app", "ui", "aplicacao", "infraestrutura", "config"]);

// Imports em várias linhas e `import type` caem no primeiro padrão (o `from` fica perto do texto).
const PADROES_DE_IMPORT = [
  /\bfrom\s+["']([^"']+)["']/g,
  /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  /^\s*import\s+["']([^"']+)["']/gm,
];
// O projeto é ESM: `require` não deveria aparecer. Um `import(` sem texto fixo (variável, template string)
// o verificador não consegue conferir. Texto parecido em comentário também acusa: preferimos o falso positivo.
const REQUIRE = /\brequire\s*\(/;
const IMPORT_NAO_LITERAL = /\bimport\s*\((?!\s*["'][^"'`]+["']\s*\))/;

const DESTINO_SERVIDOR = /\.servidor(\.tsx?)?$/;
const ARQUIVO_SERVIDOR = /\.servidor\.tsx?$/;
const DIRETIVA_CLIENTE = /^["']use client["']\s*;?/;

const problemas = [];

function relativoARaiz(arquivo) {
  return path.relative(RAIZ, arquivo).split(path.sep).join("/");
}

function anotar(arquivo, especificador, mensagem) {
  const destino = especificador === undefined ? "" : ` → ${especificador}`;
  problemas.push(`${relativoARaiz(arquivo)}${destino}: ${mensagem}`);
}

/** Lista os arquivos da pasta, sem seguir links simbólicos e sem entrar em node_modules/.next. */
function listarArquivos(pasta, extensoes) {
  const encontrados = [];
  for (const entrada of readdirSync(pasta, { withFileTypes: true })) {
    if (entrada.isSymbolicLink()) continue;
    const caminho = path.join(pasta, entrada.name);
    if (entrada.isDirectory()) {
      if (!PASTAS_IGNORADAS.has(entrada.name)) encontrados.push(...listarArquivos(caminho, extensoes));
    } else if (entrada.isFile() && extensoes.includes(path.extname(entrada.name))) {
      encontrados.push(caminho);
    }
  }
  return encontrados;
}

/** Imports na ordem em que aparecem no arquivo. */
function extrairImports(texto) {
  const achados = [];
  for (const padrao of PADROES_DE_IMPORT) {
    for (const casamento of texto.matchAll(padrao)) {
      achados.push({ posicao: casamento.index, especificador: casamento[1] });
    }
  }
  return achados.sort((a, b) => a.posicao - b.posicao).map((achado) => achado.especificador);
}

/** Tira BOM, espaços e comentários do começo e confere se sobra a diretiva "use client". */
function temDiretivaCliente(texto) {
  let resto = texto.replace(/^﻿/, "");
  for (;;) {
    resto = resto.trimStart();
    if (resto.startsWith("//")) {
      const fim = resto.indexOf("\n");
      resto = fim === -1 ? "" : resto.slice(fim + 1);
    } else if (resto.startsWith("/*")) {
      const fim = resto.indexOf("*/");
      resto = fim === -1 ? "" : resto.slice(fim + 2);
    } else {
      return DIRETIVA_CLIENTE.test(resto);
    }
  }
}

function ehModuloDoNode(especificador) {
  if (especificador.startsWith("node:")) return true;
  const primeiraParte = especificador.split("/")[0];
  return builtinModules.includes(especificador) || builtinModules.includes(primeiraParte);
}

function ehZustand(especificador) {
  return especificador === "zustand" || especificador.startsWith("zustand/");
}

/** Caminho absoluto do destino, ou undefined quando é pacote externo. */
function resolverNoSite(arquivo, especificador) {
  if (especificador.startsWith("@/")) return path.join(SITE, especificador.slice(2));
  if (especificador.startsWith("./") || especificador.startsWith("../")) {
    return path.resolve(path.dirname(arquivo), especificador);
  }
  return undefined;
}

/** "app", "ui", "funcionalidades/<nome>"... ou undefined quando o caminho está fora das camadas. */
function camadaDe(caminho) {
  const relativo = path.relative(SITE, caminho);
  if (relativo.startsWith("..") || path.isAbsolute(relativo)) return undefined;
  const partes = relativo.split(path.sep);
  const primeira = partes[0];
  if (partes.length < 2 || primeira === undefined) return undefined;
  if (primeira === "funcionalidades") return partes.length < 3 ? undefined : `funcionalidades/${partes[1]}`;
  return CAMADAS_SIMPLES.has(primeira) ? primeira : undefined;
}

function grupoDe(camada) {
  return camada.startsWith("funcionalidades/") ? "funcionalidades/*" : camada;
}

function podeImportar(origem, destino) {
  const permitidos = PERMITIDOS[grupoDe(origem)];
  if (grupoDe(destino) === "funcionalidades/*") {
    if (origem === destino) return true;
    return permitidos.includes("funcionalidades/*");
  }
  return permitidos.includes(destino);
}

function conferirTextoProibido(arquivo, texto) {
  if (REQUIRE.test(texto)) anotar(arquivo, undefined, "require( encontrado: o projeto é ESM, use import");
  if (IMPORT_NAO_LITERAL.test(texto)) {
    anotar(arquivo, undefined, "import que o verificador não consegue conferir (import( sem texto fixo entre aspas)");
  }
}

function conferirArquivoDoSite(arquivo) {
  const texto = readFileSync(arquivo, "utf8");
  const imports = extrairImports(texto);
  const origem = camadaDe(arquivo);
  const ehCliente = temDiretivaCliente(texto);
  const ehServidor = ARQUIVO_SERVIDOR.test(arquivo);

  conferirTextoProibido(arquivo, texto);
  if (origem === undefined) {
    anotar(arquivo, undefined, "arquivo fora das camadas (ADR-001): mova para app, funcionalidades/<nome>, ui, aplicacao, infraestrutura ou config");
  }
  if (ehServidor && imports[0] !== "server-only") {
    anotar(arquivo, undefined, 'todo *.servidor.ts começa com import "server-only"; como primeiro import (ADR-001)');
  }

  for (const especificador of imports) {
    if (ehCliente && DESTINO_SERVIDOR.test(especificador)) {
      anotar(arquivo, especificador, 'arquivo com "use client" não pode importar código só de servidor (ADR-001)');
    }

    const destino = resolverNoSite(arquivo, especificador);
    if (destino === undefined) {
      if (ehZustand(especificador) && origem !== "infraestrutura") {
        anotar(arquivo, especificador, "zustand só pode ser usado em infraestrutura (ADR-001)");
      }
      if (ehModuloDoNode(especificador) && !(origem === "infraestrutura" && ehServidor)) {
        anotar(arquivo, especificador, "módulo do Node só pode ser usado em infraestrutura/**/*.servidor.ts (ADR-001)");
      }
      if (especificador === "server-only" && !ehServidor) {
        anotar(arquivo, especificador, 'import "server-only" só cabe em arquivos *.servidor.ts (ADR-001)');
      }
      continue;
    }

    const camadaDestino = camadaDe(destino);
    if (camadaDestino === undefined) {
      anotar(arquivo, especificador, "destino fora das camadas (ADR-001)");
      continue;
    }
    if (origem !== undefined && !podeImportar(origem, camadaDestino)) {
      const regra = REGRA_DO_ADR[grupoDe(origem)];
      const onde = regra === undefined ? "ADR-001" : `ADR-001, regra ${regra}`;
      anotar(arquivo, especificador, `${origem} não pode importar ${camadaDestino} (${onde})`);
    }
  }
}

/** ADR-001, regra 6: o domínio não importa nada do site, nem React, rede ou armazenamento. */
function conferirArquivoDoDominio(arquivo) {
  const texto = readFileSync(arquivo, "utf8");
  conferirTextoProibido(arquivo, texto);
  for (const especificador of extrairImports(texto)) {
    if (!especificador.startsWith("./")) {
      anotar(arquivo, especificador, "o domínio (@ee/core) só importa arquivos dele mesmo com ./ (ADR-001, regra 6)");
    }
  }
}

for (const antiga of ["components", "lib"]) {
  const pasta = path.join(SITE, antiga);
  if (existsSync(pasta)) anotar(pasta, undefined, "pasta antiga ainda existe (HIS-001): mova o conteúdo para as camadas");
}

const arquivosDoSite = listarArquivos(SITE, EXTENSOES_SITE);
const arquivosDoDominio = listarArquivos(DOMINIO, EXTENSOES_DOMINIO);
for (const [pasta, arquivos] of [[SITE, arquivosDoSite], [DOMINIO, arquivosDoDominio]]) {
  if (arquivos.length === 0) anotar(pasta, undefined, `nenhum arquivo lido em ${relativoARaiz(pasta)}`);
}

arquivosDoSite.forEach(conferirArquivoDoSite);
arquivosDoDominio.forEach(conferirArquivoDoDominio);

const total = arquivosDoSite.length + arquivosDoDominio.length;
if (problemas.length > 0) {
  for (const problema of problemas) console.error(problema);
  console.error(`${problemas.length} problema(s)`);
  process.exitCode = 1;
} else {
  console.log(`Camadas: tudo certo (${total} arquivos)`);
}
