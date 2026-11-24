/**
 * Desenhos de traço simples para o modo "não sei qual é o meu aparelho": formas que a pessoa reconhece de olhar,
 * feitas em SVG pequeno (sem imagem para baixar). Decorativos: o texto da opção diz o mesmo.
 */
const TRACOS: Record<string, string> = {
  // Ar-condicionado
  "ar-split": "M4 10h28v8H4zM8 15h20M34 26h10v12H34zM39 30a3 3 0 1 0 0 .1M18 18v6l16 6",
  "ar-janela": "M6 6h36v36H6zM14 14h20v14H14zM17 18h14M17 22h14M14 34h6",
  "ar-portatil": "M14 6h14v32H14zM16 42h2M24 42h2M18 12h6M28 16c8 0 12-4 14-10",
  "palavra-inverter": "M4 16h40v16H4zM9 21v6M13 27v-6l4 6v-6M20 21l2 6 2-6M28 21h-3v6h3M25 24h2M31 27v-6h3a1.5 1.5 0 0 1 0 3h-3l3 3",
  "sem-palavra": "M4 16h40v16H4zM10 24h28",
  "comodo-pequeno": "M14 18h20v20H14zM20 30h8v8",
  "comodo-medio": "M8 14h32v24H8zM14 26h8v12M28 24h8v6h-8z",
  "comodo-grande": "M4 10h40v28H4zM8 22h10v16M24 20h8v8h-8zM36 20h4v8h-4z",
  // Geladeira
  "geladeira-1": "M14 4h20v40H14zM30 14v6M18 12h12",
  "geladeira-cima": "M14 4h20v40H14zM14 16h20M30 8v4M30 20v6",
  "geladeira-baixo": "M14 4h20v40H14zM14 30h20M30 14v6M30 34v4",
  "geladeira-lado": "M8 4h32v40H8zM24 4v40M20 18v6M28 18v6",
  frigobar: "M14 18h20v26H14zM14 26h20M30 30v4M10 18h28",
  gelo: "M24 6v36M10 14l28 20M38 14L10 34M20 8l4 4 4-4M20 40l4-4 4 4",
  "sem-gelo": "M24 6v36M10 14l28 20M38 14L10 34M6 6l36 36",
  calendario: "M8 10h32v30H8zM8 18h32M16 6v8M32 6v8M14 26h4M22 26h4M30 26h4M14 32h4M22 32h4",
  // TV
  "tv-fina": "M4 10h40v24H4zM20 34v6h8v-6M16 40h16",
  "tv-tubo": "M8 10h26v24H8zM34 14l8 4v12l-8 4M16 38h12",
  "tv-apps": "M4 10h40v24H4zM10 16h8v6h-8zM20 16h8v6h-8zM30 16h8v6h-8zM10 24h8v6h-8z",
  "tv-sem-apps": "M4 10h40v24H4zM12 22h24",
  "tamanho-p": "M16 16h16v12H16zM12 34h24",
  "tamanho-m": "M10 12h28v18H10zM6 36h36",
  "tamanho-g": "M4 8h40v24H4zM2 38h44",
  // Ventilador
  "ventilador-mesa": "M24 18a8 8 0 1 0 0 .1M24 26v12M16 40h16M24 10v16M16 18h16",
  "ventilador-chao": "M24 12a8 8 0 1 0 0 .1M24 20v20M16 42h16M24 4v16M16 12h16",
  "ventilador-teto": "M24 4v10M6 18h36M24 14a4 4 0 1 0 0 .1M20 22h8",
  // Lavanderia
  maquina: "M10 6h28v36H10zM10 14h28M24 28a8 8 0 1 0 0 .1M14 10h4",
  "maquina-seca": "M10 6h28v36H10zM10 14h28M24 28a8 8 0 1 0 0 .1M30 8c2 2-2 4 0 6",
  tanquinho: "M10 10h28v30H10zM14 10V6h20v4M24 18v14M18 22l6-4 6 4",
  // Micro-ondas
  "micro-p": "M10 16h28v18H10zM14 20h16v10H14zM34 20v4",
  "micro-g": "M4 12h40v24H4zM8 16h26v16H8zM38 18v4M38 26v4",
};

export function Desenho({ nome, className = "size-12" }: { nome: string; className?: string }) {
  const d = TRACOS[nome] ?? "M8 8h32v32H8z";
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}
