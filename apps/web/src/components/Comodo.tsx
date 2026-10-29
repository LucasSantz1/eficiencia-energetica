"use client";

import {
  consumoMensalKwh,
  formatarReais,
  formatarTempo,
  horasPorDiaMedia,
  itemDoCatalogo,
  TEMPOS_RAPIDOS,
  type Aparelho,
  type PrecoKwh,
} from "@ee/core";
import { useState } from "react";
import { Icone } from "./Icone";
import { ValorAnimado } from "./Movimento";
import { Contador, Pilulas } from "./ui";

/** Aparelho em edição (no cadastro ainda não tem id definitivo). */
export type ItemComodo = Omit<Aparelho, "id" | "comodoId"> & { id: string };

const DIAS = [
  { valor: 7, rotulo: "Todo dia" },
  { valor: 5, rotulo: "5 dias" },
  { valor: 3, rotulo: "3 dias" },
  { valor: 2, rotulo: "2 dias" },
  { valor: 1, rotulo: "1 dia" },
];

/** Frase curta com o tempo de uso estimado, como aparece nas listas. */
export function descreverUso(a: Pick<Aparelho, "minutosPorDia" | "diasPorSemana" | "kwhMesInformado" | "banho">): string {
  if (a.kwhMesInformado !== undefined) return "Fica ligada o dia todo";
  if (a.banho) return `${a.banho.banhosPorDia} ${a.banho.banhosPorDia === 1 ? "banho" : "banhos"} de ${a.banho.minutosPorBanho} min por dia`;
  const tempo = a.minutosPorDia >= 1440 ? "o dia todo" : `${formatarTempo(a.minutosPorDia)} por dia`;
  if (a.diasPorSemana >= 7) return `Ligado ${tempo}`;
  return `Ligado ${tempo}, ${a.diasPorSemana} ${a.diasPorSemana === 1 ? "dia" : "dias"} por semana`;
}

/** Média de uso em horas por dia, para o painel ("≈ 2,1 h/dia"). */
export function horasPorDiaTexto(a: Pick<Aparelho, "minutosPorDia" | "diasPorSemana" | "kwhMesInformado">): string {
  const h = horasPorDiaMedia(a);
  if (h >= 24) return "24 h/dia";
  if (h < 1) return `${Math.round(h * 60)} min/dia`;
  return `${h.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} h/dia`;
}

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
  const opcoesTempo = [...new Set([...TEMPOS_RAPIDOS.map((t) => t.minutos), item.minutosPorDia])].sort((a, b) => a - b);

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
            </button>
          )}
        </div>
        <Contador compacto valor={item.quantidade} aoMudar={(quantidade) => aoMudar({ quantidade })} min={minimo} max={30} rotulo={`quantidade de ${item.nome}`} />
      </div>

      {ativo && valor !== undefined && (
        <p className="numeros mt-1 pl-14 text-[0.95rem] font-bold text-tinta-suave">
          <ValorAnimado valor={valor} formatar={(v) => formatarReais(v)} duracao={500} /> por mês{item.quantidade > 1 ? `, ${item.quantidade} unidades` : ""}
        </p>
      )}

      {ativo && ajustando && (
        <div className="surgir mt-3 space-y-4 border-t border-linha pt-3 sm:pl-14" style={{ animationDuration: "300ms" }}>
          {catalogo?.modo === "etiqueta" ? (
            <p className="text-[0.95rem] text-tinta-suave">Geladeiras e freezers ficam ligados o tempo todo; o consumo vem da etiqueta ({Math.round(item.kwhMesInformado ?? 0)} kWh por mês).</p>
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
              <div className="space-y-2">
                <span className="block font-bold">Quanto tempo ligado por dia?</span>
                <Pilulas rotulo="Tempo por dia" opcoes={opcoesTempo.map((m) => ({ valor: m, rotulo: m >= 1440 ? "O dia todo" : formatarTempo(m) }))} valor={item.minutosPorDia} aoMudar={(minutosPorDia) => aoMudar({ minutosPorDia })} />
              </div>
              <div className="space-y-2">
                <span className="block font-bold">Em quantos dias da semana?</span>
                <Pilulas rotulo="Dias por semana" opcoes={DIAS} valor={item.diasPorSemana} aoMudar={(diasPorSemana) => aoMudar({ diasPorSemana })} />
              </div>
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

const TIPOS = [
  { id: "lampada-led", rotulo: "LED" },
  { id: "lampada-fluorescente", rotulo: "Fluorescente" },
  { id: "lampada-incandescente", rotulo: "Amarela antiga" },
];

const HORAS_LUZ = [
  { valor: 60, rotulo: "1 h" },
  { valor: 180, rotulo: "3 h" },
  { valor: 300, rotulo: "5 h" },
  { valor: 480, rotulo: "8 h" },
  { valor: 720, rotulo: "A noite toda" },
];

/** Iluminação do cômodo: quantas lâmpadas, de que tipo e por quanto tempo ficam acesas. */
export function BlocoIluminacao({ lampada, aoMudar, preco }: { lampada: ItemComodo; aoMudar: (parcial: Partial<ItemComodo>) => void; preco?: PrecoKwh }) {
  const ativo = lampada.quantidade > 0;
  const valor = preco ? consumoMensalKwh(lampada) * preco.valor : undefined;
  const horas = [...new Set([...HORAS_LUZ.map((h) => h.valor), lampada.minutosPorDia])].sort((a, b) => a - b);
  return (
    <div className="rounded-[var(--radius-controle)] border-2 border-faisca/60 bg-faisca-claro px-3 py-3 sm:px-4">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-faisca text-tinta">
          <Icone nome="lightbulb" className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <span className="block font-bold">Lâmpadas</span>
          <span className="block text-[0.95rem] text-tinta-suave">{ativo ? `Acesas ${lampada.minutosPorDia >= 720 ? "a noite toda" : formatarTempo(lampada.minutosPorDia)} por dia` : "Nenhuma lâmpada neste cômodo"}</span>
        </div>
        <Contador compacto valor={lampada.quantidade} aoMudar={(quantidade) => aoMudar({ quantidade })} min={0} max={40} rotulo="quantidade de lâmpadas" />
      </div>
      {ativo && (
        <div className="surgir mt-3 space-y-3 border-t border-faisca/50 pt-3 sm:pl-14" style={{ animationDuration: "300ms" }}>
          <div className="space-y-2">
            <span className="block text-[0.95rem] font-bold">Tipo</span>
            <Pilulas
              rotulo="Tipo de lâmpada"
              opcoes={TIPOS.map((t) => ({ valor: t.id, rotulo: t.rotulo }))}
              valor={lampada.catalogoId}
              aoMudar={(catalogoId) => {
                const item = itemDoCatalogo(catalogoId)!;
                aoMudar({ catalogoId, nome: item.nome, potenciaW: item.potenciaW });
              }}
            />
          </div>
          <div className="space-y-2">
            <span className="block text-[0.95rem] font-bold">Acesas por dia</span>
            <Pilulas rotulo="Horas acesas por dia" opcoes={horas.map((m) => ({ valor: m, rotulo: HORAS_LUZ.find((h) => h.valor === m)?.rotulo ?? formatarTempo(m) }))} valor={lampada.minutosPorDia} aoMudar={(minutosPorDia) => aoMudar({ minutosPorDia })} />
          </div>
          {valor !== undefined && (
            <p className="numeros text-[0.95rem] font-bold text-tinta-suave">
              <ValorAnimado valor={valor} formatar={(v) => formatarReais(v)} duracao={500} /> por mês com iluminação
            </p>
          )}
        </div>
      )}
    </div>
  );
}
