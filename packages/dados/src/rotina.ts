/**
 * Passos da rotina de dados que a linha de comando (`atualizar.ts`) e o diagnóstico (`diagnostico.ts`) dividem:
 * os dois montam com as mesmas entradas, então o diagnóstico mostra o que a rotina vai publicar.
 */
import { anotacao, umaLinha } from "./anotacoes";
import { escreverArquivos } from "./escrever";
import { descreverFontes, lerFontes, type ArquivosDasFontes, type Fontes } from "./fontes";
import { conferirCoerencia, montarArquivos, validar, type Montagem, type Relatorio } from "./montar";
import { carregarSucessoes, conferirSucessoesNaAneel, ErroNasSucessoes, sucessoesEmVigor, type Sucessao } from "./sucessoes";

/** Monta os arquivos a partir das fontes lidas e das sucessões (só as linhas em vigor hoje entram). */
export function montarComAsFontes(fontes: Fontes, opcoes: { hoje: string; geradoEm: string; sucessoes: readonly Sucessao[] }): Montagem {
  return montarArquivos({
    tarifas: fontes.tarifas.selecao.tarifas,
    analiseDasTarifas: fontes.tarifas.selecao,
    agentesDaTarifa: fontes.tarifas.agentes,
    bandeiras: fontes.bandeiras,
    vinculos: fontes.vinculos,
    anoMaisRecenteDosConjuntos: fontes.conjuntos.anoMaisRecente,
    sucessoes: sucessoesEmVigor(opcoes.sucessoes, opcoes.hoje),
    localidades: fontes.localidades,
    hoje: opcoes.hoje,
    geradoEm: opcoes.geradoEm,
    origem: "aneel",
    fontes: descreverFontes(fontes.fonteIbge),
  });
}

/** As duas barreiras sobre a mesma montagem: coerência (nunca passa com --forcar) e validação (passa). */
export function conferirMontagem(fontes: Fontes, montagem: Montagem, opcoes: { hoje: string; sucessoes: readonly Sucessao[] }) {
  const contexto = {
    hoje: opcoes.hoje,
    sucessoes: sucessoesEmVigor(opcoes.sucessoes, opcoes.hoje),
    agentesDaTarifa: fontes.tarifas.agentes,
    siglasDosConjuntos: fontes.conjuntos.siglasPorCnpj,
  };
  return {
    coerencia: conferirCoerencia(montagem, contexto),
    validacao: validar(montagem, opcoes.hoje),
    avisosDasSucessoes: conferirSucessoesNaAneel(contexto.sucessoes, contexto).avisos,
  };
}

const ou = (itens: readonly string[], vazio: string) => (itens.length > 0 ? itens.join("; ") : vazio);

/**
 * Linhas `::notice` e `::warning` do D6 (critério 9). Saem direto no log, o que funciona em qualquer passo e não
 * mexe no `atualizar-dados.yml` (T2). Todo texto passa por `anotacao`, que escapa o que vem da ANEEL (R2).
 * Poucas linhas de propósito: o GitHub mostra até 10 anotações de cada tipo por passo.
 */
export function anotacoesDoRelatorio(r: Relatorio, avisosDasSucessoes: readonly string[]): string[] {
  const linhas = [
    anotacao("notice", "Sucessões aplicadas (HIS-111)", ou(r.sucessoesAplicadas.map((s) => `${s.de} → ${s.para}: ${s.municipios} municípios`), "nenhuma")),
    anotacao("notice", "Renomeações por CNPJ (HIS-111)", ou(r.renomeacoesPorCnpj.map((s) => `${s.de} → ${s.para}: ${s.municipios} municípios`), "nenhuma")),
    anotacao("notice", "Vínculos extintos descartados (HIS-111)", ou(r.vinculosExtintosDescartados.map((c) => `${c.sigla}: ${c.municipios} municípios`), "nenhum")),
    anotacao("notice", "Tarifas descartadas por vencimento (HIS-111)", ou(r.tarifasDescartadasPorVencimento.map((t) => `${t.sigla} (vigência até ${t.fimVigencia})`), "nenhuma")),
  ];
  if (r.tarifasVencidasEmUso.length > 0) {
    linhas.push(anotacao("warning", "Tarifas vencidas ainda em uso (até 6 meses)", ou(r.tarifasVencidasEmUso.map((t) => `${t.sigla} (vigência até ${t.fimVigencia})`), "")));
  }
  if (r.vinculosExtintosMantidos.length > 0) {
    linhas.push(anotacao("warning", "Vínculos extintos mantidos (único da cidade)", ou(r.vinculosExtintosMantidos.map((c) => `${c.sigla}: ${c.municipios} municípios`), "")));
  }
  if (r.tarifasComMaisDeUmValor.length > 0) {
    linhas.push(anotacao("warning", "Mais de um valor B1 na vigência (V7)", ou(r.tarifasComMaisDeUmValor.map((t) => `${t.sigla}: ${t.valores} valores`), "")));
  }
  if (r.sucessorasCandidatas.length > 0) {
    linhas.push(anotacao("notice", "Sucessoras candidatas (só informação)", ou(r.sucessorasCandidatas.map((c) => `${c.de} → ${c.candidatas.join("/")}`), "")));
  }
  if (avisosDasSucessoes.length > 0) linhas.push(anotacao("warning", "Linhas do sucessoes.json para revisar", ou(avisosDasSucessoes, "")));
  return linhas;
}

export interface OpcoesDaAtualizacao {
  arquivos: ArquivosDasFontes;
  hoje: string;
  geradoEm: string;
  baixar: boolean;
  usarApiIbge: boolean;
  /** Grava mesmo com erro na validação (V5, V6 e as de antes). Nunca pula a coerência. */
  forcar: boolean;
  pastaSaida: string;
  caminhoSucessoes?: string;
  /** Saída do log; o padrão é o console. */
  registrar?: (linha: string) => void;
  registrarErro?: (linha: string) => void;
}

/**
 * A rotina inteira: lê o sucessoes.json, baixa e lê as fontes, monta, confere e grava. Devolve 1 (e não grava nada)
 * quando uma linha do sucessoes.json está errada, quando a coerência falha (mesmo com --forcar) ou quando a
 * validação falha sem --forcar.
 */
export async function executarAtualizacao(o: OpcoesDaAtualizacao): Promise<{ codigo: 0 | 1; gravou: boolean }> {
  const registrar = o.registrar ?? ((linha: string) => console.log(linha));
  const registrarErro = o.registrarErro ?? ((linha: string) => console.error(linha));

  // Lê a tabela antes de baixar: uma linha errada para a rotina sem gastar o download (critério 7).
  let sucessoes: Sucessao[];
  try {
    sucessoes = await carregarSucessoes(o.caminhoSucessoes);
  } catch (erro) {
    if (!(erro instanceof ErroNasSucessoes)) throw erro;
    registrarErro(umaLinha(`✗ ${erro.message}`));
    registrarErro("Nada foi gravado. Corrija a linha no sucessoes.json (por PR, com revisão do dominio-energia).");
    return { codigo: 1, gravou: false };
  }

  const fontes = await lerFontes({ arquivos: o.arquivos, hoje: o.hoje, baixar: o.baixar, usarApiIbge: o.usarApiIbge, registrar });
  const montagem = montarComAsFontes(fontes, { hoje: o.hoje, geradoEm: o.geradoEm, sucessoes });

  registrar("\nResumo:");
  // JSON.stringify já escapa quebras de linha dentro dos textos, então o resumo não abre linha nova de comando (R2).
  registrar(JSON.stringify({ ...montagem.relatorio, agentesSemTarifa: montagem.relatorio.agentesSemTarifa.slice(0, 30) }, null, 2));

  const { coerencia, validacao, avisosDasSucessoes } = conferirMontagem(fontes, montagem, { hoje: o.hoje, sucessoes });
  for (const linha of anotacoesDoRelatorio(montagem.relatorio, avisosDasSucessoes)) registrar(linha);

  if (coerencia.length > 0) {
    registrarErro("\nA conferência de coerência encontrou problemas (número errado ou contrato quebrado):");
    for (const e of coerencia) registrarErro(umaLinha(`  ✗ ${e}`));
    registrarErro("\nNada foi gravado. Estas regras (V1–V4, V7–V10) não passam com --forcar.");
    return { codigo: 1, gravou: false };
  }
  if (validacao.length > 0) {
    registrarErro("\nA validação encontrou problemas:");
    for (const e of validacao) registrarErro(umaLinha(`  ✗ ${e}`));
    if (!o.forcar) {
      registrarErro("\nNada foi gravado. Use --forcar para gravar mesmo assim.");
      return { codigo: 1, gravou: false };
    }
  }

  const { escritos, mudou } = await escreverArquivos(montagem, o.pastaSaida);
  registrar(mudou ? `\n✓ ${escritos.length} arquivos gravados em ${o.pastaSaida}` : "\n✓ Os dados não mudaram desde a última atualização.");
  return { codigo: 0, gravou: mudou };
}
