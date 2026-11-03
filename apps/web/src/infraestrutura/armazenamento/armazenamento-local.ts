import type { PersistStorage, StorageValue } from "zustand/middleware";

/**
 * Armazenamento da casa no aparelho da pessoa (localStorage), sem nunca derrubar a tela (HIS-003a, D3):
 * - JSON quebrado ou envelope sem `state` volta como `{ state: null }`: o `merge` do store recebe `null`, marca
 *   "ilegível" e a hidratação termina (sem isso, o `persist` nunca marcava `hasHydrated`: falha P1 da seguranca);
 * - localStorage bloqueado ou cheio não lança (o aviso de "não deu para salvar" está no backlog);
 * - com a gravação travada, nada é gravado: é o que o `merge` faz quando o leitor falha, para nunca regravar uma casa
 *   vazia por cima da salva (pedido 1 da seguranca, 2026-11-03). A trava solta só com "Apagar tudo" e com um cadastro
 *   novo confirmado (D10, 2).
 */
export interface ArmazenamentoSeguro extends PersistStorage<unknown, void> {
  /** Impede qualquer gravação até a página ser aberta de novo, ou até `liberarGravacao`. */
  travarGravacao(): void;
  liberarGravacao(): void;
  gravacaoTravada(): boolean;
  /**
   * Copia o texto salvo em `origem` para `destino`, sem ler nem conferir, só se `destino` ainda não existir (uma vez
   * só, sem sobrescrever). Não lança: se a memória estiver cheia, a cópia simplesmente não acontece.
   */
  copiarTextoUmaVez(origem: string, destino: string): void;
}

/** O localStorage, ou `undefined` no servidor e quando o navegador o bloqueia (o acesso pode lançar `SecurityError`). */
function localStorageDoNavegador(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

function ehEnvelope(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor) && Object.hasOwn(valor, "state");
}

/** Lê o texto salvo sem lançar. O conteúdo de `state` não é conferido aqui: isso é do `lerCasaSalva`, no `merge`. */
function lerEnvelope(texto: string, versaoAtual: number): StorageValue<unknown> {
  let bruto: unknown;
  try {
    bruto = JSON.parse(texto);
  } catch {
    return { state: null, version: versaoAtual };
  }
  if (!ehEnvelope(bruto)) return { state: null, version: versaoAtual };
  const versao = bruto["version"];
  return { state: bruto["state"], version: typeof versao === "number" ? versao : versaoAtual };
}

/**
 * @param obterArmazenamento de onde ler e onde gravar; o padrão é o localStorage (os testes passam um de mentira).
 */
export function criarArmazenamentoSeguro(versaoAtual: number, obterArmazenamento: () => Storage | undefined = localStorageDoNavegador): ArmazenamentoSeguro {
  let travada = false;
  return {
    getItem: (nome) => {
      const armazenamento = obterArmazenamento();
      if (armazenamento === undefined) return null;
      let texto: string | null;
      try {
        texto = armazenamento.getItem(nome);
      } catch {
        return null;
      }
      return texto === null ? null : lerEnvelope(texto, versaoAtual);
    },
    setItem: (nome, valor) => {
      if (travada) return;
      try {
        obterArmazenamento()?.setItem(nome, JSON.stringify(valor));
      } catch {
        // Memória cheia ou bloqueada: a tela continua funcionando; o aviso fica para o backlog (risco 6 do D9).
      }
    },
    removeItem: (nome) => {
      try {
        obterArmazenamento()?.removeItem(nome);
      } catch {
        // Mesmo motivo do setItem.
      }
    },
    travarGravacao: () => {
      travada = true;
    },
    liberarGravacao: () => {
      travada = false;
    },
    gravacaoTravada: () => travada,
    copiarTextoUmaVez: (origem, destino) => {
      try {
        const armazenamento = obterArmazenamento();
        if (armazenamento === undefined || armazenamento.getItem(destino) !== null) return;
        const texto = armazenamento.getItem(origem);
        if (texto !== null) armazenamento.setItem(destino, texto);
      } catch {
        // Memória cheia ou bloqueada: o cadastro novo segue mesmo sem a cópia (D10, 2).
      }
    },
  };
}
