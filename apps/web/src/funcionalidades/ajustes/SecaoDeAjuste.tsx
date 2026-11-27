"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Folha } from "@/ui/Folha";
import { IconeComFundo } from "@/ui/Icone";
import { useTelaLarga } from "@/ui/telaLarga";

interface PropsDaSecao {
  titulo: string;
  id: string;
  /** Desenho ao lado do título (ui/Icone.tsx). */
  icone?: string;
  descricao?: ReactNode;
  /** O que está escolhido agora, numa linha ("Tarifa Social", "Bifásica"): aparece na lista do celular. */
  valor?: ReactNode;
  /** "perigo": a borda avisa que ali se apaga coisa (Seus dados). */
  tom?: "normal" | "perigo";
  children: ReactNode;
}

/**
 * Um ajuste de Minha casa. Dois desenhos, com o mesmo conteúdo (o conteúdo existe uma vez só na página):
 * - Celular (pedido do dono, 27/11: "quero que pareça uma tela de configuração de celular"): uma linha da lista, com o
 *   desenho, o nome, o que está escolhido e a setinha. O toque abre o ajuste numa folha que sobe de baixo.
 * - Computador (redesenho de 26/11): um cartão, com título e explicação à esquerda e os controles à direita.
 */
export function SecaoDeAjuste(props: PropsDaSecao) {
  return useTelaLarga() ? <CartaoDeAjuste {...props} /> : <LinhaDeAjuste {...props} />;
}

function CartaoDeAjuste({ titulo, id, icone, descricao, tom = "normal", children }: PropsDaSecao) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titulo`}
      className={`scroll-mt-24 rounded-[var(--radius-cartao)] border bg-papel p-6 xl:grid xl:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] xl:gap-10 xl:p-8 ${
        tom === "perigo" ? "border-alerta/35" : "border-linha/70"
      }`}
    >
      <div className="mb-4 xl:mb-0">
        <div className="flex items-center gap-3 xl:flex-col xl:items-start">
          {icone && <IconeComFundo nome={icone} />}
          <h2 id={`${id}-titulo`} className="text-[1.375rem] leading-tight font-bold tracking-tight">
            {titulo}
          </h2>
        </div>
        {descricao && <p className="mt-1.5 max-w-[56ch] text-[0.95rem] text-tinta-suave">{descricao}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function LinhaDeAjuste({ titulo, id, icone, descricao, valor, tom = "normal", children }: PropsDaSecao) {
  const [aberta, setAberta] = useState(false);
  // O nome do botão é o texto todo da linha (o ajuste e o que está escolhido): quem usa comando de voz fala o que vê.
  const temValor = valor !== undefined && valor !== null && valor !== "";
  // Os links do site para um ajuste (ex.: /casa/ajustes#conta, no aviso do preço da luz) abrem a folha dele.
  useEffect(() => {
    const abrirSeForEste = () => {
      if (window.location.hash === `#${id}`) setAberta(true);
    };
    abrirSeForEste();
    window.addEventListener("hashchange", abrirSeForEste);
    return () => window.removeEventListener("hashchange", abrirSeForEste);
  }, [id]);
  const fechar = () => {
    setAberta(false);
    // Sem isso, voltar a esta tela pelo mesmo link não abriria a folha de novo (o endereço não mudaria).
    if (window.location.hash === `#${id}`) history.replaceState(history.state, "", window.location.pathname + window.location.search);
  };
  return (
    <div id={id} className="scroll-mt-24">
      <button
        type="button"
        onClick={() => setAberta(true)}
        aria-haspopup="dialog"
        className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-fundo focus-visible:relative active:bg-fundo"
      >
        {icone && <IconeComFundo nome={icone} tamanho="pequeno" />}
        <span className="min-w-0 flex-1">
          <span id={`${id}-linha`} className={`block text-[1.05rem] leading-snug font-bold ${tom === "perigo" ? "text-alerta" : ""}`}>
            {titulo}
          </span>
          {temValor && (
            <span id={`${id}-linha-valor`} className="mt-0.5 block truncate text-[0.95rem] text-tinta-suave">
              {valor}
            </span>
          )}
        </span>
        <ChevronRight className="size-5 shrink-0 text-tinta-suave" aria-hidden />
      </button>
      <Folha aberta={aberta} aoFechar={fechar} titulo={titulo} alta>
        {descricao && <p className="mb-5 text-tinta-suave">{descricao}</p>}
        {children}
      </Folha>
    </div>
  );
}

/**
 * Um grupo de ajustes (A casa, Conta de luz...). No celular, as linhas ficam juntas num cartão só, separadas por um
 * traço, com o nome do grupo em cima, como nas configurações do celular. No computador, cartões soltos, e o nome do
 * grupo é o mesmo do menu ao lado.
 */
export function GrupoDeAjustes({ id, nome, children }: { id: string; nome: string; children: ReactNode }) {
  const larga = useTelaLarga();
  if (larga) {
    return (
      <div id={id} className="scroll-mt-24 space-y-4">
        <p className="px-1 text-[0.95rem] font-bold text-tinta-suave">{nome}</p>
        {children}
      </div>
    );
  }
  return (
    <section id={id} aria-labelledby={`${id}-nome`} className="scroll-mt-24">
      <h2 id={`${id}-nome`} className="mb-2 px-4 text-[0.95rem] font-bold text-tinta-suave">
        {nome}
      </h2>
      <div className="divide-y divide-linha/70 overflow-hidden rounded-[var(--radius-cartao)] border border-linha/70 bg-papel">{children}</div>
    </section>
  );
}

/** Uma linha que leva para outra página (Sobre, Privacidade, Termos), como no fim das configurações do celular. */
export function LinhaDeLink({ href, titulo, descricao }: { href: string; titulo: string; descricao?: string }) {
  return (
    <Link href={href} prefetch={false} className="flex min-h-14 items-center gap-3 px-4 py-3 transition-colors hover:bg-fundo active:bg-fundo">
      <span className="min-w-0 flex-1">
        <span className="block text-[1.05rem] leading-snug font-bold">{titulo}</span>
        {descricao && <span className="mt-0.5 block text-[0.95rem] text-tinta-suave">{descricao}</span>}
      </span>
      <ChevronRight className="size-5 shrink-0 text-tinta-suave" aria-hidden />
    </Link>
  );
}

/** O grupo "Sobre" do fim da lista: só no celular (no computador, os links ficam em "Seus dados" e no rodapé). */
export function GrupoSobre() {
  if (useTelaLarga()) return null;
  return (
    <GrupoDeAjustes id="ajustes-sobre" nome="Sobre">
      <LinhaDeLink href="/sobre" titulo="Sobre o site" descricao="De onde vêm as tarifas e como o cálculo é feito" />
      <LinhaDeLink href="/privacidade" titulo="Política de privacidade" />
      <LinhaDeLink href="/termos" titulo="Termos de uso" />
    </GrupoDeAjustes>
  );
}
