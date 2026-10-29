"use client";

import { COMODOS_PADRAO, formatarKwh, formatarPorcentagem, formatarReais, itemDoCatalogo } from "@ee/core";
import { ChevronRight, Info } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EditorAparelho } from "@/components/EditorAparelho";
import { BarraEtiqueta, LegendaEtiqueta, SeloBandeira } from "@/components/Etiqueta";
import { Icone } from "@/components/Icone";
import { Aviso, BotaoLink } from "@/components/ui";
import { nomeDistribuidora, useResumo } from "@/lib/resumo";
import type { Aparelho } from "@ee/core";

export default function Resumo() {
  const { resumo, preco, bandeira, distribuidora, residencia, comodos, dicas, carregando, erro } = useResumo();
  const [editando, setEditando] = useState<Aparelho>();
  const { conta } = resumo;
  const maior = resumo.aparelhos[0]?.kwhMes ?? 0;
  const melhores = dicas.filter((d) => (d.economiaMes ?? 0) >= 0.5).slice(0, 2);

  if (erro) return <Aviso tom="alerta">Não conseguimos carregar as tarifas. Confira sua internet e recarregue a página.</Aviso>;
  if (carregando && !distribuidora) return <div className="h-48 animate-pulse rounded-[var(--radius-cartao)] bg-papel" aria-busy aria-label="Carregando" />;

  if (resumo.aparelhos.length === 0) {
    return (
      <div className="py-6">
        <h1 className="text-[2rem] leading-tight font-extrabold">Nenhum aparelho ainda</h1>
        <p className="mt-3 max-w-[48ch] text-lg text-tinta-suave">Adicione os aparelhos da sua casa para ver quanto cada um custa por mês.</p>
        <BotaoLink href="/casa/aparelhos" className="mt-8">
          Adicionar aparelhos
        </BotaoLink>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Valor da conta */}
      <section aria-labelledby="titulo-conta" className="rounded-[1.75rem] bg-tinta px-5 py-6 text-white sm:px-8 sm:py-8">
        <h1 id="titulo-conta" className="text-lg font-bold text-white/80">
          Sua conta estimada por mês
        </h1>
        <p className="numeros mt-1 text-[clamp(3rem,13vw,5.25rem)] leading-none font-extrabold tracking-tight text-faisca">{formatarReais(conta.valor)}</p>
        <p className="numeros mt-3 text-lg text-white/85">
          {formatarKwh(conta.consumoKwh)} por mês, cerca de {formatarReais(conta.valor / 30)} por dia
        </p>

        <div className="mt-6 space-y-2 border-t border-white/15 pt-5 text-[0.98rem] text-white/80">
          {bandeira && preco.origem === "aneel" && (
            <p className="text-white">
              <SeloBandeira bandeira={bandeira.bandeira} exata={bandeira.exata} sobreEscuro />
            </p>
          )}
          {preco.origem === "conta" ? (
            <p>Calculado com o preço do kWh da sua conta de luz ({formatarReais(preco.valor)}), que já inclui impostos.</p>
          ) : (
            <p>
              Tarifa da {nomeDistribuidora(distribuidora)}: {formatarReais(preco.valor - preco.adicionalBandeira)} por kWh{preco.adicionalBandeira > 0 && ` + ${formatarReais(preco.adicionalBandeira)} da bandeira`}. Sem impostos, que variam por
              cidade.{" "}
              <Link href="/casa/ajustes#conta" className="font-bold text-faisca underline underline-offset-2">
                Usar minha conta de luz
              </Link>
            </p>
          )}
          {residencia?.beneficio === "tarifa-social" && conta.economiaBeneficio > 0 && <p>A Tarifa Social já tirou {formatarReais(conta.economiaBeneficio)} da conta: os primeiros 80 kWh são de graça.</p>}
          {residencia?.beneficio === "desconto-social" && <p>Com o Desconto Social, os primeiros 120 kWh saem mais baratos. Confira o desconto exato na sua conta.</p>}
          {conta.cobradoPeloMinimo && (
            <p className="flex gap-2">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden /> Seu consumo ficou abaixo do mínimo que a distribuidora cobra ({conta.consumoMinimoKwh} kWh), então a conta vem pelo mínimo.
            </p>
          )}
        </div>
      </section>

      {/* Quem mais gasta */}
      <section aria-labelledby="titulo-ranking">
        <div className="flex items-end justify-between gap-4">
          <h2 id="titulo-ranking" className="text-2xl font-extrabold tracking-tight">
            Quem mais gasta
          </h2>
          <Link href="/casa/aparelhos" className="inline-flex min-h-11 items-center gap-1 font-bold text-energia">
            Todos <ChevronRight className="size-5" aria-hidden />
          </Link>
        </div>
        <div className="mt-3">
          <LegendaEtiqueta />
        </div>
        <ul className="mt-5 space-y-5">
          {resumo.aparelhos.slice(0, 7).map(({ aparelho, kwhMes, valorMes, participacao }) => (
            <li key={aparelho.id}>
              <button type="button" onClick={() => setEditando(aparelho)} className="block w-full rounded-xl text-left" aria-label={`${aparelho.nome}: ${formatarReais(valorMes)} por mês, ${formatarPorcentagem(participacao)} da conta. Toque para ajustar.`}>
                <span className="mb-1.5 flex items-center gap-2">
                  <Icone nome={itemDoCatalogo(aparelho.catalogoId)?.icone} className="size-5 text-tinta-suave" />
                  <span className="flex-1 truncate font-bold">
                    {aparelho.quantidade > 1 && <span className="numeros">{aparelho.quantidade} × </span>}
                    {aparelho.nome}
                  </span>
                  <span className="numeros text-[0.95rem] text-tinta-suave">{formatarPorcentagem(participacao)} da conta</span>
                </span>
                <BarraEtiqueta relativo={maior > 0 ? kwhMes / maior : 0} participacao={participacao}>
                  {formatarReais(valorMes)}
                </BarraEtiqueta>
              </button>
            </li>
          ))}
        </ul>
        {resumo.aparelhos.length > 7 && (
          <p className="mt-4 text-tinta-suave">
            E mais {resumo.aparelhos.length - 7} {resumo.aparelhos.length - 7 === 1 ? "aparelho" : "aparelhos"} que gastam menos.
          </p>
        )}
      </section>

      {/* Onde economizar */}
      {melhores.length > 0 && (
        <section aria-labelledby="titulo-economia" className="rounded-[var(--radius-cartao)] border-2 border-energia bg-energia-claro p-5 sm:p-6">
          <h2 id="titulo-economia" className="text-2xl font-extrabold tracking-tight text-energia-forte">
            Onde dá para economizar
          </h2>
          <ul className="mt-4 space-y-4">
            {melhores.map((d) => (
              <li key={d.id} className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-papel text-energia">
                  <Icone nome={d.icone} className="size-5" />
                </span>
                <div className="flex-1">
                  <p className="font-bold">{d.titulo}</p>
                  <p className="numeros text-energia-forte">
                    Economia de <strong>{formatarReais(d.economiaMes ?? 0)}</strong> por mês
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <BotaoLink href="/casa/dicas" variante="secundario" className="mt-5">
            Ver todas as dicas
          </BotaoLink>
        </section>
      )}

      {/* Por cômodo */}
      {resumo.comodos.length > 1 && (
        <section aria-labelledby="titulo-comodos">
          <h2 id="titulo-comodos" className="text-2xl font-extrabold tracking-tight">
            Por cômodo
          </h2>
          <ul className="mt-4 divide-y divide-linha border-y border-linha">
            {resumo.comodos.map((c) => {
              const comodo = comodos.find((x) => x.id === c.comodoId);
              return (
                <li key={c.comodoId} className="flex items-center gap-3 py-3">
                  <Icone nome={COMODOS_PADRAO.find((p) => p.tipo === comodo?.tipo)?.icone} className="size-5 text-tinta-suave" />
                  <span className="flex-1 font-bold">{comodo?.nome ?? "Cômodo"}</span>
                  <span className="numeros text-tinta-suave">{formatarPorcentagem(c.participacao)}</span>
                  <span className="numeros w-28 text-right font-extrabold">{formatarReais(c.valorMes)}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <p className="text-[0.95rem] text-tinta-suave">
        Os valores são estimativas feitas com os tempos de uso que você informou. A conta real pode variar com impostos, taxa de iluminação pública e dias de leitura.
      </p>

      <EditorAparelho aparelho={editando} aberto={Boolean(editando)} aoFechar={() => setEditando(undefined)} preco={preco} />
    </div>
  );
}
