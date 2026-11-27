import { BANDEIRAS } from "./bandeiras";
import { formatarKwh, formatarReais } from "./formatacao";
import type { BandeiraMes, ContaMensal } from "./tipos";

export { contaPareceAlta, PARECE_ALTA } from "./conta-alta-sinal";

/**
 * "Por que minha conta veio alta?" (pedido do dono, 27/11). Compara a conta anotada com a anterior, com a estimativa
 * da casa e com a bandeira dos meses dela, e lista os motivos prováveis, do mais forte para o mais fraco. Tudo é
 * estimativa e é dito como estimativa: a conta tem impostos e taxas que mudam por cidade.
 *
 * Os limites abaixo (15%, 10%, 25%...) são decisão de produto, não regra da ANEEL: servem para não chamar de "motivo"
 * uma variação pequena, que acontece todo mês.
 */

/** O consumo subiu de verdade: pelo menos 15% e 20 kWh a mais que a conta anterior. */
export const SUBIDA_DO_CONSUMO = { proporcao: 0.15, kwh: 20 } as const;
/** O preço médio do kWh (valor ÷ kWh) subiu pelo menos 10%, com o consumo parecido (até 10% de diferença). */
export const SUBIDA_DO_PRECO = { proporcao: 0.1, consumoParecido: 0.1 } as const;
/** A conta passou mais de 25% da estimativa da casa (a mesma faixa "longe" da contagem de uso, ADR-009). */
export const ACIMA_DA_ESTIMATIVA = 0.25;
/** Um mês de referência para comparar o período de leitura. */
export const DIAS_DE_UM_MES = 30;
/**
 * A leitura é feita a cada 27 a 33 dias (REN ANEEL 1.000/2021, art. 260), e acima de 33 dias a cobrança fica limitada a
 * 33 (art. 285, II). Lida em cópia publicada pela Cemig, acesso em 27/11/2026; conferir no cedoc da ANEEL.
 */
export const DIAS_DE_LEITURA = { min: 27, max: 33 } as const;

export type IdDoMotivo = "bandeira" | "consumo-subiu" | "preco-subiu" | "mais-dias" | "acima-da-estimativa" | "calor" | "frio";

export interface MotivoDaContaAlta {
  id: IdDoMotivo;
  /** "forte": os números da conta mostram. "possivel": vale conferir. */
  forca: "forte" | "possivel";
  titulo: string;
  texto: string;
  /** Quanto este motivo pode ter pesado, em R$, sem impostos. Só quando dá para estimar. */
  valorEstimado?: number;
}

export interface EntradaDaContaAlta {
  conta: ContaMensal;
  /** A conta anotada do mês mais recente antes desta, se houver. */
  anterior?: ContaMensal | undefined;
  /** O consumo que a casa cadastrada explica, em kWh por mês. */
  estimativaKwh?: number | undefined;
  /** Histórico das bandeiras (ANEEL), de tarifas.json. */
  bandeiras: readonly BandeiraMes[];
  /** Os dias que a conta cobre, se a pessoa olhou na conta. */
  dias?: number | undefined;
}

/** "2026-11" → "2026-10". */
export function mesAnterior(competencia: string): string {
  const [ano, mes] = competencia.split("-").map(Number);
  if (!ano || !mes) return competencia;
  return mes === 1 ? `${ano - 1}-12` : `${ano}-${String(mes - 1).padStart(2, "0")}`;
}

/**
 * A conta de um mês cobre dias desse mês e do anterior (a leitura acontece no meio do mês). Usamos a média do
 * adicional dos dois meses: uma aproximação de dias meio a meio, dita como "cerca de".
 */
export function adicionalDaConta(bandeiras: readonly BandeiraMes[], competencia: string): { adicionalKwh: number; meses: BandeiraMes[] } | undefined {
  const meses = [mesAnterior(competencia), competencia].map((m) => bandeiras.find((b) => b.competencia === m)).filter((b): b is BandeiraMes => b !== undefined);
  if (meses.length === 0) return undefined;
  return { adicionalKwh: meses.reduce((s, b) => s + b.adicionalKwh, 0) / meses.length, meses };
}

function nomesDasBandeiras(meses: readonly BandeiraMes[]): string {
  const nomes = [...new Set(meses.map((b) => BANDEIRAS[b.bandeira].nome.toLowerCase()))];
  return nomes.length === 1 ? `a bandeira ${nomes[0]}` : `as bandeiras ${nomes.join(" e ")}`;
}

export function motivosDaContaAlta({ conta, anterior, estimativaKwh, bandeiras, dias }: EntradaDaContaAlta): MotivoDaContaAlta[] {
  const motivos: MotivoDaContaAlta[] = [];
  const precoMedio = conta.kwh > 0 ? conta.valor / conta.kwh : undefined;

  // Bandeira: quanto o adicional pesou nesta conta, e se pesou mais que na anterior.
  const bandeira = adicionalDaConta(bandeiras, conta.competencia);
  if (bandeira && bandeira.adicionalKwh > 0) {
    const valor = conta.kwh * bandeira.adicionalKwh;
    const daAnterior = anterior ? adicionalDaConta(bandeiras, anterior.competencia) : undefined;
    const subiu = daAnterior !== undefined && bandeira.adicionalKwh > daAnterior.adicionalKwh;
    motivos.push({
      id: "bandeira",
      forca: subiu || !anterior ? "forte" : "possivel",
      titulo: subiu ? "A bandeira ficou mais cara" : "A bandeira encareceu a energia",
      texto: `Nos meses desta conta, valeu ${nomesDasBandeiras(bandeira.meses)}. Ela cobra um valor a mais por kWh: nesta conta, cerca de ${formatarReais(valor)}, sem os impostos.${
        subiu ? " Na conta anterior, a bandeira era mais barata." : ""
      }`,
      valorEstimado: valor,
    });
  }

  if (anterior && anterior.kwh > 0) {
    const diferencaKwh = conta.kwh - anterior.kwh;
    const proporcaoKwh = diferencaKwh / anterior.kwh;
    // O consumo subiu: a casa gastou mais energia (não é só preço).
    if (proporcaoKwh >= SUBIDA_DO_CONSUMO.proporcao && diferencaKwh >= SUBIDA_DO_CONSUMO.kwh) {
      motivos.push({
        id: "consumo-subiu",
        forca: "forte",
        titulo: "A casa gastou mais energia",
        texto: `Foram ${formatarKwh(conta.kwh)}, ${formatarKwh(diferencaKwh)} a mais que na conta anterior (${formatarKwh(anterior.kwh)}). Veja se entrou aparelho novo, se alguém a mais está em casa ou se algum aparelho ficou mais tempo ligado.`,
        ...(precoMedio === undefined ? {} : { valorEstimado: diferencaKwh * precoMedio }),
      });
      const mes = Number(conta.competencia.slice(5, 7));
      if ([12, 1, 2, 3].includes(mes)) {
        motivos.push({
          id: "calor",
          forca: "possivel",
          titulo: "Meses de calor",
          texto: "No calor, o ventilador e o ar-condicionado ficam mais tempo ligados, e a geladeira trabalha mais para manter o frio.",
        });
      } else if ([6, 7, 8].includes(mes)) {
        motivos.push({
          id: "frio",
          forca: "possivel",
          titulo: "Meses de frio",
          texto: "No frio, o banho costuma ser mais quente e mais longo, com o chuveiro na posição inverno, que gasta mais.",
        });
      }
    }
    // O consumo ficou parecido, mas o preço médio subiu: não foi a casa, foi o preço (bandeira, reajuste, imposto).
    const precoAnterior = anterior.valor / anterior.kwh;
    if (
      precoMedio !== undefined &&
      Math.abs(proporcaoKwh) <= SUBIDA_DO_PRECO.consumoParecido &&
      precoMedio >= precoAnterior * (1 + SUBIDA_DO_PRECO.proporcao)
    ) {
      motivos.push({
        id: "preco-subiu",
        forca: "forte",
        titulo: "O preço subiu, não o seu consumo",
        texto: `O consumo ficou parecido com o da conta anterior, mas cada kWh saiu mais caro: ${formatarReais(precoMedio)} agora, contra ${formatarReais(precoAnterior)} antes, já com impostos e taxas. Isso vem de bandeira, reajuste da tarifa ou impostos, não do que a sua casa usou.`,
        valorEstimado: (precoMedio - precoAnterior) * conta.kwh,
      });
    }
  }

  // Mais dias de leitura: a conta cobriu mais que um mês de 30 dias.
  if (dias !== undefined && dias > DIAS_DE_UM_MES && conta.kwh > 0) {
    const kwhAMais = (conta.kwh * (dias - DIAS_DE_UM_MES)) / dias;
    motivos.push({
      id: "mais-dias",
      forca: dias - DIAS_DE_UM_MES >= 2 ? "forte" : "possivel",
      titulo: "Esta conta cobriu mais dias",
      texto: `Ela cobre ${dias} dias, ${dias - DIAS_DE_UM_MES} a mais que um mês de 30. Esses dias a mais somam cerca de ${formatarKwh(kwhAMais)}${
        precoMedio === undefined ? "" : `, ou ${formatarReais(kwhAMais * precoMedio)}`
      }. Na próxima conta, o período tende a ser mais curto.${
        dias > DIAS_DE_LEITURA.max
          ? ` Atenção: a empresa de luz não pode cobrar mais de ${DIAS_DE_LEITURA.max} dias numa conta. Veja abaixo como pedir a correção.`
          : ""
      }`,
      ...(precoMedio === undefined ? {} : { valorEstimado: kwhAMais * precoMedio }),
    });
  }

  // Acima do que a casa cadastrada explica: falta aparelho no cadastro, ou algum gasta mais que o normal.
  if (estimativaKwh !== undefined && estimativaKwh > 0 && conta.kwh > estimativaKwh * (1 + ACIMA_DA_ESTIMATIVA)) {
    const kwhAMais = conta.kwh - estimativaKwh;
    motivos.push({
      id: "acima-da-estimativa",
      forca: "possivel",
      titulo: "A conta passou do que a sua casa explica",
      texto: `Os aparelhos cadastrados explicam cerca de ${formatarKwh(estimativaKwh)} por mês, e a conta veio com ${formatarKwh(conta.kwh)}. Pode faltar aparelho no cadastro, o tempo de uso pode ser maior, ou algum aparelho pode estar gastando mais que o normal (geladeira com a borracha da porta gasta, chuveiro com defeito). O teste do relógio, abaixo, ajuda a descobrir.`,
      ...(precoMedio === undefined ? {} : { valorEstimado: kwhAMais * precoMedio }),
    });
  }

  return motivos.sort((a, b) => (a.forca === b.forca ? (b.valorEstimado ?? 0) - (a.valorEstimado ?? 0) : a.forca === "forte" ? -1 : 1));
}
