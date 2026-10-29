import type { Aparelho, TipoComodo } from "./tipos";

/**
 * Como o tempo de uso é perguntado na tela:
 * - "tempo": horas/minutos por dia (TV, ventilador...)
 * - "banho": quantos banhos por dia × minutos por banho
 * - "etiqueta": o aparelho fica ligado o tempo todo e liga/desliga o motor sozinho; usamos o
 *   consumo mensal (kWh/mês) da etiqueta do INMETRO (geladeira, freezer)
 */
export type ModoUso = "tempo" | "banho" | "etiqueta";

export type CategoriaAparelho = "cozinha" | "banho" | "clima" | "iluminacao" | "lavanderia" | "eletronicos" | "limpeza" | "outros";

/** Uma pergunta sobre o aparelho que muda o consumo (ex.: "Que tipo de ar-condicionado?"). */
export interface Variante {
  id: string;
  pergunta: string;
  ajuda?: string;
  opcoes: { id: string; rotulo: string; descricao?: string }[];
  padrao: string;
}

/** O que muda no aparelho conforme as respostas das variantes. */
export interface ResultadoVariantes {
  potenciaW?: number;
  kwhMes?: number;
  /** Fração do tempo em que o motor/compressor está trabalhando (0 a 1). */
  fatorCiclo?: number;
  nome?: string;
}

export interface ItemCatalogo {
  id: string;
  nome: string;
  categoria: CategoriaAparelho;
  /** Nome do ícone na biblioteca Lucide (mesmo nome no site e no app). */
  icone: string;
  comodoSugerido: TipoComodo;
  modo: ModoUso;
  /** Potência típica em W. */
  potenciaW: number;
  /** Faixa comum de potência em W, para orientar a pessoa. */
  faixaW: [number, number];
  /** Tempo típico ligado por dia, em minutos. */
  minutosPorDia: number;
  diasPorSemana: number;
  /** Consumo mensal típico da etiqueta do INMETRO (modo "etiqueta"). */
  kwhMes?: number;
  /** Fração do tempo ligado em que o motor realmente trabalha (ar-condicionado, por exemplo). */
  fatorCiclo?: number;
  /** Para o modo "banho": banhos por dia e minutos por banho típicos. */
  banho?: { banhosPorDia: number; minutosPorBanho: number };
  /** Perguntas que ajustam o consumo ao modelo da pessoa. */
  variantes?: Variante[];
  calcular?: (escolhas: Record<string, string>) => ResultadoVariantes;
  /** Onde encontrar a potência/consumo real do aparelho. */
  ondeEncontrar: string;
  /** Itens antigos, mantidos para quem já cadastrou, mas que não aparecem mais na lista. */
  oculto?: boolean;
}

const IDADE: Variante = {
  id: "idade",
  pergunta: "Quantos anos ele tem?",
  ajuda: "Modelos antigos gastam bem mais, porque a borracha e o motor se desgastam.",
  padrao: "media",
  opcoes: [
    { id: "nova", rotulo: "Até 5 anos" },
    { id: "media", rotulo: "De 5 a 10 anos" },
    { id: "antiga", rotulo: "Mais de 10 anos" },
  ],
};

/** Consumo de geladeiras (kWh/mês) por modelo e idade — médias de etiquetas do INMETRO. */
const GELADEIRAS: Record<string, { rotulo: string; nome: string; kwh: [number, number, number] }> = {
  "1-porta": { rotulo: "1 porta", nome: "Geladeira de 1 porta", kwh: [25, 35, 50] },
  duplex: { rotulo: "2 portas (degelo manual)", nome: "Geladeira duplex", kwh: [40, 55, 75] },
  "frost-free": { rotulo: "2 portas frost free", nome: "Geladeira frost free", kwh: [42, 58, 85] },
  inverse: { rotulo: "Inverse (freezer embaixo)", nome: "Geladeira inverse", kwh: [45, 60, 85] },
  "side-by-side": { rotulo: "Side by side ou French door", nome: "Geladeira side by side", kwh: [65, 85, 115] },
  frigobar: { rotulo: "Frigobar", nome: "Frigobar", kwh: [18, 24, 35] },
};
const indiceIdade = (idade: string | undefined) => (idade === "nova" ? 0 : idade === "antiga" ? 2 : 1);

/** Potência elétrica por 1.000 BTUs e quanto do tempo o compressor trabalha, por tipo de ar-condicionado. */
const ARES: Record<string, { rotulo: string; descricao: string; wPorMilBtu: number; ciclo: number; nome: string }> = {
  "split-inverter": { rotulo: "Split inverter", descricao: "Aparelho de parede com a palavra inverter na etiqueta", wPorMilBtu: 85, ciclo: 0.6, nome: "Ar split inverter" },
  "split-comum": { rotulo: "Split comum", descricao: "Aparelho de parede sem inverter (liga e desliga)", wPorMilBtu: 95, ciclo: 0.85, nome: "Ar split" },
  janela: { rotulo: "De janela (antigo)", descricao: "A caixa fica numa abertura da parede", wPorMilBtu: 115, ciclo: 0.9, nome: "Ar de janela" },
  portatil: { rotulo: "Portátil", descricao: "Tem rodinhas e uma mangueira para a janela", wPorMilBtu: 120, ciclo: 0.9, nome: "Ar portátil" },
};

/** Potência de TVs (W) por tecnologia e tamanho. */
const TVS: Record<string, { rotulo: string; curto: string; w: [number, number, number, number] }> = {
  led: { rotulo: "LED ou Smart TV", curto: "LED", w: [45, 75, 110, 150] },
  lcd: { rotulo: "LCD fina antiga", curto: "LCD", w: [90, 130, 180, 230] },
  plasma: { rotulo: "Plasma", curto: "de plasma", w: [200, 250, 350, 450] },
  tubo: { rotulo: "De tubo (bem antiga)", curto: "de tubo", w: [100, 130, 130, 130] },
};
const TAMANHOS_TV = [
  { id: "ate-32", rotulo: "Até 32 pol.", nome: "até 32 polegadas" },
  { id: "40-43", rotulo: "40 a 43 pol.", nome: "de 40 a 43 polegadas" },
  { id: "50-55", rotulo: "50 a 55 pol.", nome: "de 50 a 55 polegadas" },
  { id: "65", rotulo: "65 pol. ou mais", nome: "de 65 polegadas ou mais" },
];

const opcoesDe = (tabela: Record<string, { rotulo: string; descricao?: string }>) => Object.entries(tabela).map(([id, v]) => ({ id, rotulo: v.rotulo, descricao: v.descricao }));
const potencias = (lista: { id: string; rotulo: string; w: number; nome?: string }[]) => ({
  opcoes: lista.map(({ id, rotulo }) => ({ id, rotulo })),
  calcular: (id: string) => {
    const o = lista.find((x) => x.id === id) ?? lista[0]!;
    return { potenciaW: o.w, nome: o.nome };
  },
});

const CHUVEIRO = potencias([
  { id: "4500", rotulo: "4.500 W", w: 4500 },
  { id: "5500", rotulo: "5.500 W", w: 5500 },
  { id: "6800", rotulo: "6.800 W", w: 6800 },
  { id: "7500", rotulo: "7.500 W ou mais", w: 7500 },
]);
const MAQUINA = potencias([
  { id: "tanquinho", rotulo: "Tanquinho", w: 300, nome: "Tanquinho" },
  { id: "lavadora", rotulo: "Lavadora", w: 500, nome: "Máquina de lavar" },
  { id: "lava-e-seca", rotulo: "Lava e seca", w: 1100, nome: "Lava e seca" },
]);
const VENTILADOR = potencias([
  { id: "30", rotulo: "Pequeno (30 cm)", w: 60, nome: "Ventilador pequeno" },
  { id: "40", rotulo: "Grande (40 cm ou coluna)", w: 130, nome: "Ventilador" },
  { id: "teto", rotulo: "De teto", w: 100, nome: "Ventilador de teto" },
]);
const COMPUTADOR = potencias([
  { id: "escritorio", rotulo: "Para estudo e trabalho", w: 180, nome: "Computador de mesa" },
  { id: "gamer", rotulo: "Gamer", w: 400, nome: "Computador gamer" },
  { id: "all-in-one", rotulo: "Tudo em um (all-in-one)", w: 80, nome: "Computador all-in-one" },
]);
const VIDEOGAME = potencias([
  { id: "atual", rotulo: "PS5 ou Xbox Series", w: 200, nome: "Videogame (PS5/Xbox Series)" },
  { id: "anterior", rotulo: "PS4 ou Xbox One", w: 140, nome: "Videogame (PS4/Xbox One)" },
  { id: "portatil", rotulo: "Nintendo Switch ou portátil", w: 15, nome: "Videogame portátil" },
]);
const MICRO_ONDAS = potencias([
  { id: "20", rotulo: "Pequeno (até 20 L)", w: 1100 },
  { id: "30", rotulo: "Grande (25 L ou mais)", w: 1500 },
]);
const AIR_FRYER = potencias([
  { id: "pequena", rotulo: "Até 3,5 L", w: 1200 },
  { id: "media", rotulo: "4 a 6 L", w: 1500 },
  { id: "forno", rotulo: "Forno air fryer (10 L ou mais)", w: 1800 },
]);
const FERRO = potencias([
  { id: "seco", rotulo: "Ferro seco", w: 1000, nome: "Ferro de passar" },
  { id: "vapor", rotulo: "Ferro a vapor", w: 1600, nome: "Ferro a vapor" },
]);

/**
 * Valores típicos de referência, baseados nas tabelas de consumo do PROCEL e nas etiquetas do INMETRO.
 * Servem como ponto de partida: a pessoa pode ajustar com os dados do próprio aparelho.
 */
export const CATALOGO: ItemCatalogo[] = [
  // Banho
  {
    id: "chuveiro",
    nome: "Chuveiro elétrico",
    categoria: "banho",
    icone: "shower-head",
    comodoSugerido: "banheiro",
    modo: "banho",
    potenciaW: 5500,
    faixaW: [3500, 7800],
    minutosPorDia: 32,
    diasPorSemana: 7,
    banho: { banhosPorDia: 4, minutosPorBanho: 8 },
    variantes: [
      { id: "potencia", pergunta: "Qual a potência?", ajuda: "Vem escrita na embalagem ou no próprio chuveiro.", padrao: "5500", opcoes: CHUVEIRO.opcoes },
      {
        id: "aquecimento",
        pergunta: "A casa tem aquecedor solar?",
        padrao: "nao",
        opcoes: [
          { id: "nao", rotulo: "Não, só o chuveiro" },
          { id: "solar", rotulo: "Sim, aquecedor solar", descricao: "O chuveiro só esquenta nos dias nublados" },
        ],
      },
    ],
    calcular: (e) => ({ potenciaW: CHUVEIRO.calcular(e.potencia ?? "5500").potenciaW, fatorCiclo: e.aquecimento === "solar" ? 0.3 : 1 }),
    ondeEncontrar: "Na embalagem ou gravado no próprio chuveiro (ex.: 5500 W). Na posição verão ele gasta menos.",
  },
  { id: "torneira-eletrica", nome: "Torneira elétrica", categoria: "banho", icone: "droplets", comodoSugerido: "cozinha", modo: "tempo", potenciaW: 3500, faixaW: [3000, 5500], minutosPorDia: 10, diasPorSemana: 7, ondeEncontrar: "Na embalagem ou gravado no corpo da torneira." },
  { id: "secador-cabelo", nome: "Secador de cabelo", categoria: "banho", icone: "wind", comodoSugerido: "banheiro", modo: "tempo", potenciaW: 1600, faixaW: [1000, 2400], minutosPorDia: 10, diasPorSemana: 4, ondeEncontrar: "Na etiqueta perto do cabo." },
  { id: "chapinha", nome: "Chapinha ou modelador", categoria: "banho", icone: "sparkles", comodoSugerido: "banheiro", modo: "tempo", potenciaW: 60, faixaW: [30, 200], minutosPorDia: 15, diasPorSemana: 3, ondeEncontrar: "Na etiqueta perto do cabo." },

  // Cozinha
  {
    id: "geladeira",
    nome: "Geladeira",
    categoria: "cozinha",
    icone: "refrigerator",
    comodoSugerido: "cozinha",
    modo: "etiqueta",
    potenciaW: 90,
    faixaW: [70, 250],
    minutosPorDia: 1440,
    diasPorSemana: 7,
    kwhMes: 35,
    variantes: [{ id: "modelo", pergunta: "Qual o modelo?", padrao: "1-porta", opcoes: opcoesDe(GELADEIRAS) }, IDADE],
    calcular: (e) => {
      const g = GELADEIRAS[e.modelo ?? "1-porta"] ?? GELADEIRAS["1-porta"]!;
      return { kwhMes: g.kwh[indiceIdade(e.idade)], nome: g.nome };
    },
    ondeEncontrar: "Na etiqueta amarela do INMETRO (Selo Procel), no campo \"Consumo de energia (kWh/mês)\". Se não tiver a etiqueta, escolha o modelo e a idade.",
  },
  { id: "geladeira-duplex", nome: "Geladeira de 2 portas", categoria: "cozinha", icone: "refrigerator", comodoSugerido: "cozinha", modo: "etiqueta", potenciaW: 130, faixaW: [100, 250], minutosPorDia: 1440, diasPorSemana: 7, kwhMes: 45, oculto: true, ondeEncontrar: "Na etiqueta amarela do INMETRO, no campo \"Consumo de energia (kWh/mês)\"." },
  {
    id: "freezer",
    nome: "Freezer",
    categoria: "cozinha",
    icone: "snowflake",
    comodoSugerido: "cozinha",
    modo: "etiqueta",
    potenciaW: 130,
    faixaW: [90, 250],
    minutosPorDia: 1440,
    diasPorSemana: 7,
    kwhMes: 50,
    variantes: [
      {
        id: "tipo",
        pergunta: "Qual o tipo?",
        padrao: "horizontal",
        opcoes: [
          { id: "horizontal", rotulo: "Horizontal (tampa em cima)" },
          { id: "vertical", rotulo: "Vertical (porta na frente)" },
        ],
      },
      IDADE,
    ],
    calcular: (e) => {
      const tabela = e.tipo === "vertical" ? [40, 55, 75] : [35, 50, 70];
      return { kwhMes: tabela[indiceIdade(e.idade)], nome: e.tipo === "vertical" ? "Freezer vertical" : "Freezer horizontal" };
    },
    ondeEncontrar: "Na etiqueta amarela do INMETRO, no campo \"Consumo de energia (kWh/mês)\".",
  },
  { id: "purificador", nome: "Purificador ou bebedouro gelado", categoria: "cozinha", icone: "glass-water", comodoSugerido: "cozinha", modo: "etiqueta", potenciaW: 90, faixaW: [60, 120], minutosPorDia: 1440, diasPorSemana: 7, kwhMes: 15, ondeEncontrar: "Na etiqueta atrás do aparelho. Os que só filtram, sem gelar, quase não gastam." },
  { id: "micro-ondas", nome: "Micro-ondas", categoria: "cozinha", icone: "microwave", comodoSugerido: "cozinha", modo: "tempo", potenciaW: 1300, faixaW: [1000, 1800], minutosPorDia: 10, diasPorSemana: 7, variantes: [{ id: "tamanho", pergunta: "Qual o tamanho?", padrao: "30", opcoes: MICRO_ONDAS.opcoes }], calcular: (e) => MICRO_ONDAS.calcular(e.tamanho ?? "30"), ondeEncontrar: "Na etiqueta atrás do aparelho ou dentro da porta (\"potência de entrada\")." },
  { id: "air-fryer", nome: "Air fryer", categoria: "cozinha", icone: "cooking-pot", comodoSugerido: "cozinha", modo: "tempo", potenciaW: 1500, faixaW: [1000, 2000], minutosPorDia: 20, diasPorSemana: 5, variantes: [{ id: "tamanho", pergunta: "Qual o tamanho do cesto?", padrao: "media", opcoes: AIR_FRYER.opcoes }], calcular: (e) => AIR_FRYER.calcular(e.tamanho ?? "media"), ondeEncontrar: "Na etiqueta embaixo do aparelho." },
  { id: "forno-eletrico", nome: "Forno elétrico", categoria: "cozinha", icone: "cooking-pot", comodoSugerido: "cozinha", modo: "tempo", potenciaW: 1500, faixaW: [1000, 2500], minutosPorDia: 30, diasPorSemana: 2, ondeEncontrar: "Na etiqueta atrás ou embaixo do forno." },
  { id: "cooktop-inducao", nome: "Cooktop de indução", categoria: "cozinha", icone: "flame", comodoSugerido: "cozinha", modo: "tempo", potenciaW: 2000, faixaW: [1200, 3500], minutosPorDia: 40, diasPorSemana: 7, ondeEncontrar: "Na etiqueta embaixo do cooktop. A potência é por boca; considere as bocas usadas juntas." },
  { id: "lava-loucas", nome: "Lava-louças", categoria: "cozinha", icone: "utensils-crossed", comodoSugerido: "cozinha", modo: "tempo", potenciaW: 1400, faixaW: [1000, 2000], minutosPorDia: 90, diasPorSemana: 3, fatorCiclo: 0.6, ondeEncontrar: "Na etiqueta da porta. O aquecimento da água é a parte que mais gasta." },
  { id: "cafeteira", nome: "Cafeteira elétrica", categoria: "cozinha", icone: "coffee", comodoSugerido: "cozinha", modo: "tempo", potenciaW: 700, faixaW: [500, 1200], minutosPorDia: 15, diasPorSemana: 7, ondeEncontrar: "Na etiqueta embaixo da cafeteira." },
  { id: "cafeteira-capsula", nome: "Cafeteira de cápsula", categoria: "cozinha", icone: "coffee", comodoSugerido: "cozinha", modo: "tempo", potenciaW: 1300, faixaW: [1100, 1500], minutosPorDia: 3, diasPorSemana: 7, ondeEncontrar: "Na etiqueta embaixo da cafeteira." },
  { id: "chaleira", nome: "Chaleira elétrica", categoria: "cozinha", icone: "glass-water", comodoSugerido: "cozinha", modo: "tempo", potenciaW: 1500, faixaW: [1000, 2200], minutosPorDia: 5, diasPorSemana: 7, ondeEncontrar: "Na base da chaleira." },
  { id: "panela-eletrica", nome: "Panela elétrica (arroz ou pressão)", categoria: "cozinha", icone: "soup", comodoSugerido: "cozinha", modo: "tempo", potenciaW: 800, faixaW: [500, 1200], minutosPorDia: 30, diasPorSemana: 5, ondeEncontrar: "Na etiqueta embaixo da panela." },
  { id: "liquidificador", nome: "Liquidificador", categoria: "cozinha", icone: "cup-soda", comodoSugerido: "cozinha", modo: "tempo", potenciaW: 600, faixaW: [300, 1400], minutosPorDia: 5, diasPorSemana: 5, ondeEncontrar: "Na etiqueta embaixo da base." },
  { id: "batedeira", nome: "Batedeira ou mixer", categoria: "cozinha", icone: "cake-slice", comodoSugerido: "cozinha", modo: "tempo", potenciaW: 400, faixaW: [150, 800], minutosPorDia: 10, diasPorSemana: 1, ondeEncontrar: "Na etiqueta do corpo da batedeira." },
  { id: "sanduicheira", nome: "Sanduicheira ou grill", categoria: "cozinha", icone: "sandwich", comodoSugerido: "cozinha", modo: "tempo", potenciaW: 800, faixaW: [600, 1500], minutosPorDia: 10, diasPorSemana: 3, ondeEncontrar: "Na etiqueta embaixo do aparelho." },
  { id: "pipoqueira", nome: "Pipoqueira elétrica", categoria: "cozinha", icone: "popcorn", comodoSugerido: "cozinha", modo: "tempo", potenciaW: 1200, faixaW: [900, 1400], minutosPorDia: 5, diasPorSemana: 1, ondeEncontrar: "Na etiqueta embaixo do aparelho." },
  { id: "exaustor", nome: "Coifa ou exaustor", categoria: "cozinha", icone: "fan", comodoSugerido: "cozinha", modo: "tempo", potenciaW: 150, faixaW: [80, 300], minutosPorDia: 40, diasPorSemana: 7, ondeEncontrar: "Na etiqueta dentro da coifa (tire o filtro para ver)." },

  // Calor e frio
  {
    id: "ventilador",
    nome: "Ventilador",
    categoria: "clima",
    icone: "fan",
    comodoSugerido: "quarto",
    modo: "tempo",
    potenciaW: 130,
    faixaW: [40, 200],
    minutosPorDia: 480,
    diasPorSemana: 7,
    variantes: [{ id: "tipo", pergunta: "Qual o tipo?", padrao: "40", opcoes: VENTILADOR.opcoes }],
    calcular: (e) => VENTILADOR.calcular(e.tipo ?? "40"),
    ondeEncontrar: "Na etiqueta da base ou do motor.",
  },
  {
    id: "ar-condicionado",
    nome: "Ar-condicionado",
    categoria: "clima",
    icone: "air-vent",
    comodoSugerido: "quarto",
    modo: "tempo",
    potenciaW: 855,
    faixaW: [500, 3500],
    minutosPorDia: 480,
    diasPorSemana: 7,
    fatorCiclo: 0.85,
    variantes: [
      { id: "tipo", pergunta: "Que tipo de ar-condicionado?", ajuda: "Os inverter controlam a velocidade do motor e gastam bem menos.", padrao: "split-comum", opcoes: opcoesDe(ARES) },
      {
        id: "btus",
        pergunta: "De quantos BTUs?",
        ajuda: "Vem na etiqueta. Para um quarto comum, o normal é 9.000 BTUs.",
        padrao: "9000",
        opcoes: [
          { id: "7500", rotulo: "7.500" },
          { id: "9000", rotulo: "9.000" },
          { id: "12000", rotulo: "12.000" },
          { id: "18000", rotulo: "18.000" },
          { id: "24000", rotulo: "24.000 ou mais" },
        ],
      },
    ],
    calcular: (e) => {
      const ar = ARES[e.tipo ?? "split-comum"] ?? ARES["split-comum"]!;
      const btus = Number(e.btus ?? 9000);
      return { potenciaW: Math.round((ar.wPorMilBtu * btus) / 1000 / 5) * 5, fatorCiclo: ar.ciclo, nome: `${ar.nome} ${btus.toLocaleString("pt-BR")} BTUs` };
    },
    ondeEncontrar:
      "Na etiqueta do INMETRO ou na lateral da unidade interna (\"potência elétrica\", em W). A conta já considera que o motor desliga sozinho quando o cômodo esfria (nos inverter, ele só diminui).",
  },
  { id: "climatizador", nome: "Climatizador", categoria: "clima", icone: "wind", comodoSugerido: "quarto", modo: "tempo", potenciaW: 120, faixaW: [60, 250], minutosPorDia: 360, diasPorSemana: 7, ondeEncontrar: "Na etiqueta atrás do climatizador." },
  { id: "aquecedor", nome: "Aquecedor elétrico", categoria: "clima", icone: "heater", comodoSugerido: "quarto", modo: "tempo", potenciaW: 1500, faixaW: [800, 2200], minutosPorDia: 180, diasPorSemana: 7, fatorCiclo: 0.8, ondeEncontrar: "Na etiqueta atrás ou embaixo do aquecedor." },
  { id: "desumidificador", nome: "Desumidificador", categoria: "clima", icone: "droplet", comodoSugerido: "quarto", modo: "tempo", potenciaW: 250, faixaW: [150, 500], minutosPorDia: 240, diasPorSemana: 7, ondeEncontrar: "Na etiqueta atrás do aparelho." },

  // Iluminação
  { id: "lampada-led", nome: "Lâmpada de LED", categoria: "iluminacao", icone: "lightbulb", comodoSugerido: "sala", modo: "tempo", potenciaW: 9, faixaW: [5, 20], minutosPorDia: 300, diasPorSemana: 7, ondeEncontrar: "Escrito na própria lâmpada ou na caixa (ex.: 9 W)." },
  { id: "lampada-fluorescente", nome: "Lâmpada fluorescente", categoria: "iluminacao", icone: "lightbulb", comodoSugerido: "sala", modo: "tempo", potenciaW: 15, faixaW: [9, 40], minutosPorDia: 300, diasPorSemana: 7, ondeEncontrar: "Escrito na base da lâmpada (ex.: 15 W)." },
  { id: "lampada-incandescente", nome: "Lâmpada amarela antiga", categoria: "iluminacao", icone: "lightbulb", comodoSugerido: "sala", modo: "tempo", potenciaW: 60, faixaW: [40, 100], minutosPorDia: 300, diasPorSemana: 7, ondeEncontrar: "Escrito no vidro ou na base (ex.: 60 W). É a lâmpada incandescente, que esquenta muito." },
  { id: "luminaria", nome: "Luminária ou abajur", categoria: "iluminacao", icone: "lamp-desk", comodoSugerido: "quarto", modo: "tempo", potenciaW: 9, faixaW: [4, 60], minutosPorDia: 120, diasPorSemana: 7, ondeEncontrar: "Na lâmpada da luminária." },
  { id: "refletor", nome: "Refletor externo", categoria: "iluminacao", icone: "lamp", comodoSugerido: "area-externa", modo: "tempo", potenciaW: 50, faixaW: [20, 200], minutosPorDia: 600, diasPorSemana: 7, ondeEncontrar: "Na etiqueta do refletor. Os de LED gastam bem menos que os de halogênio." },

  // Lavanderia
  {
    id: "maquina-lavar",
    nome: "Máquina de lavar",
    categoria: "lavanderia",
    icone: "washing-machine",
    comodoSugerido: "lavanderia",
    modo: "tempo",
    potenciaW: 500,
    faixaW: [250, 2000],
    minutosPorDia: 60,
    diasPorSemana: 3,
    variantes: [{ id: "tipo", pergunta: "Qual o tipo?", padrao: "lavadora", opcoes: MAQUINA.opcoes }],
    calcular: (e) => MAQUINA.calcular(e.tipo ?? "lavadora"),
    ondeEncontrar: "Na etiqueta atrás da máquina.",
  },
  { id: "tanquinho", nome: "Tanquinho", categoria: "lavanderia", icone: "washing-machine", comodoSugerido: "lavanderia", modo: "tempo", potenciaW: 300, faixaW: [200, 500], minutosPorDia: 60, diasPorSemana: 3, oculto: true, ondeEncontrar: "Na etiqueta atrás do tanquinho." },
  { id: "secadora", nome: "Secadora de roupas", categoria: "lavanderia", icone: "wind", comodoSugerido: "lavanderia", modo: "tempo", potenciaW: 2500, faixaW: [1500, 3500], minutosPorDia: 60, diasPorSemana: 2, ondeEncontrar: "Na etiqueta da porta ou de trás." },
  { id: "centrifuga", nome: "Centrífuga", categoria: "lavanderia", icone: "washing-machine", comodoSugerido: "lavanderia", modo: "tempo", potenciaW: 300, faixaW: [200, 400], minutosPorDia: 10, diasPorSemana: 3, ondeEncontrar: "Na etiqueta atrás da centrífuga." },
  { id: "ferro", nome: "Ferro de passar", categoria: "lavanderia", icone: "shirt", comodoSugerido: "lavanderia", modo: "tempo", potenciaW: 1000, faixaW: [700, 2400], minutosPorDia: 60, diasPorSemana: 2, fatorCiclo: 0.7, variantes: [{ id: "tipo", pergunta: "Qual o tipo?", padrao: "seco", opcoes: FERRO.opcoes }], calcular: (e) => FERRO.calcular(e.tipo ?? "seco"), ondeEncontrar: "Na etiqueta perto do cabo ou embaixo da base." },
  { id: "bomba-dagua", nome: "Bomba d'água", categoria: "lavanderia", icone: "waves", comodoSugerido: "area-externa", modo: "tempo", potenciaW: 750, faixaW: [370, 1500], minutosPorDia: 30, diasPorSemana: 7, ondeEncontrar: "Na plaquinha do motor (às vezes em CV: 1 CV ≈ 750 W)." },
  { id: "maquina-costura", nome: "Máquina de costura", categoria: "lavanderia", icone: "scissors", comodoSugerido: "outro", modo: "tempo", potenciaW: 100, faixaW: [60, 200], minutosPorDia: 60, diasPorSemana: 2, ondeEncontrar: "Na plaquinha do motor ou no pedal." },

  // Eletrônicos
  {
    id: "tv",
    nome: "Televisão",
    categoria: "eletronicos",
    icone: "tv",
    comodoSugerido: "sala",
    modo: "tempo",
    potenciaW: 45,
    faixaW: [30, 450],
    minutosPorDia: 300,
    diasPorSemana: 7,
    variantes: [
      { id: "tecnologia", pergunta: "Que tipo de TV?", padrao: "led", opcoes: opcoesDe(TVS) },
      { id: "tamanho", pergunta: "De que tamanho?", padrao: "ate-32", opcoes: TAMANHOS_TV.map(({ id, rotulo }) => ({ id, rotulo })) },
    ],
    calcular: (e) => {
      const tv = TVS[e.tecnologia ?? "led"] ?? TVS.led!;
      const i = Math.max(0, TAMANHOS_TV.findIndex((t) => t.id === e.tamanho));
      return { potenciaW: tv.w[i], nome: `TV ${tv.curto} ${TAMANHOS_TV[i]!.nome}` };
    },
    ondeEncontrar: "Na etiqueta atrás da TV (\"consumo\" ou \"potência\", em W).",
  },
  { id: "tv-pequena", nome: "TV até 32 polegadas", categoria: "eletronicos", icone: "tv", comodoSugerido: "sala", modo: "tempo", potenciaW: 60, faixaW: [40, 90], minutosPorDia: 300, diasPorSemana: 7, oculto: true, ondeEncontrar: "Na etiqueta atrás da TV (\"consumo\" ou \"potência\", em W)." },
  { id: "tv-grande", nome: "TV de 40 polegadas ou mais", categoria: "eletronicos", icone: "tv", comodoSugerido: "sala", modo: "tempo", potenciaW: 110, faixaW: [70, 250], minutosPorDia: 300, diasPorSemana: 7, oculto: true, ondeEncontrar: "Na etiqueta atrás da TV (\"consumo\" ou \"potência\", em W)." },
  { id: "tv-box", nome: "TV box ou aparelho de TV a cabo", categoria: "eletronicos", icone: "tv-minimal", comodoSugerido: "sala", modo: "tempo", potenciaW: 10, faixaW: [5, 25], minutosPorDia: 300, diasPorSemana: 7, ondeEncontrar: "Na fonte do aparelho." },
  { id: "som", nome: "Aparelho de som ou caixa de som", categoria: "eletronicos", icone: "speaker", comodoSugerido: "sala", modo: "tempo", potenciaW: 40, faixaW: [10, 300], minutosPorDia: 60, diasPorSemana: 5, ondeEncontrar: "Na etiqueta atrás do aparelho." },
  {
    id: "computador",
    nome: "Computador de mesa",
    categoria: "eletronicos",
    icone: "monitor",
    comodoSugerido: "escritorio",
    modo: "tempo",
    potenciaW: 180,
    faixaW: [60, 700],
    minutosPorDia: 240,
    diasPorSemana: 7,
    variantes: [{ id: "tipo", pergunta: "Para que é usado?", ajuda: "O valor já inclui o monitor.", padrao: "escritorio", opcoes: COMPUTADOR.opcoes }],
    calcular: (e) => COMPUTADOR.calcular(e.tipo ?? "escritorio"),
    ondeEncontrar: "Na fonte atrás do gabinete. O monitor tem etiqueta própria.",
  },
  { id: "notebook", nome: "Notebook", categoria: "eletronicos", icone: "laptop", comodoSugerido: "escritorio", modo: "tempo", potenciaW: 60, faixaW: [30, 230], minutosPorDia: 240, diasPorSemana: 7, ondeEncontrar: "No carregador (\"output\", em W)." },
  { id: "monitor", nome: "Monitor extra", categoria: "eletronicos", icone: "monitor", comodoSugerido: "escritorio", modo: "tempo", potenciaW: 25, faixaW: [15, 60], minutosPorDia: 240, diasPorSemana: 5, ondeEncontrar: "Na etiqueta atrás do monitor." },
  { id: "impressora", nome: "Impressora", categoria: "eletronicos", icone: "printer", comodoSugerido: "escritorio", modo: "tempo", potenciaW: 30, faixaW: [10, 500], minutosPorDia: 10, diasPorSemana: 2, ondeEncontrar: "Na etiqueta atrás da impressora. As a laser gastam bem mais que as jato de tinta." },
  {
    id: "videogame",
    nome: "Videogame",
    categoria: "eletronicos",
    icone: "gamepad-2",
    comodoSugerido: "sala",
    modo: "tempo",
    potenciaW: 200,
    faixaW: [10, 250],
    minutosPorDia: 120,
    diasPorSemana: 7,
    variantes: [{ id: "modelo", pergunta: "Qual videogame?", padrao: "atual", opcoes: VIDEOGAME.opcoes }],
    calcular: (e) => VIDEOGAME.calcular(e.modelo ?? "atual"),
    ondeEncontrar: "Na etiqueta atrás ou embaixo do console.",
  },
  { id: "carregador-celular", nome: "Carregador de celular", categoria: "eletronicos", icone: "smartphone", comodoSugerido: "quarto", modo: "tempo", potenciaW: 15, faixaW: [5, 65], minutosPorDia: 120, diasPorSemana: 7, ondeEncontrar: "Escrito no carregador (ex.: 20 W)." },
  { id: "roteador", nome: "Roteador ou modem de internet", categoria: "eletronicos", icone: "router", comodoSugerido: "sala", modo: "tempo", potenciaW: 12, faixaW: [6, 25], minutosPorDia: 1440, diasPorSemana: 7, ondeEncontrar: "Na fonte do roteador." },
  { id: "assistente-voz", nome: "Assistente de voz (Alexa e similares)", categoria: "eletronicos", icone: "speaker", comodoSugerido: "sala", modo: "tempo", potenciaW: 3, faixaW: [2, 15], minutosPorDia: 1440, diasPorSemana: 7, ondeEncontrar: "Na fonte do aparelho." },
  { id: "camera-seguranca", nome: "Câmera de segurança", categoria: "eletronicos", icone: "cctv", comodoSugerido: "area-externa", modo: "tempo", potenciaW: 5, faixaW: [3, 15], minutosPorDia: 1440, diasPorSemana: 7, ondeEncontrar: "Na fonte da câmera." },

  // Limpeza
  { id: "aspirador", nome: "Aspirador de pó", categoria: "limpeza", icone: "brush-cleaning", comodoSugerido: "sala", modo: "tempo", potenciaW: 1200, faixaW: [600, 2000], minutosPorDia: 20, diasPorSemana: 2, ondeEncontrar: "Na etiqueta do corpo do aspirador." },
  { id: "robo-aspirador", nome: "Robô aspirador", categoria: "limpeza", icone: "bot", comodoSugerido: "sala", modo: "tempo", potenciaW: 30, faixaW: [20, 70], minutosPorDia: 90, diasPorSemana: 5, ondeEncontrar: "Na base de carregamento." },
  { id: "lavadora-alta-pressao", nome: "Lavadora de alta pressão", categoria: "limpeza", icone: "droplets", comodoSugerido: "area-externa", modo: "tempo", potenciaW: 1500, faixaW: [1200, 2200], minutosPorDia: 30, diasPorSemana: 7 / 30, ondeEncontrar: "Na etiqueta do corpo da lavadora." },

  // Outros
  { id: "bomba-piscina", nome: "Bomba de piscina", categoria: "outros", icone: "waves", comodoSugerido: "area-externa", modo: "tempo", potenciaW: 750, faixaW: [250, 1500], minutosPorDia: 240, diasPorSemana: 7, ondeEncontrar: "Na plaquinha do motor (em CV: 1 CV ≈ 750 W)." },
  { id: "aquario", nome: "Aquário (filtro, luz e aquecedor)", categoria: "outros", icone: "fish", comodoSugerido: "sala", modo: "tempo", potenciaW: 40, faixaW: [10, 300], minutosPorDia: 1440, diasPorSemana: 7, ondeEncontrar: "Some a potência do filtro, da luz e do aquecedor (estão nas etiquetas de cada um)." },
  { id: "portao", nome: "Portão eletrônico", categoria: "outros", icone: "fence", comodoSugerido: "area-externa", modo: "tempo", potenciaW: 350, faixaW: [200, 750], minutosPorDia: 2, diasPorSemana: 7, ondeEncontrar: "Na plaquinha do motor do portão." },
  { id: "ferramenta", nome: "Furadeira ou ferramenta elétrica", categoria: "outros", icone: "drill", comodoSugerido: "area-externa", modo: "tempo", potenciaW: 700, faixaW: [300, 2000], minutosPorDia: 30, diasPorSemana: 7 / 30, ondeEncontrar: "Na etiqueta do corpo da ferramenta." },
  { id: "bicicleta-eletrica", nome: "Bicicleta ou patinete elétrico (carregar)", categoria: "outros", icone: "bike", comodoSugerido: "area-externa", modo: "tempo", potenciaW: 150, faixaW: [60, 400], minutosPorDia: 240, diasPorSemana: 3, ondeEncontrar: "No carregador (\"output\", em W)." },
  { id: "carro-eletrico", nome: "Carro elétrico (carregar em casa)", categoria: "outros", icone: "car", comodoSugerido: "area-externa", modo: "tempo", potenciaW: 3700, faixaW: [2000, 7400], minutosPorDia: 180, diasPorSemana: 3, ondeEncontrar: "No carregador (wallbox) ou no manual do carro. Na tomada comum, o normal é cerca de 2.000 W." },
  { id: "outro", nome: "Outro aparelho", categoria: "outros", icone: "plug", comodoSugerido: "outro", modo: "tempo", potenciaW: 100, faixaW: [1, 10000], minutosPorDia: 60, diasPorSemana: 7, ondeEncontrar: "Procure uma etiqueta com o número seguido de W (watts) no aparelho, no carregador ou no manual." },
];

export const CATEGORIAS: { id: CategoriaAparelho; nome: string }[] = [
  { id: "banho", nome: "Banho" },
  { id: "cozinha", nome: "Cozinha" },
  { id: "clima", nome: "Calor e frio" },
  { id: "iluminacao", nome: "Lâmpadas" },
  { id: "lavanderia", nome: "Roupas e água" },
  { id: "eletronicos", nome: "TV e eletrônicos" },
  { id: "limpeza", nome: "Limpeza" },
  { id: "outros", nome: "Outros" },
];

export const COMODOS_PADRAO: { tipo: TipoComodo; nome: string; icone: string }[] = [
  { tipo: "cozinha", nome: "Cozinha", icone: "cooking-pot" },
  { tipo: "sala", nome: "Sala", icone: "sofa" },
  { tipo: "quarto", nome: "Quarto", icone: "bed-double" },
  { tipo: "banheiro", nome: "Banheiro", icone: "bath" },
  { tipo: "lavanderia", nome: "Lavanderia", icone: "washing-machine" },
  { tipo: "escritorio", nome: "Escritório", icone: "monitor" },
  { tipo: "area-externa", nome: "Quintal", icone: "trees" },
  { tipo: "outro", nome: "Outro cômodo", icone: "door-open" },
];

const porId = new Map(CATALOGO.map((i) => [i.id, i]));

export function itemDoCatalogo(id: string | undefined): ItemCatalogo | undefined {
  return id ? porId.get(id) : undefined;
}

/** Itens que aparecem para escolher (sem os antigos mantidos só por compatibilidade). */
export const CATALOGO_VISIVEL = CATALOGO.filter((i) => !i.oculto);

/** Respostas padrão das perguntas de um item. */
export function variantesPadrao(item: ItemCatalogo): Record<string, string> {
  return Object.fromEntries((item.variantes ?? []).map((v) => [v.id, v.padrao]));
}

/**
 * Aplica as respostas das perguntas (tipo, tamanho, idade...) e devolve o que muda no aparelho.
 * Ex.: ar-condicionado split inverter de 12.000 BTUs → 1.020 W, motor trabalhando 60% do tempo.
 */
export function aplicarVariantes(item: ItemCatalogo, escolhas: Record<string, string> = {}): Partial<Aparelho> {
  const respostas = { ...variantesPadrao(item), ...escolhas };
  const r = item.calcular?.(respostas) ?? {};
  const mudancas: Partial<Aparelho> = { variantes: respostas };
  if (r.potenciaW !== undefined) mudancas.potenciaW = r.potenciaW;
  if (item.modo === "etiqueta" && r.kwhMes !== undefined) mudancas.kwhMesInformado = r.kwhMes;
  mudancas.fatorCiclo = r.fatorCiclo ?? item.fatorCiclo;
  if (r.nome) mudancas.nome = r.nome;
  return mudancas;
}

/** Texto curto com as respostas escolhidas: "Split inverter, 12.000 BTUs". */
export function descreverVariantes(item: ItemCatalogo | undefined, escolhas: Record<string, string> | undefined): string {
  if (!item?.variantes || !escolhas) return "";
  return item.variantes
    .map((v) => v.opcoes.find((o) => o.id === escolhas[v.id])?.rotulo)
    .filter(Boolean)
    .join(", ");
}

/** Valores iniciais de um aparelho novo a partir do catálogo, já com as respostas padrão aplicadas. */
export function aparelhoInicial(item: ItemCatalogo): Omit<Aparelho, "id" | "comodoId"> {
  const base: Omit<Aparelho, "id" | "comodoId"> = {
    catalogoId: item.id,
    nome: item.nome,
    quantidade: 1,
    potenciaW: item.potenciaW,
    minutosPorDia: item.minutosPorDia,
    diasPorSemana: item.diasPorSemana,
    kwhMesInformado: item.modo === "etiqueta" ? item.kwhMes : undefined,
    banho: item.banho ? { ...item.banho } : undefined,
    fatorCiclo: item.fatorCiclo,
  };
  return item.variantes ? { ...base, ...aplicarVariantes(item) } : base;
}

/** Opções rápidas de tempo de uso por dia, em minutos — de poucos minutos ao dia inteiro. */
export const TEMPOS_RAPIDOS: { minutos: number; rotulo: string }[] = [
  { minutos: 2, rotulo: "2 min" },
  { minutos: 5, rotulo: "5 min" },
  { minutos: 10, rotulo: "10 min" },
  { minutos: 15, rotulo: "15 min" },
  { minutos: 30, rotulo: "30 min" },
  { minutos: 60, rotulo: "1 hora" },
  { minutos: 120, rotulo: "2 horas" },
  { minutos: 180, rotulo: "3 horas" },
  { minutos: 300, rotulo: "5 horas" },
  { minutos: 480, rotulo: "8 horas" },
  { minutos: 720, rotulo: "12 horas" },
  { minutos: 1440, rotulo: "O dia todo" },
];

/**
 * Com que frequência o aparelho é usado. Guardamos como "dias por semana" (pode ser fracionário):
 * 1 vez por mês = 7/30 dia por semana.
 */
export const FREQUENCIAS: { diasPorSemana: number; rotulo: string }[] = [
  { diasPorSemana: 7, rotulo: "Todo dia" },
  { diasPorSemana: 5, rotulo: "5 dias por semana" },
  { diasPorSemana: 3, rotulo: "3 dias por semana" },
  { diasPorSemana: 2, rotulo: "2 dias por semana" },
  { diasPorSemana: 1, rotulo: "1 dia por semana" },
  { diasPorSemana: (2 * 7) / 30, rotulo: "2 vezes por mês" },
  { diasPorSemana: 7 / 30, rotulo: "1 vez por mês" },
];

/** Acha a frequência da lista mais próxima de um valor (para comparar números fracionários). */
export function frequenciaMaisProxima(diasPorSemana: number): (typeof FREQUENCIAS)[number] {
  return FREQUENCIAS.reduce((melhor, f) => (Math.abs(f.diasPorSemana - diasPorSemana) < Math.abs(melhor.diasPorSemana - diasPorSemana) ? f : melhor));
}
