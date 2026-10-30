import { describe, expect, it } from "vitest";
import { acharDistribuidora, distribuidorasDaCidade, precoKwh, trocaDeDistribuidora, type ArquivoParaBusca, type Distribuidora } from "../src";

const distribuidora = (id: string, sigla: string, tarifaKwh: number): Distribuidora => ({
  id,
  sigla,
  ufs: [],
  teKwh: tarifaKwh * 0.4,
  tusdKwh: tarifaKwh * 0.6,
  tarifaKwh,
  inicioVigencia: "2026-06-19",
});
// Valores do tarifas.json de 29/10/2026 (HIS-111, tabela de evidência).
const RGE = distribuidora("rge", "RGE", 0.94461);
const ESS = distribuidora("ess", "ESS", 0.81424);
const EPB = distribuidora("epb", "EPB", 0.7097);
const arquivo = (substituidas?: unknown): ArquivoParaBusca => ({ distribuidoras: [RGE, ESS, EPB], substituidas });
const COM_TROCAS = arquivo({ "rge-sul": "rge", ebo: "epb", edevp: "ess" });

describe("acharDistribuidora (HIS-111, D7)", () => {
  it("acha pelo id publicado e pelo id substituído", () => {
    expect(acharDistribuidora(COM_TROCAS, "rge")).toBe(RGE);
    expect(acharDistribuidora(COM_TROCAS, "rge-sul")).toBe(RGE);
    expect(acharDistribuidora(COM_TROCAS, "edevp")).toBe(ESS);
    expect(acharDistribuidora(COM_TROCAS, "nao-existe")).toBeUndefined();
  });

  it("critério 8: casa salva com rge-sul e sem conta de luz recebe o preço da RGE desde a primeira tela", () => {
    const preco = precoKwh({ beneficio: "nenhum" }, acharDistribuidora(COM_TROCAS, "rge-sul"), { adicionalKwh: 0.01885 });
    expect(preco.origem).toBe("aneel");
    expect(preco.valor).toBeCloseTo(0.94461 + 0.01885, 6);
  });

  it('"constructor", "__proto__" e outros nomes do protótipo não acham nada', () => {
    for (const id of ["constructor", "__proto__", "toString", "hasOwnProperty", "valueOf"]) {
      expect(acharDistribuidora(COM_TROCAS, id)).toBeUndefined();
      expect(acharDistribuidora(arquivo({}), id)).toBeUndefined();
    }
  });

  it('"__proto__" vindo do JSON não muda o protótipo nem acha nada', () => {
    const substituidas: unknown = JSON.parse('{"__proto__": "rge", "rge-sul": "rge"}');
    expect(acharDistribuidora(arquivo(substituidas), "__proto__")).toBeUndefined();
    expect(acharDistribuidora(arquivo(substituidas), "rge-sul")).toBe(RGE);
    expect(typeof substituidas === "object" && substituidas !== null && Object.getPrototypeOf(substituidas)).toBe(Object.prototype);
  });

  it("R5: substituidas ausente ou fora do formato é ignorado, sem lançar", () => {
    for (const ruim of [undefined, null, [], 1, "rge", true, { "rge-sul": 2 }, { "rge-sul": null }, new Map([["rge-sul", "rge"]])]) {
      const a = arquivo(ruim);
      expect(() => acharDistribuidora(a, "rge-sul")).not.toThrow();
      expect(acharDistribuidora(a, "rge-sul")).toBeUndefined();
      expect(acharDistribuidora(a, "rge")).toBe(RGE);
    }
  });

  it("um salto só: valor que não está publicado não acha nada", () => {
    expect(acharDistribuidora(arquivo({ a: "b", b: "rge" }), "a")).toBeUndefined();
    expect(acharDistribuidora(arquivo({ a: "sumiu" }), "a")).toBeUndefined();
  });

  it("aceita objeto sem protótipo", () => {
    const semPrototipo: Record<string, string> = Object.create(null);
    semPrototipo["rge-sul"] = "rge";
    expect(acharDistribuidora(arquivo(semPrototipo), "rge-sul")).toBe(RGE);
  });
});

describe("distribuidorasDaCidade", () => {
  it("troca, tira o repetido e mantém a ordem da rotina (Campina Grande)", () => {
    expect(distribuidorasDaCidade(COM_TROCAS, ["epb", "ebo"])).toEqual([EPB]);
    expect(distribuidorasDaCidade(COM_TROCAS, ["ebo", "epb"])).toEqual([EPB]);
    expect(distribuidorasDaCidade(COM_TROCAS, ["nao-existe", "rge-sul", "ess"])).toEqual([RGE, ESS]);
  });

  it("funciona com o arquivo antigo, sem substituidas", () => {
    expect(distribuidorasDaCidade(arquivo(), ["rge-sul", "rge"])).toEqual([RGE]);
    expect(distribuidorasDaCidade(arquivo(null), ["constructor", "__proto__"])).toEqual([]);
  });
});

describe("trocaDeDistribuidora (R6: a regravação não entra em laço)", () => {
  it("pede a troca só quando o antigo não está publicado e o novo está", () => {
    expect(trocaDeDistribuidora(COM_TROCAS, "rge-sul")).toEqual({ de: "rge-sul", para: "rge" });
    expect(trocaDeDistribuidora(COM_TROCAS, "rge")).toBeUndefined();
    expect(trocaDeDistribuidora(COM_TROCAS, "nao-existe")).toBeUndefined();
  });

  it("a → a e a → b + b → a nunca pedem troca", () => {
    expect(trocaDeDistribuidora(arquivo({ rge: "rge" }), "rge")).toBeUndefined();
    expect(trocaDeDistribuidora(arquivo({ x: "x" }), "x")).toBeUndefined();
    const ciclo = arquivo({ x: "y", y: "x" });
    expect(trocaDeDistribuidora(ciclo, "x")).toBeUndefined();
    expect(trocaDeDistribuidora(ciclo, "y")).toBeUndefined();
  });
});
