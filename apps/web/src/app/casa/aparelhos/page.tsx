"use client";

import { COMODOS_PADRAO, formatarDias, formatarKwh, formatarReais, formatarTempo, itemDoCatalogo, type Aparelho, type TipoComodo } from "@ee/core";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { EditorAparelho } from "@/components/EditorAparelho";
import { Icone } from "@/components/Icone";
import { SeletorCatalogo } from "@/components/SeletorCatalogo";
import { Botao, Campo, Entrada, Folha, Pilulas } from "@/components/ui";
import { useResumo } from "@/lib/resumo";
import { useCasa } from "@/lib/store";

type Rascunho = Omit<Aparelho, "id"> & { id?: string };

export default function Aparelhos() {
  const { resumo, preco, comodos } = useResumo();
  const adicionarComodo = useCasa((s) => s.adicionarComodo);
  const renomearComodo = useCasa((s) => s.renomearComodo);
  const removerComodo = useCasa((s) => s.removerComodo);

  const [comodoParaAdicionar, setComodoParaAdicionar] = useState<string>();
  const [seletorAberto, setSeletorAberto] = useState(false);
  const [rascunho, setRascunho] = useState<Rascunho>();
  const [novoComodoAberto, setNovoComodoAberto] = useState(false);
  const [comodoEditado, setComodoEditado] = useState<{ id: string; nome: string; confirmarRemocao?: boolean }>();

  const porComodo = useMemo(() => {
    const mapa = new Map<string, typeof resumo.aparelhos>();
    for (const item of resumo.aparelhos) {
      const lista = mapa.get(item.aparelho.comodoId) ?? [];
      lista.push(item);
      mapa.set(item.aparelho.comodoId, lista);
    }
    return mapa;
  }, [resumo.aparelhos]);

  const abrirSeletor = (comodoId?: string) => {
    setComodoParaAdicionar(comodoId);
    setSeletorAberto(true);
  };

  const escolherDoCatalogo = (catalogoId: string) => {
    const item = itemDoCatalogo(catalogoId)!;
    const comodoId = comodoParaAdicionar ?? comodos.find((c) => c.tipo === item.comodoSugerido)?.id ?? comodos[0]?.id ?? adicionarComodo(item.comodoSugerido).id;
    setSeletorAberto(false);
    setRascunho({
      catalogoId,
      comodoId,
      nome: item.id === "outro" ? "" : item.nome,
      quantidade: 1,
      potenciaW: item.potenciaW,
      minutosPorDia: item.minutosPorDia,
      diasPorSemana: item.diasPorSemana,
      kwhMesInformado: item.modo === "etiqueta" ? item.kwhMes : undefined,
      banho: item.banho ? { ...item.banho } : undefined,
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[2rem] leading-tight font-extrabold tracking-tight">Seus aparelhos</h1>
          <p className="mt-1 text-lg text-tinta-suave">Toque em um aparelho para ajustar o tempo de uso ou a potência.</p>
        </div>
        <Botao onClick={() => abrirSeletor()}>
          <Plus className="size-5" aria-hidden /> Adicionar aparelho
        </Botao>
      </div>

      <div className="mt-8 space-y-10">
        {comodos.map((comodo) => {
          const itens = porComodo.get(comodo.id) ?? [];
          const total = itens.reduce((s, i) => s + i.valorMes, 0);
          const icone = COMODOS_PADRAO.find((c) => c.tipo === comodo.tipo)?.icone;
          return (
            <section key={comodo.id} aria-labelledby={`comodo-${comodo.id}`}>
              <div className="flex items-center gap-3 border-b-2 border-tinta pb-2">
                <Icone nome={icone} className="size-6 text-tinta-suave" />
                <h2 id={`comodo-${comodo.id}`} className="flex-1 text-xl font-extrabold">
                  {comodo.nome}
                </h2>
                <span className="numeros font-bold text-tinta-suave">{formatarReais(total)}/mês</span>
                <button type="button" onClick={() => setComodoEditado({ id: comodo.id, nome: comodo.nome })} className="grid size-11 place-items-center rounded-full text-tinta-suave hover:bg-papel" aria-label={`Editar ${comodo.nome}`}>
                  <Pencil className="size-5" />
                </button>
              </div>
              {itens.length === 0 ? (
                <p className="py-4 text-tinta-suave">Nenhum aparelho neste cômodo ainda.</p>
              ) : (
                <ul className="divide-y divide-linha">
                  {itens.map(({ aparelho, valorMes, kwhMes }) => {
                    const item = itemDoCatalogo(aparelho.catalogoId);
                    const uso =
                      aparelho.kwhMesInformado !== undefined
                        ? "fica ligado o dia todo"
                        : aparelho.banho
                          ? `${aparelho.banho.banhosPorDia} ${aparelho.banho.banhosPorDia === 1 ? "banho" : "banhos"} de ${aparelho.banho.minutosPorBanho} min por dia`
                          : `${formatarTempo(aparelho.minutosPorDia)} por dia, ${formatarDias(aparelho.diasPorSemana)}`;
                    return (
                      <li key={aparelho.id}>
                        <button type="button" onClick={() => setRascunho(aparelho)} className="flex w-full items-center gap-4 py-4 text-left hover:bg-papel/60">
                          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-papel text-energia">
                            <Icone nome={item?.icone} className="size-6" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-bold">
                              {aparelho.quantidade > 1 && <span className="numeros">{aparelho.quantidade} × </span>}
                              {aparelho.nome}
                            </span>
                            <span className="block text-[0.95rem] text-tinta-suave">{uso}</span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="numeros block text-lg font-extrabold">{formatarReais(valorMes)}</span>
                            <span className="numeros block text-[0.9rem] text-tinta-suave">{formatarKwh(kwhMes)}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <button type="button" onClick={() => abrirSeletor(comodo.id)} className="mt-1 inline-flex min-h-11 items-center gap-2 rounded-full px-2 font-bold text-energia hover:bg-energia-claro">
                <Plus className="size-5" aria-hidden /> Adicionar em {comodo.nome}
              </button>
            </section>
          );
        })}
      </div>

      <div className="mt-10">
        <Botao variante="secundario" onClick={() => setNovoComodoAberto(true)}>
          <Plus className="size-5" aria-hidden /> Novo cômodo
        </Botao>
      </div>

      <SeletorCatalogo aberto={seletorAberto} aoFechar={() => setSeletorAberto(false)} aoEscolher={escolherDoCatalogo} />
      <EditorAparelho aparelho={rascunho} aberto={Boolean(rascunho)} aoFechar={() => setRascunho(undefined)} preco={preco} />

      <Folha aberta={novoComodoAberto} aoFechar={() => setNovoComodoAberto(false)} titulo="Novo cômodo">
        <ul className="grid grid-cols-2 gap-2">
          {COMODOS_PADRAO.map((c) => (
            <li key={c.tipo}>
              <button
                type="button"
                onClick={() => {
                  adicionarComodo(c.tipo as TipoComodo);
                  setNovoComodoAberto(false);
                }}
                className="flex min-h-20 w-full flex-col items-start justify-between gap-2 rounded-[var(--radius-controle)] border-2 border-linha p-3 font-bold hover:border-energia"
              >
                <Icone nome={c.icone} className="size-6 text-energia" />
                {c.nome}
              </button>
            </li>
          ))}
        </ul>
      </Folha>

      <Folha
        aberta={Boolean(comodoEditado)}
        aoFechar={() => setComodoEditado(undefined)}
        titulo="Editar cômodo"
        rodape={
          comodoEditado && !comodoEditado.confirmarRemocao ? (
            <Botao
              largo
              onClick={() => {
                renomearComodo(comodoEditado.id, comodoEditado.nome);
                setComodoEditado(undefined);
              }}
            >
              Salvar nome
            </Botao>
          ) : undefined
        }
      >
        {comodoEditado && (
          <div className="space-y-6">
            <Campo rotulo="Nome do cômodo" id="nome-comodo">
              <Entrada id="nome-comodo" className="font-bold" value={comodoEditado.nome} maxLength={40} onChange={(e) => setComodoEditado({ ...comodoEditado, nome: e.target.value })} />
            </Campo>
            <div className="space-y-2">
              <span className="block font-bold">Sugestões</span>
              <Pilulas rotulo="Sugestões de nome" opcoes={["Quarto do casal", "Quarto das crianças", "Área de serviço", "Varanda"].map((n) => ({ valor: n, rotulo: n }))} valor={comodoEditado.nome} aoMudar={(nome) => setComodoEditado({ ...comodoEditado, nome })} />
            </div>
            <div className="border-t border-linha pt-5">
              {!comodoEditado.confirmarRemocao ? (
                <Botao variante="perigo" onClick={() => setComodoEditado({ ...comodoEditado, confirmarRemocao: true })}>
                  <Trash2 className="size-5" aria-hidden /> Remover cômodo
                </Botao>
              ) : (
                <div className="space-y-3">
                  <p className="font-bold">Remover o cômodo e os {porComodo.get(comodoEditado.id)?.length ?? 0} aparelhos dele?</p>
                  <div className="flex gap-3">
                    <Botao
                      variante="perigo"
                      onClick={() => {
                        removerComodo(comodoEditado.id);
                        setComodoEditado(undefined);
                      }}
                    >
                      Sim, remover
                    </Botao>
                    <Botao variante="fantasma" onClick={() => setComodoEditado({ ...comodoEditado, confirmarRemocao: false })}>
                      Cancelar
                    </Botao>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Folha>
    </div>
  );
}
