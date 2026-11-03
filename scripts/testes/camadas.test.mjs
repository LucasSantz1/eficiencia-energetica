// Roda os casos de casos-de-camadas.mjs no ESLint (configuração real) e no scripts/verificar-camadas.mjs
// (numa árvore mínima num mkdtemp). HIS-002b, critério 7, D6 e D16. Entra no `pnpm test` (test:camadas).
//
// Segurança do próprio teste (Ab9): comandos só com execFileSync, sem shell; a pasta temporária é criada com
// mkdtemp em os.tmpdir() e só ela é apagada, depois de conferir o prefixo; links simbólicos apontam para dentro dela.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, describe, test } from "node:test";
import { ESLint } from "eslint";
import { CASOS, CONTROLES, OBRIGATORIOS } from "./casos-de-camadas.mjs";

const RAIZ = path.resolve(import.meta.dirname, "..", "..");
const SCRIPT = path.join(RAIZ, "scripts", "verificar-camadas.mjs");
const BIN_ESLINT = path.join(RAIZ, "node_modules", "eslint", "bin", "eslint.js");
const PREFIXO_TEMPORARIO = path.join(os.tmpdir(), "camadas-");
const EXTENSOES = new Set([".js", ".jsx", ".cjs", ".mjs", ".ts", ".tsx", ".cts", ".mts"]);
const PASTAS_LIDAS = ["apps/web/src", "packages/core/src"];

/** O mínimo para o script achar arquivos nas duas pastas e não acusar nada. */
const ARVORE_MINIMA = {
  "apps/web/src/app/page.tsx": "export default function Pagina() {\n  return null;\n}\n",
  "apps/web/src/funcionalidades/exemplo/Tela.tsx": "export function Tela() {\n  return null;\n}\n",
  "packages/core/src/index.ts": "export const versao = 1;\n",
};

const eslint = new ESLint({ cwd: RAIZ });
const temporarias = [];

function criarPastaTemporaria() {
  const pasta = mkdtempSync(PREFIXO_TEMPORARIO);
  temporarias.push(pasta);
  return pasta;
}

after(() => {
  for (const pasta of temporarias) {
    // Nunca apaga fora do que o próprio teste criou.
    assert.ok(pasta.startsWith(PREFIXO_TEMPORARIO) && !pasta.includes(".."), `pasta temporária inesperada: ${pasta}`);
    rmSync(pasta, { recursive: true, force: true });
  }
});

function escrever(raiz, relativo, conteudo) {
  const destino = path.join(raiz, relativo);
  mkdirSync(path.dirname(destino), { recursive: true });
  writeFileSync(destino, conteudo);
}

/** Roda um comando sem shell e devolve código e saídas, sem lançar erro quando o código não é 0. */
function rodar(arquivo, argumentos, opcoes = {}) {
  try {
    const saida = execFileSync(arquivo, argumentos, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], shell: false, ...opcoes });
    return { codigo: 0, saida, erro: "" };
  } catch (falha) {
    if (typeof falha.status !== "number") throw falha;
    return { codigo: falha.status, saida: String(falha.stdout), erro: String(falha.stderr) };
  }
}

function rodarScript(raiz, opcoes) {
  const argumentos = raiz === undefined ? [SCRIPT] : [SCRIPT, `--raiz=${raiz}`];
  return rodar(process.execPath, argumentos, opcoes);
}

function montarArvore(caso) {
  const raiz = criarPastaTemporaria();
  if (caso.arvoreMinima !== false) {
    for (const [relativo, conteudo] of Object.entries(ARVORE_MINIMA)) escrever(raiz, relativo, conteudo);
  }
  for (const pasta of caso.pastas ?? []) mkdirSync(path.join(raiz, pasta), { recursive: true });
  for (const [relativo, conteudo] of Object.entries(caso.arquivos)) escrever(raiz, relativo, conteudo);
  for (const [destino, link] of caso.links) {
    const alvo = path.join(raiz, destino);
    assert.ok(alvo.startsWith(raiz + path.sep), `link do caso ${caso.id} aponta para fora da pasta temporária`);
    mkdirSync(path.dirname(path.join(raiz, link)), { recursive: true });
    symlinkSync(alvo, path.join(raiz, link));
  }
  return raiz;
}

/** Nome da "regra" de uma mensagem sem ruleId: erro de parse ou diretiva sem uso. */
function regraDe(mensagem) {
  if (mensagem.ruleId !== null) return mensagem.ruleId;
  return mensagem.fatal ? "(parse)" : "(diretiva)";
}

async function mensagensDoEslint(caso) {
  const mensagens = [];
  for (const [relativo, conteudo] of Object.entries(caso.arquivos)) {
    const [resultado] = await eslint.lintText(conteudo, { filePath: path.join(RAIZ, relativo) });
    for (const mensagem of resultado?.messages ?? []) mensagens.push({ ...mensagem, regra: regraDe(mensagem) });
  }
  return mensagens;
}

function listarComGit() {
  const saida = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "--", ...PASTAS_LIDAS], {
    cwd: RAIZ,
    encoding: "utf8",
    shell: false,
  });
  return saida.split("\n").filter((linha) => EXTENSOES.has(path.extname(linha)));
}

/** Da linha "Camadas: tudo certo (N arquivos; M comentário(s) da HIS-109)". */
function lerResumoDoScript(saida) {
  const casamento = /tudo certo \((\d+) arquivos; (\d+) comentário\(s\) da HIS-109\)/.exec(saida);
  assert.ok(casamento, `saída inesperada do script: ${saida}`);
  return { arquivos: Number(casamento[1]), his109: Number(casamento[2]) };
}

// Critério 11: os efeitos da HIS-109 só podem diminuir (a HIS-109 leva a 0).
// 7, e não 8, enquanto o bloco provisório do eslint.config.mjs esconder o efeito do casa.ts (D17 do tech-lead):
// com 8, um efeito novo passaria sem ninguém ver. Quem tirar o bloco (HIS-003a) volta para 8.
const TETO_HIS_109 = 7;

const casosDoEslint = CASOS.filter((caso) => caso.verificador === "eslint");
const casosDoScript = CASOS.filter((caso) => caso.verificador === "script");
console.log(`${CASOS.length} casos: ${casosDoEslint.length} no ESLint, ${casosDoScript.length} no script (+ ${CONTROLES.length} controles)`);

describe("lista de casos", () => {
  test("ids sem repetição", () => {
    const vistos = new Set();
    for (const id of [...CASOS.map((caso) => caso.id), ...CONTROLES]) {
      assert.ok(!vistos.has(id), `id repetido: ${id}`);
      vistos.add(id);
    }
  });

  test("todo id obrigatório existe e todo caso está na lista de obrigatórios", () => {
    const existentes = new Set([...CASOS.map((caso) => caso.id), ...CONTROLES]);
    for (const id of OBRIGATORIOS) assert.ok(existentes.has(id), `faltando caso obrigatório: ${id}`);
    const obrigatorios = new Set(OBRIGATORIOS);
    for (const id of existentes) assert.ok(obrigatorios.has(id), `caso fora da lista OBRIGATORIOS: ${id}`);
  });

  test("todo controle tem teste", () => {
    assert.deepEqual([...CONTROLES].sort(), Object.keys(TESTES_DE_CONTROLE).sort());
  });
});

describe("ESLint", () => {
  for (const caso of casosDoEslint) {
    test(caso.id, async () => {
      const mensagens = await mensagensDoEslint(caso);
      const resumo = mensagens.map((m) => `${m.regra} (${m.severity}): ${m.message}`).join("\n");
      if (caso.espera === null) {
        assert.equal(mensagens.length, 0, `controle ${caso.id} acusou:\n${resumo}`);
        return;
      }
      const { regra, mensagem } = caso.espera;
      const achou = mensagens.some((m) => m.regra === regra && m.severity === 2 && m.message.includes(mensagem));
      assert.ok(achou, `${caso.id}: esperava erro de ${regra} com "${mensagem}"; veio:\n${resumo || "(nada)"}`);
    });
  }
});

describe("script de camadas", () => {
  for (const caso of casosDoScript) {
    test(caso.id, () => {
      const { codigo, saida, erro } = rodarScript(montarArvore(caso));
      if (caso.espera === null) {
        assert.equal(codigo, 0, `controle ${caso.id} acusou:\n${erro}`);
        return;
      }
      assert.equal(codigo, 1, `${caso.id}: esperava código 1; saída:\n${saida}${erro}`);
      assert.ok(erro.includes(caso.espera.mensagem), `${caso.id}: esperava "${caso.espera.mensagem}"; veio:\n${erro}`);
    });
  }
});

const TESTES_DE_CONTROLE = {
  "controle-repositorio": async () => {
    const doGit = listarComGit().length;
    const { codigo, saida, erro } = rodarScript(undefined, { cwd: RAIZ });
    assert.equal(codigo, 0, erro);
    const resumo = lerResumoDoScript(saida);
    assert.equal(resumo.arquivos, doGit, "o script leu um número de arquivos diferente do git ls-files");
    assert.ok(resumo.his109 <= TETO_HIS_109, `${resumo.his109} comentários da HIS-109; o teto é ${TETO_HIS_109}`);
    // Ab4: nenhuma pasta do site pode ficar fora do lint por um ignore solto.
    const resultados = await eslint.lintFiles(PASTAS_LIDAS);
    assert.equal(resultados.length, doGit, "o ESLint leu um número de arquivos diferente do git ls-files");
  },
  "controle-arvore-minima": () => {
    const { codigo, erro } = rodarScript(montarArvore({ id: "controle-arvore-minima", arquivos: {}, links: [] }));
    assert.equal(codigo, 0, erro);
  },
  "controle-outra-pasta": () => {
    const daRaiz = rodarScript(undefined, { cwd: RAIZ });
    const deFora = rodarScript(undefined, { cwd: os.tmpdir() });
    assert.equal(deFora.codigo, 0, deFora.erro);
    assert.equal(deFora.saida, daRaiz.saida);
  },
  // P-qa-b2: as regras do jsx-a11y e do @next/next são aviso; só o --max-warnings 0 do `pnpm lint` as faz barrar.
  "controle-linha-de-comando": () => {
    const { lint } = JSON.parse(readFileSync(path.join(RAIZ, "package.json"), "utf8")).scripts;
    const partes = lint.split(" ").filter(Boolean);
    assert.equal(partes.shift(), "eslint");
    const argumentos = [];
    for (let i = 0; i < partes.length; i += 1) {
      const parte = partes[i];
      if (parte === "--cache-location") i += 1;
      else if (parte !== "." && parte !== "--cache") argumentos.push(parte);
    }
    argumentos.push("--stdin", "--stdin-filename", "apps/web/src/ui/Exemplo.tsx");
    const comImagem = rodar(process.execPath, [BIN_ESLINT, ...argumentos], { cwd: RAIZ, input: 'export function F() {\n  return <img src="x" />;\n}\n' });
    assert.equal(comImagem.codigo, 1, `<img> sem alt deveria reprovar com --max-warnings 0:\n${comImagem.saida}`);
    const semImagem = rodar(process.execPath, [BIN_ESLINT, ...argumentos], { cwd: RAIZ, input: "export function F() {\n  return <p>x</p>;\n}\n" });
    assert.equal(semImagem.codigo, 0, semImagem.saida);
  },
};

describe("controles", () => {
  for (const [id, executar] of Object.entries(TESTES_DE_CONTROLE)) test(id, executar);
});
