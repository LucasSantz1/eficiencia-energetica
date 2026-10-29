"use client";

import {
  agregarAparelhos,
  COMODOS_PADRAO,
  ehLampada,
  formatarKwh,
  formatarReais,
  ILUMINACAO_PADRAO,
  itemDoCatalogo,
  SUGESTOES_COMODO,
  type Aparelho,
  type Comodo as TipoComodoCasa,
  type TipoComodo,
} from "@ee/core";
import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BlocoIluminacao, horasPorDiaTexto, LinhaAparelho, type ItemComodo } from "@/components/Comodo";
import { EditorAparelho } from "@/components/EditorAparelho";
import { Icone } from "@/ui/Icone";
import { SeletorCatalogo } from "@/components/SeletorCatalogo";
import { ValorAnimado } from "@/ui/Movimento";
import { Botao } from "@/ui/Botao";
import { Campo } from "@/ui/Campo";
import { Entrada } from "@/ui/Entrada";
import { Folha } from "@/ui/Folha";
import { Pilulas } from "@/ui/Pilulas";
import { useResumo } from "@/lib/resumo";
import { useCasa } from "@/lib/store";

export default function Comodos() {
  const { resumo, preco, comodos, aparelhos } = useResumo();
  const adicionarComodo = useCasa((s) => s.adicionarComodo);
  const [visao, setVisao] = useState<"comodos" | "geral">("comodos");
  const [seletorPara, setSeletorPara] = useState<string>();
  const [detalhes, setDetalhes] = useState<Aparelho>();
  const [novoComodo, setNovoComodo] = useState(false);
  const [editandoComodo, setEditandoComodo] = useState<TipoComodoCasa>();
  const adicionarDoCatalogo = useCasa((s) => s.adicionarDoCatalogo);

  // Abre direto no painel geral (?visao=geral) ou rola até o cômodo (#comodo-id).
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("visao") === "geral") setVisao("geral");
  }, []);

  const totalUnidades = aparelhos.reduce((s, a) => s + a.quantidade, 0);

  return (
    <div>
      <h1 className="text-[2rem] leading-tight font-extrabold tracking-tight">Cômodos e aparelhos</h1>
      <p className="mt-1 text-lg text-tinta-suave">
        {comodos.length} cômodos, {totalUnidades} aparelhos e lâmpadas. Use o + e o − para mudar quantidades, e toque no tempo de uso para ajustar.
      </p>
      <div className="mt-5">
        <Pilulas
          rotulo="Ver"
          opcoes={[
            { valor: "comodos", rotulo: "Por cômodo" },
            { valor: "geral", rotulo: "Painel geral" },
          ]}
          valor={visao}
          aoMudar={setVisao}
        />
      </div>

      {visao === "comodos" ? (
        <>
          <div className="mt-6 space-y-4">
            {comodos.map((c, i) => (
              <CartaoComodo
                indice={i}
                key={c.id}
                comodo={c}
                aberto={i === 0}
                valorMes={resumo.comodos.find((x) => x.comodoId === c.id)?.valorMes ?? 0}
                aparelhos={aparelhos.filter((a) => a.comodoId === c.id)}
                aoAdicionar={() => setSeletorPara(c.id)}
                aoDetalhes={setDetalhes}
                aoEditarNome={() => setEditandoComodo(c)}
              />
            ))}
          </div>
          <Botao variante="secundario" className="mt-6" onClick={() => setNovoComodo(true)}>
            <Plus className="size-5" aria-hidden /> Novo cômodo
          </Botao>
        </>
      ) : (
        <PainelGeral />
      )}

      <SeletorCatalogo
        aberto={Boolean(seletorPara)}
        aoFechar={() => setSeletorPara(undefined)}
        aoEscolher={(catalogoId) => {
          const comodoId = seletorPara!;
          setSeletorPara(undefined);
          const existente = aparelhos.find((a) => a.comodoId === comodoId && a.catalogoId === catalogoId && catalogoId !== "outro");
          if (existente) setDetalhes(existente);
          else {
            const criado = adicionarDoCatalogo(catalogoId, { comodoId, ...(catalogoId === "outro" ? { nome: "Outro aparelho" } : {}) });
            if (criado && catalogoId === "outro") setDetalhes(criado);
          }
        }}
      />
      <EditorAparelho aparelho={detalhes} aberto={Boolean(detalhes)} aoFechar={() => setDetalhes(undefined)} preco={preco} />
      <NovoComodo aberto={novoComodo} aoFechar={() => setNovoComodo(false)} aoCriar={(tipo) => adicionarComodo(tipo)} />
      <EditarComodo comodo={editandoComodo} aoFechar={() => setEditandoComodo(undefined)} quantidade={aparelhos.filter((a) => a.comodoId === editandoComodo?.id).length} />
    </div>
  );
}

function CartaoComodo({
  indice,
  comodo,
  aberto: abertoInicial,
  valorMes,
  aparelhos,
  aoAdicionar,
  aoDetalhes,
  aoEditarNome,
}: {
  indice: number;
  comodo: TipoComodoCasa;
  aberto: boolean;
  valorMes: number;
  aparelhos: Aparelho[];
  aoAdicionar: () => void;
  aoDetalhes: (a: Aparelho) => void;
  aoEditarNome: () => void;
}) {
  const { preco } = useResumo();
  const atualizar = useCasa((s) => s.atualizarAparelho);
  const remover = useCasa((s) => s.removerAparelho);
  const adicionarDoCatalogo = useCasa((s) => s.adicionarDoCatalogo);
  const [aberto, setAberto] = useState(abertoInicial);

  useEffect(() => {
    if (window.location.hash === `#comodo-${comodo.id}`) {
      setAberto(true);
      document.getElementById(`comodo-${comodo.id}`)?.scrollIntoView({ block: "start" });
    }
  }, [comodo.id]);

  const lampadas = aparelhos.filter(ehLampada);
  const lampadaPrincipal = lampadas[0];
  const outros = [...aparelhos.filter((a) => !ehLampada(a)), ...lampadas.slice(1)];
  const icone = COMODOS_PADRAO.find((c) => c.tipo === comodo.tipo)?.icone;
  const sugestoes = SUGESTOES_COMODO[comodo.tipo].filter((s) => !aparelhos.some((a) => a.catalogoId === s.catalogoId));
  const unidades = aparelhos.reduce((s, a) => s + a.quantidade, 0);

  const luzPadrao = ILUMINACAO_PADRAO[comodo.tipo];
  const lampadaVirtual: ItemComodo = lampadaPrincipal ?? {
    id: "nova",
    catalogoId: "lampada-led",
    nome: "Lâmpada de LED",
    quantidade: 0,
    potenciaW: itemDoCatalogo("lampada-led")!.potenciaW,
    minutosPorDia: luzPadrao.minutosPorDia,
    diasPorSemana: 7,
  };

  const mudarLampada = (p: Partial<ItemComodo>) => {
    if (!lampadaPrincipal) {
      if ((p.quantidade ?? 0) > 0) adicionarDoCatalogo("lampada-led", { comodoId: comodo.id, quantidade: p.quantidade, minutosPorDia: luzPadrao.minutosPorDia });
      return;
    }
    if (p.quantidade === 0) remover(lampadaPrincipal.id);
    else atualizar(lampadaPrincipal.id, p);
  };

  return (
    <section id={`comodo-${comodo.id}`} aria-labelledby={`titulo-${comodo.id}`} className="surgir scroll-mt-28 overflow-hidden rounded-[var(--radius-cartao)] bg-papel" style={{ animationDelay: `${indice * 60}ms` }}>
      <div className="flex items-center gap-3 p-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-energia-claro text-energia">
          <Icone nome={icone} className="size-6" />
        </span>
        <button type="button" onClick={() => setAberto((v) => !v)} aria-expanded={aberto} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="min-w-0 flex-1">
            <span id={`titulo-${comodo.id}`} className="block truncate text-xl font-extrabold">
              {comodo.nome}
            </span>
            <span className="numeros block text-[0.95rem] text-tinta-suave">
              {unidades} {unidades === 1 ? "item" : "itens"}, <ValorAnimado valor={valorMes} formatar={(v) => formatarReais(v)} duracao={500} /> por mês
            </span>
          </span>
          <ChevronDown className={`size-6 shrink-0 text-tinta-suave transition-transform duration-300 ${aberto ? "rotate-180" : ""}`} aria-hidden />
        </button>
        <button type="button" onClick={aoEditarNome} className="grid size-11 shrink-0 place-items-center rounded-full text-tinta-suave hover:bg-fundo" aria-label={`Renomear ou remover ${comodo.nome}`}>
          <Pencil className="size-5" />
        </button>
      </div>

      <div className="sanfona" data-aberta={aberto}>
        <div inert={!aberto}>
        <div className="border-t border-linha bg-fundo/60 p-3 sm:p-4">
          <BlocoIluminacao lampada={lampadaVirtual} aoMudar={mudarLampada} preco={preco} />
          <ul className="mt-3 space-y-2">
            {outros.map((a) => (
              <LinhaAparelho
                key={a.id}
                item={a}
                preco={preco}
                minimo={0}
                aoAbrirDetalhes={() => aoDetalhes(a)}
                aoMudar={(p) => {
                  if (p.quantidade === 0) remover(a.id);
                  else atualizar(a.id, p);
                }}
              />
            ))}
          </ul>
          {outros.length === 0 && <p className="px-1 py-3 text-tinta-suave">Nenhum aparelho aqui ainda.</p>}

          {sugestoes.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 px-1 text-[0.95rem] font-bold text-tinta-suave">Também é comum ter aqui:</p>
              <div className="flex flex-wrap gap-2">
                {sugestoes.map((s) => {
                  const item = itemDoCatalogo(s.catalogoId)!;
                  return (
                    <button
                      key={s.catalogoId}
                      type="button"
                      onClick={() => adicionarDoCatalogo(s.catalogoId, { comodoId: comodo.id, ...(s.minutosPorDia ? { minutosPorDia: s.minutosPorDia } : {}) })}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-linha bg-papel px-3 font-bold hover:border-energia"
                    >
                      <Plus className="size-4 text-energia" aria-hidden />
                      {item.nome}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <button type="button" onClick={aoAdicionar} className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-full px-2 font-bold text-energia hover:bg-energia-claro">
            <Plus className="size-5" aria-hidden /> Outro aparelho
          </button>
        </div>
        </div>
      </div>
    </section>
  );
}

function PainelGeral() {
  const { resumo, preco, comodos, aparelhos } = useResumo();
  const linhas = useMemo(() => agregarAparelhos(aparelhos, comodos), [aparelhos, comodos]);
  const nomeComodo = (id: string) => comodos.find((c) => c.id === id)?.nome ?? "";
  const valor = (kwh: number) => (resumo.conta.consumoKwh > 0 ? (kwh / resumo.conta.consumoKwh) * resumo.aparelhos.reduce((s, a) => s + a.valorMes, 0) : kwh * preco.valor);
  const totalHoras = linhas.reduce((s, l) => s + l.horasMes, 0);

  return (
    <div className="mt-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Numero rotulo="aparelhos e lâmpadas" valor={<ValorAnimado valor={linhas.reduce((s, l) => s + l.quantidade, 0)} formatar={(v) => String(Math.round(v))} />} />
        <Numero rotulo="por mês" valor={<ValorAnimado valor={resumo.conta.consumoKwh} formatar={(v) => formatarKwh(v)} />} />
        <Numero rotulo="horas de uso somadas no mês" valor={<ValorAnimado valor={totalHoras} formatar={(v) => Math.round(v).toLocaleString("pt-BR")} />} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-[var(--radius-cartao)] bg-papel">
        <table className="w-full min-w-[34rem] text-left">
          <caption className="sr-only">Todos os aparelhos da casa, juntando os iguais de todos os cômodos</caption>
          <thead className="border-b border-linha text-[0.9rem] text-tinta-suave">
            <tr>
              <th scope="col" className="px-4 py-3 font-bold">
                Aparelho
              </th>
              <th scope="col" className="px-2 py-3 text-right font-bold">
                Qtd.
              </th>
              <th scope="col" className="px-3 py-3 text-right font-bold">
                Uso médio
              </th>
              <th scope="col" className="px-3 py-3 text-right font-bold">
                kWh/mês
              </th>
              <th scope="col" className="px-4 py-3 text-right font-bold">
                R$/mês
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-linha">
            {linhas.map((l, i) => (
              <tr key={l.chave} className="surgir" style={{ animationDelay: `${i * 40}ms` }}>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2 font-bold">
                    <Icone nome={itemDoCatalogo(l.catalogoId)?.icone} className="size-5 shrink-0 text-energia" />
                    {l.nome}
                  </span>
                  <span className="mt-0.5 block pl-7 text-[0.9rem] text-tinta-suave">{l.porComodo.map((p) => `${nomeComodo(p.comodoId)} (${p.quantidade})`).join(", ")}</span>
                </td>
                <td className="numeros px-2 py-3 text-right text-lg font-extrabold">{l.quantidade}</td>
                <td className="numeros px-3 py-3 text-right whitespace-nowrap text-tinta-suave">{horasPorDiaTexto({ minutosPorDia: (l.horasMes / Math.max(1, l.quantidade) / 30) * 60, diasPorSemana: 7 })}</td>
                <td className="numeros px-3 py-3 text-right whitespace-nowrap">{formatarKwh(l.kwhMes)}</td>
                <td className="numeros px-4 py-3 text-right font-extrabold whitespace-nowrap">{formatarReais(valor(l.kwhMes))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-tinta">
            <tr>
              <th scope="row" className="px-4 py-3 font-extrabold">
                Total
              </th>
              <td className="numeros px-2 py-3 text-right text-lg font-extrabold">{linhas.reduce((s, l) => s + l.quantidade, 0)}</td>
              <td />
              <td className="numeros px-3 py-3 text-right font-bold whitespace-nowrap">{formatarKwh(resumo.conta.consumoKwh)}</td>
              <td className="numeros px-4 py-3 text-right font-extrabold whitespace-nowrap">{formatarReais(resumo.aparelhos.reduce((s, a) => s + a.valorMes, 0))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="mt-3 text-[0.95rem] text-tinta-suave">Uso médio é quanto tempo cada unidade fica ligada por dia, em média no mês. Geladeiras e freezers contam as 24 horas.</p>
    </div>
  );
}

function Numero({ valor, rotulo }: { valor: React.ReactNode; rotulo: string }) {
  return (
    <div className="rounded-[var(--radius-cartao)] bg-papel px-4 py-4">
      <p className="numeros text-3xl font-extrabold tracking-tight">{valor}</p>
      <p className="text-tinta-suave">{rotulo}</p>
    </div>
  );
}

function NovoComodo({ aberto, aoFechar, aoCriar }: { aberto: boolean; aoFechar: () => void; aoCriar: (tipo: TipoComodo) => void }) {
  return (
    <Folha aberta={aberto} aoFechar={aoFechar} titulo="Novo cômodo">
      <ul className="grid grid-cols-2 gap-2">
        {COMODOS_PADRAO.map((c) => (
          <li key={c.tipo}>
            <button
              type="button"
              onClick={() => {
                aoCriar(c.tipo);
                aoFechar();
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
  );
}

function EditarComodo({ comodo, aoFechar, quantidade }: { comodo?: TipoComodoCasa; aoFechar: () => void; quantidade: number }) {
  const renomear = useCasa((s) => s.renomearComodo);
  const remover = useCasa((s) => s.removerComodo);
  const [nome, setNome] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  useEffect(() => {
    setNome(comodo?.nome ?? "");
    setConfirmar(false);
  }, [comodo]);

  return (
    <Folha
      aberta={Boolean(comodo)}
      aoFechar={aoFechar}
      titulo="Editar cômodo"
      rodape={
        comodo && !confirmar ? (
          <Botao
            largo
            onClick={() => {
              renomear(comodo.id, nome);
              aoFechar();
            }}
          >
            Salvar nome
          </Botao>
        ) : undefined
      }
    >
      {comodo && (
        <div className="space-y-6">
          <Campo rotulo="Nome do cômodo" id="nome-comodo-edit">
            <Entrada id="nome-comodo-edit" className="font-bold" value={nome} maxLength={40} onChange={(e) => setNome(e.target.value)} />
          </Campo>
          <div className="space-y-2">
            <span className="block font-bold">Sugestões</span>
            <Pilulas rotulo="Sugestões de nome" opcoes={["Quarto do casal", "Quarto das crianças", "Área de serviço", "Varanda", "Garagem"].map((n) => ({ valor: n, rotulo: n }))} valor={nome} aoMudar={setNome} />
          </div>
          <div className="border-t border-linha pt-5">
            {!confirmar ? (
              <Botao variante="perigo" onClick={() => setConfirmar(true)}>
                <Trash2 className="size-5" aria-hidden /> Remover cômodo
              </Botao>
            ) : (
              <div className="space-y-3">
                <p className="font-bold">
                  Remover {comodo.nome} e {quantidade === 1 ? "o aparelho" : `os ${quantidade} aparelhos`} dele?
                </p>
                <div className="flex gap-3">
                  <Botao
                    variante="perigo"
                    onClick={() => {
                      remover(comodo.id);
                      aoFechar();
                    }}
                  >
                    Sim, remover
                  </Botao>
                  <Botao variante="fantasma" onClick={() => setConfirmar(false)}>
                    Cancelar
                  </Botao>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Folha>
  );
}
