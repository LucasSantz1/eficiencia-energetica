"use client";

import "./globals.css";
import { classesDeBotao } from "@/ui/estilosDeBotao";
import { TelaDeErro } from "@/ui/TelaDeErro";

// Erro no layout raiz (T3): substitui o documento inteiro, por isso tem <html>, <body>, os estilos globais e um
// <title> do React (metadata não vale aqui). "Voltar ao início" é um <a> comum: a página precisa carregar do zero.
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
