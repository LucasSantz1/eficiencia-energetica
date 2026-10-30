"use client";

import { COMODOS_PADRAO, ehLampada, formatarKwh, formatarPorcentagem, formatarReais, itemDoCatalogo, type Aparelho } from "@ee/core";
import { ChevronRight, Info } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { descreverUso } from "@/ui/aparelho/textosDeUso";
import { EditorAparelho } from "@/ui/aparelho/EditorAparelho";
import { EspacoReservado } from "@/ui/EspacoReservado";
import { BarraEtiqueta, faixaDoPeso, LegendaEtiqueta, SeloBandeira } from "@/ui/Etiqueta";
import { Icone } from "@/ui/Icone";
import { ValorAnimado } from "@/ui/Movimento";
import { Aviso } from "@/ui/Aviso";
import { BotaoLink } from "@/ui/Botao";
import { useEdicaoDeAparelho } from "@/aplicacao/casa";
import { nomeDistribuidora, useResumo } from "@/aplicacao/resumo";
import { Acompanhamento } from "./Acompanhamento";

const COR_FAIXA = { a: "bg-faixa-a", b: "bg-faixa-b", c: "bg-faixa-c", d: "bg-faixa-d", e: "bg-faixa-e" } as const;

export function PainelAcompanhamento() {
  const { resumo, resumoPlano, plano, preco, bandeira, distribuidora, residencia, comodos, aparelhos, dicas, carregando, erro } = useResumo();
  const [editando, setEditando] = useState<Aparelho>();
  const edicao = useEdicaoDeAparelho();
  const { conta } = resumo;
  const maior = resumo.aparelhos[0]?.kwhMes ?? 0;
  const melhor = dicas.find((d) => d.simulavel && (d.economiaMes ?? 0) >= 0.5 && !plano.includes(d.id));

  if (erro) return <Aviso tom="alerta">Não conseguimos carregar as tarifas. Confira sua internet e recarregue a página.</Aviso>;
  if (carregando && !distribuidora) return <div className="h-48 animate-pulse rounded-[var(--radius-cartao)] bg-papel" aria-busy aria-label="Carregando" />;

  if (aparelhos.length === 0) {
    return (
      <div className="py-6">
        <h1 className="text-[2rem] leading-tight font-extrabold">Nenhum aparelho ainda</h1>
        <p className="mt-3 max-w-[48ch] text-lg text-tinta-suave">Adicione os aparelhos de cada cômodo para ver quanto cada um custa por mês.</p>
        <BotaoLink href="/casa/comodos" className="mt-8">
          Ir para os cômodos
        </BotaoLink>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Valor da conta */}
      <section aria-labelledby="titulo-conta" className="surgir rounded-[1.75rem] bg-tinta px-5 py-6 text-white sm:px-8 sm:py-8">
        <h1 id="titulo-conta" className="text-lg font-bold text-white/80">
          Sua conta estimada por mês
        </h1>
        <p className="numeros mt-1 text-[clamp(3rem,13vw,5.25rem)] leading-none font-extrabold tracking-tight text-faisca">
          <ValorAnimado valor={conta.valor} formatar={(v) => formatarReais(v)} duracao={1100} />
        </p>
        <p className="numeros mt-3 text-lg text-white/85">
          {formatarKwh(conta.consumoKwh)} por mês, cerca de {formatarReais(conta.valor / 30)} por dia
        </p>

        {resumoPlano && (
          <Link href="/casa/dicas" transitionTypes={["nav-forward"]} className="mt-5 flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 hover:bg-white/15">
            <span className="flex-1">
              Com o seu plano de economia ({plano.length} {plano.length === 1 ? "dica" : "dicas"}), a conta cai para{" "}
              <strong className="numeros text-faisca">
                <ValorAnimado valor={resumoPlano.conta.valor} formatar={(v) => formatarReais(v)} />
              </strong>: {formatarReais(conta.valor - resumoPlano.conta.valor)} a menos por mês.
            </span>
            <ChevronRight className="size-5 shrink-0" aria-hidden />
          </Link>
        )}

        <div className="mt-6 space-y-2 border-t border-white/15 pt-5 text-[0.98rem] text-white/80">
          {bandeira && preco.origem === "aneel" && (
            <p className="text-white">
              <SeloBandeira bandeira={bandeira.bandeira} exata={bandeira.exata} sobreEscuro />
            </p>
          )}
          {preco.origem === "conta" ? (
            <p>Calculado com o preço do kWh da sua conta de luz ({formatarReais(preco.valor)}), que já inclui impostos.</p>
          ) : (
            <p>
              Tarifa da {nomeDistribuidora(distribuidora)}: {formatarReais(preco.valor - preco.adicionalBandeira)} por kWh{preco.adicionalBandeira > 0 && ` + ${formatarReais(preco.adicionalBandeira)} da bandeira`}. Sem impostos, que variam por
              cidade.{" "}
              <Link href="/casa/ajustes#conta" className="font-bold text-faisca underline underline-offset-2">
                Usar minha conta de luz
              </Link>
            </p>
          )}
          {residencia?.beneficio === "tarifa-social" && conta.economiaBeneficio > 0 && <p>A Tarifa Social já tirou {formatarReais(conta.economiaBeneficio)} da conta: os primeiros 80 kWh são de graça.</p>}
          {residencia?.beneficio === "desconto-social" && <p>Com o Desconto Social, os primeiros 120 kWh saem mais baratos. Confira o desconto exato na sua conta.</p>}
          {conta.cobradoPeloMinimo && (
            <p className="flex gap-2">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden /> Seu consumo ficou abaixo do mínimo que a distribuidora cobra ({conta.consumoMinimoKwh} kWh), então a conta vem pelo mínimo.
            </p>
          )}
        </div>
      </section>

      {/* Cômodos */}
      <section aria-labelledby="titulo-comodos">
        <div className="flex items-end justify-between gap-4">
          <h2 id="titulo-comodos" className="text-2xl font-extrabold tracking-tight">
            Seus cômodos
          </h2>
          <Link href="/casa/comodos" transitionTypes={["nav-forward"]} className="inline-flex min-h-11 items-center gap-1 font-bold text-energia">
            Editar <ChevronRight className="size-5" aria-hidden />
          </Link>
        </div>
        <ul className="mt-4 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3">
          {comodos.map((c, indice) => {
            const dados = resumo.comodos.find((x) => x.comodoId === c.id);
            const doComodo = aparelhos.filter((a) => a.comodoId === c.id);
            const lampadas = doComodo.filter(ehLampada).reduce((s, a) => s + a.quantidade, 0);
            const outros = doComodo.filter((a) => !ehLampada(a)).reduce((s, a) => s + a.quantidade, 0);
            const participacao = dados?.participacao ?? 0;
            return (
              <li key={c.id} className="surgir" style={{ animationDelay: `${150 + indice * 70}ms` }}>
                <Link href={`/casa/comodos#comodo-${c.id}`} transitionTypes={["nav-forward"]} className="flex h-full flex-col gap-3 rounded-[var(--radius-cartao)] bg-papel p-4 hover:ring-2 hover:ring-energia">
                  <span className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-xl bg-energia-claro text-energia">
                      <Icone nome={COMODOS_PADRAO.find((p) => p.tipo === c.tipo)?.icone} className="size-6" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-lg font-extrabold">{c.nome}</span>
                      <span className="block text-[0.92rem] text-tinta-suave">
                        {outros} {outros === 1 ? "aparelho" : "aparelhos"}, {lampadas} {lampadas === 1 ? "lâmpada" : "lâmpadas"}
                      </span>
                    </span>
                    <span className="numeros text-right text-lg font-extrabold">{formatarReais(dados?.valorMes ?? 0)}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-fundo">
                      <span
                        className={`cresce-x block h-full rounded-full transition-[width] duration-500 ${COR_FAIXA[faixaDoPeso(participacao)]}`}
                        style={{ width: `${Math.max(2, participacao * 100)}%`, animationDelay: `${400 + indice * 70}ms` }}
                      />
                    </span>
                    <span className="numeros w-12 text-right text-[0.9rem] text-tinta-suave">{formatarPorcentagem(participacao)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Quem mais gasta */}
      <section aria-labelledby="titulo-ranking">
        <div className="flex items-end justify-between gap-4">
          <h2 id="titulo-ranking" className="text-2xl font-extrabold tracking-tight">
            Quem mais gasta
          </h2>
          <Link href="/casa/comodos?visao=geral" transitionTypes={["nav-forward"]} className="inline-flex min-h-11 items-center gap-1 font-bold text-energia">
            Painel geral <ChevronRight className="size-5" aria-hidden />
          </Link>
        </div>
        <div className="mt-3">
          <LegendaEtiqueta />
        </div>
        <ul className="mt-5 space-y-5">
          {resumo.aparelhos.slice(0, 6).map(({ aparelho, kwhMes, valorMes, participacao }, indice) => {
            // O nome acessível repete o texto visível na mesma ordem (WCAG 2.5.3, texto da ux no D-A5-1);
            // por isso tela e nome saem das mesmas variáveis.
            const quantidade = aparelho.quantidade > 1 ? `${aparelho.quantidade} × ` : "";
            const nomeComodo = comodos.find((c) => c.id === aparelho.comodoId)?.nome;
            const porcentagem = formatarPorcentagem(participacao);
            const uso = descreverUso(aparelho);
            const valor = formatarReais(valorMes);
            return (
              <li key={aparelho.id} className="surgir" style={{ animationDelay: `${300 + indice * 80}ms` }}>
                <button type="button" onClick={() => setEditando(aparelho)} className="block w-full rounded-xl text-left" aria-label={`${quantidade}${aparelho.nome} em ${nomeComodo}, ${porcentagem}, ${uso}, ${valor} por mês. É ${porcentagem} da conta. Toque para ajustar.`}>
                  {/* Os {" "} entre blocos não aparecem na tela (itens flex/bloco), mas separam as palavras no texto
                      visível que o axe junta sem espaço; sem eles, "Banheiro" e "41%" viram uma palavra só. */}
                  <span className="flex items-center gap-2">
                    <Icone nome={itemDoCatalogo(aparelho.catalogoId)?.icone} className="size-5 text-tinta-suave" />
                    <span className="flex-1 truncate font-bold">
                      {aparelho.quantidade > 1 && <span className="numeros">{quantidade}</span>}
                      {aparelho.nome}
                      <span className="font-normal text-tinta-suave"> em {nomeComodo}</span>
                    </span>{" "}
                    <span className="numeros text-[0.95rem] text-tinta-suave">{porcentagem}</span>
                  </span>{" "}
                  <span className="mb-1.5 block pl-7 text-[0.92rem] text-tinta-suave">{uso}</span>{" "}
                  <BarraEtiqueta relativo={maior > 0 ? kwhMes / maior : 0} participacao={participacao} atraso={450 + indice * 80}>
                    {valor}
                  </BarraEtiqueta>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <EspacoReservado posicao="painel-apos-ranking" />

      {melhor && (
        <section aria-labelledby="titulo-economia" className="surgir rounded-[var(--radius-cartao)] border-2 border-energia bg-energia-claro p-5 sm:p-6" style={{ animationDelay: "700ms" }}>
          <h2 id="titulo-economia" className="text-lg font-bold text-energia-forte">
            {plano.length > 0 ? "Próxima dica para o seu plano" : "A dica que mais economiza na sua casa"}
          </h2>
          <div className="mt-3 flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-papel text-energia">
              <Icone nome={melhor.icone} className="size-6" />
            </span>
            <div className="flex-1">
              <p className="text-xl leading-snug font-extrabold">{melhor.titulo}</p>
              <p className="numeros mt-1 text-energia-forte">
                <strong>{formatarReais(melhor.economiaMes ?? 0)} por mês</strong>, ou {formatarReais((melhor.economiaMes ?? 0) * 12)} em um ano
              </p>
            </div>
          </div>
          <BotaoLink href="/casa/dicas" transitionTypes={["nav-forward"]} variante="secundario" className="mt-5">
            Montar meu plano de economia
          </BotaoLink>
        </section>
      )}

      <Acompanhamento estimativaKwhMes={conta.consumoKwh} />

      <p className="text-[0.95rem] text-tinta-suave">
        Os valores são estimativas feitas com os tempos de uso que você informou. A conta real pode variar com impostos, taxa de iluminação pública e dias de leitura.
      </p>

      <EditorAparelho aparelho={editando} aberto={Boolean(editando)} aoFechar={() => setEditando(undefined)} preco={preco} comodos={edicao.comodos} aoSalvar={edicao.salvar} aoRemover={edicao.remover} />
    </div>
  );
}
