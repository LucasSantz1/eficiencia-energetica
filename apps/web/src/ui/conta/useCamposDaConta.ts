// Sem "use client" de propósito: só exporta um hook, usado por componentes que já são de cliente.

import { useState } from "react";
import { precoDaContaForaDoComum, type Beneficio, type ContaReferencia } from "@ee/core";
import type { AlertaDoCampo } from "@/ui/Campo";
import { indoParaUmBotao, useCampoNumerico, type CampoNumerico } from "@/ui/campos/useCampoNumerico";
import { focarPrimeiroErro } from "@/ui/foco";
import { confereOPrecoDaConta, faixaDoConsumoDaConta, faixaDoValorDaConta, mensagensDoConsumoDaConta, mensagensDoValorDaConta, TITULO_CONFERE_OS_DOIS, type UsoDaConta } from "./mensagensDaConta";

export interface IdsDaConta {
  kwh: string;
  valor: string;
}

export interface CamposDaContaEstado {
  ids: IdsDaConta;
  kwh: CampoNumerico;
  valor: CampoNumerico;
  /** "Confere os dois números?" (preço por kWh fora do comum), quando é para mostrar. Fica no campo do valor. */
  alertaDoPreco: AlertaDoCampo | undefined;
  /** Mostra as mensagens; se algo não passou, põe o foco no primeiro campo e devolve `undefined`. */
  conferir: () => ContaReferencia | undefined;
}

interface EstadoDoPreco {
  chave: unknown;
  mostrar: boolean;
  /** Par "kwh|valor" que a pessoa confirmou no "Sim". */
  confirmado: string | undefined;
}

/**
 * Consumo e valor de uma conta de luz, com o T5 e o T6 da HIS-003b: cada campo tem a faixa do uso (na calibração a
 * conta precisa ter consumo e valor; no acompanhamento o zero vale) e, com os dois preenchidos, o preço por kWh fora
 * do comum pergunta "Confere os dois números?" (nunca na Tarifa Social). `chave` muda quando a tela passa a editar
 * outra conta. Sem efeito: tudo é derivado na renderização.
 */
export function useCamposDaConta({ uso, beneficio, ids, inicial, chave }: { uso: UsoDaConta; beneficio: Beneficio | undefined; ids: IdsDaConta; inicial?: ContaReferencia; chave?: unknown }): CamposDaContaEstado {
  const kwh = useCampoNumerico({ faixa: faixaDoConsumoDaConta(uso), casas: 2, obrigatorio: true, mensagens: mensagensDoConsumoDaConta(uso), inicial: inicial?.kwh, chave });
  const valor = useCampoNumerico({ faixa: faixaDoValorDaConta(uso), casas: 2, obrigatorio: true, mensagens: mensagensDoValorDaConta(uso), inicial: inicial?.valor, chave, dinheiro: true });

  const parInicial = inicial ? `${inicial.kwh}|${inicial.valor}` : undefined;
  const [guardado, setGuardado] = useState<EstadoDoPreco>({ chave, mostrar: false, confirmado: parInicial });
  const estado = guardado.chave === chave ? guardado : { chave, mostrar: false, confirmado: parInicial };
  const mudar = (parcial: Partial<EstadoDoPreco>) => setGuardado({ ...estado, ...parcial });

  const conta = kwh.valorValido !== undefined && valor.valorValido !== undefined ? { kwh: kwh.valorValido, valor: valor.valorValido } : undefined;
  const preco = conta && beneficio ? precoDaContaForaDoComum(conta, beneficio) : undefined;
  const par = conta ? `${conta.kwh}|${conta.valor}` : undefined;
  const precoPendente = preco !== undefined && par !== estado.confirmado;

  // O alerta do preço aparece ao sair de um dos dois campos (ou no continuar), nunca a cada tecla.
  const comPreco = (campo: CampoNumerico): CampoNumerico => ({
    ...campo,
    aoMudar: (texto) => {
      campo.aoMudar(texto);
      if (estado.mostrar) mudar({ mostrar: false });
    },
    aoSair: (evento) => {
      campo.aoSair(evento);
      if (precoPendente && !indoParaUmBotao(evento)) mudar({ mostrar: true });
    },
  });

  return {
    ids,
    kwh: comPreco(kwh),
    valor: comPreco(valor),
    alertaDoPreco:
      estado.mostrar && precoPendente && conta && preco !== undefined
        ? {
            titulo: TITULO_CONFERE_OS_DOIS,
            texto: confereOPrecoDaConta(conta.kwh, conta.valor, preco),
            aoConfirmar: () => mudar({ mostrar: false, confirmado: par }),
            aoCorrigir: () => mudar({ mostrar: false }),
          }
        : undefined,
    conferir: () => {
      const resultadoKwh = kwh.conferir();
      const resultadoValor = valor.conferir();
      if (resultadoKwh === "ok" && resultadoValor === "ok" && precoPendente) mudar({ mostrar: true });
      const naoPassou = focarPrimeiroErro([
        { id: ids.kwh, resultado: resultadoKwh },
        { id: ids.valor, resultado: resultadoValor === "ok" && precoPendente ? "alerta" : resultadoValor },
      ]);
      return naoPassou ? undefined : conta;
    },
  };
}
