/*
 * Casos C1–C14 do dominio-energia (HIS-104, R7), com a conta feita à mão na história. Preço fixo de R$ 0,80/kWh nos
 * exemplos: é só número de teste, não é tarifa real.
 */
import { describe, expect, it } from "vitest";
import { estimarConta, gerarDicas, type Aparelho, type PrecoKwh, type Residencia } from "../src";
import { avaliarMeta, type SituacaoDaMeta } from "../src/meta";

const daConta: PrecoKwh = { valor: 0.8, origem: "conta", adicionalBandeira: 0, incluiImpostos: true };
const daAneel: PrecoKwh = { valor: 0.8, origem: "aneel", adicionalBandeira: 0.1, incluiImpostos: false };

type Res = Pick<Residencia, "beneficio" | "ligacao" | "contaReferencia">;
const mono = (contaReferencia?: Res["contaReferencia"]): Res => ({ beneficio: "nenhum", ligacao: "monofasica", ...(contaReferencia ? { contaReferencia } : {}) });

const base = { comodoId: "c1", quantidade: 1, diasPorSemana: 7 } as const;
/** Aparelho com consumo exato em kWh/mês (pelo `kwhMesInformado`), sem dicas que mexam nele. */
const outros = (kwh: number, id = "outros"): Aparelho => ({ ...base, id, nome: "Outros", potenciaW: 100, minutosPorDia: 60, kwhMesInformado: kwh });
const chuveiro: Aparelho = { ...base, id: "ch", catalogoId: "chuveiro", nome: "Chuveiro", potenciaW: 4400, minutosPorDia: 20, banho: { banhosPorDia: 2, minutosPorBanho: 10 } };
const geladeira: Aparelho = { ...base, id: "ge", catalogoId: "geladeira", nome: "Geladeira", potenciaW: 150, minutosPorDia: 1440, kwhMesInformado: 50 };

function avaliar(metaReais: number, aparelhos: Aparelho[], residencia: Res, preco: PrecoKwh = daConta): SituacaoDaMeta {
  const dicas = gerarDicas({ aparelhos, residencia, preco });
  return avaliarMeta({ metaReais, aparelhos, residencia, preco, dicas });
}

describe("avaliarMeta (casos do domínio)", () => {
  it("C1: falta R$ 40,00 com conta de R$ 160,00 e piso de R$ 24,00", () => {
    const r = avaliar(120, [outros(200)], mono({ kwh: 200, valor: 160 }));
    expect(r).toMatchObject({ tipo: "falta", contaCentavos: 16_000, faltaCentavos: 4_000, pisoCentavos: 2_400 });
  });

  it("C2: com CIP de R$ 12,00, o piso vira R$ 36,00 e a meta de R$ 30,00 fica abaixo dele", () => {
    const residencia = mono({ kwh: 200, valor: 172, iluminacaoPublica: 12 });
    expect(avaliar(30, [outros(200)], residencia)).toEqual({ tipo: "abaixo-do-piso", pisoCentavos: 3_600, confianca: { tipo: "completa" } });
    // Meta igual ao piso não é "abaixo"; a conta de R$ 172,00 (160 + 12) continua acima.
    expect(avaliar(36, [outros(200)], residencia)).toMatchObject({ tipo: "falta", contaCentavos: 17_200, pisoCentavos: 3_600 });
  });

  it("C3: já dentro, com folga, inclusive meta igual à conta", () => {
    const residencia = mono({ kwh: 200, valor: 160 });
    expect(avaliar(170, [outros(200)], residencia)).toEqual({ tipo: "dentro", contaCentavos: 16_000, folgaCentavos: 1_000, confianca: { tipo: "completa" } });
    expect(avaliar(160, [outros(200)], residencia)).toMatchObject({ tipo: "dentro", folgaCentavos: 0 });
  });

  it("C4: duas dicas no mesmo chuveiro economizam R$ 12,67 juntas, nunca a soma simples de R$ 14,08", () => {
    const aparelhos = [chuveiro, outros(156)];
    const residencia = mono({ kwh: 200, valor: 160 });
    const naoChega = avaliar(147, aparelhos, residencia);
    expect(naoChega).toMatchObject({ tipo: "falta", totalCentavos: 1_267, contaDepoisCentavos: 14_733, chegaLa: false });
    const chega = avaliar(148, aparelhos, residencia);
    expect(chega).toMatchObject({ tipo: "falta", totalCentavos: 1_267, contaDepoisCentavos: 14_733, chegaLa: true });
    if (chega.tipo !== "falta") throw new Error("esperava falta");
    expect(chega.passos.map((p) => p.ganhoCentavos)).toEqual([704, 563]);
    expect(chega.passos.reduce((s, p) => s + p.ganhoCentavos, 0)).toBe(chega.totalCentavos);
  });

  it("C5: na Tarifa Social, hábitos primeiro e a economia nunca passa da conta inteira", () => {
    const residencia: Res = { beneficio: "tarifa-social", ligacao: "monofasica" };
    const aparelhos = [chuveiro, geladeira, outros(6)];
    const r = avaliar(4, aparelhos, residencia, daAneel);
    expect(r).toMatchObject({ tipo: "falta", contaCentavos: 1_600, pisoCentavos: 0, totalCentavos: 1_267, contaDepoisCentavos: 333 });
    if (r.tipo !== "falta") throw new Error("esperava falta");
    expect(r.passos.map((p) => p.dicaId)).toEqual(["ch:banho-curto", "ch:chuveiro-verao"]);
    expect(r.passos.map((p) => p.ganhoCentavos)).toEqual([704, 563]);
    // Sem conta de luz a estimativa é parcial: a tela diz "ajudam", nunca "chegam lá".
    expect(r.chegaLa).toBe(false);
    expect(r.confianca).toEqual({ tipo: "parcial", motivo: "sem-conta" });
    expect(r.totalCentavos).toBeLessThanOrEqual(r.contaCentavos - r.pisoCentavos);
  });

  it("C6: bifásica pelo mínimo: meta abaixo do piso e meta com folga", () => {
    const residencia: Res = { beneficio: "nenhum", ligacao: "bifasica", contaReferencia: { kwh: 50, valor: 40 } };
    expect(avaliar(35, [outros(40)], residencia)).toMatchObject({ tipo: "abaixo-do-piso", pisoCentavos: 4_000 });
    expect(avaliar(45, [outros(40)], residencia)).toMatchObject({ tipo: "dentro", folgaCentavos: 500 });
  });

  it("C7: trifásica tem piso de 100 kWh", () => {
    const residencia: Res = { beneficio: "nenhum", ligacao: "trifasica", contaReferencia: { kwh: 100, valor: 80 } };
    expect(avaliar(70, [outros(60)], residencia)).toMatchObject({ tipo: "abaixo-do-piso", pisoCentavos: 8_000 });
  });
  it.todo("C7 com Tarifa Social: depende de o mínimo da trifásica valer sobre a isenção (pergunta aberta do domínio)");

  it("C8: ligação 'não sei' conta como monofásica (piso de 30 kWh)", () => {
    const residencia: Res = { beneficio: "nenhum", ligacao: "nao-sei", contaReferencia: { kwh: 200, valor: 160 } };
    expect(avaliar(10, [outros(200)], residencia)).toMatchObject({ tipo: "abaixo-do-piso", pisoCentavos: 2_400 });
  });

  it("C9: dica que o mínimo zera não entra na lista", () => {
    const residencia: Res = { beneficio: "nenhum", ligacao: "bifasica", contaReferencia: { kwh: 50, valor: 40 } };
    const r = avaliar(40, [{ ...chuveiro, minutosPorDia: 2, banho: { banhosPorDia: 1, minutosPorBanho: 2 } }, outros(34)], residencia);
    // Consumo abaixo do mínimo: a conta já é o piso; qualquer dica dá R$ 0,00.
    expect(r).toMatchObject({ tipo: "dentro", folgaCentavos: 0 });
  });

  it("C10: sem conta de luz a estimativa é parcial e nunca diz que chega lá", () => {
    const r = avaliar(120, [outros(200)], mono(), daAneel);
    expect(r).toMatchObject({ tipo: "falta", faltaCentavos: 4_000, chegaLa: false, confianca: { tipo: "parcial", motivo: "sem-conta" } });
  });

  it("C11: aparelhos que explicam menos de 80% da conta deixam a estimativa parcial", () => {
    expect(avaliar(120, [outros(200)], mono({ kwh: 260, valor: 208 }))).toMatchObject({
      confianca: { tipo: "parcial", motivo: "divergencia", contaInformadaCentavos: 20_800 },
    });
    expect(avaliar(120, [outros(230)], mono({ kwh: 260, valor: 208 }))).toMatchObject({ confianca: { tipo: "completa" } });
  });

  it("C12: sem aparelhos ou sem preço não há número", () => {
    expect(avaliar(120, [], mono({ kwh: 200, valor: 160 }))).toEqual({ tipo: "sem-dados" });
    const semPreco: PrecoKwh = { valor: 0, origem: "indisponivel", adicionalBandeira: 0, incluiImpostos: false };
    expect(avaliar(120, [outros(200)], mono(), semPreco)).toEqual({ tipo: "sem-dados" });
  });

  it("C14: bandeira mais cara aumenta o que falta; a meta não muda", () => {
    const maisCaro: PrecoKwh = { ...daConta, valor: 0.9 };
    expect(avaliar(120, [outros(200)], mono({ kwh: 200, valor: 180 }), maisCaro)).toMatchObject({ contaCentavos: 18_000, faltaCentavos: 6_000 });
  });
});

describe("iluminação pública (HIS-104, M1)", () => {
  it("sem CIP a conta fica igual à de antes; com CIP o preço sai sem ela e a conta a soma de volta", () => {
    const semCip = estimarConta(200, mono({ kwh: 200, valor: 160 }), daConta);
    expect(semCip.valor).toBeCloseTo(160, 10);
    expect(semCip.valorIluminacaoPublica).toBe(0);
    const comCip = estimarConta(200, mono({ kwh: 200, valor: 172, iluminacaoPublica: 12 }), daConta);
    expect(comCip.valor).toBeCloseTo(172, 10);
    expect(comCip.valorIluminacaoPublica).toBe(12);
  });
});

describe("precoKwh com CIP", () => {
  it("tira a CIP antes de dividir; sem CIP, a regra de antes", async () => {
    const { precoKwh } = await import("../src");
    expect(precoKwh({ contaReferencia: { kwh: 200, valor: 172, iluminacaoPublica: 12 }, beneficio: "nenhum" }, undefined, undefined).valor).toBeCloseTo(0.8, 10);
    expect(precoKwh({ contaReferencia: { kwh: 200, valor: 172 }, beneficio: "nenhum" }, undefined, undefined).valor).toBeCloseTo(0.86, 10);
  });
});
