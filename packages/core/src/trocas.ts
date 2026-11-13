import { acharDistribuidora, nomeDaDistribuidora, NOMES_COMERCIAIS, type ArquivoParaBusca } from "./distribuidoras";

/**
 * Nome comercial de um id que pode já ter saído do `tarifas.json` (ex.: `rge-sul` → "RGE Sul"), para o aviso da troca
 * (HIS-111, F1). `undefined` quando não sabemos o nome: a tela nunca mostra o id nem a sigla solta. `Object.entries` só
 * vê as chaves próprias da tabela, então "constructor" e "__proto__" não acham nada.
 */
export function nomeComercialDoId(id: string): string | undefined {
  // A sigla vira id pela regra do `slug` de `packages/dados/src/util.ts`, sem tirar acentos nem cortar hífens nas pontas:
  // as siglas que já saíram do arquivo não têm acento. Uma sigla com acento ("Âmbar Roraima") não acha o próprio id, e o
  // aviso sai sem o nome antigo, como manda o F1 quando não sabemos o nome.
  const idDaSigla = (sigla: string) => sigla.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return Object.entries(NOMES_COMERCIAIS).find(([sigla]) => idDaSigla(sigla) === id)?.[1];
}

/** O que o aviso da troca mostra (HIS-111, F1): o nome de hoje e, se soubermos, o nome antigo. */
export interface TrocaDescrita {
  /** Ausente quando não sabemos o nome comercial do id antigo, ou quando ele é igual ao novo: o texto sai sem ele. */
  nomeAntigo?: string | undefined;
  nomeNovo: string;
}

/** Os nomes que a família conhece para a troca. `undefined` se `para` não está no arquivo. */
export function descreverTroca(arquivo: ArquivoParaBusca, troca: { de: string; para: string }): TrocaDescrita | undefined {
  const nova = acharDistribuidora(arquivo, troca.para);
  if (!nova) return undefined;
  const nomeNovo = nomeDaDistribuidora(nova.sigla);
  const nomeAntigo = nomeComercialDoId(troca.de);
  return { nomeAntigo: nomeAntigo === nomeNovo ? undefined : nomeAntigo, nomeNovo };
}
