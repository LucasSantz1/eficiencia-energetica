"use client";

import { Download } from "lucide-react";
import { useInstalacao } from "@/aplicacao/offline";
import { Botao } from "@/ui/Botao";

/**
 * "Usar sem internet" (HIS-302): o que o modo sem internet faz e como pôr o site na tela inicial. O botão só aparece
 * no navegador que deixa instalar direto (Chrome no Android, Edge); no iPhone, o caminho é pelo Compartilhar do Safari.
 */
export function SecaoInstalar() {
  const { podeInstalar, instalado, instalar } = useInstalacao();
  return (
    <section id="instalar" aria-labelledby="instalar-titulo" className="scroll-mt-24">
      <h2 id="instalar-titulo" className="mb-3 text-[1.375rem] font-bold tracking-tight">
        Usar sem internet
      </h2>
      <p className="max-w-[56ch] text-tinta-suave">
        Depois de abrir o site uma vez com internet, ele funciona sem internet neste aparelho. A sua casa fica guardada aqui.
      </p>
      {instalado ? (
        <p className="mt-3 font-bold">Você já está usando o site como aplicativo.</p>
      ) : (
        <>
          <p className="mt-3 max-w-[56ch]">Para abrir como um aplicativo, com um ícone na tela inicial:</p>
          {podeInstalar && (
            <Botao className="mt-3" onClick={() => void instalar()}>
              <Download className="size-5" aria-hidden /> Instalar no celular
            </Botao>
          )}
          <ul className="mt-4 max-w-[60ch] space-y-3">
            <li>
              <strong>No Android (Chrome):</strong> toque nos três pontinhos <span aria-hidden>⋮</span>, no canto de cima, e depois em{" "}
              <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>.
            </li>
            <li>
              <strong>No iPhone (Safari):</strong> toque em <strong>Compartilhar</strong> (o quadrado com a seta para cima) e depois em{" "}
              <strong>Adicionar à Tela de Início</strong>.
            </li>
          </ul>
        </>
      )}
    </section>
  );
}
