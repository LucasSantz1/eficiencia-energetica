// Sem "use client": só textos, usados por componentes que já são de cliente.

/**
 * Peças comuns dos textos do T5 (valor impossível) e do T6 ("Confere?", valor raro) da HIS-003b, escritos pela
 * ux-acessibilidade. Os textos de cada campo ficam perto de quem usa (`ui/aparelho/mensagensDoAparelho.ts`,
 * `ui/conta/mensagensDaConta.ts`...): o Turbopack copia o módulo inteiro em cada página que o importa, e um arquivo só
 * com tudo levaria os textos do aparelho para a Minha casa e os da conta para os cômodos (peso, HIS-003b).
 * Nenhum número de faixa fica nos textos: o mínimo, o máximo e as referências vêm do `limites.ts` e do catálogo.
 */
export interface MensagensDoCampo {
  /** Campo vazio (só quando o campo é obrigatório). */
  vazio: string;
  malEscrito: string;
  fora: string;
  /** Zero que não vale (potência; conta usada para calibrar). Sem ele, o zero usa `fora`. */
  zero?: string;
  /** Texto do "Confere?" para o valor que a tela entendeu. Sem ele, o campo não tem alerta. */
  confere?: (valor: number) => string;
}

export const TITULO_CONFERE = "Confere?";

/** Números com vírgula (kWh, valor) mal escritos, como "1,2,5". */
export const MAL_ESCRITO_COM_VIRGULA = "Digite só o número. Para centavos, use vírgula: 135,90.";

/** T5, nomes vazios. */
export const NOME_DO_COMODO_VAZIO = "Dê um nome ao cômodo, por exemplo: Quarto do casal.";
export const NOME_DO_APARELHO_VAZIO = "Dê um nome ao aparelho, por exemplo: Geladeira.";

