import { describe, expect, it } from "vitest";
import { lerNumeroDigitado } from "../src";

const numero = (valor: number) => ({ tipo: "numero", valor });
const malEscrito = { tipo: "mal-escrito" };

describe("lerNumeroDigitado", () => {
  it.each([
    ["135,90", 2, 135.9],
    ["1.359,00", 2, 1_359],
    ["135.90", 2, 135.9],
    ["135.9", 2, 135.9],
    ["1.500", 0, 1_500],
    ["1.500", 2, 1_500],
    ["1.500.000", 0, 1_500_000],
    ["12340", 0, 12_340],
    ["0,5", 2, 0.5],
    ["  150  ", 0, 150],
    ["007", 0, 7],
  ] as const)("%s (casas %s) = %s", (texto, casas, valor) => {
    expect(lerNumeroDigitado(texto, casas)).toEqual(numero(valor));
  });

  it.each([
    ["1,2,5", 2],
    ["0x10", 0],
    ["1e309", 2],
    ["Infinity", 2],
    ["NaN", 2],
    ["-5", 0],
    ["+5", 0],
    ["135,905", 2],
    ["135,9", 0],
    ["135.90", 0],
    ["1.50.0", 0],
    ["1.5000", 0],
    ["12 345", 0],
    [",5", 2],
    ["5,", 2],
    ["1.2345,00", 2],
    ["1234567890123456", 0],
  ] as const)("%s (casas %s) é mal escrito", (texto, casas) => {
    expect(lerNumeroDigitado(texto, casas)).toEqual(malEscrito);
  });

  it("vazio ou só espaços", () => {
    expect(lerNumeroDigitado("", 2)).toEqual({ tipo: "vazio" });
    expect(lerNumeroDigitado("   ", 0)).toEqual({ tipo: "vazio" });
  });

  it("15 caracteres passam; 16 não, mesmo com espaços nas pontas", () => {
    expect(lerNumeroDigitado("123.456.789,12", 2)).toEqual(numero(123_456_789.12));
    expect(lerNumeroDigitado("  123456789012345  ", 0)).toEqual(numero(123_456_789_012_345));
    expect(lerNumeroDigitado("1234567890123456", 0)).toEqual(malEscrito);
  });

  it("texto colado gigante é recusado sem passar pela expressão regular", () => {
    expect(lerNumeroDigitado("9".repeat(100_000), 0)).toEqual(malEscrito);
  });
});
