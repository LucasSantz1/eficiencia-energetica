// Sem "use client": função pura (testada no vitest), usada pelo useCampoNumerico.

import { lerNumeroDigitado, validarFaixa, type Faixa } from "@ee/core";
import type { MensagensDoCampo } from "./mensagens";

export interface RegraDoCampo {
  faixa: Faixa;
  casas: 0 | 2;
  obrigatorio: boolean;
  mensagens: MensagensDoCampo;
}

/**
 * O que o texto digitado é, com as mesmas funções que o store usa (`lerNumeroDigitado` e `validarFaixa`): a tela confere
 * antes e só chama a ação com valor que o store aceita (HIS-003b). `valor` é o número que a tela entendeu.
 * - `ok`: pode salvar (`valor` vazio só quando o campo não é obrigatório e está em branco).
 * - `alerta`: possível, mas raro; só salva depois do "Sim, está certo".
 * - `erro`: impossível ou mal escrito; não salva.
 */
export type SituacaoDoCampo = { tipo: "ok"; valor: number | undefined } | { tipo: "alerta"; valor: number; texto: string } | { tipo: "erro"; mensagem: string };

/** `confirmado` é o número que a pessoa já disse que está certo: para ele, o alerta não volta. */
export function situacaoDoCampo(texto: string, regra: RegraDoCampo, confirmado?: number): SituacaoDoCampo {
  const { faixa, casas, obrigatorio, mensagens } = regra;
  const lido = lerNumeroDigitado(texto, casas);
  if (lido.tipo === "vazio") return obrigatorio ? { tipo: "erro", mensagem: mensagens.vazio } : { tipo: "ok", valor: undefined };
  if (lido.tipo === "mal-escrito") return { tipo: "erro", mensagem: mensagens.malEscrito };

  const valor = lido.valor;
  const resultado = validarFaixa(faixa, valor);
  if (resultado === "fora") return { tipo: "erro", mensagem: valor === 0 && mensagens.zero ? mensagens.zero : mensagens.fora };
  if (resultado === "alerta" && mensagens.confere && valor !== confirmado) return { tipo: "alerta", valor, texto: mensagens.confere(valor) };
  return { tipo: "ok", valor };
}

/** Texto inicial de um número salvo, no jeito brasileiro. Dinheiro sempre com centavos ("135,90"), como antes. */
export function textoDoNumero(valor: number | undefined, dinheiro = false): string {
  if (valor === undefined || !Number.isFinite(valor)) return "";
  return (dinheiro ? valor.toFixed(2) : String(valor)).replace(".", ",");
}
