import { describe, expect, it } from "vitest";
import { formatarKwh, formatarReais, frasesDasDicas, frasesDoResumo, kwhParaFalar, paraFalar, reaisParaFalar } from "../src";

describe("reaisParaFalar", () => {
  it("lê reais e centavos por extenso nas palavras, com singular", () => {
    expect(reaisParaFalar(12.3)).toBe("12 reais e 30 centavos");
    expect(reaisParaFalar(1)).toBe("1 real");
    expect(reaisParaFalar(1.01)).toBe("1 real e 1 centavo");
    expect(reaisParaFalar(0.5)).toBe("50 centavos");
    expect(reaisParaFalar(0)).toBe("0 reais");
    expect(reaisParaFalar(1234.56)).toBe("1234 reais e 56 centavos");
    expect(reaisParaFalar(Number.NaN)).toBe("0 reais");
  });
  it("arredonda para o centavo (sem 99,999 virar 99 reais e 100 centavos)", () => {
    expect(reaisParaFalar(99.999)).toBe("100 reais");
  });
});

describe("kwhParaFalar", () => {
  it("troca kWh por quilowatts-hora", () => {
    expect(kwhParaFalar(150.4)).toBe("150 quilowatts-hora");
    expect(kwhParaFalar(1.8)).toBe("1,8 quilowatts-hora");
    expect(kwhParaFalar(1)).toBe("1 quilowatt-hora");
  });
});

describe("paraFalar", () => {
  it("troca o dinheiro e o kWh como o site escreve", () => {
    expect(paraFalar(`Gasta ${formatarReais(1234.5)} e ${formatarKwh(54)} por mês.`)).toBe("Gasta 1234 reais e 50 centavos e 54 quilowatts-hora por mês.");
    expect(paraFalar("R$ 5 por mês")).toBe("5 reais por mês");
    expect(paraFalar("de R$ 0,80")).toBe("de 80 centavos");
  });
  it("deixa o resto do texto como está", () => {
    expect(paraFalar("Desligue a TV  da tomada")).toBe("Desligue a TV da tomada");
  });
});

describe("frasesDoResumo", () => {
  it("lê a conta, avisa que é estimativa, quem mais pesa, o plano e uma dica", () => {
    const frases = frasesDoResumo({
      contaPorMes: 182.4,
      consumoKwh: 210,
      maior: { nome: "Chuveiro elétrico", valorMes: 60 },
      contaComPlano: 150,
      dica: { titulo: "Banho de 5 minutos.", economiaMes: 12.5 },
    });
    expect(frases).toEqual([
      "A sua conta de luz estimada é de 182 reais e 40 centavos por mês, para 210 quilowatts-hora.",
      "É uma estimativa: a conta de verdade pode mudar com impostos e dias de leitura.",
      "Quem mais pesa é Chuveiro elétrico: 60 reais por mês.",
      "Com o seu plano de economia, a conta cai para 150 reais.",
      "Uma dica: Banho de 5 minutos, e economiza cerca de 12 reais e 50 centavos por mês.",
    ]);
  });
  it("sem aparelho de destaque, plano nem dica: só a conta e o aviso", () => {
    expect(frasesDoResumo({ contaPorMes: 50, consumoKwh: 60 })).toHaveLength(2);
  });
});

describe("frasesDasDicas", () => {
  it("numera as dicas e diz a economia só quando ela conta", () => {
    const frases = frasesDasDicas([
      { titulo: "Tire da tomada", texto: "A TV gasta R$ 3,00 parada.", economiaMes: 3 },
      { titulo: "Abra a janela", texto: "Use a luz do dia.", economiaMes: 0.1 },
    ]);
    expect(frases).toEqual([
      "2 dicas para a sua casa.",
      "Dica 1: Tire da tomada.",
      "A TV gasta 3 reais parada.",
      "Economia de cerca de 3 reais por mês.",
      "Dica 2: Abra a janela.",
      "Use a luz do dia.",
    ]);
  });
  it("respeita o limite e fala quando não há dica", () => {
    const muitas = Array.from({ length: 9 }, (_, i) => ({ titulo: `Dica ${i}`, texto: "x" }));
    expect(frasesDasDicas(muitas, 3)[0]).toBe("3 dicas para a sua casa.");
    expect(frasesDasDicas([])).toEqual(["Ainda não há dicas para a sua casa."]);
  });
});
