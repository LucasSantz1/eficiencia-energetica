/**
 * Diagnóstico só de leitura da HIS-111 (passo 0, T3): mostra, com os CSVs reais da ANEEL, o que a montagem da branch
 * vai mudar, sem gravar nada. Não chama `escreverArquivos`.
 *
 * Responde ao portão do passo 0:
 *   (a) os conjuntos das empresas vencidas pararam de reportar antes de `ano máximo − 1`? (C2)
 *   (b) cada sucessora tem um só valor B1 na vigência? (V7)
 *   (c) quais CNPJs aparecem com mais de uma sigla?
 *   (d) quantos vínculos extintos são os únicos da cidade? (regra segura do D3)
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { celulaMarkdown } from "./anotacoes";
import type { AgenteDaTarifa, SelecaoDeTarifas } from "./aneel/tarifas";
import { lerFontes, type ArquivosDasFontes, type Fontes } from "./fontes";
import type { Montagem, Relatorio } from "./montar";
import { conferirMontagem, montarComAsFontes } from "./rotina";
import { CAMINHO_SUCESSOES, carregarSucessoes, type Sucessao } from "./sucessoes";
import { normalizar, slug } from "./util";

/** As 6 cidades do critério 1 e as 3 de risco de ordem da lista (Guarapuava, Nova Friburgo, Campina Grande). */
export const CIDADES_CONFERIDAS: readonly { ibge: number; nome: string; esperada?: string }[] = [
  { ibge: 4300406, nome: "Alegrete (RS)", esperada: "rge" },
  { ibge: 3504008, nome: "Assis (SP)", esperada: "ess" },
  { ibge: 3507605, nome: "Bragança Paulista (SP)", esperada: "ess" },
  { ibge: 3530508, nome: "Mococa (SP)", esperada: "cpfl-santa-cruz" },
  { ibge: 3522307, nome: "Itapetininga (SP)", esperada: "cpfl-santa-cruz" },
  { ibge: 1400209, nome: "Caracaraí (RR)", esperada: "ambar-roraima" },
  { ibge: 4109401, nome: "Guarapuava (PR)" },
  { ibge: 3303401, nome: "Nova Friburgo (RJ)" },
  { ibge: 2504009, nome: "Campina Grande (PB)" },
];

export interface VencidaNoDiagnostico {
  sigla: string;
  cnpj?: string;
  ultimoFim?: string;
  /** O CNPJ também é de uma sigla vigente (RGE SUL e RGE): é renomeação (C1, D1), não conjunto extinto (C2). */
  mesmoCnpjDeVigente: boolean;
  /** Conjuntos elétricos em que ela é a dona mais recente. */
  conjuntosComoDono: number;
  /** Último `AnoIndice` desses conjuntos. */
  ultimoAnoDosConjuntos?: number;
  /** Municípios desses conjuntos. */
  municipios: number;
  /** Desses municípios, quantos têm também um conjunto recente de outra empresa. */
  municipiosComConjuntoRecenteDeOutra: number;
}

export interface ComparacaoComPublicados {
  /** Municípios lidos em `municipios/*.json` publicados. */
  publicadosLidos: number;
  municipiosQueMudam: number;
  porUF: { uf: string; municipios: number }[];
  /** Municípios publicados com ao menos uma empresa vencida na lista (critério 2). */
  comEmpresaVencida: number;
  /** Desses, quantos ainda têm uma empresa vencida depois da montagem (o esperado é 0). */
  aindaComEmpresaVencida: number;
  /** Desses, quantos ficam sem nenhuma distribuidora (o esperado é 0). */
  ficamSemDistribuidora: number;
  cidades: { ibge: number; nome: string; esperada?: string; antes?: string[]; depois?: string[] }[];
}

export interface DadosDoDiagnostico {
  hoje: string;
  anoMaisRecenteDosConjuntos: number;
  vencidas: VencidaNoDiagnostico[];
  cnpjsComVariasSiglas: { cnpj: string; agentes: AgenteDaTarifa[] }[];
  /** V7: todas as siglas com mais de um valor na vigência, e se cada uma é sucessora em `sucessoes.json`. */
  comMaisDeUmValor: (SelecaoDeTarifas["comMaisDeUmValor"][number] & { ehSucessora: boolean })[];
  /** Portão (b): cada sucessora do `sucessoes.json` e quantos valores ela tem na vigência (0 = sem tarifa). */
  sucessoras: { sigla: string; cnpj: string; valores: number }[];
  /** Critério 3: V1–V4 e V7–V10 sobre a montagem real (o que a rotina vai publicar). */
  errosDaCoerencia: string[];
  errosDaValidacao: string[];
  avisosDasSucessoes: string[];
  relatorio: Relatorio;
  substituidas: Readonly<Record<string, string>>;
  comparacao: ComparacaoComPublicados;
}

export interface OpcoesDoDiagnostico {
  arquivos: ArquivosDasFontes;
  hoje: string;
  baixar: boolean;
  /** Pasta dos arquivos publicados (`apps/web/public/dados`), só lida. */
  pastaPublicada: string;
  caminhoSucessoes?: string;
  usarApiIbge?: boolean;
  registrar?: (linha: string) => void;
}

/** Listas do portão ficam fora de tabela e podem ser mais longas que uma célula. */
const LIMITE_LISTA = 600;

const compacto = (t: string | undefined) => normalizar(t).replace(/[^a-z0-9]/g, "");

export async function diagnosticar(opcoes: OpcoesDoDiagnostico): Promise<{ dados: DadosDoDiagnostico; markdown: string }> {
  const sucessoes = await carregarSucessoes(opcoes.caminhoSucessoes ?? CAMINHO_SUCESSOES);
  const fontes = await lerFontes({
    arquivos: opcoes.arquivos,
    hoje: opcoes.hoje,
    baixar: opcoes.baixar,
    usarApiIbge: opcoes.usarApiIbge ?? false,
    registrar: opcoes.registrar,
  });
  const montagem = montarComAsFontes(fontes, { hoje: opcoes.hoje, geradoEm: `${opcoes.hoje}T12:00:00.000Z`, sucessoes });
  const conferencia = conferirMontagem(fontes, montagem, { hoje: opcoes.hoje, sucessoes });
  const { agentes, selecao } = fontes.tarifas;
  const vencidas = agentes.filter((a) => !a.vigente);
  const publicados = await lerMunicipiosPublicados(opcoes.pastaPublicada);

  const dados: DadosDoDiagnostico = {
    hoje: opcoes.hoje,
    anoMaisRecenteDosConjuntos: fontes.conjuntos.anoMaisRecente,
    vencidas: analisarVencidas(vencidas, agentes, fontes),
    cnpjsComVariasSiglas: agruparPorCnpj(agentes),
    ...conferirValores(selecao, sucessoes),
    errosDaCoerencia: conferencia.coerencia,
    errosDaValidacao: conferencia.validacao,
    avisosDasSucessoes: conferencia.avisosDasSucessoes,
    relatorio: montagem.relatorio,
    substituidas: montagem.tarifas.substituidas,
    comparacao: comparar(publicados, montagem, new Set(vencidas.map((v) => slug(v.sigla)))),
  };
  return { dados, markdown: escreverMarkdown(dados) };
}

/** Para cada empresa vencida: em quais conjuntos ela ainda é a dona mais recente, e até que ano eles reportaram. */
function analisarVencidas(vencidas: AgenteDaTarifa[], agentes: AgenteDaTarifa[], fontes: Fontes): VencidaNoDiagnostico[] {
  const anoMaximo = fontes.conjuntos.anoMaisRecente;
  const municipiosDoConjunto = new Map<string, Set<number>>();
  const conjuntosDoMunicipio = new Map<number, Set<string>>();
  const { colunas, linhas } = fontes.indQual;
  for (const linha of linhas) {
    const conjunto = (linha[colunas.conjunto] ?? "").replace(/\D/g, "");
    const ibge = Number((linha[colunas.ibge] ?? "").replace(/\D/g, ""));
    if (!conjunto || !ibge) continue;
    municipiosDoConjunto.set(conjunto, (municipiosDoConjunto.get(conjunto) ?? new Set<number>()).add(ibge));
    conjuntosDoMunicipio.set(ibge, (conjuntosDoMunicipio.get(ibge) ?? new Set<string>()).add(conjunto));
  }
  const cnpjsVigentes = new Set(agentes.filter((a) => a.vigente && a.cnpj).map((a) => a.cnpj));

  return vencidas.map((v) => {
    // Quando o CNPJ também é de uma sigla vigente (RGE SUL e RGE), só a sigla separa as duas.
    const porCnpj = v.cnpj !== undefined && !cnpjsVigentes.has(v.cnpj);
    const ehDela = (dono: { agente: string; cnpj?: string }) => (porCnpj && dono.cnpj === v.cnpj) || compacto(dono.agente) === compacto(v.sigla);
    const conjuntos = [...fontes.conjuntos.donos].filter(([, dono]) => ehDela(dono));
    const municipios = new Set<number>();
    for (const [conjunto] of conjuntos) for (const ibge of municipiosDoConjunto.get(conjunto) ?? []) municipios.add(ibge);
    let comOutraRecente = 0;
    for (const ibge of municipios) {
      const outros = [...(conjuntosDoMunicipio.get(ibge) ?? [])].map((c) => fontes.conjuntos.donos.get(c));
      if (outros.some((dono) => dono !== undefined && !ehDela(dono) && dono.ano >= anoMaximo - 1)) comOutraRecente++;
    }
    const anos = conjuntos.map(([, dono]) => dono.ano);
    return {
      sigla: v.sigla,
      cnpj: v.cnpj,
      ultimoFim: v.ultimoFim,
      mesmoCnpjDeVigente: !porCnpj && v.cnpj !== undefined,
      conjuntosComoDono: conjuntos.length,
      ultimoAnoDosConjuntos: anos.length > 0 ? Math.max(...anos) : undefined,
      municipios: municipios.size,
      municipiosComConjuntoRecenteDeOutra: comOutraRecente,
    };
  });
}

/** V7 e portão (b): sucessora com mais de um valor na vigência não pode receber as cidades da antiga. */
function conferirValores(selecao: SelecaoDeTarifas, sucessoes: readonly Sucessao[]): Pick<DadosDoDiagnostico, "comMaisDeUmValor" | "sucessoras"> {
  const cnpjsSucessores = new Set(sucessoes.map((s) => s.cnpjSucessor));
  const sucessoras = [...new Map(sucessoes.map((s) => [s.cnpjSucessor, s.siglaSucessora]))].map(([cnpj, sigla]) => {
    const varios = selecao.comMaisDeUmValor.find((v) => v.cnpj === cnpj);
    const publicada = selecao.tarifas.some((t) => t.cnpj === cnpj);
    return { sigla, cnpj, valores: varios?.valores ?? (publicada ? 1 : 0) };
  });
  return {
    comMaisDeUmValor: selecao.comMaisDeUmValor.map((v) => ({ ...v, ehSucessora: v.cnpj !== undefined && cnpjsSucessores.has(v.cnpj) })),
    sucessoras,
  };
}

function agruparPorCnpj(agentes: AgenteDaTarifa[]): { cnpj: string; agentes: AgenteDaTarifa[] }[] {
  const grupos = new Map<string, AgenteDaTarifa[]>();
  for (const a of agentes) if (a.cnpj) grupos.set(a.cnpj, [...(grupos.get(a.cnpj) ?? []), a]);
  return [...grupos]
    .filter(([, lista]) => lista.length > 1)
    .map(([cnpj, lista]) => ({ cnpj, agentes: lista }))
    .sort((a, b) => a.cnpj.localeCompare(b.cnpj));
}

/** Lê `municipios/*.json` publicados: código IBGE → { UF, ids }. Ignora o que não tiver o formato esperado. */
export async function lerMunicipiosPublicados(pasta: string): Promise<Map<number, { uf: string; ids: string[] }>> {
  const mapa = new Map<number, { uf: string; ids: string[] }>();
  const nomes = await readdir(join(pasta, "municipios")).catch(() => []);
  for (const nome of nomes.filter((n) => /^[A-Z]{2}\.json$/.test(n)).sort()) {
    const bruto: unknown = JSON.parse(await readFile(join(pasta, "municipios", nome), "utf8"));
    if (typeof bruto !== "object" || bruto === null || !("municipios" in bruto) || !Array.isArray(bruto.municipios)) continue;
    const uf = nome.slice(0, 2);
    for (const m of bruto.municipios) {
      if (typeof m !== "object" || m === null || !("ibge" in m) || !("distribuidoras" in m)) continue;
      const { ibge, distribuidoras } = m;
      if (typeof ibge !== "number" || !Array.isArray(distribuidoras)) continue;
      mapa.set(ibge, { uf, ids: distribuidoras.filter((d): d is string => typeof d === "string") });
    }
  }
  return mapa;
}

function comparar(publicados: Map<number, { uf: string; ids: string[] }>, montagem: Montagem, idsVencidos: ReadonlySet<string>): ComparacaoComPublicados {
  const novos = new Map<number, string[]>();
  for (const arquivo of montagem.municipiosPorUF) for (const m of arquivo.municipios) novos.set(m.ibge, m.distribuidoras);
  const porUF = new Map<string, number>();
  let municipiosQueMudam = 0;
  let comEmpresaVencida = 0;
  let aindaComEmpresaVencida = 0;
  let ficamSemDistribuidora = 0;
  for (const [ibge, { uf, ids }] of publicados) {
    const depois = novos.get(ibge) ?? [];
    if (ids.join(",") !== depois.join(",")) {
      municipiosQueMudam++;
      porUF.set(uf, (porUF.get(uf) ?? 0) + 1);
    }
    if (ids.some((id) => idsVencidos.has(id))) {
      comEmpresaVencida++;
      if (depois.some((id) => idsVencidos.has(id))) aindaComEmpresaVencida++;
      if (depois.length === 0) ficamSemDistribuidora++;
    }
  }
  return {
    publicadosLidos: publicados.size,
    municipiosQueMudam,
    porUF: [...porUF].map(([uf, municipios]) => ({ uf, municipios })).sort((a, b) => a.uf.localeCompare(b.uf)),
    comEmpresaVencida,
    aindaComEmpresaVencida,
    ficamSemDistribuidora,
    cidades: CIDADES_CONFERIDAS.map((c) => ({ ...c, antes: publicados.get(c.ibge)?.ids, depois: novos.get(c.ibge) })),
  };
}

const contagens = (c: readonly { sigla: string; municipios: number }[]) => c.map((x) => `${x.sigla} (${x.municipios})`).join(", ");
const lista = (ids: readonly string[] | undefined) => (ids === undefined ? "(não está no arquivo)" : ids.length === 0 ? "(nenhuma)" : ids.join(", "));
const linhaDeTabela = (celulas: readonly (string | number | undefined)[]) => `| ${celulas.map((c) => celulaMarkdown(c === undefined ? "—" : String(c))).join(" | ")} |`;

/** Resumo em Markdown para o `$GITHUB_STEP_SUMMARY` e para o log. Todo texto de fora passa por `celulaMarkdown` (R2). */
export function escreverMarkdown(d: DadosDoDiagnostico): string {
  const saida: string[] = [];
  const anoMaximo = d.anoMaisRecenteDosConjuntos;
  saida.push(`## Diagnóstico dos dados (HIS-111), ${d.hoje}`, "", "Nada foi gravado: este job só lê.", "");

  saida.push("### Portão do passo 0", "");
  // Renomeação de mesmo CNPJ (RGE SUL) não entra: os conjuntos dela são da mesma empresa, e o D1 resolve.
  const comConjunto = d.vencidas.filter((v) => !v.mesmoCnpjDeVigente && v.ultimoAnoDosConjuntos !== undefined);
  const recentes = comConjunto.filter((v) => (v.ultimoAnoDosConjuntos ?? 0) >= anoMaximo - 1);
  saida.push(
    `- (a) C2: ${comConjunto.length} empresas vencidas (CNPJ só delas) ainda são donas de conjunto; ` +
      (recentes.length === 0
        ? `todas pararam antes de ${anoMaximo - 1} (ano máximo ${anoMaximo}). **C2 confirmada.**`
        : `reportaram em ${anoMaximo - 1} ou depois: ${celulaMarkdown(recentes.map((v) => `${v.sigla} (${v.ultimoAnoDosConjuntos})`).join(", "), LIMITE_LISTA)}. ` +
          "**C2 não confirmada para essas: o backend revê o D3.**"),
  );
  const sucessorasRuins = d.sucessoras.filter((s) => s.valores !== 1);
  saida.push(
    `- (b) V7: ${d.sucessoras.length} sucessoras no sucessoes.json; ` +
      (sucessorasRuins.length === 0
        ? "todas com um só valor B1 na vigência. **As linhas ENF e EBO entram.**"
        : `com problema: ${celulaMarkdown(sucessorasRuins.map((s) => `${s.sigla} (${s.valores === 0 ? "sem tarifa" : `${s.valores} valores`})`).join(", "), LIMITE_LISTA)}. ` +
          "**Essas linhas saem do sucessoes.json e voltam ao dominio-energia.**"),
  );
  saida.push(`- (c) CNPJs com mais de uma sigla: ${d.cnpjsComVariasSiglas.map((g) => celulaMarkdown(`${g.cnpj} (${g.agentes.map((a) => a.sigla).join(", ")})`, LIMITE_LISTA)).join("; ") || "nenhum"}.`);
  const mantidos = d.relatorio.vinculosExtintosMantidos;
  saida.push(
    `- (d) D3: ${mantidos.reduce((t, c) => t + c.municipios, 0)} cidades em que o vínculo extinto é o único (fica, com aviso)` +
      `${mantidos.length > 0 ? `: ${celulaMarkdown(contagens(mantidos), LIMITE_LISTA)}` : ""}; ` +
      `${d.relatorio.vinculosExtintosDescartados.reduce((t, c) => t + c.municipios, 0)} vínculos extintos saem porque a cidade tem outro recente.`,
  );
  saida.push("");

  saida.push("### Empresas com tarifa vencida", "");
  saida.push(linhaDeTabela(["Sigla", "CNPJ", "Fim da vigência", "Mesmo CNPJ de vigente", "Conjuntos (dona)", `Último ano (máx. ${anoMaximo})`, "Municípios", "Com conjunto recente de outra"]));
  saida.push("| --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const v of d.vencidas) saida.push(linhaDeTabela([v.sigla, v.cnpj, v.ultimoFim, v.mesmoCnpjDeVigente ? "sim" : "não", v.conjuntosComoDono, v.ultimoAnoDosConjuntos, v.municipios, v.municipiosComConjuntoRecenteDeOutra]));
  saida.push("");

  saida.push("### CNPJ com mais de uma sigla", "");
  saida.push(linhaDeTabela(["CNPJ", "Sigla", "Última vigência", "Vigente hoje"]));
  saida.push("| --- | --- | --- | --- |");
  for (const g of d.cnpjsComVariasSiglas) for (const a of g.agentes) saida.push(linhaDeTabela([g.cnpj, a.sigla, `${a.ultimoInicio} a ${a.ultimoFim ?? "?"}`, a.vigente ? "sim" : "não"]));
  saida.push("");

  saida.push("### Mais de um valor B1 na vigência (V7)", "");
  saida.push(linhaDeTabela(["Sigla", "CNPJ", "Valores", "Sucessora no sucessoes.json"]));
  saida.push("| --- | --- | --- | --- |");
  for (const v of d.comMaisDeUmValor) saida.push(linhaDeTabela([v.sigla, v.cnpj, v.valores, v.ehSucessora ? "**sim**" : "não"]));
  if (d.comMaisDeUmValor.length === 0) saida.push(linhaDeTabela(["nenhuma", "", "", ""]));
  saida.push("");

  saida.push("### Montagem da branch", "");
  const r = d.relatorio;
  saida.push(`- Distribuidoras: ${r.distribuidoras}; municípios sem distribuidora: ${r.municipiosSemDistribuidora}; agentes sem tarifa: ${celulaMarkdown(r.agentesSemTarifa.join(", ")) || "nenhum"}.`);
  saida.push(`- Renomeações por CNPJ (D1): ${celulaMarkdown(r.renomeacoesPorCnpj.map((x) => `${x.de} → ${x.para} (${x.municipios})`).join(", "), LIMITE_LISTA) || "nenhuma"}.`);
  saida.push(`- Sucessões aplicadas (D2): ${celulaMarkdown(r.sucessoesAplicadas.map((x) => `${x.de} → ${x.para} (${x.municipios})`).join(", "), LIMITE_LISTA) || "nenhuma"}.`);
  saida.push(`- Vínculos extintos descartados (D3): ${celulaMarkdown(contagens(r.vinculosExtintosDescartados), LIMITE_LISTA) || "nenhum"}.`);
  saida.push(`- Tarifas descartadas por vencimento (D4): ${celulaMarkdown(r.tarifasDescartadasPorVencimento.map((t) => `${t.sigla} (${t.fimVigencia})`).join(", "), LIMITE_LISTA) || "nenhuma"}.`);
  saida.push(`- Tarifas vencidas em uso, até 6 meses (aviso): ${celulaMarkdown(r.tarifasVencidasEmUso.map((t) => `${t.sigla} (${t.fimVigencia})`).join(", "), LIMITE_LISTA) || "nenhuma"}.`);
  saida.push(`- Sucessoras candidatas (só informação): ${celulaMarkdown(r.sucessorasCandidatas.map((c) => `${c.de} → ${c.candidatas.join("/")}`).join(", "), LIMITE_LISTA) || "nenhuma"}.`);
  saida.push(`- substituidas: ${celulaMarkdown(Object.entries(d.substituidas).map(([de, para]) => `${de} → ${para}`).join(", "), LIMITE_LISTA) || "vazio"}.`);
  saida.push(
    `- **Coerência (não passa com --forcar; critério 3):** ${d.errosDaCoerencia.length === 0 ? "ok" : d.errosDaCoerencia.map((e) => celulaMarkdown(e, LIMITE_LISTA)).join(" / ")}`,
  );
  if (d.avisosDasSucessoes.length > 0) saida.push(`- Avisos do sucessoes.json: ${d.avisosDasSucessoes.map((e) => celulaMarkdown(e, LIMITE_LISTA)).join(" / ")}`);
  saida.push(`- Validação (passa com --forcar): ${d.errosDaValidacao.length === 0 ? "ok" : d.errosDaValidacao.map((e) => celulaMarkdown(e, LIMITE_LISTA)).join(" / ")}`);
  saida.push("");

  const c = d.comparacao;
  saida.push("### Comparação com os arquivos publicados", "");
  saida.push(`- Municípios lidos: ${c.publicadosLidos}; mudam: **${c.municipiosQueMudam}** (${c.porUF.map((u) => `${u.uf} ${u.municipios}`).join(", ") || "nenhum"}).`);
  saida.push(`- Critério 2: ${c.comEmpresaVencida} municípios tinham empresa vencida; ainda com uma: **${c.aindaComEmpresaVencida}**; ficam sem distribuidora: **${c.ficamSemDistribuidora}**.`);
  saida.push("", linhaDeTabela(["Cidade", "Esperada em 1º", "Antes", "Depois", "Confere"]), "| --- | --- | --- | --- | --- |");
  for (const cidade of c.cidades) {
    const confere = cidade.esperada === undefined ? "ver ordem" : cidade.depois?.[0] === cidade.esperada ? "sim" : "**não**";
    saida.push(linhaDeTabela([cidade.nome, cidade.esperada, lista(cidade.antes), lista(cidade.depois), confere]));
  }
  saida.push("");
  return saida.join("\n");
}
