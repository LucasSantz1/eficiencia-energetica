import { readFile } from "node:fs/promises";
import type { Localidades } from "./montar";

export const URL_IBGE_MUNICIPIOS = "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?view=nivelado";
export const CAMINHO_BASE_LOCALIDADES = new URL("../base/localidades-ibge.json", import.meta.url);

type MunicipioNivelado = { "municipio-id": number; "municipio-nome": string; "UF-sigla": string; "UF-nome": string };

/**
 * Lista de estados e municípios. Tenta a API de localidades do IBGE e, se ela falhar,
 * usa a cópia guardada no repositório (base/localidades-ibge.json) — municípios quase nunca mudam.
 */
export async function carregarLocalidades(usarApi: boolean): Promise<{ localidades: Localidades; fonte: string }> {
  if (usarApi) {
    try {
      const resposta = await fetch(URL_IBGE_MUNICIPIOS);
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
      const dados = (await resposta.json()) as MunicipioNivelado[];
      const estados = new Map<string, string>();
      const municipios = dados.map((m) => {
        estados.set(m["UF-sigla"], m["UF-nome"]);
        return { ibge: Number(m["municipio-id"]), nome: m["municipio-nome"], uf: m["UF-sigla"] };
      });
      if (municipios.length < 5000 || municipios.some((m) => !m.uf || !m.ibge)) throw new Error("resposta incompleta");
      return {
        localidades: { estados: [...estados].map(([uf, nome]) => ({ uf, nome })).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")), municipios },
        fonte: "IBGE — API de localidades",
      };
    } catch (erro) {
      console.warn(`  IBGE indisponível (${(erro as Error).message}); usando a cópia local.`);
    }
  }
  const base = JSON.parse(await readFile(CAMINHO_BASE_LOCALIDADES, "utf8")) as Localidades & { fonte: string };
  return { localidades: { estados: base.estados, municipios: base.municipios }, fonte: base.fonte };
}
