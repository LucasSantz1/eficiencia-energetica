"use client";

import { CircleAlert, CircleHelp } from "lucide-react";
import type { Ref } from "react";
import { Botao } from "@/ui/Botao";
import { Entrada } from "@/ui/Entrada";
import { Opcao } from "@/ui/Opcao";
import { NAO_SEI_A_RENDA, OPCOES, PERGUNTAS, type PerguntaDeEscolha, type PerguntaDeNumero } from "./textos";

/** Título da pergunta: recebe o foco a cada passo (o leitor de tela lê a pergunta nova). */
function Titulo({ id, texto, ajuda, ref }: { id: string; texto: string; ajuda: string; ref: Ref<HTMLHeadingElement> }) {
  return (
    <>
      <h2 id={id} ref={ref} tabIndex={-1} className="text-[clamp(1.75rem,6vw,2.2rem)] leading-tight font-extrabold tracking-tight outline-none">
        {texto}
      </h2>
      <p className="mt-2 max-w-[52ch] text-lg text-tinta-suave">{ajuda}</p>
    </>
  );
}

/** Sim / Não / Não sei: escolher avança na hora, sem "Continuar". */
export function PerguntaDeEscolhaNaTela({
  pergunta,
  resposta,
  aoResponder,
  tituloRef,
}: {
  pergunta: PerguntaDeEscolha;
  resposta: string | undefined;
  aoResponder: (valor: "sim" | "nao" | "nao-sei") => void;
  tituloRef: Ref<HTMLHeadingElement>;
}) {
  const { titulo, ajuda } = PERGUNTAS[pergunta];
  const idTitulo = `pergunta-${pergunta}`;
  return (
    <div>
      <Titulo id={idTitulo} texto={titulo} ajuda={ajuda} ref={tituloRef} />
      <div role="radiogroup" aria-labelledby={idTitulo} className="mt-6 space-y-3">
        {OPCOES[pergunta].map((opcao) => (
          <Opcao key={opcao.valor} selecionada={resposta === opcao.valor} onClick={() => aoResponder(opcao.valor)} className={`min-h-14 ${opcao.valor === "nao-sei" ? "border-dashed" : ""}`}>
            {opcao.rotulo}
          </Opcao>
        ))}
      </div>
    </div>
  );
}

/** "Confere?" da renda acima do comum: a pergunta fica junto do campo, e nenhum botão recebe o foco sozinho. */
export interface ConfereDoCampo {
  texto: string;
  aoConfirmar: () => void;
  aoCorrigir: () => void;
}

/** Pessoas e renda: campo, erro ao sair do campo ou no "Continuar" (que nunca fica desligado). */
export function PerguntaDeNumeroNaTela({
  pergunta,
  texto,
  erro,
  confere,
  aoMudar,
  aoSair,
  aoContinuar,
  tituloRef,
}: {
  pergunta: PerguntaDeNumero;
  texto: string;
  erro: string | undefined;
  confere: ConfereDoCampo | undefined;
  aoMudar: (texto: string) => void;
  aoSair: () => void;
  aoContinuar: () => void;
  tituloRef: Ref<HTMLHeadingElement>;
}) {
  const { titulo, ajuda } = PERGUNTAS[pergunta];
  const id = `campo-${pergunta}`;
  const descricao = erro ? `${id}-erro` : confere ? `${id}-alerta` : undefined;
  return (
    <form
      noValidate
      onSubmit={(evento) => {
        evento.preventDefault();
        aoContinuar();
      }}
    >
      <Titulo id={`pergunta-${pergunta}`} texto={titulo} ajuda={ajuda} ref={tituloRef} />
      {/* O rótulo é a própria pergunta (o título), sem um texto a mais na tela. */}
      <div className="mt-6">
      <Entrada
        id={id}
        inputMode="numeric"
        prefixo={pergunta === "renda" ? "R$" : undefined}
        placeholder={pergunta === "renda" ? "Ex.: 1.500,00" : "Ex.: 4"}
        value={texto}
        onChange={(evento) => aoMudar(evento.target.value)}
        onBlur={aoSair}
        autoComplete="off"
        aria-labelledby={`pergunta-${pergunta}`}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descricao}
      />
      </div>
      <div aria-live="polite">
        {erro && (
          <p id={`${id}-erro`} className="mt-2 flex gap-2 font-bold text-alerta">
            <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
            <span>{erro}</span>
          </p>
        )}
        {confere && !erro && (
          <p id={`${id}-alerta`} className="mt-2 flex gap-2 rounded-[var(--radius-controle)] bg-faisca-claro px-4 py-3 leading-snug">
            <CircleHelp className="mt-0.5 size-5 shrink-0" aria-hidden />
            <span>
              <strong>Confere?</strong> {confere.texto}
            </span>
          </p>
        )}
      </div>
      {confere && !erro && (
        <div className="mt-2 flex flex-col gap-2 min-[400px]:flex-row">
          <Botao variante="secundario" onClick={confere.aoConfirmar}>
            Sim, está certo
          </Botao>
          <Botao variante="fantasma" onClick={confere.aoCorrigir}>
            Corrigir
          </Botao>
        </div>
      )}
      {pergunta === "renda" && (
        <details className="mt-4">
          <summary className="inline-flex min-h-11 cursor-pointer items-center font-bold text-energia underline underline-offset-4">{NAO_SEI_A_RENDA.resumo}</summary>
          <p className="mt-1 text-tinta-suave">{NAO_SEI_A_RENDA.texto}</p>
        </details>
      )}
      <Botao type="submit" largo className="mt-8 min-h-14">
        Continuar
      </Botao>
    </form>
  );
}
