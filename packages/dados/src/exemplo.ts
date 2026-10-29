/**
 * Gera dados de EXEMPLO (fictícios) para desenvolver o site sem acesso à ANEEL.
 * O site mostra um aviso quando está usando estes dados.
 *
 *   pnpm dados:exemplo
 */
import type { BandeiraMes } from "@ee/core";
import type { VinculoMunicipio } from "./aneel/municipios";
import type { TarifaVigente } from "./aneel/tarifas";
import { escreverArquivos } from "./escrever";
import { carregarLocalidades } from "./ibge";
import { montarArquivos } from "./montar";
import { hojeISO } from "./util";

async function main() {
  const hoje = hojeISO();
  const { localidades } = await carregarLocalidades(false);

  const tarifas: TarifaVigente[] = [];
  const vinculos = new Map<number, VinculoMunicipio[]>();

  localidades.estados.forEach((estado, i) => {
    // SP ganha três distribuidoras fictícias para exercitar a escolha entre várias.
    const quantas = estado.uf === "SP" ? 3 : 1;
    const siglas = Array.from({ length: quantas }, (_, n) => `EXEMPLO-${estado.uf}${quantas > 1 ? `-${n + 1}` : ""}`);
    siglas.forEach((sigla, n) => {
      const total = 0.72 + ((i * 7 + n * 5) % 30) / 100;
      tarifas.push({ sigla, teKwh: total * 0.42, tusdKwh: total * 0.58, inicioVigencia: `${hoje.slice(0, 4)}-04-22`, resolucao: "Exemplo" });
    });
    localidades.municipios
      .filter((m) => m.uf === estado.uf)
      .forEach((m, idx) => {
        const lista: VinculoMunicipio[] = [{ ibge: m.ibge, agente: siglas[idx % siglas.length] }];
        // Algumas cidades de SP atendidas por duas distribuidoras.
        if (quantas > 1 && idx % 10 === 0) lista.push({ ibge: m.ibge, agente: siglas[(idx + 1) % siglas.length] });
        vinculos.set(m.ibge, lista);
      });
  });

  const [ano, mes] = hoje.split("-").map(Number) as [number, number];
  const sequencia: Omit<BandeiraMes, "competencia">[] = [
    { bandeira: "verde", nome: "Verde", adicionalKwh: 0 },
    { bandeira: "verde", nome: "Verde", adicionalKwh: 0 },
    { bandeira: "amarela", nome: "Amarela", adicionalKwh: 0.01885 },
    { bandeira: "vermelha-1", nome: "Vermelha patamar 1", adicionalKwh: 0.04463 },
    { bandeira: "amarela", nome: "Amarela", adicionalKwh: 0.01885 },
    { bandeira: "vermelha-1", nome: "Vermelha patamar 1", adicionalKwh: 0.04463 },
  ];
  const bandeiras: BandeiraMes[] = sequencia.map((b, i) => {
    const d = new Date(Date.UTC(ano, mes - 1 - (sequencia.length - 1 - i), 1));
    return { ...b, competencia: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}` };
  });

  const montagem = montarArquivos({
    tarifas,
    bandeiras,
    vinculos,
    localidades,
    geradoEm: new Date().toISOString(),
    origem: "exemplo",
    fontes: ["Dados fictícios gerados por pnpm dados:exemplo"],
  });
  const { escritos } = await escreverArquivos(montagem);
  console.log(`✓ Dados de exemplo gravados (${escritos.length} arquivos).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
