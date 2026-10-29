"use client";

import Link from "next/link";
import { Check, Minus, Plus } from "lucide-react";
import { forwardRef, useEffect, useRef, type ButtonHTMLAttributes, type ComponentProps, type ReactNode } from "react";

type Variante = "principal" | "secundario" | "fantasma" | "perigo";

const estilosBotao: Record<Variante, string> = {
  principal: "bg-energia text-white hover:bg-energia-forte active:bg-energia-forte shadow-[0_2px_0_0_var(--color-energia-forte)]",
  secundario: "bg-papel text-tinta border-2 border-linha hover:border-tinta-suave",
  fantasma: "text-energia hover:bg-energia-claro",
  perigo: "bg-papel text-alerta border-2 border-alerta/30 hover:bg-alerta-claro",
};

const baseBotao =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-controle)] px-5 py-3 text-[1.0625rem] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-45";

export const Botao = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; largo?: boolean }>(
  function Botao({ variante = "principal", largo, className = "", type = "button", ...props }, ref) {
    return <button ref={ref} type={type} className={`${baseBotao} ${estilosBotao[variante]} ${largo ? "w-full" : ""} ${className}`} {...props} />;
  },
);

export function BotaoLink({ variante = "principal", largo, className = "", ...props }: ComponentProps<typeof Link> & { variante?: Variante; largo?: boolean }) {
  return <Link className={`${baseBotao} ${estilosBotao[variante]} ${largo ? "w-full" : ""} ${className}`} {...props} />;
}

/** Opção que se marca e desmarca (radio ou checkbox visual), com área de toque grande. */
export function Opcao({
  selecionada,
  onClick,
  children,
  descricao,
  icone,
  papel = "radio",
  className = "",
}: {
  selecionada: boolean;
  onClick: () => void;
  children: ReactNode;
  descricao?: ReactNode;
  icone?: ReactNode;
  papel?: "radio" | "checkbox";
  className?: string;
}) {
  return (
    <button
      type="button"
      role={papel}
      aria-checked={selecionada}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-[var(--radius-controle)] border-2 px-4 py-3 text-left transition-colors ${
        selecionada ? "border-energia bg-energia-claro" : "border-linha bg-papel hover:border-tinta-suave"
      } ${className}`}
    >
      {icone && <span className={`shrink-0 ${selecionada ? "text-energia" : "text-tinta-suave"}`}>{icone}</span>}
      <span className="min-w-0 flex-1">
        <span className="block font-bold leading-snug">{children}</span>
        {descricao && <span className="mt-0.5 block text-[0.95rem] leading-snug text-tinta-suave">{descricao}</span>}
      </span>
      <span
        aria-hidden
        className={`grid size-6 shrink-0 place-items-center border-2 ${papel === "radio" ? "rounded-full" : "rounded-md"} ${
          selecionada ? "border-energia bg-energia" : "border-linha bg-papel"
        }`}
      >
        {selecionada && (papel === "radio" ? <span className="size-2.5 rounded-full bg-white" /> : <Check className="size-4 text-white" strokeWidth={3.5} />)}
      </span>
    </button>
  );
}

/** Pílulas de escolha rápida (tempo, dias...). */
export function Pilulas<T extends string | number>({
  opcoes,
  valor,
  aoMudar,
  rotulo,
}: {
  opcoes: { valor: T; rotulo: string }[];
  valor: T | undefined;
  aoMudar: (v: T) => void;
  rotulo: string;
}) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="flex flex-wrap gap-2">
      {opcoes.map((o) => {
        const ativa = o.valor === valor;
        return (
          <button
            key={String(o.valor)}
            type="button"
            role="radio"
            aria-checked={ativa}
            onClick={() => aoMudar(o.valor)}
            className={`min-h-11 rounded-full border-2 px-4 text-[0.98rem] font-bold transition-colors ${
              ativa ? "border-tinta bg-tinta text-white" : "border-linha bg-papel text-tinta hover:border-tinta-suave"
            }`}
          >
            {o.rotulo}
          </button>
        );
      })}
    </div>
  );
}

/** Contador com botões grandes de − e +. */
export function Contador({
  valor,
  aoMudar,
  min = 0,
  max = 99,
  passo = 1,
  rotulo,
  unidade,
  compacto = false,
}: {
  valor: number;
  aoMudar: (v: number) => void;
  min?: number;
  max?: number;
  passo?: number;
  rotulo: string;
  unidade?: string;
  /** Versão mais estreita, para listas no celular. */
  compacto?: boolean;
}) {
  const botao = compacto ? "size-10" : "size-11";
  const mudar = (v: number) => aoMudar(Math.min(max, Math.max(min, Math.round(v * 100) / 100)));
  return (
    <div className="inline-flex items-center rounded-[var(--radius-controle)] border-2 border-linha bg-papel">
      <button type="button" aria-label={`Diminuir ${rotulo}`} onClick={() => mudar(valor - passo)} disabled={valor <= min} className={`grid ${botao} place-items-center text-energia disabled:text-linha`}>
        <Minus className="size-5" strokeWidth={2.5} />
      </button>
      <output aria-live="polite" aria-label={rotulo} className={`numeros text-center font-extrabold ${compacto ? "min-w-9 text-lg" : "min-w-14 text-xl"}`}>
        {valor}
        {unidade && <span className="ml-1 text-base font-bold text-tinta-suave">{unidade}</span>}
      </output>
      <button type="button" aria-label={`Aumentar ${rotulo}`} onClick={() => mudar(valor + passo)} disabled={valor >= max} className={`grid ${botao} place-items-center text-energia disabled:text-linha`}>
        <Plus className="size-5" strokeWidth={2.5} />
      </button>
    </div>
  );
}

export function Campo({ rotulo, ajuda, children, id }: { rotulo: string; ajuda?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block font-bold">
        {rotulo}
      </label>
      {children}
      {ajuda && <p className="text-[0.95rem] leading-snug text-tinta-suave">{ajuda}</p>}
    </div>
  );
}

export const Entrada = forwardRef<HTMLInputElement, ComponentProps<"input"> & { sufixo?: string; prefixo?: string }>(function Entrada(
  { sufixo, prefixo, className = "", ...props },
  ref,
) {
  return (
    <div className="flex items-center rounded-[var(--radius-controle)] border-2 border-linha bg-papel focus-within:border-energia">
      {prefixo && <span className="pl-4 font-bold text-tinta-suave">{prefixo}</span>}
      <input ref={ref} className={`numeros min-h-12 w-full min-w-0 bg-transparent px-4 text-lg font-bold outline-none placeholder:font-normal placeholder:text-tinta-suave/70 ${className}`} {...props} />
      {sufixo && <span className="pr-4 font-bold text-tinta-suave">{sufixo}</span>}
    </div>
  );
});

/** Janela que sobe de baixo no celular (usa o <dialog> nativo: acessível e fecha com Esc). */
export function Folha({ aberta, aoFechar, titulo, children, rodape }: { aberta: boolean; aoFechar: () => void; titulo: string; children: ReactNode; rodape?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberta && !d.open) d.showModal();
    if (!aberta && d.open) d.close();
  }, [aberta]);
  return (
    <dialog
      ref={ref}
      onClose={aoFechar}
      onClick={(e) => e.target === ref.current && aoFechar()}
      aria-label={titulo}
      className="folha flex-col overflow-hidden bg-papel p-0 text-tinta open:flex"
    >
      <div className="flex items-center justify-between gap-4 border-b border-linha px-5 py-4">
        <h2 className="text-xl font-extrabold">{titulo}</h2>
        <button type="button" onClick={aoFechar} className="min-h-11 rounded-full px-3 font-bold text-energia hover:bg-energia-claro">
          Fechar
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
      {rodape && <div className="border-t border-linha bg-papel px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{rodape}</div>}
    </dialog>
  );
}

export function Aviso({ tom = "info", children, icone }: { tom?: "info" | "alerta" | "faisca"; children: ReactNode; icone?: ReactNode }) {
  const cores = {
    info: "bg-energia-claro text-energia-forte",
    alerta: "bg-alerta-claro text-alerta",
    faisca: "bg-faisca-claro text-tinta",
  }[tom];
  return (
    <div role={tom === "alerta" ? "alert" : "status"} className={`flex gap-3 rounded-[var(--radius-controle)] px-4 py-3 text-[0.98rem] leading-snug ${cores}`}>
      {icone && <span className="mt-0.5 shrink-0">{icone}</span>}
      <div>{children}</div>
    </div>
  );
}
