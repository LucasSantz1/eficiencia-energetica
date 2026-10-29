import type { TipoComodo } from "./tipos";

/**
 * Como o tempo de uso é perguntado na tela:
 * - "tempo": horas/minutos por dia (TV, ventilador...)
 * - "banho": quantos banhos por dia × minutos por banho
 * - "etiqueta": o aparelho fica ligado o tempo todo e liga/desliga o motor sozinho; usamos o
 *   consumo mensal (kWh/mês) da etiqueta do INMETRO (geladeira, freezer)
 */
export type ModoUso = "tempo" | "banho" | "etiqueta";

export type CategoriaAparelho = "cozinha" | "banho" | "clima" | "iluminacao" | "lavanderia" | "eletronicos" | "outros";

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
  /** Para o modo "banho": banhos por dia e minutos por banho típicos. */
  banho?: { banhosPorDia: number; minutosPorBanho: number };
  /** Onde encontrar a potência/consumo real do aparelho. */
  ondeEncontrar: string;
}

/**
 * Valores típicos de referência, baseados nas tabelas de consumo do PROCEL e nas etiquetas do INMETRO.
 * Servem como ponto de partida: a pessoa pode ajustar com os dados do próprio aparelho.
 */
export const CATALOGO: ItemCatalogo[] = [
  // Banho
  { id: "chuveiro", nome: "Chuveiro elétrico", categoria: "banho", icone: "shower-head", comodoSugerido: "banheiro", modo: "banho", potenciaW: 5500, faixaW: [3500, 7800], minutosPorDia: 32, diasPorSemana: 7, banho: { banhosPorDia: 4, minutosPorBanho: 8 }, ondeEncontrar: "Na embalagem ou gravado no próprio chuveiro (ex.: 5500 W). Na posição verão ele gasta menos." },
  { id: "torneira-eletrica", nome: "Torneira elétrica", categoria: "banho", icone: "droplets", comodoSugerido: "cozinha", modo: "tempo", potenciaW: 3500, faixaW: [3000, 5500], minutosPorDia: 10, diasPorSemana: 7, ondeEncontrar: "Na embalagem ou gravado no corpo da torneira." },
  { id: "secador-cabelo", nome: "Secador de cabelo", categoria: "banho", icone: "wind", comodoSugerido: "banheiro", modo: "tempo", potenciaW: 1600, faixaW: [1000, 2400], minutosPorDia: 10, diasPorSemana: 4, ondeEncontrar: "Na etiqueta perto do cabo." },

  // Cozinha
  { id: "geladeira", nome: "Geladeira de 1 porta", categoria: "cozinha", icone: "refrigerator", comodoSugerido: "cozinha", modo: "etiqueta", potenciaW: 90, faixaW: [70, 150], minutosPorDia: 1440, diasPorSemana: 7, kwhMes: 25, ondeEncontrar: "Na etiqueta amarela do INMETRO (Selo Procel), no campo \"Consumo de energia (kWh/mês)\". Geladeiras antigas costumam gastar mais." },
  { id: "geladeira-duplex", nome: "Geladeira de 2 portas", categoria: "cozinha", icone: "refrigerator", comodoSugerido: "cozinha", modo: "etiqueta", potenciaW: 130, faixaW: [100, 250], minutosPorDia: 1440, diasPorSemana: 7, kwhMes: 45, ondeEncontrar: "Na etiqueta amarela do INMETRO (Selo Procel), no campo \"Consumo de energia (kWh/mês)\"." },
  { id: "freezer", nome: "Freezer", categoria: "cozinha", icone: "snowflake", comodoSugerido: "cozinha", modo: "etiqueta", potenciaW: 130, faixaW: [90, 250], minutosPorDia: 1440, diasPorSemana: 7, kwhMes: 40, ondeEncontrar: "Na etiqueta amarela do INMETRO, no campo \"Consumo de energia (kWh/mês)\"." },
  { id: "micro-ondas", nome: "Micro-ondas", categoria: "cozinha", icone: "microwave", comodoSugerido: "cozinha", modo: "tempo", potenciaW: 1300, faixaW: [1000, 1800], minutosPorDia: 15, diasPorSemana: 7, ondeEncontrar: "Na etiqueta atrás do aparelho ou dentro da porta (\"potência de entrada\")." },
  { id: "air-fryer", nome: "Air fryer", categoria: "cozinha", icone: "cooking-pot", comodoSugerido: "cozinha", modo: "tempo", potenciaW: 1500, faixaW: [1000, 2000], minutosPorDia: 30, diasPorSemana: 5, ondeEncontrar: "Na etiqueta embaixo do aparelho." },
  { id: "forno-eletrico", nome: "Forno elétrico", categoria: "cozinha", icone: "cooking-pot", comodoSugerido: "cozinha", modo: "tempo", potenciaW: 1500, faixaW: [1000, 2500], minutosPorDia: 30, diasPorSemana: 3, ondeEncontrar: "Na etiqueta atrás ou embaixo do forno." },
  { id: "cafeteira", nome: "Cafeteira elétrica", categoria: "cozinha", icone: "coffee", comodoSugerido: "cozinha", modo: "tempo", potenciaW: 700, faixaW: [500, 1200], minutosPorDia: 15, diasPorSemana: 7, ondeEncontrar: "Na etiqueta embaixo da cafeteira." },
  { id: "liquidificador", nome: "Liquidificador", categoria: "cozinha", icone: "cup-soda", comodoSugerido: "cozinha", modo: "tempo", potenciaW: 400, faixaW: [300, 1200], minutosPorDia: 10, diasPorSemana: 5, ondeEncontrar: "Na etiqueta embaixo da base." },
  { id: "sanduicheira", nome: "Sanduicheira", categoria: "cozinha", icone: "sandwich", comodoSugerido: "cozinha", modo: "tempo", potenciaW: 750, faixaW: [600, 1000], minutosPorDia: 10, diasPorSemana: 3, ondeEncontrar: "Na etiqueta embaixo do aparelho." },

  // Clima
  { id: "ventilador", nome: "Ventilador", categoria: "clima", icone: "fan", comodoSugerido: "quarto", modo: "tempo", potenciaW: 100, faixaW: [50, 200], minutosPorDia: 480, diasPorSemana: 7, ondeEncontrar: "Na etiqueta da base ou do motor." },
  { id: "ar-condicionado", nome: "Ar-condicionado", categoria: "clima", icone: "air-vent", comodoSugerido: "quarto", modo: "tempo", potenciaW: 900, faixaW: [600, 2500], minutosPorDia: 480, diasPorSemana: 7, ondeEncontrar: "Na etiqueta do INMETRO ou na lateral da unidade interna (\"potência elétrica\", em W). Um aparelho de 9.000 BTUs gasta por volta de 800 a 1.000 W." },
  { id: "aquecedor", nome: "Aquecedor elétrico", categoria: "clima", icone: "heater", comodoSugerido: "quarto", modo: "tempo", potenciaW: 1500, faixaW: [800, 2200], minutosPorDia: 240, diasPorSemana: 7, ondeEncontrar: "Na etiqueta atrás ou embaixo do aquecedor." },

  // Iluminação
  { id: "lampada-led", nome: "Lâmpada de LED", categoria: "iluminacao", icone: "lightbulb", comodoSugerido: "sala", modo: "tempo", potenciaW: 9, faixaW: [5, 20], minutosPorDia: 300, diasPorSemana: 7, ondeEncontrar: "Escrito na própria lâmpada ou na caixa (ex.: 9 W)." },
  { id: "lampada-fluorescente", nome: "Lâmpada fluorescente", categoria: "iluminacao", icone: "lightbulb", comodoSugerido: "sala", modo: "tempo", potenciaW: 15, faixaW: [9, 40], minutosPorDia: 300, diasPorSemana: 7, ondeEncontrar: "Escrito na base da lâmpada (ex.: 15 W)." },
  { id: "lampada-incandescente", nome: "Lâmpada amarela antiga", categoria: "iluminacao", icone: "lightbulb", comodoSugerido: "sala", modo: "tempo", potenciaW: 60, faixaW: [40, 100], minutosPorDia: 300, diasPorSemana: 7, ondeEncontrar: "Escrito no vidro ou na base (ex.: 60 W). É a lâmpada incandescente, que esquenta muito." },

  // Lavanderia
  { id: "maquina-lavar", nome: "Máquina de lavar", categoria: "lavanderia", icone: "washing-machine", comodoSugerido: "lavanderia", modo: "tempo", potenciaW: 500, faixaW: [300, 1000], minutosPorDia: 60, diasPorSemana: 3, ondeEncontrar: "Na etiqueta atrás da máquina." },
  { id: "tanquinho", nome: "Tanquinho", categoria: "lavanderia", icone: "washing-machine", comodoSugerido: "lavanderia", modo: "tempo", potenciaW: 300, faixaW: [200, 500], minutosPorDia: 60, diasPorSemana: 3, ondeEncontrar: "Na etiqueta atrás do tanquinho." },
  { id: "ferro", nome: "Ferro de passar", categoria: "lavanderia", icone: "shirt", comodoSugerido: "lavanderia", modo: "tempo", potenciaW: 1000, faixaW: [700, 2000], minutosPorDia: 60, diasPorSemana: 2, ondeEncontrar: "Na etiqueta perto do cabo ou embaixo da base." },
  { id: "bomba-dagua", nome: "Bomba d'água", categoria: "lavanderia", icone: "waves", comodoSugerido: "area-externa", modo: "tempo", potenciaW: 750, faixaW: [370, 1500], minutosPorDia: 30, diasPorSemana: 7, ondeEncontrar: "Na plaquinha do motor (às vezes em CV: 1 CV ≈ 750 W)." },

  // Eletrônicos
  { id: "tv-pequena", nome: "TV até 32 polegadas", categoria: "eletronicos", icone: "tv", comodoSugerido: "sala", modo: "tempo", potenciaW: 60, faixaW: [40, 90], minutosPorDia: 300, diasPorSemana: 7, ondeEncontrar: "Na etiqueta atrás da TV (\"consumo\" ou \"potência\", em W)." },
  { id: "tv-grande", nome: "TV de 40 polegadas ou mais", categoria: "eletronicos", icone: "tv", comodoSugerido: "sala", modo: "tempo", potenciaW: 110, faixaW: [70, 250], minutosPorDia: 300, diasPorSemana: 7, ondeEncontrar: "Na etiqueta atrás da TV (\"consumo\" ou \"potência\", em W)." },
  { id: "computador", nome: "Computador de mesa", categoria: "eletronicos", icone: "monitor", comodoSugerido: "escritorio", modo: "tempo", potenciaW: 200, faixaW: [100, 500], minutosPorDia: 240, diasPorSemana: 7, ondeEncontrar: "Na fonte atrás do gabinete. O monitor tem etiqueta própria." },
  { id: "notebook", nome: "Notebook", categoria: "eletronicos", icone: "laptop", comodoSugerido: "escritorio", modo: "tempo", potenciaW: 60, faixaW: [30, 150], minutosPorDia: 240, diasPorSemana: 7, ondeEncontrar: "No carregador (\"output\", em W)." },
  { id: "videogame", nome: "Videogame", categoria: "eletronicos", icone: "gamepad-2", comodoSugerido: "sala", modo: "tempo", potenciaW: 150, faixaW: [50, 250], minutosPorDia: 120, diasPorSemana: 7, ondeEncontrar: "Na etiqueta atrás ou embaixo do console." },
  { id: "carregador-celular", nome: "Carregador de celular", categoria: "eletronicos", icone: "smartphone", comodoSugerido: "quarto", modo: "tempo", potenciaW: 10, faixaW: [5, 65], minutosPorDia: 180, diasPorSemana: 7, ondeEncontrar: "Escrito no carregador (ex.: 10 W)." },
  { id: "roteador", nome: "Roteador de internet", categoria: "eletronicos", icone: "router", comodoSugerido: "sala", modo: "tempo", potenciaW: 12, faixaW: [6, 20], minutosPorDia: 1440, diasPorSemana: 7, ondeEncontrar: "Na fonte do roteador." },

  // Outros
  { id: "outro", nome: "Outro aparelho", categoria: "outros", icone: "plug", comodoSugerido: "outro", modo: "tempo", potenciaW: 100, faixaW: [1, 10000], minutosPorDia: 60, diasPorSemana: 7, ondeEncontrar: "Procure uma etiqueta com o número seguido de W (watts) no aparelho, no carregador ou no manual." },
];

export const CATEGORIAS: { id: CategoriaAparelho; nome: string }[] = [
  { id: "banho", nome: "Banho" },
  { id: "cozinha", nome: "Cozinha" },
  { id: "clima", nome: "Calor e frio" },
  { id: "iluminacao", nome: "Lâmpadas" },
  { id: "lavanderia", nome: "Roupas e água" },
  { id: "eletronicos", nome: "TV e eletrônicos" },
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

/** Opções rápidas de tempo de uso por dia, em minutos. */
export const TEMPOS_RAPIDOS: { minutos: number; rotulo: string }[] = [
  { minutos: 10, rotulo: "10 min" },
  { minutos: 30, rotulo: "30 min" },
  { minutos: 60, rotulo: "1 hora" },
  { minutos: 180, rotulo: "3 horas" },
  { minutos: 480, rotulo: "8 horas" },
  { minutos: 1440, rotulo: "O dia todo" },
];
