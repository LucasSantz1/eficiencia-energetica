import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { Distribuidora } from "@ee/core";
import { arquivosNaPasta, lerFontes, type Fontes } from "../src/fontes";
import { conferirCoerencia, conferirSubstituidas, MAXIMO_DE_SUBSTITUIDAS, type Montagem } from "../src/montar";
import { montarComAsFontes } from "../src/rotina";
import { carregarSucessoes, type Sucessao } from "../src/sucessoes";

const pasta = (nome: string) => fileURLToPath(new URL(`../fixtures/sucessao/${nome}`, import.meta.url));
const HOJE = "2026-10-30";

let preparado: { fontes: Fontes; sucessoes: Sucessao[]; montagem: Montagem } | undefined;
async function preparar() {
  if (!preparado) {
    const fontes = await lerFontes({ arquivos: arquivosNaPasta(pasta("")), hoje: HOJE, baixar: false, usarApiIbge: false, registrar: () => {} });
    const sucessoes = await carregarSucessoes(pasta("sucessoes.json"));
    preparado = { fontes, sucessoes, montagem: montarComAsFontes(fontes, { hoje: HOJE, geradoEm: `${HOJE}T12:00:00.000Z`, sucessoes }) };
  }
  return preparado;
}
async function conferir(mudar: (m: Montagem) => Montagem = (m) => m, sucessoes?: Sucessao[]) {
  const p = await preparar();
  return conferirCoerencia(mudar(p.montagem), {
    hoje: HOJE,
    sucessoes: sucessoes ?? p.sucessoes,
    agentesDaTarifa: p.fontes.tarifas.agentes,
    siglasDosConjuntos: p.fontes.conjuntos.siglasPorCnpj,
  });
}
const comDistribuidoras = (m: Montagem, distribuidoras: Distribuidora[]): Montagem => ({ ...m, tarifas: { ...m.tarifas, distribuidoras } });
const comSubstituidas = (m: Montagem, substituidas: Record<string, string>): Montagem => ({ ...m, tarifas: { ...m.tarifas, substituidas } });

describe("conferirCoerencia (critério 3; não passa com --forcar)", () => {
  it("a montagem das fixtures passa", async () => {
    expect(await conferir()).toEqual([]);
  });

  it("V1: distribuidora publicada vencida há mais de 6 meses", async () => {
    const erros = await conferir((m) => comDistribuidoras(m, m.tarifas.distribuidoras.map((d) => (d.id === "cemig-d" ? { ...d, fimVigencia: "2026-04-29" } : d))));
    expect(erros).toEqual(["V1: CEMIG-D está publicada com tarifa vencida em 2026-04-29 (limite 2026-04-30)."]);
  });

  it("V2: o mesmo CNPJ em duas distribuidoras publicadas", async () => {
    const erros = await conferir((m) => {
      const ess = m.tarifas.distribuidoras.find((d) => d.id === "ess");
      return ess ? comDistribuidoras(m, [...m.tarifas.distribuidoras, { ...ess, id: "ess-area-2", sigla: "ESS AREA 2" }]) : m;
    });
    expect(erros).toEqual(["V2: o CNPJ 07282377000120 aparece em 2 distribuidoras publicadas (ESS, ESS AREA 2). Áreas com preços diferentes: separar antes de publicar."]);
  });

  it("V3: município com um id substituído na lista", async () => {
    const erros = await conferir((m) => ({
      ...m,
      municipiosPorUF: m.municipiosPorUF.map((a) => ({ ...a, municipios: a.municipios.map((x) => (x.ibge === 3504008 ? { ...x, distribuidoras: ["edevp"] } : x)) })),
    }));
    expect(erros).toEqual(["V3: 1 municípios listam um id substituído (ex.: Assis (SP))."]);
  });

  it("V4: a sucessora final não está publicada", async () => {
    const erros = await conferir((m) => comDistribuidoras(m, m.tarifas.distribuidoras.filter((d) => d.id !== "ess")));
    expect(erros).toContain("V4: sucessoes[0] (EDEVP): a sucessora final (ESS, 07282377000120) não está no tarifas.json.");
  });

  it("V7: a sucessora com mais de um valor na vigência", async () => {
    const erros = await conferir((m) => ({ ...m, relatorio: { ...m.relatorio, tarifasComMaisDeUmValor: [{ sigla: "ESS", cnpj: "07282377000120", valores: 2 }] } }));
    expect(erros).toHaveLength(1);
    expect(erros[0]).toMatch(/^V7: ESS \(sucessora de EDEVP, sucessoes\[0\]\) tem 2 valores B1/);
  });

  it("V7 vale só para sucessora: outra distribuidora com dois valores não para", async () => {
    expect(await conferir((m) => ({ ...m, relatorio: { ...m.relatorio, tarifasComMaisDeUmValor: [{ sigla: "CEMIG-D", cnpj: "06981180000116", valores: 2 }] } }))).toEqual([]);
  });

  it("V9 e V10 entram na coerência", async () => {
    const v9 = await conferir(undefined, await carregarSucessoes(pasta("sucessoes-v9.json")));
    expect(v9.some((e) => e.startsWith("V9: sucessoes[0] (CEMIG-D)"))).toBe(true);
    const v10 = await conferir(undefined, await carregarSucessoes(pasta("sucessoes-v10.json")));
    expect(v10.some((e) => e.startsWith("V10: sucessoes[0] (EDEVP)"))).toBe(true);
  });

  it("V8 sobre a montagem: valor que não está publicado", async () => {
    const erros = await conferir((m) => comSubstituidas(m, { ...m.tarifas.substituidas, cflo: "nao-existe" }));
    expect(erros).toEqual(['V8: "cflo" → "nao-existe", mas "nao-existe" não está publicada.']);
  });
});

describe("V8: invariantes de substituidas", () => {
  const publicados = new Set(["rge", "ess"]);
  it("aceita o mapa certo", () => {
    expect(conferirSubstituidas({ "rge-sul": "rge", edevp: "ess" }, publicados)).toEqual([]);
  });
  it("recusa formato, chave publicada, cadeia e conflito", () => {
    expect(conferirSubstituidas({ "RGE SUL": "rge" }, publicados)).toEqual(['V8: "RGE SUL" → "rge" não tem o formato de id.']);
    expect(conferirSubstituidas({ ["a".repeat(65)]: "rge" }, publicados)[0]).toMatch(/não tem o formato de id/);
    expect(conferirSubstituidas({ ess: "rge" }, publicados)).toEqual(['V8: "ess" é chave de substituidas e também está publicada.']);
    // Cadeia a → b + b → rge: o valor "b" não é o id final (e, se estiver publicado, também é chave publicada).
    expect(conferirSubstituidas({ a: "b", b: "rge" }, publicados)).toEqual(['V8: "a" → "b", mas "b" não está publicada.']);
    expect(conferirSubstituidas({ a: "b", b: "rge" }, new Set(["rge", "b"]))).toEqual([
      'V8: "a" → "b", e "b" também é substituída (o valor precisa ser o id final).',
      'V8: "b" é chave de substituidas e também está publicada.',
    ]);
    expect(conferirSubstituidas({}, publicados, ["x → a e b"])).toEqual(["V8: o mesmo id antigo leva a duas distribuidoras: x → a e b."]);
  });
  it("recusa mais de 500 entradas", () => {
    const grande = Object.fromEntries(Array.from({ length: MAXIMO_DE_SUBSTITUIDAS + 1 }, (_, i) => [`antiga-${i}`, "rge"]));
    expect(conferirSubstituidas(grande, publicados)).toEqual([`V8: substituidas tem ${MAXIMO_DE_SUBSTITUIDAS + 1} entradas (o máximo é 500).`]);
  });
});
