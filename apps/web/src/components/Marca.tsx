import Link from "next/link";

/** Lâmpada desenhada com uma seta da etiqueta de consumo dentro. */
export function Simbolo({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <rect width="40" height="40" rx="11" fill="var(--color-energia)" />
      <path d="M20 7.5a10 10 0 0 0-5.6 18.3c.9.6 1.4 1.5 1.4 2.5v1.2h8.4v-1.2c0-1 .5-1.9 1.4-2.5A10 10 0 0 0 20 7.5Z" fill="var(--color-faisca)" />
      <path d="M16 32.5h8M17.3 35.3h5.4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M14.5 15.3h8.2l2.3 2.6-2.3 2.6h-8.2z" fill="var(--color-energia)" />
    </svg>
  );
}

export function Marca({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 rounded-lg py-1 font-extrabold tracking-tight">
      <Simbolo />
      <span className="text-[1.15rem] leading-none">
        Eficiência
        <br />
        Energética
      </span>
    </Link>
  );
}
