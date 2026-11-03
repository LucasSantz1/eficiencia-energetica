"use client";

import { classesDeBotao } from "@/ui/estilosDeBotao";
import { TelaDeErro } from "@/ui/TelaDeErro";

// Erro inesperado numa tela (critério 4, T3). O `error` não é usado nem registrado: no Next 16 ele pode trazer a
// mensagem original, e serviço de erro de terceiro exigiria consentimento (A8).
export default function Erro({ retry }: { error: unknown; retry: () => void }) {
  return (
    <>
      <title>Algo deu errado</title>
      <TelaDeErro
        aoTentarDeNovo={retry}
        voltarAoInicio={
          // Um <a> comum, como no global-error: carrega o início do zero (a tela quebrou) e não leva o next/link, que
          // somaria uns 8 kB de JS a toda rota só por causa desta tela.
          <a href="/" className={classesDeBotao("secundario", true)}>
            Voltar ao início
          </a>
        }
      />
    </>
  );
}
