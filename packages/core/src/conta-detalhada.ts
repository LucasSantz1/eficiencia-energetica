/**
 * Conta detalhada (HIS-201): a estimativa em linhas, como numa fatura (energia, bandeira, consumo mínimo, Tarifa
 * Social, iluminação pública). As linhas somam, em centavos, exatamente o valor da conta mostrado na tela.
 * Nenhuma regra nova: os números vêm do `estimarConta` (REN ANEEL 1.000/2021 para o mínimo; Lei 12.212/2010, art. 1º,
 * na redação da Lei 15.235/2025, para a Tarifa Social, já citadas lá).
 */
import type { EstimativaConta } from "./calculos";

export type TipoDeLinha = "energia" | "bandeira" | "minimo" | "tarifa-social" | "iluminacao";

export interface LinhaDaConta {
  tipo: TipoDeLinha;
  /** Valor da linha em centavos; negativo no desconto da Tarifa Social. */
  centavos: number;
  /** kWh e preço por kWh da linha, quando ela é "kWh × preço". */
  kwh?: number;
  precoKwh?: number;
}

export interface ContaDetalhada {
  linhas: LinhaDaConta[];
  totalCentavos: number;
  /** O preço veio da conta de luz da pessoa (já com impostos e bandeira): energia e bandeira não se separam. */
  precoDaConta: boolean;
}

const centavos = (reais: number) => Math.round(reais * 100);

export function detalharConta(conta: EstimativaConta): ContaDetalhada {
  const { preco, consumoKwh } = conta;
  const precoDaConta = preco.origem === "conta";
  // Na tarifa da ANEEL o preço já soma o adicional da bandeira; separamos as duas partes. No preço da conta, não dá.
  const adicional = precoDaConta ? 0 : preco.adicionalBandeira;
  const tarifa = preco.valor - adicional;
  const linhas: LinhaDaConta[] = [{ tipo: "energia", kwh: consumoKwh, precoKwh: tarifa, centavos: centavos(consumoKwh * tarifa) }];
  if (adicional > 0) linhas.push({ tipo: "bandeira", kwh: consumoKwh, precoKwh: adicional, centavos: centavos(consumoKwh * adicional) });
  if (conta.cobradoPeloMinimo) {
    // O que falta do consumo até o mínimo. Não dá para usar `kwhCobrados − consumo`: na Tarifa Social os 80 kWh
    // isentos já saíram dos kWh cobrados e entram na linha própria do desconto.
    const faltam = conta.consumoMinimoKwh - consumoKwh;
    linhas.push({ tipo: "minimo", kwh: faltam, precoKwh: preco.valor, centavos: centavos(faltam * preco.valor) });
  }
  if (conta.economiaBeneficio > 0) linhas.push({ tipo: "tarifa-social", centavos: -centavos(conta.economiaBeneficio) });
  if (conta.valorIluminacaoPublica > 0) linhas.push({ tipo: "iluminacao", centavos: centavos(conta.valorIluminacaoPublica) });

  // O arredondamento de cada linha pode deixar 1 centavo de diferença: ele vai para a energia, a maior linha, para a
  // soma bater com o valor da tela.
  const totalCentavos = centavos(conta.valor);
  const soma = linhas.reduce((s, l) => s + l.centavos, 0);
  const energia = linhas[0];
  if (energia) energia.centavos += totalCentavos - soma;
  return { linhas, totalCentavos, precoDaConta };
}
