"use client";

import { consumoMensalKwh, formatarKwh, formatarReais, formatarTempo, itemDoCatalogo, TEMPOS_RAPIDOS, type Aparelho, type PrecoKwh } from "@ee/core";
import { CircleHelp } from "lucide-react";
import { useEffect, useState } from "react";
import { useCasa } from "@/lib/store";
import { Botao, Campo, Contador, Entrada, Folha, Pilulas } from "./ui";

const DIAS = [
  { valor: 7, rotulo: "Todo dia" },
  { valor: 5, rotulo: "5 dias" },
  { valor: 3, rotulo: "3 dias" },
  { valor: 2, rotulo: "2 dias" },
  { valor: 1, rotulo: "1 dia" },
];

type Rascunho = Omit<Aparelho, "id"> & { id?: string };

/**
 * Formulário para criar ou ajustar um aparelho. Mostra na hora quanto ele custa por mês,
 * para a pessoa ver o efeito de cada mudança.
 */
export function EditorAparelho({ aparelho, aberto, aoFechar, preco }: { aparelho: Rascunho | undefined; aberto: boolean; aoFechar: () => void; preco: PrecoKwh }) {
  const comodos = useCasa((s) => s.comodos);
  const adicionarAparelho = useCasa((s) => s.adicionarAparelho);
  const atualizarAparelho = useCasa((s) => s.atualizarAparelho);
  const removerAparelho = useCasa((s) => s.removerAparelho);
  const [r, setR] = useState<Rascunho | undefined>(aparelho);
  const [tempoLivre, setTempoLivre] = useState(false);
  const [semEtiqueta, setSemEtiqueta] = useState(false);
  const [confirmarRemocao, setConfirmarRemocao] = useState(false);

  useEffect(() => {
    setR(aparelho);
    setTempoLivre(aparelho ? !TEMPOS_RAPIDOS.some((t) => t.minutos === aparelho.minutosPorDia) : false);
    setSemEtiqueta(false);
    setConfirmarRemocao(false);
  }, [aparelho]);

  if (!r) return <Folha aberta={false} aoFechar={aoFechar} titulo="" children={null} />;

  const item = itemDoCatalogo(r.catalogoId);
  const modo = item?.modo ?? "tempo";
  const mudar = (p: Partial<Rascunho>) => setR((atual) => (atual ? { ...atual, ...p } : atual));
  const kwh = consumoMensalKwh(r);
  const valor = kwh * preco.valor;

  const salvar = () => {
    const { id, ...dados } = r;
    const limpo = { ...dados, nome: dados.nome.trim() || item?.nome || "Aparelho" };
    if (id) atualizarAparelho(id, limpo);
    else adicionarAparelho(limpo);
    aoFechar();
  };

  const horas = Math.floor(r.minutosPorDia / 60);
  const minutos = r.minutosPorDia % 60;

  return (
    <Folha
      aberta={aberto}
      aoFechar={aoFechar}
      titulo={r.id ? "Ajustar aparelho" : "Novo aparelho"}
      rodape={
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3" aria-live="polite">
            <span className="text-tinta-suave">Custa por mês</span>
            <span className="text-right">
              <span className="numeros text-2xl font-extrabold">{formatarReais(valor)}</span>
              <span className="numeros ml-2 text-tinta-suave">{formatarKwh(kwh)}</span>
            </span>
          </div>
          <Botao largo onClick={salvar}>
            {r.id ? "Salvar mudanças" : "Adicionar aparelho"}
          </Botao>
        </div>
      }
    >
      <div className="space-y-7">
        <Campo rotulo="Nome" id="ap-nome">
          <Entrada id="ap-nome" className="font-bold" value={r.nome} onChange={(e) => mudar({ nome: e.target.value })} maxLength={60} />
        </Campo>

        {comodos.length > 1 && (
          <div className="space-y-2">
            <span className="block font-bold">Em qual cômodo?</span>
            <Pilulas rotulo="Cômodo" opcoes={comodos.map((c) => ({ valor: c.id, rotulo: c.nome }))} valor={r.comodoId} aoMudar={(comodoId) => mudar({ comodoId })} />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-bold">Quantidade</span>
          <Contador valor={r.quantidade} aoMudar={(quantidade) => mudar({ quantidade })} min={1} max={60} rotulo="quantidade" />
        </div>

        {modo === "etiqueta" && !semEtiqueta && (
          <Campo
            rotulo="Consumo na etiqueta"
            id="ap-etiqueta"
            ajuda={
              <>
                {item?.ondeEncontrar}{" "}
                <button type="button" className="font-bold text-energia underline" onClick={() => (setSemEtiqueta(true), mudar({ kwhMesInformado: item?.kwhMes }))}>
                  Não tenho a etiqueta
                </button>
              </>
            }
          >
            <Entrada
              id="ap-etiqueta"
              inputMode="decimal"
              sufixo="kWh/mês"
              value={r.kwhMesInformado ?? ""}
              onChange={(e) => {
                const n = Number(e.target.value.replace(",", "."));
                mudar({ kwhMesInformado: Number.isFinite(n) && n > 0 ? n : undefined });
              }}
            />
          </Campo>
        )}
        {modo === "etiqueta" && semEtiqueta && <p className="text-tinta-suave">Usando o consumo comum para esse tipo de aparelho: {formatarKwh(item?.kwhMes ?? 0)} por mês.</p>}

        {modo === "banho" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-bold">Banhos por dia</span>
              <Contador
                valor={r.banho?.banhosPorDia ?? 1}
                min={1}
                max={20}
                rotulo="banhos por dia"
                aoMudar={(banhosPorDia) => {
                  const banho = { banhosPorDia, minutosPorBanho: r.banho?.minutosPorBanho ?? 8 };
                  mudar({ banho, minutosPorDia: banho.banhosPorDia * banho.minutosPorBanho });
                }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-bold">Minutos por banho</span>
              <Contador
                valor={r.banho?.minutosPorBanho ?? 8}
                min={1}
                max={60}
                unidade="min"
                rotulo="minutos por banho"
                aoMudar={(minutosPorBanho) => {
                  const banho = { banhosPorDia: r.banho?.banhosPorDia ?? 1, minutosPorBanho };
                  mudar({ banho, minutosPorDia: banho.banhosPorDia * banho.minutosPorBanho });
                }}
              />
            </div>
          </>
        )}

        {modo === "tempo" && (
          <>
            <div className="space-y-3">
              <span className="block font-bold">Quanto tempo fica ligado por dia?</span>
              <Pilulas
                rotulo="Tempo por dia"
                opcoes={[...TEMPOS_RAPIDOS.map((t) => ({ valor: String(t.minutos), rotulo: t.rotulo })), { valor: "outro", rotulo: "Outro tempo" }]}
                valor={tempoLivre ? "outro" : String(r.minutosPorDia)}
                aoMudar={(v) => {
                  if (v === "outro") setTempoLivre(true);
                  else {
                    setTempoLivre(false);
                    mudar({ minutosPorDia: Number(v) });
                  }
                }}
              />
              {tempoLivre && (
                <div className="flex flex-wrap gap-4 rounded-[var(--radius-controle)] bg-fundo p-3">
                  <div className="space-y-1">
                    <span className="block text-[0.95rem] font-bold text-tinta-suave">Horas</span>
                    <Contador valor={horas} min={0} max={24} rotulo="horas" aoMudar={(h) => mudar({ minutosPorDia: Math.min(1440, h * 60 + (h === 24 ? 0 : minutos)) })} />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[0.95rem] font-bold text-tinta-suave">Minutos</span>
                    <Contador valor={minutos} min={0} max={55} passo={5} rotulo="minutos" aoMudar={(m) => mudar({ minutosPorDia: Math.min(1440, horas * 60 + m) })} />
                  </div>
                </div>
              )}
              <p className="text-[0.95rem] text-tinta-suave">Total: {formatarTempo(r.minutosPorDia)} por dia.</p>
            </div>

            <div className="space-y-3">
              <span className="block font-bold">Em quantos dias da semana?</span>
              <Pilulas rotulo="Dias por semana" opcoes={DIAS} valor={r.diasPorSemana} aoMudar={(diasPorSemana) => mudar({ diasPorSemana })} />
            </div>
          </>
        )}

        {modo !== "etiqueta" && (
          <Campo
            rotulo="Potência"
            id="ap-potencia"
            ajuda={
              <span className="flex gap-2">
                <CircleHelp className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  {item?.ondeEncontrar ?? "Procure o número seguido de W (watts) na etiqueta do aparelho."}
                  {item && item.id !== "outro" && ` O comum é entre ${item.faixaW[0].toLocaleString("pt-BR")} e ${item.faixaW[1].toLocaleString("pt-BR")} W.`}
                </span>
              </span>
            }
          >
            <Entrada
              id="ap-potencia"
              inputMode="numeric"
              sufixo="W"
              value={r.potenciaW || ""}
              onChange={(e) => mudar({ potenciaW: Math.min(30000, Number(e.target.value.replace(/\D/g, "")) || 0) })}
            />
          </Campo>
        )}

        {r.id && (
          <div className="border-t border-linha pt-5">
            {!confirmarRemocao ? (
              <Botao variante="perigo" onClick={() => setConfirmarRemocao(true)}>
                Remover este aparelho
              </Botao>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-bold">Remover {r.nome}?</span>
                <Botao
                  variante="perigo"
                  onClick={() => {
                    removerAparelho(r.id!);
                    aoFechar();
                  }}
                >
                  Sim, remover
                </Botao>
                <Botao variante="fantasma" onClick={() => setConfirmarRemocao(false)}>
                  Cancelar
                </Botao>
              </div>
            )}
          </div>
        )}
      </div>
    </Folha>
  );
}
