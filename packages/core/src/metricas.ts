/**
 * Métricas de uso e satisfação (E12, ADR-009): o que o site conta e o que pergunta. Só contagens por dia e notas, sem
 * nada que identifique a pessoa. A mesma lista vale no navegador, no servidor e no banco
 * (supabase/migrations/20261127120000_lancamento.sql): mudar aqui pede mudar lá.
 */
export const EVENTOS_DE_USO = [
  "visita",
  "cadastro-concluido",
  "painel-aberto",
  "conta-anotada",
  "estimativa-perto",
  "estimativa-media",
  "estimativa-longe",
  "dica-no-plano",
  "meta-definida",
  "compartilhou",
  "imprimiu",
  "ouviu",
  "comparou",
  "conta-confirmada",
  "convite-criado",
] as const;
export type EventoDeUso = (typeof EVENTOS_DE_USO)[number];

export function ehEventoDeUso(valor: unknown): valor is EventoDeUso {
  return typeof valor === "string" && EVENTOS_DE_USO.some((evento) => evento === valor);
}

/** Onde o "Isto te ajudou?" aparece. */
export const MOMENTOS_DE_OPINIAO = ["painel", "dica", "conta", "comparacao"] as const;
export type MomentoDeOpiniao = (typeof MOMENTOS_DE_OPINIAO)[number];

export function ehMomentoDeOpiniao(valor: unknown): valor is MomentoDeOpiniao {
  return typeof valor === "string" && MOMENTOS_DE_OPINIAO.some((momento) => momento === valor);
}

export const TAMANHO_MAXIMO_DA_OPINIAO = 280;

export type OpiniaoConferida =
  | { ok: true; momento: MomentoDeOpiniao; nota: 1 | 2 | 3 | 4 | 5; texto: string | undefined }
  | { ok: false; mensagem: string };

/** E-mail ou telefone (8 dígitos ou mais, com ou sem espaço, ponto ou traço): o texto é anônimo, não guarda contato. */
const PARECE_CONTATO = /[^\s@]+@[^\s@]+\.[^\s@]+|(?:\d[\s.()-]*){8,}/;

/**
 * Troca caracteres de controle (quebra de linha, tab, C1) por espaço e tira os invisíveis (largura zero) e os que trocam
 * a direção do texto, que servem para esconder conteúdo de quem lê (A4 da seguranca). O banco confere de novo.
 */
function semControle(texto: string): string {
  return [...texto]
    .map((letra) => {
      const codigo = letra.codePointAt(0) ?? 0;
      if (codigo < 32 || (codigo >= 0x7f && codigo <= 0x9f)) return " ";
      const invisivel = (codigo >= 0x200b && codigo <= 0x200f) || (codigo >= 0x202a && codigo <= 0x202e) || (codigo >= 0x2060 && codigo <= 0x2069) || codigo === 0xfeff;
      return invisivel ? "" : letra;
    })
    .join("");
}

/** Tira = + - @ do começo: numa planilha, o texto viraria fórmula (A4 da seguranca). */
function semFormulaNoComeco(texto: string): string {
  return texto.replace(/^[\s=+@-]+/, "");
}

/** Confere a opinião antes de ir ao banco. Texto: sem espaços nas pontas, sem caractere de controle, até 280 letras. */
export function conferirOpiniao(momento: unknown, nota: unknown, texto: unknown): OpiniaoConferida {
  if (!ehMomentoDeOpiniao(momento)) return { ok: false, mensagem: "Momento inválido." };
  if (nota !== 1 && nota !== 2 && nota !== 3 && nota !== 4 && nota !== 5) return { ok: false, mensagem: "Escolha uma nota de 1 a 5." };
  if (texto !== undefined && texto !== null && typeof texto !== "string") return { ok: false, mensagem: "Texto inválido." };
  const limpo = typeof texto === "string" ? semFormulaNoComeco(semControle(texto).trim()).trim() : "";
  if ([...limpo].length > TAMANHO_MAXIMO_DA_OPINIAO) return { ok: false, mensagem: `Escreva até ${TAMANHO_MAXIMO_DA_OPINIAO} letras.` };
  if (PARECE_CONTATO.test(limpo)) return { ok: false, mensagem: "Tire o telefone ou o e-mail do texto: a opinião é anônima." };
  return { ok: true, momento, nota, texto: limpo === "" ? undefined : limpo };
}

/**
 * O quanto a conta de verdade ficou longe da estimativa pelos aparelhos (E12: "os números batem?"). Vai para a
 * contagem só a faixa, nunca os números.
 */
export function faixaDaEstimativa(kwhReal: number, kwhEstimado: number): "estimativa-perto" | "estimativa-media" | "estimativa-longe" | undefined {
  if (!(kwhReal > 0) || !(kwhEstimado > 0)) return undefined;
  const diferenca = Math.abs(kwhReal - kwhEstimado) / kwhReal;
  if (diferenca <= 0.1) return "estimativa-perto";
  if (diferenca <= 0.25) return "estimativa-media";
  return "estimativa-longe";
}
