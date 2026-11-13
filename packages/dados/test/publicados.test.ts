/**
 * Teste dos arquivos publicados (HIS-111, h8, critério 3): o que está em `apps/web/public/dados` no `main` cumpre o
 * V1, o V2, o V3 e o V8, com a mesma regra que a rotina usa antes de gravar. Se a rotina um dia publicar um número
 * errado (ou alguém editar o arquivo à mão), o CI fica vermelho.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { idDaSigla } from "@ee/core";
import { lerMunicipiosPublicados } from "../src/diagnostico";
import { conferirPublicacao, conferirSubstituidas, type Publicacao } from "../src/montar";

const PASTA = fileURLToPath(new URL("../../../apps/web/public/dados", import.meta.url));

interface TarifasPublicadas {
  geradoEm: string;
  distribuidoras: { id: string; sigla: string; cnpj?: string; fimVigencia?: string }[];
  substituidas: Record<string, string>;
}

const ehObjeto = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
const textoOuAusente = (x: unknown): x is string | undefined => x === undefined || typeof x === "string";

/** Lê só o que as regras olham e falha com uma mensagem clara se o formato mudou. */
function lerTarifasPublicadas(bruto: unknown): TarifasPublicadas {
  if (!ehObjeto(bruto) || typeof bruto.geradoEm !== "string" || !Array.isArray(bruto.distribuidoras)) throw new Error("tarifas.json sem geradoEm ou distribuidoras");
  const distribuidoras: TarifasPublicadas["distribuidoras"] = [];
  for (const d of bruto.distribuidoras) {
    if (!ehObjeto(d) || typeof d.id !== "string" || typeof d.sigla !== "string" || !textoOuAusente(d.cnpj) || !textoOuAusente(d.fimVigencia)) {
      throw new Error(`tarifas.json: distribuidora fora do formato (${JSON.stringify(d)})`);
    }
    distribuidoras.push({ id: d.id, sigla: d.sigla, cnpj: d.cnpj, fimVigencia: d.fimVigencia });
  }
  // A rotina sempre grava o `substituidas` (T1). Valor que não é texto vira "" e o V8 acusa.
  if (!ehObjeto(bruto.substituidas)) throw new Error("tarifas.json sem substituidas");
  const substituidas = Object.fromEntries(Object.entries(bruto.substituidas).map(([de, para]) => [de, typeof para === "string" ? para : ""]));
  return { geradoEm: bruto.geradoEm, distribuidoras, substituidas };
}

async function lerPublicacao(): Promise<{ tarifas: TarifasPublicadas; publicacao: Publicacao }> {
  const tarifas = lerTarifasPublicadas(JSON.parse(await readFile(`${PASTA}/tarifas.json`, "utf8")));
  const municipios = [...(await lerMunicipiosPublicados(PASTA))].map(([ibge, { uf, ids }]) => ({ nome: String(ibge), uf, distribuidoras: ids }));
  // V1 conta a partir do dia em que o arquivo foi gerado (critério 3), e não de hoje: um dia sem rotina não deixa o CI vermelho.
  const publicacao: Publicacao = { distribuidoras: tarifas.distribuidoras, municipios, substituidas: tarifas.substituidas, referencia: tarifas.geradoEm.slice(0, 10) };
  return { tarifas, publicacao };
}

describe("arquivos publicados em apps/web/public/dados (HIS-111, critério 3)", () => {
  it("V1, V2 e V3: nenhuma vencida há mais de 6 meses, nenhum CNPJ repetido, nenhuma cidade com id substituído", async () => {
    const { publicacao } = await lerPublicacao();
    expect(publicacao.distribuidoras.length).toBeGreaterThan(40);
    expect(publicacao.municipios.length).toBeGreaterThan(5000);
    expect(conferirPublicacao(publicacao)).toEqual([]);
  });

  it("todo id publicado é o idDaSigla do core aplicado à sigla (uma regra só para a rotina e o site)", async () => {
    const { tarifas } = await lerPublicacao();
    expect(tarifas.distribuidoras.filter((d) => idDaSigla(d.sigla) !== d.id)).toEqual([]);
  });

  it("V8: substituidas aponta só para ids publicados, sem cadeia", async () => {
    const { tarifas } = await lerPublicacao();
    expect(conferirSubstituidas(tarifas.substituidas, new Set(tarifas.distribuidoras.map((d) => d.id)))).toEqual([]);
  });

  it("a mesma conferência pega uma cidade com id substituído e uma tarifa vencida", async () => {
    const { publicacao } = await lerPublicacao();
    const [primeira, ...resto] = publicacao.municipios;
    if (!primeira) throw new Error("nenhum município publicado");
    const quebrada: Publicacao = {
      ...publicacao,
      substituidas: { ...publicacao.substituidas, "rge-sul": "rge" },
      municipios: [{ ...primeira, distribuidoras: ["rge-sul"] }, ...resto],
      distribuidoras: [...publicacao.distribuidoras, { sigla: "VELHA", cnpj: "99999999000199", fimVigencia: "2019-06-18" }],
    };
    const erros = conferirPublicacao(quebrada);
    expect(erros.some((e) => e.startsWith("V1: VELHA"))).toBe(true);
    expect(erros.some((e) => e.startsWith("V3: 1 municípios"))).toBe(true);
  });
});
