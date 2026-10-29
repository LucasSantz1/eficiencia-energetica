"use client";

import { consumoMensalKwh, formatarReais, formatarTempo, itemDoCatalogo, type PrecoKwh } from "@ee/core";
import { Contador } from "@/ui/Contador";
import { Icone } from "@/ui/Icone";
import { ValorAnimado } from "@/ui/Movimento";
import { Pilulas } from "@/ui/Pilulas";
import type { ItemComodo } from "./tipos";

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
