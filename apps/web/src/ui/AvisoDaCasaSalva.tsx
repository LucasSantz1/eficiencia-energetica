"use client";

import type { AvisoDaCasaSalva as Aviso, ContagemDeDescartes } from "@ee/core";
import { Botao, BotaoLink } from "@/ui/Botao";
import { focarTitulo } from "@/ui/foco";

/** Singular e plural de cada tipo, na ordem em que entram na frase (T1a, ux-acessibilidade). */
const NOMES: { tipo: keyof ContagemDeDescartes; um: string; varios: string }[] = [
  { tipo: "aparelhos", um: "1 aparelho", varios: "aparelhos" },
  { tipo: "comodos", um: "1 cômodo", varios: "cômodos" },
  { tipo: "contas", um: "1 conta de luz", varios: "contas de luz" },
  { tipo: "leituras", um: "1 anotação do relógio de luz", varios: "anotações do relógio de luz" },
  { tipo: "plano", um: "1 dica do seu plano", varios: "dicas do seu plano" },
];

/** "2 aparelhos e 1 conta de luz": vírgula entre os itens e "e" antes do último. */
export function listaDoQueSaiu(descartados: ContagemDeDescartes): string {
  const partes = NOMES.filter(({ tipo }) => descartados[tipo] > 0).map(({ tipo, um, varios }) => (descartados[tipo] === 1 ? um : `${descartados[tipo]} ${varios}`));
  if (partes.length <= 1) return partes.join("");
  return `${partes.slice(0, -1).join(", ")} e ${partes.at(-1)}`;
}

function Textos({ aviso }: { aviso: Aviso }) {
  if (aviso.tipo === "nada-aproveitavel") {
    return (
      <>
        <p className="font-bold">Não conseguimos abrir a casa que estava salva aqui.</p>
        <p className="mt-1">As informações tinham um problema. Cadastre a casa de novo para ver quanto cada aparelho custa.</p>
      </>
    );
  }
  if (aviso.tipo === "sem-residencia") {
    return (
      <>
        <p className="font-bold">Não conseguimos abrir sua cidade e sua empresa de luz.</p>
        <p className="mt-1">Seus aparelhos continuam salvos. Escolha a cidade de novo para ver os valores.</p>
      </>
    );
  }
  return (
    <>
      <p className="font-bold">Parte do que estava salvo aqui tinha um problema e foi tirada.</p>
      <p className="mt-1">Tiramos {listaDoQueSaiu(aviso.descartados)}. O resto da sua casa continua salvo.</p>
    </>
  );
}

function Acao({ aviso }: { aviso: Aviso }) {
  const classe = "sm:w-auto";
  if (aviso.tipo === "nada-aproveitavel") {
    return (
      <BotaoLink href="/comecar" largo className={classe}>
        Cadastrar minha casa
      </BotaoLink>
    );
  }
  if (aviso.tipo === "sem-residencia") {
    return (
      <BotaoLink href="/casa/ajustes" variante="secundario" largo className={classe}>
        Escolher minha cidade
      </BotaoLink>
    );
  }
  const saiuAparelhoOuComodo = aviso.descartados.aparelhos > 0 || aviso.descartados.comodos > 0;
  return saiuAparelhoOuComodo ? (
    <BotaoLink href="/casa/aparelhos" variante="secundario" largo className={classe}>
      Ver meus aparelhos
    </BotaoLink>
  ) : null;
}

/**
 * Aviso de que parte da casa salva foi tirada (T1). O recipiente com `role="status"` fica sempre na página, vazio
 * até a casa ser lida: se ele nascesse junto com o texto, o TalkBack e o NVDA não leriam nada. Não puxa o foco.
 */
export function AvisoDaCasaSalva({ aviso, aoEntender, className = "" }: { aviso?: Aviso; aoEntender: () => void; className?: string }) {
  return (
    <div role="status" className={aviso ? className : ""}>
      {aviso && (
        <div className="rounded-[var(--radius-controle)] bg-faisca-claro px-4 py-4 text-[0.98rem] leading-snug text-tinta">
          <Textos aviso={aviso} />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Acao aviso={aviso} />
            <Botao
              variante="fantasma"
              largo
              className="sm:w-auto"
              onClick={() => {
                aoEntender();
                focarTitulo();
              }}
            >
              Entendi
            </Botao>
          </div>
        </div>
      )}
    </div>
  );
}
