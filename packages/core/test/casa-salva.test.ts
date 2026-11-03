import { describe, expect, it } from "vitest";
import casaV1 from "../../../apps/web/e2e/fixtures/casa-v1.json";
import casaV2 from "../../../apps/web/e2e/fixtures/casa-v2.json";
import {
  aparelhoInicial,
  aplicarVariantes,
  avisoDaCasaSalva,
  CAMPOS_DA_CASA_SALVA,
  CATALOGO,
  lerAparelho,
  lerCasaSalva,
  lerComodo,
  lerConta,
  lerIdDoPlano,
  lerLeitura,
  lerResidencia,
  type Aparelho,
  type CasaLida,
  type Comodo,
  type ContaMensal,
  type ContaReferencia,
  type LeituraRelogio,
  type Residencia,
} from "../src";

// Fixture `casa-completa` (R4c): todo campo, inclusive todo opcional, preenchido. `Required` faz o typecheck reprovar
// se o tipo ganhar campo e a fixture não.
const contaReferencia: Required<ContaReferencia> = { kwh: 150, valor: 135.9 };
const residencia: Required<Residencia> = {
  uf: "SP",
  municipioIbge: 3_541_406,
  municipioNome: "Presidente Prudente",
  distribuidoraId: "ess",
  beneficio: "tarifa-social",
  ligacao: "bifasica",
  contaReferencia,
  pessoas: 4,
};
const cozinha: Required<Comodo> = { id: "c1", tipo: "cozinha", nome: "Cozinha" };
const banheiro: Required<Comodo> = { id: "c2", tipo: "banheiro", nome: "Banheiro" };
const aparelhoCompleto: Required<Aparelho> = {
  id: "a1",
  comodoId: "c2",
  catalogoId: "chuveiro",
  nome: "Chuveiro elétrico",
  quantidade: 1,
  potenciaW: 5_500,
  minutosPorDia: 32,
  diasPorSemana: 7,
  banho: { banhosPorDia: 4, minutosPorBanho: 8 },
  fatorCiclo: 0.6,
  variantes: { potencia: "5500", aquecimento: "nao" },
  kwhMesInformado: 35,
};
const geladeira: Aparelho = { id: "a2", comodoId: "c1", catalogoId: "geladeira", nome: "Geladeira", quantidade: 1, potenciaW: 90, minutosPorDia: 1_440, diasPorSemana: 7, kwhMesInformado: 35 };
const conta: Required<ContaMensal> = { id: "k1", competencia: "2026-09", kwh: 182, valor: 151.37 };
const leituraUm: Required<LeituraRelogio> = { id: "l1", data: "2026-10-20", valorKwh: 12_000 };
const leituraDois: Required<LeituraRelogio> = { id: "l2", data: "2026-10-29", valorKwh: 12_052 };
const casaCompleta = {
  residencia,
  comodos: [cozinha, banheiro],
  aparelhos: [aparelhoCompleto, geladeira],
  contas: [conta],
  leituras: [leituraUm, leituraDois],
  plano: ["a1:banho-curto"],
};

/** Simula o que vem do localStorage: texto JSON lido de novo. */
const doArmazenamento = (valor: unknown): unknown => JSON.parse(JSON.stringify(valor));
const comAparelhos = (...aparelhos: unknown[]) => doArmazenamento({ ...casaCompleta, aparelhos });
const nenhumDescarte = { aparelhos: 0, comodos: 0, contas: 0, leituras: 0, plano: 0 };

function semAviso(lida: CasaLida) {
  expect(lida.descartados).toEqual(nenhumDescarte);
  expect(lida.residenciaDescartada).toBe(false);
  expect(lida.ilegivel).toBe(false);
  expect(avisoDaCasaSalva(lida)).toBeUndefined();
}

describe("casa válida fica igual (contra falso positivo)", () => {
  it("casa-completa: tudo igual, sem aviso", () => {
    const lida = lerCasaSalva(doArmazenamento(casaCompleta));
    semAviso(lida);
    expect(lida.casa).toEqual(casaCompleta);
  });

  it("cada leitor devolve todos os campos da sua lista (R4c)", () => {
    const chaves = (objeto: object | undefined) => Object.keys(objeto ?? {}).sort();
    expect(chaves(lerResidencia(residencia))).toEqual([...CAMPOS_DA_CASA_SALVA.residencia].sort());
    expect(chaves(lerResidencia(residencia)?.contaReferencia)).toEqual([...CAMPOS_DA_CASA_SALVA.contaReferencia].sort());
    expect(chaves(lerComodo(cozinha))).toEqual([...CAMPOS_DA_CASA_SALVA.comodo].sort());
    expect(chaves(lerAparelho(aparelhoCompleto))).toEqual([...CAMPOS_DA_CASA_SALVA.aparelho].sort());
    expect(chaves(lerAparelho(aparelhoCompleto)?.banho)).toEqual([...CAMPOS_DA_CASA_SALVA.banho].sort());
    expect(chaves(lerConta(conta))).toEqual([...CAMPOS_DA_CASA_SALVA.conta].sort());
    expect(chaves(lerLeitura(leituraUm))).toEqual([...CAMPOS_DA_CASA_SALVA.leitura].sort());
    expect(chaves(lerCasaSalva(casaCompleta).casa)).toEqual([...CAMPOS_DA_CASA_SALVA.casa].sort());
  });

  it("casa-v2 do e2e da 002a: igual e sem aviso", () => {
    const lida = lerCasaSalva(casaV2.state);
    semAviso(lida);
    expect(lida.casa).toEqual(casaV2.state);
  });

  it("casa-v1 (sem contas, leituras nem plano): listas vazias e sem aviso", () => {
    const lida = lerCasaSalva(casaV1.state);
    semAviso(lida);
    expect(lida.casa).toEqual({ ...casaV1.state, contas: [], leituras: [], plano: [] });
  });

  it("todo aparelho do catálogo, com todas as respostas possíveis, passa sem mudança", () => {
    for (const item of CATALOGO) {
      const combinacoes = (item.variantes ?? []).reduce<Record<string, string>[]>(
        (lista, variante) => lista.flatMap((parcial) => variante.opcoes.map((opcao) => ({ ...parcial, [variante.id]: opcao.id }))),
        [{}],
      );
      for (const escolhas of combinacoes) {
        // Como a tela monta: o item do catálogo com as respostas escolhidas.
        const montado = item.variantes ? { ...aparelhoInicial(item), ...aplicarVariantes(item, escolhas) } : aparelhoInicial(item);
        const aparelho = doArmazenamento({ ...montado, id: "x", comodoId: "c1" });
        expect(lerAparelho(aparelho), `${item.id} ${JSON.stringify(escolhas)}`).toEqual(aparelho);
      }
    }
  });

  it("valor na faixa de alerta não sai (potência 10.001 W, etiqueta 200 kWh, conta 3.000,01)", () => {
    const lida = lerCasaSalva(
      doArmazenamento({
        ...casaCompleta,
        aparelhos: [{ ...geladeira, potenciaW: 10_001, kwhMesInformado: 200 }],
        contas: [{ ...conta, kwh: 2_500, valor: 3_000.01 }],
      }),
    );
    semAviso(lida);
    expect(lida.casa.aparelhos[0]?.potenciaW).toBe(10_001);
  });

  it("medidas com fração salvas por telas antigas ficam (leitura 12.340,5; conta R$ 135,905)", () => {
    const lida = lerCasaSalva(doArmazenamento({ ...casaCompleta, contas: [{ ...conta, valor: 135.905 }], leituras: [{ ...leituraUm, valorKwh: 12_340.5 }] }));
    semAviso(lida);
  });

  it("data no futuro fica (relógio do celular errado)", () => {
    const lida = lerCasaSalva(doArmazenamento({ ...casaCompleta, contas: [{ ...conta, competencia: "2099-12" }], leituras: [{ ...leituraUm, data: "2099-01-31" }] }));
    semAviso(lida);
  });

  it("texto devolvido é o original, sem trim; só espaço sai", () => {
    expect(lerComodo({ ...cozinha, nome: "  Cozinha  " })?.nome).toBe("  Cozinha  ");
    expect(lerComodo({ ...cozinha, nome: "   " })).toBeUndefined();
  });

  it("aparelho criado em memória com opcionais `undefined` (aparelhoInicial) não ganha chave vazia", () => {
    const item = CATALOGO.find((i) => i.id === "lampada-led");
    if (!item) throw new Error("catálogo sem lâmpada");
    const lido = lerAparelho({ ...aparelhoInicial(item), id: "x", comodoId: "c1" });
    expect(lido && Object.keys(lido)).toEqual(["id", "comodoId", "catalogoId", "nome", "quantidade", "potenciaW", "minutosPorDia", "diasPorSemana"]);
  });
});

describe("os dois consertos do dominio-energia não contam como descarte", () => {
  it("caso 10: banho {4, 8} com 50 minutos por dia vira 32", () => {
    const lida = lerCasaSalva(comAparelhos({ ...aparelhoCompleto, minutosPorDia: 50 }));
    semAviso(lida);
    expect(lida.casa.aparelhos[0]?.minutosPorDia).toBe(32);
  });

  it("caso 12: etiqueta 0 ou negativa tira só o campo", () => {
    for (const kwhMesInformado of [0, -3]) {
      const lida = lerCasaSalva(comAparelhos({ ...geladeira, kwhMesInformado }));
      semAviso(lida);
      expect(lida.casa.aparelhos[0]).toEqual({ ...geladeira, kwhMesInformado: undefined });
      expect(lida.casa.aparelhos[0] && Object.hasOwn(lida.casa.aparelhos[0], "kwhMesInformado")).toBe(false);
    }
  });

  it("`pessoas` inválido sai sem aviso e a residência fica", () => {
    const lida = lerCasaSalva(doArmazenamento({ ...casaCompleta, residencia: { ...residencia, pessoas: 21 } }));
    semAviso(lida);
    expect(lida.casa.residencia).toEqual({ ...residencia, pessoas: undefined });
  });
});

describe("o que sai e como conta (R4 e R4b)", () => {
  it.each([
    ["potência -5", { potenciaW: -5 }],
    ["potência em texto", { potenciaW: "100" }],
    ["potência 75.001", { potenciaW: 75_001 }],
    ["potência 0", { potenciaW: 0 }],
    ["nome com 10.000 caracteres", { nome: "x".repeat(10_000) }],
    ["nome vazio", { nome: "" }],
    ["quantidade 2,5", { quantidade: 2.5 }],
    ["quantidade 61", { quantidade: 61 }],
    ["minutos 1.441", { minutosPorDia: 1_441, banho: undefined }],
    ["dias 7,01", { diasPorSemana: 7.01 }],
    ["fatorCiclo 0", { fatorCiclo: 0 }],
    ["etiqueta 300,1", { kwhMesInformado: 300.1 }],
    ["banho 21 × 8", { banho: { banhosPorDia: 21, minutosPorBanho: 8 } }],
    ["banho em texto", { banho: "4x8" }],
    ["variantes com chave em maiúscula", { variantes: { Tipo: "x" } }],
    ["variantes com 11 chaves", { variantes: Object.fromEntries(Array.from({ length: 11 }, (_, i) => [`v${i}`, "x"])) }],
    ["catalogoId nulo", { catalogoId: null }],
    ["id com 65 caracteres", { id: "x".repeat(65) }],
  ])("%s: tira só aquele aparelho", (_caso, mudanca) => {
    const lida = lerCasaSalva(comAparelhos({ ...aparelhoCompleto, ...mudanca }, geladeira));
    expect(lida.descartados).toEqual({ ...nenhumDescarte, aparelhos: 1 });
    expect(lida.casa.aparelhos).toEqual([geladeira]);
    expect(avisoDaCasaSalva(lida)).toEqual({ tipo: "parte", descartados: { ...nenhumDescarte, aparelhos: 1 } });
  });

  it("variantes com `__proto__` (do JSON) tiram o aparelho", () => {
    const bruto = JSON.parse(`{"id":"a","comodoId":"c1","nome":"x","quantidade":1,"potenciaW":10,"minutosPorDia":10,"diasPorSemana":7,"variantes":{"__proto__":{"x":"1"}}}`);
    expect(lerAparelho(bruto)).toBeUndefined();
  });

  it("`__proto__` e chave extra no aparelho: o resultado não tem a chave e o protótipo é o normal", () => {
    const bruto = JSON.parse(`{"id":"a","comodoId":"c1","nome":"x","quantidade":1,"potenciaW":10,"minutosPorDia":10,"diasPorSemana":7,"__proto__":{"potenciaW":9999,"poluido":true},"extra":"<script>"}`);
    const lido = lerAparelho(bruto);
    expect(lido).toEqual({ id: "a", comodoId: "c1", nome: "x", quantidade: 1, potenciaW: 10, minutosPorDia: 10, diasPorSemana: 7 });
    expect(lido && Object.getPrototypeOf(lido)).toBe(Object.prototype);
    expect(lido && "poluido" in lido).toBe(false);
    expect(lido && Object.hasOwn(lido, "extra")).toBe(false);
  });

  it("propriedade herdada não conta como campo", () => {
    const herdado: unknown = Object.assign(Object.create({ id: "c9", tipo: "sala" }), { nome: "Sala" });
    expect(lerComodo(herdado)).toBeUndefined();
  });

  it("id repetido: fica o primeiro", () => {
    const lida = lerCasaSalva(comAparelhos(geladeira, { ...geladeira, nome: "Outra" }));
    expect(lida.casa.aparelhos).toEqual([geladeira]);
    expect(lida.descartados.aparelhos).toBe(1);
  });

  it("aparelho com cômodo que não existe sai; aparelho do cômodo que saiu conta em `aparelhos`", () => {
    const lida = lerCasaSalva(doArmazenamento({ ...casaCompleta, comodos: [cozinha, { ...banheiro, tipo: "garagem" }] }));
    expect(lida.descartados).toEqual({ ...nenhumDescarte, comodos: 1, aparelhos: 1 });
    expect(lida.casa.aparelhos).toEqual([geladeira]);
  });

  it("conta com o mesmo mês e leitura com o mesmo dia contam como repetidas", () => {
    const lida = lerCasaSalva(
      doArmazenamento({ ...casaCompleta, contas: [conta, { ...conta, id: "k2" }], leituras: [leituraUm, { ...leituraUm, id: "l9", valorKwh: 1 }] }),
    );
    expect(lida.descartados).toEqual({ ...nenhumDescarte, contas: 1, leituras: 1 });
  });

  it("datas que não existem no calendário saem", () => {
    const lida = lerCasaSalva(
      doArmazenamento({
        ...casaCompleta,
        contas: [conta, { ...conta, id: "k2", competencia: "2026-13" }, { ...conta, id: "k3", competencia: "2026-1" }, { ...conta, id: "k4", competencia: "2026-00" }],
        leituras: [leituraUm, { ...leituraUm, id: "l3", data: "2026-02-30" }, { ...leituraUm, id: "l4", data: "2026-10-20T00:00" }, { ...leituraUm, id: "l5", data: "20/10/2026" }],
      }),
    );
    expect(lida.descartados).toEqual({ ...nenhumDescarte, contas: 3, leituras: 3 });
    expect(lerLeitura({ ...leituraUm, data: "2028-02-29" })).toBeDefined();
  });

  it("leitura 1.000.000 e conta acima de R$ 200.000 saem", () => {
    const lida = lerCasaSalva(doArmazenamento({ ...casaCompleta, contas: [{ ...conta, valor: 200_000.01 }], leituras: [{ ...leituraUm, valorKwh: 1_000_000 }] }));
    expect(lida.descartados).toEqual({ ...nenhumDescarte, contas: 1, leituras: 1 });
  });

  it("conta de referência inválida sai sozinha, a residência fica e conta em `contas`", () => {
    const lida = lerCasaSalva(doArmazenamento({ ...casaCompleta, residencia: { ...residencia, contaReferencia: { kwh: 0, valor: 10 } } }));
    expect(lida.casa.residencia).toEqual({ ...residencia, contaReferencia: undefined });
    expect(lida.descartados).toEqual({ ...nenhumDescarte, contas: 1 });
    expect(avisoDaCasaSalva(lida)).toEqual({ tipo: "parte", descartados: { ...nenhumDescarte, contas: 1 } });
  });

  it("lista que existe mas não é lista conta 1 descarte", () => {
    const lida = lerCasaSalva(doArmazenamento({ ...casaCompleta, contas: "nada", plano: { a: 1 } }));
    expect(lida.descartados).toEqual({ ...nenhumDescarte, contas: 1, plano: 1 });
    expect(lida.casa.contas).toEqual([]);
  });

  it("plano: id vazio, gigante ou repetido sai", () => {
    const lida = lerCasaSalva(doArmazenamento({ ...casaCompleta, plano: ["a1:banho-curto", "a1:banho-curto", "", "x".repeat(121), 5] }));
    expect(lida.casa.plano).toEqual(["a1:banho-curto"]);
    expect(lida.descartados.plano).toBe(4);
    expect(lerIdDoPlano("x".repeat(120))).toBeDefined();
  });

  it("10.000 aparelhos: ficam 500 e 9.500 contam como descartados, em menos de 100 ms", () => {
    const muitos = Array.from({ length: 10_000 }, (_, i) => ({ ...geladeira, id: `a${i}` }));
    const bruto = doArmazenamento({ ...casaCompleta, aparelhos: muitos });
    const inicio = Date.now();
    const lida = lerCasaSalva(bruto);
    const duracao = Date.now() - inicio;
    expect(lida.casa.aparelhos).toHaveLength(500);
    expect(lida.descartados.aparelhos).toBe(9_500);
    expect(duracao).toBeLessThan(100);
  });
});

describe("avisos T1a, T1b e T1c", () => {
  it.each([null, [], "texto", 42, true])("raiz %j: ilegível, nada aproveitável", (bruto) => {
    const lida = lerCasaSalva(bruto);
    expect(lida.ilegivel).toBe(true);
    expect(lida.casa).toEqual({ comodos: [], aparelhos: [], contas: [], leituras: [], plano: [] });
    expect(avisoDaCasaSalva(lida)).toEqual({ tipo: "nada-aproveitavel" });
  });

  it("nada salvo (`undefined`): casa vazia, sem aviso", () => {
    semAviso(lerCasaSalva(undefined));
  });

  it("objeto vazio: casa vazia, sem aviso (não saiu nada)", () => {
    semAviso(lerCasaSalva({}));
  });

  it("T1a: saiu uma parte, com a contagem por tipo", () => {
    const lida = lerCasaSalva(doArmazenamento({ ...casaCompleta, aparelhos: [{ ...aparelhoCompleto, potenciaW: -5 }, geladeira], leituras: [{ ...leituraUm, valorKwh: -1 }] }));
    expect(avisoDaCasaSalva(lida)).toEqual({ tipo: "parte", descartados: { ...nenhumDescarte, aparelhos: 1, leituras: 1 } });
  });

  it.each([
    ["uf `../x`", { uf: "../x" }],
    ["uf minúscula", { uf: "sp" }],
    ["IBGE com 6 dígitos", { municipioIbge: 354_140 }],
    ["distribuidora vazia", { distribuidoraId: "" }],
    ["benefício desconhecido", { beneficio: "bolsa" }],
  ])("T1b: %s tira só a cidade; cômodos e aparelhos ficam", (_caso, mudanca) => {
    const lida = lerCasaSalva(doArmazenamento({ ...casaCompleta, residencia: { ...residencia, ...mudanca } }));
    expect(lida.residenciaDescartada).toBe(true);
    expect(lida.casa.residencia).toBeUndefined();
    expect(lida.casa.aparelhos).toHaveLength(2);
    expect(avisoDaCasaSalva(lida)).toEqual({ tipo: "sem-residencia" });
  });

  it("T1c: houve descarte e não sobrou cidade, cômodo nem aparelho", () => {
    const lida = lerCasaSalva({ residencia: { uf: "XX" }, comodos: [{ id: 1 }], aparelhos: [{}], contas: [conta] });
    expect(avisoDaCasaSalva(lida)).toEqual({ tipo: "nada-aproveitavel" });
  });

  it("o retorno só tem números e verdadeiro/falso: nenhum nome, valor ou id do que saiu", () => {
    const lida = lerCasaSalva(comAparelhos({ ...aparelhoCompleto, nome: "x".repeat(61) }));
    const aviso = avisoDaCasaSalva(lida);
    expect(JSON.stringify(aviso)).toBe(JSON.stringify({ tipo: "parte", descartados: { aparelhos: 1, comodos: 0, contas: 0, leituras: 0, plano: 0 } }));
    expect(JSON.stringify(lida.descartados)).not.toMatch(/a1|Chuveiro/);
  });
});

describe("o leitor nunca lança (R4d)", () => {
  /** Gerador com semente fixa (mulberry32), sem biblioteca: o mesmo teste toda vez. */
  function gerador(semente: number) {
    let estado = semente;
    return () => {
      estado = (estado + 0x6d2b79f5) | 0;
      let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
    };
  }
  const aleatorio = gerador(20_261_030);
  const escolher = <T,>(lista: readonly T[]): T => lista[Math.floor(aleatorio() * lista.length)] as T;

  const CHAVES = [...new Set(Object.values(CAMPOS_DA_CASA_SALVA).flat()), "__proto__", "constructor", "toString", "extra"];
  const NUMEROS = [0, -1, 1, 2.5, 7, 7 / 30, 32, 1_440, 75_000, 75_001, 1e308, -1e308, 3_541_406, 0.1, 999_999];
  const TEXTOS = ["", " ", "SP", "../x", "2026-10", "2026-02-30", "2026-10-20", "cozinha", "tarifa-social", "nao-sei", "x".repeat(200), "__proto__"];

  function valorJson(profundidade: number): unknown {
    const tipo = Math.floor(aleatorio() * (profundidade > 3 ? 4 : 6));
    if (tipo === 0) return null;
    if (tipo === 1) return aleatorio() < 0.5;
    if (tipo === 2) return escolher(NUMEROS);
    if (tipo === 3) return escolher(TEXTOS);
    if (tipo === 4) return Array.from({ length: Math.floor(aleatorio() * 4) }, () => valorJson(profundidade + 1));
    const objeto: Record<string, unknown> = {};
    for (let i = Math.floor(aleatorio() * 8); i > 0; i--) objeto[escolher(CHAVES)] = valorJson(profundidade + 1);
    return objeto;
  }

  it("1.000 valores JSON gerados: nenhum lança, e ler de novo o resultado não muda nada", () => {
    for (let i = 0; i < 1_000; i++) {
      const bruto = doArmazenamento(valorJson(0));
      const lida = lerCasaSalva(bruto);
      expect(() => avisoDaCasaSalva(lida)).not.toThrow();
      // Idempotente: o que o leitor devolve já é limpo.
      const deNovo = lerCasaSalva(doArmazenamento(lida.casa));
      expect(deNovo.casa).toEqual(lida.casa);
      expect(avisoDaCasaSalva(deNovo)).toBeUndefined();
    }
  });

  it("casas parecidas com a de verdade, com campos trocados ao acaso: nenhuma lança", () => {
    for (let i = 0; i < 1_000; i++) {
      const bagunca = (item: Record<string, unknown>) => ({ ...item, [escolher(CHAVES)]: valorJson(2) });
      const bruto = doArmazenamento({
        residencia: bagunca({ ...residencia }),
        comodos: [bagunca({ ...cozinha }), bagunca({ ...banheiro })],
        aparelhos: [bagunca({ ...aparelhoCompleto }), bagunca({ ...geladeira })],
        contas: [bagunca({ ...conta })],
        leituras: [bagunca({ ...leituraUm })],
        plano: [valorJson(2)],
      });
      const lida = lerCasaSalva(bruto);
      expect(avisoDaCasaSalva(deNovoLimpo(lida))).toBeUndefined();
    }
  });

  function deNovoLimpo(lida: CasaLida): CasaLida {
    return lerCasaSalva(doArmazenamento(lida.casa));
  }
});
