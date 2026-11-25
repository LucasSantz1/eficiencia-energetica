/**
 * Códigos de município trocados no IndQual Município da ANEEL (HIS-206). Uma cooperativa do RS ou de SC aparece ligada
 * a uma cidade de outro estado que tem o MESMO NOME de uma cidade da área dela (Triunfo PB × Triunfo RS), e a cidade
 * certa fica sem a ligação. A rotina de dados move a ligação para a cidade certa; o site corrige a casa já salva.
 *
 * Fonte das ligações: IndQual Município e atributos dos conjuntos (dadosabertos.aneel.gov.br), publicados até
 * 10/11/2026. Critério (dominio-energia, rodada de 25/11/2026): a cidade publicada fica fora de todas as UFs da
 * distribuidora, tem outra distribuidora da própria UF, e a cidade de mesmo nome fica na região dela.
 *
 * - Confirmadas por fonte oficial: CERTAJA em Triunfo (RS); COPREL em Soledade, Colorado e Tapejara (RS) — Governo
 *   do RS, comunicado EFC 02/2022 (estado.rs.gov.br), que lista as cooperativas por município.
 * - Prováveis (só pelo critério acima, sem documento que cite a cidade): as demais. Ficam porque a ligação publicada é
 *   impossível (cooperativa do RS ou de SC numa cidade do PI, da PB, de AL ou de SP) e o erro seria cobrar o preço de
 *   outra empresa.
 * - Sem `correto`: a ligação publicada não tem cidade de mesmo nome na área da distribuidora; a rotina só a remove.
 *
 * Fica aqui, no core, para a rotina (`packages/dados`) e o site usarem a mesma tabela.
 */
import type { Residencia } from "./tipos";

export interface CodigoTrocado {
  /** Id da distribuidora (o `idDaSigla` da sigla da ANEEL). */
  distribuidora: string;
  /** Código IBGE que a ANEEL publica (errado). */
  publicado: number;
  /** Código IBGE da cidade certa, de mesmo nome, na área da distribuidora. Sem ele, a ligação só sai. */
  correto?: number;
  /** Quem atende a cidade publicada de verdade: a casa salva com a ligação errada passa para ela. */
  ficaNaCidadePublicada: string;
  nota: string;
}

export const CODIGOS_TROCADOS: readonly CodigoTrocado[] = [
  { distribuidora: "certaja", publicado: 2207959, correto: 4313375, ficaNaCidadePublicada: "equatorial-pi", nota: "Nova Santa Rita (PI) → Nova Santa Rita (RS)" },
  { distribuidora: "certaja", publicado: 2516805, correto: 4322004, ficaNaCidadePublicada: "epb", nota: "Triunfo (PB) → Triunfo (RS)" },
  { distribuidora: "coprel", publicado: 2516102, correto: 4320800, ficaNaCidadePublicada: "epb", nota: "Soledade (PB) → Soledade (RS)" },
  { distribuidora: "coprel", publicado: 4105904, correto: 4305603, ficaNaCidadePublicada: "copel-dis", nota: "Colorado (PR) → Colorado (RS)" },
  { distribuidora: "coprel", publicado: 4126256, correto: 4320107, ficaNaCidadePublicada: "copel-dis", nota: "Sarandi (PR) → Sarandi (RS)" },
  { distribuidora: "coprel", publicado: 4126801, correto: 4320909, ficaNaCidadePublicada: "copel-dis", nota: "Tapejara (PR) → Tapejara (RS)" },
  { distribuidora: "eletrocar", publicado: 4105904, correto: 4305603, ficaNaCidadePublicada: "copel-dis", nota: "Colorado (PR) → Colorado (RS)" },
  { distribuidora: "eletrocar", publicado: 4126256, correto: 4320107, ficaNaCidadePublicada: "copel-dis", nota: "Sarandi (PR) → Sarandi (RS)" },
  { distribuidora: "ceraca", publicado: 2704609, correto: 4210506, ficaNaCidadePublicada: "equatorial-al", nota: "Maravilha (AL) → Maravilha (SC)" },
  { distribuidora: "ceraca", publicado: 3548906, correto: 4216008, ficaNaCidadePublicada: "cpfl-paulista", nota: "São Carlos (SP) → São Carlos (SC)" },
  // A Light atende só o RJ; São José do Rio Preto é da CPFL Paulista (dominio-energia, 25/11/2026). A cidade de nome
  // parecido no RJ (São José do Vale do Rio Preto) não é da Light, então não há para onde mover.
  { distribuidora: "light-sesa", publicado: 3549805, ficaNaCidadePublicada: "cpfl-paulista", nota: "São José do Rio Preto (SP): ligação removida" },
];

/**
 * A casa salva numa cidade com a ligação errada (ex.: Nova Santa Rita, PI, com a CERTAJA) passa para quem atende a
 * cidade de verdade. Depois da troca o id salvo já é o certo, então ela acontece uma vez só (como a da HIS-111).
 */
export function trocaPorCodigoTrocado(residencia: Pick<Residencia, "municipioIbge" | "distribuidoraId">): { de: string; para: string } | undefined {
  const c = CODIGOS_TROCADOS.find((x) => x.publicado === residencia.municipioIbge && x.distribuidora === residencia.distribuidoraId);
  return c ? { de: c.distribuidora, para: c.ficaNaCidadePublicada } : undefined;
}
