"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addTransitionType, startTransition, useState, useSyncExternalStore, ViewTransition, type FormEvent, type ReactNode } from "react";
import { cadastrar, entrar, mensagemDoErro, pedirNovaSenha, useConta } from "@/aplicacao/conta";
import { Aviso } from "@/ui/Aviso";
import { Botao } from "@/ui/Botao";
import { Campo } from "@/ui/Campo";
import { Entrada } from "@/ui/Entrada";
import { focarTitulo } from "@/ui/foco";

type Modo = "entrar" | "criar" | "esqueci";

/** Só a troca entre entrar e criar anima a troca de lado; o resto (digitar, erro) não. */
const TROCA_DE_LADO = { "trocar-lado": "trocar-lado", default: "none" };

const TITULOS: Record<Modo, string> = { entrar: "Entrar na sua conta", criar: "Criar uma conta", esqueci: "Esqueci a senha" };

/** `/entrar?modo=criar` (o convite depois do cadastro) já abre em "Criar uma conta". A página é estática: lê no navegador. */
function useModoDoEndereco(): Modo {
  return useSyncExternalStore(
    nadaParaOuvir,
    () => (new URLSearchParams(window.location.search).get("modo") === "criar" ? "criar" : "entrar"),
    () => "entrar",
  );
}

function nadaParaOuvir() {
  return () => undefined;
}

/**
 * Entrar, criar conta e esqueci a senha (E4, HIS-402). A conta é opcional: serve para abrir a casa em outro aparelho e
 * para mandar o link de convidado. Os campos usam `autocomplete` certo, para o gerenciador de senhas do celular ajudar.
 */
export function TelaEntrar({ lado, ladoCriar = lado }: { lado?: ReactNode; ladoCriar?: ReactNode }) {
  const conta = useConta();
  const router = useRouter();
  const modoDoEndereco = useModoDoEndereco();
  const [modoEscolhido, setModo] = useState<Modo>();
  const modo = modoEscolhido ?? modoDoEndereco;
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [concordo, setConcordo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string>();
  const [pronto, setPronto] = useState<string>();

  const trocar = (novo: Modo) => {
    startTransition(() => {
      addTransitionType("trocar-lado");
      setModo(novo);
      setErro(undefined);
      setPronto(undefined);
    });
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

  let conteudo: ReactNode;
  if (conta.tipo === "desligada") {
    conteudo = (
      <Aviso tom="faisca">
        A conta ainda não está ligada neste site. Você pode usar tudo sem conta: a sua casa fica guardada neste aparelho.{" "}
        <Link href="/casa" className="font-bold underline underline-offset-2">
          Voltar para a minha casa
        </Link>
      </Aviso>
    );
  } else if (conta.tipo === "conectada") {
    conteudo = (
      <Aviso>
        Você já está na conta {conta.email}.{" "}
        <Link href="/casa" className="font-bold underline underline-offset-2">
          Abrir minha casa
        </Link>
      </Aviso>
    );
  } else {

    conteudo = (
    <div className="w-full">
      {modo !== "esqueci" && (
        // Entrar | Criar conta, como nos outros aplicativos: a escolha fica à vista no alto do cartão.
        <div role="group" aria-label="Entrar ou criar conta" className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-fundo p-1">
          {(["entrar", "criar"] as const).map((opcao) => (
            <button
              key={opcao}
              type="button"
              aria-pressed={modo === opcao}
              onClick={() => modo !== opcao && trocar(opcao)}
              className={`min-h-11 rounded-full px-3 font-bold transition-colors ${modo === opcao ? "bg-energia text-white shadow-sm" : "text-tinta-suave hover:text-tinta"}`}
            >
              {opcao === "entrar" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>
      )}
      <h1 tabIndex={-1} className="text-[2rem] leading-tight font-extrabold tracking-tight">
        {TITULOS[modo]}
      </h1>
      <p className="mt-2 text-lg text-tinta-suave">
        {modo === "esqueci" ? "Mandamos um link para você criar uma senha nova." : "Com conta, a sua casa abre em outro celular e você pode mandar um link para a família acompanhar."}
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
              <Entrada
                id="conta-senha"
                type={verSenha ? "text" : "password"}
                autoComplete={modo === "criar" ? "new-password" : "current-password"}
                maxLength={72}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                acessorio={
                  <button type="button" onClick={() => setVerSenha((v) => !v)} aria-pressed={verSenha} className="grid size-11 place-items-center rounded-[calc(var(--radius-controle)-4px)] text-tinta-suave hover:bg-fundo hover:text-tinta">
                    {verSenha ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
                    <span className="sr-only">{verSenha ? "Esconder a senha" : "Mostrar a senha"}</span>
                  </button>
                }
              />
            </Campo>
          )}
          {modo === "criar" && (
            <div className="space-y-2">
              <label className="flex min-h-11 items-start gap-3">
                <input type="checkbox" checked={concordo} onChange={(e) => setConcordo(e.target.checked)} className="mt-0.5 size-6 shrink-0 accent-[var(--color-energia)]" />
                <span>
                  Li e concordo com os{" "}
                  <Link href="/termos" target="_blank" rel="noopener noreferrer" className="font-bold text-energia underline underline-offset-2">
                    Termos de uso
                  </Link>{" "}
                  e a{" "}
                  <Link href="/privacidade" target="_blank" rel="noopener noreferrer" className="font-bold text-energia underline underline-offset-2">
                    Política de privacidade
                  </Link>
                  , e em guardar o meu e-mail e a minha casa na conta.
                </span>
              </label>
              {/* O detalhe continua aqui, no momento de concordar (LGPD: finalidade clara), mas fechado para não pesar na tela. */}
              <details className="ml-9 text-tinta-suave">
                <summary className="min-h-11 cursor-pointer content-center font-bold text-energia underline underline-offset-2">O que fica guardado?</summary>
                <p className="mt-1">
                  Cidade e empresa de luz, benefício (Tarifa Social), quantas pessoas moram, cômodos, aparelhos, contas de luz, leituras do relógio, meta e
                  dicas marcadas. Serve para abrir a casa em outro celular e para os links da família. Nada de nome, CPF ou endereço. Você apaga tudo quando
                  quiser em Minha casa.{" "}
                  <Link href="/privacidade" target="_blank" rel="noopener noreferrer" className="font-bold text-energia underline underline-offset-2">
                    Ler a Política de privacidade
                  </Link>
                </p>
              </details>
            </div>
          )}
          <div role="status">{erro && <Aviso tom="alerta" anunciar={false}>{erro}</Aviso>}</div>
          <Botao type="submit" largo disabled={enviando}>
            {enviando ? "Um momento…" : modo === "entrar" ? "Entrar" : modo === "criar" ? "Criar conta" : "Mandar o link"}
          </Botao>
        </form>
      )}

      <nav aria-label="Outras opções" className="mt-6 flex flex-col items-start gap-1 border-t border-separador pt-4">
        {modo === "esqueci" && (
          <button type="button" onClick={() => trocar("entrar")} className="min-h-11 font-bold text-energia underline underline-offset-2">
            Voltar para entrar
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

  // Criar conta: o cartão vai para a direita e o desenho para a esquerda, deslizando (pedido do dono, 26/11). No
  // celular é uma coluna só e nada troca de lugar; com movimento reduzido, a troca é direta (globals.css).
  const criar = modo === "criar";
  return (
    <div
      className={`grid flex-1 grid-cols-[minmax(0,1fr)] items-center gap-12 lg:gap-16 ${criar ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]" : "lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)]"}`}
    >
      <ViewTransition name="cartao-da-conta" update={TROCA_DE_LADO}>
        <main className={`rounded-[var(--radius-cartao)] bg-papel p-5 text-tinta shadow-[0_24px_60px_-20px_rgb(0_0_0/0.55)] sm:p-8 ${criar ? "lg:order-2" : ""}`}>
          {conteudo}
        </main>
      </ViewTransition>
      <ViewTransition name="lado-da-conta" update={TROCA_DE_LADO}>
        <div className={criar ? "lg:order-1" : ""}>{criar ? ladoCriar : lado}</div>
      </ViewTransition>
    </div>
  );
}
