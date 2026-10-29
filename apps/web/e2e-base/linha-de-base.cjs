#!/usr/bin/env node
/*
 * Linha de base da HIS-001 (reorganização em camadas): fotografa o site de produção ANTES da mudança e,
 * depois, compara com o site novo. A HIS-002 troca esta pasta por testes Playwright de verdade (apps/web/e2e/).
 *
 * Uso (com o site rodando: pnpm build && pnpm --filter @ee/web start -p 3100):
 *   node apps/web/e2e-base/linha-de-base.cjs capturar <pasta-de-evidencias> [--url=http://localhost:3100] [--gerar-fixtures]
 *   node apps/web/e2e-base/linha-de-base.cjs comparar <pasta-antes> <pasta-depois>
 *
 * "capturar" percorre o fluxo inteiro em 390×844 e 1280×900, guarda capturas, textos visíveis, a casa salva,
 * o DOM com movimento reduzido, bytes de JavaScript e contagem de transições. Sai com código 1 se houver erro
 * no console, erro de página ou falha de verificação.
 * "comparar" mostra tudo o que mudou entre duas capturas e sai com código 1 se algo não bate.
 *
 * Por que o relógio e os ids são fixos: as contas usam o mês atual e os ids vêm de crypto.randomUUID().
 * Fixando os dois, o texto, o DOM e a casa salva saem idênticos em execuções diferentes.
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execSync } = require("node:child_process");
const { chromium } = require("playwright");

const CHAVE_CASA = "eficiencia-energetica:casa";
const AGORA = new Date("2026-10-29T15:00:00Z"); // meio-dia em Brasília
const VIEWPORTS = { 390: { width: 390, height: 844 }, 1280: { width: 1280, height: 900 } };
const PASTA_SCRIPT = __dirname;
const PASTA_FIXTURES = path.join(PASTA_SCRIPT, "fixtures");
const PASTA_WEB = path.resolve(PASTA_SCRIPT, "..");
const ROTAS = ["/", "/comecar", "/casa", "/casa/comodos", "/casa/dicas", "/casa/ajustes", "/casa/aparelhos", "/sobre"];
const LIMITE_CRESCIMENTO_JS = 1024; // bytes (desenho técnico, seção 10, item 6)

// Roda antes de qualquer script da página, em toda navegação.
const SCRIPT_INICIAL = ({ chave, semente }) => {
  const ler = (k) => {
    try {
      return sessionStorage.getItem(k);
    } catch {
      return null;
    }
  };
  const gravar = (k, v) => {
    try {
      sessionStorage.setItem(k, v);
    } catch {}
  };
  // Ids previsíveis no lugar de crypto.randomUUID (o contador sobrevive a recarregar a aba).
  try {
    Object.defineProperty(crypto, "randomUUID", {
      configurable: true,
      value: () => {
        const n = Number(ler("qa:seq") || 0) + 1;
        gravar("qa:seq", String(n));
        return `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
      },
    });
  } catch {}
  // Conta as transições de tela (View Transitions) disparadas pelo React.
  const original = Document.prototype.startViewTransition;
  if (original) {
    Document.prototype.startViewTransition = function (...args) {
      gravar("qa:transicoes", String(Number(ler("qa:transicoes") || 0) + 1));
      return original.apply(this, args);
    };
  }
  // Casa já salva antes de abrir o site (só na primeira página da aba).
  if (semente && !ler("qa:semeado")) {
    try {
      localStorage.setItem(chave, semente);
    } catch {}
    gravar("qa:semeado", "1");
  }
};

// ---------------------------------------------------------------- utilidades

function argumentos() {
  const [modo, ...resto] = process.argv.slice(2);
  const opcoes = {};
  const posicionais = [];
  for (const a of resto) {
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=");
      opcoes[k] = v ?? true;
    } else posicionais.push(a);
  }
  return { modo, posicionais, opcoes };
}

const garantirPasta = (p) => fs.mkdirSync(p, { recursive: true });
const escrever = (arquivo, conteudo) => {
  garantirPasta(path.dirname(arquivo));
  fs.writeFileSync(arquivo, conteudo);
};
const hash = (arquivo) => (fs.existsSync(arquivo) ? crypto.createHash("sha256").update(fs.readFileSync(arquivo)).digest("hex") : null);
const json = (v) => `${JSON.stringify(v, null, 2)}\n`;

/** JSON com as chaves em ordem: dois objetos iguais dão o mesmo texto, não importa a ordem das chaves. */
function canonico(v) {
  if (Array.isArray(v)) return v.map(canonico);
  if (v && typeof v === "object") return Object.fromEntries(Object.keys(v).sort().map((k) => [k, canonico(v[k])]));
  return v;
}
const iguais = (a, b) => JSON.stringify(canonico(a)) === JSON.stringify(canonico(b));

function tentar(cmd) {
  try {
    return execSync(cmd, { cwd: PASTA_WEB, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- captura

class Sessao {
  constructor({ navegador, base, saida, vp, problemas, opcoesContexto = {}, semente, rotulo }) {
    Object.assign(this, { navegador, base, saida, vp, problemas, opcoesContexto, semente });
    this.rotulo = rotulo ?? String(vp);
    this.passo = 0;
    this.erros = [];
    this.avisos = [];
    this.transicoes = [];
  }

  async abrir() {
    this.contexto = await this.navegador.newContext({ viewport: VIEWPORTS[this.vp], locale: "pt-BR", timezoneId: "America/Sao_Paulo", ...this.opcoesContexto });
    await this.contexto.clock.setFixedTime(AGORA);
    await this.contexto.addInitScript(SCRIPT_INICIAL, { chave: CHAVE_CASA, semente: this.semente ? JSON.stringify(this.semente) : null });
    this.pagina = await this.contexto.newPage();
    this.pagina.on("pageerror", (e) => this.erros.push(`pageerror: ${e.message}`));
    this.pagina.on("console", (m) => {
      if (m.type() === "error") this.erros.push(`console.error: ${m.text()}`);
      else if (m.type() === "warning") this.avisos.push(`console.warn: ${m.text()}`);
    });
    return this;
  }

  async fechar() {
    await this.contexto.close();
    if (this.erros.length) this.problemas.push(...this.erros.map((e) => `[${this.rotulo}] ${e}`));
  }

  url(caminho) {
    return new URL(caminho, this.base).toString();
  }

  async ir(caminho) {
    await this.pagina.goto(this.url(caminho), { waitUntil: "networkidle" });
  }

  /** Espera dados, números animados e animações CSS terminarem, e revela os blocos que aparecem ao rolar. */
  async estabilizar() {
    const p = this.pagina;
    await p.waitForLoadState("networkidle").catch(() => {});
    await p.evaluate(async () => {
      const espera = (ms) => new Promise((r) => setTimeout(r, ms));
      for (let y = 0; y < document.documentElement.scrollHeight; y += Math.floor(innerHeight * 0.8)) {
        scrollTo(0, y);
        await espera(60);
      }
      scrollTo(0, document.documentElement.scrollHeight);
      await espera(60);
      scrollTo(0, 0);
    });
    await p.waitForTimeout(1600); // ValorAnimado (até 1,1 s) e Contagem (1,4 s) usam requestAnimationFrame
    await p
      .waitForFunction(() => document.getAnimations().every((a) => a.playState !== "running" || a.effect?.getComputedTiming().iterations === Infinity), null, { timeout: 5000 })
      .catch(() => {});
    await p.mouse.move(0, 0);
  }

  async transicoesAteAgora() {
    return Number(await this.pagina.evaluate(() => sessionStorage.getItem("qa:transicoes") || 0));
  }

  /** Captura de tela + texto visível do <main> com nome estável (NN-nome). */
  async registrar(nome, { estabilizar = true } = {}) {
    if (estabilizar) await this.estabilizar();
    this.passo += 1;
    const id = `${String(this.passo).padStart(2, "0")}-${nome}`;
    await this.pagina.screenshot({ path: path.join(this.saida, "capturas", this.rotulo, `${id}.png`), fullPage: true, animations: "disabled" });
    const texto = await this.pagina.evaluate(() => (document.querySelector("main") ?? document.body).innerText);
    escrever(path.join(this.saida, "textos", this.rotulo, `${id}.txt`), `${texto.trim()}\n`);
    this.transicoes.push({ passo: id, caminho: new URL(this.pagina.url()).pathname + new URL(this.pagina.url()).search, transicoesAcumuladas: await this.transicoesAteAgora() });
    return id;
  }

  /** Item da navegação das abas que está visível (embaixo no celular, no topo no computador). */
  aba(nome) {
    return this.pagina.locator('nav[aria-label="Seções"] a').filter({ visible: true }).filter({ hasText: nome });
  }

  async casaSalva() {
    const bruto = await this.pagina.evaluate((k) => localStorage.getItem(k), CHAVE_CASA);
    return bruto ? JSON.parse(bruto) : null;
  }

  verificar(condicao, mensagem) {
    if (!condicao) this.problemas.push(`[${this.rotulo}] ${mensagem}`);
  }
}

async function esperarDialogo(p, aberto) {
  await p.waitForFunction((a) => Boolean(document.querySelector("dialog[open]")) === a, aberto, { timeout: 5000 });
}

/** Cadastro completo → acompanhamento → cômodos → dicas → minha casa → sobre → página inicial. */
async function fluxoCompleto(s) {
  const p = s.pagina;
  await s.ir("/");
  await s.registrar("inicio");
  await p.getByRole("link", { name: "Começar", exact: true }).first().click();
  await p.waitForURL("**/comecar");

  // Estado
  await p.locator("select#estado").waitFor();
  await s.registrar("cadastro-estado");
  await p.locator("select#estado").selectOption("SP");
  await p.getByRole("button", { name: "Continuar", exact: true }).click();

  // Cidade
  await p.locator("#busca-cidade").waitFor();
  await p.locator("#busca-cidade").fill("Presidente Prudente");
  await s.registrar("cadastro-cidade");
  await p.getByRole("radio", { name: "Presidente Prudente", exact: true }).click();

  // Distribuidora (só aparece quando a cidade tem mais de uma)
  const titulo = p.locator("main h1");
  await p.waitForFunction(() => !document.querySelector("#busca-cidade"));
  if ((await titulo.innerText()).includes("Qual empresa")) {
    await s.registrar("cadastro-distribuidora");
    await p.locator('main [role="radio"]').first().click();
  }

  // Benefício
  await p.getByText("Sua família está no CadÚnico?").waitFor();
  await s.registrar("cadastro-beneficio");
  await p.getByRole("radio", { name: /Sim, tenho Tarifa Social/ }).click();

  // Pessoas
  await p.getByText("Quantas pessoas moram na casa?").waitFor();
  await p.getByRole("button", { name: "Aumentar pessoas na casa" }).click();
  await s.registrar("cadastro-pessoas");
  await p.getByRole("button", { name: "Continuar", exact: true }).click();

  // Cômodos
  await p.getByText("Quais cômodos a sua casa tem?").waitFor();
  await s.registrar("cadastro-comodos");
  await p.getByRole("button", { name: /^Continuar com \d+ cômodos$/ }).click();

  // Cada cômodo
  for (let i = 0; i < 20; i++) {
    const marcador = p.getByText(/^Cômodo \d+ de \d+$/);
    if (!(await marcador.isVisible().catch(() => false))) {
      await p.waitForTimeout(300);
      if (!(await marcador.isVisible().catch(() => false))) break;
    }
    const [, atual, total] = (await marcador.innerText()).match(/(\d+) de (\d+)/);
    if (i === 0) await p.locator('main button[aria-label^="Aumentar quantidade de"]').first().click();
    await s.registrar(`cadastro-comodo-${atual}`);
    const proximo = Number(atual) < Number(total) ? p.getByRole("button", { name: /^Próximo: / }) : p.getByRole("button", { name: "Ver o resumo dos cômodos" });
    await proximo.click();
    await p.waitForFunction((n) => !document.body.innerText.includes(`Cômodo ${n} de `), atual);
  }

  // Revisão
  await p.getByText("O que tem na sua casa").waitFor();
  await s.registrar("cadastro-revisao-por-comodo");
  await p.getByRole("radio", { name: "Tudo junto" }).click();
  await s.registrar("cadastro-revisao-tudo-junto");
  await p.getByRole("button", { name: "Continuar", exact: true }).click();

  // Conta
  await p.getByText("Tem uma conta de luz em mãos?").waitFor();
  await s.registrar("cadastro-conta");
  await p.getByRole("button", { name: "Pular, não tenho a conta agora" }).click();
  await p.waitForURL("**/casa");

  // Acompanhamento
  await p.getByText("Sua conta estimada por mês").waitFor();
  await s.registrar("acompanhamento");
  // Editor pelo "Quem mais gasta": abre, salva sem mudar e fecha.
  await p.getByRole("button", { name: /Toque para ajustar\.$/ }).first().click();
  await esperarDialogo(p, true);
  await s.registrar("acompanhamento-editor-aparelho");
  await p.locator("dialog[open]").getByRole("button", { name: "Salvar mudanças" }).click();
  await esperarDialogo(p, false);
  // Duas contas de luz
  for (const [botao, mes, kwh, valor] of [
    ["Anotar conta", "2026-09", "182", "151,37"],
    ["Anotar outra conta", "2026-10", "168", "140,25"],
  ]) {
    await p.getByRole("button", { name: botao }).click();
    await esperarDialogo(p, true);
    await p.locator("#conta-mes").fill(mes);
    await p.locator("#conta-kwh-m").fill(kwh);
    await p.locator("#conta-valor-m").fill(valor);
    if (mes === "2026-09") await s.registrar("acompanhamento-anotar-conta");
    await p.locator("dialog[open]").getByRole("button", { name: "Salvar conta" }).click();
    await esperarDialogo(p, false);
  }
  await s.registrar("acompanhamento-contas");
  // Duas leituras do relógio
  await p.getByRole("radio", { name: "Relógio de luz" }).click();
  for (const [data, valor] of [
    ["2026-10-20", "12000"],
    ["2026-10-29", "12052"],
  ]) {
    await p.getByRole("button", { name: "Anotar leitura" }).click();
    await esperarDialogo(p, true);
    await p.locator("#leitura-data").fill(data);
    await p.locator("#leitura-valor").fill(valor);
    await p.locator("dialog[open]").getByRole("button", { name: "Salvar leitura" }).click();
    await esperarDialogo(p, false);
  }
  await s.registrar("acompanhamento-relogio");

  // Cômodos
  await s.aba("Cômodos").click();
  await p.waitForURL("**/casa/comodos");
  await p.getByText("Cômodos e aparelhos").first().waitFor();
  await s.registrar("comodos");
  await p.locator('section[id^="comodo-"]').nth(1).locator("button[aria-expanded]").first().click();
  await s.registrar("comodos-segundo-aberto");
  // Editor pelos cômodos: abre o primeiro aparelho do primeiro cômodo e remove.
  await p.locator('section[id^="comodo-"]').first().locator(".sanfona ul > li button").first().click();
  await esperarDialogo(p, true);
  await s.registrar("comodos-editor-aparelho");
  await p.locator("dialog[open]").getByRole("button", { name: "Remover este aparelho" }).click();
  await p.locator("dialog[open]").getByRole("button", { name: "Sim, remover" }).click();
  await esperarDialogo(p, false);
  await s.registrar("comodos-apos-remover");
  await p.getByRole("radio", { name: "Painel geral" }).click();
  await s.registrar("comodos-painel-geral");

  // Dicas
  await s.aba("Dicas").click();
  await p.waitForURL("**/casa/dicas");
  await p.getByText("Dicas e plano de economia").waitFor();
  await s.registrar("dicas");
  await p.locator('main button[role="checkbox"]').first().click();
  await s.registrar("dicas-com-plano");

  // Volta ao acompanhamento (transição para trás) e vai para Minha casa
  await s.aba(s.vp === 390 ? "Acompanhar" : "Acompanhamento").click();
  await p.waitForURL("**/casa");
  await s.registrar("acompanhamento-com-plano");
  await s.aba("Minha casa").click();
  await p.waitForURL("**/casa/ajustes");
  await s.registrar("minha-casa");

  // Sobre e página inicial
  await p.getByRole("link", { name: "De onde vêm as tarifas e como o cálculo é feito" }).click();
  await p.waitForURL("**/sobre");
  await s.registrar("sobre");
  await p.locator('header a[href="/"]').first().click();
  await p.waitForURL((u) => new URL(u).pathname === "/");
  await s.registrar("inicio-com-casa");

  const casa = await s.casaSalva();

  // Entradas diretas por endereço, já com a casa salva
  await s.ir("/casa/comodos?visao=geral");
  await s.registrar("direto-comodos-visao-geral");
  await s.ir("/comecar");
  await s.registrar("direto-comecar-ja-cadastrou");
  await s.ir("/casa/aparelhos");
  await p.waitForURL("**/casa/comodos", { timeout: 5000 }).catch(() => {});
  s.verificar(new URL(p.url()).pathname === "/casa/comodos", `/casa/aparelhos deveria levar a /casa/comodos, foi para ${p.url()}`);
  await s.registrar("direto-aparelhos-redireciona");

  // Cabeçalho e navegação parados durante a troca de aba (nomes de view transition intactos)
  const nomes = await p.evaluate(() => ({
    topo: getComputedStyle(document.querySelector("header")).viewTransitionName,
    navegacao: [...document.querySelectorAll('nav[aria-label="Seções"]')].map((n) => getComputedStyle(n).viewTransitionName),
  }));
  return { casa, nomesDeTransicao: nomes };
}

/** Abre /casa com uma casa salva por uma versão anterior e confere o que ficou guardado. */
async function migracao(navegador, base, saida, problemas, versao) {
  const fixture = JSON.parse(fs.readFileSync(path.join(PASTA_FIXTURES, `casa-v${versao}.json`), "utf8"));
  const s = await new Sessao({ navegador, base, saida, vp: 390, problemas, semente: fixture, rotulo: `migracao-v${versao}` }).abrir();
  await s.ir("/casa");
  await s.pagina.getByText("Sua conta estimada por mês").waitFor();
  await s.registrar("casa");
  await s.pagina.reload({ waitUntil: "networkidle" });
  await s.pagina.getByText("Sua conta estimada por mês").waitFor();
  await s.registrar("casa-recarregada");
  const salvo = await s.casaSalva();
  escrever(path.join(saida, `migracao-v${versao}-guardado.json`), json(salvo));
  const esperado = versao === 2 ? fixture : { state: { ...fixture.state, contas: [], leituras: [], plano: [] }, version: 2 };
  // Na v1 o zustand só regrava depois de alguma mudança; o que importa é o estado em memória não perder nada.
  const emMemoria = salvo?.version === 2 ? salvo : { state: { ...salvo.state, contas: salvo.state.contas ?? [], leituras: salvo.state.leituras ?? [], plano: salvo.state.plano ?? [] }, version: 2 };
  s.verificar(iguais(emMemoria.state, esperado.state), `casa salva na versão ${versao}: o que ficou guardado não bate com o esperado`);
  if (versao === 2) {
    const texto = await s.pagina.locator("main").innerText();
    for (const c of fixture.state.comodos) s.verificar(texto.includes(c.nome), `versão 2: cômodo "${c.nome}" não aparece no acompanhamento`);
  }
  await s.fechar();
  return { versaoGuardada: salvo?.version ?? null, igualAoEsperado: iguais(emMemoria.state, esperado.state), erros: s.erros.length, transicoes: s.transicoes };
}

/** Movimento reduzido: "foto" do DOM de cada rota, com a mesma casa salva, e a troca de abas. */
async function movimentoReduzido(navegador, base, saida, problemas) {
  const fixture = JSON.parse(fs.readFileSync(path.join(PASTA_FIXTURES, "casa-v2.json"), "utf8"));
  const s = await new Sessao({ navegador, base, saida, vp: 390, problemas, semente: fixture, rotulo: "reduzido", opcoesContexto: { reducedMotion: "reduce" } }).abrir();
  const p = s.pagina;
  const fotos = {};
  for (const rota of ["/", "/comecar", "/casa", "/casa/comodos", "/casa/comodos?visao=geral", "/casa/dicas", "/casa/ajustes", "/sobre"]) {
    await s.ir(rota);
    const nome = rota === "/" ? "inicio" : rota.slice(1).replace(/[/?=]/g, "-");
    await s.registrar(nome);
    const html = await p.evaluate(() => {
      const copia = document.body.cloneNode(true);
      copia.querySelectorAll("script, template, next-route-announcer").forEach((e) => e.remove());
      return copia.innerHTML
        .replace(/_R_[A-Za-z0-9]*_/g, "«useId»")
        .replace(/«R[^»]*»/g, "«useId»")
        .replace(/\/_next\/static\/[^"' )]+/g, "/_next/static/«arquivo»")
        .replace(/></g, ">\n<");
    });
    escrever(path.join(saida, "dom", `${nome}.html`), `${html}\n`);
    fotos[nome] = html.length;
  }
  // Duração das animações com movimento reduzido (globals.css: 0,01 ms)
  await s.ir("/casa");
  const duracaoSurgir = await p.evaluate(() => getComputedStyle(document.querySelector(".surgir")).animationDuration);
  s.verificar(duracaoSurgir !== "0.52s", `movimento reduzido não foi respeitado (.surgir dura ${duracaoSurgir})`);
  const antes = await s.transicoesAteAgora();
  for (const [aba, url] of [["Cômodos", "**/casa/comodos"], ["Dicas", "**/casa/dicas"], ["Minha casa", "**/casa/ajustes"], ["Acompanhar", "**/casa"]]) {
    await s.aba(aba).click();
    await p.waitForURL(url);
    await p.waitForTimeout(400);
  }
  const transicoesNasAbas = (await s.transicoesAteAgora()) - antes;
  await s.fechar();
  return { duracaoSurgir, transicoesNasAbas, tamanhoDom: fotos };
}

/** Apagar todos os meus dados, a partir da casa salva. */
async function apagarTudo(navegador, base, saida, problemas) {
  const fixture = JSON.parse(fs.readFileSync(path.join(PASTA_FIXTURES, "casa-v2.json"), "utf8"));
  const s = await new Sessao({ navegador, base, saida, vp: 390, problemas, semente: fixture, rotulo: "apagar" }).abrir();
  const p = s.pagina;
  await s.ir("/casa/ajustes");
  await p.getByRole("button", { name: "Apagar todos os meus dados" }).click();
  await s.registrar("confirmar-apagar");
  await p.getByRole("button", { name: "Sim, apagar" }).click();
  await p.waitForURL((u) => new URL(u).pathname === "/");
  await s.registrar("inicio-depois-de-apagar");
  const salvo = await s.casaSalva();
  const vazio = salvo && !salvo.state.residencia && ["comodos", "aparelhos", "contas", "leituras", "plano"].every((k) => salvo.state[k].length === 0);
  s.verificar(vazio, "Apagar todos os meus dados: a casa continuou guardada");
  escrever(path.join(saida, "apagar-guardado.json"), json(salvo));
  await s.fechar();
  return { apagou: Boolean(vazio) };
}

/** Bytes de JavaScript baixados (sem cache) em cada rota, no celular. */
async function bytesDeJs(navegador, base, problemas) {
  const fixture = JSON.parse(fs.readFileSync(path.join(PASTA_FIXTURES, "casa-v2.json"), "utf8"));
  const medidas = {};
  for (const [nome, rota, semente] of [
    ["/", "/", null],
    ["/comecar", "/comecar", null],
    ["/casa (sem casa)", "/casa", null],
    ["/casa (com casa)", "/casa", fixture],
  ]) {
    const s = await new Sessao({ navegador, base, saida: null, vp: 390, problemas, semente, rotulo: `bytes ${nome}` }).abrir();
    await s.pagina.goto(s.url(rota), { waitUntil: "networkidle" });
    await s.pagina.waitForTimeout(1000);
    medidas[nome] = await s.pagina.evaluate(() => {
      const entradas = performance.getEntriesByType("resource");
      const js = new Map();
      for (const e of entradas) if (new URL(e.name).pathname.endsWith(".js")) js.set(e.name, e);
      const deScript = entradas.filter((e) => e.initiatorType === "script");
      const soma = (l, k) => l.reduce((t, e) => t + e[k], 0);
      return {
        arquivosJs: js.size,
        bytesJsComprimidos: soma([...js.values()], "encodedBodySize"),
        bytesJsDescomprimidos: soma([...js.values()], "decodedBodySize"),
        initiatorScript: { arquivos: deScript.length, bytes: soma(deScript, "encodedBodySize") },
      };
    });
    await s.fechar();
  }
  return medidas;
}

/** Status HTTP de cada rota e o redirecionamento de /casa/aparelhos embutido na página estática. */
async function rotasHttp(base) {
  const saida = {};
  for (const rota of ROTAS) {
    const r = await fetch(new URL(rota, base), { redirect: "manual" });
    const corpo = await r.text();
    saida[rota] = { status: r.status, location: r.headers.get("location"), redirecionaPara: corpo.match(/NEXT_REDIRECT;\w+;([^;]+);/)?.[1] ?? null };
  }
  return saida;
}

function gerarFixtures(casa) {
  garantirPasta(PASTA_FIXTURES);
  const { contas, leituras, plano, ...versao1 } = casa.state;
  escrever(path.join(PASTA_FIXTURES, "casa-v2.json"), json({ state: casa.state, version: 2 }));
  escrever(path.join(PASTA_FIXTURES, "casa-v1.json"), json({ state: versao1, version: 1 }));
}

async function capturar(saida, opcoes) {
  const base = opcoes.url ?? "http://localhost:3100";
  saida = path.resolve(saida);
  garantirPasta(saida);
  const problemas = [];
  const resumo = {
    quando: new Date().toISOString(),
    base,
    ambiente: {
      commit: tentar("git rev-parse --short HEAD"),
      codigoAlterado: tentar("git status --porcelain -- src") || "",
      buildId: fs.existsSync(path.join(PASTA_WEB, ".next/BUILD_ID")) ? fs.readFileSync(path.join(PASTA_WEB, ".next/BUILD_ID"), "utf8").trim() : null,
      sha256: Object.fromEntries(["tarifas.json", "relatorio.json", "municipios/SP.json"].map((f) => [f, hash(path.join(PASTA_WEB, "public/dados", f))])),
    },
  };

  const manifesto = path.join(PASTA_WEB, ".next/prerender-manifest.json");
  if (fs.existsSync(manifesto)) {
    fs.copyFileSync(manifesto, path.join(saida, "prerender-manifest.json"));
    const m = JSON.parse(fs.readFileSync(manifesto, "utf8"));
    resumo.prerender = { rotas: Object.keys(m.routes).sort(), inicio: { initialRevalidateSeconds: m.routes["/"]?.initialRevalidateSeconds, htmlSize: m.routes["/"]?.htmlSize } };
    if (resumo.prerender.inicio.initialRevalidateSeconds !== 86400) problemas.push(`prerender: a / deveria revalidar a cada 86400 s, está ${resumo.prerender.inicio.initialRevalidateSeconds}`);
  } else problemas.push("prerender-manifest.json não encontrado: rode pnpm build antes");

  resumo.rotas = await rotasHttp(base);
  for (const [rota, r] of Object.entries(resumo.rotas)) if (r.status !== 200) problemas.push(`rota ${rota} respondeu ${r.status}`);
  if (resumo.rotas["/casa/aparelhos"].redirecionaPara !== "/casa/comodos") problemas.push("/casa/aparelhos não redireciona para /casa/comodos");

  const navegador = await chromium.launch();
  try {
    resumo.fluxo = {};
    for (const vp of [390, 1280]) {
      const s = await new Sessao({ navegador, base, saida, vp, problemas }).abrir();
      let resultado;
      try {
        resultado = await fluxoCompleto(s);
      } catch (e) {
        problemas.push(`[${vp}] o fluxo parou: ${e.message.split("\n")[0]}`);
        await s.pagina.screenshot({ path: path.join(saida, `falha-${vp}.png`), fullPage: true }).catch(() => {});
      }
      await s.fechar();
      if (resultado) escrever(path.join(saida, `casa-final-${vp}.json`), json(resultado.casa));
      resumo.fluxo[vp] = {
        capturas: s.passo,
        transicoesTotal: s.transicoes.at(-1)?.transicoesAcumuladas ?? 0,
        transicoesPorPasso: s.transicoes,
        nomesDeTransicao: resultado?.nomesDeTransicao,
        erros: s.erros,
        avisos: s.avisos,
      };
      if (vp === 390 && resultado && (opcoes["gerar-fixtures"] || !fs.existsSync(path.join(PASTA_FIXTURES, "casa-v2.json")))) {
        gerarFixtures(resultado.casa);
        resumo.fixturesGeradas = true;
      }
    }
    if (fs.existsSync(path.join(PASTA_FIXTURES, "casa-v2.json"))) {
      resumo.migracao = { v2: await migracao(navegador, base, saida, problemas, 2), v1: await migracao(navegador, base, saida, problemas, 1) };
      resumo.movimentoReduzido = await movimentoReduzido(navegador, base, saida, problemas);
      resumo.apagarTudo = await apagarTudo(navegador, base, saida, problemas);
      resumo.bytesJs = await bytesDeJs(navegador, base, problemas);
    } else problemas.push("sem fixtures: o fluxo não terminou, então não deu para testar migração, movimento reduzido e bytes");
  } finally {
    await navegador.close();
  }

  resumo.problemas = problemas;
  escrever(path.join(saida, "resumo.json"), json(resumo));
  const capturas = Object.values(resumo.fluxo).reduce((t, f) => t + f.capturas, 0);
  console.log(`Evidências em ${saida}`);
  for (const [vp, f] of Object.entries(resumo.fluxo)) console.log(`  ${vp}px: ${f.capturas} capturas, ${f.transicoesTotal} transições, ${f.erros.length} erros no console`);
  console.log(`  fluxo: ${capturas} capturas; total na pasta: ${contarArquivos(path.join(saida, "capturas"), ".png")} capturas`);
  if (resumo.bytesJs) for (const [r, m] of Object.entries(resumo.bytesJs)) console.log(`  JS ${r}: ${m.bytesJsComprimidos} bytes comprimidos em ${m.arquivosJs} arquivos`);
  if (resumo.movimentoReduzido) console.log(`  movimento reduzido: .surgir dura ${resumo.movimentoReduzido.duracaoSurgir}; ${resumo.movimentoReduzido.transicoesNasAbas} transições em 4 trocas de aba`);
  if (problemas.length) {
    console.log(`\n${problemas.length} problema(s):`);
    for (const pr of problemas) console.log(`  - ${pr}`);
    process.exitCode = 1;
  } else console.log("\nLinha de base: tudo certo (0 erros).");
}

function contarArquivos(pasta, ext) {
  if (!fs.existsSync(pasta)) return 0;
  return fs.readdirSync(pasta, { recursive: true }).filter((f) => String(f).endsWith(ext)).length;
}

// ---------------------------------------------------------------- comparação

function listar(pasta) {
  return fs
    .readdirSync(pasta, { recursive: true })
    .map(String)
    .filter((f) => fs.statSync(path.join(pasta, f)).isFile() && !f.startsWith("diferencas"))
    .sort();
}

async function compararImagens(pagina, a, b) {
  const paraDados = (f) => `data:image/png;base64,${fs.readFileSync(f).toString("base64")}`;
  return pagina.evaluate(
    async ([da, db]) => {
      const carregar = (src) => new Promise((ok, erro) => Object.assign(new Image(), { onload() { ok(this); }, onerror: erro, src }));
      const [ia, ib] = await Promise.all([carregar(da), carregar(db)]);
      if (ia.width !== ib.width || ia.height !== ib.height) return { pixels: -1, tamanho: `${ia.width}×${ia.height} → ${ib.width}×${ib.height}` };
      const c = Object.assign(document.createElement("canvas"), { width: ia.width, height: ia.height });
      const x = c.getContext("2d", { willReadFrequently: true });
      x.drawImage(ia, 0, 0);
      const pa = x.getImageData(0, 0, c.width, c.height).data;
      x.clearRect(0, 0, c.width, c.height);
      x.drawImage(ib, 0, 0);
      const pb = x.getImageData(0, 0, c.width, c.height).data;
      const marcada = x.createImageData(c.width, c.height);
      let pixels = 0;
      for (let i = 0; i < pa.length; i += 4) {
        const difere = pa[i] !== pb[i] || pa[i + 1] !== pb[i + 1] || pa[i + 2] !== pb[i + 2] || pa[i + 3] !== pb[i + 3];
        if (difere) pixels++;
        const cinza = (pa[i] + pa[i + 1] + pa[i + 2]) / 3;
        marcada.data.set(difere ? [230, 0, 60, 255] : [cinza, cinza, cinza, 70], i);
      }
      x.putImageData(marcada, 0, 0);
      return { pixels, total: pa.length / 4, diferenca: pixels ? c.toDataURL("image/png") : null };
    },
    [paraDados(a), paraDados(b)],
  );
}

async function comparar(antes, depois) {
  antes = path.resolve(antes);
  depois = path.resolve(depois);
  const falhas = [];
  const avisos = [];
  const arquivosA = listar(antes);
  const arquivosB = new Set(listar(depois));
  const pastaDif = path.join(depois, "diferencas");
  fs.rmSync(pastaDif, { recursive: true, force: true });

  for (const f of arquivosA) if (!arquivosB.has(f) && !f.startsWith("falha-")) falhas.push(`falta em depois: ${f}`);
  for (const f of arquivosB) if (!arquivosA.includes(f) && !f.startsWith("falha-")) falhas.push(`a mais em depois: ${f}`);

  const navegador = await chromium.launch();
  const pagina = await navegador.newPage();
  let imagensIguais = 0;
  let textosIguais = 0;
  for (const f of arquivosA.filter((x) => arquivosB.has(x))) {
    const a = path.join(antes, f);
    const b = path.join(depois, f);
    if (f === "resumo.json" || f === "prerender-manifest.json") continue;
    if (f.endsWith(".png")) {
      if (fs.readFileSync(a).equals(fs.readFileSync(b))) {
        imagensIguais++;
        continue;
      }
      const r = await compararImagens(pagina, a, b);
      if (r.pixels === 0) imagensIguais++;
      else {
        falhas.push(`captura diferente: ${f} (${r.pixels < 0 ? `tamanho ${r.tamanho}` : `${r.pixels} de ${r.total} pixels`})`);
        if (r.diferenca) escrever(path.join(pastaDif, f), Buffer.from(r.diferenca.split(",")[1], "base64"));
      }
    } else if (f.endsWith(".json")) {
      if (iguais(JSON.parse(fs.readFileSync(a, "utf8")), JSON.parse(fs.readFileSync(b, "utf8")))) textosIguais++;
      else falhas.push(`casa salva diferente: ${f} (diff -u ${a} ${b})`);
    } else if (fs.readFileSync(a, "utf8") === fs.readFileSync(b, "utf8")) textosIguais++;
    else {
      falhas.push(`texto/DOM diferente: ${f} (diff -u ${a} ${b})`);
    }
  }
  await navegador.close();

  const ra = JSON.parse(fs.readFileSync(path.join(antes, "resumo.json"), "utf8"));
  const rb = JSON.parse(fs.readFileSync(path.join(depois, "resumo.json"), "utf8"));
  if (rb.problemas.length) falhas.push(...rb.problemas.map((p) => `depois: ${p}`));
  for (const k of ["tarifas.json", "relatorio.json", "municipios/SP.json"])
    if (ra.ambiente.sha256[k] !== rb.ambiente.sha256[k]) avisos.push(`public/dados/${k} mudou entre as capturas: diferenças de valor podem vir dos dados, não do código`);
  for (const vp of Object.keys(ra.fluxo)) {
    const pa = ra.fluxo[vp].transicoesPorPasso.map((t) => `${t.passo}:${t.transicoesAcumuladas}`);
    const pb = (rb.fluxo[vp]?.transicoesPorPasso ?? []).map((t) => `${t.passo}:${t.transicoesAcumuladas}`);
    if (pa.join() !== pb.join()) falhas.push(`${vp}px: transições por passo mudaram (antes ${ra.fluxo[vp].transicoesTotal}, depois ${rb.fluxo[vp]?.transicoesTotal})`);
    if (!iguais(ra.fluxo[vp].nomesDeTransicao, rb.fluxo[vp]?.nomesDeTransicao)) falhas.push(`${vp}px: nomes de view transition do topo/navegação mudaram`);
  }
  if (ra.movimentoReduzido?.transicoesNasAbas !== rb.movimentoReduzido?.transicoesNasAbas) falhas.push("movimento reduzido: número de transições nas abas mudou");
  if (!iguais(ra.rotas, rb.rotas)) falhas.push("rotas: status ou redirecionamento mudaram");
  if (!iguais(ra.prerender?.rotas, rb.prerender?.rotas)) falhas.push("prerender: lista de rotas mudou");
  if (rb.prerender?.inicio.initialRevalidateSeconds !== 86400) falhas.push("prerender: a / não revalida mais a cada 86400 s");
  const html = [ra.prerender?.inicio.htmlSize, rb.prerender?.inicio.htmlSize];
  if (html[0] && html[1] && Math.abs(html[1] - html[0]) / html[0] > 0.02) avisos.push(`htmlSize da / mudou mais de 2%: ${html[0]} → ${html[1]}`);
  console.log("Bytes de JavaScript (comprimidos), antes → depois:");
  for (const rota of Object.keys(ra.bytesJs ?? {})) {
    const a = ra.bytesJs[rota].bytesJsComprimidos;
    const b = rb.bytesJs?.[rota]?.bytesJsComprimidos;
    console.log(`  ${rota}: ${a} → ${b} (${b - a >= 0 ? "+" : ""}${b - a})`);
    if (!(b - a <= LIMITE_CRESCIMENTO_JS)) falhas.push(`JS de ${rota} cresceu ${b - a} bytes (limite ${LIMITE_CRESCIMENTO_JS})`);
  }
  console.log(`htmlSize da /: ${html[0]} → ${html[1]}`);
  console.log(`Capturas iguais: ${imagensIguais}; textos/DOM/casas iguais: ${textosIguais}`);
  for (const a of avisos) console.log(`aviso: ${a}`);
  if (falhas.length) {
    console.log(`\n${falhas.length} diferença(s):`);
    for (const f of falhas) console.log(`  - ${f}`);
    if (fs.existsSync(pastaDif)) console.log(`Pixels diferentes marcados em vermelho: ${pastaDif}`);
    process.exitCode = 1;
  } else console.log("\nComparação: nada mudou.");
}

// ---------------------------------------------------------------- entrada

(async () => {
  const { modo, posicionais, opcoes } = argumentos();
  if (modo === "capturar" && posicionais[0]) return capturar(posicionais[0], opcoes);
  if (modo === "comparar" && posicionais[1]) return comparar(posicionais[0], posicionais[1]);
  console.error("Uso:\n  node apps/web/e2e-base/linha-de-base.cjs capturar <pasta> [--url=http://localhost:3100] [--gerar-fixtures]\n  node apps/web/e2e-base/linha-de-base.cjs comparar <antes> <depois>");
  process.exitCode = 2;
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
