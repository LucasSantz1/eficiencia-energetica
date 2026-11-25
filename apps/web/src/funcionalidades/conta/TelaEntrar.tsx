"use client";

import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { cadastrar, entrar, mensagemDoErro, pedirNovaSenha, useConta } from "@/aplicacao/conta";
import { Aviso } from "@/ui/Aviso";
import { Botao } from "@/ui/Botao";
import { Campo } from "@/ui/Campo";
import { Entrada } from "@/ui/Entrada";
import { focarTitulo } from "@/ui/foco";

type Modo = "entrar" | "criar" | "esqueci";

const TITULOS: Record<Modo, string> = { entrar: "Entrar na sua conta", criar: "Criar uma conta", esqueci: "Esqueci a senha" };

/**
 * Entrar, criar conta e esqueci a senha (E4, HIS-402). A conta é opcional: serve para abrir a casa em outro aparelho e
 * para mandar o link de convidado. Os campos usam `autocomplete` certo, para o gerenciador de senhas do celular ajudar.
 */
export function TelaEntrar() {
  const conta = useConta();
  const router = useRouter();
  const [modo, setModo] = useState<Modo>("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [concordo, setConcordo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string>();
  const [pronto, setPronto] = useState<string>();

  const trocar = (novo: Modo) => {
    setModo(novo);
    setErro(undefined);
    setPronto(undefined);
    requestAnimationFrame(focarTitulo);
  };

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    setErro(undefined);
    setEnviando(true);
    if (modo === "entrar") {
      const resposta = await entrar(email, senha);
      setEnviando(false);
      if (resposta.status === 200) return router.push("/casa");
      return setErro(mensagemDoErro(resposta));
    }
    if (modo === "criar") {
      const resposta = await cadastrar(email, senha, concordo);
      setEnviando(false);
      if (resposta.status !== 200) return setErro(mensagemDoErro(resposta));
      setSenha("");
      return setPronto(`Mandamos um link para ${email.trim()}. Abra o e-mail e toque no link para confirmar a conta. Pode demorar alguns minutos; olhe também a caixa de spam.`);
    }
    const resposta = await pedirNovaSenha(email);
    setEnviando(false);
    if (resposta.status !== 200) return setErro(mensagemDoErro(resposta));
    setPronto(`Se ${email.trim()} tiver conta, chega um link para criar uma senha nova.`);
  };

  if (conta.tipo === "desligada") {
    return (
      <Aviso tom="faisca">
        A conta ainda não está ligada neste site. Você pode usar tudo sem conta: a sua casa fica guardada neste aparelho.{" "}
        <Link href="/casa" className="font-bold underline underline-offset-2">
          Voltar para a minha casa
        </Link>
      </Aviso>
    );
  }
  if (conta.tipo === "conectada") {
    return (
      <Aviso>
        Você já está na conta {conta.email}.{" "}
        <Link href="/casa" className="font-bold underline underline-offset-2">
          Abrir minha casa
        </Link>
      </Aviso>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[30rem]">
      <span aria-hidden className="mx-auto grid size-14 place-items-center rounded-2xl bg-energia-claro text-energia">
        <LockKeyhole className="size-7" />
      </span>
      <h1 tabIndex={-1} className="mt-4 text-center text-[2rem] leading-tight font-extrabold tracking-tight">
        {TITULOS[modo]}
      </h1>
      <p className="mt-2 text-center text-lg text-tinta-suave">
        {modo === "esqueci" ? "Mandamos um link para você criar uma senha nova." : "Com conta, a sua casa abre em outro aparelho e você pode mandar um link para a família acompanhar."}
      </p>

      {pronto ? (
        <div className="mt-6">
          <Aviso>{pronto}</Aviso>
          <Botao variante="secundario" className="mt-4" onClick={() => trocar("entrar")}>
            Voltar para entrar
          </Botao>
        </div>
      ) : (
        <form onSubmit={enviar} noValidate className="mt-6 space-y-5">
          <Campo id="conta-email" rotulo="E-mail">
            <Entrada id="conta-email" type="email" inputMode="email" autoComplete="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Campo>
          {modo !== "esqueci" && (
            <Campo id="conta-senha" rotulo="Senha" ajuda={modo === "criar" ? "Pelo menos 8 letras ou números." : undefined}>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Entrada
                    id="conta-senha"
                    type={verSenha ? "text" : "password"}
                    autoComplete={modo === "criar" ? "new-password" : "current-password"}
                    maxLength={72}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                  />
                </div>
                <button type="button" onClick={() => setVerSenha((v) => !v)} aria-pressed={verSenha} className="grid size-12 shrink-0 place-items-center rounded-[var(--radius-controle)] text-tinta-suave hover:bg-fundo">
                  {verSenha ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
                  <span className="sr-only">{verSenha ? "Esconder a senha" : "Mostrar a senha"}</span>
                </button>
              </div>
            </Campo>
          )}
          {modo === "criar" && (
            <label className="flex min-h-11 items-start gap-3 rounded-[var(--radius-controle)] bg-papel p-4">
              <input type="checkbox" checked={concordo} onChange={(e) => setConcordo(e.target.checked)} className="mt-1 size-5 shrink-0 accent-[var(--color-energia)]" />
              <span>
                Concordo em guardar na conta o meu e-mail e a minha casa: cidade e empresa de luz, benefício (Tarifa Social), quantas pessoas moram, cômodos,
                aparelhos, contas de luz, leituras do relógio, meta e dicas marcadas. Serve para abrir em outro aparelho e para os links da família. Nada de
                nome, CPF ou endereço. Posso apagar tudo quando quiser em Minha casa.
              </span>
            </label>
          )}
          <div role="status">{erro && <Aviso tom="alerta" anunciar={false}>{erro}</Aviso>}</div>
          <Botao type="submit" largo disabled={enviando}>
            {enviando ? "Um momento…" : modo === "entrar" ? "Entrar" : modo === "criar" ? "Criar conta" : "Mandar o link"}
          </Botao>
        </form>
      )}

      <nav aria-label="Outras opções" className="mt-6 flex flex-col items-center gap-1 text-center">
        {modo !== "entrar" && (
          <button type="button" onClick={() => trocar("entrar")} className="min-h-11 font-bold text-energia underline underline-offset-2">
            Já tenho conta: entrar
          </button>
        )}
        {modo !== "criar" && (
          <button type="button" onClick={() => trocar("criar")} className="min-h-11 font-bold text-energia underline underline-offset-2">
            Criar uma conta
          </button>
        )}
        {modo === "entrar" && (
          <button type="button" onClick={() => trocar("esqueci")} className="min-h-11 font-bold text-energia underline underline-offset-2">
            Esqueci a senha
          </button>
        )}
        <Link href="/casa" className="min-h-11 content-center text-tinta-suave underline underline-offset-2">
          Continuar sem conta
        </Link>
      </nav>
    </div>
  );
}
