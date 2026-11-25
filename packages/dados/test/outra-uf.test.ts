/*
 * HIS-206: código de município trocado no IndQual (Nova Santa Rita PI × CERTAJA) e a barreira V11 para ligação nova
 * com distribuidora de outro estado.
 */
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CODIGOS_TROCADOS } from "@ee/core";
import { LIGACOES_DE_OUTRA_UF } from "../src/aneel/outra-uf";
import { conferirOutraUf, moverCodigosTrocados } from "../src/montar";

const PASTA = fileURLToPath(new URL("../../../apps/web/public/dados", import.meta.url));

async function lerMunicipios() {
  const nomes = (await readdir(`${PASTA}/municipios`)).filter((n) => /^[A-Z]{2}\.json$/.test(n));
  const arquivos = await Promise.all(nomes.map(async (n) => JSON.parse(await readFile(`${PASTA}/municipios/${n}`, "utf8")) as { municipios: { ibge: number; nome: string; uf: string; distribuidoras: string[] }[] }));
  return arquivos.flatMap((a) => a.municipios);
}

const cidade = (ibge: number, nome: string, uf: string, distribuidoras: string[]) => ({ ibge, nome, uf, distribuidoras });
/** Uma cooperativa do RS com 12 cidades lá, e a CERTAJA plantada em Nova Santa Rita (PI). */
function casoDaCertaja() {
  const rs = Array.from({ length: 12 }, (_, i) => cidade(4300000 + i, `Cidade ${i}`, "RS", ["certaja"]));
  return [...rs, cidade(2207959, "Nova Santa Rita", "PI", ["equatorial-pi", "certaja"]), cidade(4313375, "Nova Santa Rita", "RS", ["rge"])];
}

describe("moverCodigosTrocados", () => {
  it("tira a CERTAJA de Nova Santa Rita (PI) e põe em Nova Santa Rita (RS)", () => {
    const municipios = casoDaCertaja();
    moverCodigosTrocados(municipios);
    expect(municipios.find((m) => m.ibge === 2207959)?.distribuidoras).toEqual(["equatorial-pi"]);
    expect(municipios.find((m) => m.ibge === 4313375)?.distribuidoras).toEqual(["rge", "certaja"]);
  });

  it("se a ANEEL já corrigiu, não mexe em nada", () => {
    const municipios = [cidade(2207959, "Nova Santa Rita", "PI", ["equatorial-pi"]), cidade(4313375, "Nova Santa Rita", "RS", ["rge", "certaja"])];
    moverCodigosTrocados(municipios);
    expect(municipios.map((m) => m.distribuidoras)).toEqual([["equatorial-pi"], ["rge", "certaja"]]);
  });

  it("cada código trocado deixa a cidade publicada com quem a atende de verdade", () => {
    for (const c of CODIGOS_TROCADOS) expect(c.ficaNaCidadePublicada).not.toBe(c.distribuidora);
  });
});

describe("V11: ligação com distribuidora de outro estado", () => {
  it("para a rotina numa ligação nova que ninguém conferiu", () => {
    const erros = conferirOutraUf([...Array.from({ length: 12 }, (_, i) => cidade(4300000 + i, `C${i}`, "RS", ["coop-nova"])), cidade(2500000, "Cidade da PB", "PB", ["epb", "coop-nova"])]);
    expect(erros).toEqual([expect.stringMatching(/^V11: Cidade da PB \(PB, IBGE 2500000\) aparece ligada à coop-nova/)]);
  });

  it("aceita a ligação conferida como fronteira", () => {
    const sp = Array.from({ length: 40 }, (_, i) => cidade(3500000 + i, `C${i}`, "SP", ["cpfl-santa-cruz"]));
    expect(conferirOutraUf([...sp, cidade(4111803, "Jacarezinho", "PR", ["cpfl-santa-cruz"])])).toEqual([]);
  });

  it("os municípios publicados, com os códigos trocados movidos, passam: toda ligação de outro estado está conferida", async () => {
    const municipios = await lerMunicipios();
    moverCodigosTrocados(municipios);
    expect(conferirOutraUf(municipios)).toEqual([]);
    expect(municipios.find((m) => m.ibge === 2207959)?.distribuidoras).toEqual(["equatorial-pi"]);
  });

  it("a tabela não repete ligação e não aceita o que já é código trocado", () => {
    const chaves = LIGACOES_DE_OUTRA_UF.map((l) => `${l.distribuidora}:${l.ibge}`);
    expect(new Set(chaves).size).toBe(chaves.length);
    for (const c of CODIGOS_TROCADOS) expect(chaves).not.toContain(`${c.distribuidora}:${c.publicado}`);
  });
});
