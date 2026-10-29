import { BANDEIRAS, formatarCompetencia, type BandeiraMes } from "@ee/core";

export type Faixa = "a" | "b" | "c" | "d" | "e";

/** Quanto o aparelho pesa na conta, nas cores da etiqueta do INMETRO (verde = pouco, vermelho = muito). */
export function faixaDoPeso(participacao: number): Faixa {
  if (participacao >= 0.25) return "e";
  if (participacao >= 0.15) return "d";
  if (participacao >= 0.08) return "c";
  if (participacao >= 0.03) return "b";
  return "a";
}

const COR: Record<Faixa, string> = {
  a: "bg-faixa-a",
  b: "bg-faixa-b",
  c: "bg-faixa-c",
  d: "bg-faixa-d",
  e: "bg-faixa-e",
};

export const DESCRICAO_FAIXA: Record<Faixa, string> = {
  a: "pesa pouco na conta",
  b: "pesa pouco na conta",
  c: "pesa médio na conta",
  d: "pesa bastante na conta",
  e: "é o que mais pesa na conta",
};

/**
 * Barra em forma de seta, como as da etiqueta amarela de consumo de energia.
 * O comprimento é relativo ao aparelho que mais gasta; a cor, ao peso na conta.
 * O valor fica logo depois da seta, para continuar legível mesmo quando a barra é curta.
 */
export function BarraEtiqueta({ relativo, participacao, children, atraso = 0 }: { relativo: number; participacao: number; children?: React.ReactNode; atraso?: number }) {
  const faixa = faixaDoPeso(participacao);
  const fracao = Math.max(0, Math.min(1, relativo));
  return (
    <div className="flex h-9 items-center gap-2.5" title={DESCRICAO_FAIXA[faixa]}>
      {/* Cresce da esquerda ao aparecer; depois, muda de tamanho suavemente quando o valor muda. */}
      <div
        className={`seta-etiqueta cresce-x h-full shrink-0 transition-[width,background-color] duration-500 ${COR[faixa]}`}
        style={{ width: `max(1.6rem, calc((100% - 7rem) * ${fracao}))`, animationDelay: `${atraso}ms` }}
      />
      {children && (
        <span className="numeros surgir shrink-0 text-[1.05rem] font-extrabold whitespace-nowrap" style={{ animationDelay: `${atraso + 350}ms` }}>
          {children}
        </span>
      )}
    </div>
  );
}

/** Escala de cores com legenda curta. */
export function LegendaEtiqueta() {
  return (
    <div className="flex items-center gap-3 text-[0.9rem] text-tinta-suave" aria-hidden>
      <span>Pesa pouco</span>
      <span className="flex h-3 flex-1 overflow-hidden rounded-full">
        {(["a", "b", "c", "d", "e"] as const).map((f) => (
          <span key={f} className={`flex-1 ${COR[f]}`} />
        ))}
      </span>
      <span>Pesa muito</span>
    </div>
  );
}

/** Selo da bandeira tarifária do mês. */
export function SeloBandeira({ bandeira, exata, sobreEscuro = false }: { bandeira: BandeiraMes; exata: boolean; sobreEscuro?: boolean }) {
  const info = BANDEIRAS[bandeira.bandeira];
  return (
    <span className="inline-flex items-center gap-2 font-bold">
      <svg viewBox="0 0 20 24" className="h-6 w-5 shrink-0" aria-hidden>
        <path d="M2 1v22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M3 2h14l-3.5 5L17 12H3z" fill={info.cor} />
      </svg>
      <span>
        Bandeira {info.nome.toLowerCase()}
        <span className={`font-normal ${sobreEscuro ? "text-white/75" : "text-tinta-suave"}`}> {exata ? `em ${formatarCompetencia(bandeira.competencia)}` : `(última publicada, ${formatarCompetencia(bandeira.competencia)})`}</span>
      </span>
    </span>
  );
}
