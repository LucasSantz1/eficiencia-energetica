import type { ReactNode } from "react";

/**
 * Um cartão de Minha casa (redesenho de 26/11, pedido do dono: "no computador fica confuso e desalinhado"). Todos os
 * ajustes têm o mesmo desenho: no celular, título, explicação curta e os controles, um embaixo do outro; no computador
 * largo, título e explicação numa coluna fixa à esquerda e os controles à direita, alinhados de cartão em cartão.
 */
export function SecaoDeAjuste({
  titulo,
  id,
  descricao,
  tom = "normal",
  children,
}: {
  titulo: string;
  id: string;
  descricao?: ReactNode;
  /** "perigo": a borda avisa que ali se apaga coisa (Seus dados). */
  tom?: "normal" | "perigo";
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titulo`}
      className={`scroll-mt-24 rounded-[var(--radius-cartao)] border bg-papel p-5 sm:p-6 xl:grid xl:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] xl:gap-10 xl:p-8 ${
        tom === "perigo" ? "border-alerta/35" : "border-linha/70"
      }`}
    >
      <div className="mb-4 xl:mb-0">
        <h2 id={`${id}-titulo`} className="text-[1.375rem] leading-tight font-bold tracking-tight">
          {titulo}
        </h2>
        {descricao && <p className="mt-1.5 max-w-[56ch] text-[0.95rem] text-tinta-suave">{descricao}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

/** Um grupo de cartões (A casa, Conta de luz...). O nome do grupo é o mesmo do menu ao lado. */
export function GrupoDeAjustes({ id, nome, children }: { id: string; nome: string; children: ReactNode }) {
  return (
    <div id={id} className="scroll-mt-24 space-y-4">
      <p className="px-1 text-[0.95rem] font-bold text-tinta-suave">
        {nome}
      </p>
      {children}
    </div>
  );
}
