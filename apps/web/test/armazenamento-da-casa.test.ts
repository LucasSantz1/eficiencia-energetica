import type { DadosCasa, Residencia } from "@ee/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { criarArmazenamentoSeguro } from "@/infraestrutura/armazenamento/armazenamento-local";
import { lerCasaNaHidratacao } from "@/infraestrutura/armazenamento/hidratacao";

// O leitor de verdade, com um interruptor para lançar: simula um bug no leitor (pedido 1 da seguranca).
const leitor = vi.hoisted(() => ({ lancar: false }));
vi.mock("@ee/core", async (importarOriginal) => {
  const real = await importarOriginal<typeof import("@ee/core")>();
  return {
    ...real,
    lerCasaSalva: (bruto: unknown) => {
      if (leitor.lancar) throw new Error("bug no leitor");
      return real.lerCasaSalva(bruto);
    },
  };
});

const CHAVE = "eficiencia-energetica:casa";
const COPIA = "eficiencia-energetica:casa-ilegivel";

/** localStorage de mentira, com as gravações contadas. */
class ArmazenamentoDeTeste implements Storage {
  readonly dados = new Map<string, string>();
  gravacoes = 0;
  cheio = false;
  /** Chaves que não cabem mais (memória cheia só para elas). */
  readonly chavesCheias = new Set<string>();
  get length() {
    return this.dados.size;
  }
  clear() {
    this.dados.clear();
  }
  getItem(chave: string) {
    return this.dados.get(chave) ?? null;
  }
  key(indice: number) {
    return [...this.dados.keys()][indice] ?? null;
  }
  removeItem(chave: string) {
    this.dados.delete(chave);
  }
  setItem(chave: string, valor: string) {
    if (this.cheio || this.chavesCheias.has(chave)) throw new Error("QuotaExceededError");
    this.gravacoes += 1;
    this.dados.set(chave, valor);
  }
}

const RESIDENCIA: Residencia = { uf: "SP", municipioIbge: 3550308, municipioNome: "São Paulo", distribuidoraId: "enel-sp", beneficio: "nenhum", ligacao: "bifasica" };
const CASA_VALIDA: DadosCasa = {
  residencia: RESIDENCIA,
  comodos: [{ id: "c1", tipo: "sala", nome: "Sala" }],
  aparelhos: [
    { id: "a1", comodoId: "c1", nome: "TV", quantidade: 1, potenciaW: 100, minutosPorDia: 120, diasPorSemana: 7 },
    { id: "a2", comodoId: "c1", nome: "Ventilador", quantidade: 1, potenciaW: 60, minutosPorDia: 240, diasPorSemana: 7 },
  ],
  contas: [],
  leituras: [],
  plano: [],
};

describe("criarArmazenamentoSeguro", () => {
  it("JSON quebrado e envelope sem state viram state null (a hidratação termina)", () => {
    const local = new ArmazenamentoDeTeste();
    const armazenamento = criarArmazenamentoSeguro(2, () => local);
    local.dados.set(CHAVE, "{quebrado");
    expect(armazenamento.getItem(CHAVE)).toEqual({ state: null, version: 2 });
    local.dados.set(CHAVE, JSON.stringify({ outra: 1 }));
    expect(armazenamento.getItem(CHAVE)).toEqual({ state: null, version: 2 });
    local.dados.set(CHAVE, JSON.stringify({ state: { comodos: [] }, version: "x" }));
    expect(armazenamento.getItem(CHAVE)).toEqual({ state: { comodos: [] }, version: 2 });
  });

  it("sem localStorage, ou com ele bloqueado ou cheio, não lança", () => {
    expect(criarArmazenamentoSeguro(2, () => undefined).getItem(CHAVE)).toBeNull();
    const local = new ArmazenamentoDeTeste();
    local.cheio = true;
    expect(() => criarArmazenamentoSeguro(2, () => local).setItem(CHAVE, { state: {}, version: 2 })).not.toThrow();
  });

  it("com a gravação travada, setItem não grava", () => {
    const local = new ArmazenamentoDeTeste();
    const armazenamento = criarArmazenamentoSeguro(2, () => local);
    armazenamento.travarGravacao();
    armazenamento.setItem(CHAVE, { state: {}, version: 2 });
    expect(local.gravacoes).toBe(0);
    expect(armazenamento.gravacaoTravada()).toBe(true);
  });
});

describe("lerCasaNaHidratacao", () => {
  it("leitor que lança: não propaga, avisa 'nada aproveitável' e trava a gravação", () => {
    const travarGravacao = vi.fn();
    const lida = lerCasaNaHidratacao(CASA_VALIDA, { travarGravacao }, () => {
      throw new Error("bug no leitor");
    });
    expect(lida.aviso).toEqual({ tipo: "nada-aproveitavel" });
    expect(lida.casa.aparelhos).toEqual([]);
    expect(travarGravacao).toHaveBeenCalledOnce();
  });
});

/** Carrega o store do zero, com o localStorage de teste já preenchido (a hidratação acontece no import). */
async function abrirStore(local: ArmazenamentoDeTeste) {
  vi.stubGlobal("window", { localStorage: local });
  vi.resetModules();
  const { useCasa } = await import("@/infraestrutura/armazenamento/casa");
  return useCasa;
}

describe("store da casa (persist com o armazenamento seguro)", () => {
  let local: ArmazenamentoDeTeste;
  beforeEach(() => {
    local = new ArmazenamentoDeTeste();
    leitor.lancar = false;
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("casa válida: hidrata sem aviso e o texto salvo fica idêntico", async () => {
    const texto = JSON.stringify({ state: CASA_VALIDA, version: 2 });
    local.dados.set(CHAVE, texto);
    const useCasa = await abrirStore(local);
    expect(useCasa.persist.hasHydrated()).toBe(true);
    expect(useCasa.getState().avisoDaCasaSalva).toBeUndefined();
    expect(useCasa.getState().aparelhos).toEqual(CASA_VALIDA.aparelhos);
    expect(local.dados.get(CHAVE)).toBe(texto);
    expect(local.gravacoes).toBe(0);
  });

  it("JSON quebrado: hidrata (P1), avisa 'nada aproveitável' e regrava limpo", async () => {
    local.dados.set(CHAVE, "{quebrado");
    const useCasa = await abrirStore(local);
    expect(useCasa.persist.hasHydrated()).toBe(true);
    expect(useCasa.getState().avisoDaCasaSalva).toEqual({ tipo: "nada-aproveitavel" });
    expect(JSON.parse(local.dados.get(CHAVE) ?? "")).toEqual({ state: { comodos: [], aparelhos: [], contas: [], leituras: [], plano: [] }, version: 2 });
  });

  it("aparelho com potência -5: sai só ele, aviso 'parte' e regrava sem ele", async () => {
    const [primeiro, segundo] = CASA_VALIDA.aparelhos;
    local.dados.set(CHAVE, JSON.stringify({ state: { ...CASA_VALIDA, aparelhos: [primeiro, { ...segundo, potenciaW: -5 }] }, version: 2 }));
    const useCasa = await abrirStore(local);
    expect(useCasa.getState().avisoDaCasaSalva).toEqual({ tipo: "parte", descartados: { aparelhos: 1, comodos: 0, contas: 0, leituras: 0, plano: 0 } });
    const salvo: unknown = JSON.parse(local.dados.get(CHAVE) ?? "");
    expect(salvo).toEqual({ state: { ...CASA_VALIDA, aparelhos: [primeiro] }, version: 2 });
  });

  it("leitor que lança (pedido 1): merge sem exceção, aviso, e a casa salva nunca é regravada vazia", async () => {
    const texto = JSON.stringify({ state: CASA_VALIDA, version: 2 });
    local.dados.set(CHAVE, texto);
    leitor.lancar = true;
    const useCasa = await abrirStore(local);
    expect(useCasa.persist.hasHydrated()).toBe(true);
    expect(useCasa.getState().avisoDaCasaSalva).toEqual({ tipo: "nada-aproveitavel" });
    leitor.lancar = false;
    // Ações que antes gravariam a casa vazia por cima da salva.
    useCasa.getState().adicionarComodo("cozinha");
    useCasa.getState().dispensarAvisoDaCasaSalva();
    expect(local.gravacoes).toBe(0);
    expect(local.dados.get(CHAVE)).toBe(texto);
  });

  it("versão 99 com leitor que lança: o persist também não regrava", async () => {
    const texto = JSON.stringify({ state: CASA_VALIDA, version: 99 });
    local.dados.set(CHAVE, texto);
    leitor.lancar = true;
    await abrirStore(local);
    expect(local.gravacoes).toBe(0);
    expect(local.dados.get(CHAVE)).toBe(texto);
  });

  it("as ações passam pelo leitor: o que ele recusa não muda nada", async () => {
    local.dados.set(CHAVE, JSON.stringify({ state: CASA_VALIDA, version: 2 }));
    const useCasa = await abrirStore(local);
    const antes = useCasa.getState().aparelhos;
    const base = { comodoId: "c1", nome: "Chuveiro", quantidade: 1, potenciaW: 5500, minutosPorDia: 10, diasPorSemana: 7 };
    expect(useCasa.getState().adicionarAparelho({ ...base, potenciaW: -5 })).toBeUndefined();
    expect(useCasa.getState().adicionarAparelho({ ...base, comodoId: "nao-existe" })).toBeUndefined();
    expect(useCasa.getState().atualizarAparelho("a1", { potenciaW: Number.POSITIVE_INFINITY })).toBeUndefined();
    useCasa.getState().renomearComodo("c1", "x".repeat(41));
    useCasa.getState().salvarConta({ competencia: "2026-13", kwh: 100, valor: 90 });
    useCasa.getState().salvarLeitura({ data: "2026-02-30", valorKwh: 100 });
    useCasa.getState().definirResidencia({ ...RESIDENCIA, uf: "../x" });
    expect(useCasa.getState().aparelhos).toBe(antes);
    expect(useCasa.getState().comodos[0]?.nome).toBe("Sala");
    expect(useCasa.getState().contas).toEqual([]);
    expect(useCasa.getState().leituras).toEqual([]);
    expect(useCasa.getState().residencia?.uf).toBe("SP");
    // E o que ele aceita entra.
    expect(useCasa.getState().adicionarAparelho(base)?.nome).toBe("Chuveiro");
  });

  describe("a trava solta (D10, 2)", () => {
    const TEXTO = JSON.stringify({ state: CASA_VALIDA, version: 2 });
    const cadastroNovo = { residencia: RESIDENCIA, comodos: [{ id: "n1", tipo: "cozinha" as const, nome: "Cozinha" }], aparelhos: [] };
    async function abrirComLeitorQueLanca() {
      local.dados.set(CHAVE, TEXTO);
      leitor.lancar = true;
      const useCasa = await abrirStore(local);
      leitor.lancar = false;
      return useCasa;
    }

    it('"Apagar tudo" com a trava: tira a chave e a cópia ilegível do aparelho, e a próxima ação grava', async () => {
      local.dados.set(COPIA, "texto antigo");
      const useCasa = await abrirComLeitorQueLanca();
      useCasa.getState().apagarTudo();
      expect(local.dados.has(CHAVE)).toBe(false);
      expect(local.dados.has(COPIA)).toBe(false);
      expect(useCasa.getState().avisoDaCasaSalva).toBeUndefined();
      useCasa.getState().adicionarComodo("cozinha");
      const salvo: unknown = JSON.parse(local.dados.get(CHAVE) ?? "");
      expect(salvo).toMatchObject({ state: { comodos: [{ tipo: "cozinha" }] }, version: 2 });
    });

    it("cadastro novo com a trava: guarda o texto que não deu para ler e grava a casa nova", async () => {
      const useCasa = await abrirComLeitorQueLanca();
      useCasa.getState().criarCasa(cadastroNovo);
      expect(local.dados.get(COPIA)).toBe(TEXTO);
      const salvo: unknown = JSON.parse(local.dados.get(CHAVE) ?? "");
      expect(salvo).toMatchObject({ state: { residencia: RESIDENCIA, comodos: cadastroNovo.comodos, aparelhos: [] }, version: 2 });
    });

    it("cadastro novo com a trava: a cópia é feita uma vez só, sem sobrescrever a que já existe", async () => {
      local.dados.set(COPIA, "cópia de antes");
      const useCasa = await abrirComLeitorQueLanca();
      useCasa.getState().criarCasa(cadastroNovo);
      expect(local.dados.get(COPIA)).toBe("cópia de antes");
      expect(local.dados.get(CHAVE)).not.toBe(TEXTO);
    });

    it("cadastro novo com a trava e sem espaço para a cópia: grava a casa nova assim mesmo", async () => {
      local.chavesCheias.add(COPIA);
      const useCasa = await abrirComLeitorQueLanca();
      useCasa.getState().criarCasa(cadastroNovo);
      expect(local.dados.has(COPIA)).toBe(false);
      const salvo: unknown = JSON.parse(local.dados.get(CHAVE) ?? "");
      expect(salvo).toMatchObject({ state: { comodos: cadastroNovo.comodos }, version: 2 });
    });

    it("sem trava, o cadastro novo não cria a cópia", async () => {
      local.dados.set(CHAVE, TEXTO);
      const useCasa = await abrirStore(local);
      useCasa.getState().criarCasa(cadastroNovo);
      expect(local.dados.has(COPIA)).toBe(false);
    });
  });
});
