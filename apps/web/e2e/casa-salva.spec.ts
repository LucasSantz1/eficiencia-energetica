/*
 * Casa salva quebrada não trava o site (HIS-003a, critério 2; T1; R4, R7; D8 e D10 2), em 390 e 1280 px.
 * Cada teste grava no localStorage o que o site nunca gravaria (JSON quebrado, potência negativa, `uf` estranha,
 * versão de outro deploy, 10 000 aparelhos) e confere o que a pessoa vê e o que fica guardado. "Igual" segue o R4:
 * sem aviso, o texto da chave fica idêntico byte a byte (não regrava à toa); com descarte, o que ficou é igual ao
 * original. A unidade (`packages/core/test/casa-salva.test.ts`) cobre a lista inteira de casos; aqui, o navegador.
 *
 * Trava da gravação (D10 2): ela só liga quando o próprio leitor lança (bug nosso). Para provocar sem mexer no site,
 * o `Object.hasOwn` lança quando recebe um objeto com a chave `e2eLancar` — só a casa semeada a tem.
 */
import type { BrowserContext, Page } from "@playwright/test";
import { CHAVE_CASA, CHAVE_CASA_ILEGIVEL, casaSalva, lerFixture, semearCasa, semearTextos, textoGuardado, type CasaGuardada } from "./apoio/casa";
import { expect, test } from "./apoio/teste";

const T1A = "Parte do que estava salvo aqui tinha um problema e foi tirada.";
const T1B = "Não conseguimos abrir sua cidade e sua empresa de luz.";
const T1C = "Não conseguimos abrir a casa que estava salva aqui.";

/** O aviso T1 (há outros `role="status"` na tela, como os contadores e o "Mês a mês"). */
const aviso = (pagina: Page) => pagina.getByRole("status").filter({ hasText: new RegExp(`^(${[T1A, T1B, T1C].join("|")})`) });
const titulo = (pagina: Page) => pagina.getByRole("heading", { level: 1 });

/** Cópia funda da fixture da versão 2, para mudar sem estragar as outras. */
function casaV2(): CasaGuardada {
  return structuredClone(lerFixture("casa-v2.json"));
}

/** A casa com a `residencia` mudada (a fixture tem residência; o tipo de fora é `unknown`). */
function comResidencia(casa: CasaGuardada, mudanca: Record<string, unknown>): CasaGuardada {
  const atual = casa.state.residencia;
  if (typeof atual !== "object" || atual === null) throw new Error("fixture sem residência");
  return { ...casa, state: { ...casa.state, residencia: { ...atual, ...mudanca } } };
}

/** Confere que não sobrou aviso nenhum na tela (o recipiente `role="status"` fica, vazio). */
async function semAviso(pagina: Page): Promise<void> {
  await expect(pagina.locator('div[role="status"]:empty').first(), "o recipiente do T1 continua na página").toBeAttached();
  await expect(aviso(pagina)).toHaveCount(0);
}

test("(a) JSON quebrado: T1c em /casa, chave regravada vazia, sem aviso depois de recarregar", async ({ page, context }) => {
  await semearTextos(context, { [CHAVE_CASA]: '{"state":{"comodos":[' });
  await page.goto("/casa");
  await expect(aviso(page)).toContainText(T1C);
  await expect(aviso(page)).toContainText("As informações tinham um problema. Cadastre a casa de novo para ver quanto cada aparelho custa.");
  await expect(aviso(page).getByRole("link", { name: "Cadastrar minha casa" })).toHaveAttribute("href", "/comecar");
  await expect(titulo(page)).toHaveText("Vamos cadastrar a sua casa");
  await expect.poll(() => casaSalva(page)).toEqual({ version: 2, state: { comodos: [], aparelhos: [], contas: [], leituras: [], plano: [] } });

  await aviso(page).getByRole("button", { name: "Entendi" }).click();
  await expect(titulo(page), "Entendi leva o foco ao título, nunca ao body").toBeFocused();
  await semAviso(page);
  await page.reload();
  await expect(titulo(page)).toHaveText("Vamos cadastrar a sua casa");
  await semAviso(page);
});

// Fora do tipo mínimo de `CasaGuardada` (o e2e só conhece o que lê); por isso numa constante à parte.
const POTENCIA_NEGATIVA = { potenciaW: -5 };

test("(b) potência -5 num aparelho: \"Tiramos 1 aparelho.\", o resto continua igual", async ({ page, context }, info) => {
  const casa = casaV2();
  const [quebrado, ...resto] = casa.state.aparelhos;
  if (!quebrado) throw new Error("fixture sem aparelhos");
  await semearCasa(context, { ...casa, state: { ...casa.state, aparelhos: [{ ...quebrado, ...POTENCIA_NEGATIVA }, ...resto] } });
  await page.goto("/casa");
  await expect(aviso(page)).toContainText(T1A);
  await expect(aviso(page)).toContainText("Tiramos 1 aparelho. O resto da sua casa continua salvo.");
  await expect(aviso(page).getByRole("link", { name: "Ver meus aparelhos" })).toHaveAttribute("href", "/casa/aparelhos");
  await expect(titulo(page)).toHaveText("Sua conta estimada por mês");
  await info.attach("t1a", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });

  // Regravada só com o que ficou, cada item igual ao original.
  await expect.poll(async () => (await casaSalva(page))?.state.aparelhos.length).toBe(resto.length);
  expect(await casaSalva(page)).toEqual({ version: 2, state: { ...casa.state, aparelhos: resto } });

  await page.reload();
  await expect(titulo(page)).toHaveText("Sua conta estimada por mês");
  await semAviso(page);
});

test("(c) uf \"../x\": T1b, nenhum pedido fora das 27 UFs (R7) e a casa volta ao escolher a cidade", async ({ page, context }) => {
  const casa = casaV2();
  await semearCasa(context, comResidencia(casa, { uf: "../x" }));
  const municipiosPedidos: string[] = [];
  page.on("request", (pedido) => {
    const caminho = new URL(pedido.url()).pathname;
    if (caminho.startsWith("/dados/") && caminho !== "/dados/tarifas.json") municipiosPedidos.push(caminho);
  });

  await page.goto("/casa");
  await expect(aviso(page)).toContainText(T1B);
  await expect(aviso(page)).toContainText("Seus aparelhos continuam salvos. Escolha a cidade de novo para ver os valores.");
  await page.waitForLoadState("networkidle");
  expect(municipiosPedidos, "a uf estranha não vira endereço de pedido").toEqual([]);
  await expect.poll(async () => (await casaSalva(page))?.state.residencia).toBeUndefined();
  expect((await casaSalva(page))?.state.aparelhos).toEqual(casa.state.aparelhos);

  await aviso(page).getByRole("link", { name: "Escolher minha cidade" }).click();
  await expect(page).toHaveURL(/\/casa\/ajustes$/);
  await page.locator("main").getByRole("button", { name: "Escolher minha cidade" }).click();
  await page.locator("#troca-uf").selectOption("SP");
  await page.locator("#busca-cidade").fill("Presidente Prudente");
  await page.getByRole("radio", { name: "Presidente Prudente", exact: true }).click();
  await expect(page.getByText("Presidente Prudente – SP")).toBeVisible();
  for (const pedido of municipiosPedidos) expect(pedido, "só UFs da lista").toMatch(/^\/dados\/municipios\/[A-Z]{2}\.json$/);

  const depois = await casaSalva(page);
  expect(depois?.state.residencia).toMatchObject({ uf: "SP", municipioIbge: 3541406, distribuidoraId: "ess" });
  expect(depois?.state.aparelhos, "os aparelhos voltam com a cidade").toEqual(casa.state.aparelhos);
  await page.goto("/casa");
  await expect(titulo(page)).toHaveText("Sua conta estimada por mês");
});

test("(d) version 2 válida, com chave extra e __proto__: sem aviso e o texto fica idêntico byte a byte", async ({ page, context }) => {
  const casa = casaV2();
  // `__proto__` no texto vira propriedade própria no JSON.parse: o leitor não a lê nem a espalha.
  const texto = JSON.stringify(casa).replace('"state":{', '"state":{"__proto__":{"poluido":true},"chaveDeOutraVersao":1,');
  expect(texto).toContain("__proto__");
  await semearTextos(context, { [CHAVE_CASA]: texto });
  await page.goto("/casa");
  await expect(titulo(page)).toHaveText("Sua conta estimada por mês");
  await semAviso(page);
  await page.goto("/casa/comodos");
  await expect(titulo(page)).toHaveText("Cômodos e aparelhos");
  expect(await textoGuardado(page, CHAVE_CASA)).toBe(texto);
  expect(await page.evaluate(() => "poluido" in Object.prototype), "o protótipo continua o normal").toBe(false);
});

for (const version of [1, 99]) {
  test(`(d) version ${version} válida: sem aviso, o persist regrava na versão 2 com o mesmo conteúdo`, async ({ page, context }) => {
    const casa = casaV2();
    await semearCasa(context, { ...casa, version });
    await page.goto("/casa");
    await expect(titulo(page)).toHaveText("Sua conta estimada por mês");
    await semAviso(page);
    await expect.poll(async () => (await casaSalva(page))?.version).toBe(2);
    expect(await casaSalva(page)).toEqual(casa);
  });
}

test("(e) 10 000 aparelhos: abre em menos de 5 s, ficam 500 e o aviso conta o resto", async ({ page, context }) => {
  const casa = casaV2();
  const modelo = casa.state.aparelhos[0];
  if (!modelo) throw new Error("fixture sem aparelhos");
  const aparelhos = Array.from({ length: 10_000 }, (_, i) => ({ ...modelo, id: `e2e-${i}` }));
  await semearCasa(context, { ...casa, state: { ...casa.state, aparelhos, plano: [] } });
  const inicio = Date.now();
  await page.goto("/casa");
  // D-3a-3: a quantidade sai com ponto de milhar (formatarQuantidade do core).
  await expect(aviso(page)).toContainText("Tiramos 9.500 aparelhos.");
  await expect(titulo(page)).toHaveText("Sua conta estimada por mês");
  expect(Date.now() - inicio, "milissegundos até a tela abrir").toBeLessThan(5_000);
  await expect.poll(async () => (await casaSalva(page))?.state.aparelhos.length).toBe(500);
});

for (const rota of ["/", "/comecar"]) {
  test(`(f) o aviso também aparece em ${rota}`, async ({ page, context }) => {
    await semearTextos(context, { [CHAVE_CASA]: "não é JSON" });
    await page.goto(rota);
    await expect(aviso(page)).toContainText(T1C);
    await aviso(page).getByRole("button", { name: "Entendi" }).click();
    await expect(aviso(page)).toHaveCount(0);
    await expect(titulo(page)).toBeFocused();
  });
}

test("(g) o recipiente role=\"status\" já vem vazio no HTML do servidor", async ({ request }) => {
  for (const rota of ["/", "/comecar", "/casa", "/casa/comodos", "/casa/dicas", "/casa/ajustes"]) {
    const html = await (await request.get(rota)).text();
    expect.soft(html, `${rota}: <div role="status"></div> no HTML`).toMatch(/<div role="status"( class="")?><\/div>/);
  }
});

test.fixme("HIS-111 · (h) distribuidora substituída: a casa com rge-sul mostra o preço da RGE e é regravada com rge", async ({ page, context }) => {
  // Critério 8 da HIS-111: o `substituidas` entra no `lerArquivoTarifas` no rebase da 003a (nota do backend, D10 3).
  // Quando entrar, trocar fixme por test.
  const casa = casaV2();
  const comRgeSul = comResidencia(casa, { uf: "RS", municipioIbge: 4314902, municipioNome: "Porto Alegre", distribuidoraId: "rge-sul" });
  await semearCasa(context, { ...comRgeSul, state: { ...comRgeSul.state, contas: [] } });
  await page.route("**/dados/tarifas.json", async (rota) => {
    const resposta = await rota.fetch();
    const tarifas: unknown = await resposta.json();
    if (typeof tarifas !== "object" || tarifas === null) throw new Error("tarifas.json de verdade não é objeto");
    await rota.fulfill({ response: resposta, json: { ...tarifas, substituidas: { "rge-sul": "rge" } } });
  });
  await page.goto("/casa");
  await expect(titulo(page)).toHaveText("Sua conta estimada por mês");
  await expect.poll(async () => (await casaSalva(page))?.state.residencia).toMatchObject({ distribuidoraId: "rge" });
});

/** "Apagar todos os meus dados" na Minha casa, confirmado: volta para a / (LGPD). */
async function apagarTudoPelaMinhaCasa(pagina: Page): Promise<void> {
  await pagina.getByRole("button", { name: "Apagar todos os meus dados" }).click();
  await pagina.getByRole("button", { name: "Sim, apagar" }).click();
  await expect(pagina).toHaveURL((url) => url.pathname === "/");
}

test.describe("Minha casa sem cidade (D-3a-1 e D-3a-2)", () => {
  test("T1b: a Minha casa oferece Apagar tudo, e o aviso não tem link para a própria página", async ({ page, context }) => {
    await semearCasa(context, comResidencia(casaV2(), { uf: "../x" }));
    await page.goto("/casa/ajustes");
    await expect(aviso(page)).toContainText(T1B);
    // D-3a-2: aqui o link "Escolher minha cidade" do aviso não levaria a lugar nenhum; fica só o botão da tela.
    await expect(aviso(page).getByRole("link", { name: "Escolher minha cidade" })).toHaveCount(0);
    await page.locator("main").getByRole("button", { name: "Escolher minha cidade" }).click();
    await expect(page.getByRole("dialog", { name: "Mudar cidade" })).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "Fechar" }).click();

    // D-3a-1: com aparelhos guardados e sem cidade, dá para apagar tudo.
    await apagarTudoPelaMinhaCasa(page);
    await page.reload();
    const depois = await casaSalva(page);
    expect(depois?.state.aparelhos ?? [], "os aparelhos saíram do aparelho").toEqual([]);
  });

  test("só a cópia ilegível guardada: a Minha casa abre e Apagar tudo a tira", async ({ page, context }) => {
    await semearTextos(context, { [CHAVE_CASA_ILEGIVEL]: "texto que não deu para ler" });
    await page.goto("/casa/ajustes");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Minha casa");
    await expect(page.locator("main").getByRole("button", { name: "Escolher minha cidade" }), "sem aparelhos, não há cidade a escolher").toHaveCount(0);
    await apagarTudoPelaMinhaCasa(page);
    expect(await textoGuardado(page, CHAVE_CASA_ILEGIVEL)).toBeNull();
  });

  test("nada guardado: a Minha casa continua mandando cadastrar", async ({ page }) => {
    await page.goto("/casa/ajustes");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Vamos cadastrar a sua casa");
    await expect(page.getByRole("button", { name: "Apagar todos os meus dados" })).toHaveCount(0);
  });
});

test.describe("trava da gravação (D10 2)", () => {
  /** O leitor da casa lança com a casa semeada: o `merge` pega, mostra o T1c e trava a gravação. */
  async function leitorQueLanca(contexto: BrowserContext): Promise<void> {
    await contexto.addInitScript(() => {
      const original = Object.hasOwn;
      Object.hasOwn = (objeto: object, chave: PropertyKey) => {
        if (typeof objeto === "object" && objeto !== null && original(objeto, "e2eLancar")) throw new TypeError("leitor quebrado de propósito");
        return original(objeto, chave);
      };
    });
  }
  const TEXTO = JSON.stringify({ state: { ...casaV2().state, e2eLancar: true }, version: 2 });

  /** O cadastro mais curto, até o painel (mesmos passos do fluxo-principal, sem conferir transições). */
  async function cadastrar(pagina: Page): Promise<void> {
    const botao = (nome: string | RegExp) => pagina.getByRole("button", { name: nome, exact: typeof nome === "string" });
    await pagina.goto("/comecar");
    await expect(titulo(pagina)).toHaveText("Em qual estado você mora?");
    await pagina.locator("select#estado").selectOption("SP");
    await botao("Continuar").click();
    await pagina.locator("#busca-cidade").fill("Presidente Prudente");
    await pagina.getByRole("radio", { name: "Presidente Prudente", exact: true }).click();
    await pagina.getByRole("radio", { name: /^Não sei/ }).click();
    await expect(titulo(pagina)).toHaveText("Quantas pessoas moram na casa?");
    await botao("Continuar").click();
    await botao(/^Continuar com \d+ cômodos$/).click();
    while (!(await botao("Ver o resumo dos cômodos").isVisible())) {
      const marcador = await pagina.getByText(/^Cômodo \d+ de \d+$/).innerText();
      await botao(/^Próximo: /).click();
      await expect(pagina.getByText(marcador, { exact: true })).toHaveCount(0);
    }
    await botao("Ver o resumo dos cômodos").click();
    await botao("Continuar").click();
    await botao("Pular, não tenho a conta agora").click();
    await expect(pagina).toHaveURL(/\/casa$/);
    await expect(titulo(pagina)).toHaveText("Sua conta estimada por mês");
  }

  /** A casa do cadastro novo foi gravada por cima (e não ficou o texto antigo, que também é de Presidente Prudente). */
  async function conferirCasaNova(pagina: Page): Promise<void> {
    expect(await textoGuardado(pagina, CHAVE_CASA) === TEXTO, "o cadastro novo precisa gravar por cima do texto ilegível").toBe(false);
    const nova = await casaSalva(pagina);
    expect(nova?.version).toBe(2);
    expect(nova?.state).not.toHaveProperty("e2eLancar");
    expect(nova?.state.residencia).toMatchObject({ uf: "SP", municipioIbge: 3541406, beneficio: "nao-sei" });
  }

  test.beforeEach(async ({ context }) => {
    await leitorQueLanca(context);
  });

  test("leitor que lança: T1c, e nada é gravado por cima da casa enquanto a pessoa navega", async ({ page, context }) => {
    await semearTextos(context, { [CHAVE_CASA]: TEXTO });
    await page.goto("/casa");
    await expect(aviso(page)).toContainText(T1C);
    for (const rota of ["/casa/comodos", "/casa/ajustes", "/", "/comecar"]) {
      await page.goto(rota);
      await page.waitForLoadState("networkidle");
    }
    expect(await textoGuardado(page, CHAVE_CASA) === TEXTO, "a casa que não deu para ler fica intacta (byte a byte)").toBe(true);
    expect(await textoGuardado(page, CHAVE_CASA_ILEGIVEL)).toBeNull();
  });

  test("cadastro novo guarda a cópia, solta a trava e grava; \"Apagar tudo\" depois tira as duas chaves", async ({ page, context }) => {
    await semearTextos(context, { [CHAVE_CASA]: TEXTO });
    await cadastrar(page);
    expect(await textoGuardado(page, CHAVE_CASA_ILEGIVEL) === TEXTO, "cópia byte a byte do texto que não deu para ler").toBe(true);
    await conferirCasaNova(page);

    await page.reload();
    await expect(titulo(page)).toHaveText("Sua conta estimada por mês");
    await semAviso(page);

    await page.goto("/casa/ajustes");
    await page.getByRole("button", { name: "Apagar todos os meus dados" }).click();
    await page.getByRole("button", { name: "Sim, apagar" }).click();
    await expect(page).toHaveURL((url) => url.pathname === "/");
    expect(await textoGuardado(page, CHAVE_CASA_ILEGIVEL), "Apagar tudo tira a cópia (LGPD)").toBeNull();
    await page.reload();
    const depois = await casaSalva(page);
    expect(depois?.state.residencia ?? null).toBeNull();
    expect(depois?.state.aparelhos ?? []).toEqual([]);
  });

  test("com a trava, a Minha casa oferece Apagar tudo, que tira a casa e a cópia (D-3a-1)", async ({ page, context }) => {
    await semearTextos(context, { [CHAVE_CASA]: TEXTO, [CHAVE_CASA_ILEGIVEL]: "cópia de antes" });
    await page.goto("/casa/ajustes");
    await expect(aviso(page)).toContainText(T1C);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Minha casa");
    await apagarTudoPelaMinhaCasa(page);
    expect(await textoGuardado(page, CHAVE_CASA), "Apagar tudo tira a casa que não deu para ler (LGPD)").toBeNull();
    expect(await textoGuardado(page, CHAVE_CASA_ILEGIVEL)).toBeNull();
  });

  test("a cópia é feita uma vez só: não sobrescreve a que já existe", async ({ page, context }) => {
    await semearTextos(context, { [CHAVE_CASA]: TEXTO, [CHAVE_CASA_ILEGIVEL]: "cópia de antes" });
    await cadastrar(page);
    expect(await textoGuardado(page, CHAVE_CASA_ILEGIVEL)).toBe("cópia de antes");
    await conferirCasaNova(page);
  });
});
