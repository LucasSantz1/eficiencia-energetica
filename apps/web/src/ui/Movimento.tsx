"use client";

import { useEffect, useRef, useState, ViewTransition, type ReactNode } from "react";

/** Tipos de transição entre telas (usados em <Link transitionTypes> e router.push). */
export const IR_ADIANTE = ["nav-forward"];
export const VOLTAR = ["nav-back"];
export const ENTRAR_NO_PAINEL = ["entrar-painel"];

const MAPA = { "nav-forward": "nav-forward", "nav-back": "nav-back", "entrar-painel": "entrar-painel", default: "none" };

/**
 * Envolve o conteúdo de uma tela para ele animar ao entrar e sair, conforme o tipo de navegação.
 * Com `chave`, também anima quando a chave muda dentro da mesma tela (ex.: passos do cadastro).
 */
export function TransicaoTela({ children, chave }: { children: ReactNode; chave?: string }) {
  return (
    <ViewTransition key={chave} enter={MAPA} exit={MAPA} default="none">
      {children}
    </ViewTransition>
  );
}

export function prefereMenosMovimento(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Faz um número "contar" até o valor: do zero na primeira vez, e do valor anterior quando ele muda.
 * Assim a pessoa vê a conta subir ou descer quando mexe num aparelho.
 */
export function useValorAnimado(valor: number, { duracao = 900, inicio = 0, ativo = true }: { duracao?: number; inicio?: number; ativo?: boolean } = {}): number {
  const [mostrado, setMostrado] = useState(inicio);
  const anterior = useRef(inicio);
  useEffect(() => {
    if (!ativo) return;
    if (prefereMenosMovimento()) {
      anterior.current = valor;
      setMostrado(valor);
      return;
    }
    const de = anterior.current;
    const t0 = performance.now();
    let quadro = 0;
    const passo = (t: number) => {
      const p = Math.min(1, (t - t0) / duracao);
      const suave = 1 - Math.pow(1 - p, 3);
      const atual = de + (valor - de) * suave;
      anterior.current = atual;
      setMostrado(atual);
      if (p < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [valor, duracao, ativo]);
  return mostrado;
}

export function ValorAnimado({ valor, formatar, duracao }: { valor: number; formatar: (v: number) => string; duracao?: number }) {
  const v = useValorAnimado(valor, { duracao });
  return (
    <>
      <span aria-hidden>{formatar(v)}</span>
      <span className="sr-only">{formatar(valor)}</span>
    </>
  );
}

/** true quando o elemento aparece na tela (uma vez só). */
export function useVisivel<T extends Element>(margem = "0px 0px -12% 0px") {
  const ref = useRef<T>(null);
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || visivel) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisivel(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          setVisivel(true);
          obs.disconnect();
        }
      },
      { rootMargin: margem },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visivel, margem]);
  return { ref, visivel };
}

/** Bloco que aparece suavemente quando a pessoa rola a página até ele. */
export function Revelar({
  children,
  className = "",
  atraso = 0,
  como: Tag = "div",
  estilo,
}: {
  children: ReactNode;
  className?: string;
  atraso?: number;
  como?: "div" | "section" | "li" | "figure";
  estilo?: React.CSSProperties;
}) {
  const { ref, visivel } = useVisivel<HTMLElement>();
  return (
    <Tag ref={ref as never} data-visivel={visivel} className={`revelar ${className}`} style={{ transitionDelay: `${atraso}ms`, ...estilo }}>
      {children}
    </Tag>
  );
}

/** Número grande que conta até o valor quando aparece na tela. */
export function Contagem({ valor, formatar = (v) => Math.round(v).toLocaleString("pt-BR"), sufixo = "" }: { valor: number; formatar?: (v: number) => string; sufixo?: string }) {
  const { ref, visivel } = useVisivel<HTMLSpanElement>();
  const v = useValorAnimado(valor, { duracao: 1400, ativo: visivel });
  return (
    <span ref={ref}>
      <span aria-hidden>
        {formatar(visivel ? v : 0)}
        {sufixo}
      </span>
      <span className="sr-only">
        {formatar(valor)}
        {sufixo}
      </span>
    </span>
  );
}
