/**
 * Modo "não sei qual é o meu aparelho": perguntas sobre o que dá para ver (formato, onde fica, o que está escrito),
 * sem termos como potência, BTU ou inverter. Cada resposta só estreita as opções que o catálogo já tem; não há número
 * novo aqui. O que a pessoa não souber vira uma faixa (do mais econômico ao que mais gasta entre as opções que sobraram).
 *
 * Regras locais, sem IA e sem rede: as respostas ficam no aparelho como as outras escolhas do catálogo.
 */
import { consumoMensalKwh } from "./calculos";
import { aplicarVariantes, type ItemCatalogo } from "./catalogo";
import type { Aparelho } from "./tipos";

/** Resposta de quem não sabe: não estreita nada. */
export const NAO_SEI = "nao-sei";

export interface OpcaoVisual {
  id: string;
  rotulo: string;
  descricao?: string;
  /** Nome do desenho simples que acompanha a opção (a interface tem um para cada). */
  desenho: string;
  /** Quais opções do catálogo continuam possíveis com esta resposta, por pergunta do catálogo. */
  limita: Record<string, string[]>;
}

export interface PerguntaVisual {
  id: string;
  pergunta: string;
  ajuda?: string;
  opcoes: OpcaoVisual[];
}

/**
 * Guias por item do catálogo. Os tamanhos por cômodo do ar-condicionado são faixas, não um valor: "quarto" deixa
 * 7.500 e 9.000 BTUs (o catálogo já diz que 9.000 é o normal para um quarto comum), e assim por diante.
 */
export const GUIAS_VISUAIS: Record<string, PerguntaVisual[]> = {
  "ar-condicionado": [
    {
      id: "formato",
      pergunta: "Como ele é?",
      opcoes: [
        { id: "split", rotulo: "Duas partes", descricao: "Uma comprida na parede de dentro e uma caixa do lado de fora", desenho: "ar-split", limita: { tipo: ["split-comum", "split-inverter"] } },
        { id: "janela", rotulo: "Uma caixa na parede", descricao: "Encaixada numa abertura da parede ou da janela", desenho: "ar-janela", limita: { tipo: ["janela"] } },
        { id: "portatil", rotulo: "No chão, com rodinhas", descricao: "Com uma mangueira que vai até a janela", desenho: "ar-portatil", limita: { tipo: ["portatil"] } },
      ],
    },
    {
      id: "inverter",
      pergunta: "Tem a palavra INVERTER escrita nele ou no controle?",
      ajuda: "Costuma estar na frente do aparelho, no controle ou na etiqueta amarela.",
      opcoes: [
        { id: "sim", rotulo: "Sim, tem", desenho: "palavra-inverter", limita: { tipo: ["split-inverter"] } },
        { id: "nao", rotulo: "Não tem", desenho: "sem-palavra", limita: { tipo: ["split-comum", "janela", "portatil"] } },
      ],
    },
    {
      id: "lugar",
      pergunta: "Onde ele fica?",
      opcoes: [
        { id: "quarto", rotulo: "Num quarto", desenho: "comodo-pequeno", limita: { btus: ["7500", "9000"] } },
        { id: "sala", rotulo: "Na sala ou num quarto grande", desenho: "comodo-medio", limita: { btus: ["12000", "18000"] } },
        { id: "grande", rotulo: "Num espaço bem grande", descricao: "Salão, loja, sala com cozinha junto", desenho: "comodo-grande", limita: { btus: ["18000", "24000"] } },
      ],
    },
  ],
  geladeira: [
    {
      id: "portas",
      pergunta: "Como são as portas?",
      opcoes: [
        { id: "uma", rotulo: "Uma porta só", desenho: "geladeira-1", limita: { modelo: ["1-porta"] } },
        { id: "cima", rotulo: "Duas, congelador em cima", desenho: "geladeira-cima", limita: { modelo: ["duplex", "frost-free"] } },
        { id: "baixo", rotulo: "Duas, congelador embaixo", desenho: "geladeira-baixo", limita: { modelo: ["inverse"] } },
        { id: "lado", rotulo: "Duas, uma do lado da outra", desenho: "geladeira-lado", limita: { modelo: ["side-by-side"] } },
        { id: "pequena", rotulo: "Pequena, embaixo da bancada", desenho: "frigobar", limita: { modelo: ["frigobar"] } },
      ],
    },
    {
      id: "gelo",
      pergunta: "O congelador junta gelo nas paredes e precisa descongelar?",
      opcoes: [
        { id: "sim", rotulo: "Sim, junta gelo", desenho: "gelo", limita: { modelo: ["1-porta", "duplex", "frigobar"] } },
        { id: "nao", rotulo: "Não, nunca junta", desenho: "sem-gelo", limita: { modelo: ["frost-free", "inverse", "side-by-side"] } },
      ],
    },
    {
      id: "idade",
      pergunta: "Há quanto tempo vocês têm?",
      opcoes: [
        { id: "nova", rotulo: "Menos de 5 anos", desenho: "calendario", limita: { idade: ["nova"] } },
        { id: "media", rotulo: "De 5 a 10 anos", desenho: "calendario", limita: { idade: ["media"] } },
        { id: "antiga", rotulo: "Mais de 10 anos", desenho: "calendario", limita: { idade: ["antiga"] } },
      ],
    },
  ],
  tv: [
    {
      id: "formato",
      pergunta: "Como ela é vista de lado?",
      opcoes: [
        { id: "fina", rotulo: "Fina", descricao: "Tela reta, pode ir na parede", desenho: "tv-fina", limita: { tecnologia: ["led", "lcd", "plasma"] } },
        { id: "funda", rotulo: "Funda, com um fundo grande", descricao: "As TVs de tubo, bem antigas", desenho: "tv-tubo", limita: { tecnologia: ["tubo"] } },
      ],
    },
    {
      id: "apps",
      pergunta: "Ela abre aplicativos, como o YouTube?",
      opcoes: [
        { id: "sim", rotulo: "Sim, abre", desenho: "tv-apps", limita: { tecnologia: ["led"] } },
        { id: "nao", rotulo: "Não abre", desenho: "tv-sem-apps", limita: {} },
      ],
    },
    {
      id: "tamanho",
      pergunta: "De que tamanho ela é?",
      // Comparada com uma porta de dentro de casa (60 a 80 cm, medidas comerciais da NBR 15930), que todo mundo tem para
      // olhar. Largura da tela 16:9 = polegadas × 2,54 × 0,87: 32" ≈ 71 cm, 43" ≈ 95 cm, 55" ≈ 122 cm, 65" ≈ 144 cm
      // (dominio-energia, 25/11/2026: o "braço" variava demais de pessoa para pessoa).
      opcoes: [
        { id: "pequena", rotulo: "Pequena", descricao: "Mais estreita que uma porta", desenho: "tamanho-p", limita: { tamanho: ["ate-32"] } },
        { id: "media", rotulo: "Média", descricao: "Mais ou menos da largura de uma porta", desenho: "tamanho-m", limita: { tamanho: ["40-43", "50-55"] } },
        { id: "grande", rotulo: "Grande", descricao: "Bem mais larga que uma porta", desenho: "tamanho-g", limita: { tamanho: ["50-55", "65"] } },
      ],
    },
  ],
  ventilador: [
    {
      id: "lugar",
      pergunta: "Onde ele fica?",
      opcoes: [
        { id: "mesa", rotulo: "Em cima da mesa", descricao: "Pequeno, cabe numa mesinha", desenho: "ventilador-mesa", limita: { tipo: ["30"] } },
        { id: "chao", rotulo: "No chão, em pé", descricao: "Grande, com pé alto ou de coluna", desenho: "ventilador-chao", limita: { tipo: ["40"] } },
        { id: "teto", rotulo: "Preso no teto", desenho: "ventilador-teto", limita: { tipo: ["teto"] } },
      ],
    },
  ],
  "maquina-lavar": [
    {
      id: "seca",
      pergunta: "Ela também seca a roupa?",
      opcoes: [
        { id: "sim", rotulo: "Sim, lava e seca", desenho: "maquina-seca", limita: { tipo: ["lava-e-seca"] } },
        { id: "nao", rotulo: "Não, só lava", desenho: "maquina", limita: { tipo: ["tanquinho", "lavadora"] } },
      ],
    },
    {
      id: "enxague",
      pergunta: "Ela enxágua e centrifuga sozinha?",
      ajuda: "O tanquinho só bate a roupa; o enxágue é feito à mão.",
      opcoes: [
        { id: "sim", rotulo: "Sim, faz tudo", desenho: "maquina", limita: { tipo: ["lavadora", "lava-e-seca"] } },
        { id: "nao", rotulo: "Não, só bate a roupa", desenho: "tanquinho", limita: { tipo: ["tanquinho"] } },
      ],
    },
  ],
  "micro-ondas": [
    {
      id: "tamanho",
      pergunta: "De que tamanho ele é?",
      opcoes: [
        { id: "pequeno", rotulo: "Pequeno", descricao: "O prato de dentro é menor que um prato de jantar", desenho: "micro-p", limita: { tamanho: ["20"] } },
        { id: "grande", rotulo: "Grande", descricao: "Cabe um prato de jantar com folga", desenho: "micro-g", limita: { tamanho: ["30"] } },
      ],
    },
  ],
  // O chuveiro não tem pergunta visual que diga a potência com segurança: quem não sabe fica com a faixa toda do
  // catálogo e o caminho para o número certo (gravado no chuveiro ou na embalagem).
  chuveiro: [],
};

export interface Reconhecimento {
  /** Escolhas para gravar no aparelho: a única que sobrou, ou a mais comum entre as que sobraram. */
  escolhas: Record<string, string>;
  /** Todas as combinações ainda possíveis. Uma só quer dizer que a resposta é exata. */
  possiveis: Record<string, string>[];
  exato: boolean;
}

/**
 * Junta as respostas e diz o que sobra do catálogo. As perguntas do catálogo que o guia não cobre (ex.: aquecedor
 * solar no chuveiro) ficam com a escolha atual da pessoa. Uma resposta que contradiz as anteriores (ex.: "no chão" e
 * "tem INVERTER") é ignorada, para nunca sobrar nada.
 */
export function reconhecer(item: ItemCatalogo, respostas: Record<string, string>, atuais: Record<string, string> = {}): Reconhecimento {
  const guia = GUIAS_VISUAIS[item.id] ?? [];
  const cobertas = new Set(guia.flatMap((p) => p.opcoes.flatMap((o) => Object.keys(o.limita))));
  if (item.id === "chuveiro") cobertas.add("potencia");
  const permitidas = new Map<string, string[]>();
  for (const v of item.variantes ?? []) {
    const atual = atuais[v.id] ?? v.padrao;
    permitidas.set(v.id, cobertas.has(v.id) ? v.opcoes.map((o) => o.id) : [atual]);
  }

  for (const pergunta of guia) {
    const opcao = pergunta.opcoes.find((o) => o.id === respostas[pergunta.id]);
    if (!opcao) continue;
    const novas = new Map(permitidas);
    let contradiz = false;
    for (const [variante, lista] of Object.entries(opcao.limita)) {
      const restantes = (novas.get(variante) ?? []).filter((id) => lista.includes(id));
      if (restantes.length === 0) contradiz = true;
      novas.set(variante, restantes);
    }
    if (!contradiz) for (const [k, v] of novas) permitidas.set(k, v);
  }

  const escolhas: Record<string, string> = {};
  for (const v of item.variantes ?? []) {
    const lista = permitidas.get(v.id) ?? [v.padrao];
    escolhas[v.id] = lista.includes(v.padrao) ? v.padrao : (lista[Math.floor((lista.length - 1) / 2)] ?? v.padrao);
  }
  const possiveis = combinacoes([...permitidas.entries()]);
  return { escolhas, possiveis, exato: possiveis.length === 1 };
}

function combinacoes(listas: [string, string[]][]): Record<string, string>[] {
  return listas.reduce<Record<string, string>[]>((acc, [id, opcoes]) => acc.flatMap((parcial) => opcoes.map((o) => ({ ...parcial, [id]: o }))), [{}]);
}

type BaseDoAparelho = Pick<Aparelho, "potenciaW" | "minutosPorDia" | "quantidade" | "diasPorSemana" | "kwhMesInformado" | "fatorCiclo">;

/** Consumo do mês (kWh) do mais econômico ao que mais gasta entre as combinações possíveis, com o uso atual. */
export function faixaDeConsumo(item: ItemCatalogo, base: BaseDoAparelho, reconhecimento: Reconhecimento): { minKwh: number; maxKwh: number; usadoKwh: number } {
  const consumo = (escolhas: Record<string, string>) => consumoMensalKwh({ ...base, ...aplicarVariantes(item, escolhas) });
  const valores = reconhecimento.possiveis.map(consumo);
  return { minKwh: Math.min(...valores), maxKwh: Math.max(...valores), usadoKwh: consumo(reconhecimento.escolhas) };
}
