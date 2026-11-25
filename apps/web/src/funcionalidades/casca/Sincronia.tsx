"use client";

import { escolherCasa, responderEnvio, sair, useConta, useSincronia } from "@/aplicacao/conta";
import { Aviso } from "@/ui/Aviso";
import { Botao } from "@/ui/Botao";

/**
 * Sincronização da casa com a conta (E4). Só baixa quando há conta ligada (o `import("./Sincronia")` da Casca): quem
 * usa sem conta não carrega nada disto. Toda decisão que manda ou troca a casa é da pessoa, com o e-mail da conta à
 * vista (A1 e M4 da seguranca).
 */
export function Sincronia({ carregada }: { carregada: boolean }) {
  const sincronia = useSincronia(carregada);
  const conta = useConta();
  const email = conta.tipo === "conectada" ? conta.email : "";
  if (sincronia.tipo === "perguntar-envio") {
    return (
      <div className="mb-6">
        <Aviso tom="faisca">
          <strong>
            Guardar a casa deste aparelho na conta <span className="break-all">{email}</span>?
          </strong>{" "}
          Assim ela abre em outro aparelho e nos links da família. Se essa conta não é sua, toque em &quot;Sair da conta&quot;.
          <span className="mt-3 flex flex-wrap gap-2">
            <Botao variante="secundario" onClick={() => responderEnvio(true)}>
              Guardar na conta
            </Botao>
            <Botao variante="secundario" onClick={() => responderEnvio(false)}>
              Agora não
            </Botao>
            <Botao variante="fantasma" onClick={() => void sair()}>
              Sair da conta
            </Botao>
          </span>
        </Aviso>
      </div>
    );
  }
  if (sincronia.tipo === "escolher") {
    return (
      <div className="mb-6">
        <Aviso tom="faisca">
          <strong>
            {sincronia.porOutroAparelho
              ? "A casa mudou em outro aparelho, e este aparelho também tem mudanças."
              : "A casa deste aparelho é diferente da que está na sua conta."}
          </strong>{" "}
          Qual delas fica? A outra é trocada.
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
  if (sincronia.tipo === "versao-antiga") {
    return (
      <div className="mb-6">
        <Aviso tom="alerta">
          <strong>A sua conta foi salva por uma versão mais nova do site.</strong> Abra o site com internet para atualizar. Até lá, as mudanças daqui
          ficam só neste aparelho.
        </Aviso>
      </div>
    );
  }
  return null;
}
