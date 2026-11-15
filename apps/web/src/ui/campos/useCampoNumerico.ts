// Sem "use client" de propósito: só exporta um hook, usado por componentes que já são de cliente.

import { useState } from "react";
import type { Faixa } from "@ee/core";
import type { AlertaDoCampo } from "@/ui/Campo";
import { TITULO_CONFERE, type MensagensDoCampo } from "./mensagens";
import { situacaoDoCampo, textoDoNumero, type SituacaoDoCampo } from "./situacaoDoCampo";

export type ResultadoDaConferencia = SituacaoDoCampo["tipo"];

interface Estado {
  /** Muda quando a tela passa a editar outra coisa (outro aparelho, outra conta): aí o campo volta ao `inicial`. */
  chave: unknown;
  texto: string;
  /** A mensagem só aparece ao sair do campo ou no `conferir()`, nunca a cada tecla (T5). */
  mostrar: boolean;
  /** Número que a pessoa confirmou no "Sim, está certo": para ele o "Confere?" não volta. */
  confirmado: number | undefined;
}

export interface CampoNumerico {
  texto: string;
  aoMudar: (texto: string) => void;
  aoSair: () => void;
  /** Mensagem do T5 para o `Campo`, quando é para mostrar. */
  erro: string | undefined;
  /** "Confere?" do T6 para o `Campo`, quando é para mostrar. */
  alerta: AlertaDoCampo | undefined;
  /** Número que pode ser salvo agora (dentro do rígido e, se raro, já confirmado). */
  valorValido: number | undefined;
  /** Número que a tela entendeu, mesmo que ainda espere o "Sim" (para a prévia do custo). */
  valorLido: number | undefined;
  /** Mostra a mensagem e diz à tela o que fazer: salvar (`ok`), focar o erro ou esperar o "Sim". */
  conferir: () => ResultadoDaConferencia;
}

/**
 * Estado de um campo de número (T5 e T6 da HIS-003b). Só estado derivado e handlers: nenhum efeito que copia estado
 * (a HIS-109 só desce). A troca de `chave` volta o campo ao `inicial` já na renderização, sem efeito.
 */
export function useCampoNumerico({
  faixa,
  casas,
  obrigatorio,
  mensagens,
  inicial,
  chave,
  dinheiro = false,
}: {
  faixa: Faixa;
  casas: 0 | 2;
  obrigatorio: boolean;
  mensagens: MensagensDoCampo;
  inicial?: number;
  chave?: unknown;
  /** Mostra o `inicial` com centavos ("135,90"). */
  dinheiro?: boolean;
}): CampoNumerico {
  // O valor que já estava salvo passou pelo "Confere?" quando foi salvo: editar outra coisa não pergunta de novo.
  const novo = (): Estado => ({ chave, texto: textoDoNumero(inicial, dinheiro), mostrar: false, confirmado: inicial });
  const [guardado, setGuardado] = useState<Estado>(novo);
  const estado = guardado.chave === chave ? guardado : novo();

  const regra = { faixa, casas, obrigatorio, mensagens };
  const situacao = situacaoDoCampo(estado.texto, regra, estado.confirmado);
  const mudar = (parcial: Partial<Estado>) => setGuardado({ ...estado, ...parcial });

  return {
    texto: estado.texto,
    aoMudar: (texto) => {
      // Depois que a mensagem aparece, ela some na tecla que deixa o valor certo; o próximo erro espera sair do campo.
      const ficouCerto = situacaoDoCampo(texto, regra, estado.confirmado).tipo === "ok";
      mudar({ texto, mostrar: estado.mostrar && !ficouCerto });
    },
    aoSair: () => {
      // Entrar e sair sem digitar nada não acusa erro; vazio depois de apagar, sim.
      if (estado.texto !== textoDoNumero(inicial, dinheiro) || estado.texto.trim() !== "") mudar({ mostrar: true });
    },
    erro: estado.mostrar && situacao.tipo === "erro" ? situacao.mensagem : undefined,
    alerta:
      estado.mostrar && situacao.tipo === "alerta"
        ? {
            titulo: TITULO_CONFERE,
            texto: situacao.texto,
            aoConfirmar: () => mudar({ confirmado: situacao.valor, mostrar: false }),
            aoCorrigir: () => mudar({ mostrar: false }),
          }
        : undefined,
    valorValido: situacao.tipo === "ok" ? situacao.valor : undefined,
    valorLido: situacao.tipo === "erro" ? undefined : situacao.valor,
    conferir: () => {
      if (!estado.mostrar) mudar({ mostrar: true });
      return situacao.tipo;
    },
  };
}
