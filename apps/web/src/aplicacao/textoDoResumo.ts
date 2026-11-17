// Sem "use client": função pura, testada no vitest e carregada pela tela só no clique de compartilhar (HIS-105).
import { formatarKwh, formatarReais, itemDoCatalogo, type Aparelho, type Dica, type ResumoCasa } from "@ee/core";

/** Quantos aparelhos entram no texto: os que mais gastam (critério 2 da HIS-105). */
const APARELHOS_NO_TEXTO = 3;

export interface DadosDoTextoDoResumo {
  /** O resumo que a tela já mostra (`useResumo`): nada é recalculado aqui. */
  resumo: Pick<ResumoCasa, "conta" | "aparelhos">;
  /** A mesma "próxima dica" do painel, se houver. */
  proximaDica?: Pick<Dica, "titulo" | "economiaMes">;
  /** Só a origem do site (ex.: https://exemplo.org), sem caminho nem nada da casa. */
  enderecoDoSite: string;
}

/**
 * Nome que pode sair do aparelho: o do catálogo, nunca o que a pessoa digitou (ela pode ter posto o próprio nome ou o
 * de alguém). Sem catálogo, "Outro aparelho", o mesmo nome do item "outro" do catálogo.
 */
export function nomeParaCompartilhar(aparelho: Pick<Aparelho, "catalogoId" | "quantidade">): string {
  const nome = itemDoCatalogo(aparelho.catalogoId)?.nome ?? "Outro aparelho";
  return aparelho.quantidade > 1 ? `${aparelho.quantidade} × ${nome}` : nome;
}

/**
 * Texto puro do resumo da casa para compartilhar ou copiar (HIS-105): a conta do mês em R$ (e o kWh depois), os 3
 * aparelhos que mais gastam e a próxima dica. Sem cidade, distribuidora, cômodo nem nome digitado (princípio 5).
 */
export function textoDoResumo({ resumo, proximaDica, enderecoDoSite }: DadosDoTextoDoResumo): string {
  const { conta } = resumo;
  const maiores = resumo.aparelhos.slice(0, APARELHOS_NO_TEXTO);
  const partes = [`Nossa conta de luz estimada: ${formatarReais(conta.valor)} por mês (${formatarKwh(conta.consumoKwh)}).`];

  if (maiores.length > 0) {
    const titulo = maiores.length === 1 ? "O aparelho que mais gasta:" : "Os aparelhos que mais gastam:";
    const linhas = maiores.map((item, indice) => `${indice + 1}. ${nomeParaCompartilhar(item.aparelho)}: ${formatarReais(item.valorMes)} por mês`);
    partes.push([titulo, ...linhas].join("\n"));
  }

  if (proximaDica) {
    const economia = proximaDica.economiaMes ? ` Economiza ${formatarReais(proximaDica.economiaMes)} por mês.` : "";
    partes.push(`Próxima dica: ${proximaDica.titulo}.${economia}`);
  }

  partes.push(`É uma estimativa, feita com o tempo de uso de cada aparelho.\nFaça a conta da sua casa, de graça: ${enderecoDoSite}`);
  return partes.join("\n\n");
}
