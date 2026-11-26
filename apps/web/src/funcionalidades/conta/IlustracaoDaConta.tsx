import { Check } from "lucide-react";

/** O que a conta dá. Sem promessa que o site não cumpre: a conta é opcional e grátis (princípios 1 e 6). */
const VANTAGENS = [
  "Abra a sua casa em outro celular, com e-mail e senha.",
  "Mande um link para a família acompanhar a conta, só para ver.",
  "Grátis e opcional: sem conta, tudo continua funcionando.",
];

/** Título do lado do desenho: muda com o modo, como nas telas de referência do dono (26/11). */
const TITULOS = { entrar: "A sua casa em qualquer celular.", criar: "Crie a sua conta, de graça." };

/**
 * O lado do desenho na tela de entrar (à direita; em "Criar conta", à esquerda), só em tela larga: dois celulares com a mesma casa, ligados por um raio. Desenho
 * em SVG no próprio HTML (nenhum arquivo a mais para baixar no 3G) e sem dado da pessoa.
 */
export function IlustracaoDaConta({ modo = "entrar" }: { modo?: keyof typeof TITULOS }) {
  return (
    <section aria-labelledby="titulo-vantagens" className="hidden lg:block">
      <svg viewBox="0 0 560 380" className="surgir block w-full max-w-xl" aria-hidden>
        <defs>
          <radialGradient id="brilho-da-conta" cx="50%" cy="52%" r="55%">
            <stop offset="0%" stopColor="#ffc629" stopOpacity="0.22" />
            <stop offset="45%" stopColor="#0a7356" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#0d1a31" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="280" cy="200" rx="280" ry="190" fill="url(#brilho-da-conta)" />
        <Celular x={52} y={52} />
        <Celular x={338} y={28} />
        {/* A casa vai de um celular para o outro */}
        <path d="M228 214 C 258 150, 304 140, 334 190" fill="none" stroke="#ffc629" strokeWidth="3" strokeDasharray="7 9" strokeLinecap="round" />
        <circle cx="281" cy="160" r="27" fill="#ffc629" />
        <path d="M285 142 L268 165 H280 L276 179 L294 155 H282 Z" fill="#0d1a31" />
      </svg>
      <h2 id="titulo-vantagens" className="titulo-largo mt-8 text-[2.6rem]">
        {TITULOS[modo]}
      </h2>
      <ul className="mt-6 space-y-3 text-lg text-white/85">
        {VANTAGENS.map((vantagem) => (
          <li key={vantagem} className="flex items-start gap-3">
            <span aria-hidden className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-faisca text-noite">
              <Check className="size-4" strokeWidth={3} />
            </span>
            {vantagem}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Um celular com a casa em corte na tela, igual à da página inicial em miniatura. */
function Celular({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="170" height="300" rx="26" fill="#172744" stroke="#2a3d62" strokeWidth="3" />
      <rect x="12" y="24" width="146" height="262" rx="14" fill="#0d1a31" />
      <rect x="65" y="10" width="40" height="6" rx="3" fill="#2a3d62" />
      <path d="M85 44 L146 88 H24 Z" fill="#2a3d62" />
      <circle cx="85" cy="74" r="7" fill="#ffc629" opacity="0.9" />
      <rect x="24" y="92" width="58" height="50" rx="7" fill="#fff1c9" />
      <rect x="88" y="92" width="58" height="50" rx="7" fill="#ffe7a1" stroke="#ffc629" strokeWidth="3" />
      <rect x="24" y="148" width="37" height="42" rx="7" fill="#fff1c9" />
      <rect x="66" y="148" width="38" height="42" rx="7" fill="#fff1c9" />
      <rect x="109" y="148" width="37" height="42" rx="7" fill="#fff1c9" />
      <rect x="128" y="99" width="12" height="7" rx="3.5" fill="#d1262e" />
      <rect x="24" y="208" width="86" height="12" rx="6" fill="#ffc629" />
      <rect x="24" y="230" width="122" height="8" rx="4" fill="#2a3d62" />
      <rect x="24" y="246" width="96" height="8" rx="4" fill="#2a3d62" />
    </g>
  );
}
