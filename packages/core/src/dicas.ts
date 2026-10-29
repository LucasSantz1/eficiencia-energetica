import { resumirCasa, type PrecoKwh } from "./calculos";
import { aplicarVariantes, itemDoCatalogo } from "./catalogo";
import { ehLampada } from "./comodos";
import { formatarReais } from "./formatacao";
import type { Aparelho, BandeiraMes, Residencia } from "./tipos";

/**
 * - habito: muda o jeito de usar, sem gastar nada
 * - troca: precisa comprar algo (lâmpada, aparelho novo)
 * - aviso: algo que merece atenção
 * - geral: orientação para a casa toda, sem cálculo
 */
export type TipoDica = "habito" | "troca" | "aviso" | "geral";

export interface Dica {
  /** Identificador estável: "<aparelhoId>:<mudança>" para dicas com cálculo. */
  id: string;
  tipo: TipoDica;
  titulo: string;
  texto: string;
  /** Nome do ícone Lucide. */
  icone: string;
  aparelhoId?: string;
  comodoId?: string;
  /** Economia estimada em R$/mês, quando dá para calcular. */
  economiaMes?: number;
  /** Economia estimada em kWh/mês, quando dá para calcular. */
  economiaKwh?: number;
  /** true quando a dica pode entrar no plano de economia (tem cálculo). */
  simulavel: boolean;
}

type Contexto = {
  residencia: Pick<Residencia, "beneficio" | "ligacao" | "contaReferencia">;
  preco: PrecoKwh;
  aparelhos: Aparelho[];
};

interface Mudanca {
  id: string;
  tipo: TipoDica;
  icone: string;
  titulo: string | ((a: Aparelho) => string);
  texto: string | ((a: Aparelho) => string);
  /** Para quais aparelhos a mudança vale. */
  vale: (a: Aparelho) => boolean;
  /**
   * Devolve a casa inteira como ficaria depois da mudança, ou undefined se não se aplica.
   * Recebe a casa toda porque algumas mudanças mexem em mais de um aparelho (ex.: trocar parte do
   * ar-condicionado pelo ventilador).
   */
  aplicar: (a: Aparelho, casa: Aparelho[]) => Aparelho[] | undefined;
}

/** Consumo de uma geladeira nova do mesmo modelo (selo A, até 5 anos). */
function consumoGeladeiraNova(a: Aparelho): number | undefined {
  const item = itemDoCatalogo("geladeira");
  if (!item) return undefined;
  if (!a.variantes) return a.catalogoId === "geladeira-duplex" ? 40 : 25;
  return aplicarVariantes(item, { ...a.variantes, idade: "nova" }).kwhMesInformado;
}

const trocar = (casa: Aparelho[], novo: Aparelho) => casa.map((x) => (x.id === novo.id ? novo : x));
const doCatalogo = (...ids: string[]) => (a: Aparelho) => ids.includes(a.catalogoId ?? "");

/** Todas as mudanças que o sistema sabe calcular. */
const MUDANCAS: Mudanca[] = [
  // Chuveiro
  {
    id: "banho-curto",
    tipo: "habito",
    icone: "timer",
    vale: doCatalogo("chuveiro"),
    titulo: "Banhos 2 minutos mais curtos",
    texto: (a) => {
      const b = a.banho ?? { banhosPorDia: 1, minutosPorBanho: a.minutosPorDia };
      return `Hoje são ${b.banhosPorDia} ${b.banhosPorDia === 1 ? "banho" : "banhos"} de ${b.minutosPorBanho} minutos por dia. Fechar o chuveiro enquanto se ensaboa já tira esses 2 minutos.`;
    },
    aplicar: (a, casa) => {
      const banho = a.banho ?? { banhosPorDia: 1, minutosPorBanho: a.minutosPorDia };
      if (banho.minutosPorBanho <= 5) return undefined;
      const minutosPorBanho = Math.max(3, banho.minutosPorBanho - 2);
      return trocar(casa, { ...a, banho: { ...banho, minutosPorBanho }, minutosPorDia: banho.banhosPorDia * minutosPorBanho });
    },
  },
  {
    id: "chuveiro-verao",
    tipo: "habito",
    icone: "sun",
    vale: doCatalogo("chuveiro"),
    titulo: "Chave na posição verão nos dias quentes",
    texto: "Na posição verão o chuveiro gasta cerca de 40% menos. A conta considera usar assim em metade dos dias do mês.",
    aplicar: (a, casa) => (a.potenciaW >= 3000 ? trocar(casa, { ...a, potenciaW: Math.round(a.potenciaW * (1 - 0.4 * 0.5)) }) : undefined),
  },
  {
    id: "torneira-curta",
    tipo: "habito",
    icone: "droplets",
    vale: doCatalogo("torneira-eletrica"),
    titulo: "Use a torneira elétrica só para o necessário",
    texto: "Lavar a louça com água fria e deixar a água quente só para a gordura economiza. A conta considera 3 minutos a menos por dia.",
    aplicar: (a, casa) => (a.minutosPorDia > 4 ? trocar(casa, { ...a, minutosPorDia: a.minutosPorDia - 3 }) : undefined),
  },

  // Geladeira e freezer
  {
    id: "geladeira-nova",
    tipo: "troca",
    icone: "refrigerator",
    vale: (a) => {
      if (a.catalogoId === "geladeira" && a.variantes) return a.variantes.idade !== "nova" && (a.kwhMesInformado ?? 0) > (consumoGeladeiraNova(a) ?? Infinity) + 5;
      return (a.catalogoId === "geladeira" && (a.kwhMesInformado ?? 0) >= 35) || (a.catalogoId === "geladeira-duplex" && (a.kwhMesInformado ?? 0) >= 55);
    },
    titulo: "Trocar a geladeira por uma nova com selo A",
    texto: (a) =>
      `A sua gasta cerca de ${Math.round(a.kwhMesInformado ?? 0)} kWh por mês. Uma nova do mesmo tipo, com selo Procel A, gasta por volta de ${Math.round(consumoGeladeiraNova(a) ?? 25)} kWh. Vale pesquisar os programas de troca da sua distribuidora, que às vezes doam geladeiras para famílias de baixa renda.`,
    aplicar: (a, casa) => trocar(casa, { ...a, kwhMesInformado: consumoGeladeiraNova(a) ?? 25, variantes: a.variantes ? { ...a.variantes, idade: "nova" } : undefined }),
  },
  {
    id: "geladeira-cuidados",
    tipo: "habito",
    icone: "refrigerator",
    vale: doCatalogo("geladeira", "geladeira-duplex"),
    titulo: "Afaste a geladeira da parede e não guarde comida quente",
    texto: "Deixe uns 15 cm atrás para o calor sair, use o termostato na posição do meio e abra a porta só o necessário. A conta considera cerca de 10% a menos, uma estimativa.",
    aplicar: (a, casa) => trocar(casa, { ...a, kwhMesInformado: (a.kwhMesInformado ?? 0) * 0.9 }),
  },
  {
    id: "freezer-degelo",
    tipo: "habito",
    icone: "snowflake",
    vale: doCatalogo("freezer"),
    titulo: "Descongele o freezer quando o gelo passar de meio centímetro",
    texto: "A camada de gelo atrapalha o frio e faz o motor trabalhar mais. A conta considera cerca de 10% a menos, uma estimativa.",
    aplicar: (a, casa) => trocar(casa, { ...a, kwhMesInformado: (a.kwhMesInformado ?? 0) * 0.9 }),
  },

  // Lâmpadas
  {
    id: "lampada-led",
    tipo: "troca",
    icone: "lightbulb",
    vale: doCatalogo("lampada-incandescente"),
    titulo: "Trocar as lâmpadas amarelas antigas por LED",
    texto: "A lâmpada de LED ilumina o mesmo gastando cerca de 85% menos, e dura muito mais. Uma lâmpada de LED custa poucos reais e se paga em poucos meses.",
    aplicar: (a, casa) => trocar(casa, { ...a, catalogoId: "lampada-led", nome: "Lâmpada de LED", potenciaW: Math.max(5, Math.round(a.potenciaW * 0.15)) }),
  },
  {
    id: "fluorescente-led",
    tipo: "troca",
    icone: "lightbulb",
    vale: doCatalogo("lampada-fluorescente"),
    titulo: "Trocar as fluorescentes por LED",
    texto: "A lâmpada fluorescente gasta por volta de 57% a mais que a de LED para iluminar o mesmo (Sousa, 2019).",
    aplicar: (a, casa) => trocar(casa, { ...a, catalogoId: "lampada-led", nome: "Lâmpada de LED", potenciaW: Math.max(5, Math.round(a.potenciaW / 1.57)) }),
  },
  {
    id: "apagar-luz",
    tipo: "habito",
    icone: "power",
    vale: (a) => ehLampada(a) && a.minutosPorDia >= 240,
    titulo: "Apague a luz ao sair do cômodo e abra as janelas de dia",
    texto: "Aproveitar a luz do dia e apagar ao sair tira pelo menos uma hora de luz acesa por dia.",
    aplicar: (a, casa) => trocar(casa, { ...a, minutosPorDia: a.minutosPorDia - 60 }),
  },

  // Calor e frio
  {
    id: "ar-uma-hora",
    tipo: "habito",
    icone: "thermometer",
    vale: (a) => a.catalogoId === "ar-condicionado" && a.minutosPorDia >= 120,
    titulo: "Uma hora a menos de ar-condicionado por dia",
    texto: "Deixe em 23 °C, feche portas e janelas e limpe o filtro todo mês. Usar o timer para desligar de madrugada ajuda.",
    aplicar: (a, casa) => trocar(casa, { ...a, minutosPorDia: a.minutosPorDia - 60 }),
  },
  {
    id: "ar-ventilador",
    tipo: "habito",
    icone: "fan",
    vale: (a) => a.catalogoId === "ar-condicionado" && a.minutosPorDia >= 180,
    titulo: "Trocar 2 horas de ar-condicionado pelo ventilador",
    texto: "Nas horas menos quentes, o ventilador refresca gastando cerca de 10 vezes menos.",
    aplicar: (a, casa) => {
      const semAr = trocar(casa, { ...a, minutosPorDia: a.minutosPorDia - 120 });
      const ventilador = casa.find((x) => x.catalogoId === "ventilador" && x.comodoId === a.comodoId);
      if (ventilador) return trocar(semAr, { ...ventilador, minutosPorDia: Math.min(1440, ventilador.minutosPorDia + 120) });
      return [...semAr, { id: `${a.id}:ventilador`, comodoId: a.comodoId, catalogoId: "ventilador", nome: "Ventilador", quantidade: 1, potenciaW: 100, minutosPorDia: 120, diasPorSemana: a.diasPorSemana }];
    },
  },
  {
    id: "ar-inverter",
    tipo: "troca",
    icone: "air-vent",
    vale: (a) => a.catalogoId === "ar-condicionado" && Boolean(a.variantes) && a.variantes!.tipo !== "split-inverter",
    titulo: "Na hora de trocar o ar-condicionado, escolha um inverter",
    texto: "O inverter ajusta a velocidade do motor em vez de ficar ligando e desligando. Gasta de 30% a 50% menos para refrescar o mesmo cômodo.",
    aplicar: (a, casa) => {
      const item = itemDoCatalogo("ar-condicionado")!;
      return trocar(casa, { ...a, ...aplicarVariantes(item, { ...a.variantes, tipo: "split-inverter" }) });
    },
  },
  {
    id: "aquecedor-uma-hora",
    tipo: "habito",
    icone: "thermometer",
    vale: (a) => a.catalogoId === "aquecedor" && a.minutosPorDia >= 120,
    titulo: "Uma hora a menos de aquecedor por dia",
    texto: "Mantenha o cômodo fechado enquanto estiver ligado e desligue ao sair. Um cobertor a mais vale mais que uma hora de aquecedor.",
    aplicar: (a, casa) => trocar(casa, { ...a, minutosPorDia: a.minutosPorDia - 60 }),
  },

  // Roupas
  {
    id: "ferro-de-uma-vez",
    tipo: "habito",
    icone: "shirt",
    vale: (a) => a.catalogoId === "ferro" && a.diasPorSemana >= 2,
    titulo: "Junte as roupas e passe tudo de uma vez",
    texto: "O ferro gasta muito para esquentar. Passar tudo num dia só evita esquentar várias vezes (a conta considera 20% menos tempo ligado). Comece pelas roupas finas, que pedem o ferro mais frio.",
    // Mesmo tempo total da semana concentrado num dia, com 20% a menos por esquentar uma vez só.
    aplicar: (a, casa) => trocar(casa, { ...a, diasPorSemana: 1, minutosPorDia: Math.round(a.minutosPorDia * a.diasPorSemana * 0.8) }),
  },
  {
    id: "maquina-cheia",
    tipo: "habito",
    icone: "washing-machine",
    vale: (a) => (a.catalogoId === "maquina-lavar" || a.catalogoId === "tanquinho") && a.diasPorSemana >= 2,
    titulo: "Lave com a máquina cheia",
    texto: "Juntar as roupas e lavar uma vez a menos por semana economiza energia e água.",
    aplicar: (a, casa) => trocar(casa, { ...a, diasPorSemana: a.diasPorSemana - 1 }),
  },
  {
    id: "secador-toalha",
    tipo: "habito",
    icone: "wind",
    vale: (a) => a.catalogoId === "secador-cabelo" && a.minutosPorDia > 4,
    titulo: "Tire o excesso de água com a toalha antes do secador",
    texto: "Assim o secador fica ligado menos tempo. A conta considera 3 minutos a menos por uso.",
    aplicar: (a, casa) => trocar(casa, { ...a, minutosPorDia: a.minutosPorDia - 3 }),
  },

  // Eletrônicos
  {
    id: "desligar-quem-nao-usa",
    tipo: "habito",
    icone: "power",
    vale: (a) => ["tv", "tv-pequena", "tv-grande", "computador", "videogame"].includes(a.catalogoId ?? "") && a.minutosPorDia >= 120 && a.minutosPorDia < 1440,
    titulo: (a) => (a.catalogoId?.startsWith("tv") ? "Desligue a TV quando ninguém estiver assistindo" : "Desligue quando ninguém estiver usando"),
    texto: (a) =>
      a.catalogoId?.startsWith("tv")
        ? "Use o timer da TV para dormir e baixe o brilho da tela. A conta considera uma hora a menos por dia."
        : "Configure para suspender sozinho depois de alguns minutos parado. A conta considera uma hora a menos por dia.",
    aplicar: (a, casa) => trocar(casa, { ...a, minutosPorDia: a.minutosPorDia - 60 }),
  },
  {
    id: "tv-led",
    tipo: "troca",
    icone: "tv",
    vale: (a) => a.catalogoId === "tv" && Boolean(a.variantes) && ["lcd", "plasma", "tubo"].includes(a.variantes!.tecnologia ?? "") && a.minutosPorDia >= 60,
    titulo: "Na hora de trocar a TV, prefira uma de LED",
    texto: "TVs de plasma, de tubo e as LCD antigas gastam de 2 a 4 vezes mais que uma TV LED do mesmo tamanho.",
    aplicar: (a, casa) => {
      const item = itemDoCatalogo("tv")!;
      return trocar(casa, { ...a, ...aplicarVariantes(item, { ...a.variantes, tecnologia: "led" }) });
    },
  },
  {
    id: "notebook-no-lugar",
    tipo: "troca",
    icone: "laptop",
    vale: (a) => a.catalogoId === "computador" && a.minutosPorDia >= 120,
    titulo: "Na hora de trocar o computador, prefira um notebook",
    texto: "Um notebook gasta de 3 a 4 vezes menos que um computador de mesa com monitor.",
    aplicar: (a, casa) => trocar(casa, { ...a, catalogoId: "notebook", nome: "Notebook", potenciaW: 60 }),
  },
];

const PORQUE_HABITO = "sem gastar nada";

function texto(v: string | ((a: Aparelho) => string), a: Aparelho) {
  return typeof v === "function" ? v(a) : v;
}

/** Aplica uma dica (pelo id) à casa e devolve como ela ficaria. */
function aplicarDica(casa: Aparelho[], dicaId: string): Aparelho[] {
  const [aparelhoId, mudancaId] = dicaId.split(":");
  const mudanca = MUDANCAS.find((m) => m.id === mudancaId);
  const aparelho = casa.find((a) => a.id === aparelhoId);
  if (!mudanca || !aparelho || !mudanca.vale(aparelho)) return casa;
  return mudanca.aplicar(aparelho, casa) ?? casa;
}

/**
 * Plano de economia: aplica várias dicas, uma depois da outra, e devolve a casa resultante.
 * Duas dicas no mesmo aparelho se somam do jeito certo (ex.: banho mais curto E posição verão).
 */
export function simularPlano(aparelhos: Aparelho[], dicaIds: string[]): Aparelho[] {
  return dicaIds.reduce(aplicarDica, aparelhos);
}

/**
 * Gera dicas personalizadas para a casa, com a economia em reais calculada a partir dos aparelhos
 * cadastrados: para cada mudança, recalcula a conta inteira e compara com a conta atual.
 * Dicas com economia aparecem primeiro, da maior para a menor.
 */
export function gerarDicas(ctx: Contexto & { bandeira?: BandeiraMes }): Dica[] {
  const { aparelhos, residencia, preco, bandeira } = ctx;
  const atual = resumirCasa(aparelhos, residencia, preco).conta;
  const dicas: Dica[] = [];

  for (const aparelho of aparelhos) {
    for (const m of MUDANCAS) {
      if (!m.vale(aparelho)) continue;
      const depois = m.aplicar(aparelho, aparelhos);
      if (!depois) continue;
      const nova = resumirCasa(depois, residencia, preco).conta;
      const economiaKwh = atual.consumoKwh - nova.consumoKwh;
      if (economiaKwh <= 0.05) continue;
      dicas.push({
        id: `${aparelho.id}:${m.id}`,
        tipo: m.tipo,
        icone: m.icone,
        titulo: texto(m.titulo, aparelho),
        texto: texto(m.texto, aparelho),
        aparelhoId: aparelho.id,
        comodoId: aparelho.comodoId,
        economiaMes: Math.max(0, atual.valor - nova.valor),
        economiaKwh,
        simulavel: true,
      });
    }
  }

  dicas.sort((a, b) => (b.economiaMes ?? 0) - (a.economiaMes ?? 0) || (b.economiaKwh ?? 0) - (a.economiaKwh ?? 0));

  if (bandeira && bandeira.bandeira !== "verde" && bandeira.adicionalKwh > 0 && preco.origem === "aneel") {
    dicas.unshift({
      id: "bandeira",
      tipo: "aviso",
      icone: "flag",
      titulo: `Bandeira ${bandeira.nome.toLowerCase()} neste mês`,
      texto: `A energia está mais cara: cada 100 kWh custam ${formatarReais(bandeira.adicionalKwh * 100)} a mais. É um bom mês para economizar no chuveiro e no ar-condicionado.`,
      simulavel: false,
    });
  }

  if (residencia.beneficio === "nao-sei" || residencia.beneficio === "nenhum") {
    dicas.push({
      id: "tarifa-social",
      tipo: "geral",
      icone: "hand-heart",
      titulo: "Veja se sua família tem direito à Tarifa Social",
      texto:
        "Famílias no CadÚnico com renda de até meio salário mínimo por pessoa, ou que recebem o BPC, não pagam os primeiros 80 kWh do mês. Com renda até um salário mínimo por pessoa, há desconto até 120 kWh. Procure o CRAS da sua cidade para se inscrever no CadÚnico.",
      simulavel: false,
    });
  }

  dicas.push(
    {
      id: "fuga",
      tipo: "geral",
      icone: "gauge",
      titulo: "Teste se há fuga de energia",
      texto:
        "Desligue tudo da tomada e todas as luzes, e anote o número do relógio de luz. Depois de uma hora, olhe de novo: se o número mudou, pode haver fio descascado ou aparelho com defeito. Chame um eletricista.",
      simulavel: false,
    },
    {
      id: "tomada",
      tipo: "geral",
      icone: "plug-zap",
      titulo: "Tire da tomada o que fica com a luzinha acesa",
      texto: "TV, micro-ondas, videogame e carregadores continuam gastando um pouco mesmo desligados. Uma régua com botão ajuda a desligar tudo de uma vez.",
      simulavel: false,
    },
    {
      id: "selo-procel",
      tipo: "geral",
      icone: "badge-check",
      titulo: "Na hora de comprar, procure a letra A",
      texto: "A etiqueta amarela do INMETRO mostra o consumo do aparelho. A letra A (faixa verde) é a mais econômica, e o Selo Procel indica os melhores da categoria.",
      simulavel: false,
    },
  );

  return dicas;
}

export const DESCRICAO_TIPO_DICA: Record<TipoDica, string> = {
  habito: PORQUE_HABITO,
  troca: "comprando algo",
  aviso: "atenção",
  geral: "para a casa toda",
};
