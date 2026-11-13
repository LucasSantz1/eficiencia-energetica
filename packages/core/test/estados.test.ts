import { describe, expect, it } from "vitest";
import { ehUf, ESTADOS } from "../src";

describe("estados", () => {
  it("tem as 27 UFs com nome", () => {
    expect(Object.keys(ESTADOS)).toHaveLength(27);
    expect(ESTADOS.SP).toBe("São Paulo");
    expect(ESTADOS.DF).toBe("Distrito Federal");
  });

  it("ehUf só aceita UF de verdade", () => {
    expect(ehUf("SP")).toBe(true);
    expect(ehUf("TO")).toBe(true);
    for (const v of ["sp", "XX", "../x", "SP/../..", "", "__proto__", "toString", "constructor", 35, null, undefined, {}, ["SP"]]) {
      expect(ehUf(v)).toBe(false);
    }
  });
});
