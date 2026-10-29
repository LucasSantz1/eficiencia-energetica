import type { ArquivoMunicipios, ArquivoTarifas, BandeiraMes, Distribuidora, Estado, Municipio } from "@ee/core";
import type { VinculoMunicipio } from "./aneel/municipios";
import type { TarifaVigente } from "./aneel/tarifas";
import { normalizar, slug } from "./util";

export interface Localidades {
  estados: { uf: string; nome: string }[];
  municipios: { ibge: number; nome: string; uf: string }[];
}

export interface Relatorio {
  distribuidoras: number;
  distribuidorasSemMunicipio: string[];
  agentesSemTarifa: string[];
  municipios: number;
  municipiosSemDistribuidora: number;
  municipiosComVariasDistribuidoras: number;
}

export interface Montagem {
  tarifas: ArquivoTarifas;
  municipiosPorUF: ArquivoMunicipios[];
  relatorio: Relatorio;
}

const compacto = (t: string | undefined) => normalizar(t).replace(/[^a-z0-9]/g, "");

/** Junta tarifas, bandeiras, vínculos município→distribuidora e a lista do IBGE nos arquivos finais. */
export function montarArquivos(entrada: {
  tarifas: TarifaVigente[];
  bandeiras: BandeiraMes[];
  vinculos: Map<number, VinculoMunicipio[]>;
  localidades: Localidades;
  geradoEm: string;
  origem: "aneel" | "exemplo";
  fontes: string[];
}): Montagem {
  const { bandeiras, vinculos, localidades, geradoEm, origem, fontes } = entrada;

  // Siglas que viram o mesmo id (ex.: "CPFL Santa Cruz" e "CPFL SANTA CRUZ"): fica a vigência mais recente.
  const unicas = new Map<string, TarifaVigente>();
  for (const t of entrada.tarifas) {
    const atual = unicas.get(slug(t.sigla));
    if (!atual || t.inicioVigencia > atual.inicioVigencia) unicas.set(slug(t.sigla), t);
  }
  const tarifas = [...unicas.values()];

  const porCnpj = new Map(tarifas.filter((t) => t.cnpj).map((t) => [t.cnpj!, t]));
  const porSigla = new Map(tarifas.map((t) => [compacto(t.sigla), t]));
  for (const t of entrada.tarifas) if (!porSigla.has(compacto(t.sigla))) porSigla.set(compacto(t.sigla), unicas.get(slug(t.sigla))!);
  const agentesSemTarifa = new Set<string>();

  const acharTarifa = (v: VinculoMunicipio): TarifaVigente | undefined => {
    if (v.cnpj && porCnpj.has(v.cnpj)) return porCnpj.get(v.cnpj);
    const s = compacto(v.agente);
    if (s && porSigla.has(s)) return porSigla.get(s);
    agentesSemTarifa.add(v.agente ?? v.cnpj ?? "?");
    return undefined;
  };

  // Vínculos podem vir com código IBGE de 7 ou de 6 dígitos.
  const vinculosDe = (ibge: number) => vinculos.get(ibge) ?? vinculos.get(Math.floor(ibge / 10)) ?? [];

  const ufsPorSigla = new Map<string, Set<string>>();
  const municipios: Municipio[] = localidades.municipios.map((m) => {
    const ids = new Set<string>();
    for (const v of vinculosDe(m.ibge)) {
      const t = acharTarifa(v);
      if (!t) continue;
      ids.add(slug(t.sigla));
      const ufs = ufsPorSigla.get(slug(t.sigla)) ?? new Set<string>();
      ufs.add(m.uf);
      ufsPorSigla.set(slug(t.sigla), ufs);
    }
    return { ibge: m.ibge, nome: m.nome, uf: m.uf, distribuidoras: [...ids] };
  });

  // Quando a cidade tem mais de uma distribuidora, a que atende mais cidades (a concessionária principal)
  // aparece primeiro; cooperativas locais vêm depois.
  const abrangencia = new Map<string, number>();
  for (const m of municipios) for (const id of m.distribuidoras) abrangencia.set(id, (abrangencia.get(id) ?? 0) + 1);
  for (const m of municipios) m.distribuidoras.sort((a, b) => (abrangencia.get(b) ?? 0) - (abrangencia.get(a) ?? 0) || a.localeCompare(b));

  const distribuidoras: Distribuidora[] = tarifas.map((t) => ({
    id: slug(t.sigla),
    sigla: t.sigla,
    cnpj: t.cnpj,
    ufs: [...(ufsPorSigla.get(slug(t.sigla)) ?? [])].sort(),
    teKwh: arredondar(t.teKwh),
    tusdKwh: arredondar(t.tusdKwh),
    tarifaKwh: arredondar(t.teKwh + t.tusdKwh),
    inicioVigencia: t.inicioVigencia,
    fimVigencia: t.fimVigencia,
    resolucao: t.resolucao,
  }));

  const estados: Estado[] = localidades.estados.map((e) => ({
    uf: e.uf,
    nome: e.nome,
    distribuidoras: distribuidoras.filter((d) => d.ufs.includes(e.uf)).map((d) => d.id).sort(),
  }));

  const municipiosPorUF: ArquivoMunicipios[] = localidades.estados.map((e) => ({
    uf: e.uf,
    geradoEm,
    origem,
    municipios: municipios.filter((m) => m.uf === e.uf).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
  }));

  return {
    tarifas: { geradoEm, origem, fontes, distribuidoras, bandeiras, estados },
    municipiosPorUF,
    relatorio: {
      distribuidoras: distribuidoras.length,
      distribuidorasSemMunicipio: distribuidoras.filter((d) => d.ufs.length === 0).map((d) => d.sigla),
      agentesSemTarifa: [...agentesSemTarifa].sort(),
      municipios: municipios.length,
      municipiosSemDistribuidora: municipios.filter((m) => m.distribuidoras.length === 0).length,
      municipiosComVariasDistribuidoras: municipios.filter((m) => m.distribuidoras.length > 1).length,
    },
  };
}

/** Confere se os dados fazem sentido antes de publicar — evita trocar dados bons por dados quebrados. */
export function validar(m: Montagem, hoje: string): string[] {
  const erros: string[] = [];
  const r = m.relatorio;
  if (r.distribuidoras < 40) erros.push(`Poucas distribuidoras com tarifa (${r.distribuidoras}); o esperado é mais de 50.`);
  if (r.municipios < 5000) erros.push(`Poucos municípios (${r.municipios}).`);
  if (r.municipiosSemDistribuidora > r.municipios * 0.05) erros.push(`${r.municipiosSemDistribuidora} municípios ficaram sem distribuidora (mais de 5%).`);
  const ufsSemDistribuidora = m.tarifas.estados.filter((e) => e.distribuidoras.length === 0).map((e) => e.uf);
  if (ufsSemDistribuidora.length > 0) erros.push(`Estados sem distribuidora: ${ufsSemDistribuidora.join(", ")}.`);
  const fora = m.tarifas.distribuidoras.filter((d) => d.tarifaKwh < 0.3 || d.tarifaKwh > 2);
  if (fora.length > 0) erros.push(`Tarifas fora da faixa R$ 0,30–2,00/kWh: ${fora.map((d) => `${d.sigla}=${d.tarifaKwh}`).join(", ")}.`);
  const ultima = m.tarifas.bandeiras.at(-1)?.competencia;
  const limite = mesesAntes(hoje.slice(0, 7), 3);
  if (!ultima || ultima < limite) erros.push(`Bandeira mais recente (${ultima ?? "nenhuma"}) é anterior a ${limite}.`);
  return erros;
}

function mesesAntes(competencia: string, meses: number): string {
  const [a, m] = competencia.split("-").map(Number) as [number, number];
  const d = new Date(Date.UTC(a, m - 1 - meses, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function arredondar(n: number): number {
  return Number(n.toFixed(6));
}
