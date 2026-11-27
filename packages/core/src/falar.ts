/**
 * Textos para o "Ouvir" (HIS-101): a tela lida em voz alta pelo próprio celular (Web Speech API, sem servidor). A voz do
 * aparelho lê mal "R$ 1.234,56" e "kWh" (diz "erre cifrão", "cá dáblio agá"); aqui eles viram palavras.
 */

/** 1 real / 2 reais / 50 centavos / 12 reais e 30 centavos. Sem ponto de milhar: a voz lê "1234" como "mil duzentos...". */
export function reaisParaFalar(valor: number): string {
  const centavosTotais = Math.round((Number.isFinite(valor) ? Math.abs(valor) : 0) * 100);
  const reais = Math.floor(centavosTotais / 100);
  const centavos = centavosTotais % 100;
  const parteReais = reais === 1 ? "1 real" : `${reais} reais`;
  const parteCentavos = centavos === 1 ? "1 centavo" : `${centavos} centavos`;
  if (reais === 0 && centavos > 0) return parteCentavos;
  return centavos === 0 ? parteReais : `${parteReais} e ${parteCentavos}`;
}

/** 150 quilowatts-hora / 1,5 quilowatt-hora. */
export function kwhParaFalar(kwh: number): string {
  const v = Number.isFinite(kwh) ? Math.abs(kwh) : 0;
  const numero = v >= 10 ? String(Math.round(v)) : String(Math.round(v * 10) / 10).replace(".", ",");
  return `${numero} ${v === 1 ? "quilowatt-hora" : "quilowatts-hora"}`;
}

/** "R$ 1.234,56" (como o formatarReais escreve, com espaço comum ou não separável). */
const REAIS_NO_TEXTO = /R\$[\s ]?(\d{1,3}(?:\.\d{3})*|\d+)(?:,(\d{1,2}))?/g;
/** "54 kWh" / "1,8 kWh". */
const KWH_NO_TEXTO = /(\d+(?:,\d+)?)[\s ]?kWh\b/g;

/** Troca, num texto da tela, o dinheiro e o kWh por palavras que a voz lê bem. */
export function paraFalar(texto: string): string {
  return texto
    .replace(REAIS_NO_TEXTO, (_trecho, inteiro: string, centavos: string | undefined) =>
      reaisParaFalar(Number(inteiro.replace(/\./g, "")) + Number((centavos ?? "0").padEnd(2, "0")) / 100),
    )
    .replace(KWH_NO_TEXTO, (_trecho, numero: string) => kwhParaFalar(Number(numero.replace(",", "."))))
    .replace(/\s+/g, " ")
    .trim();
}

/** O que o "Ouvir" do acompanhamento lê, em frases curtas (a voz para entre elas). */
export interface ResumoParaOuvir {
  contaPorMes: number;
  consumoKwh: number;
  /** O aparelho que mais pesa e quanto ele custa por mês. */
  maior?: { nome: string; valorMes: number } | undefined;
  /** A melhor dica que ainda não está no plano. */
  dica?: { titulo: string; economiaMes?: number | undefined } | undefined;
  /** A conta com o plano de economia, se a pessoa tem plano. */
  contaComPlano?: number | undefined;
}

export function frasesDoResumo(resumo: ResumoParaOuvir): string[] {
  const frases = [
    `A sua conta de luz estimada é de ${reaisParaFalar(resumo.contaPorMes)} por mês, para ${kwhParaFalar(resumo.consumoKwh)}.`,
    "É uma estimativa: a conta de verdade pode mudar com impostos e dias de leitura.",
  ];
  if (resumo.maior) frases.push(`Quem mais pesa é ${paraFalar(resumo.maior.nome)}: ${reaisParaFalar(resumo.maior.valorMes)} por mês.`);
  if (resumo.contaComPlano !== undefined) frases.push(`Com o seu plano de economia, a conta cai para ${reaisParaFalar(resumo.contaComPlano)}.`);
  if (resumo.dica) {
    const economia = resumo.dica.economiaMes !== undefined && resumo.dica.economiaMes >= 0.5 ? `, e economiza cerca de ${reaisParaFalar(resumo.dica.economiaMes)} por mês` : "";
    frases.push(`Uma dica: ${semPontoFinal(paraFalar(resumo.dica.titulo))}${economia}.`);
  }
  return frases;
}

/** O que o "Ouvir" das dicas lê: cada dica com o título, o texto e a economia. No máximo `limite` dicas. */
export function frasesDasDicas(dicas: readonly { titulo: string; texto: string; economiaMes?: number | undefined }[], limite = 5): string[] {
  if (dicas.length === 0) return ["Ainda não há dicas para a sua casa."];
  const escolhidas = dicas.slice(0, limite);
  const frases = [escolhidas.length === 1 ? "Uma dica para a sua casa." : `${escolhidas.length} dicas para a sua casa.`];
  escolhidas.forEach((dica, indice) => {
    frases.push(`Dica ${indice + 1}: ${semPontoFinal(paraFalar(dica.titulo))}.`);
    frases.push(paraFalar(dica.texto));
    if (dica.economiaMes !== undefined && dica.economiaMes >= 0.5) frases.push(`Economia de cerca de ${reaisParaFalar(dica.economiaMes)} por mês.`);
  });
  return frases;
}

function semPontoFinal(texto: string): string {
  return texto.replace(/[.!]+$/, "");
}
