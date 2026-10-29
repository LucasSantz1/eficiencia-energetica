"use client";

import { consumoMensalKwh, formatarReais, itemDoCatalogo, type PrecoKwh } from "@ee/core";
import { useState } from "react";
import { Contador } from "@/ui/Contador";
import { Icone } from "@/ui/Icone";
import { ValorAnimado } from "@/ui/Movimento";
import { Pilulas } from "@/ui/Pilulas";
import { descreverUso } from "./textosDeUso";
import { SeletorFrequencia, SeletorTempo, SeletorVariantes } from "./TempoUso";
import type { ItemComodo } from "./tipos";

/**
 * Uma linha de aparelho dentro de um cômodo: quantidade com − e +, e o tempo de uso estimado,
 * que abre para ajuste com um toque. Com quantidade zero, a linha fica apagada (é só uma sugestão).
 */
export function LinhaAparelho({
  item,
  aoMudar,
  preco,
  aoAbrirDetalhes,
  minimo = 0,
}: {
  item: ItemComodo;
  aoMudar: (parcial: Partial<ItemComodo>) => void;
  preco?: PrecoKwh;
  aoAbrirDetalhes?: () => void;
  minimo?: number;
}) {
  const [ajustando, setAjustando] = useState(false);
  const catalogo = itemDoCatalogo(item.catalogoId);
  const ativo = item.quantidade > 0;
  const valor = preco ? consumoMensalKwh(item) * preco.valor : undefined;
  const temPerguntas = Boolean(catalogo?.variantes?.length);

  return (
    <li className={`rounded-[var(--radius-controle)] border-2 px-3 py-3 transition-[background-color,border-color] duration-300 sm:px-4 ${ativo ? "border-linha bg-papel" : "border-transparent bg-papel/50"}`}>
      <div className="flex items-center gap-2.5">
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${ativo ? "bg-energia-claro text-energia" : "bg-fundo text-tinta-suave"}`}>
          <Icone nome={catalogo?.icone} className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          {aoAbrirDetalhes ? (
            <button type="button" onClick={aoAbrirDetalhes} className="block max-w-full text-left leading-snug font-bold [overflow-wrap:anywhere] underline-offset-4 hover:underline">
              {item.nome}
            </button>
          ) : (
            <span className={`block leading-snug font-bold [overflow-wrap:anywhere] ${ativo ? "" : "text-tinta-suave"}`}>{item.nome}</span>
          )}
          {ativo && (
            <button type="button" onClick={() => setAjustando((v) => !v)} className="block text-left text-[0.95rem] text-tinta-suave underline decoration-dotted underline-offset-4 hover:text-tinta" aria-expanded={ajustando}>
              {descreverUso(item)}
              {temPerguntas && !ajustando && <span className="block font-bold text-energia">Escolher o tipo</span>}
            </button>
          )}
        </div>
        <Contador
          compacto
          valor={item.quantidade}
          aoMudar={(quantidade) => {
            // Ao marcar um aparelho com tipos (ar, geladeira, TV...), já abre as perguntas.
            if (item.quantidade === 0 && quantidade > 0 && temPerguntas) setAjustando(true);
            aoMudar({ quantidade });
          }}
          min={minimo}
          max={30}
          rotulo={`quantidade de ${item.nome}`}
        />
      </div>

      {ativo && valor !== undefined && (
        <p className="numeros mt-1 pl-14 text-[0.95rem] font-bold text-tinta-suave">
          <ValorAnimado valor={valor} formatar={(v) => formatarReais(v)} duracao={500} /> por mês{item.quantidade > 1 ? `, ${item.quantidade} unidades` : ""}
        </p>
      )}

      {ativo && ajustando && (
        <div className="surgir mt-3 space-y-4 border-t border-linha pt-3 sm:pl-14" style={{ animationDuration: "300ms" }}>
          {catalogo && <SeletorVariantes catalogo={catalogo} escolhas={item.variantes} aoMudar={aoMudar} />}
          {catalogo?.modo === "etiqueta" ? (
            <p className="text-[0.95rem] text-tinta-suave">Fica ligado o tempo todo e o motor liga e desliga sozinho. Consumo estimado: {Math.round(item.kwhMesInformado ?? 0)} kWh por mês.</p>
          ) : item.banho ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-bold">Banhos por dia</span>
                <Contador
                  valor={item.banho.banhosPorDia}
                  min={1}
                  max={20}
                  rotulo="banhos por dia"
                  aoMudar={(banhosPorDia) => aoMudar({ banho: { ...item.banho!, banhosPorDia }, minutosPorDia: banhosPorDia * item.banho!.minutosPorBanho })}
                />
              </div>
              <div className="space-y-2">
                <span className="block font-bold">Minutos de cada banho</span>
                <Pilulas
                  rotulo="Minutos de cada banho"
                  opcoes={[5, 8, 10, 15, 20].map((m) => ({ valor: m, rotulo: `${m} min` }))}
                  valor={item.banho.minutosPorBanho}
                  aoMudar={(minutosPorBanho) => aoMudar({ banho: { ...item.banho!, minutosPorBanho }, minutosPorDia: item.banho!.banhosPorDia * minutosPorBanho })}
                />
              </div>
            </>
          ) : (
            <>
              <SeletorFrequencia diasPorSemana={item.diasPorSemana} aoMudar={(diasPorSemana) => aoMudar({ diasPorSemana })} />
              <SeletorTempo minutosPorDia={item.minutosPorDia} diario={item.diasPorSemana >= 1} aoMudar={(minutosPorDia) => aoMudar({ minutosPorDia })} />
            </>
          )}
          <button type="button" onClick={() => setAjustando(false)} className="font-bold text-energia">
            Pronto
          </button>
        </div>
      )}
    </li>
  );
}
