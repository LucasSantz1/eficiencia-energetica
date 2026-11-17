"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { addTransitionType, startTransition, useEffect, useRef, useState } from "react";
import { formatarReais, lerNumeroDigitado, LIMITES, validarFaixa, type Faixa } from "@ee/core";
import { avaliarTarifaSocial, FAIXA_DA_RENDA_FAMILIAR, type RespostasDaTarifaSocial } from "@ee/core/tarifa-social";
import { TransicaoTela } from "@/ui/Movimento";
import { BlocosFixos } from "./BlocosFixos";
import { PerguntaDeEscolhaNaTela, PerguntaDeNumeroNaTela } from "./Perguntas";
import { Resultado } from "./Resultado";
import { confereARenda, ERRO_DA_RENDA, ERRO_DAS_PESSOAS, ORDEM_DAS_PERGUNTAS, POR_QUE_PERGUNTAMOS, RESULTADOS, type Pergunta, type PerguntaDeEscolha } from "./textos";

type Passo = Pergunta | "resultado";
type Escolhas = Partial<Pick<RespostasDaTarifaSocial, PerguntaDeEscolha>>;

/** Com BPC = sim a renda não importa (R1 b): pula direto para a pergunta da conta. */
function perguntasAtivas(bpc: Escolhas["bpc"]): readonly Pergunta[] {
  return bpc === "sim" ? ["bpc", "contaNoNome"] : ORDEM_DAS_PERGUNTAS;
}

/** Número digitado que cabe na faixa; `undefined` se estiver vazio, mal escrito ou fora. */
function numeroNaFaixa(texto: string, casas: 0 | 2, faixa: Faixa): number | undefined {
  const lido = lerNumeroDigitado(texto, casas);
  return lido.tipo === "numero" && validarFaixa(faixa, lido.valor) !== "fora" ? lido.valor : undefined;
}

/** Data de hoje no Brasil (AAAA-MM-DD), para a vigência do salário mínimo e o prazo da convocação. */
const hojeNoBrasil = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

/**
 * Guia "será que a sua família pode ter?" (HIS-103). Tudo fica em `useState`: renda, pessoas e saúde são dados
 * sensíveis e não vão para o armazenamento, a URL nem a rede (LGPD; critério 3). Sair da página apaga as respostas.
 */
export function GuiaTarifaSocial() {
  const [passo, setPasso] = useState<Passo>("bpc");
  const [escolhas, setEscolhas] = useState<Escolhas>({});
  const [textoPessoas, setTextoPessoas] = useState("");
  const [textoRenda, setTextoRenda] = useState("");
  const [mostrarErro, setMostrarErro] = useState(false);
  const [mostrarConfere, setMostrarConfere] = useState(false);
  const [rendaConfirmada, setRendaConfirmada] = useState<number>();
  const [hoje, setHoje] = useState<string>();
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const primeiraVez = useRef(true);

  useEffect(() => {
    // A cada passo o foco vai para o título novo; na abertura da página, não (o leitor começa pelo topo).
    if (primeiraVez.current) {
      primeiraVez.current = false;
      return;
    }
    tituloRef.current?.focus();
  }, [passo]);

  const ativas = perguntasAtivas(escolhas.bpc);
  const indice = passo === "resultado" ? ativas.length : ativas.indexOf(passo);
  const pessoas = numeroNaFaixa(textoPessoas, 0, LIMITES.pessoas);
  const renda = numeroNaFaixa(textoRenda, 2, FAIXA_DA_RENDA_FAMILIAR);

  const irPara = (proximo: Passo, sentido: "adiante" | "volta") => {
    startTransition(() => {
      addTransitionType(sentido === "volta" ? "nav-back" : "nav-forward");
      setPasso(proximo);
      setMostrarErro(false);
      setMostrarConfere(false);
    });
    window.scrollTo({ top: 0 });
  };
  const avancar = (lista: readonly Pergunta[], atual: Pergunta) => {
    const proxima = lista[lista.indexOf(atual) + 1];
    if (proxima) return irPara(proxima, "adiante");
    setHoje(hojeNoBrasil());
    irPara("resultado", "adiante");
  };
  const voltar = () => {
    const anterior = ativas[indice - 1];
    if (anterior) irPara(anterior, "volta");
  };
  const recomecar = () => {
    setEscolhas({});
    setTextoPessoas("");
    setTextoRenda("");
    setRendaConfirmada(undefined);
    irPara("bpc", "volta");
  };

  const responder = (pergunta: PerguntaDeEscolha, valor: "sim" | "nao" | "nao-sei") => {
    // A saúde só tem Sim e Não; o tipo de cada resposta é o do core.
    const novas = { ...escolhas, [pergunta]: pergunta === "saude" && valor === "nao-sei" ? "nao" : valor };
    setEscolhas(novas);
    avancar(perguntasAtivas(novas.bpc), pergunta);
  };

  const continuarDoNumero = (pergunta: "pessoas" | "renda") => {
    const valor = pergunta === "pessoas" ? pessoas : renda;
    if (valor === undefined) {
      setMostrarErro(true);
      document.getElementById(`campo-${pergunta}`)?.focus();
      return;
    }
    if (pergunta === "renda" && validarFaixa(FAIXA_DA_RENDA_FAMILIAR, valor) === "alerta" && rendaConfirmada !== valor) {
      setMostrarConfere(true);
      document.getElementById("campo-renda")?.focus();
      return;
    }
    avancar(ativas, pergunta);
  };

  const respostas: RespostasDaTarifaSocial | undefined =
    escolhas.bpc && escolhas.contaNoNome
      ? { ...escolhas, bpc: escolhas.bpc, contaNoNome: escolhas.contaNoNome, pessoas, rendaCentavos: renda === undefined ? undefined : Math.round(renda * 100) }
      : undefined;
  const resultado = passo === "resultado" && respostas ? avaliarTarifaSocial(respostas) : undefined;
  const resultadoPronto = resultado?.tipo === "resultado" ? resultado : undefined;
  const anuncio = passo === "resultado" ? (resultadoPronto ? RESULTADOS[resultadoPronto.caso].titulo : "") : `Pergunta ${indice + 1} de ${ativas.length}`;

  const conteudo = (() => {
    if (passo === "resultado") {
      return resultadoPronto && hoje ? <Resultado resultado={resultadoPronto} hoje={hoje} aoRecomecar={recomecar} tituloRef={tituloRef} /> : null;
    }
    if (passo === "pessoas" || passo === "renda") {
      const ehRenda = passo === "renda";
      const texto = ehRenda ? textoRenda : textoPessoas;
      const valido = ehRenda ? renda : pessoas;
      return (
        <PerguntaDeNumeroNaTela
          pergunta={passo}
          texto={texto}
          erro={mostrarErro && valido === undefined ? (ehRenda ? ERRO_DA_RENDA : ERRO_DAS_PESSOAS) : undefined}
          confere={
            ehRenda && mostrarConfere && renda !== undefined
              ? {
                  texto: confereARenda(formatarReais(renda)),
                  aoConfirmar: () => {
                    setRendaConfirmada(renda);
                    setMostrarConfere(false);
                    document.getElementById("campo-renda")?.focus();
                  },
                  aoCorrigir: () => {
                    setMostrarConfere(false);
                    const campo = document.getElementById("campo-renda");
                    if (campo instanceof HTMLInputElement) campo.select();
                    campo?.focus();
                  },
                }
              : undefined
          }
          aoMudar={(novo) => {
            if (ehRenda) setTextoRenda(novo);
            else setTextoPessoas(novo);
            setMostrarConfere(false);
          }}
          aoSair={() => texto.trim() !== "" && setMostrarErro(true)}
          aoContinuar={() => continuarDoNumero(passo)}
          tituloRef={tituloRef}
        />
      );
    }
    return <PerguntaDeEscolhaNaTela pergunta={passo} resposta={escolhas[passo]} aoResponder={(valor) => responder(passo, valor)} tituloRef={tituloRef} />;
  })();

  const mostrarPorQue = passo === "pessoas" || passo === "renda";

  return (
    <>
      <p role="status" className="sr-only">
        {anuncio}
      </p>
      {passo !== "resultado" && (
        <div className="mt-8 flex items-center gap-3 lg:max-w-[34rem]">
          {indice > 0 ? (
            <button type="button" onClick={voltar} className="inline-flex min-h-11 items-center gap-1.5 rounded-full pr-3 font-bold text-energia hover:bg-energia-claro">
              <ArrowLeft className="size-5" aria-hidden /> Voltar
            </button>
          ) : (
            <Link href="/" transitionTypes={["nav-back"]} className="inline-flex min-h-11 items-center gap-1.5 rounded-full pr-3 font-bold text-energia hover:bg-energia-claro">
              <ArrowLeft className="size-5" aria-hidden /> Voltar
            </Link>
          )}
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-linha" aria-hidden>
            <div className="h-full rounded-full bg-energia transition-[width] duration-300" style={{ width: `${((indice + 1) / ativas.length) * 100}%` }} />
          </div>
          <span className="text-[0.95rem] font-bold text-tinta-suave">
            Pergunta {indice + 1} de {ativas.length}
          </span>
        </div>
      )}

      {/* No computador (padrão da HIS-112): a pergunta à esquerda e o "Por que perguntamos" à direita; no resultado,
          o texto à esquerda e os blocos fixos abertos à direita. A ordem do código é a do celular. */}
      <div className="mt-8 lg:grid lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:gap-x-12">
        <TransicaoTela chave={passo}>
          <div>{conteudo}</div>
        </TransicaoTela>
        {passo === "resultado" ? (
          <div className="mt-12 lg:mt-0">
            <BlocosFixos />
          </div>
        ) : (
          mostrarPorQue && (
            <aside aria-label="Por que perguntamos" className="lateral-fixa hidden rounded-[var(--radius-cartao)] bg-energia-claro p-6 text-lg lg:block">
              {POR_QUE_PERGUNTAMOS}
            </aside>
          )
        )}
      </div>
      {passo !== "resultado" && (
        <div className="mt-16">
          <BlocosFixos emColunas />
        </div>
      )}
    </>
  );
}
