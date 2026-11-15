"use client";

import { Campo } from "@/ui/Campo";
import { Entrada } from "@/ui/Entrada";
import type { CamposDaContaEstado } from "./useCamposDaConta";

/**
 * Os dois campos da conta de luz (consumo e valor), iguais no cadastro, nos Ajustes e no acompanhamento. Os rótulos e
 * as ajudas continuam os de cada tela; o estado vem do `useCamposDaConta`, na tela que tem o botão de salvar.
 */
export function CamposDaConta({
  campos,
  textos,
  className,
}: {
  campos: CamposDaContaEstado;
  textos: { consumo: string; ajudaDoConsumo: string; valor: string; ajudaDoValor?: string };
  className?: string;
}) {
  const { ids, kwh, valor, alertaDoPreco } = campos;
  // O "Confere os dois números?" fica embaixo do valor, mas fala dos dois: o consumo também aponta para ele (T6).
  const alertaDoValor = valor.alerta ?? alertaDoPreco;
  const descreveOPreco = alertaDoPreco && !valor.erro && !valor.alerta ? `${ids.valor}-alerta` : undefined;
  return (
    <div className={className}>
      <Campo rotulo={textos.consumo} id={ids.kwh} ajuda={textos.ajudaDoConsumo} erro={kwh.erro} alerta={kwh.alerta}>
        <Entrada
          id={ids.kwh}
          inputMode="decimal"
          sufixo="kWh"
          placeholder="Ex.: 150"
          value={kwh.texto}
          onChange={(e) => kwh.aoMudar(e.target.value)}
          onBlur={kwh.aoSair}
          aria-describedby={descreveOPreco}
        />
      </Campo>
      <Campo rotulo={textos.valor} id={ids.valor} ajuda={textos.ajudaDoValor} erro={valor.erro} alerta={alertaDoValor}>
        <Entrada id={ids.valor} inputMode="decimal" prefixo="R$" placeholder="Ex.: 135,90" value={valor.texto} onChange={(e) => valor.aoMudar(e.target.value)} onBlur={valor.aoSair} />
      </Campo>
    </div>
  );
}
