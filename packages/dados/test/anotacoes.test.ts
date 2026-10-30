import { describe, expect, it } from "vitest";
import { anotacao, anotacoesDoResumo, celulaMarkdown, escaparDadoDeComando, LIMITE_RESUMO_BYTES, limitarResumo, MAXIMO_ANOTACOES_DO_RESUMO, umaLinha } from "../src/anotacoes";

// HIS-111, R2 da seguranca: texto da ANEEL não pode virar comando do runner nem quebrar o resumo do job.
describe("saída para o GitHub Actions", () => {
  const siglaMaliciosa = "X\n::add-mask::a";

  it("escapa %, \\r e \\n no texto da anotação", () => {
    expect(escaparDadoDeComando("50%\r\nfim")).toBe("50%25%0D%0Afim");
    const linha = anotacao("notice", "Sucessões aplicadas", siglaMaliciosa);
    expect(linha).toBe("::notice title=Sucessões aplicadas::X%0A::add-mask::a");
    expect(linha.split("\n")).toHaveLength(1);
  });

  it("escapa : e , no título, que separam propriedades", () => {
    expect(anotacao("warning", "a: b, c", "x")).toBe("::warning title=a%3A b%2C c::x");
  });

  it("deixa o log comum numa linha só", () => {
    expect(umaLinha(siglaMaliciosa)).toBe("X ::add-mask::a");
    expect(umaLinha("a\u2028b\u0000c")).toBe("a b c");
  });

  it("limpa a célula do Markdown e corta em 80 caracteres", () => {
    expect(celulaMarkdown("A|B<script>`x`\n::add-mask::a")).toBe("ABscript>x ::add-mask::a");
    const longa = celulaMarkdown("x".repeat(200));
    expect(longa).toHaveLength(80);
    expect(longa.endsWith("…")).toBe(true);
  });

  it("corta o resumo em 64 KiB sem partir caractere", () => {
    expect(limitarResumo("curto")).toBe("curto");
    const cortado = limitarResumo("ç".repeat(LIMITE_RESUMO_BYTES));
    expect(Buffer.byteLength(cortado, "utf8")).toBeLessThanOrEqual(LIMITE_RESUMO_BYTES);
    expect(cortado).not.toContain("\uFFFD");
    expect(cortado).toContain("resumo cortado");
  });
});

describe("anotacoesDoResumo", () => {
  it("corta o resumo em linhas inteiras, escapa e não passa de 9 anotações", () => {
    const linhas = Array.from({ length: 4000 }, (_, i) => `| linha ${i} | 100% |`);
    const anotacoes = anotacoesDoResumo(linhas.join("\n"));
    expect(anotacoes.length).toBeLessThanOrEqual(MAXIMO_ANOTACOES_DO_RESUMO);
    expect(anotacoes[0]).toMatch(/^::notice title=Diagnóstico 1\/\d+::\| linha 0 \| 100%25 \|%0A\| linha 1 /);
    for (const a of anotacoes) expect(a.split("\n")).toHaveLength(1);
  });

  it("não deixa texto de fora abrir um comando novo no log", () => {
    const [a] = anotacoesDoResumo("RGE\n::add-mask::segredo\r\nfim");
    expect(a).toBeDefined();
    expect(a?.split("\n")).toHaveLength(1);
    expect(a).toContain("%0A::add-mask::segredo");
  });
});
