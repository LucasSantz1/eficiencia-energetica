import { describe, expect, it } from "vitest";
import { formatarKwh, formatarReais, resumirCasa, type Aparelho, type PrecoKwh } from "@ee/core";
import { nomeParaCompartilhar, textoDoResumo } from "@/aplicacao/textoDoResumo";

// Preço redondo de teste (R$ 1,00 por kWh), para os valores do texto serem fáceis de conferir.
const PRECO: PrecoKwh = { valor: 1, origem: "conta", adicionalBandeira: 0, incluiImpostos: true };
const RESIDENCIA = { beneficio: "nenhum", ligacao: "bifasica" } as const;
const SITE = "https://site.exemplo";

function aparelho(id: string, kwhMes: number, extra: Partial<Aparelho> = {}): Aparelho {
  return { id, comodoId: "c1", nome: id, quantidade: 1, potenciaW: 100, minutosPorDia: 60, diasPorSemana: 7, kwhMesInformado: kwhMes, ...extra };
}

const CASA: Aparelho[] = [
  aparelho("a1", 40, { catalogoId: "geladeira", nome: "Geladeira da Dona Maria" }),
  aparelho("a2", 90, { catalogoId: "chuveiro" }),
  aparelho("a3", 5, { catalogoId: "tv", quantidade: 2 }),
  aparelho("a4", 20, { nome: "Máquina do João" }),
];

describe("textoDoResumo (HIS-105)", () => {
  const resumo = resumirCasa(CASA, RESIDENCIA, PRECO);

  it("conta em R$ e depois kWh, os 3 que mais gastam e a próxima dica, com formatarReais e formatarKwh", () => {
    const texto = textoDoResumo({ resumo, proximaDica: { titulo: "Banhos 2 minutos mais curtos", economiaMes: 12.3 }, enderecoDoSite: SITE });
    const [primeiro, segundo, terceiro] = resumo.aparelhos;
    expect(texto).toBe(
      [
        `Nossa conta de luz estimada: ${formatarReais(resumo.conta.valor)} por mês (${formatarKwh(resumo.conta.consumoKwh)}).`,
        "",
        "Os aparelhos que mais gastam:",
        `1. Chuveiro elétrico: ${formatarReais(primeiro?.valorMes ?? 0)} por mês`,
        `2. Geladeira: ${formatarReais(segundo?.valorMes ?? 0)} por mês`,
        `3. Outro aparelho: ${formatarReais(terceiro?.valorMes ?? 0)} por mês`,
        "",
        `Próxima dica: Banhos 2 minutos mais curtos. Economiza ${formatarReais(12.3)} por mês.`,
        "",
        "É uma estimativa, feita com o tempo de uso de cada aparelho.",
        `Faça a conta da sua casa, de graça: ${SITE}`,
      ].join("\n"),
    );
    expect(texto).toContain("R$ 160,00 por mês (160 kWh)");
  });

  it("nunca leva o nome que a pessoa digitou, a cidade nem o cômodo", () => {
    const texto = textoDoResumo({ resumo, enderecoDoSite: SITE });
    expect(texto).not.toMatch(/Maria|João|c1/);
  });

  it("sem dica, não tem a linha da dica; com 1 aparelho, o título fica no singular", () => {
    const umSo = resumirCasa([aparelho("a2", 90, { catalogoId: "chuveiro" })], RESIDENCIA, PRECO);
    const texto = textoDoResumo({ resumo: umSo, enderecoDoSite: SITE });
    expect(texto).toContain("O aparelho que mais gasta:\n1. Chuveiro elétrico:");
    expect(texto).not.toContain("Próxima dica");
  });

  it("nome para compartilhar: catálogo, quantidade e \"Outro aparelho\"", () => {
    expect(nomeParaCompartilhar({ catalogoId: "tv", quantidade: 2 })).toMatch(/^2 × /);
    expect(nomeParaCompartilhar({ catalogoId: "id-que-nao-existe", quantidade: 1 })).toBe("Outro aparelho");
    expect(nomeParaCompartilhar({ catalogoId: undefined, quantidade: 1 })).toBe("Outro aparelho");
  });
});
