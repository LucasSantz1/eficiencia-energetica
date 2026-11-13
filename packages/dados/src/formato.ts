import { ehUf, ErroDeFormato, lerArquivoMunicipios, lerArquivoTarifas, lerRelatorioDosDados } from "@ee/core";
import type { Montagem } from "./montar";

/**
 * Confere os arquivos com os **mesmos leitores** que o site usa (`@ee/core`, ADR-004), antes de gravar.
 * Na rotina a regra é estrita: estrutura errada ou qualquer entrada que o leitor descartaria é erro. Não passa com
 * `--forcar`, que vale só para o `validar()` de variação: um arquivo que o site recusa nunca chega à família.
 * Devolve a lista de problemas (vazia = pode gravar).
 */
export function conferirFormato(m: Montagem): string[] {
  const problemas: string[] = [];
  /** `ler` devolve quantas entradas o leitor tirou; `ErroDeFormato` vira problema, outro erro sobe. */
  const conferir = (nome: string, ler: () => number) => {
    try {
      const descartados = ler();
      if (descartados > 0) problemas.push(`${nome}: ${descartados} entrada(s) fora do formato ou da faixa (o site tiraria).`);
    } catch (erro) {
      if (!(erro instanceof ErroDeFormato)) throw erro;
      problemas.push(erro.message);
    }
  };

  conferir("tarifas.json", () => lerArquivoTarifas(m.tarifas).descartados);
  for (const arquivo of m.municipiosPorUF) {
    const nome = `municipios/${arquivo.uf}.json`;
    if (!ehUf(arquivo.uf)) {
      problemas.push(`${nome}: UF desconhecida.`);
      continue;
    }
    const uf = arquivo.uf;
    conferir(nome, () => lerArquivoMunicipios(arquivo, uf).descartados);
  }
  conferir("relatorio.json", () => {
    lerRelatorioDosDados(m.relatorio);
    return 0;
  });
  return problemas;
}
