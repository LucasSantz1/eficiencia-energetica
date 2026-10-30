import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { resumirAgentes, ehTarifaResidencialB1, mapearColunasTarifas, type ColunasTarifas } from "../src/aneel/tarifas";
import { lerCSV } from "../src/csv";
import {
  carregarSucessoes,
  conferirSucessoesNaAneel,
  ErroNasSucessoes,
  indexarSucessoes,
  lerSucessoes,
  seguirCadeia,
  sucessoesEmVigor,
  type Sucessao,
} from "../src/sucessoes";

const fixture = (nome: string) => fileURLToPath(new URL(`../fixtures/sucessao/${nome}`, import.meta.url));
const HOJE = "2026-10-30";

const linha = (mudancas: Record<string, unknown> = {}): Record<string, unknown> => ({
  cnpjAntigo: "07297359000111",
  siglaAntiga: "EDEVP",
  cnpjSucessor: "07282377000120",
  siglaSucessora: "ESS",
  desde: "2017-06-30",
  ato: "REA ANEEL nº 6.318/2017",
  fonte: "https://www2.aneel.gov.br/cedoc/rea20176318.pdf",
  consultadoEm: "2026-10-30",
  ...mudancas,
});
const ler = (...linhas: Record<string, unknown>[]) => lerSucessoes({ sucessoes: linhas });

describe("base/sucessoes.json (dado revisado pelo dominio-energia)", () => {
  it("tem as 11 linhas aprovadas, todas com ato e fonte https", async () => {
    const sucessoes = await carregarSucessoes();
    expect(sucessoes.map((s) => `${s.siglaAntiga}→${s.siglaSucessora}`)).toEqual([
      "EDEVP→ESS",
      "CNEE→ESS",
      "EEB→ESS",
      "CFLO→ESS",
      "CPFL LESTE PAULI→CPFL Santa Cruz",
      "CPFL MOCOCA→CPFL Santa Cruz",
      "CPFL SUL PAULIST→CPFL Santa Cruz",
      "CPFL SANTA CRUZ→CPFL Santa Cruz",
      "ENF→EMR",
      "EBO→EPB",
      "CERR→Âmbar Roraima",
    ]);
    // A CERR entra sem número de ato da ANEEL, com o despacho do MME de 23/09/2016 (dominio-energia, passo 0).
    expect(sucessoes.find((s) => s.siglaAntiga === "CERR")?.ato).toMatch(/^Despacho MME s\/n, de 23\/09\/2016/);
    // A antiga CPFL SANTA CRUZ tem outro CNPJ, apesar do nome igual ao da sucessora (passo 0).
    expect(sucessoes.find((s) => s.siglaAntiga === "CPFL SANTA CRUZ")).toMatchObject({ cnpjAntigo: "61116265000144", cnpjSucessor: "53859112000169" });
    expect(sucessoesEmVigor(sucessoes, HOJE)).toHaveLength(11);
  });
});

describe("leitor das sucessões (critério 7)", () => {
  it("aceita a linha certa e guarda o índice", () => {
    expect(ler(linha())).toEqual([{ indice: 0, ...linha() }]);
  });

  it("para com a linha que está sem ato, com o índice e a sigla", async () => {
    await expect(carregarSucessoes(fixture("sucessoes-sem-ato.json"))).rejects.toThrow('sucessoes.json, sucessoes[0] (EDEVP): falta "ato".');
    expect(() => ler(linha(), linha({ cnpjAntigo: "61416244000144", siglaAntiga: "CNEE", ato: "  " }))).toThrow('sucessoes[1] (CNEE): falta "ato"');
  });

  it("para com a linha cuja fonte não é https", async () => {
    await expect(carregarSucessoes(fixture("sucessoes-sem-fonte.json"))).rejects.toThrow(/sucessoes\[0\] \(EDEVP\): "fonte" precisa ser um link/);
    expect(() => ler(linha({ fonte: undefined }))).toThrow('falta "fonte"');
    expect(() => ler(linha({ fonte: "https://" }))).toThrow(/"fonte" precisa ser um link/);
  });

  it("para com ciclo e com mais de 5 saltos", async () => {
    await expect(carregarSucessoes(fixture("sucessoes-ciclo.json"))).rejects.toThrow(/sucessoes\[0\] \(EDEVP\): .*ciclo/);
    const cnpj = (n: number) => String(n).padStart(14, "0");
    const cadeia = (tamanho: number) =>
      Array.from({ length: tamanho }, (_, i) => linha({ cnpjAntigo: cnpj(i + 1), siglaAntiga: `A${i + 1}`, cnpjSucessor: cnpj(i + 2), siglaSucessora: `A${i + 2}` }));
    expect(ler(...cadeia(5))).toHaveLength(5);
    expect(() => ler(...cadeia(6))).toThrow(/sucessoes\[0\] \(A1\): a cadeia de sucessão passa de 5 saltos/);
  });

  it("recusa CNPJ, data, sigla e campos fora da regra", () => {
    expect(() => ler(linha({ cnpjAntigo: "0729735900011" }))).toThrow(/"cnpjAntigo" precisa ter 14 dígitos/);
    expect(() => ler(linha({ cnpjSucessor: "07.282.377/0001-20" }))).toThrow(/"cnpjSucessor" passa de 14 caracteres/);
    expect(() => ler(linha({ cnpjSucessor: "07297359000111" }))).toThrow(/são iguais/);
    expect(() => ler(linha({ desde: "2017-02-30" }))).toThrow(/"desde" não é uma data/);
    expect(() => ler(linha({ consultadoEm: "30/10/2026" }))).toThrow(/"consultadoEm" não é uma data/);
    expect(() => ler(linha({ siglaAntiga: "x".repeat(41) }))).toThrow(/"siglaAntiga" passa de 40/);
    expect(() => ler(linha({ fontes: "https://a" }))).toThrow(/campo desconhecido "fontes"/);
    expect(() => ler(linha(), linha({ siglaAntiga: "EDEVP 2" }))).toThrow(/sucessoes\[1\] \(EDEVP 2\): o cnpjAntigo 07297359000111 já aparece em sucessoes\[0\]/);
    expect(() => lerSucessoes([linha()])).toThrow(ErroNasSucessoes);
    expect(() => lerSucessoes({ sucessoes: ["texto"] })).toThrow(/sucessoes\[0\] \(\?\): a linha não é um objeto/);
  });

  it("não aplica a linha com desde no futuro", () => {
    const [s] = ler(linha({ desde: "2026-10-31" }));
    expect(s && sucessoesEmVigor([s], HOJE)).toEqual([]);
  });

  it("segue a cadeia até a última sucessora", () => {
    const sucessoes = ler(linha(), linha({ cnpjAntigo: "07282377000120", siglaAntiga: "ESS", cnpjSucessor: "11111111000111", siglaSucessora: "NOVA" }));
    const cadeia = seguirCadeia(indexarSucessoes(sucessoes), "07297359000111");
    expect(cadeia).toMatchObject({ cnpj: "11111111000111", sigla: "NOVA" });
    expect(cadeia.saltos).toHaveLength(2);
    expect(seguirCadeia(indexarSucessoes(sucessoes), "99999999000199")).toEqual({ cnpj: "99999999000199", sigla: undefined, saltos: [] });
  });
});

describe("V9 e V10: a linha bate com a ANEEL (R3 da seguranca)", () => {
  async function dadosDaAneel() {
    let colunas: ColunasTarifas | undefined;
    const lido = await lerCSV(fixture("tarifas.csv"), {
      aoLerCabecalho: (c) => (colunas = mapearColunasTarifas(c)),
      filtro: (l) => (colunas ? ehTarifaResidencialB1(l, colunas) : false),
    });
    if (!colunas) throw new Error("fixture sem cabeçalho");
    return {
      agentesDaTarifa: resumirAgentes(lido.linhas, colunas, HOJE),
      siglasDosConjuntos: new Map([["07297359000111", new Set(["EDEVP"])]]),
    };
  }
  const conferir = async (arquivo: string): Promise<{ erros: string[]; avisos: string[] }> => {
    const sucessoes: Sucessao[] = await carregarSucessoes(fixture(arquivo));
    return conferirSucessoesNaAneel(sucessoes, await dadosDaAneel());
  };

  it("a linha certa passa", async () => {
    expect(await conferir("sucessoes.json")).toEqual({ erros: [], avisos: [] });
  });

  it("V9: a empresa antiga não pode ter tarifa vigente", async () => {
    const { erros } = await conferir("sucessoes-v9.json");
    expect(erros).toHaveLength(1);
    expect(erros[0]).toMatch(/^V9: sucessoes\[0\] \(CEMIG-D\): a empresa antiga ainda tem tarifa vigente na ANEEL \(CEMIG-D, desde 2026-05-28\)/);
  });

  it("V10: CNPJ com dígito trocado não aparece na ANEEL", async () => {
    const { erros } = await conferir("sucessoes-v10.json");
    expect(erros).toEqual(["V10: sucessoes[0] (EDEVP): o CNPJ da sucessora (07282377000210) não aparece na ANEEL. Dígito trocado?"]);
  });

  it("V10: sigla que não é a que a ANEEL usa para o CNPJ", async () => {
    const sucessoes = ler(linha({ siglaAntiga: "EEB" }));
    const { erros } = conferirSucessoesNaAneel(sucessoes, await dadosDaAneel());
    expect(erros).toEqual(['V10: sucessoes[0] (EEB): a sigla da antiga "EEB" não é a que a ANEEL usa para 07297359000111 (EDEVP).']);
  });

  it("avisa, sem parar, quando o desde está a mais de 12 meses do fim da antiga", async () => {
    const sucessoes = ler(linha({ desde: "2018-08-01" }));
    const { erros, avisos } = conferirSucessoesNaAneel(sucessoes, await dadosDaAneel());
    expect(erros).toEqual([]);
    expect(avisos).toEqual(['sucessoes[0] (EDEVP): "desde" (2018-08-01) está a mais de 12 meses do fim da última tarifa da antiga (2017-07-11).']);
  });
});
