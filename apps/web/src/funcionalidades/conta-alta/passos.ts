import { paraFalar } from "@ee/core";

export interface Passo {
  titulo: string;
  texto: string;
}

/**
 * Teste do relógio (fuga de energia). Só o que as distribuidoras orientam, sem passo a mais:
 * - Cemig, cartilha "Eficiência energética: saiba como economizar energia", seção "Instalação elétrica":
 *   https://www.cemig.com.br/wp-content/uploads/2025/10/Cartilha-Eficiencia-Energetica-Saiba-como-economizar-energia.pdf
 * - Neoenergia Brasília, "Conheça seu medidor": https://www.neoenergia.com/web/brasilia/sua-casa/conheca-seu-medidor
 * (acesso em 27/11/2026). Nenhuma das duas manda desligar o disjuntor geral: o site também não manda. Também não damos
 * tempo para a geladeira ficar fora da tomada (não há fonte).
 */
export const PASSOS_DO_TESTE: readonly Passo[] = [
  { titulo: "Tire tudo da tomada", texto: "Todos os aparelhos, inclusive a geladeira, só pelo tempo do teste." },
  { titulo: "Apague todas as luzes", texto: "A casa fica sem nada ligado." },
  { titulo: "Olhe o relógio de luz, de longe", texto: "Sem tocar nele nem nos fios. Crianças longe." },
  {
    titulo: "Continua girando ou contando?",
    texto: "Pode haver fuga de energia. Chame um eletricista de confiança para olhar a instalação. Não mexa na fiação.",
  },
];

/**
 * Como reclamar de conta errada: REN ANEEL 1.000/2021 (lida em cópia publicada pela Cemig, acesso em 27/11/2026;
 * conferir no cedoc da ANEEL): art. 408 (distribuidora: até 5 dias úteis, ou 10 com visita), art. 421 (ouvidoria: até
 * 10 dias úteis), art. 422 (sem corte pelo valor em discussão enquanto a ouvidoria analisa), art. 423 (ANEEL),
 * art. 323, § 2º (devolução em dobro do que foi cobrado a mais; simples se o erro foi da própria pessoa, § 3º).
 * ANEEL: 167, gratuito, segunda a sábado, das 8h às 20h (gov.br, acesso em 27/11/2026).
 */
export const PASSOS_DA_RECLAMACAO: readonly Passo[] = [
  {
    titulo: "Confira a leitura",
    texto: "Compare o número do seu relógio com a “leitura atual” da conta. Tire uma foto do relógio com a data.",
  },
  {
    titulo: "Fale com a empresa de luz",
    texto: "Pelo telefone, aplicativo ou agência. Anote o número do protocolo. Ela tem até 5 dias úteis para responder (10, se precisar ir à sua casa).",
  },
  {
    titulo: "Não resolveu? Ouvidoria da empresa",
    texto: "Ela responde em até 10 dias úteis. Enquanto isso, a luz não pode ser cortada por causa do valor em discussão.",
  },
  {
    titulo: "Ainda não? Ligue 167, da ANEEL",
    texto: "É de graça, de segunda a sábado, das 8h às 20h. Tenha o protocolo em mãos.",
  },
  {
    titulo: "Cobraram a mais?",
    texto: "A empresa devolve o dobro do que foi cobrado a mais, a não ser que o erro tenha vindo da sua parte.",
  },
];

export function frasesDosPassos(passos: readonly Passo[]): string[] {
  return passos.flatMap((p, i) => [`Passo ${i + 1}: ${p.titulo}.`, paraFalar(p.texto)]);
}
