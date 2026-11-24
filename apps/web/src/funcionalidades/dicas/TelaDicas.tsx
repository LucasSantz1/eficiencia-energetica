"use client";

import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { formatarKwh, formatarReais, type Dica } from "@ee/core";
import { useCasa } from "@/aplicacao/casa";
import { useResumo } from "@/aplicacao/resumo";
import { EspacoReservado } from "@/ui/EspacoReservado";
import { Icone } from "@/ui/Icone";
import { ValorAnimado } from "@/ui/Movimento";
import { Pilulas } from "@/ui/Pilulas";

type Filtro = "todas" | "habito" | "troca";

export function TelaDicas() {
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

  // No computador (HIS-112, L5): o plano e o "Também ajuda" numa coluna à direita e as dicas em grade à esquerda. A ordem do código
  // continua a do celular (plano, depois a lista); a grade só muda o lugar na tela.
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:grid-rows-[auto_auto_auto_1fr] lg:gap-x-8">
      <h1 className="text-[2rem] leading-tight font-extrabold tracking-tight lg:col-span-2">Dicas e plano de economia</h1>
      <p className="mt-2 max-w-[56ch] text-lg text-tinta-suave lg:col-span-2">
        Marque as que você vai fazer e veja quanto a conta cai.
        {semCusto.length > 0 && ` ${semCusto.length} delas não custam nada.`}
      </p>

      {/* Resumo do plano */}
      <section aria-label="Seu plano de economia" aria-live="polite" className="sticky top-2 z-10 mt-6 rounded-[var(--radius-cartao)] bg-papel px-5 py-4 shadow-[0_8px_24px_-14px_rgb(19_35_63/0.35)] sm:px-6 lg:static lg:col-start-2 lg:row-start-3 lg:self-start lg:shadow-none">
        {plano.length === 0 ? (
          <p className="text-[1.02rem]">
            Hoje a conta estimada é de <strong className="numeros text-energia-forte">{formatarReais(atual)}</strong> por mês. Marque as dicas abaixo para montar o seu plano.
          </p>
        ) : (
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <div>
              <p className="text-tinta-suave">
                Com {plano.length} {plano.length === 1 ? "dica" : "dicas"}, a conta vai de <span className="numeros line-through decoration-2">{formatarReais(atual)}</span> para
              </p>
              <p className="numeros text-4xl leading-tight font-extrabold text-energia-forte">
                <ValorAnimado valor={comPlano} formatar={(v) => formatarReais(v)} duracao={600} />
              </p>
            </div>
            <div className="text-right">
              <p className="numeros text-xl font-extrabold">
                −<ValorAnimado valor={economia} formatar={(v) => formatarReais(v)} duracao={600} /> por mês
              </p>
              <p className="numeros text-tinta-suave">
                <ValorAnimado valor={economia * 12} formatar={(v) => formatarReais(v)} duracao={600} /> em um ano
              </p>
            </div>
          </div>
        )}
      </section>

      <div className="lg:col-start-1 lg:row-span-2 lg:row-start-3">
        {simulaveis.length > 0 && (
          <>
            <div className="mt-8 lg:mt-6">
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
            <ul className="mt-5 space-y-3 lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-4 lg:space-y-0">
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
      </div>

      {/* "Também ajuda" na coluna da direita, embaixo do plano (24/11): preenche o lado das dicas no computador. No
          código vem depois da lista, então no celular continua no fim da página e a ordem de foco não muda. */}
      {outras.length > 0 && (
        <section aria-labelledby="outras" className="mt-12 lg:col-start-2 lg:row-start-4 lg:mt-6 lg:self-start">
          <h2 id="outras" className="text-[1.375rem] font-bold tracking-tight">
            Também ajuda
          </h2>
          <ul className="mt-3 divide-y divide-separador overflow-hidden rounded-[var(--radius-cartao)] bg-papel">
            {outras.map((d) => (
              <li key={d.id}>
                <details className="group px-4 sm:px-5">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 py-3 [&::-webkit-details-marker]:hidden">
                    <Icone nome={d.icone} className={`size-6 shrink-0 ${d.tipo === "aviso" ? "text-faixa-d" : "text-energia"}`} />
                    <h3 className="flex-1 leading-snug font-bold">{d.titulo}</h3>
                    <ChevronDown className="size-5 shrink-0 text-tinta-suave transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <p className="pb-4 pl-9 text-tinta-suave">{d.texto}</p>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function CartaoDica({ dica, marcada, aoAlternar, onde, indice }: { dica: Dica; marcada: boolean; aoAlternar: () => void; onde?: string; indice: number }) {
  const troca = dica.tipo === "troca";
  return (
    <li
      className={`surgir flex flex-col rounded-[var(--radius-cartao)] border-2 bg-papel p-4 transition-[border-color,box-shadow] duration-300 sm:p-5 ${marcada ? "border-energia shadow-[0_0_0_4px_var(--color-energia-claro)]" : "border-transparent"}`}
      style={{ animationDelay: `${Math.min(indice, 8) * 60}ms` }}
    >
      {/* Cartão curto (pedido do responsável, 24/11: "muito texto"): o quê, onde e quanto. A explicação fica no "Como fazer". */}
      <div className="flex items-start gap-3">
        <span className={`grid size-11 shrink-0 place-items-center rounded-[0.8rem] ${troca ? "bg-faisca-claro text-tinta" : "bg-energia-claro text-energia"}`}>
          <Icone nome={dica.icone} className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[1.0625rem] leading-snug font-bold">{dica.titulo}</h2>
          {onde && <p className="mt-0.5 text-[0.92rem] text-tinta-suave">{onde}</p>}
        </div>
        <p className="numeros shrink-0 text-right">
          <strong className="block text-xl leading-tight font-extrabold text-energia-forte">{formatarReais(dica.economiaMes ?? 0)}</strong>
          <span className="text-[0.85rem] text-tinta-suave">por mês</span>
        </p>
      </div>

      <details className="group mt-2 pl-14">
        <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1 font-bold text-energia [&::-webkit-details-marker]:hidden">
          Como fazer <ChevronDown className="size-5 transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <p className="text-tinta-suave">{dica.texto}</p>
        <p className="numeros mt-1 text-[0.92rem] text-tinta-suave">
          {formatarReais((dica.economiaMes ?? 0) * 12)} no ano, {formatarKwh(dica.economiaKwh ?? 0)} a menos por mês.
        </p>
      </details>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-separador pt-3 lg:mt-auto">
        <span className={`rounded-full px-2.5 py-1 text-[0.85rem] font-bold ${troca ? "bg-faisca-claro text-tinta" : "bg-energia-claro text-energia-forte"}`}>
          {troca ? "Precisa comprar algo" : "Não custa nada"}
        </span>
        <button
          type="button"
          role="checkbox"
          aria-checked={marcada}
          onClick={aoAlternar}
          className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-bold transition-[background-color,color,transform] duration-200 active:scale-95 ${marcada ? "bg-energia text-white" : "bg-energia-claro text-energia-forte hover:bg-[#cde8db]"}`}
        >
          <span className={`grid size-5 place-items-center rounded-md border-2 ${marcada ? "border-white" : "border-energia-forte/60"}`}>{marcada && <Check className="pulo size-3.5" strokeWidth={3.5} />}</span>
          {marcada ? "No meu plano" : "Vou fazer"}
        </button>
      </div>
    </li>
  );
}
