import "server-only"; // primeiro import: depende de leitura de disco, nunca vai para o navegador (ADR-001)
import { bandeiraDoMes, competenciaAtual, type BandeiraMes } from "@ee/core";
import { lerRelatorioPublicado, lerTarifasPublicadas } from "@/infraestrutura/dados-publicos/arquivos.servidor";

/** Números reais da página inicial: distribuidoras, cidades atendidas e bandeira do mês (ANEEL). */
export interface NumerosDoInicio {
  distribuidoras: number;
  cidades: number;
  bandeira: BandeiraMes | undefined;
}

/**
 * Lê as tarifas e depois o relatório publicados em public/dados. Qualquer erro devolve undefined:
 * a página mostra os textos aproximados ("100+", "5.500+") em vez de quebrar.
 */
export async function carregarNumerosDoInicio(): Promise<NumerosDoInicio | undefined> {
  try {
    const tarifas = await lerTarifasPublicadas();
    const relatorio = await lerRelatorioPublicado();
    const bandeira = bandeiraDoMes(tarifas.bandeiras, competenciaAtual());
    return {
      distribuidoras: tarifas.distribuidoras.length,
      cidades: relatorio.municipios - relatorio.municipiosSemDistribuidora,
      bandeira: bandeira?.bandeira,
    };
  } catch {
    return undefined;
  }
}
