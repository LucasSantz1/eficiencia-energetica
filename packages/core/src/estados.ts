/** As 27 unidades da federação, com o nome por extenso (IBGE, Divisão Territorial Brasileira). */
export type Uf =
  | "AC" | "AL" | "AM" | "AP" | "BA" | "CE" | "DF" | "ES" | "GO" | "MA" | "MG" | "MS" | "MT" | "PA"
  | "PB" | "PE" | "PI" | "PR" | "RJ" | "RN" | "RO" | "RR" | "RS" | "SC" | "SE" | "SP" | "TO";

export const ESTADOS: Readonly<Record<Uf, string>> = Object.freeze({
  AC: "Acre",
  AL: "Alagoas",
  AM: "Amazonas",
  AP: "Amapá",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MG: "Minas Gerais",
  MS: "Mato Grosso do Sul",
  MT: "Mato Grosso",
  PA: "Pará",
  PB: "Paraíba",
  PE: "Pernambuco",
  PI: "Piauí",
  PR: "Paraná",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RO: "Rondônia",
  RR: "Roraima",
  RS: "Rio Grande do Sul",
  SC: "Santa Catarina",
  SE: "Sergipe",
  SP: "São Paulo",
  TO: "Tocantins",
});

/**
 * Diz se o valor é uma das 27 UFs. Serve para montar o caminho de `/dados/municipios/{UF}.json` só com UF de verdade
 * (A6 da HIS-003: `"../x"` vindo da casa salva viraria um pedido para qualquer endereço do site).
 */
export function ehUf(valor: unknown): valor is Uf {
  return typeof valor === "string" && valor.length === 2 && Object.hasOwn(ESTADOS, valor);
}
