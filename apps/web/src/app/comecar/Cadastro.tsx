"use client";

import { agregarAparelhos, COMODOS_PADRAO, type Beneficio, type Distribuidora, type Municipio, type TipoComodo } from "@ee/core";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { addTransitionType, startTransition, useEffect, useMemo, useRef, useState } from "react";
import { BuscaCidade } from "@/components/BuscaCidade";
import { BlocoIluminacao, horasPorDiaTexto, LinhaAparelho, type ItemComodo } from "@/components/Comodo";
import { Icone } from "@/components/Icone";
import { Marca } from "@/components/Marca";
import { ENTRAR_NO_PAINEL, TransicaoTela } from "@/components/Movimento";
import { SeletorCatalogo } from "@/components/SeletorCatalogo";
import { Aviso, Botao, BotaoLink, Campo, Contador, Entrada, Opcao, Pilulas } from "@/components/ui";
import { useMunicipios, useTarifas } from "@/lib/dados";
import { ajustarComodos, itemDoCatalogoParaComodo, rascunhoParaCasa, type ComodoRascunho } from "@/lib/rascunho";
import { nomeDistribuidora } from "@/lib/resumo";
import { useCasa, useCasaCarregada } from "@/lib/store";

type Passo = "estado" | "cidade" | "distribuidora" | "beneficio" | "pessoas" | "comodos" | `comodo:${number}` | "revisao" | "conta";

const BENEFICIOS: { id: Beneficio; titulo: string; descricao: string }[] = [
  { id: "tarifa-social", titulo: "Sim, tenho Tarifa Social", descricao: "Família no CadÚnico com renda de até meio salário mínimo por pessoa, ou alguém recebe o BPC." },
  { id: "desconto-social", titulo: "Sim, com renda até 1 salário mínimo por pessoa", descricao: "Família no CadÚnico com renda entre meio e um salário mínimo por pessoa." },
  { id: "nenhum", titulo: "Não", descricao: "A conta vem com a tarifa normal." },
  { id: "nao-sei", titulo: "Não sei", descricao: "Sem problema. No fim mostramos como descobrir se você tem direito." },
];

/** Quantidade inicial de cada cômodo — o jeito mais comum de uma casa brasileira. */
const QUANTIDADES_INICIAIS: Partial<Record<TipoComodo, number>> = { cozinha: 1, sala: 1, quarto: 2, banheiro: 1, lavanderia: 1 };

export function Cadastro() {
  const router = useRouter();
  const carregada = useCasaCarregada();
  const jaTemCasa = useCasa((s) => Boolean(s.residencia));
  const criarCasa = useCasa((s) => s.criarCasa);
  const apagarTudo = useCasa((s) => s.apagarTudo);

  const tarifas = useTarifas();
  const [passo, setPasso] = useState<Passo>("estado");
  const [uf, setUf] = useState<string>();
  const [municipio, setMunicipio] = useState<Municipio>();
  const [distribuidoraId, setDistribuidoraId] = useState<string>();
  const [beneficio, setBeneficio] = useState<Beneficio>();
  const [pessoas, setPessoas] = useState(3);
  const [quantidades, setQuantidades] = useState(QUANTIDADES_INICIAIS);
  const [comodos, setComodos] = useState<ComodoRascunho[]>([]);
  const [visao, setVisao] = useState<"comodos" | "geral">("comodos");
  const [seletorPara, setSeletorPara] = useState<string>();
  const [contaKwh, setContaKwh] = useState("");
  const [contaValor, setContaValor] = useState("");
  const [recomecar, setRecomecar] = useState(false);
  // Enquanto o painel abre, continua mostrando o último passo (e não "você já cadastrou").
  const [concluindo, setConcluindo] = useState(false);
  const tituloRef = useRef<HTMLHeadingElement>(null);

  const municipios = useMunicipios(uf);
  const distribuidorasPorId = useMemo(() => new Map((tarifas.dados?.distribuidoras ?? []).map((d) => [d.id, d])), [tarifas.dados]);

  const opcoesDistribuidora: Distribuidora[] = useMemo(() => {
    if (!tarifas.dados) return [];
    const daCidade = (municipio?.distribuidoras ?? []).map((id) => distribuidorasPorId.get(id)).filter((d): d is Distribuidora => Boolean(d));
    if (daCidade.length > 0) return daCidade;
    const doEstado = tarifas.dados.estados.find((e) => e.uf === uf)?.distribuidoras ?? [];
    const lista = doEstado.map((id) => distribuidorasPorId.get(id)).filter((d): d is Distribuidora => Boolean(d));
    return lista.length > 0 ? lista : tarifas.dados.distribuidoras;
  }, [tarifas.dados, municipio, uf, distribuidorasPorId]);

  const pulaDistribuidora = municipio !== undefined && municipio.distribuidoras.filter((id) => distribuidorasPorId.has(id)).length === 1;
  const passos: Passo[] = [
    "estado",
    "cidade",
    ...(pulaDistribuidora ? [] : (["distribuidora"] as Passo[])),
    "beneficio",
    "pessoas",
    "comodos",
    ...comodos.map((_, i) => `comodo:${i}` as Passo),
    "revisao",
    "conta",
  ];
  const indice = Math.max(0, passos.indexOf(passo));

  useEffect(() => {
    tituloRef.current?.focus();
  }, [passo]);

  /** Troca de passo animada: avançar desliza para a esquerda, voltar para a direita. */
  const irPara = (p: Passo, sentido: "adiante" | "volta" = passos.indexOf(p) < indice ? "volta" : "adiante") => {
    startTransition(() => {
      addTransitionType(sentido === "volta" ? "nav-back" : "nav-forward");
      setPasso(p);
    });
    window.scrollTo({ top: 0 });
  };
  const avancar = () => {
    const prox = passos[indice + 1];
    if (prox) irPara(prox, "adiante");
  };
  const voltar = () => {
    const ant = passos[indice - 1];
    if (ant) irPara(ant, "volta");
    else router.push("/", { transitionTypes: ["nav-back"] });
  };

  const escolherMunicipio = (m: Municipio) => {
    setMunicipio(m);
    const validas = m.distribuidoras.filter((id) => distribuidorasPorId.has(id));
    if (validas.length === 1) {
      setDistribuidoraId(validas[0]);
      irPara("beneficio");
    } else {
      setDistribuidoraId(undefined);
      irPara("distribuidora");
    }
  };

  const confirmarComodos = () => {
    const ajustados = ajustarComodos(comodos, quantidades, pessoas);
    setComodos(ajustados);
    if (ajustados.length > 0) irPara("comodo:0");
  };

  const mudarComodo = (id: string, fn: (c: ComodoRascunho) => ComodoRascunho) => setComodos((lista) => lista.map((c) => (c.id === id ? fn(c) : c)));
  const mudarItem = (comodoId: string, itemId: string, parcial: Partial<ItemComodo>) =>
    mudarComodo(comodoId, (c) => ({ ...c, itens: c.itens.map((i) => (i.id === itemId ? { ...i, ...parcial } : i)) }));

  const casaFinal = useMemo(() => rascunhoParaCasa(comodos), [comodos]);
  const painelGeral = useMemo(() => agregarAparelhos(casaFinal.aparelhos, casaFinal.comodos), [casaFinal]);
  const totalAparelhos = casaFinal.aparelhos.reduce((s, a) => s + a.quantidade, 0);

  const concluir = (usarConta: boolean) => {
    if (!uf || !municipio || !distribuidoraId || !beneficio) return;
    setConcluindo(true);
    const kwh = usarConta ? Number(contaKwh.replace(",", ".")) : 0;
    const valor = usarConta ? Number(contaValor.replace(/\./g, "").replace(",", ".")) : 0;
    criarCasa({
      residencia: {
        uf,
        municipioIbge: municipio.ibge,
        municipioNome: municipio.nome,
        distribuidoraId,
        beneficio,
        ligacao: "nao-sei",
        pessoas,
        contaReferencia: kwh > 0 && valor > 0 ? { kwh, valor } : undefined,
      },
      ...casaFinal,
    });
    router.push("/casa", { transitionTypes: ENTRAR_NO_PAINEL });
  };

  if (carregada && jaTemCasa && !recomecar && !concluindo) {
    return (
      <Moldura>
        <h1 className="text-[2rem] leading-tight font-extrabold">Você já cadastrou a sua casa</h1>
        <p className="mt-3 text-lg text-tinta-suave">Seus cômodos e aparelhos estão guardados neste aparelho. Dá para editar tudo no acompanhamento.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <BotaoLink href="/casa" transitionTypes={ENTRAR_NO_PAINEL}>
            Ir para o acompanhamento
          </BotaoLink>
          <Botao variante="perigo" onClick={() => setRecomecar(true)}>
            Apagar e começar do zero
          </Botao>
        </div>
      </Moldura>
    );
  }
  if (recomecar && jaTemCasa && !concluindo) {
    return (
      <Moldura>
        <h1 className="text-[2rem] leading-tight font-extrabold">Apagar tudo e começar de novo?</h1>
        <p className="mt-3 text-lg text-tinta-suave">A cidade, os cômodos, os aparelhos e o histórico de contas serão apagados deste aparelho.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Botao variante="perigo" onClick={() => apagarTudo()}>
            Apagar tudo
          </Botao>
          <Botao variante="secundario" onClick={() => setRecomecar(false)}>
            Manter minha casa
          </Botao>
        </div>
      </Moldura>
    );
  }

  const estados = tarifas.dados?.estados ?? [];
  const comodoAtual = passo.startsWith("comodo:") ? comodos[Number(passo.split(":")[1])] : undefined;
  const numeroComodo = passo.startsWith("comodo:") ? Number(passo.split(":")[1]) : -1;
  const etapa = indice < passos.indexOf("comodos") ? "Sua casa" : indice <= passos.indexOf("revisao") ? "Cômodos e aparelhos" : "Último passo";

  return (
    <Moldura
      progresso={
        <div className="flex items-center gap-3">
          <button type="button" onClick={voltar} className="inline-flex min-h-11 items-center gap-1.5 rounded-full pr-3 font-bold text-energia hover:bg-energia-claro">
            <ArrowLeft className="size-5" /> Voltar
          </button>
          <div className="flex-1">
            <div className="h-2 overflow-hidden rounded-full bg-linha" aria-hidden>
              <div className="h-full rounded-full bg-energia transition-[width] duration-300" style={{ width: `${((indice + 1) / passos.length) * 100}%` }} />
            </div>
          </div>
          <span className="text-[0.95rem] font-bold text-tinta-suave">{etapa}</span>
        </div>
      }
    >
      <TransicaoTela chave={passo}>
      <div>
      {tarifas.erro && (
        <Aviso tom="alerta">
          Não conseguimos carregar as tarifas. Confira sua internet.{" "}
          <button className="font-bold underline" onClick={tarifas.tentarDeNovo}>
            Tentar de novo
          </button>
        </Aviso>
      )}

      {passo === "estado" && (
        <>
          <Titulo ref={tituloRef} subtitulo="Usamos isso para achar a tarifa da empresa que manda a sua conta de luz.">
            Em qual estado você mora?
          </Titulo>
          {tarifas.carregando && !tarifas.dados ? (
            <Carregando />
          ) : (
            <ul className="mt-6 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
              {estados.map((e) => (
                <li key={e.uf}>
                  <Opcao
                    selecionada={uf === e.uf}
                    onClick={() => {
                      if (uf !== e.uf) setMunicipio(undefined);
                      setUf(e.uf);
                      irPara("cidade");
                    }}
                  >
                    {e.nome}
                  </Opcao>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {passo === "cidade" && (
        <>
          <Titulo ref={tituloRef} subtitulo={estados.find((e) => e.uf === uf)?.nome}>
            Qual é a sua cidade?
          </Titulo>
          {municipios.carregando ? <Carregando /> : <BuscaCidade municipios={municipios.dados?.municipios ?? []} selecionado={municipio} aoEscolher={escolherMunicipio} />}
        </>
      )}

      {passo === "distribuidora" && (
        <>
          <Titulo
            ref={tituloRef}
            subtitulo={
              (municipio?.distribuidoras.length ?? 0) > 1
                ? `Mais de uma empresa atende ${municipio?.nome}. Veja o nome no topo da sua conta de luz.`
                : `Não sabemos qual empresa atende ${municipio?.nome}. Veja o nome no topo da sua conta de luz.`
            }
          >
            Qual empresa manda a sua conta de luz?
          </Titulo>
          <ul className="mt-6 space-y-2">
            {opcoesDistribuidora.map((d) => (
              <li key={d.id}>
                <Opcao
                  selecionada={distribuidoraId === d.id}
                  onClick={() => {
                    setDistribuidoraId(d.id);
                    irPara("beneficio");
                  }}
                  descricao={`Tarifa: R$ ${d.tarifaKwh.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} por kWh, sem impostos`}
                >
                  {nomeDistribuidora(d)}
                </Opcao>
              </li>
            ))}
          </ul>
        </>
      )}

      {passo === "beneficio" && (
        <>
          <Titulo ref={tituloRef} subtitulo="Famílias de baixa renda pagam menos na conta de luz. Isso muda o cálculo.">
            Sua família está no CadÚnico?
          </Titulo>
          <ul className="mt-6 space-y-2">
            {BENEFICIOS.map((b) => (
              <li key={b.id}>
                <Opcao
                  selecionada={beneficio === b.id}
                  descricao={b.descricao}
                  onClick={() => {
                    setBeneficio(b.id);
                    irPara("pessoas");
                  }}
                >
                  {b.titulo}
                </Opcao>
              </li>
            ))}
          </ul>
        </>
      )}

      {passo === "pessoas" && (
        <>
          <Titulo ref={tituloRef} subtitulo="Ajuda a estimar os banhos e os carregadores de celular.">
            Quantas pessoas moram na casa?
          </Titulo>
          <div className="mt-8 flex justify-center">
            <div className="scale-125">
              <Contador valor={pessoas} aoMudar={setPessoas} min={1} max={15} rotulo="pessoas na casa" />
            </div>
          </div>
          <Botao largo className="mt-10" onClick={avancar}>
            Continuar
          </Botao>
        </>
      )}

      {passo === "comodos" && (
        <>
          <Titulo ref={tituloRef} subtitulo="Conte os cômodos da sua casa. Cada um vai ter a sua lista de aparelhos e lâmpadas.">
            Quais cômodos a sua casa tem?
          </Titulo>
          <ul className="mt-6 divide-y divide-linha rounded-[var(--radius-cartao)] bg-papel px-4">
            {COMODOS_PADRAO.map((c) => (
              <li key={c.tipo} className="flex items-center gap-3 py-3">
                <Icone nome={c.icone} className={`size-6 shrink-0 ${(quantidades[c.tipo] ?? 0) > 0 ? "text-energia" : "text-tinta-suave"}`} />
                <span className="flex-1 font-bold">{c.tipo === "quarto" ? "Quartos" : c.tipo === "banheiro" ? "Banheiros" : c.nome}</span>
                <Contador valor={quantidades[c.tipo] ?? 0} aoMudar={(v) => setQuantidades((q) => ({ ...q, [c.tipo]: v }))} min={0} max={10} rotulo={c.nome} />
              </li>
            ))}
          </ul>
          <Botao largo className="mt-6" onClick={confirmarComodos} disabled={Object.values(quantidades).every((v) => !v)}>
            Continuar com {Object.values(quantidades).reduce((s, v) => s + (v ?? 0), 0)} cômodos
          </Botao>
        </>
      )}

      {comodoAtual && (
        <>
          <p className="text-[0.98rem] font-bold text-energia">
            Cômodo {numeroComodo + 1} de {comodos.length}
          </p>
          <h1 ref={tituloRef} tabIndex={-1} className="sr-only">
            O que tem em {comodoAtual.nome}?
          </h1>
          <div className="mt-2 flex items-center gap-2 rounded-[var(--radius-controle)] border-2 border-linha bg-papel px-3 focus-within:border-energia">
            <Pencil className="size-5 shrink-0 text-tinta-suave" aria-hidden />
            <label htmlFor="nome-comodo" className="sr-only">
              Nome do cômodo
            </label>
            <input
              id="nome-comodo"
              value={comodoAtual.nome}
              maxLength={40}
              onChange={(e) => mudarComodo(comodoAtual.id, (c) => ({ ...c, nome: e.target.value }))}
              className="min-h-14 w-full bg-transparent text-[1.6rem] leading-tight font-extrabold outline-none"
            />
          </div>
          <p className="mt-2 text-tinta-suave">Toque no nome para mudar (ex.: “Quarto do casal”). Use o + e o − para dizer quantos de cada aparelho tem aqui.</p>

          <div className="mt-6">
            <BlocoIluminacao lampada={comodoAtual.lampada} aoMudar={(p) => mudarComodo(comodoAtual.id, (c) => ({ ...c, lampada: { ...c.lampada, ...p } }))} />
          </div>
          <ul className="mt-3 space-y-2">
            {comodoAtual.itens.map((item) => (
              <LinhaAparelho key={item.id} item={item} aoMudar={(p) => mudarItem(comodoAtual.id, item.id, p)} />
            ))}
          </ul>
          <button type="button" onClick={() => setSeletorPara(comodoAtual.id)} className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-full px-3 font-bold text-energia hover:bg-energia-claro">
            <Plus className="size-5" aria-hidden /> Outro aparelho
          </button>

          <div className="sticky bottom-0 -mx-4 mt-6 bg-gradient-to-t from-fundo from-70% px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Botao largo onClick={avancar}>
              {numeroComodo + 1 < comodos.length ? `Próximo: ${comodos[numeroComodo + 1]?.nome}` : "Ver o resumo dos cômodos"}
            </Botao>
          </div>
        </>
      )}

      {passo === "revisao" && (
        <>
          <Titulo ref={tituloRef} subtitulo={`${comodos.length} cômodos e ${totalAparelhos} aparelhos e lâmpadas. Confira antes de continuar.`}>
            O que tem na sua casa
          </Titulo>
          <div className="mt-6">
            <Pilulas
              rotulo="Ver"
              opcoes={[
                { valor: "comodos", rotulo: "Por cômodo" },
                { valor: "geral", rotulo: "Tudo junto" },
              ]}
              valor={visao}
              aoMudar={setVisao}
            />
          </div>

          {visao === "comodos" ? (
            <ul className="mt-6 space-y-4">
              {comodos.map((c, i) => {
                const itens = [...c.itens, c.lampada].filter((x) => x.quantidade > 0);
                return (
                  <li key={c.id} className="rounded-[var(--radius-cartao)] bg-papel p-4">
                    <div className="flex items-center gap-3">
                      <Icone nome={COMODOS_PADRAO.find((p) => p.tipo === c.tipo)?.icone} className="size-6 text-energia" />
                      <h2 className="flex-1 text-xl font-extrabold">{c.nome}</h2>
                      <button type="button" onClick={() => irPara(`comodo:${i}`)} className="min-h-11 rounded-full px-3 font-bold text-energia hover:bg-energia-claro">
                        Editar
                      </button>
                    </div>
                    {itens.length === 0 ? (
                      <p className="mt-2 text-tinta-suave">Nada cadastrado.</p>
                    ) : (
                      <ul className="mt-2 divide-y divide-linha">
                        {itens.map((x) => (
                          <li key={x.id} className="flex items-baseline justify-between gap-3 py-2">
                            <span>
                              <span className="numeros font-bold">{x.quantidade} ×</span> {x.nome}
                            </span>
                            <span className="numeros shrink-0 text-[0.95rem] text-tinta-suave">{horasPorDiaTexto(x)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-6 overflow-hidden rounded-[var(--radius-cartao)] bg-papel">
              <table className="w-full text-left">
                <thead className="border-b border-linha text-[0.9rem] text-tinta-suave">
                  <tr>
                    <th className="px-4 py-3 font-bold">Aparelho</th>
                    <th className="px-2 py-3 text-right font-bold">Total</th>
                    <th className="hidden px-4 py-3 font-bold sm:table-cell">Onde</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-linha">
                  {painelGeral.map((g) => (
                    <tr key={g.chave}>
                      <td className="px-4 py-3">
                        <span className="font-bold">{g.nome}</span>
                        <span className="block text-[0.9rem] text-tinta-suave sm:hidden">{g.porComodo.map((p) => `${casaFinal.comodos.find((c) => c.id === p.comodoId)?.nome} (${p.quantidade})`).join(", ")}</span>
                      </td>
                      <td className="numeros px-2 py-3 text-right text-lg font-extrabold">{g.quantidade}</td>
                      <td className="hidden px-4 py-3 text-tinta-suave sm:table-cell">{g.porComodo.map((p) => `${casaFinal.comodos.find((c) => c.id === p.comodoId)?.nome} (${p.quantidade})`).join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Botao largo className="mt-8" onClick={avancar} disabled={totalAparelhos === 0}>
            Continuar
          </Botao>
        </>
      )}

      {passo === "conta" && (
        <>
          <Titulo ref={tituloRef} subtitulo="Com dois números da sua última conta, o valor fica mais perto do real, porque inclui os impostos da sua cidade.">
            Tem uma conta de luz em mãos?
          </Titulo>
          <div className="mt-6 space-y-5">
            <Campo rotulo="Consumo do mês" id="conta-kwh" ajuda="Aparece como “Consumo (kWh)” ou “kWh faturado”.">
              <Entrada id="conta-kwh" inputMode="decimal" placeholder="Ex.: 150" sufixo="kWh" value={contaKwh} onChange={(e) => setContaKwh(e.target.value.replace(/[^\d,.]/g, ""))} />
            </Campo>
            <Campo rotulo="Valor total da conta" id="conta-valor" ajuda="O valor a pagar, com impostos.">
              <Entrada id="conta-valor" inputMode="decimal" placeholder="Ex.: 135,90" prefixo="R$" value={contaValor} onChange={(e) => setContaValor(e.target.value.replace(/[^\d,.]/g, ""))} />
            </Campo>
          </div>
          <div className="mt-8 flex flex-col gap-3">
            <Botao largo onClick={() => concluir(true)} disabled={!contaKwh || !contaValor}>
              Ver o resultado
            </Botao>
            <Botao largo variante="secundario" onClick={() => concluir(false)}>
              Pular, não tenho a conta agora
            </Botao>
          </div>
        </>
      )}

      </div>
      </TransicaoTela>

      <SeletorCatalogo
        aberto={Boolean(seletorPara)}
        aoFechar={() => setSeletorPara(undefined)}
        aoEscolher={(catalogoId) => {
          const id = seletorPara!;
          setSeletorPara(undefined);
          mudarComodo(id, (c) => {
            const existente = c.itens.find((i) => i.catalogoId === catalogoId && catalogoId !== "outro");
            if (existente) return { ...c, itens: c.itens.map((i) => (i.id === existente.id ? { ...i, quantidade: Math.max(1, i.quantidade) } : i)) };
            return { ...c, itens: [...c.itens, itemDoCatalogoParaComodo(catalogoId)] };
          });
        }}
      />
    </Moldura>
  );
}

function Moldura({ children, progresso }: { children: React.ReactNode; progresso?: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-4 pt-4 pb-10 sm:px-6">
      <header className="flex items-center justify-between">
        <Marca />
      </header>
      {progresso && <div className="mt-6">{progresso}</div>}
      <main className="mt-6">{children}</main>
    </div>
  );
}

function Titulo({ children, subtitulo, ref }: { children: React.ReactNode; subtitulo?: React.ReactNode; ref: React.Ref<HTMLHeadingElement> }) {
  return (
    <div>
      <h1 ref={ref} tabIndex={-1} className="text-[clamp(1.85rem,6vw,2.4rem)] leading-tight font-extrabold tracking-tight outline-none">
        {children}
      </h1>
      {subtitulo && <p className="mt-2 max-w-[52ch] text-lg text-tinta-suave">{subtitulo}</p>}
    </div>
  );
}

function Carregando() {
  return (
    <div className="mt-6 space-y-2" aria-busy aria-label="Carregando">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-[var(--radius-controle)] bg-papel" />
      ))}
    </div>
  );
}
