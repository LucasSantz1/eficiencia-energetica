"use client";

import { KeyRound } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { mensagemDoErro, sair, trocarSenhaPeloLink, useConta } from "@/aplicacao/conta";
import { Aviso } from "@/ui/Aviso";
import { Botao, BotaoLink } from "@/ui/Botao";
import { Campo } from "@/ui/Campo";
import { Entrada } from "@/ui/Entrada";
import { esquecerCodigoDoEndereco, useCodigoDoEndereco } from "./useCodigoDoEndereco";

/** O link de "esqueci a senha" (E4): a senha nova e pronto, já dentro da conta. */
export function TelaNovaSenha() {
  const codigo = useCodigoDoEndereco("codigo", "token_hash");
  const conta = useConta();
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string>();
  const [pronto, setPronto] = useState(false);

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    setEnviando(true);
    const resposta = await trocarSenhaPeloLink(codigo, senha);
    setEnviando(false);
    if (resposta.status !== 200) return setErro(mensagemDoErro(resposta));
    esquecerCodigoDoEndereco();
    setPronto(true);
  };

  return (
    <div className="mx-auto w-full max-w-[30rem]">
      <span aria-hidden className="mx-auto grid size-14 place-items-center rounded-2xl bg-energia-claro text-energia">
        <KeyRound className="size-7" />
      </span>
      <h1 tabIndex={-1} className="mt-4 text-center text-[2rem] leading-tight font-extrabold tracking-tight">
        {pronto ? "Senha nova salva" : "Criar uma senha nova"}
      </h1>
      {pronto ? (
        <div className="mt-6 text-center">
          <Aviso>
            Pronto! Você entrou na conta <strong className="break-all">{conta.tipo === "conectada" ? conta.email : ""}</strong>. Não é você?{" "}
            <button type="button" onClick={() => void sair()} className="min-h-11 font-bold underline underline-offset-2">
              Sair da conta
            </button>
          </Aviso>
          <BotaoLink href="/casa" className="mt-6">
            Abrir minha casa
          </BotaoLink>
        </div>
      ) : codigo === "" ? (
        <p className="mt-4 text-center text-lg text-tinta-suave">
          Abra esta página pelo link que chegou no seu e-mail.{" "}
          <Link href="/entrar" className="font-bold text-energia underline underline-offset-2">
            Voltar para entrar
          </Link>
        </p>
      ) : (
        <form onSubmit={enviar} noValidate className="mt-6 space-y-5">
          <Campo id="nova-senha" rotulo="Senha nova" ajuda="Pelo menos 8 letras ou números.">
            <Entrada id="nova-senha" type="password" autoComplete="new-password" maxLength={72} value={senha} onChange={(e) => setSenha(e.target.value)} required />
          </Campo>
          <div role="status">{erro && <Aviso tom="alerta" anunciar={false}>{erro}</Aviso>}</div>
          <Botao type="submit" largo disabled={enviando}>
            {enviando ? "Um momento…" : "Salvar a senha nova"}
          </Botao>
        </form>
      )}
    </div>
  );
}
