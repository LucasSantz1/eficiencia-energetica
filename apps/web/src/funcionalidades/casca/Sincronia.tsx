"use client";

import { dispensarAvisoDeOutroAparelho, escolherCasa, useSincronia } from "@/aplicacao/conta";
import { Aviso } from "@/ui/Aviso";
import { Botao } from "@/ui/Botao";

/**
 * Sincronização da casa com a conta (E4). Só baixa quando há conta ligada (o `import("./Sincronia")` da Casca): quem
 * usa sem conta não carrega nada disto.
 */
export function Sincronia({ carregada }: { carregada: boolean }) {
  const sincronia = useSincronia(carregada);
  if (sincronia.tipo === "escolher") {
    return (
      <div className="mb-6">
        <Aviso tom="faisca">
          <strong>A casa deste aparelho é diferente da que está na sua conta.</strong> Qual delas fica? A outra é trocada.
          <span className="mt-3 flex flex-wrap gap-2">
            <Botao variante="secundario" onClick={() => escolherCasa("deste-aparelho")}>
              Usar a deste aparelho
            </Botao>
            <Botao variante="secundario" onClick={() => escolherCasa("da-conta")}>
              Usar a da conta
            </Botao>
          </span>
        </Aviso>
      </div>
    );
  }
  if (sincronia.tipo === "atualizada-de-outro-aparelho") {
    return (
      <div className="mb-6">
        <Aviso>
          Trouxemos a casa que foi salva em outro aparelho.{" "}
          <button type="button" onClick={dispensarAvisoDeOutroAparelho} className="min-h-11 font-bold underline underline-offset-2">
            Entendi
          </button>
        </Aviso>
      </div>
    );
  }
  return null;
}
