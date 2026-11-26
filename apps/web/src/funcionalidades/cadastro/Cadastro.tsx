"use client";

import { ArrowLeft, Building2, ChevronDown, CircleHelp, ClipboardCheck, HeartHandshake, House, MapPin, Pencil, Plus, ReceiptText, Users, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { addTransitionType, startTransition, useEffect, useMemo, useRef, useState } from "react";
import { agregarAparelhos, COMODOS_PADRAO, consumoMensalDaCasaKwh, distribuidorasDaCidade, ehUf, ESTADOS, LIMITES, LIMITES_DE_TEXTO, type Beneficio, type ContaReferencia, type Distribuidora, type Municipio, type TipoComodo } from "@ee/core";
import { useAvisoDaCasaSalva, useCasa, useCasaCarregada } from "@/aplicacao/casa";
import { pedirConviteDaConta } from "@/aplicacao/convite-da-conta";
import { useMunicipios, useTarifas } from "@/aplicacao/dados-publicos";
import { nomeDistribuidora } from "@/aplicacao/resumo";
import { useLeitura } from "@/aplicacao/useLeitura";
import { contarUso } from "@/aplicacao/uso";
import { BlocoIluminacao } from "@/ui/aparelho/BlocoIluminacao";
import { LinhaAparelho } from "@/ui/aparelho/LinhaAparelho";
import { SeletorCatalogo } from "@/ui/aparelho/SeletorCatalogo";
import { horasPorDiaTexto } from "@/ui/aparelho/textosDeUso";
import type { ItemComodo } from "@/ui/aparelho/tipos";
import { AvisoConsumoAlto } from "@/ui/AvisoConsumoAlto";
import { AvisoDaCasaSalva } from "@/ui/AvisoDaCasaSalva";
import { AvisoFalhaDeCarga } from "@/ui/AvisoFalhaDeCarga";
import { Botao, BotaoLink } from "@/ui/Botao";
import { BuscaCidade } from "@/ui/BuscaCidade";
import { CamposDaConta } from "@/ui/conta/CamposDaConta";
import { ExemploDeConta } from "@/ui/conta/ExemploDeConta";
import { useCamposDaConta } from "@/ui/conta/useCamposDaConta";
import { Contador } from "@/ui/Contador";
import { ExplicaKwh } from "@/ui/ExplicaKwh";
import { Icone } from "@/ui/Icone";
import { Interruptor } from "@/ui/Interruptor";
import { Marca } from "@/ui/Marca";
import { TransicaoTela } from "@/ui/Movimento";
import { Opcao } from "@/ui/Opcao";
import { Pilulas } from "@/ui/Pilulas";
import { ENTRAR_NO_PAINEL } from "@/ui/tiposDeTransicao";
import { NADA_SAI_DA_CASA, textoDoPasso } from "./porQuePerguntamos";
import { ajustarComodos, itemDoCatalogoParaComodo, rascunhoParaCasa, type ComodoRascunho } from "./rascunho";

type Passo = "estado" | "cidade" | "distribuidora" | "beneficio" | "pessoas" | "comodos" | `comodo:${number}` | "revisao" | "conta";

const BENEFICIOS: { id: Beneficio; titulo: string; descricao: string }[] = [
  { id: "tarifa-social", titulo: "Sim, tenho Tarifa Social", descricao: "Renda de até meio salário mínimo por pessoa, BPC, ou aparelho de saúde em casa." },
  { id: "desconto-social", titulo: "Sim, com renda até 1 salário mínimo por pessoa", descricao: "Renda entre meio e 1 salário mínimo por pessoa." },
  { id: "nenhum", titulo: "Não", descricao: "Conta com a tarifa normal." },
  { id: "nao-sei", titulo: "Não sei", descricao: "Sem problema. Depois mostramos como descobrir." },
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
  const camposDaConta = useCamposDaConta({ uso: "cadastro", beneficio, ids: { kwh: "conta-kwh", valor: "conta-valor" } });
  const [recomecar, setRecomecar] = useState(false);
  // Enquanto o painel abre, continua mostrando o último passo (e não "você já cadastrou").
  const [concluindo, setConcluindo] = useState(false);
  const tituloRef = useRef<HTMLHeadingElement>(null);

  const municipios = useMunicipios(uf);
  // distribuidorasDaCidade troca o id de uma empresa que saiu do arquivo pelo de hoje (HIS-111): serve também para um
  // municipios/{UF}.json antigo no cache, que ainda traga rge-sul.
  const daCidade: Distribuidora[] = useMemo(
    () => (tarifas.dados && municipio ? distribuidorasDaCidade(tarifas.dados, municipio.distribuidoras) : []),
    [tarifas.dados, municipio],
  );

  const opcoesDistribuidora: Distribuidora[] = useMemo(() => {
    if (!tarifas.dados) return [];
    if (daCidade.length > 0) return daCidade;
    const doEstado = distribuidorasDaCidade(tarifas.dados, tarifas.dados.estados.find((e) => e.uf === uf)?.distribuidoras ?? []);
    return doEstado.length > 0 ? doEstado : tarifas.dados.distribuidoras;
  }, [tarifas.dados, daCidade, uf]);

  const pulaDistribuidora = daCidade.length === 1;
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
    // Perto do fim, já busca o painel (dados e código). Sem isso, a navegação do concluir para (suspende) esperando
    // o código de /casa; o React roda nesse meio-tempo uma lane adiada que consome os tipos de transição da raiz, e o
    // painel entra sem a animação "entrar-painel" (DEF-002b-1, causa medida na HIS-002b).
    if (p === "revisao" || p === "conta") router.prefetch("/casa");
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
    const validas = tarifas.dados ? distribuidorasDaCidade(tarifas.dados, m.distribuidoras) : [];
    const [unica] = validas;
    if (validas.length === 1 && unica) {
      setDistribuidoraId(unica.id);
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

  /** Sem conta, a pessoa pulou. Com conta, ela já passou pelo `conferir()` (o store só recebe valor que ele aceita). */
  const concluir = (contaReferencia?: ContaReferencia) => {
    if (!uf || !municipio || !distribuidoraId || !beneficio) return;
    setConcluindo(true);
    criarCasa({
      residencia: {
        uf,
        municipioIbge: municipio.ibge,
        municipioNome: municipio.nome,
        distribuidoraId,
        beneficio,
        ligacao: "nao-sei",
        pessoas,
        contaReferencia,
      },
      ...casaFinal,
    });
    // Na tela da casa, o convite para criar conta aparece uma vez (só se o site tem conta e a pessoa está sem).
    pedirConviteDaConta();
    contarUso("cadastro-concluido");
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
      {/* T2: os dois ficam montados (sem falha não mostram nada) para levar o foco ao título quando voltar a dar certo. */}
      <div className="mb-6 empty:hidden">
        <AvisoFalhaDeCarga
          assunto={{ tipo: "precos" }}
          fraseDeSeguranca="Suas respostas não se perdem."
          falhasSeguidas={tarifas.falhasSeguidas}
          semInternet={tarifas.semInternet}
          carregando={tarifas.carregando}
          aoTentarDeNovo={tarifas.tentarDeNovo}
        />
      </div>
      <div className="mb-6 empty:hidden">
        <AvisoFalhaDeCarga
          assunto={{ tipo: "cidades", estado: ehUf(uf) ? ESTADOS[uf] : "" }}
          fraseDeSeguranca="Suas respostas não se perdem."
          falhasSeguidas={municipios.falhasSeguidas}
          semInternet={municipios.semInternet}
          carregando={municipios.carregando}
          aoTentarDeNovo={municipios.tentarDeNovo}
        />
      </div>

      {passo === "estado" && (
        <>
          <Titulo ref={tituloRef} icone={<MapPin />} porque={textoDoPasso(passo)} subtitulo="Para achar o preço da luz da sua região.">
            Em qual estado você mora?
          </Titulo>
          {tarifas.carregando && !tarifas.dados ? (
            <Carregando />
          ) : (
            <div className="mt-6 space-y-5">
              <label htmlFor="estado" className="block font-bold">
                Estado
              </label>
              <div className="relative -mt-3">
                <select
                  id="estado"
                  value={uf ?? ""}
                  onChange={(e) => {
                    if (uf !== e.target.value) setMunicipio(undefined);
                    setUf(e.target.value || undefined);
                  }}
                  className="min-h-14 w-full appearance-none rounded-[var(--radius-controle)] border-2 border-linha bg-papel py-3 pr-12 pl-4 text-lg font-bold focus:border-energia"
                >
                  <option value="" disabled>
                    Escolha o seu estado
                  </option>
                  {estados.map((e) => (
                    <option key={e.uf} value={e.uf}>
                      {e.nome} ({e.uf})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-6 -translate-y-1/2 text-tinta-suave" aria-hidden />
              </div>
              <Botao largo onClick={() => irPara("cidade", "adiante")} disabled={!uf}>
                Continuar
              </Botao>
            </div>
          )}
        </>
      )}

      {passo === "cidade" && (
        <>
          <Titulo ref={tituloRef} icone={<Building2 />} porque={textoDoPasso(passo)} subtitulo={estados.find((e) => e.uf === uf)?.nome}>
            Qual é a sua cidade?
          </Titulo>
          {municipios.carregando ? <Carregando /> : <BuscaCidade municipios={municipios.dados?.municipios ?? []} selecionado={municipio} aoEscolher={escolherMunicipio} />}
        </>
      )}

      {passo === "distribuidora" && (
        <>
          <Titulo ref={tituloRef} icone={<Zap />} porque={textoDoPasso(passo)} subtitulo="O nome está no alto da conta de luz.">
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
          <Titulo ref={tituloRef} icone={<HeartHandshake />} porque={textoDoPasso(passo)} subtitulo="Quem tem, paga menos na luz.">
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
          <Titulo ref={tituloRef} icone={<Users />} porque={textoDoPasso(passo)} subtitulo="Contando você.">
            Quantas pessoas moram na casa?
          </Titulo>
          <div className="mt-8 flex justify-center">
            <div className="scale-125">
              <Contador valor={pessoas} aoMudar={setPessoas} min={LIMITES.pessoas.min} max={LIMITES.pessoas.max} rotulo="pessoas na casa" />
            </div>
          </div>
          <Botao largo className="mt-10" onClick={avancar}>
            Continuar
          </Botao>
        </>
      )}

      {passo === "comodos" && (
        <>
          <Titulo ref={tituloRef} icone={<House />} porque={textoDoPasso(passo)} subtitulo="Toque no + para cada cômodo.">
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
              maxLength={LIMITES_DE_TEXTO.nomeComodo}
              onChange={(e) => mudarComodo(comodoAtual.id, (c) => ({ ...c, nome: e.target.value }))}
              className="min-h-14 w-full bg-transparent text-[1.6rem] leading-tight font-extrabold outline-none"
            />
          </div>
          <p className="mt-2 text-tinta-suave">Use + e − em cada aparelho. Toque no nome para mudar.</p>
          <PorQuePerguntamos {...textoDoPasso(passo)} />

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
          <Titulo ref={tituloRef} icone={<ClipboardCheck />} porque={textoDoPasso(passo)} subtitulo={`${comodos.length} cômodos e ${totalAparelhos} aparelhos e lâmpadas.`}>
            O que tem na sua casa
          </Titulo>
          <AvisoConsumoAlto
            className="mt-6"
            kwhMes={consumoMensalDaCasaKwh(casaFinal.aparelhos)}
            acao={
              <Botao variante="secundario" onClick={() => irPara("comodo:0")}>
                Ver meus aparelhos
              </Botao>
            }
          />
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
          <Titulo ref={tituloRef} icone={<ReceiptText />} porque={textoDoPasso(passo)} subtitulo="Com dois números dela, o valor fica mais certinho.">
            Tem uma conta de luz em mãos?
          </Titulo>
          {/* Erro e "Confere?" ficam aqui no passo, nunca no painel "Por que perguntamos" (regra 5 do /comecar na 112). */}
          <ExemploDeConta className="mt-6" />
          {/* Antes dos campos: do valor, o Tab vai direto para "Ver o resultado" (a mensagem de erro espera o botão). */}
          <ExplicaKwh className="mt-3 text-center" />
          <CamposDaConta
            className="mt-6 space-y-5"
            campos={camposDaConta}
            textos={{ consumo: "Consumo do mês (kWh)", ajudaDoConsumo: "É o número 1 do exemplo.", valor: "Total a pagar", ajudaDoValor: "É o número 2 do exemplo." }}
          />
          <div className="mt-8 flex flex-col gap-3">
            {/* Sempre habilitado (T5): botão desabilitado não diz o que falta. */}
            <Botao
              largo
              onClick={() => {
                const conta = camposDaConta.conferir();
                if (conta) concluir(conta);
              }}
            >
              Ver o resultado
            </Botao>
            <Botao largo variante="secundario" onClick={() => concluir()}>
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

/** T1 no /comecar: o cadastro também lê a casa salva, e esta pode ser a primeira tela que a pessoa abre. */
function AvisoDaCasaNoCadastro() {
  const { aviso, dispensar } = useAvisoDaCasaSalva();
  return <AvisoDaCasaSalva aviso={aviso} aoEntender={dispensar} className="mb-6" />;
}

/**
 * O passo fica no centro, até 34rem, em qualquer largura. O "Por que perguntamos" virou um botão que abre embaixo do
 * título (antes era um painel à direita só no computador, HIS-112 L7).
 */
function Moldura({ children, progresso }: { children: React.ReactNode; progresso?: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-4 pt-4 pb-10 sm:px-6 lg:max-w-[75rem] lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Marca />
        <LetraMaior />
      </header>
      {/* Fluxo no centro da tela, em uma coluna, no celular e no computador (pedido do responsável, 25/11). */}
      {progresso && <div className="mx-auto mt-6 max-w-[34rem]">{progresso}</div>}
      <main className="mx-auto mt-6 max-w-[34rem]">
        <AvisoDaCasaNoCadastro />
        {children}
      </main>
    </div>
  );
}

function PorQuePerguntamos({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <details className="group mx-auto mt-2 w-fit max-w-full text-left">
      <summary className="mx-auto flex min-h-11 w-fit cursor-pointer list-none items-center gap-1.5 rounded-full px-3 font-bold text-energia hover:bg-energia-claro [&::-webkit-details-marker]:hidden">
        <CircleHelp className="size-5" aria-hidden /> {titulo}
      </summary>
      <div className="mt-2 rounded-[var(--radius-controle)] bg-energia-claro px-4 py-3">
        <p>{texto}</p>
        <p className="mt-2 text-[0.95rem] text-tinta-suave">{NADA_SAI_DA_CASA}</p>
      </div>
    </details>
  );
}

/** Quem ainda não cadastrou não chega a Minha casa: a letra maior fica também no topo do cadastro (HIS-102). */
function LetraMaior() {
  const [leitura, mudar] = useLeitura();
  return <Interruptor rotulo="Letra maior" ligado={leitura.letraMaior} aoMudar={(letraMaior) => mudar({ letraMaior })} />;
}

function Titulo({
  children,
  subtitulo,
  icone,
  porque,
  ref,
}: {
  children: React.ReactNode;
  subtitulo?: React.ReactNode;
  icone?: React.ReactNode;
  porque?: { titulo: string; texto: string };
  ref: React.Ref<HTMLHeadingElement>;
}) {
  return (
    <div className="text-center">
      {icone && (
        <span aria-hidden className="surgir mx-auto mb-4 grid size-16 place-items-center rounded-full bg-energia-claro text-energia [&>svg]:size-8">
          {icone}
        </span>
      )}
      <h1 ref={ref} tabIndex={-1} className="text-[clamp(1.85rem,6vw,2.4rem)] leading-tight font-extrabold tracking-tight [text-wrap:balance] outline-none">
        {children}
      </h1>
      {subtitulo && <p className="mx-auto mt-2 max-w-[40ch] text-lg text-tinta-suave">{subtitulo}</p>}
      {porque && <PorQuePerguntamos {...porque} />}
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
