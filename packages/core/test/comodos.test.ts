import { describe, expect, it } from "vitest";
import {
  agregarAparelhos,
  consumoMensalKwh,
  gerarDicas,
  horasPorDiaMedia,
  horasPorMes,
  periodosDeLeitura,
  precoKwh,
  resumirCasa,
  simularPlano,
  SUGESTOES_COMODO,
  itemDoCatalogo,
  type Aparelho,
  type Comodo,
} from "../src";

const base: Aparelho = { id: "a", comodoId: "sala", nome: "x", quantidade: 1, potenciaW: 0, minutosPorDia: 0, diasPorSemana: 7 };
const comodos: Comodo[] = [
  { id: "sala", nome: "Sala", tipo: "sala" },
  { id: "q1", nome: "Quarto 1", tipo: "quarto" },
  { id: "q2", nome: "Quarto 2", tipo: "quarto" },
];

describe("cômodos", () => {
  it("todas as sugestões existem no catálogo", () => {
    for (const lista of Object.values(SUGESTOES_COMODO)) for (const s of lista) expect(itemDoCatalogo(s.catalogoId), s.catalogoId).toBeDefined();
  });

  it("painel geral junta aparelhos iguais e mostra onde estão", () => {
    const aparelhos: Aparelho[] = [
      { ...base, id: "tv-sala", catalogoId: "tv-pequena", comodoId: "sala", potenciaW: 60, minutosPorDia: 300 },
      { ...base, id: "tv-q1", catalogoId: "tv-pequena", comodoId: "q1", potenciaW: 60, minutosPorDia: 120, quantidade: 2 },
      { ...base, id: "pc", catalogoId: "computador", comodoId: "q2", potenciaW: 200, minutosPorDia: 240, quantidade: 2 },
    ];
    const painel = agregarAparelhos(aparelhos, comodos);
    const tv = painel.find((p) => p.chave === "tv-pequena")!;
    expect(tv.quantidade).toBe(3);
    expect(tv.porComodo).toEqual([
      { comodoId: "sala", quantidade: 1 },
      { comodoId: "q1", quantidade: 2 },
    ]);
    expect(tv.kwhMes).toBeCloseTo(consumoMensalKwh(aparelhos[0]!) + consumoMensalKwh(aparelhos[1]!), 8);
    // 1 TV × 5 h × 30 + 2 TVs × 2 h × 30
    expect(tv.horasMes).toBeCloseTo(150 + 120, 8);
    expect(painel[0]?.chave).toBe("computador"); // o que mais gasta vem primeiro
  });

  it("calcula o tempo de uso estimado", () => {
    expect(horasPorMes({ minutosPorDia: 60, diasPorSemana: 7 })).toBe(30);
    expect(horasPorMes({ minutosPorDia: 60, diasPorSemana: 3.5 })).toBe(15);
    expect(horasPorMes({ minutosPorDia: 0, diasPorSemana: 7, kwhMesInformado: 25 })).toBe(720);
    expect(horasPorDiaMedia({ minutosPorDia: 120, diasPorSemana: 7 })).toBe(2);
  });
});

describe("leituras do relógio", () => {
  it("transforma leituras em consumo por dia", () => {
    const { periodos, ignoradas } = periodosDeLeitura([
      { id: "3", data: "2026-10-15", valorKwh: 12390 },
      { id: "1", data: "2026-10-01", valorKwh: 12340 },
      { id: "2", data: "2026-10-08", valorKwh: 12375 },
      { id: "x", data: "2026-10-16", valorKwh: 100 }, // digitado errado
    ]);
    expect(periodos).toHaveLength(2);
    expect(periodos[0]).toMatchObject({ dias: 7, kwh: 35, kwhPorDia: 5, projecaoMes: 150 });
    expect(periodos[1]).toMatchObject({ dias: 7, kwh: 15 });
    expect(ignoradas.map((l) => l.id)).toEqual(["x"]);
  });
});

describe("plano de economia", () => {
  const preco = precoKwh({}, { tarifaKwh: 1 }, undefined);
  const r = { beneficio: "nenhum", ligacao: "monofasica" } as const;
  const chuveiro: Aparelho = { ...base, id: "ch", catalogoId: "chuveiro", comodoId: "b", potenciaW: 5500, minutosPorDia: 32, banho: { banhosPorDia: 4, minutosPorBanho: 8 } };
  const ar: Aparelho = { ...base, id: "ar", catalogoId: "ar-condicionado", comodoId: "q1", potenciaW: 900, minutosPorDia: 480 };

  it("junta duas dicas no mesmo aparelho", () => {
    const depois = simularPlano([chuveiro], ["ch:banho-curto", "ch:chuveiro-verao"]);
    const d = depois[0]!;
    expect(d.minutosPorDia).toBe(24);
    expect(d.potenciaW).toBe(4400);
    const antes = resumirCasa([chuveiro], r, preco).conta.valor;
    const agora = resumirCasa(depois, r, preco).conta.valor;
    // 5,5 kW × 32 min → 4,4 kW × 24 min
    expect(antes - agora).toBeCloseTo(88 - 52.8, 6);
  });

  it("trocar ar por ventilador cria o gasto do ventilador", () => {
    const depois = simularPlano([ar], ["ar:ar-ventilador"]);
    expect(depois).toHaveLength(2);
    expect(depois.find((a) => a.catalogoId === "ventilador")?.minutosPorDia).toBe(120);
    const dica = gerarDicas({ aparelhos: [ar], residencia: r, preco }).find((d) => d.id === "ar:ar-ventilador")!;
    // ar: −2 h × 0,9 kW × 30 = 54 kWh; ventilador: +2 h × 0,1 kW × 30 = 6 kWh
    expect(dica.economiaKwh).toBeCloseTo(48, 6);
  });

  it("ignora ids que não existem", () => {
    expect(simularPlano([chuveiro], ["nada:banho-curto", "ch:nada"])).toEqual([chuveiro]);
  });
});
