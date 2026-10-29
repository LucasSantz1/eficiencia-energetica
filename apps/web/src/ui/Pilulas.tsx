"use client";

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
            className={`min-h-11 rounded-full border-2 px-4 text-[0.98rem] font-bold transition-[background-color,border-color,color,transform] duration-200 active:scale-95 ${
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
