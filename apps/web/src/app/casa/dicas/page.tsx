"use client";

import { formatarKwh, formatarReais, type Dica } from "@ee/core";
import { Check } from "lucide-react";
import { useState } from "react";
import { EspacoReservado } from "@/components/EspacoReservado";
import { Icone } from "@/components/Icone";
import { ValorAnimado } from "@/components/Movimento";
import { Pilulas } from "@/components/ui";
import { useResumo } from "@/lib/resumo";
import { useCasa } from "@/lib/store";

type Filtro = "todas" | "habito" | "troca";

export default function Dicas() {
  const { dicas, resumo, resumoPlano, plano, aparelhos, comodos } = useResumo();
  const alternar = useCasa((s) => s.alternarNoPlano);
  const [filtro, setFiltro] = useState<Filtro>("todas");

  const simulaveis = dicas.filter((d) => d.simulavel);
  const visiveis = simulaveis.filter((d) => filtro === "todas" || d.tipo === filtro);
  const outras = dicas.filter((d) => !d.simulavel);
  const atual = resumo.conta.valor;
  const comPlano = resumoPlano?.conta.valor ?? atual;
  const economia = atual - comPlano;
  const semCusto = simulaveis.filter((d) => d.tipo === "habito");

  return (
    <div>
      <h1 className="text-[2rem] leading-tight font-extrabold tracking-tight">Dicas e plano de economia</h1>
      <p className="mt-2 max-w-[56ch] text-lg text-tinta-suave">
        Cada dica foi calculada com os aparelhos da sua casa. Marque as que você vai seguir e veja quanto a conta cai.
        {semCusto.length > 0 && ` ${semCusto.length} delas não custam nada.`}
      </p>

      {/* Resumo do plano */}
      <section aria-label="Seu plano de economia" aria-live="polite" className="sticky top-2 z-10 mt-6 rounded-[1.5rem] bg-tinta px-5 py-4 text-white shadow-[0_10px_30px_-12px_rgb(19_35_63/0.6)] sm:px-6">
        {plano.length === 0 ? (
          <p className="text-[1.02rem]">
            Hoje a conta estimada é de <strong className="numeros text-faisca">{formatarReais(atual)}</strong> por mês. Marque as dicas abaixo para montar o seu plano.
          </p>
        ) : (
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <div>
              <p className="text-white/80">
                Com {plano.length} {plano.length === 1 ? "dica" : "dicas"}, a conta vai de <span className="numeros line-through decoration-2">{formatarReais(atual)}</span> para
              </p>
              <p className="numeros text-4xl leading-tight font-extrabold text-faisca">
                <ValorAnimado valor={comPlano} formatar={(v) => formatarReais(v)} duracao={600} />
              </p>
            </div>
            <div className="text-right">
              <p className="numeros text-xl font-extrabold">
                −<ValorAnimado valor={economia} formatar={(v) => formatarReais(v)} duracao={600} /> por mês
              </p>
              <p className="numeros text-white/80">
                <ValorAnimado valor={economia * 12} formatar={(v) => formatarReais(v)} duracao={600} /> em um ano
              </p>
            </div>
          </div>
        )}
      </section>

      {simulaveis.length > 0 && (
        <>
          <div className="mt-8">
            <Pilulas
              rotulo="Filtrar dicas"
              opcoes={[
                { valor: "todas", rotulo: "Todas" },
                { valor: "habito", rotulo: "Sem gastar nada" },
                { valor: "troca", rotulo: "Trocando algo" },
              ]}
              valor={filtro}
              aoMudar={setFiltro}
            />
          </div>
          <ul className="mt-5 space-y-3">
            {visiveis.map((d, i) => (
              <CartaoDica
                indice={i}
                key={d.id}
                dica={d}
                marcada={plano.includes(d.id)}
                aoAlternar={() => alternar(d.id)}
                onde={(() => {
                  const a = aparelhos.find((x) => x.id === d.aparelhoId);
                  const c = comodos.find((x) => x.id === d.comodoId);
                  return a ? `${a.quantidade > 1 ? `${a.quantidade} × ` : ""}${a.nome}${c ? `, ${c.nome}` : ""}` : undefined;
                })()}
              />
            ))}
          </ul>
          {visiveis.length === 0 && <p className="mt-5 text-tinta-suave">Nenhuma dica desse tipo para a sua casa.</p>}
        </>
      )}

      <div className="mt-10 empty:hidden">
        <EspacoReservado posicao="dicas-apos-lista" />
      </div>

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

function CartaoDica({ dica, marcada, aoAlternar, onde, indice }: { dica: Dica; marcada: boolean; aoAlternar: () => void; onde?: string; indice: number }) {
  return (
    <li
      className={`surgir rounded-[var(--radius-cartao)] border-2 bg-papel p-4 transition-[border-color,box-shadow] duration-300 sm:p-5 ${marcada ? "border-energia shadow-[0_0_0_4px_var(--color-energia-claro)]" : "border-transparent"}`}
      style={{ animationDelay: `${Math.min(indice, 8) * 60}ms` }}
    >
      <div className="flex gap-4">
        <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${dica.tipo === "troca" ? "bg-faisca-claro text-tinta" : "bg-energia-claro text-energia"}`}>
          <Icone nome={dica.icone} className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.92rem] font-bold text-tinta-suave">
            {onde && <span>{onde}</span>}
            <span className={`rounded-full px-2 py-0.5 text-[0.82rem] ${dica.tipo === "troca" ? "bg-faisca-claro text-tinta" : "bg-energia-claro text-energia-forte"}`}>
              {dica.tipo === "troca" ? "Precisa comprar algo" : "Não custa nada"}
            </span>
          </p>
          <h2 className="mt-0.5 text-xl leading-snug font-extrabold">{dica.titulo}</h2>
          <p className="mt-1.5 text-tinta-suave">{dica.texto}</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="numeros">
              <strong className="text-lg">{formatarReais(dica.economiaMes ?? 0)} por mês</strong>
              <span className="text-tinta-suave">
                {" "}
                ({formatarReais((dica.economiaMes ?? 0) * 12)} no ano, {formatarKwh(dica.economiaKwh ?? 0)} a menos)
              </span>
            </p>
            <button
              type="button"
              role="checkbox"
              aria-checked={marcada}
              onClick={aoAlternar}
              className={`inline-flex min-h-12 items-center gap-2 rounded-full border-2 px-4 font-bold transition-[background-color,border-color,color,transform] duration-200 active:scale-95 ${marcada ? "border-energia bg-energia text-white" : "border-linha bg-papel hover:border-energia"}`}
            >
              <span className={`grid size-6 place-items-center rounded-md border-2 ${marcada ? "border-white" : "border-linha"}`}>{marcada && <Check className="pulo size-4" strokeWidth={3.5} />}</span>
              {marcada ? "No meu plano" : "Vou fazer"}
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
