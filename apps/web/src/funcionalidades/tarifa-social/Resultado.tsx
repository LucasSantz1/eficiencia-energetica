"use client";

import { CircleCheck, CircleMinus } from "lucide-react";
import type { Ref } from "react";
import { convocacaoAberta, salarioMinimoEmVigor, type ResultadoDaTarifaSocial } from "@ee/core/tarifa-social";
import { Aviso } from "@/ui/Aviso";
import { Botao, BotaoLink } from "@/ui/Botao";
import { AVISOS, BOTOES_DO_RESULTADO, explicarARenda, RESULTADOS } from "./textos";

type ResultadoCalculado = Extract<ResultadoDaTarifaSocial, { tipo: "resultado" }>;

/**
 * Resultado do guia: nunca "tem direito" e nunca só em cor (selo com ícone e texto). Os R$ do salário mínimo só
 * aparecem dentro da vigência (critério 4); depois dela, o aviso diz que o valor mudou.
 */
export function Resultado({ resultado, hoje, aoRecomecar, tituloRef }: { resultado: ResultadoCalculado; hoje: string; aoRecomecar: () => void; tituloRef: Ref<HTMLHeadingElement> }) {
  const { caso, comparacao, fazerCadUnico, trocarNomeDaConta } = resultado;
  const textos = RESULTADOS[caso];
  const podeTer = caso !== "D";
  const emVigor = salarioMinimoEmVigor(hoje);
  return (
    <div>
      <p className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-bold ${podeTer ? "bg-energia-claro text-energia-forte" : "bg-papel text-tinta"}`}>
        {podeTer ? <CircleCheck className="size-5" aria-hidden /> : <CircleMinus className="size-5" aria-hidden />}
        {textos.selo}
      </p>
      <h2 ref={tituloRef} tabIndex={-1} className="mt-3 text-[clamp(1.75rem,6vw,2.2rem)] leading-tight font-extrabold tracking-tight outline-none">
        {textos.titulo}
      </h2>
      <p className="mt-3 text-lg">{textos.texto}</p>
      {comparacao && emVigor && <p className="mt-3 text-tinta-suave">{explicarARenda(comparacao)}</p>}

      <div className="mt-6 space-y-3">
        {comparacao && !emVigor && <Aviso anunciar={false}>{AVISOS.salarioMinimoMudou}</Aviso>}
        {fazerCadUnico && <Aviso anunciar={false}>{AVISOS.fazerCadUnico}</Aviso>}
        {trocarNomeDaConta && <Aviso anunciar={false}>{AVISOS.trocarNomeDaConta}</Aviso>}
        {podeTer && convocacaoAberta(hoje) && (
          <Aviso tom="faisca" anunciar={false}>
            {AVISOS.convocacao}
          </Aviso>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Botao onClick={aoRecomecar}>{BOTOES_DO_RESULTADO.deNovo}</Botao>
        <BotaoLink href="/" variante="secundario" transitionTypes={["nav-back"]}>
          {BOTOES_DO_RESULTADO.inicio}
        </BotaoLink>
      </div>
    </div>
  );
}
