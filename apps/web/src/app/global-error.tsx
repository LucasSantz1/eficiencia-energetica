"use client";

import "./globals.css";
import { classesDeBotao } from "@/ui/estilosDeBotao";
import { TelaDeErro } from "@/ui/TelaDeErro";

// Erro inesperado em qualquer tela ou no layout raiz (critério 4, T3). É o único limite de erro do site: um
// app/error.tsx a mais custaria uns 1,3 kB de JS em toda rota (D10). Substitui o documento inteiro, por isso tem
// <html>, <body>, os estilos globais e um <title> do React (metadata não vale aqui). "Voltar ao início" é um <a> comum:
// a página carrega do zero. O `error` não é usado nem registrado (A8).
export default function ErroGeral({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh">
        <title>Algo deu errado</title>
        <TelaDeErro
          aoTentarDeNovo={retry}
          voltarAoInicio={
            <a href="/" className={classesDeBotao("secundario", true)}>
              Voltar ao início
            </a>
          }
        />
      </body>
    </html>
  );
}
