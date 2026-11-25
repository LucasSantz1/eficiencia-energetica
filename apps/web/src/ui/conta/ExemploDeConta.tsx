import { Zap } from "lucide-react";

/**
 * Desenho de uma conta de luz de exemplo, para a pessoa achar os dois números que pedimos (pedido do responsável,
 * 25/11). Empresa e valores são inventados e marcados como exemplo: não imita a conta de nenhuma distribuidora.
 * O desenho é uma imagem só (role="img"): o texto alternativo diz onde fica cada número.
 */
function Marca({ numero }: { numero: 1 | 2 }) {
  return <span className="grid size-6 shrink-0 place-items-center rounded-full bg-energia text-[0.8rem] font-extrabold text-white">{numero}</span>;
}

function Linha({ nome, valor }: { nome: string; valor: string }) {
  return (
    <div className="flex justify-between gap-2 text-tinta-suave">
      <span>{nome}</span>
      <span>{valor}</span>
    </div>
  );
}

export function ExemploDeConta({ className = "" }: { className?: string }) {
  return (
    <figure className={className}>
      <div
        role="img"
        aria-label="Exemplo de conta de luz. O número 1 é o consumo do mês, em kWh, na parte do consumo. O número 2 é o total a pagar, no fim da conta."
        className="numeros mx-auto max-w-sm rotate-[-1deg] rounded-[var(--radius-cartao)] border border-separador bg-papel p-4 text-[0.85rem] shadow-[0_10px_30px_-16px_rgb(19_35_63/0.45)]"
      >
        <div aria-hidden>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-faisca text-tinta">
                <Zap className="size-5" />
              </span>
              <span className="leading-tight">
                <span className="block font-extrabold text-tinta">Sua empresa de luz</span>
                <span className="block text-tinta-suave">Conta de energia elétrica</span>
              </span>
            </div>
            <span className="rounded-full bg-fundo px-2 py-0.5 text-[0.75rem] font-bold text-tinta-suave">Exemplo</span>
          </div>
          <div className="mt-3 space-y-1 border-t border-dashed border-linha pt-3">
            <Linha nome="Leitura anterior" valor="12.340" />
            <Linha nome="Leitura atual" valor="12.508" />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 ring-2 ring-energia">
            <span className="flex items-center gap-2 font-bold text-tinta">
              <Marca numero={1} /> Consumo do mês
            </span>
            <span className="font-extrabold text-tinta">168 kWh</span>
          </div>
          <div className="mt-3 space-y-1 border-t border-dashed border-linha pt-3">
            <Linha nome="Energia" valor="R$ 121,35" />
            <Linha nome="Iluminação pública" valor="R$ 12,50" />
            <Linha nome="Impostos" valor="R$ 12,40" />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-energia-claro px-2 py-2 ring-2 ring-energia">
            <span className="flex items-center gap-2 font-extrabold text-tinta">
              <Marca numero={2} /> Total a pagar
            </span>
            <span className="text-base font-extrabold text-tinta">R$ 146,25</span>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-[0.95rem] text-tinta-suave">A sua conta pode ser diferente, mas esses dois números estão sempre lá.</figcaption>
    </figure>
  );
}
