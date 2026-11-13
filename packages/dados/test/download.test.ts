import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { linhasDoErro } from "../src/anotacoes";
import { baixar, ErroNoDownload, type Buscar, type RespostaDoDownload } from "../src/csv";

const URL_FALSA = "https://dadosabertos.aneel.gov.br/arquivo.csv";
const CONTEUDO = "SigAgente;VlrTE\n" + "RGE;384,61\n".repeat(20);

/** O erro que o `fetch` do Node lança quando a conexão não sai em tempo: "fetch failed" com o motivo no `cause`. */
class ConnectTimeoutError extends Error {
  override name = "ConnectTimeoutError";
  code = "UND_ERR_CONNECT_TIMEOUT";
}
const tempoEsgotado = () => new TypeError("fetch failed", { cause: new ConnectTimeoutError("Connect Timeout Error (attempted address: dadosabertos.aneel.gov.br:443, timeout: 45000ms)") });

const ok = (texto = CONTEUDO): RespostaDoDownload => ({ ok: true, status: 200, body: new Response(texto).body });
const status = (codigo: number): RespostaDoDownload => ({ ok: false, status: codigo, body: null });

/** `fetch` falso: cada chamada usa o próximo passo (uma resposta ou um erro lançado). */
function fetchFalso(passos: (RespostaDoDownload | Error)[]): Buscar & { chamadas: number } {
  const buscar = Object.assign(
    async (): Promise<RespostaDoDownload> => {
      const passo = passos[buscar.chamadas++];
      if (!passo) throw new Error("fetch falso sem mais passos");
      if (passo instanceof Error) throw passo;
      return passo;
    },
    { chamadas: 0 },
  );
  return buscar;
}

const pastas: string[] = [];
afterEach(async () => {
  for (const p of pastas.splice(0)) await rm(p, { recursive: true, force: true });
});

async function rodar(passos: (RespostaDoDownload | Error)[]) {
  const pasta = await mkdtemp(join(tmpdir(), "ee-download-"));
  pastas.push(pasta);
  const destino = join(pasta, "cache", "tarifas.csv");
  const buscar = fetchFalso(passos);
  const esperas: number[] = [];
  const log: string[] = [];
  const promessa = baixar(URL_FALSA, destino, { buscar, esperar: async (ms) => void esperas.push(ms), registrar: (l) => log.push(l) });
  return { promessa, destino, buscar, esperas, log };
}

describe("download da ANEEL resiliente", () => {
  it("tempo de conexão esgotado duas vezes, depois baixa: espera 15 s e 30 s e registra cada tentativa", async () => {
    const r = await rodar([tempoEsgotado(), tempoEsgotado(), ok()]);
    await r.promessa;
    expect(await readFile(r.destino, "utf8")).toBe(CONTEUDO);
    expect(r.buscar.chamadas).toBe(3);
    expect(r.esperas).toEqual([15_000, 30_000]);
    expect(r.log[0]).toMatch(/^ {2}tentativa 1\/4 falhou em [\d.]+ s: ConnectTimeoutError: .*\[UND_ERR_CONNECT_TIMEOUT\]; nova tentativa em 15 s$/);
    expect(r.log[1]).toMatch(/tentativa 2\/4 falhou .*; nova tentativa em 30 s$/);
    expect(r.log[2]).toBe("  tentativa 3/4: ok");
  });

  it("5xx tenta de novo", async () => {
    const r = await rodar([status(503), ok()]);
    await r.promessa;
    expect(r.buscar.chamadas).toBe(2);
    expect(r.log[0]).toMatch(/tentativa 1\/4 falhou .*HTTP 503/);
  });

  it("erro no meio do corpo (conexão caiu) tenta de novo", async () => {
    const quebrado = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(new TextEncoder().encode("SigAgente;VlrTE\n"));
        c.error(new TypeError("terminated", { cause: Object.assign(new Error("other side closed"), { code: "UND_ERR_SOCKET" }) }));
      },
    });
    const r = await rodar([{ ok: true, status: 200, body: quebrado }, ok()]);
    await r.promessa;
    expect(r.buscar.chamadas).toBe(2);
    expect(await readFile(r.destino, "utf8")).toBe(CONTEUDO);
  });

  it("se a conexão cai em todas as tentativas, nenhum pedaço do arquivo fica no destino", async () => {
    const quebrado = () =>
      new ReadableStream<Uint8Array>({
        start(c) {
          c.enqueue(new TextEncoder().encode(CONTEUDO));
          c.error(new TypeError("terminated"));
        },
      });
    const r = await rodar([1, 2, 3, 4].map(() => ({ ok: true, status: 200, body: quebrado() })));
    await expect(r.promessa).rejects.toThrow(ErroNoDownload);
    await expect(stat(r.destino)).rejects.toThrow();
  });

  it.each([400, 403, 404, 429])("HTTP %i não tenta de novo", async (codigo) => {
    const r = await rodar([status(codigo), ok()]);
    await expect(r.promessa).rejects.toThrow(ErroNoDownload);
    expect(r.buscar.chamadas).toBe(1);
    expect(r.esperas).toEqual([]);
    expect(r.log).toEqual([expect.stringMatching(new RegExp(`tentativa 1/4 falhou .*HTTP ${codigo}.*; sem nova tentativa$`))]);
  });

  it("arquivo vazio não tenta de novo", async () => {
    const r = await rodar([ok("SigAgente\n"), ok()]);
    await expect(r.promessa).rejects.toThrow(/muito pequeno/);
    expect(r.buscar.chamadas).toBe(1);
  });

  it("as 4 tentativas falham: erro final com o cause da rede, esperas de 15, 30 e 60 s e nada no destino", async () => {
    const r = await rodar([tempoEsgotado(), tempoEsgotado(), tempoEsgotado(), tempoEsgotado()]);
    const erro: unknown = await r.promessa.catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(ErroNoDownload);
    expect(erro instanceof Error && erro.cause instanceof ConnectTimeoutError).toBe(true);
    expect(r.buscar.chamadas).toBe(4);
    expect(r.esperas).toEqual([15_000, 30_000, 60_000]);
    expect(r.log).toHaveLength(4);
    expect(r.log[3]).toMatch(/tentativa 4\/4 falhou .*; sem nova tentativa$/);
    // O main mostra o motivo de verdade, numa linha (S1).
    expect(linhasDoErro(erro)[1]).toMatch(/^Causa: ConnectTimeoutError: Connect Timeout Error .* \[UND_ERR_CONNECT_TIMEOUT\]$/);
    await expect(stat(r.destino)).rejects.toThrow();
  });
});
