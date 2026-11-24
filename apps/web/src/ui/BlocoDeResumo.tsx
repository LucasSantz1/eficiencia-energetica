import Link from "next/link";
import type { ReactNode } from "react";

interface Props {
  icone: ReactNode;
  rotulo: string;
  valor: ReactNode;
  legenda?: ReactNode;
  /** Extra embaixo da legenda (barrinha, selo). */
  children?: ReactNode;
  className?: string;
  /** Leva a outra tela ou a uma âncora. */
  href?: string;
  /** Abre algo na mesma tela (folha). */
  aoTocar?: () => void;
}

const ESTILO = "flex h-full min-h-[8.5rem] flex-col rounded-[var(--radius-cartao)] bg-papel p-4 text-left transition-colors hover:bg-white/70 active:bg-energia-claro/50";

/**
 * Bloco do painel em grade (como os resumos dos apps de celular): rótulo pequeno com ícone, um número grande e uma
 * linha de explicação. O bloco todo é o alvo de toque; o nome acessível é o texto visível, na mesma ordem.
 */
export function BlocoDeResumo({ icone, rotulo, valor, legenda, children, className = "", href, aoTocar }: Props) {
  const conteudo = (
    <>
      <span className="flex items-center gap-1.5 text-[0.95rem] font-bold text-energia">
        <span aria-hidden className="[&>svg]:size-[1.125rem]">
          {icone}
        </span>
        {rotulo}
      </span>{" "}
      <span className="numeros mt-2 block text-[1.75rem] leading-tight font-extrabold tracking-tight">{valor}</span>{" "}
      {legenda && <span className="mt-1 line-clamp-3 text-[0.95rem] leading-snug text-tinta-suave">{legenda}</span>}
      {children}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={`${ESTILO} ${className}`}>
        {conteudo}
      </Link>
    );
  }
  if (aoTocar) {
    return (
      <button type="button" onClick={aoTocar} className={`${ESTILO} ${className}`}>
        {conteudo}
      </button>
    );
  }
  return <div className={`${ESTILO} ${className}`}>{conteudo}</div>;
}
