"use client";

import { formatarKwh, formatarReais, type TipoDica } from "@ee/core";
import { Icone } from "@/components/Icone";
import { useResumo } from "@/lib/resumo";
import { useCasa } from "@/lib/store";

const ROTULO: Record<TipoDica, string> = {
  habito: "Mudança de hábito",
  troca: "Troca de aparelho",
  aviso: "Atenção",
  geral: "Vale para toda casa",
};

export default function Dicas() {
  const { dicas } = useResumo();
  const aparelhos = useCasa((s) => s.aparelhos);
  const comEconomia = dicas.filter((d) => (d.economiaMes ?? 0) >= 0.05);
  const outras = dicas.filter((d) => !((d.economiaMes ?? 0) >= 0.05));
  // Uma economia por aparelho (a maior), para não somar duas mudanças no mesmo aparelho.
  const melhorPorAparelho = new Map<string, number>();
  for (const d of comEconomia) {
    const chave = d.aparelhoId ?? d.id;
    melhorPorAparelho.set(chave, Math.max(melhorPorAparelho.get(chave) ?? 0, d.economiaMes ?? 0));
  }
  const potencial = [...melhorPorAparelho.values()].reduce((s, v) => s + v, 0);

  return (
    <div>
      <h1 className="text-[2rem] leading-tight font-extrabold tracking-tight">Dicas para pagar menos</h1>
      {potencial > 0 ? (
        <p className="mt-2 max-w-[52ch] text-lg text-tinta-suave">
          Seguindo as dicas abaixo, sua conta pode cair <strong className="numeros text-energia-forte">até {formatarReais(potencial)} por mês</strong>. As de cima são as que mais economizam na sua casa.
        </p>
      ) : (
        <p className="mt-2 max-w-[52ch] text-lg text-tinta-suave">Cadastre mais aparelhos para ver dicas com a economia calculada para a sua casa.</p>
      )}

      {comEconomia.length > 0 && (
        <ol className="mt-8 space-y-4">
          {comEconomia.map((d) => {
            const aparelho = aparelhos.find((a) => a.id === d.aparelhoId);
            return (
              <li key={d.id} className="flex gap-4 rounded-[var(--radius-cartao)] bg-papel p-5">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-energia-claro text-energia">
                  <Icone nome={d.icone} className="size-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.92rem] font-bold text-tinta-suave">
                    {aparelho ? aparelho.nome : ROTULO[d.tipo]}
                  </p>
                  <h2 className="mt-0.5 text-xl leading-snug font-extrabold">{d.titulo}</h2>
                  <p className="mt-1.5 text-tinta-suave">{d.texto}</p>
                  <p className="numeros mt-3 inline-flex flex-wrap items-baseline gap-x-2 rounded-full bg-faisca-claro px-3 py-1">
                    <strong className="text-lg">{formatarReais(d.economiaMes ?? 0)} por mês</strong>
                    <span className="text-[0.95rem] text-tinta-suave">{formatarKwh(d.economiaKwh ?? 0)} a menos</span>
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {outras.length > 0 && (
        <section aria-labelledby="outras" className="mt-12">
          <h2 id="outras" className="text-2xl font-extrabold tracking-tight">
            Também ajuda
          </h2>
          <ul className="mt-4 divide-y divide-linha border-y border-linha">
            {outras.map((d) => (
              <li key={d.id} className="flex gap-4 py-5">
                <Icone nome={d.icone} className={`mt-1 size-6 shrink-0 ${d.tipo === "aviso" ? "text-faixa-d" : "text-energia"}`} />
                <div>
                  <h3 className="text-lg leading-snug font-extrabold">{d.titulo}</h3>
                  <p className="mt-1 max-w-[62ch] text-tinta-suave">{d.texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
