"use client";

import { aplicarVariantes, formatarTempo, FREQUENCIAS, frequenciaMaisProxima, TEMPOS_RAPIDOS, type Aparelho, type ItemCatalogo } from "@ee/core";
import { useState } from "react";
import { Contador } from "@/ui/Contador";
import { Pilulas } from "@/ui/Pilulas";

/**
 * Perguntas sobre o modelo do aparelho (tipo, tamanho, idade...). Cada resposta recalcula
 * potência, consumo e quanto o motor trabalha, a partir do catálogo.
 */
export function SeletorVariantes({ catalogo, escolhas, aoMudar }: { catalogo: ItemCatalogo; escolhas?: Record<string, string>; aoMudar: (parcial: Partial<Aparelho>) => void }) {
  if (!catalogo.variantes?.length) return null;
  const atuais = { ...Object.fromEntries(catalogo.variantes.map((v) => [v.id, v.padrao])), ...escolhas };
  return (
    <div className="space-y-4">
      {catalogo.variantes.map((v) => {
        const escolhida = v.opcoes.find((o) => o.id === atuais[v.id]);
        return (
          <div key={v.id} className="space-y-2">
            <span className="block font-bold">{v.pergunta}</span>
            <Pilulas rotulo={v.pergunta} opcoes={v.opcoes.map((o) => ({ valor: o.id, rotulo: o.rotulo }))} valor={atuais[v.id]} aoMudar={(id) => aoMudar(aplicarVariantes(catalogo, { ...atuais, [v.id]: id }))} />
            {(escolhida?.descricao || v.ajuda) && <p className="text-[0.92rem] leading-snug text-tinta-suave">{escolhida?.descricao ?? v.ajuda}</p>}
          </div>
        );
      })}
    </div>
  );
}

/** Com que frequência: todo dia, alguns dias por semana ou poucas vezes por mês. */
export function SeletorFrequencia({ diasPorSemana, aoMudar }: { diasPorSemana: number; aoMudar: (dias: number) => void }) {
  const atual = frequenciaMaisProxima(diasPorSemana);
  return (
    <div className="space-y-2">
      <span className="block font-bold">Com que frequência usa?</span>
      <Pilulas rotulo="Frequência de uso" opcoes={FREQUENCIAS.map((f) => ({ valor: f.rotulo, rotulo: f.rotulo }))} valor={atual.rotulo} aoMudar={(rotulo) => aoMudar(FREQUENCIAS.find((f) => f.rotulo === rotulo)!.diasPorSemana)} />
    </div>
  );
}

/**
 * Por quanto tempo fica ligado em cada dia de uso: de 2 minutos ao dia inteiro,
 * com ajuste fino minuto a minuto em "Outro tempo".
 */
export function SeletorTempo({ minutosPorDia, aoMudar, diario }: { minutosPorDia: number; aoMudar: (minutos: number) => void; diario: boolean }) {
  const naLista = TEMPOS_RAPIDOS.some((t) => t.minutos === minutosPorDia);
  const [livre, setLivre] = useState(!naLista);
  const horas = Math.floor(minutosPorDia / 60);
  const minutos = minutosPorDia % 60;
  return (
    <div className="space-y-2">
      <span className="block font-bold">{diario ? "Quanto tempo fica ligado por dia?" : "Quanto tempo fica ligado cada vez que usa?"}</span>
      <Pilulas
        rotulo="Tempo ligado"
        opcoes={[...TEMPOS_RAPIDOS.map((t) => ({ valor: String(t.minutos), rotulo: t.rotulo })), { valor: "outro", rotulo: "Outro tempo" }]}
        valor={livre ? "outro" : String(minutosPorDia)}
        aoMudar={(v) => {
          if (v === "outro") setLivre(true);
          else {
            setLivre(false);
            aoMudar(Number(v));
          }
        }}
      />
      {livre && (
        <div className="surgir flex flex-wrap gap-4 rounded-[var(--radius-controle)] bg-fundo p-3" style={{ animationDuration: "250ms" }}>
          <div className="space-y-1">
            <span className="block text-[0.95rem] font-bold text-tinta-suave">Horas</span>
            <Contador compacto valor={horas} min={0} max={24} rotulo="horas" aoMudar={(h) => aoMudar(Math.max(1, Math.min(1440, h * 60 + (h === 24 ? 0 : minutos))))} />
          </div>
          <div className="space-y-1">
            <span className="block text-[0.95rem] font-bold text-tinta-suave">Minutos</span>
            <Contador compacto valor={minutos} min={horas === 0 ? 1 : 0} max={59} rotulo="minutos" aoMudar={(m) => aoMudar(Math.min(1440, horas * 60 + m))} />
          </div>
          <p className="w-full text-[0.92rem] text-tinta-suave">Total: {formatarTempo(minutosPorDia)}{diario ? " por dia" : " cada vez"}.</p>
        </div>
      )}
    </div>
  );
}
