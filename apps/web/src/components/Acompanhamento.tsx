"use client";

import { competenciaAtual, formatarCompetencia, formatarKwh, formatarReais, historicoContas, periodosDeLeitura, type ContaMensal, type LeituraRelogio } from "@ee/core";
import { Gauge, Pencil, Plus, Receipt } from "lucide-react";
import { useState } from "react";
import { useCasa } from "@/aplicacao/casa";
import { Barras } from "@/ui/Barras";
import { Aviso } from "@/ui/Aviso";
import { Botao } from "@/ui/Botao";
import { Campo } from "@/ui/Campo";
import { Entrada } from "@/ui/Entrada";
import { Folha } from "@/ui/Folha";
import { Pilulas } from "@/ui/Pilulas";

const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const mesCurto = (competencia: string) => {
  const [ano, mes] = competencia.split("-").map(Number);
  return `${MESES_CURTOS[(mes ?? 1) - 1]}${ano && ano !== new Date().getFullYear() ? `/${String(ano).slice(2)}` : ""}`;
};
const dataCurta = (iso: string) => {
  const [, mes, dia] = iso.split("-").map(Number);
  return `${dia}/${String(mes).padStart(2, "0")}`;
};
const hojeISO = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
const numero = (t: string) => Number(t.replace(/\./g, "").replace(",", "."));

/**
 * Acompanhamento mês a mês (contas de luz) e dia a dia (leituras do relógio).
 * Compara o consumo real com a estimativa feita a partir dos aparelhos cadastrados.
 */
export function Acompanhamento({ estimativaKwhMes }: { estimativaKwhMes: number }) {
  const [aba, setAba] = useState<"contas" | "relogio">("contas");
  return (
    <section aria-labelledby="titulo-acompanhamento">
      <h2 id="titulo-acompanhamento" className="text-2xl font-extrabold tracking-tight">
        Mês a mês
      </h2>
      <p className="mt-1 max-w-[56ch] text-tinta-suave">Anote suas contas de luz ou o número do relógio de luz para ver como o consumo real se compara com a estimativa.</p>
      <div className="mt-4">
        <Pilulas
          rotulo="Tipo de registro"
          opcoes={[
            { valor: "contas", rotulo: "Contas de luz" },
            { valor: "relogio", rotulo: "Relógio de luz" },
          ]}
          valor={aba}
          aoMudar={setAba}
        />
      </div>
      <div className="mt-5 rounded-[var(--radius-cartao)] bg-papel p-4 sm:p-6">{aba === "contas" ? <Contas estimativaKwhMes={estimativaKwhMes} /> : <Relogio estimativaKwhDia={estimativaKwhMes / 30} />}</div>
    </section>
  );
}

function Contas({ estimativaKwhMes }: { estimativaKwhMes: number }) {
  const contas = useCasa((s) => s.contas);
  const salvar = useCasa((s) => s.salvarConta);
  const remover = useCasa((s) => s.removerConta);
  const [editando, setEditando] = useState<{ id?: string; competencia: string; kwh: string; valor: string }>();
  const historico = historicoContas(contas);
  const ultimas = historico.slice(-12);

  const abrirNova = () => setEditando({ competencia: competenciaAtual(), kwh: "", valor: "" });

  return (
    <>
      {historico.length === 0 ? (
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Receipt className="size-10 shrink-0 text-energia" aria-hidden />
          <p className="flex-1">Ainda não há contas anotadas. Pegue a última conta de luz e anote o consumo (kWh) e o valor: leva 30 segundos.</p>
          <Botao onClick={abrirNova}>
            <Plus className="size-5" aria-hidden /> Anotar conta
          </Botao>
        </div>
      ) : (
        <>
          <Barras
            rotulo="Consumo das contas de luz por mês"
            unidade="kWh por mês"
            barras={ultimas.map((c) => ({ id: c.id, rotulo: mesCurto(c.competencia), valor: c.kwh, detalhe: `${formatarCompetencia(c.competencia)}: ${formatarKwh(c.kwh)}, ${formatarReais(c.valor)} (${formatarReais(c.precoKwh)} por kWh)` }))}
            referencia={estimativaKwhMes > 0 ? { valor: estimativaKwhMes, rotulo: `Estimativa: ${formatarKwh(estimativaKwhMes)}` } : undefined}
          />
          <ComparacaoConta ultima={historico.at(-1)!} anterior={historico.at(-2)} estimativaKwhMes={estimativaKwhMes} />
          <ul className="mt-5 divide-y divide-linha border-t border-linha">
            {[...historico].reverse().map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-3">
                <span className="flex-1 font-bold capitalize">{formatarCompetencia(c.competencia)}</span>
                <span className="numeros text-right">
                  <span className="block font-extrabold">{formatarReais(c.valor)}</span>
                  <span className="block text-[0.9rem] text-tinta-suave">{formatarKwh(c.kwh)}</span>
                </span>
                <button
                  type="button"
                  aria-label={`Editar conta de ${formatarCompetencia(c.competencia)}`}
                  onClick={() => setEditando({ id: c.id, competencia: c.competencia, kwh: String(c.kwh).replace(".", ","), valor: c.valor.toFixed(2).replace(".", ",") })}
                  className="grid size-11 place-items-center rounded-full text-tinta-suave hover:bg-fundo"
                >
                  <Pencil className="size-5" />
                </button>
              </li>
            ))}
          </ul>
          <Botao variante="secundario" className="mt-4" onClick={abrirNova}>
            <Plus className="size-5" aria-hidden /> Anotar outra conta
          </Botao>
        </>
      )}

      <Folha
        aberta={Boolean(editando)}
        aoFechar={() => setEditando(undefined)}
        titulo={editando?.id ? "Editar conta" : "Anotar conta de luz"}
        rodape={
          editando && (
            <div className="flex flex-col gap-3">
              <Botao
                largo
                disabled={!editando.competencia || !(numero(editando.kwh) > 0) || !(numero(editando.valor) > 0)}
                onClick={() => {
                  salvar({ id: editando.id, competencia: editando.competencia, kwh: numero(editando.kwh), valor: numero(editando.valor) });
                  setEditando(undefined);
                }}
              >
                Salvar conta
              </Botao>
              {editando.id && (
                <Botao
                  largo
                  variante="perigo"
                  onClick={() => {
                    remover(editando.id!);
                    setEditando(undefined);
                  }}
                >
                  Apagar esta conta
                </Botao>
              )}
            </div>
          )
        }
      >
        {editando && (
          <div className="space-y-5">
            <Campo rotulo="Mês da conta" id="conta-mes" ajuda="O mês de referência que aparece na conta.">
              <input id="conta-mes" type="month" value={editando.competencia} max={competenciaAtual()} onChange={(e) => setEditando({ ...editando, competencia: e.target.value })} className="min-h-12 w-full rounded-[var(--radius-controle)] border-2 border-linha bg-papel px-4 text-lg font-bold" />
            </Campo>
            <Campo rotulo="Consumo" id="conta-kwh-m" ajuda="“Consumo (kWh)” ou “kWh faturado”.">
              <Entrada id="conta-kwh-m" inputMode="decimal" sufixo="kWh" placeholder="Ex.: 150" value={editando.kwh} onChange={(e) => setEditando({ ...editando, kwh: e.target.value.replace(/[^\d,.]/g, "") })} />
            </Campo>
            <Campo rotulo="Valor total" id="conta-valor-m">
              <Entrada id="conta-valor-m" inputMode="decimal" prefixo="R$" placeholder="Ex.: 135,90" value={editando.valor} onChange={(e) => setEditando({ ...editando, valor: e.target.value.replace(/[^\d,.]/g, "") })} />
            </Campo>
          </div>
        )}
      </Folha>
    </>
  );
}

function ComparacaoConta({ ultima, anterior, estimativaKwhMes }: { ultima: ContaMensal; anterior?: ContaMensal; estimativaKwhMes: number }) {
  const frases: string[] = [];
  if (anterior) {
    const dif = ultima.kwh - anterior.kwh;
    if (Math.abs(dif) >= 1) frases.push(`Em ${formatarCompetencia(ultima.competencia)} você gastou ${formatarKwh(Math.abs(dif))} ${dif > 0 ? "a mais" : "a menos"} que no mês anterior.`);
  }
  if (estimativaKwhMes > 0) {
    const razao = ultima.kwh / estimativaKwhMes;
    if (razao > 1.25) frases.push("A conta real está bem acima da estimativa: talvez algum aparelho fique ligado mais tempo do que o cadastrado. Vale revisar o tempo de uso do chuveiro e do ar-condicionado.");
    else if (razao < 0.75) frases.push("A conta real está abaixo da estimativa: o tempo de uso de algum aparelho pode estar maior que o real.");
    else frases.push("A estimativa está perto da conta real. Ótimo: as dicas estão calculadas com números confiáveis.");
  }
  if (frases.length === 0) return null;
  return (
    <div className="mt-4">
      <Aviso>{frases.join(" ")}</Aviso>
    </div>
  );
}

function Relogio({ estimativaKwhDia }: { estimativaKwhDia: number }) {
  const leituras = useCasa((s) => s.leituras);
  const salvar = useCasa((s) => s.salvarLeitura);
  const remover = useCasa((s) => s.removerLeitura);
  const [editando, setEditando] = useState<{ id?: string; data: string; valor: string }>();
  const { periodos, ignoradas } = periodosDeLeitura(leituras);
  const ordenadas = [...leituras].sort((a, b) => b.data.localeCompare(a.data));
  const ultimo = periodos.at(-1);

  return (
    <>
      {leituras.length < 2 ? (
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Gauge className="size-10 shrink-0 text-energia" aria-hidden />
          <div className="flex-1 space-y-1">
            <p>Anote o número do relógio de luz hoje e de novo daqui a alguns dias. A diferença mostra quanto a casa gastou de verdade por dia.</p>
            {leituras.length === 1 && <p className="font-bold">Falta mais uma leitura para calcular.</p>}
          </div>
          <Botao onClick={() => setEditando({ data: hojeISO(), valor: "" })}>
            <Plus className="size-5" aria-hidden /> Anotar leitura
          </Botao>
        </div>
      ) : (
        <>
          <Barras
            rotulo="Consumo por dia entre as leituras do relógio"
            unidade="kWh por dia"
            barras={periodos.slice(-12).map((p) => ({
              id: p.ate.id,
              rotulo: dataCurta(p.ate.data),
              valor: p.kwhPorDia,
              detalhe: `De ${dataCurta(p.de.data)} a ${dataCurta(p.ate.data)}: ${formatarKwh(p.kwh)} em ${p.dias} ${p.dias === 1 ? "dia" : "dias"}, ${formatarKwh(p.kwhPorDia)} por dia`,
            }))}
            referencia={estimativaKwhDia > 0 ? { valor: estimativaKwhDia, rotulo: `Estimativa: ${formatarKwh(estimativaKwhDia)} por dia` } : undefined}
          />
          {ultimo && (
            <div className="mt-4">
              <Aviso>
                No último período a casa gastou {formatarKwh(ultimo.kwhPorDia)} por dia. Nesse ritmo, o mês fecha em cerca de {formatarKwh(ultimo.projecaoMes)}.
              </Aviso>
            </div>
          )}
          <Botao variante="secundario" className="mt-4" onClick={() => setEditando({ data: hojeISO(), valor: "" })}>
            <Plus className="size-5" aria-hidden /> Anotar leitura de hoje
          </Botao>
        </>
      )}
      {ignoradas.length > 0 && (
        <div className="mt-4">
          <Aviso tom="faisca">Algumas leituras ficaram menores que a anterior e foram ignoradas. Confira se o número foi digitado certo.</Aviso>
        </div>
      )}
      {ordenadas.length > 0 && (
        <ul className="mt-5 divide-y divide-linha border-t border-linha">
          {ordenadas.map((l) => (
            <li key={l.id} className="flex items-center gap-3 py-3">
              <span className="flex-1 font-bold">{new Date(`${l.data}T12:00:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}</span>
              <span className="numeros font-extrabold">{l.valorKwh.toLocaleString("pt-BR")}</span>
              <button type="button" aria-label="Editar leitura" onClick={() => setEditando({ id: l.id, data: l.data, valor: String(l.valorKwh) })} className="grid size-11 place-items-center rounded-full text-tinta-suave hover:bg-fundo">
                <Pencil className="size-5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Folha
        aberta={Boolean(editando)}
        aoFechar={() => setEditando(undefined)}
        titulo={editando?.id ? "Editar leitura" : "Anotar leitura do relógio"}
        rodape={
          editando && (
            <div className="flex flex-col gap-3">
              <Botao
                largo
                disabled={!editando.data || !(numero(editando.valor) >= 0) || editando.valor === ""}
                onClick={() => {
                  salvar({ id: editando.id, data: editando.data, valorKwh: numero(editando.valor) });
                  setEditando(undefined);
                }}
              >
                Salvar leitura
              </Botao>
              {editando.id && (
                <Botao
                  largo
                  variante="perigo"
                  onClick={() => {
                    remover(editando.id!);
                    setEditando(undefined);
                  }}
                >
                  Apagar esta leitura
                </Botao>
              )}
            </div>
          )
        }
      >
        {editando && (
          <div className="space-y-5">
            <Campo rotulo="Dia da leitura" id="leitura-data">
              <input id="leitura-data" type="date" value={editando.data} max={hojeISO()} onChange={(e) => setEditando({ ...editando, data: e.target.value })} className="min-h-12 w-full rounded-[var(--radius-controle)] border-2 border-linha bg-papel px-4 text-lg font-bold" />
            </Campo>
            <Campo rotulo="Número do relógio" id="leitura-valor" ajuda="Anote os números pretos do relógio de luz, da esquerda para a direita, sem os vermelhos (se houver).">
              <Entrada id="leitura-valor" inputMode="numeric" sufixo="kWh" placeholder="Ex.: 12345" value={editando.valor} onChange={(e) => setEditando({ ...editando, valor: e.target.value.replace(/[^\d]/g, "") })} />
            </Campo>
          </div>
        )}
      </Folha>
    </>
  );
}

export type { LeituraRelogio };
