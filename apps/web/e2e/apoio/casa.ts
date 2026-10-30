/*
 * A casa guardada no aparelho (localStorage do zustand `persist`), vista de fora: o e2e não importa código do site
 * (caixa-preta). Por isso a chave está repetida aqui — se ela mudar no site, a migração falha alto, que é o que se
 * quer: mudar a chave apaga a casa de quem já usa.
 */
import { readFileSync } from "node:fs";
import type { BrowserContext, Page } from "@playwright/test";

export const CHAVE_CASA = "eficiencia-energetica:casa";

/** Forma mínima que os testes leem; o resto do estado passa sem ser interpretado. */
export interface CasaGuardada {
  version: number;
  state: {
    residencia: unknown;
    comodos: { id: string; nome: string }[];
    aparelhos: { id: string; nome: string; quantidade: number; comodoId?: string }[];
    contas: unknown[];
    leituras: unknown[];
    plano: string[];
    [outro: string]: unknown;
  };
}

function eCasaGuardada(valor: unknown): valor is CasaGuardada {
  return (
    typeof valor === "object" &&
    valor !== null &&
    "version" in valor &&
    typeof valor.version === "number" &&
    "state" in valor &&
    typeof valor.state === "object" &&
    valor.state !== null
  );
}

/** Lê uma fixture de `e2e/fixtures/` (o que uma versão do site gravou de verdade; nunca regerar). */
export function lerFixture(nome: "casa-v1.json" | "casa-v2.json"): CasaGuardada {
  const bruto: unknown = JSON.parse(readFileSync(new URL(`../fixtures/${nome}`, import.meta.url), "utf8"));
  if (!eCasaGuardada(bruto)) throw new Error(`fixture ${nome} não tem { version, state }`);
  return bruto;
}

/**
 * Grava a casa antes de qualquer script do site, só na primeira página da aba: recarregar ou navegar depois não
 * grava de novo (senão "Apagar todos os meus dados" e a migração não seriam testados de verdade).
 */
export async function semearCasa(contexto: BrowserContext, casa: CasaGuardada): Promise<void> {
  await contexto.addInitScript(
    ({ chave, valor }) => {
      // A página em branco inicial (about:blank) também roda o script, e lá o armazenamento é proibido.
      if (!location.protocol.startsWith("http")) return;
      if (sessionStorage.getItem("e2e:semeado")) return;
      localStorage.setItem(chave, valor);
      sessionStorage.setItem("e2e:semeado", "1");
    },
    { chave: CHAVE_CASA, valor: JSON.stringify(casa) },
  );
}

/** O que está guardado agora (ou `null` se não há casa). */
export async function casaSalva(pagina: Page): Promise<CasaGuardada | null> {
  const bruto = await pagina.evaluate((chave) => localStorage.getItem(chave), CHAVE_CASA);
  if (bruto === null) return null;
  const valor: unknown = JSON.parse(bruto);
  if (!eCasaGuardada(valor)) throw new Error(`o site gravou em ${CHAVE_CASA} algo sem { version, state }`);
  return valor;
}
