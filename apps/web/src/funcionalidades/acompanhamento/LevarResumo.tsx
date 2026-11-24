"use client";

import { Share2 } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import type { Dica, ResumoCasa } from "@ee/core";
import { textoDoResumo } from "@/aplicacao/textoDoResumo";
import { Botao } from "@/ui/Botao";

type Situacao = "parado" | "copiado" | "falhou";

// O Web Share não muda enquanto a página está aberta: não há o que assinar. No servidor (e na hidratação) vale
// "copiar", e o botão troca para "compartilhar" logo depois, sem erro de hidratação.
const semAssinatura = () => () => {};
const temWebShare = () => typeof navigator.share === "function";
const noServidor = () => false;

/** Quem fecha a janela de compartilhar sem escolher nada não quer cópia nem aviso (critério 4 da HIS-105). */
const desistiu = (erro: unknown) => erro instanceof DOMException && erro.name === "AbortError";

/**
 * "Compartilhar resumo" (Web Share, só texto) ou, sem Web Share, "Copiar resumo". O texto vai só para onde a pessoa
 * escolher: nada passa pelo servidor. A região `status` fica sempre montada para o aviso de cópia ser anunciado.
 */
export function LevarResumo({ resumo, proximaDica }: { resumo: Pick<ResumoCasa, "conta" | "aparelhos">; proximaDica?: Pick<Dica, "titulo" | "economiaMes"> }) {
  const compartilha = useSyncExternalStore(semAssinatura, temWebShare, noServidor);
  const [situacao, setSituacao] = useState<Situacao>("parado");
  const [texto, setTexto] = useState("");

  async function levar() {
    const novo = textoDoResumo({ resumo, proximaDica, enderecoDoSite: location.origin });
    setTexto(novo);
    setSituacao("parado");
    if (compartilha) {
      try {
        await navigator.share({ text: novo });
        return;
      } catch (erro) {
        if (desistiu(erro)) return;
        // Outra falha (permissão, alvo indisponível): copia, como no navegador sem Web Share.
      }
    }
    try {
      await navigator.clipboard.writeText(novo);
      setSituacao("copiado");
    } catch {
      setSituacao("falhou");
    }
  }

  return (
    <div className="mt-6" data-sem-impressao>
      <div className="flex flex-wrap gap-3">
        <Botao variante="secundario" onClick={levar}>
          <Share2 className="size-5" aria-hidden />
          {compartilha ? "Compartilhar resumo" : "Copiar resumo"}
        </Botao>
        {/* A folha de impressão é só CSS (@media print em globals.css): a mesma tela, em preto e branco. */}
        <Botao variante="secundario" onClick={() => window.print()}>
          Imprimir
        </Botao>
      </div>
      <p role="status" className="mt-3 empty:mt-0">
        {situacao === "copiado" && "Resumo copiado. Agora é só colar na conversa ou no e-mail."}
        {situacao === "falhou" && "Não deu para copiar. Selecione o texto abaixo e copie."}
      </p>
      {situacao === "falhou" && (
        <textarea
          readOnly
          aria-label="Texto do resumo"
          value={texto}
          rows={8}
          ref={(campo) => campo?.select()}
          className="mt-3 w-full rounded-[var(--radius-controle)] bg-papel p-3 text-[0.95rem] text-tinta"
        />
      )}
    </div>
  );
}
