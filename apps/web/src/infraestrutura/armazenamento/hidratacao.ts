import { avisoDaCasaSalva, lerCasaSalva, type AvisoDaCasaSalva, type CasaLida, type DadosCasa } from "@ee/core";
import type { ArmazenamentoSeguro } from "@/infraestrutura/armazenamento/armazenamento-local";

/** O que vai para o localStorage: só os dados da casa (o aviso e as ações ficam fora). */
export function dadosSalvaveis({ residencia, comodos, aparelhos, contas, leituras, plano }: DadosCasa): DadosCasa {
  return { ...(residencia === undefined ? {} : { residencia }), comodos, aparelhos, contas, leituras, plano };
}

export interface CasaHidratada {
  casa: DadosCasa;
  aviso?: AvisoDaCasaSalva;
}

/**
 * Lê a casa salva no `merge` do `persist` (roda sempre, mesmo sem mudança de versão: falha P2 da seguranca).
 * O leitor não deveria lançar (R4d). Se lançar, é bug nosso, não dado da família: a tela abre vazia com o aviso
 * "nada aproveitável" e a gravação fica travada, para a casa salva não ser trocada por uma vazia na próxima ação
 * (pedido 1 da seguranca). Nada vai para o console: o erro poderia trazer dado da casa.
 */
export function lerCasaNaHidratacao(
  salvo: unknown,
  armazenamento: Pick<ArmazenamentoSeguro, "travarGravacao">,
  ler: (bruto: unknown) => CasaLida = lerCasaSalva,
): CasaHidratada {
  try {
    const lida = ler(salvo);
    const aviso = avisoDaCasaSalva(lida);
    return aviso === undefined ? { casa: lida.casa } : { casa: lida.casa, aviso };
  } catch {
    armazenamento.travarGravacao();
    return { casa: { comodos: [], aparelhos: [], contas: [], leituras: [], plano: [] }, aviso: { tipo: "nada-aproveitavel" } };
  }
}
