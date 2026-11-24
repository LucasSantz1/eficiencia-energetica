import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { CHAVE_DA_LEITURA, interpretarPreferenciaDeLeitura, LEITURA_PADRAO, SCRIPT_DA_PRIMEIRA_PINTURA } from "@/infraestrutura/armazenamento/leitura";

describe("leitor da preferência de leitura (HIS-102)", () => {
  it("lê o que o site grava", () => {
    expect(interpretarPreferenciaDeLeitura(JSON.stringify({ letraMaior: true, maisContraste: false }))).toEqual({ letraMaior: true, maisContraste: false });
    expect(interpretarPreferenciaDeLeitura(JSON.stringify({ letraMaior: false, maisContraste: true }))).toEqual({ letraMaior: false, maisContraste: true });
  });

  it.each([
    ["nada guardado", null],
    ["JSON quebrado", "{letra"],
    ["número", "1"],
    ["lista", "[true,true]"],
    ["texto em vez de booleano", JSON.stringify({ letraMaior: "true", maisContraste: 1 })],
    ["texto enorme", JSON.stringify({ letraMaior: true, lixo: "x".repeat(300) })],
    ["null", "null"],
  ])("vale como desligado: %s", (_caso, bruto) => {
    expect(interpretarPreferenciaDeLeitura(bruto)).toEqual(LEITURA_PADRAO);
  });

  it("ignora campos a mais", () => {
    expect(interpretarPreferenciaDeLeitura(JSON.stringify({ letraMaior: true, outro: 5 }))).toEqual({ letraMaior: true, maisContraste: false });
  });
});

describe("script da primeira pintura (HIS-102)", () => {
  /** Roda o script com um localStorage e um <html> de mentira e devolve o dataset que ele marcou. */
  function rodar(guardado: string | null, getItemLanca = false): Record<string, string> {
    const dataset: Record<string, string> = {};
    const localStorage = {
      getItem: (chave: string) => {
        if (getItemLanca) throw new Error("bloqueado");
        return chave === CHAVE_DA_LEITURA ? guardado : null;
      },
    };
    runInNewContext(SCRIPT_DA_PRIMEIRA_PINTURA, { localStorage, document: { documentElement: { dataset } }, JSON });
    return dataset;
  }

  it("não tem caracteres que o React escaparia num <script> (&, <, >, aspas)", () => {
    expect(SCRIPT_DA_PRIMEIRA_PINTURA).not.toMatch(/[&<>"']/);
  });

  it("marca o <html> com a mesma regra do leitor", () => {
    expect(rodar(JSON.stringify({ letraMaior: true, maisContraste: true }))).toEqual({ letra: "maior", contraste: "mais" });
    expect(rodar(JSON.stringify({ letraMaior: true }))).toEqual({ letra: "maior" });
    expect(rodar(JSON.stringify({ letraMaior: "true", maisContraste: 1 }))).toEqual({});
  });

  it("ignora texto com mais de 200 caracteres, como o leitor", () => {
    const comLixo = (tamanho: number) => {
      const base = JSON.stringify({ letraMaior: true, x: "" });
      return base.replace('"x":""', `"x":"${"a".repeat(tamanho - base.length)}"`);
    };
    expect(comLixo(200)).toHaveLength(200);
    expect(rodar(comLixo(200))).toEqual({ letra: "maior" });
    expect(rodar(comLixo(201))).toEqual({});
    expect(interpretarPreferenciaDeLeitura(comLixo(201))).toEqual(LEITURA_PADRAO);
  });

  it("não quebra a página com nada guardado, JSON quebrado ou armazenamento bloqueado", () => {
    expect(rodar(null)).toEqual({});
    expect(rodar("{quebrado")).toEqual({});
    expect(rodar(null, true)).toEqual({});
  });
});
