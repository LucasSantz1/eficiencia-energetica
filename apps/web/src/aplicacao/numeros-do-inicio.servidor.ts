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
 * Lê as tarifas e depois o relatório publicados em public/dados. Sem `try/catch` de propósito (HIS-003a, D4): arquivo
 * ruim faz o build falhar, e na revalidação o Next continua servindo a última página boa. Para rodar sem os dados
 * reais, `pnpm dados:exemplo`.
 */
export async function carregarNumerosDoInicio(): Promise<NumerosDoInicio> {
  const tarifas = await lerTarifasPublicadas();
  const relatorio = await lerRelatorioPublicado();
  const bandeira = bandeiraDoMes(tarifas.bandeiras, competenciaAtual());
  return {
    distribuidoras: tarifas.distribuidoras.length,
    cidades: relatorio.municipios - relatorio.municipiosSemDistribuidora,
    bandeira: bandeira?.bandeira,
  };
}
