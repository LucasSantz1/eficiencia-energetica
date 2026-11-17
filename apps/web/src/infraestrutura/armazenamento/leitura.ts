// Sem "use client" de propósito: o layout raiz (componente de servidor) importa o SCRIPT_DA_PRIMEIRA_PINTURA daqui.
// As funções que tocam no navegador só rodam quando chamadas no cliente.

/**
 * Preferência de leitura (HIS-102): letra maior e mais contraste. Fica numa chave própria e pequena, separada da casa
 * salva, e não é dado da pessoa: não identifica ninguém e não sai do aparelho.
 */
export interface PreferenciaDeLeitura {
  letraMaior: boolean;
  maisContraste: boolean;
}

export const CHAVE_DA_LEITURA = "eficiencia-energetica:leitura";
export const LEITURA_PADRAO: PreferenciaDeLeitura = { letraMaior: false, maisContraste: false };

/** Texto guardado maior que isto não é nosso (o nosso tem uns 40 caracteres): vale como "desligado". */
const TAMANHO_MAXIMO = 200;

/** Lê o texto guardado. Qualquer coisa estranha (JSON quebrado, tipo errado, texto enorme) vale como desligado. */
export function interpretarPreferenciaDeLeitura(bruto: string | null): PreferenciaDeLeitura {
  if (bruto === null || bruto.length > TAMANHO_MAXIMO) return LEITURA_PADRAO;
  let valor: unknown;
  try {
    valor = JSON.parse(bruto);
  } catch {
    return LEITURA_PADRAO;
  }
  if (typeof valor !== "object" || valor === null) return LEITURA_PADRAO;
  return {
    letraMaior: "letraMaior" in valor && valor.letraMaior === true,
    maisContraste: "maisContraste" in valor && valor.maisContraste === true,
  };
}

/*
 * Roda no <head>, antes de pintar, e marca o <html> com a escolha guardada (sem piscar a versão normal). Vai como
 * texto filho do <script>, sem dangerouslySetInnerHTML; por isso não pode ter & < > nem aspas, que o React escaparia
 * (o teste de unidade confere). A CSP da HIS-003a já permite script inline ('unsafe-inline', sem nonce nem hash).
 * Mesma regra do interpretarPreferenciaDeLeitura: só `true` liga.
 */
export const SCRIPT_DA_PRIMEIRA_PINTURA =
  `try{var p=JSON.parse(localStorage.getItem(\`${CHAVE_DA_LEITURA}\`));if(p){var h=document.documentElement;` +
  "if(p.letraMaior===true)h.dataset.letra=`maior`;if(p.maisContraste===true)h.dataset.contraste=`mais`}}catch(e){}";

function armazenamento(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    // Navegador com o armazenamento bloqueado: a escolha vale só nesta tela.
    return undefined;
  }
}

/** Marca o <html> com a escolha; o globals.css faz o resto. */
function aplicarNoDocumento(preferencia: PreferenciaDeLeitura): void {
  const html = document.documentElement;
  if (preferencia.letraMaior) html.dataset.letra = "maior";
  else delete html.dataset.letra;
  if (preferencia.maisContraste) html.dataset.contraste = "mais";
  else delete html.dataset.contraste;
}

const ouvintes = new Set<() => void>();
let atual: PreferenciaDeLeitura | undefined;

/** A escolha guardada (lida uma vez e depois mantida em memória, para o useSyncExternalStore ter sempre o mesmo objeto). */
export function lerPreferenciaDeLeitura(): PreferenciaDeLeitura {
  if (atual) return atual;
  let bruto: string | null = null;
  try {
    bruto = armazenamento()?.getItem(CHAVE_DA_LEITURA) ?? null;
  } catch {
    bruto = null;
  }
  atual = interpretarPreferenciaDeLeitura(bruto);
  return atual;
}

function mudar(preferencia: PreferenciaDeLeitura): void {
  atual = preferencia;
  aplicarNoDocumento(preferencia);
  for (const ouvinte of ouvintes) ouvinte();
}

export function gravarPreferenciaDeLeitura(preferencia: PreferenciaDeLeitura): void {
  try {
    armazenamento()?.setItem(CHAVE_DA_LEITURA, JSON.stringify(preferencia));
  } catch {
    // Cota cheia ou armazenamento bloqueado: a escolha vale até fechar a aba.
  }
  mudar(preferencia);
}

/** "Apagar todos os meus dados" também apaga a escolha de leitura (LGPD). */
export function apagarPreferenciaDeLeitura(): void {
  try {
    armazenamento()?.removeItem(CHAVE_DA_LEITURA);
  } catch {
    // Sem armazenamento, não há o que apagar.
  }
  mudar(LEITURA_PADRAO);
}

export function assinarPreferenciaDeLeitura(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}
