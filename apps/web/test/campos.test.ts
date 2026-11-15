import { describe, expect, it } from "vitest";
import { formatarKwh, formatarReais, formatarWatts, LIMITES } from "@ee/core";
import { faixaDoConsumoDaConta, faixaDoValorDaConta, mensagensDaPotencia, mensagensDoConsumoDaConta, mensagensDoValorDaConta } from "@/ui/campos/mensagens";
import { situacaoDoCampo, textoDoNumero, type RegraDoCampo } from "@/ui/campos/situacaoDoCampo";

// O que o useCampoNumerico mostra sai de situacaoDoCampo (o hook só guarda o texto, se é para mostrar e o "Sim").
const potencia: RegraDoCampo = { faixa: LIMITES.potenciaW, casas: 0, obrigatorio: true, mensagens: mensagensDaPotencia() };
const valorNoCadastro: RegraDoCampo = { faixa: faixaDoValorDaConta("cadastro"), casas: 2, obrigatorio: true, mensagens: mensagensDoValorDaConta("cadastro") };
const valorNoAcompanhamento: RegraDoCampo = { faixa: faixaDoValorDaConta("acompanhamento"), casas: 2, obrigatorio: true, mensagens: mensagensDoValorDaConta("acompanhamento") };

describe("situacaoDoCampo: ok, erro e alerta (HIS-003b, T5 e T6)", () => {
  it("ok: valor comum, já como número", () => {
    expect(situacaoDoCampo("5500", potencia)).toEqual({ tipo: "ok", valor: 5500 });
    expect(situacaoDoCampo("1.500", potencia)).toEqual({ tipo: "ok", valor: 1500 });
  });

  it("erro: vazio e zero pedem a potência; acima de 75.000 W mostra a faixa com mín. e máx. formatados", () => {
    const vazio = "Digite a potência do aparelho, em watts (W).";
    expect(situacaoDoCampo("", potencia)).toEqual({ tipo: "erro", mensagem: vazio });
    expect(situacaoDoCampo("0", potencia)).toEqual({ tipo: "erro", mensagem: vazio });
    const fora = situacaoDoCampo("75001", potencia);
    expect(fora).toEqual({ tipo: "erro", mensagem: expect.stringContaining(`de ${formatarWatts(1)} a ${formatarWatts(75_000)}`) });
  });

  it("alerta: 10.001 W pergunta \"Confere?\" com o número que a tela entendeu e o chuveiro de referência", () => {
    const alerta = situacaoDoCampo("10001", potencia);
    expect(alerta).toMatchObject({ tipo: "alerta", valor: 10_001 });
    expect(alerta.tipo === "alerta" && alerta.texto).toBe("10.001 W é muito para um aparelho de casa. Um chuveiro forte tem até 7.800 W. Veja se não sobrou um zero.");
    expect(situacaoDoCampo("10000", potencia).tipo).toBe("ok");
  });

  it("o \"Sim\" vale só para o mesmo número: outro número raro pergunta de novo", () => {
    expect(situacaoDoCampo("12000", potencia, 12_000)).toEqual({ tipo: "ok", valor: 12_000 });
    expect(situacaoDoCampo("12.000", potencia, 12_000)).toEqual({ tipo: "ok", valor: 12_000 });
    expect(situacaoDoCampo("13000", potencia, 12_000).tipo).toBe("alerta");
  });

  it("\"135.90\" é R$ 135,90 (e não R$ 13.590); \"1,2,5\" é mal escrito", () => {
    expect(situacaoDoCampo("135.90", valorNoCadastro)).toEqual({ tipo: "ok", valor: 135.9 });
    expect(situacaoDoCampo("1,2,5", valorNoCadastro)).toEqual({ tipo: "erro", mensagem: "Escreva só o número. Para centavos, use vírgula: 135,90." });
  });

  it("conta zerada: no cadastro tem texto próprio; no acompanhamento é aceita", () => {
    expect(situacaoDoCampo("0", valorNoCadastro)).toMatchObject({ tipo: "erro", mensagem: expect.stringContaining("Pular, não tenho a conta agora") });
    expect(situacaoDoCampo("0,00", valorNoAcompanhamento)).toEqual({ tipo: "ok", valor: 0 });
    expect(mensagensDoConsumoDaConta("ajustes").zero).not.toContain("Pular");
  });

  it("campo não obrigatório em branco fica ok e sem valor", () => {
    expect(situacaoDoCampo("  ", { ...potencia, obrigatorio: false })).toEqual({ tipo: "ok", valor: undefined });
  });
});

describe("mensagens: mín. e máx. vêm do limites.ts conforme o uso", () => {
  it("consumo da conta: 1 kWh na calibração e 0 kWh no acompanhamento", () => {
    expect(faixaDoConsumoDaConta("ajustes")).toBe(LIMITES.contaKwhCalibracao);
    expect(mensagensDoConsumoDaConta("cadastro").fora).toContain(`entre ${formatarKwh(1)} e ${formatarKwh(LIMITES.contaKwhCalibracao.max)}`);
    expect(mensagensDoConsumoDaConta("acompanhamento").fora).toContain(`entre ${formatarKwh(0)} e`);
    expect(mensagensDoValorDaConta("acompanhamento").fora).toContain(`entre ${formatarReais(0)} e ${formatarReais(LIMITES.contaValorAcompanhamento.max)}`);
  });
});

describe("textoDoNumero", () => {
  it("dinheiro com centavos; consumo com vírgula", () => {
    expect(textoDoNumero(135.9, true)).toBe("135,90");
    expect(textoDoNumero(150.5)).toBe("150,5");
    expect(textoDoNumero(undefined)).toBe("");
  });
});
