import { readdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { diagnosticar, escreverMarkdown, separarIdsVencidos } from "../src/diagnostico";
import { arquivosNaPasta } from "../src/fontes";

const pasta = (nome: string) => fileURLToPath(new URL(`../fixtures/sucessao/${nome}`, import.meta.url));
const HOJE = "2026-10-30";

/** Lista os arquivos (com data de modificação) de uma pasta, para provar que nada foi gravado. */
async function fotografar(caminho: string): Promise<string[]> {
  const nomes = await readdir(caminho, { recursive: true });
  const linhas = await Promise.all(nomes.map(async (n) => `${n}:${(await stat(`${caminho}/${n}`)).mtimeMs}`));
  return linhas.sort();
}

describe("diagnóstico da HIS-111 (passo 0)", () => {
  async function rodar() {
    const registro: string[] = [];
    const resultado = await diagnosticar({
      arquivos: arquivosNaPasta(pasta("")),
      hoje: HOJE,
      baixar: false,
      pastaPublicada: pasta("publicados"),
      caminhoSucessoes: pasta("sucessoes.json"),
      registrar: (l) => registro.push(l),
    });
    return { ...resultado, registro };
  }

  it("acha a empresa vencida (EDEVP inventada) e o ano em que o conjunto dela parou", async () => {
    const { dados } = await rodar();
    expect(dados.anoMaisRecenteDosConjuntos).toBe(2025);
    const edevp = dados.vencidas.find((v) => v.sigla === "EDEVP");
    expect(edevp).toMatchObject({
      cnpj: "07297359000111",
      ultimoFim: "2017-07-11",
      mesmoCnpjDeVigente: false,
      conjuntosComoDono: 1,
      ultimoAnoDosConjuntos: 2022,
      municipios: 1,
      municipiosComConjuntoRecenteDeOutra: 0,
    });
    // RGE SUL tem o CNPJ da RGE (vigente): é renomeação, e fica fora do portão (a).
    expect(dados.vencidas.find((v) => v.sigla === "RGE SUL")?.mesmoCnpjDeVigente).toBe(true);
  });

  it("lista os CNPJs com mais de uma sigla", async () => {
    const { dados } = await rodar();
    expect(dados.cnpjsComVariasSiglas.map((g) => [g.cnpj, g.agentes.map((a) => a.sigla)])).toEqual([["02016440000162", ["RGE", "RGE SUL"]]]);
  });

  it("portão (b): a sucessora do sucessoes.json tem um só valor na vigência", async () => {
    const { dados, markdown } = await rodar();
    expect(dados.sucessoras).toEqual([
      { sigla: "ESS", cnpj: "07282377000120", valores: 1 },
      { sigla: "RGE", cnpj: "02016440000162", valores: 1 },
    ]);
    expect(dados.comMaisDeUmValor).toEqual([]);
    expect(markdown).toContain("**As linhas ENF e EBO entram.**");
  });

  it("compara com os arquivos publicados e escreve o resumo do portão", async () => {
    const { dados, markdown } = await rodar();
    expect(dados.comparacao.publicadosLidos).toBe(4);
    expect(dados.comparacao.cidades.find((c) => c.ibge === 3504008)?.antes).toEqual(["edevp"]);
    expect(markdown).toContain("### Portão do passo 0");
    expect(markdown).toContain("- (a) C2:");
    expect(markdown).toContain("Nada foi gravado");
  });

  it("portão (a): mostra a coluna do ano e até que ano o arquivo de conjuntos vai", async () => {
    const { dados, markdown } = await rodar();
    expect(dados.anosDosConjuntos.coluna).toBe("AnoIndice");
    expect(dados.anosDosConjuntos.linhasPorAno.map((a) => a.ano)).toEqual([2021, 2022, 2025]);
    expect(dados.anosDosConjuntos.conjuntosPorUltimoAno).toEqual([
      { ano: 2022, conjuntos: 4 },
      { ano: 2025, conjuntos: 6 },
    ]);
    expect(markdown).toContain("- Arquivo de conjuntos: coluna do ano = AnoIndice; linhas por ano: 2021 (1), 2022 (4), 2025 (6)");
    expect(markdown).not.toContain("O arquivo de conjuntos para em");
    // Passo 0 real: o arquivo parou em 2014. O resumo diz que o ano do conjunto não separa empresa extinta.
    expect(escreverMarkdown({ ...dados, anoMaisRecenteDosConjuntos: 2014 })).toContain("**O arquivo de conjuntos para em 2014:**");
  });

  it("critério 2: a vencida com o mesmo id de uma publicada (CPFL SANTA CRUZ antiga) não conta como vencida", () => {
    const vencidas = [
      { sigla: "CPFL SANTA CRUZ", cnpj: "61116265000144" },
      { sigla: "CPFL MOCOCA", cnpj: "52503802000118" },
    ];
    const publicadas = [{ id: "cpfl-santa-cruz", sigla: "CPFL Santa Cruz", cnpj: "53859112000169" }];
    const { idsVencidos, vencidasComIdPublicado } = separarIdsVencidos(vencidas, publicadas);
    expect([...idsVencidos]).toEqual(["cpfl-mococa"]);
    expect(vencidasComIdPublicado).toEqual([
      { sigla: "CPFL SANTA CRUZ", cnpj: "61116265000144", id: "cpfl-santa-cruz", publicada: "CPFL Santa Cruz", cnpjDaPublicada: "53859112000169" },
    ]);
  });

  it("não grava nada: nem nos publicados nem nas fixtures", async () => {
    const antes = await fotografar(pasta(""));
    await rodar();
    expect(await fotografar(pasta(""))).toEqual(antes);
  });

  it("o registro de progresso sai em uma linha por chamada", async () => {
    const { registro } = await rodar();
    expect(registro.length).toBeGreaterThan(0);
    expect(registro.every((l) => !l.includes("\n"))).toBe(true);
  });
});
