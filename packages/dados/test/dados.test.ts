import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { divisorDaUnidade, lerBandeiras } from "../src/aneel/bandeiras";
import { criarLeitorConjuntos, lerVinculos, mapearColunasConjuntos, mapearColunasMunicipios } from "../src/aneel/municipios";
import { ehTarifaResidencialB1, mapearColunasTarifas, selecionarTarifasVigentes, type ColunasTarifas } from "../src/aneel/tarifas";
import { lerCSV } from "../src/csv";
import { montarArquivos, validar } from "../src/montar";
import { acharColuna, dataISO, diaSeguinte, numeroBR, slug, subtrairMeses } from "../src/util";

const fixture = (nome: string) => fileURLToPath(new URL(`../fixtures/${nome}`, import.meta.url));

describe("utilidades", () => {
  it("lê números brasileiros", () => {
    expect(numeroBR("289,45")).toBe(289.45);
    expect(numeroBR("1.234,56")).toBe(1234.56);
    expect(numeroBR("289.45")).toBe(289.45);
    expect(numeroBR("")).toBeUndefined();
    expect(numeroBR("abc")).toBeUndefined();
  });

  it("lê datas em vários formatos", () => {
    expect(dataISO("2026-10-01")).toBe("2026-10-01");
    expect(dataISO("2026-10-01T00:00:00")).toBe("2026-10-01");
    expect(dataISO("01/10/2026")).toBe("2026-10-01");
    expect(dataISO("10/2026")).toBe("2026-10-01");
    expect(dataISO("")).toBeUndefined();
  });

  it("acha colunas sem depender de maiúsculas e acentos", () => {
    expect(acharColuna(["SIGAGENTE", "Vlr TE"], "SigAgente")).toBe("SIGAGENTE");
    expect(acharColuna(["Código IBGE do Município"], /ibge/)).toBe("Código IBGE do Município");
  });

  it("volta meses presa ao fim do mês (D4 da HIS-111)", () => {
    expect(subtrairMeses("2026-10-30", 6)).toBe("2026-04-30");
    expect(subtrairMeses("2026-08-31", 6)).toBe("2026-02-28");
    expect(subtrairMeses("2024-08-31", 6)).toBe("2024-02-29"); // ano bissexto
    expect(subtrairMeses("2026-03-31", 1)).toBe("2026-02-28");
    expect(subtrairMeses("2026-01-15", 6)).toBe("2025-07-15"); // vira o ano
    expect(diaSeguinte("2024-02-28")).toBe("2024-02-29");
    expect(diaSeguinte("2026-12-31")).toBe("2027-01-01");
  });

  it("gera ids estáveis", () => {
    expect(slug("LIGHT SESA")).toBe("light-sesa");
    expect(slug("CEMIG-D")).toBe("cemig-d");
  });
});

describe("tarifas da ANEEL", () => {
  async function ler() {
    let colunas: ColunasTarifas | undefined;
    const lido = await lerCSV(fixture("tarifas.csv"), {
      aoLerCabecalho: (cab) => (colunas = mapearColunasTarifas(cab)),
      filtro: (l) => ehTarifaResidencialB1(l, colunas!),
    });
    return { lido, colunas: colunas! };
  }

  it("guarda só residencial B1 convencional, tarifa de aplicação, sem baixa renda", async () => {
    const { lido } = await ler();
    expect(lido.total).toBe(10);
    // ESS (2 vigências + 1 com detalhe SCEE), CEMIG-D, LIGHT SESA, COOPERATIVA X
    expect(lido.linhas).toHaveLength(6);
  });

  it("escolhe a vigência atual, soma TE + TUSD e converte de R$/MWh para R$/kWh", async () => {
    const { lido, colunas } = await ler();
    const { tarifas, descartadas, vencidasEmUso } = selecionarTarifasVigentes(lido.linhas, colunas, "2026-10-29");
    expect(vencidasEmUso).toEqual([{ sigla: "LIGHT SESA", cnpj: "60444437000146", fimVigencia: "2026-05-14" }]);
    const ess = tarifas.find((t) => t.sigla === "ESS");
    expect(ess).toMatchObject({ inicioVigencia: "2026-07-12", resolucao: "REH 3.300/2026", cnpj: "07282377000120" });
    expect(ess!.teKwh + ess!.tusdKwh).toBeCloseTo(0.7708, 6);
    expect(tarifas.find((t) => t.sigla === "CEMIG-D")!.tusdKwh).toBeCloseTo(0.52075, 6);
    // LIGHT: vigência terminou há 5 meses e meio e não há outra publicada — usa a mais recente que já começou,
    // com aviso (D4 da HIS-111: até 6 meses vencida). A fixture mudou de 2025-03-15 para 2025-05-15 por causa do D4.
    expect(tarifas.find((t) => t.sigla === "LIGHT SESA")?.inicioVigencia).toBe("2025-05-15");
    // Cooperativa com vigência só no futuro fica de fora
    expect(tarifas.find((t) => t.sigla === "COOPERATIVA X")).toBeUndefined();
    expect(descartadas.some((d) => d.startsWith("COOPERATIVA X"))).toBe(true);
  });

  it("explica qual coluna falta quando o formato muda", () => {
    expect(() => mapearColunasTarifas(["SigAgente", "VlrTE"])).toThrow(/VlrTUSD/);
  });
});

describe("bandeiras da ANEEL", () => {
  it("converte o adicional para R$/kWh", async () => {
    const lido = await lerCSV(fixture("bandeiras.csv"));
    const { bandeiras } = lerBandeiras(lido.cabecalho, lido.linhas);
    expect(bandeiras.map((b) => b.competencia)).toEqual(["2021-03", "2026-07", "2026-08", "2026-09", "2026-10"]);
    expect(bandeiras[0]).toMatchObject({ bandeira: "amarela", adicionalKwh: 0.01343 });
    expect(bandeiras[2]).toMatchObject({ bandeira: "amarela", adicionalKwh: 0.01885 });
    expect(bandeiras[4]).toMatchObject({ bandeira: "vermelha-2", adicionalKwh: 0.07877 });
  });

  it("descobre a unidade pelo maior valor do arquivo", () => {
    expect(divisorDaUnidade([0, 0.01885, 0.07877])).toBe(1);
    expect(divisorDaUnidade([0, 1.885, 7.877])).toBe(100);
    expect(divisorDaUnidade([0, 13.43, 18.85, 78.77])).toBe(1000);
  });

  it("lê arquivos em Latin-1", async () => {
    const lido = await lerCSV(fixture("bandeiras-latin1.csv"));
    const { bandeiras } = lerBandeiras(lido.cabecalho, lido.linhas);
    expect(bandeiras[0]).toMatchObject({ competencia: "2026-09", bandeira: "escassez-hidrica" });
    expect(bandeiras[0]!.adicionalKwh).toBeCloseTo(0.142);
  });
});

describe("montagem dos arquivos", () => {
  it("liga municípios às distribuidoras pelos conjuntos elétricos, usando o dono mais recente", async () => {
    let colunas: ColunasTarifas | undefined;
    const t = await lerCSV(fixture("tarifas.csv"), { aoLerCabecalho: (c) => (colunas = mapearColunasTarifas(c)), filtro: (l) => ehTarifaResidencialB1(l, colunas!) });
    const { tarifas } = selecionarTarifasVigentes(t.linhas, colunas!, "2026-10-29");
    let leitor: ReturnType<typeof criarLeitorConjuntos> | undefined;
    await lerCSV(fixture("conjuntos-atributos.csv"), {
      aoLerCabecalho: (c) => (leitor = criarLeitorConjuntos(mapearColunasConjuntos(c))),
      filtro: (l) => (leitor!.ler(l), false),
    });
    expect(leitor!.donos.get("301")?.agente).toBe("LIGHT SESA"); // AMPLA (2010) sai, fica LIGHT (2025)
    const m = await lerCSV(fixture("conjuntos-municipios.csv"));
    const { vinculos, conjuntosSemDono } = lerVinculos(m.linhas, mapearColunasMunicipios(m.cabecalho), leitor!.donos);
    expect(conjuntosSemDono).toBe(1);
    expect(vinculos.get(3304557)).toHaveLength(1);
    expect(vinculos.get(3541406)).toHaveLength(1);

    const b = await lerCSV(fixture("bandeiras.csv"));
    const montagem = montarArquivos({
      tarifas,
      bandeiras: lerBandeiras(b.cabecalho, b.linhas).bandeiras,
      vinculos,
      localidades: {
        estados: [{ uf: "SP", nome: "São Paulo" }, { uf: "MG", nome: "Minas Gerais" }, { uf: "RJ", nome: "Rio de Janeiro" }],
        municipios: [
          { ibge: 3541406, nome: "Presidente Prudente", uf: "SP" },
          { ibge: 3106200, nome: "Belo Horizonte", uf: "MG" },
          { ibge: 3304557, nome: "Rio de Janeiro", uf: "RJ" },
          { ibge: 3550308, nome: "São Paulo", uf: "SP" },
        ],
      },
      geradoEm: "2026-10-29T12:00:00Z",
      origem: "aneel",
      fontes: [],
    });

    const sp = montagem.municipiosPorUF.find((a) => a.uf === "SP")!;
    expect(sp.municipios.find((x) => x.nome === "Presidente Prudente")?.distribuidoras).toEqual(["ess"]);
    expect(montagem.tarifas.distribuidoras.find((d) => d.id === "ess")?.ufs).toEqual(["SP"]);
    expect(montagem.tarifas.estados.find((e) => e.uf === "RJ")?.distribuidoras).toEqual(["light-sesa"]);
    expect(montagem.relatorio.municipiosSemDistribuidora).toBe(1);

    // Com tão poucos dados, a validação deve impedir a publicação
    expect(validar(montagem, "2026-10-29").length).toBeGreaterThan(0);
  });
});
