/**
 * Ícones desenhados para o site (estilo "desenhos próprios", escolhido pelo dono em 26/11). Os desenhos ficam num
 * arquivo só, `public/icones-v1.svg` (um <symbol> por ícone): o navegador baixa uma vez (≈ 5 kB) e guarda, e o modo sem
 * internet também. Nenhum desenho entra no JavaScript da página.
 *
 * Os nomes dos aparelhos, cômodos e dicas são os do `@ee/core` (os mesmos de antes, do lucide); os das telas
 * ("casa", "conta-de-luz", "meta"...) são novos. Nome desconhecido vira a tomada ("plug"), nunca um buraco.
 */
const ARQUIVO_DOS_ICONES = "/icones-v1.svg";

/** A família de cada ícone decide a cor do quadradinho de fundo (IconeComFundo). */
const FAMILIA = {
  "air-vent": "azul",
  "badge-check": "verde",
  "bath": "azul",
  "bed-double": "azul",
  "bike": "verde",
  "bot": "lilas",
  "brush-cleaning": "amarelo",
  "cadeado": "amarelo",
  "cake-slice": "amarelo",
  "car": "azul",
  "casa": "amarelo",
  "cctv": "verde",
  "coffee": "laranja",
  "conta-de-luz": "amarelo",
  "cooking-pot": "laranja",
  "cup-soda": "laranja",
  "dinheiro": "verde",
  "door-open": "verde",
  "drill": "laranja",
  "droplet": "azul",
  "droplets": "azul",
  "familia": "verde",
  "fan": "verde",
  "fence": "verde",
  "fish": "azul",
  "flag": "amarelo",
  "flame": "laranja",
  "gamepad-2": "lilas",
  "gauge": "verde",
  "glass-water": "azul",
  "grafico": "verde",
  "hand-heart": "amarelo",
  "heater": "laranja",
  "lamp": "amarelo",
  "lamp-desk": "amarelo",
  "laptop": "azul",
  "leitura": "lilas",
  "lightbulb": "amarelo",
  "lista": "azul",
  "meta": "laranja",
  "microwave": "laranja",
  "monitor": "azul",
  "pino-do-mapa": "laranja",
  "plug": "verde",
  "plug-zap": "verde",
  "popcorn": "amarelo",
  "power": "verde",
  "printer": "verde",
  "raio": "amarelo",
  "refrigerator": "azul",
  "router": "verde",
  "sandwich": "amarelo",
  "scissors": "laranja",
  "sem-internet": "azul",
  "shirt": "azul",
  "shower-head": "azul",
  "smartphone": "lilas",
  "snowflake": "azul",
  "sofa": "lilas",
  "soup": "laranja",
  "sparkles": "lilas",
  "speaker": "lilas",
  "sun": "amarelo",
  "thermometer": "laranja",
  "timer": "amarelo",
  "trees": "verde",
  "tv": "lilas",
  "tv-minimal": "lilas",
  "utensils-crossed": "laranja",
  "washing-machine": "azul",
  "waves": "azul",
  "wind": "azul",
} as const satisfies Record<string, Familia>;

type Familia = "azul" | "lilas" | "amarelo" | "laranja" | "verde";
export type NomeDoIcone = keyof typeof FAMILIA;

const FUNDO: Record<Familia, string> = {
  azul: "bg-icone-azul",
  lilas: "bg-icone-lilas",
  amarelo: "bg-icone-amarelo",
  laranja: "bg-icone-laranja",
  verde: "bg-icone-verde",
};

function ehNomeDoIcone(nome: string): nome is NomeDoIcone {
  return Object.hasOwn(FAMILIA, nome);
}

function nomeConhecido(nome: string | undefined): NomeDoIcone {
  return nome !== undefined && ehNomeDoIcone(nome) ? nome : "plug";
}

/**
 * Um ícone. Enfeite por padrão (`aria-hidden`): o texto ao lado já diz o que é. Com `rotulo`, vira imagem com nome
 * (quando o ícone está sozinho).
 */
export function Icone({ nome, className = "size-6", rotulo }: { nome: string | undefined; className?: string; rotulo?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={`shrink-0 ${className}`} aria-hidden={rotulo ? undefined : true} role={rotulo ? "img" : undefined} aria-label={rotulo} focusable="false">
      <use href={`${ARQUIVO_DOS_ICONES}#${nomeConhecido(nome)}`} />
    </svg>
  );
}

const TAMANHOS = {
  pequeno: { fundo: "size-9 rounded-[0.7rem]", icone: "size-6" },
  medio: { fundo: "size-11 rounded-[0.85rem]", icone: "size-8" },
  grande: { fundo: "size-14 rounded-[1.05rem]", icone: "size-10" },
} as const;

/** O ícone num quadradinho de fundo claro, na cor da família (azul para água e frio, laranja para cozinha...). */
export function IconeComFundo({ nome, tamanho = "medio", className = "", apagado = false }: { nome: string | undefined; tamanho?: keyof typeof TAMANHOS; className?: string; apagado?: boolean }) {
  const conhecido = nomeConhecido(nome);
  const medida = TAMANHOS[tamanho];
  return (
    <span aria-hidden className={`grid shrink-0 place-items-center ${medida.fundo} ${apagado ? "bg-fundo opacity-60 grayscale" : FUNDO[FAMILIA[conhecido]]} ${className}`}>
      <Icone nome={conhecido} className={medida.icone} />
    </span>
  );
}
