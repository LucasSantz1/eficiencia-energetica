/**
 * Passos da rotina de dados que a linha de comando (`atualizar.ts`) e o diagnóstico (`diagnostico.ts`) dividem:
 * os dois montam com as mesmas entradas, então o diagnóstico mostra o que a rotina vai publicar.
 */
import { descreverFontes, type Fontes } from "./fontes";
import { montarArquivos, type Montagem } from "./montar";
import { sucessoesEmVigor, type Sucessao } from "./sucessoes";

/** Monta os arquivos a partir das fontes lidas e das sucessões (só as linhas em vigor hoje entram). */
export function montarComAsFontes(fontes: Fontes, opcoes: { hoje: string; geradoEm: string; sucessoes: readonly Sucessao[] }): Montagem {
  return montarArquivos({
    tarifas: fontes.tarifas.selecao.tarifas,
    analiseDasTarifas: fontes.tarifas.selecao,
    agentesDaTarifa: fontes.tarifas.agentes,
    bandeiras: fontes.bandeiras,
    vinculos: fontes.vinculos,
    anoMaisRecenteDosConjuntos: fontes.conjuntos.anoMaisRecente,
    sucessoes: sucessoesEmVigor(opcoes.sucessoes, opcoes.hoje),
    localidades: fontes.localidades,
    hoje: opcoes.hoje,
    geradoEm: opcoes.geradoEm,
    origem: "aneel",
    fontes: descreverFontes(fontes.fonteIbge),
  });
}
