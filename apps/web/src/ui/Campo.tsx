"use client";

import { CircleAlert, CircleHelp } from "lucide-react";
import { createContext, type ReactNode } from "react";
import { Botao } from "@/ui/Botao";

/** "Confere?" do T6: valor possível, mas raro. A tela só salva depois do "Sim, está certo". */
export interface AlertaDoCampo {
  titulo: string;
  texto: string;
  aoConfirmar: () => void;
  aoCorrigir: () => void;
}

/** O que o `Campo` passa para a `Entrada` (D1.3 da HIS-003a): sem `cloneElement`, as telas só dão `erro`/`alerta`. */
export interface ContextoDoCampo {
  id: string;
  /** Ids do erro ou do alerta e da ajuda, na ordem em que o leitor de tela deve ler. */
  idsDescricao: string | undefined;
  invalido: boolean;
  emAlerta: boolean;
}

export const CampoContexto = createContext<ContextoDoCampo | undefined>(undefined);

/**
 * Rótulo, entrada, mensagem (T5 erro, T6 "Confere?") e ajuda. A região `aria-live` fica sempre na página, vazia quando
 * está tudo certo, para o leitor anunciar a mensagem que entra ao sair do campo. Os botões do "Confere?" ficam fora
 * dela (o leitor lê a pergunta, e não "Sim, está certo, Corrigir") e nenhum recebe o foco sozinho: um Enter sem querer
 * não pode confirmar um valor errado.
 */
export function Campo({ rotulo, ajuda, children, id, erro, alerta }: { rotulo: string; ajuda?: ReactNode; children: ReactNode; id: string; erro?: string; alerta?: AlertaDoCampo }) {
  // O erro ganha: os dois nunca aparecem juntos.
  const alertaVisivel = erro ? undefined : alerta;
  const idMensagem = erro ? `${id}-erro` : alertaVisivel ? `${id}-alerta` : undefined;
  const idsDescricao = [idMensagem, ajuda ? `${id}-ajuda` : undefined].filter(Boolean).join(" ") || undefined;

  const voltarParaAEntrada = (selecionar: boolean) => {
    const entrada = document.getElementById(id);
    if (!(entrada instanceof HTMLInputElement)) return;
    entrada.focus();
    if (selecionar) entrada.select();
  };

  return (
    // Margens só para baixo de cada parte (e não `space-y`): a região vazia não muda nenhum pixel do campo sem mensagem.
    <div>
      <label htmlFor={id} className="mb-2 block font-bold">
        {rotulo}
      </label>
      <CampoContexto value={{ id, idsDescricao, invalido: Boolean(erro), emAlerta: Boolean(alertaVisivel) }}>{children}</CampoContexto>
      <div aria-live="polite">
        {erro && (
          <p id={`${id}-erro`} className="mt-2 flex gap-2 font-bold text-alerta">
            <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
            <span>{erro}</span>
          </p>
        )}
        {alertaVisivel && (
          <p id={`${id}-alerta`} className="surgir mt-2 flex gap-2 rounded-[var(--radius-controle)] bg-faisca-claro px-4 py-3 leading-snug text-tinta">
            <CircleHelp className="mt-0.5 size-5 shrink-0" aria-hidden />
            <span>
              <strong>{alertaVisivel.titulo}</strong> {alertaVisivel.texto}
            </span>
          </p>
        )}
      </div>
      {alertaVisivel && (
        <div className="mt-2 flex flex-col gap-2 min-[400px]:flex-row">
          <Botao
            variante="secundario"
            onClick={() => {
              alertaVisivel.aoConfirmar();
              // O botão some com o alerta: o foco volta para a entrada, e não cai no começo da página.
              voltarParaAEntrada(false);
            }}
          >
            Sim, está certo
          </Botao>
          <Botao
            variante="fantasma"
            onClick={() => {
              alertaVisivel.aoCorrigir();
              voltarParaAEntrada(true);
            }}
          >
            Corrigir
          </Botao>
        </div>
      )}
      {ajuda && (
        <p id={`${id}-ajuda`} className="mt-2 text-[0.95rem] leading-snug text-tinta-suave">
          {ajuda}
        </p>
      )}
    </div>
  );
}
