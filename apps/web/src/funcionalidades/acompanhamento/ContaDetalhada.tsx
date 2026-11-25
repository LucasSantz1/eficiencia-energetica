// Sem "use client": só desenha; quem usa (o painel) já é de cliente.
import { BANDEIRAS, detalharConta, formatarKwh, formatarReais, type BandeiraMes, type EstimativaConta, type LinhaDaConta } from "@ee/core";

/** Nome e detalhe de cada linha (HIS-201). Dinheiro primeiro, kWh no detalhe, em palavras do dia a dia. */
function textoDaLinha(l: LinhaDaConta, conta: EstimativaConta, precoDaConta: boolean, bandeira?: BandeiraMes): { nome: string; detalhe?: string } {
  const kwhVezesPreco = l.kwh !== undefined && l.precoKwh !== undefined ? `${formatarKwh(l.kwh)} × ${formatarReais(l.precoKwh)}` : undefined;
  switch (l.tipo) {
    case "energia":
      return { nome: precoDaConta ? "Energia, com impostos" : "Energia", detalhe: kwhVezesPreco };
    case "bandeira":
      return { nome: bandeira ? `Bandeira ${BANDEIRAS[bandeira.bandeira].nome.toLowerCase()}` : "Bandeira do mês", detalhe: kwhVezesPreco };
    case "minimo":
      return { nome: "Até o mínimo da ligação", detalhe: `a conta cobra pelo menos ${conta.consumoMinimoKwh} kWh` };
    case "tarifa-social":
      return { nome: "Tarifa Social", detalhe: "os primeiros 80 kWh são de graça" };
    case "iluminacao":
      return { nome: "Iluminação pública", detalhe: "o valor da sua conta de luz" };
  }
}

/** A conta estimada em linhas, como numa fatura. As linhas somam o valor grande do cartão (o core garante). */
export function ContaDetalhada({ conta, bandeira }: { conta: EstimativaConta; bandeira?: BandeiraMes }) {
  const { linhas, totalCentavos, precoDaConta } = detalharConta(conta);
  return (
    <dl className="numeros divide-y divide-separador rounded-[var(--radius-controle)] bg-fundo px-4 text-tinta">
      {linhas.map((l) => {
        const { nome, detalhe } = textoDaLinha(l, conta, precoDaConta, bandeira);
        return (
          <div key={l.tipo} className="flex items-baseline justify-between gap-3 py-2.5">
            <dt>
              <span className="block font-bold">{nome}</span>
              {detalhe && <span className="block text-[0.9rem] text-tinta-suave">{detalhe}</span>}
            </dt>
            <dd className={`shrink-0 font-bold ${l.centavos < 0 ? "text-energia-forte" : ""}`}>
              {l.centavos < 0 ? `− ${formatarReais(-l.centavos / 100)}` : formatarReais(l.centavos / 100)}
            </dd>
          </div>
        );
      })}
      <div className="flex items-baseline justify-between gap-3 py-2.5">
        <dt className="font-extrabold">Total estimado</dt>
        <dd className="shrink-0 font-extrabold">{formatarReais(totalCentavos / 100)}</dd>
      </div>
    </dl>
  );
}
