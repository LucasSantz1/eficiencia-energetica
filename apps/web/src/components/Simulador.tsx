"use client";

import { aparelhoInicial, bandeiraDoMes, competenciaAtual, consumoMensalKwh, formatarKwh, formatarReais, formatarTempo, itemDoCatalogo, precoKwh } from "@ee/core";
import { useMemo, useState } from "react";
import { useTarifas } from "@/aplicacao/dados-publicos";
import { tarifaMedia } from "@/aplicacao/resumo";
import { Icone } from "@/ui/Icone";
import { Contador } from "@/ui/Contador";

const OPCOES = [
  { id: "chuveiro", rotulo: "Chuveiro", min: 2, max: 30, passo: 1, unidade: "min", pergunta: "Minutos de cada banho" },
  { id: "ar-condicionado", rotulo: "Ar-condicionado", min: 1, max: 24, passo: 1, unidade: "h", pergunta: "Horas ligado por noite" },
  { id: "tv", rotulo: "TV", min: 1, max: 24, passo: 1, unidade: "h", pergunta: "Horas ligada por dia" },
  { id: "ferro", rotulo: "Ferro", min: 1, max: 7, passo: 1, unidade: "dias", pergunta: "Dias por semana, 1 hora cada" },
] as const;

type IdOpcao = (typeof OPCOES)[number]["id"];

const INICIAL: Record<IdOpcao, number> = { chuveiro: 10, "ar-condicionado": 8, tv: 5, ferro: 2 };

/** Simulador da página inicial: muda o tempo de uso e vê o valor mudar na hora. */
export function Simulador() {
  const tarifas = useTarifas();
  const [escolhido, setEscolhido] = useState<IdOpcao>("chuveiro");
  const [valores, setValores] = useState(INICIAL);
  const opcao = OPCOES.find((o) => o.id === escolhido)!;
  const item = itemDoCatalogo(escolhido)!;
  const valor = valores[escolhido];

  const { kwh, reais, temTarifa } = useMemo(() => {
    const media = tarifaMedia(tarifas.dados);
    const bandeira = tarifas.dados ? bandeiraDoMes(tarifas.dados.bandeiras, competenciaAtual()) : undefined;
    const preco = precoKwh({}, media ?? { tarifaKwh: 0.8 }, bandeira?.bandeira);
    // Parte do aparelho típico do catálogo (com o tipo mais comum já escolhido) e muda só o tempo.
    const base = aparelhoInicial(item);
    const aparelho =
      escolhido === "chuveiro"
        ? { ...base, minutosPorDia: valor, diasPorSemana: 7 }
        : escolhido === "ferro"
          ? { ...base, minutosPorDia: 60, diasPorSemana: valor }
          : { ...base, minutosPorDia: valor * 60, diasPorSemana: 7 };
    const kwh = consumoMensalKwh(aparelho);
    return { kwh, reais: kwh * preco.valor, temTarifa: Boolean(media) };
  }, [tarifas.dados, escolhido, valor, item]);

  return (
    <section aria-labelledby="simulador-titulo" className="rounded-[1.75rem] bg-tinta p-5 text-white sm:p-7">
      <h2 id="simulador-titulo" className="text-lg font-bold text-white/80">
        Experimente
      </h2>
      <div role="tablist" aria-label="Aparelho" className="mt-3 flex flex-wrap gap-2">
        {OPCOES.map((o) => {
          const ativo = o.id === escolhido;
          return (
            <button
              key={o.id}
              role="tab"
              aria-selected={ativo}
              onClick={() => setEscolhido(o.id)}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-bold transition-colors ${ativo ? "bg-faisca text-tinta" : "bg-white/10 text-white hover:bg-white/20"}`}
            >
              <Icone nome={itemDoCatalogo(o.id)?.icone} className="size-5" />
              {o.rotulo}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <span className="font-bold">{opcao.pergunta}</span>
        <div className="text-tinta">
          <Contador valor={valor} aoMudar={(v) => setValores((s) => ({ ...s, [escolhido]: v }))} min={opcao.min} max={opcao.max} passo={opcao.passo} unidade={opcao.unidade} rotulo={opcao.pergunta} />
        </div>
      </div>

      <div className="mt-6 border-t border-white/15 pt-5" aria-live="polite">
        <p className="text-white/75">
          {escolhido === "chuveiro" ? `1 banho por dia de ${formatarTempo(valor)}` : escolhido === "ferro" ? `${valor} ${valor === 1 ? "dia" : "dias"} por semana` : `${formatarTempo(valor * 60)} por dia`}
          {" custa por mês"}
        </p>
        <p className="numeros mt-1 text-[clamp(2.75rem,10vw,4.25rem)] leading-none font-extrabold tracking-tight text-faisca">{formatarReais(reais)}</p>
        <p className="mt-2 text-white/75">
          {formatarKwh(kwh)} com {item.nome.toLowerCase()} de {item.potenciaW.toLocaleString("pt-BR")} W
        </p>
      </div>
      <p className="mt-5 text-[0.9rem] leading-snug text-white/60">
        {temTarifa ? "Pela tarifa média das distribuidoras do Brasil, com a bandeira do mês e sem impostos." : "Com uma tarifa de referência, sem impostos."} Na sua casa, usamos a tarifa da sua cidade.
      </p>
    </section>
  );
}
