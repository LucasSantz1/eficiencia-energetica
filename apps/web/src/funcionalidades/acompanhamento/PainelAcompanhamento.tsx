"use client";

import { ChevronRight, Info, Zap } from "lucide-react";
import Link from "next/link";
import { lazy, Suspense, useEffect, useState } from "react";
import { COMODOS_PADRAO, consumoDaCasaForaDoComum, formatarKwh, formatarPorcentagem, formatarReais, itemDoCatalogo, type Aparelho } from "@ee/core";
import { useEdicaoDeAparelho } from "@/aplicacao/casa";
import { useMeta } from "@/aplicacao/meta";
import { useOpiniao } from "@/aplicacao/opiniao";
import { nomeDistribuidora, useResumo } from "@/aplicacao/resumo";
import { contarUso } from "@/aplicacao/uso";
import { EditorAparelho } from "@/ui/aparelho/EditorAparelho";
import { descreverUso } from "@/ui/aparelho/textosDeUso";
import { AvisoConsumoAlto } from "@/ui/AvisoConsumoAlto";
import { AvisoFalhaDeCarga } from "@/ui/AvisoFalhaDeCarga";
import { BlocoDeResumo } from "@/ui/BlocoDeResumo";
import { BotaoLink } from "@/ui/Botao";
import { EspacoReservado } from "@/ui/EspacoReservado";
import { BarraEtiqueta, faixaDoPeso, LegendaEtiqueta, SeloBandeira } from "@/ui/Etiqueta";
import { ExplicaKwh } from "@/ui/ExplicaKwh";
import { Folha } from "@/ui/Folha";
import { Icone, IconeComFundo } from "@/ui/Icone";
import { IgnorarFalha } from "@/ui/IgnorarFalha";
import { ValorAnimado } from "@/ui/Movimento";
import { Acompanhamento } from "./Acompanhamento";
import { ContaDetalhada } from "./ContaDetalhada";
import { LevarResumo } from "./LevarResumo";
import { MetaDeGasto } from "./MetaDeGasto";
import { legendaDoBlocoDaMeta } from "./textosDaMeta";

// O cartão da opinião só baixa quando aparece (ADR-009).
const OpiniaoDoPainel = lazy(() => import("./OpiniaoDoPainel").then((m) => ({ default: m.OpiniaoDoPainel })));

const COR_FAIXA = { a: "bg-faixa-a", b: "bg-faixa-b", c: "bg-faixa-c", d: "bg-faixa-d", e: "bg-faixa-e" } as const;

type Resumo = ReturnType<typeof useResumo>;

/** Painel do acompanhamento. O aviso de falha (T2) fica sempre montado, no topo, para cuidar do foco quando volta. */
export function PainelAcompanhamento() {
  const resumo = useResumo();
  const { falhasSeguidas, semInternet, carregando, tentarDeNovo, arquivo } = resumo;
  return (
    <>
      <div className="mb-6 empty:hidden">
        <AvisoFalhaDeCarga
          assunto={{ tipo: "precos" }}
          fraseDeSeguranca="Sua casa continua salva."
          falhasSeguidas={falhasSeguidas}
          semInternet={semInternet}
          carregando={carregando}
          aoTentarDeNovo={tentarDeNovo}
        />
      </div>
      {falhasSeguidas > 0 && !arquivo ? null : <ConteudoDoPainel dados={resumo} />}
    </>
  );
}

function ConteudoDoPainel({ dados }: { dados: Resumo }) {
  const { resumo, resumoPlano, plano, preco, bandeira, distribuidora, residencia, comodos, aparelhos, dicas, carregando } = dados;
  const [editando, setEditando] = useState<Aparelho>();
  const [metaAberta, setMetaAberta] = useState(false);
  const meta = useMeta(dados);
  const edicao = useEdicaoDeAparelho();
  const opiniao = useOpiniao("painel");
  useEffect(() => contarUso("painel-aberto"), []);
  const { conta } = resumo;
  const maior = resumo.aparelhos[0]?.kwhMes ?? 0;
  const melhor = dicas.find((d) => d.simulavel && (d.economiaMes ?? 0) >= 0.5 && !plano.includes(d.id));

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

  // No computador (HIS-112, L3): a conta em cima; "Seus cômodos" e, logo abaixo, o "Mês a mês" à esquerda; à direita,
  // uma coluna lateral com "Quem mais gasta" e a dica, que ocupa as duas linhas (A-112-1: sem isso sobrava um vão de
  // ~640 px embaixo dos cômodos); a nota embaixo. A ordem do código é a do celular; as áreas só mudam o lugar na tela.
  // Com o "Confere seus aparelhos?" (HIS-003b), a linha 'aviso' entra logo depois da conta; sem ele, a lista não tem a
  // linha (sobraria um intervalo vazio). A meta (HIS-104) tem a linha 'meta' logo depois, nas duas listas. As duas listas ficam escritas por inteiro: o Tailwind precisa da classe literal.
  const consumoAlto = consumoDaCasaForaDoComum(conta.consumoKwh);
  const areas = consumoAlto
    ? "lg:[grid-template-areas:'resumo_resumo'_'aviso_aviso'_'comodos_lado'_'dicas_lado'_'acompanhamento_acompanhamento'_'nota_nota']"
    : "lg:[grid-template-areas:'resumo_resumo'_'comodos_lado'_'dicas_lado'_'acompanhamento_acompanhamento'_'nota_nota']";
  // As 3 dicas que mais economizam (fora as do plano): no computador preenchem o vão embaixo dos cômodos, ao lado do
  // "Quem mais gasta"; no celular ficam fora, porque o bloco "Melhor dica" já leva para a tela de dicas. Sem link nem
  // botão: a ordem de foco tem de ser igual à do celular (HIS-112, critério 8); o caminho para as dicas é o bloco.
  const maisDicas = dicas.filter((d) => d.simulavel && (d.economiaMes ?? 0) >= 0.5 && !plano.includes(d.id)).slice(0, 3);
  const topo = resumo.aparelhos[0];
  const nomeDoTopo = topo ? `${topo.aparelho.nome}, ${formatarReais(topo.valorMes)} por mês` : undefined;
  return (
    <div className={`space-y-10 lg:grid lg:grid-cols-[minmax(0,1fr)_23.5rem] lg:gap-8 lg:space-y-0 ${areas}`}>
      {/* Resumo em grade (pedido do responsável, 24/11): a conta grande e quatro blocos curtos; o detalhe de cada um fica
          na tela dele ou numa folha. No celular, 2 colunas; no computador, a conta à esquerda e os blocos 2 × 2 à direita. */}
      <div className="grid grid-cols-1 gap-3 min-[22rem]:grid-cols-2 lg:grid-cols-4 lg:[grid-area:resumo]">
        <section aria-labelledby="titulo-conta" className="surgir rounded-[var(--radius-cartao)] bg-papel px-5 py-5 min-[22rem]:col-span-2 lg:row-span-2 lg:px-7 lg:py-6">
          <h1 id="titulo-conta" className="flex items-center gap-1.5 text-[0.95rem] font-bold text-energia">
            <Zap className="size-[1.125rem]" aria-hidden /> Sua conta estimada por mês
          </h1>
          <p className="numeros mt-2 text-[clamp(2.75rem,12vw,4.25rem)] leading-none font-extrabold tracking-tight">
            <ValorAnimado valor={conta.valor} formatar={(v) => formatarReais(v)} duracao={1100} />
          </p>
          <p className="numeros mt-2 text-tinta-suave">
            Cerca de {formatarReais(conta.valor / 30)} por dia, {formatarKwh(conta.consumoKwh)} por mês
          </p>
          <ExplicaKwh />

          {resumoPlano && (
            <Link href="/casa/dicas" transitionTypes={["nav-forward"]} className="mt-4 flex items-center gap-3 rounded-[var(--radius-controle)] bg-fundo px-4 py-3 hover:bg-energia-claro">
              <span className="flex-1">
                Com o seu plano ({plano.length} {plano.length === 1 ? "dica" : "dicas"}), cai para{" "}
                <strong className="numeros text-energia-forte">
                  <ValorAnimado valor={resumoPlano.conta.valor} formatar={(v) => formatarReais(v)} />
                </strong>
              </span>
              <ChevronRight className="size-5 shrink-0" aria-hidden />
            </Link>
          )}

          {/* O "como calculamos" fica fechado: quem quer saber abre, quem não quer não rola por ele. Sem JS. */}
          <details className="group mt-4 border-t border-separador pt-3 text-[0.98rem] text-tinta-suave">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 font-bold text-energia [&::-webkit-details-marker]:hidden">
              Conta detalhada <ChevronRight className="size-5 transition-transform group-open:rotate-90" aria-hidden />
            </summary>
            <div className="mt-1 space-y-2">
              {/* HIS-201: a estimativa em linhas, como numa fatura; embaixo, de onde vem o preço. */}
              <ContaDetalhada conta={conta} bandeira={bandeira?.bandeira} />
              {preco.origem === "conta" ? (
                <p>Calculado com o preço do kWh da sua conta de luz ({formatarReais(preco.valor)}), que já inclui impostos.</p>
              ) : (
                <p>
                  Tarifa da {nomeDistribuidora(distribuidora)}: {formatarReais(preco.valor - preco.adicionalBandeira)} por kWh{preco.adicionalBandeira > 0 && ` + ${formatarReais(preco.adicionalBandeira)} da bandeira`}. Sem impostos, que
                  variam por cidade.{" "}
                  <Link href="/casa/ajustes#conta" className="font-bold text-energia underline underline-offset-2">
                    Usar minha conta de luz
                  </Link>
                </p>
              )}
              {residencia?.beneficio === "desconto-social" && <p>Esta estimativa não tira o Desconto Social, porque o valor muda em cada distribuidora. A sua conta deve vir um pouco menor.</p>}
              <p>Os valores são estimativas feitas com os tempos de uso que você informou.</p>
            </div>
          </details>
          {residencia?.beneficio === "tarifa-social" && conta.economiaBeneficio > 0 && (
            <p className="mt-3 text-[0.98rem] text-tinta-suave">A Tarifa Social tira cerca de {formatarReais(conta.economiaBeneficio)} da conta: a energia dos primeiros 80 kWh é de graça.</p>
          )}
          {/* "Não sei" no cadastro: o fim do cadastro leva ao guia, como a opção promete (HIS-103, D7). Sem prefetch:
              a /casa não baixa o guia a cada visita, só quando a pessoa toca (tech-lead, HIS-103b). */}
          {residencia?.beneficio === "nao-sei" && (
            <p className="mt-3">
              <Link href="/tarifa-social" prefetch={false} transitionTypes={["nav-forward"]} className="inline-flex min-h-11 items-center font-bold text-energia underline underline-offset-2">
                Ver se pode ter direito à Tarifa Social
              </Link>
            </p>
          )}
          {conta.cobradoPeloMinimo && (
            <p className="mt-3 flex gap-2 text-[0.98rem] text-tinta-suave">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden /> Seu consumo ficou abaixo do mínimo que a distribuidora cobra ({conta.consumoMinimoKwh} kWh), então a conta vem pelo mínimo.
            </p>
          )}
        </section>

        <BlocoDeResumo
          icone={<Icone nome="meta" />}
          rotulo="Sua meta"
          valor={meta.metaReais === undefined ? "Sem meta" : formatarReais(meta.metaReais)}
          legenda={legendaDoBlocoDaMeta(meta.situacao)}
          aoTocar={() => setMetaAberta(true)}
          className="surgir [animation-delay:80ms]"
        />
        <BlocoDeResumo
          icone={<Icone nome="dinheiro" />}
          rotulo="Preço da luz"
          valor={formatarReais(preco.valor)}
          legenda={preco.origem === "conta" ? "por kWh, da sua conta" : "por kWh, sem impostos"}
          href="/casa/ajustes#conta"
          className="surgir [animation-delay:140ms]"
        >
          {bandeira && preco.origem === "aneel" && (
            <span className="mt-2 block text-[0.92rem]">
              <SeloBandeira bandeira={bandeira.bandeira} exata={bandeira.exata} />
            </span>
          )}
        </BlocoDeResumo>
        {topo && (
          <BlocoDeResumo icone={<Icone nome="grafico" />} rotulo="Gasta mais" valor={formatarPorcentagem(topo.participacao)} legenda={nomeDoTopo} href="#ranking" className="surgir [animation-delay:200ms]">
            <span className="mt-auto block pt-3" aria-hidden>
              <span className="block h-1.5 overflow-hidden rounded-full bg-fundo">
                <span className={`cresce-x block h-full rounded-full ${COR_FAIXA[faixaDoPeso(topo.participacao)]}`} style={{ width: `${Math.max(4, topo.participacao * 100)}%` }} />
              </span>
            </span>
          </BlocoDeResumo>
        )}
        {melhor && (
          <BlocoDeResumo
            icone={<Icone nome="lightbulb" />}
            rotulo="Melhor dica"
            valor={formatarReais(melhor.economiaMes ?? 0)}
            legenda={`a menos por mês: ${melhor.titulo.charAt(0).toLowerCase()}${melhor.titulo.slice(1)}`}
            href="/casa/dicas"
            className="surgir [animation-delay:260ms]"
          />
        )}
      </div>

      <AvisoConsumoAlto
        className="lg:[grid-area:aviso]"
        kwhMes={conta.consumoKwh}
        acao={
          <BotaoLink href="/casa/comodos" transitionTypes={["nav-forward"]} variante="secundario">
            Ver meus aparelhos
          </BotaoLink>
        }
      />

      {/* Meta de gasto (HIS-104): o bloco "Sua meta" abre a folha com o campo e o resultado. */}
      <Folha aberta={metaAberta} aoFechar={() => setMetaAberta(false)} titulo="Sua meta">
        <MetaDeGasto dados={dados} naFolha />
      </Folha>

      {/* Cômodos */}
      <section aria-labelledby="titulo-comodos" className="lg:[grid-area:comodos]">
        <div className="flex items-end justify-between gap-4">
          <h2 id="titulo-comodos" className="text-[1.375rem] font-bold tracking-tight">
            Seus cômodos
          </h2>
          <Link href="/casa/comodos" transitionTypes={["nav-forward"]} className="inline-flex min-h-11 items-center gap-1 font-bold text-energia">
            Editar <ChevronRight className="size-5" aria-hidden />
          </Link>
        </div>
        <ul className="-mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 lg:pb-0">
          {comodos.map((c, indice) => {
            const dados = resumo.comodos.find((x) => x.comodoId === c.id);
            const doComodo = aparelhos.filter((a) => a.comodoId === c.id);
            const itens = doComodo.reduce((s, a) => s + a.quantidade, 0);
            const participacao = dados?.participacao ?? 0;
            return (
              <li key={c.id} className="surgir w-[10.5rem] shrink-0 snap-start lg:w-auto" style={{ animationDelay: `${150 + indice * 70}ms` }}>
                <Link href={`/casa/comodos#comodo-${c.id}`} transitionTypes={["nav-forward"]} className="flex h-full flex-col rounded-[var(--radius-cartao)] bg-papel p-4 hover:bg-white/70">
                  <span className="flex items-center justify-between">
                    <IconeComFundo nome={COMODOS_PADRAO.find((p) => p.tipo === c.tipo)?.icone} />
                    <span className="numeros text-[0.9rem] text-tinta-suave">{formatarPorcentagem(participacao)}</span>
                  </span>{" "}
                  <span className="mt-3 block truncate font-bold">{c.nome}</span>{" "}
                  <span className="numeros block text-xl font-extrabold">{formatarReais(dados?.valorMes ?? 0)}</span>{" "}
                  <span className="block text-[0.9rem] text-tinta-suave">
                    {itens} {itens === 1 ? "item" : "itens"}
                  </span>
                  <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-fundo" aria-hidden>
                    <span
                      className={`cresce-x block h-full rounded-full transition-[width] duration-500 ${COR_FAIXA[faixaDoPeso(participacao)]}`}
                      style={{ width: `${Math.max(2, participacao * 100)}%`, animationDelay: `${400 + indice * 70}ms` }}
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Coluna lateral no computador; no celular, a mesma margem de antes entre os três blocos. Sem lateral-fixa: com 6
          aparelhos e a dica ela passa da altura da janela, e a utilidade a transformaria numa caixa com rolagem própria. */}
      <div className="space-y-10 lg:self-start lg:[grid-area:lado]">
        {/* Quem mais gasta */}
        <section id="ranking" aria-labelledby="titulo-ranking" className="scroll-mt-4">
          <div className="flex items-end justify-between gap-4">
            <h2 id="titulo-ranking" className="text-[1.375rem] font-bold tracking-tight">
              Quem mais gasta
            </h2>
            <Link href="/casa/comodos?visao=geral" transitionTypes={["nav-forward"]} className="inline-flex min-h-11 items-center gap-1 font-bold text-energia">
              Painel geral <ChevronRight className="size-5" aria-hidden />
            </Link>
          </div>
          <div className="mt-3 rounded-[var(--radius-cartao)] bg-papel p-4 sm:p-5">
          <LegendaEtiqueta />
          <ul className="mt-4 space-y-4">
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
                      <Icone nome={itemDoCatalogo(aparelho.catalogoId)?.icone} className="size-6" />
                      <span className="min-w-0 flex-1 truncate font-bold">
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
          </div>
        </section>

        <EspacoReservado posicao="painel-apos-ranking" />

      </div>

      {maisDicas.length > 0 && (
        <section aria-labelledby="titulo-mais-dicas" className="hidden lg:block lg:[grid-area:dicas]">
          <div className="flex items-end justify-between gap-4">
            <h2 id="titulo-mais-dicas" className="text-[1.375rem] font-bold tracking-tight">
              Dicas para pagar menos
            </h2>
          </div>
          <ul className="mt-3 divide-y divide-separador overflow-hidden rounded-[var(--radius-cartao)] bg-papel">
            {maisDicas.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-4 py-3.5">
                <IconeComFundo nome={d.icone} />
                <span className="min-w-0 flex-1 font-bold">{d.titulo}</span>
                <span className="numeros shrink-0 text-right">
                  <span className="block font-extrabold text-energia-forte">{formatarReais(d.economiaMes ?? 0)}</span>
                  <span className="block text-[0.9rem] text-tinta-suave">por mês</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="lg:[grid-area:acompanhamento]">
        <Acompanhamento estimativaKwhMes={conta.consumoKwh} />
      </div>

      <div className="lg:[grid-area:nota]">
        <LevarResumo resumo={resumo} proximaDica={melhor} />
        <p className="mt-4 text-[0.95rem] text-tinta-suave lg:max-w-[68ch]">
          Os valores são estimativas feitas com os tempos de uso que você informou. A conta real pode variar com impostos, taxa de iluminação pública e dias de leitura.
        </p>
        {opiniao.mostrar && (
          <div className="mt-6 lg:max-w-[40rem]" data-sem-impressao>
            <IgnorarFalha>
              <Suspense fallback={null}>
                <OpiniaoDoPainel aoEnviar={opiniao.enviar} aoDispensar={opiniao.dispensar} />
              </Suspense>
            </IgnorarFalha>
          </div>
        )}
      </div>

      <EditorAparelho aparelho={editando} aberto={Boolean(editando)} aoFechar={() => setEditando(undefined)} preco={preco} comodos={edicao.comodos} aoSalvar={edicao.salvar} aoRemover={edicao.remover} />
    </div>
  );
}
