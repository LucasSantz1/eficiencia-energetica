import { resumirCasa, type PrecoKwh } from "./calculos";
import { formatarReais } from "./formatacao";
import type { Aparelho, BandeiraMes, Residencia } from "./tipos";

export type TipoDica = "habito" | "troca" | "aviso" | "geral";

export interface Dica {
  id: string;
  tipo: TipoDica;
  titulo: string;
  texto: string;
  /** Nome do ícone Lucide. */
  icone: string;
  aparelhoId?: string;
  /** Economia estimada em R$/mês, quando dá para calcular. */
  economiaMes?: number;
  /** Economia estimada em kWh/mês, quando dá para calcular. */
  economiaKwh?: number;
}

type Contexto = {
  residencia: Pick<Residencia, "beneficio" | "ligacao" | "contaReferencia">;
  preco: PrecoKwh;
  aparelhos: Aparelho[];
};

type Mudanca = {
  titulo: string;
  texto: string;
  tipo: TipoDica;
  icone: string;
  /** Devolve o aparelho como ficaria depois da mudança, ou undefined se a dica não se aplica. */
  aplicar: (a: Aparelho) => Aparelho | undefined;
};

/** Mudanças possíveis para cada tipo de aparelho do catálogo. */
const MUDANCAS: Record<string, Mudanca[]> = {
  chuveiro: [
    {
      tipo: "habito",
      icone: "timer",
      titulo: "Banhos 2 minutos mais curtos",
      texto: "O chuveiro costuma ser o que mais pesa na conta. Tirar 2 minutos de cada banho já faz diferença no fim do mês.",
      aplicar: (a) => {
        const banho = a.banho ?? { banhosPorDia: 1, minutosPorBanho: a.minutosPorDia };
        if (banho.minutosPorBanho <= 5) return undefined;
        const minutosPorBanho = Math.max(3, banho.minutosPorBanho - 2);
        return { ...a, banho: { ...banho, minutosPorBanho }, minutosPorDia: banho.banhosPorDia * minutosPorBanho };
      },
    },
    {
      tipo: "habito",
      icone: "sun",
      titulo: "Chave na posição verão nos dias quentes",
      texto: "Na posição verão o chuveiro gasta cerca de 40% menos. A conta considera usar assim em metade dos dias do mês.",
      aplicar: (a) => (a.potenciaW >= 3000 ? { ...a, potenciaW: a.potenciaW * (1 - 0.4 * 0.5) } : undefined),
    },
  ],
  "lampada-incandescente": [
    {
      tipo: "troca",
      icone: "lightbulb",
      titulo: "Trocar a lâmpada amarela antiga por LED",
      texto: "Uma lâmpada de LED ilumina o mesmo gastando cerca de 85% menos energia, e dura muito mais.",
      aplicar: (a) => ({ ...a, potenciaW: Math.max(5, Math.round(a.potenciaW * 0.15)) }),
    },
  ],
  "lampada-fluorescente": [
    {
      tipo: "troca",
      icone: "lightbulb",
      titulo: "Trocar a fluorescente por LED",
      texto: "A lâmpada fluorescente gasta por volta de 57% a mais que a de LED para iluminar o mesmo (Sousa, 2019).",
      aplicar: (a) => ({ ...a, potenciaW: Math.max(5, Math.round(a.potenciaW / 1.57)) }),
    },
  ],
  "ar-condicionado": [
    {
      tipo: "habito",
      icone: "thermometer",
      titulo: "Uma hora a menos de ar-condicionado por dia",
      texto: "Deixe em 23 °C, feche portas e janelas e limpe o filtro todo mês. Desligar uma hora antes de levantar já ajuda.",
      aplicar: (a) => (a.minutosPorDia >= 120 ? { ...a, minutosPorDia: a.minutosPorDia - 60 } : undefined),
    },
  ],
  aquecedor: [
    {
      tipo: "habito",
      icone: "thermometer",
      titulo: "Uma hora a menos de aquecedor por dia",
      texto: "Mantenha o cômodo fechado enquanto o aquecedor estiver ligado e desligue ao sair.",
      aplicar: (a) => (a.minutosPorDia >= 120 ? { ...a, minutosPorDia: a.minutosPorDia - 60 } : undefined),
    },
  ],
  ferro: [
    {
      tipo: "habito",
      icone: "shirt",
      titulo: "Junte as roupas e passe tudo de uma vez",
      texto: "O ferro gasta muito para esquentar. Passar tudo num dia só da semana evita esquentar várias vezes (a conta considera 20% menos tempo ligado).",
      // Mesmo tempo total da semana concentrado num dia, com 20% a menos por esquentar uma vez só.
      aplicar: (a) => (a.diasPorSemana >= 2 ? { ...a, diasPorSemana: 1, minutosPorDia: Math.round(a.minutosPorDia * a.diasPorSemana * 0.8) } : undefined),
    },
  ],
  "maquina-lavar": [
    {
      tipo: "habito",
      icone: "washing-machine",
      titulo: "Lave com a máquina cheia",
      texto: "Juntar as roupas e lavar uma vez a menos por semana economiza energia e água.",
      aplicar: (a) => (a.diasPorSemana >= 2 ? { ...a, diasPorSemana: a.diasPorSemana - 1 } : undefined),
    },
  ],
  tanquinho: [
    {
      tipo: "habito",
      icone: "washing-machine",
      titulo: "Lave com o tanquinho cheio",
      texto: "Juntar as roupas e lavar uma vez a menos por semana economiza energia e água.",
      aplicar: (a) => (a.diasPorSemana >= 2 ? { ...a, diasPorSemana: a.diasPorSemana - 1 } : undefined),
    },
  ],
  "secador-cabelo": [
    {
      tipo: "habito",
      icone: "wind",
      titulo: "Tire o excesso de água com a toalha antes do secador",
      texto: "Assim o secador fica ligado menos tempo. A conta considera 3 minutos a menos por uso.",
      aplicar: (a) => (a.minutosPorDia > 4 ? { ...a, minutosPorDia: a.minutosPorDia - 3 } : undefined),
    },
  ],
};

const UMA_HORA_A_MENOS: Mudanca = {
  tipo: "habito",
  icone: "power",
  titulo: "Desligar quando ninguém estiver usando",
  texto: "Uma hora a menos por dia ligado, sem ninguém assistindo ou usando, já aparece na conta.",
  aplicar: (a) => (a.minutosPorDia >= 120 && a.minutosPorDia < 1440 ? { ...a, minutosPorDia: a.minutosPorDia - 60 } : undefined),
};
for (const id of ["tv-pequena", "tv-grande", "computador", "videogame"]) MUDANCAS[id] = [UMA_HORA_A_MENOS];

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
    const mudancas = aparelho.catalogoId ? MUDANCAS[aparelho.catalogoId] : undefined;
    if (!mudancas) continue;
    mudancas.forEach((m, indice) => {
      const depois = m.aplicar(aparelho);
      if (!depois) return;
      const nova = resumirCasa(aparelhos.map((a) => (a.id === aparelho.id ? depois : a)), residencia, preco).conta;
      const economiaMes = atual.valor - nova.valor;
      const economiaKwh = atual.consumoKwh - nova.consumoKwh;
      if (economiaKwh <= 0.05) return;
      dicas.push({
        id: `${aparelho.id}:${indice}`,
        tipo: m.tipo,
        icone: m.icone,
        titulo: m.titulo,
        texto: m.texto,
        aparelhoId: aparelho.id,
        economiaMes: Math.max(0, economiaMes),
        economiaKwh,
      });
    });
  }

  const geladeiraAntiga = aparelhos.find((a) => a.catalogoId === "geladeira" && (a.kwhMesInformado ?? 0) >= 45);
  if (geladeiraAntiga) {
    dicas.push({
      id: "geladeira-antiga",
      tipo: "aviso",
      icone: "refrigerator",
      aparelhoId: geladeiraAntiga.id,
      titulo: "Sua geladeira gasta mais que o comum",
      texto: "Geladeiras de 1 porta novas gastam por volta de 25 kWh por mês. Confira se a borracha da porta veda bem (feche a porta numa folha de papel: ela não pode escorregar).",
    });
  }

  dicas.sort((a, b) => (b.economiaMes ?? -1) - (a.economiaMes ?? -1));

  if (bandeira && bandeira.bandeira !== "verde" && bandeira.adicionalKwh > 0 && preco.origem === "aneel") {
    dicas.unshift({
      id: "bandeira",
      tipo: "aviso",
      icone: "flag",
      titulo: `Bandeira ${bandeira.nome.toLowerCase()} neste mês`,
      texto: `A energia está mais cara: cada 100 kWh custam ${formatarReais(bandeira.adicionalKwh * 100)} a mais. É um bom mês para economizar no chuveiro e no ar-condicionado.`,
    });
  }

  if (residencia.beneficio === "nao-sei" || residencia.beneficio === "nenhum") {
    dicas.push({
      id: "tarifa-social",
      tipo: "geral",
      icone: "hand-heart",
      titulo: "Veja se sua família tem direito à Tarifa Social",
      texto: "Famílias no CadÚnico com renda de até meio salário mínimo por pessoa, ou que recebem o BPC, não pagam os primeiros 80 kWh do mês. Com renda até um salário mínimo por pessoa, há desconto até 120 kWh. Procure o CRAS da sua cidade para se inscrever no CadÚnico.",
    });
  }

  dicas.push(
    {
      id: "tomada",
      tipo: "geral",
      icone: "plug-zap",
      titulo: "Tire da tomada o que fica com a luzinha acesa",
      texto: "TV, micro-ondas e carregadores continuam gastando um pouco mesmo desligados. Uma régua com botão ajuda a desligar tudo de uma vez.",
    },
    {
      id: "selo-procel",
      tipo: "geral",
      icone: "badge-check",
      titulo: "Na hora de comprar, procure a letra A",
      texto: "A etiqueta amarela do INMETRO mostra o consumo do aparelho. A letra A (faixa verde) é a mais econômica, e o Selo Procel indica os melhores da categoria.",
    },
  );

  return dicas;
}
