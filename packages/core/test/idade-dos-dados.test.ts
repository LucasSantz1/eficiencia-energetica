import { describe, expect, it } from "vitest";
import { DIAS_PARA_MOSTRAR_A_IDADE, diasDesde, idadeDosPrecos } from "../src/idade-dos-dados";

const publicadoEm = "2026-11-10T17:07:55.315Z";

describe("idade dos preços (HIS-303)", () => {
  it("conta dias do calendário em Brasília, a qualquer hora (10/11 às 14h07 → 25/11 = 15)", () => {
    expect(diasDesde(publicadoEm, new Date("2026-11-25T09:00:00-03:00"))).toBe(15);
    expect(diasDesde(publicadoEm, new Date("2026-11-25T23:59:00-03:00"))).toBe(15);
    // Logo depois da meia-noite em Brasília já é o dia seguinte (em UTC ainda seria 03h30).
    expect(diasDesde(publicadoEm, new Date("2026-11-26T00:30:00-03:00"))).toBe(16);
  });

  it("recente: não mostra nada", () => {
    expect(idadeDosPrecos(publicadoEm, new Date("2026-11-12T12:00:00Z"))).toBeUndefined();
  });

  it(`a partir de ${DIAS_PARA_MOSTRAR_A_IDADE} dias: a data no fuso de Brasília e os dias`, () => {
    expect(idadeDosPrecos(publicadoEm, new Date("2026-11-25T12:00:00Z"))).toEqual({ dias: 15, data: "10/11/2026" });
  });

  it("data inválida ou no futuro (relógio do celular errado): nunca um número estranho", () => {
    expect(idadeDosPrecos("ontem", new Date())).toBeUndefined();
    expect(diasDesde(publicadoEm, new Date("2026-01-01T00:00:00Z"))).toBe(0);
  });
});
