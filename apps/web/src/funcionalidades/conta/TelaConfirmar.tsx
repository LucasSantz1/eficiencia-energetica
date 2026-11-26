"use client";

import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { confirmarEmail, mensagemDoErro, sair, useConta } from "@/aplicacao/conta";
import { Aviso } from "@/ui/Aviso";
import { Botao, BotaoLink } from "@/ui/Botao";
import { esquecerCodigoDoEndereco, useCodigoDoEndereco } from "./useCodigoDoEndereco";

/**
 * O link do e-mail de confirmação (E4). A confirmação espera um toque em vez de acontecer sozinha ao abrir: o
 * antivírus de alguns e-mails abre os links antes da pessoa e gastaria o código, que vale uma vez só.
 */
export function TelaConfirmar() {
  const codigo = useCodigoDoEndereco("codigo", "token_hash");
  const conta = useConta();
  const [situacao, setSituacao] = useState<{ tipo: "esperando" } | { tipo: "enviando" } | { tipo: "pronto" } | { tipo: "erro"; mensagem: string }>({ tipo: "esperando" });

  const confirmar = async () => {
    setSituacao({ tipo: "enviando" });
    const resposta = await confirmarEmail(codigo);
    if (resposta.status === 200) {
      esquecerCodigoDoEndereco();
      return setSituacao({ tipo: "pronto" });
    }
    setSituacao({ tipo: "erro", mensagem: mensagemDoErro(resposta) });
  };

  return (
    <div className="mx-auto w-full max-w-[30rem] text-center">
      <span aria-hidden className="mx-auto grid size-14 place-items-center rounded-2xl bg-energia-claro text-energia">
        <MailCheck className="size-7" />
      </span>
      <h1 tabIndex={-1} className="mt-4 text-[2rem] leading-tight font-extrabold tracking-tight">
        {situacao.tipo === "pronto" ? "Conta confirmada" : "Confirmar o e-mail"}
      </h1>
      <div role="status" className="mt-4 text-left">
        {situacao.tipo === "pronto" && (
          // O e-mail à vista (A1 da seguranca): quem recebeu o link de outra pessoa vê que a conta não é a sua.
          <Aviso anunciar={false}>
            Pronto! Você entrou na conta <strong className="break-all">{conta.tipo === "conectada" ? conta.email : ""}</strong>. Não é você?{" "}
            <button type="button" onClick={() => void sair()} className="min-h-11 font-bold underline underline-offset-2">
              Sair da conta
            </button>
          </Aviso>
        )}
        {situacao.tipo === "erro" && <Aviso tom="alerta" anunciar={false}>{situacao.mensagem}</Aviso>}
      </div>
      {situacao.tipo === "pronto" ? (
        <BotaoLink href="/casa" className="mt-6">
          Abrir minha casa
        </BotaoLink>
      ) : codigo === "" ? (
        <p className="mt-4 text-lg text-tinta-suave">
          Abra esta página pelo link que chegou no seu e-mail.{" "}
          <Link href="/entrar" className="font-bold text-energia underline underline-offset-2">
            Voltar para entrar
          </Link>
        </p>
      ) : (
        <Botao className="mt-6" largo onClick={() => void confirmar()} disabled={situacao.tipo === "enviando"}>
          {situacao.tipo === "enviando" ? "Confirmando…" : "Confirmar meu e-mail"}
        </Botao>
      )}
    </div>
  );
}
