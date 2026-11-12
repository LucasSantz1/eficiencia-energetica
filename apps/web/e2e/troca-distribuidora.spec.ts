/*
 * HIS-111, critério 8 (D7, F1; ADR-005): a casa salva com uma distribuidora que saiu do `tarifas.json` (empresa
 * renomeada ou incorporada) tem o preço de hoje desde a primeira tela, é regravada uma vez com o id novo e mostra o
 * aviso "O preço da luz foi atualizado" só na visita da troca e só sem conta de luz.
 *
 * O `tarifas.json` de teste sai do publicado: tira as empresas da fixture `substituidas-his111.json` e põe o campo
 * `substituidas`, como a rotina da HIS-111 grava. Assim o teste vale antes e depois de a rotina regravar os arquivos
 * (h8). A casa `casa-v2-rge-sul.json` é a `casa-v2.json` com a residência de Alegrete (RS) e `rge-sul`, o que o site
 * de hoje guarda para quem escolheu Alegrete. Nenhuma fixture antiga foi regerada.
 *
 * Nenhum valor em R$ é afirmado além do critério 8 (RGE: R$ 0,94 por kWh, do arquivo publicado em 29/10/2026), e
 * esse valor é lido do próprio arquivo, para não quebrar no próximo reajuste.
 */
import { readFileSync } from "node:fs";
import type { BrowserContext, Page } from "@playwright/test";
import { analisarAcessibilidade, violacoesQueReprovam } from "./apoio/axe";
import { CHAVE_CASA, casaSalva, semearCasa, type CasaGuardada } from "./apoio/casa";
import { aba } from "./apoio/telas";
import { expect, test } from "./apoio/teste";

interface DistribuidoraPublicada {
  id: string;
  sigla: string;
  tarifaKwh: number;
}
interface ArquivoDeTarifas {
  distribuidoras: DistribuidoraPublicada[];
  estados: { uf: string; distribuidoras: string[] }[];
  substituidas?: unknown;
  [outro: string]: unknown;
}

const lerJson = (caminho: string): unknown => JSON.parse(readFileSync(new URL(caminho, import.meta.url), "utf8"));

function eArquivoDeTarifas(valor: unknown): valor is ArquivoDeTarifas {
  return typeof valor === "object" && valor !== null && "distribuidoras" in valor && Array.isArray(valor.distribuidoras);
}
function eCasa(valor: unknown): valor is CasaGuardada {
  return typeof valor === "object" && valor !== null && "version" in valor && "state" in valor;
}
function eMapaDeIds(valor: unknown): valor is Record<string, string> {
  return typeof valor === "object" && valor !== null && Object.values(valor).every((v) => typeof v === "string");
}

const publicadoBruto = lerJson("../public/dados/tarifas.json");
const casaBruta = lerJson("./fixtures/casa-v2-rge-sul.json");
const substituidasBrutas = lerJson("./fixtures/substituidas-his111.json");
if (!eArquivoDeTarifas(publicadoBruto)) throw new Error("public/dados/tarifas.json sem { distribuidoras }");
if (!eCasa(casaBruta)) throw new Error("fixture casa-v2-rge-sul.json sem { version, state }");
const SUBSTITUIDAS = typeof substituidasBrutas === "object" && substituidasBrutas !== null && "substituidas" in substituidasBrutas ? substituidasBrutas.substituidas : undefined;
if (!eMapaDeIds(SUBSTITUIDAS)) throw new Error("fixture substituidas-his111.json sem { substituidas: { id: id } }");

const PUBLICADO = publicadoBruto;
const CASA_RGE_SUL = casaBruta;
/** O arquivo como a rotina da HIS-111 grava: sem as empresas que saíram e com `substituidas`. */
const TARIFAS_NOVAS: ArquivoDeTarifas = {
  ...PUBLICADO,
  distribuidoras: PUBLICADO.distribuidoras.filter((d) => !Object.hasOwn(SUBSTITUIDAS, d.id)),
  substituidas: SUBSTITUIDAS,
};
const RGE = PUBLICADO.distribuidoras.find((d) => d.id === "rge");
if (!RGE) throw new Error("rge não está no tarifas.json publicado");
const reais = (valor: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor).replace(/\s/g, " ");

declare global {
  interface Window {
    /** Cada valor que o site gravou na chave da casa nesta página (vigiarCasaETela). */
    e2eGravacoesDaCasa?: string[];
    /** Cada texto diferente que o `<main>` já mostrou nesta página, desde o primeiro quadro. */
    e2eTextosDoPrincipal?: string[];
  }
}

const TITULO_DO_AVISO = "O preço da luz foi atualizado";

function casaCom(residencia: Record<string, unknown>): CasaGuardada {
  const base = structuredClone(CASA_RGE_SUL);
  const atual = typeof base.state.residencia === "object" && base.state.residencia !== null ? base.state.residencia : {};
  return { ...base, state: { ...base.state, residencia: { ...atual, ...residencia } } };
}

/** Serve um `tarifas.json` de teste e, se pedido, um `municipios/{UF}.json` mudado (arquivo antigo no cache). */
async function servirDados(
  contexto: BrowserContext,
  tarifas: unknown,
  mudarMunicipios?: (uf: string, arquivo: { municipios: { nome: string; distribuidoras: string[] }[] }) => void,
): Promise<void> {
  await contexto.route("**/dados/tarifas.json", (rota) => rota.fulfill({ contentType: "application/json", body: JSON.stringify(tarifas) }));
  if (mudarMunicipios) {
    await contexto.route("**/dados/municipios/*.json", async (rota) => {
      const uf = rota.request().url().match(/municipios\/([A-Z]{2})\.json/)?.[1] ?? "";
      const resposta = await rota.fetch();
      const arquivo: { municipios: { nome: string; distribuidoras: string[] }[] } = await resposta.json();
      mudarMunicipios(uf, arquivo);
      await rota.fulfill({ response: resposta, body: JSON.stringify(arquivo) });
    });
  }
}

/**
 * Conta as gravações da casa e guarda todo texto do `<main>` que já apareceu, desde o primeiro quadro, para provar que
 * o preço antigo ou "R$ 0,00" nunca passou pela tela (critério 8, "desde a primeira tela").
 */
async function vigiarCasaETela(contexto: BrowserContext): Promise<void> {
  await contexto.addInitScript((chave) => {
    if (!location.protocol.startsWith("http")) return;
    const gravadas: string[] = [];
    const textos: string[] = [];
    window.e2eGravacoesDaCasa = gravadas;
    window.e2eTextosDoPrincipal = textos;
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k: string, v: string) {
      if (k === chave) gravadas.push(v);
      return original.call(this, k, v);
    };
    const anotar = () => {
      const texto = document.querySelector("main")?.textContent ?? "";
      if (texto && textos.at(-1) !== texto) textos.push(texto);
    };
    new MutationObserver(anotar).observe(document, { subtree: true, childList: true, characterData: true });
  }, CHAVE_CASA);
}

const gravacoes = (pagina: Page): Promise<string[]> => pagina.evaluate(() => window.e2eGravacoesDaCasa ?? []);
const textosVistos = (pagina: Page): Promise<string[]> => pagina.evaluate(() => window.e2eTextosDoPrincipal ?? []);
const idSalvo = async (pagina: Page) => {
  const residencia = (await casaSalva(pagina))?.state.residencia;
  return typeof residencia === "object" && residencia !== null && "distribuidoraId" in residencia ? residencia.distribuidoraId : undefined;
};
const regiaoStatus = (pagina: Page) => pagina.locator("main > [role=status]");

test.describe("troca de distribuidora (HIS-111, critério 8)", () => {
  test("rge-sul sem conta de luz: preço da RGE desde a primeira tela, uma gravação, aviso até \"Entendi\"", async ({ page, context }, info) => {
    await semearCasa(context, CASA_RGE_SUL);
    await vigiarCasaETela(context);
    await servirDados(context, TARIFAS_NOVAS);

    await page.goto("/casa");
    const aviso = regiaoStatus(page).getByText(TITULO_DO_AVISO);
    await expect(aviso).toBeVisible();
    // O aviso entra com `surgir` (escala e opacidade): tamanho e contraste só se medem depois da animação.
    await page.waitForFunction(() => document.getAnimations().every((animacao) => animacao.playState !== "running"));
    await expect(regiaoStatus(page)).toContainText(
      "A RGE Sul hoje é a RGE. A gente ainda usava o preço antigo. Agora a conta estimada usa o preço de hoje da RGE, mais perto da conta que chega na sua casa.",
    );
    await expect(regiaoStatus(page), "nunca o id nem a sigla solta").not.toContainText(/rge-sul|RGE SUL/);
    await expect(page.locator("main [role=status] [role=status], main [role=status] [role=alert]"), "sem status dentro de status").toHaveCount(0);
    await expect(page.getByText(`Tarifa da RGE: ${reais(RGE.tarifaKwh)} por kWh`)).toBeVisible();

    // Uma gravação só, e só o id mudou.
    await expect.poll(() => idSalvo(page)).toBe("rge");
    const depois = await casaSalva(page);
    expect(depois).toEqual(casaCom({ distribuidoraId: "rge" }));
    expect(await gravacoes(page), "a casa é regravada uma vez").toHaveLength(1);

    // Desde o primeiro quadro: nem "R$ 0,00", nem "Tarifa da :", nem o preço de 2019 da RGE Sul.
    const vistos = (await textosVistos(page)).join("\n");
    expect(vistos).not.toMatch(/Tarifa da :|Tarifa da RGE Sul|R\$\s?0,00 por kWh/);
    expect(vistos).not.toContain(reais(0.54732));

    // Toques de 44 px; o link vai para a conta de luz.
    for (const alvo of [regiaoStatus(page).getByRole("link", { name: "Usar minha conta de luz" }), page.getByRole("button", { name: "Entendi" })]) {
      expect((await alvo.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), "sem rolagem lateral").toBe(true);
    const axe = await analisarAcessibilidade(page);
    const graves = violacoesQueReprovam(axe.violations).flatMap((v) => v.nodes.map((n) => `${v.id}: ${n.target.join(" ")} — ${n.failureSummary ?? ""}`));
    expect(graves, "axe com o aviso aberto").toEqual([]);
    await info.attach("painel com o aviso", { body: await page.screenshot({ fullPage: true, animations: "disabled" }), contentType: "image/png" });

    // O aviso continua na Minha casa, que marca a RGE com o preço de hoje.
    await aba(page, "Minha casa").click();
    await expect(page.getByRole("heading", { name: "Minha casa", level: 1 })).toBeVisible();
    await expect(aviso).toBeVisible();
    await expect(page.getByText(`Distribuidora: RGE, tarifa de ${reais(RGE.tarifaKwh)} por kWh`)).toBeVisible();
    await info.attach("minha casa com o aviso", { body: await page.screenshot({ fullPage: true, animations: "disabled" }), contentType: "image/png" });

    // "Entendi" fecha e leva o foco ao h1; a região de status fica, vazia.
    await page.getByRole("button", { name: "Entendi" }).click();
    await expect(aviso).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Minha casa", level: 1 })).toBeFocused();
    await expect(regiaoStatus(page)).toHaveText("");
    expect(await gravacoes(page), "trocar de aba e fechar o aviso não gravam de novo").toHaveLength(1);

    // Próxima visita: o id já é o novo, nada é regravado e o aviso não volta.
    await page.goto("/casa");
    await expect(page.getByText(`Tarifa da RGE: ${reais(RGE.tarifaKwh)} por kWh`)).toBeVisible();
    await expect(regiaoStatus(page)).toHaveText("");
    expect(await gravacoes(page)).toHaveLength(0);
    expect(await casaSalva(page)).toEqual(depois);
  });

  test("cnee (sem nome comercial): o aviso sai sem o nome antigo e sem a sigla", async ({ page, context }) => {
    await semearCasa(context, casaCom({ uf: "SP", municipioIbge: 3541406, municipioNome: "Presidente Prudente", distribuidoraId: "cnee" }));
    await servirDados(context, TARIFAS_NOVAS);
    await page.goto("/casa");
    await expect(regiaoStatus(page)).toContainText(
      "A empresa de luz da sua cidade hoje é a Energisa Sul-Sudeste. A gente ainda usava um preço antigo. Agora a conta estimada usa o preço de hoje da Energisa Sul-Sudeste, mais perto da conta que chega na sua casa.",
    );
    await expect(regiaoStatus(page)).not.toContainText(/cnee/i);
    await expect.poll(() => idSalvo(page)).toBe("ess");
  });

  test("cerr em Caracaraí: nomes com acento no aviso", async ({ page, context }) => {
    await semearCasa(context, casaCom({ uf: "RR", municipioIbge: 1400209, municipioNome: "Caracaraí", distribuidoraId: "cerr" }));
    await servirDados(context, TARIFAS_NOVAS);
    await page.goto("/casa");
    await expect(regiaoStatus(page)).toContainText("A Companhia Energética de Roraima hoje é a Roraima Energia.");
    await expect(regiaoStatus(page)).not.toContainText(/\bCERR\b|cerr/);
    await expect.poll(() => idSalvo(page)).toBe("ambar-roraima");
  });

  test("rge-sul com conta de luz: regrava o id, sem aviso (o preço vem da conta)", async ({ page, context }) => {
    await semearCasa(context, casaCom({ contaReferencia: { kwh: 180, valor: 190 } }));
    await vigiarCasaETela(context);
    await servirDados(context, TARIFAS_NOVAS);
    await page.goto("/casa");
    await expect.poll(() => idSalvo(page)).toBe("rge");
    await expect(page.getByText("Sua conta estimada por mês")).toBeVisible();
    await expect(regiaoStatus(page)).toHaveText("");
    expect(await gravacoes(page)).toHaveLength(1);
  });

  test("arquivo antigo no cache (sem substituidas): a casa com rge não muda e não há aviso", async ({ page, context }) => {
    const casa = casaCom({ distribuidoraId: "rge" });
    const { substituidas: _semCampo, ...antigo } = TARIFAS_NOVAS;
    await semearCasa(context, casa);
    await vigiarCasaETela(context);
    await servirDados(context, antigo);
    await page.goto("/casa");
    await expect(page.getByText(`Tarifa da RGE: ${reais(RGE.tarifaKwh)} por kWh`)).toBeVisible();
    await expect(regiaoStatus(page)).toHaveText("");
    expect(await gravacoes(page)).toHaveLength(0);
    expect(await casaSalva(page)).toEqual(casa);
  });

  test("substituidas malformado ou em laço não quebra a tela nem regrava sem parar (R5, R6)", async ({ page, context }) => {
    await semearCasa(context, CASA_RGE_SUL);
    await vigiarCasaETela(context);
    // rge-sul → rge e rge → rge-sul: a troca acontece uma vez (rge está publicada), e a volta não (rge-sul não está).
    await servirDados(context, { ...TARIFAS_NOVAS, substituidas: { "rge-sul": "rge", rge: "rge-sul", constructor: "rge" } });
    await page.goto("/casa");
    await expect.poll(() => idSalvo(page)).toBe("rge");
    await page.waitForTimeout(500);
    expect(await gravacoes(page), "uma gravação, sem laço").toHaveLength(1);

    for (const malformado of [null, [], 1, { "rge-sul": 2 }]) {
      await context.unroute("**/dados/tarifas.json");
      await servirDados(context, { ...TARIFAS_NOVAS, substituidas: malformado });
      await page.evaluate((chave) => localStorage.removeItem(chave), CHAVE_CASA);
      await page.evaluate(({ chave, valor }) => localStorage.setItem(chave, valor), { chave: CHAVE_CASA, valor: JSON.stringify(CASA_RGE_SUL) });
      await page.reload();
      await expect(page.getByText("Sua conta estimada por mês"), `substituidas = ${JSON.stringify(malformado)}`).toBeVisible();
      await page.waitForTimeout(300);
      expect(await idSalvo(page), `substituidas = ${JSON.stringify(malformado)} não troca`).toBe("rge-sul");
      await expect(regiaoStatus(page)).toHaveText("");
    }
  });

  test("cadastro com municipios/{UF}.json antigo guarda o id de hoje e não repete empresa", async ({ page, context }) => {
    test.setTimeout(60_000);
    // Arquivo antigo no cache: Alegrete ainda com rge-sul; Aceguá sem empresa (o cadastro mostra as do estado).
    await servirDados(context, TARIFAS_NOVAS, (uf, arquivo) => {
      if (uf !== "RS") return;
      for (const m of arquivo.municipios) if (m.nome === "Alegrete") m.distribuidoras = ["rge-sul"];
    });
    const titulo = page.getByRole("heading", { level: 1 });

    // Aceguá: a lista do estado tem rge e rge-sul; a RGE aparece uma vez, e a RGE Sul não aparece.
    await page.goto("/comecar");
    await page.locator("select#estado").selectOption("RS");
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page.locator("#busca-cidade").fill("Aceguá");
    await page.getByRole("radio", { name: "Aceguá", exact: true }).click();
    await expect(titulo).toHaveText("Qual empresa manda a sua conta de luz?");
    await expect(page.getByRole("radio", { name: /^RGE\b(?! Sul)/ })).toHaveCount(1);
    await expect(page.getByRole("radio", { name: /RGE Sul/ })).toHaveCount(0);
    await page.getByRole("button", { name: /Voltar/ }).first().click();
    await expect(titulo).toHaveText("Qual é a sua cidade?");

    // Alegrete: uma empresa só (a RGE), pula a escolha, e a casa termina com "rge".
    await page.locator("#busca-cidade").fill("Alegrete");
    await page.getByRole("radio", { name: "Alegrete", exact: true }).click();
    await expect(titulo).toHaveText("Sua família está no CadÚnico?");
    await page.getByRole("radio", { name: /^Não/ }).first().click();
    await expect(titulo).toHaveText("Quantas pessoas moram na casa?");
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page.getByRole("button", { name: /^Continuar com \d+ cômodos$/ }).click();
    const marcador = page.getByText(/^Cômodo \d+ de \d+$/);
    const total = Number((await marcador.innerText()).match(/de (\d+)$/)?.[1]);
    for (let atual = 1; atual <= total; atual++) {
      await expect(marcador).toHaveText(`Cômodo ${atual} de ${total}`);
      await (atual < total ? page.getByRole("button", { name: /^Próximo: / }) : page.getByRole("button", { name: "Ver o resumo dos cômodos" })).click();
    }
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page.getByRole("button", { name: "Pular, não tenho a conta agora" }).click();
    await expect(page).toHaveURL(/\/casa$/);
    expect(await idSalvo(page)).toBe("rge");
    await expect(page.getByText(`Tarifa da RGE: ${reais(RGE.tarifaKwh)} por kWh`)).toBeVisible();
    await expect(regiaoStatus(page), "casa nova não tem troca a avisar").toHaveText("");
  });
});
