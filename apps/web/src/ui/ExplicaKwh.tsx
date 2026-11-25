import { CircleHelp } from "lucide-react";

/**
 * "O que é kWh?" em palavras do dia a dia, fechado até a pessoa tocar (sem JS: `<details>`). O exemplo do chuveiro é
 * conta, não número novo: 5.500 W (o chuveiro padrão do catálogo, `potenciaW`) × 10 minutos = 0,92 kWh, "quase 1 kWh".
 */
export function ExplicaKwh({ className = "" }: { className?: string }) {
  return (
    <details className={`group ${className}`}>
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 font-bold text-energia [&::-webkit-details-marker]:hidden">
        <CircleHelp className="size-5" aria-hidden /> O que é kWh?
      </summary>
      <p className="mt-1 rounded-[var(--radius-controle)] bg-energia-claro px-4 py-3 text-tinta">
        <strong>kWh</strong> é a medida da energia que a casa gasta, como o litro mede a água. Um banho de 10 minutos no chuveiro elétrico gasta quase <strong>1 kWh</strong>.
      </p>
    </details>
  );
}
