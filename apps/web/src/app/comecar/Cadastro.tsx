"use client";

import { itemDoCatalogo, type Beneficio, type Distribuidora, type Municipio } from "@ee/core";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { BuscaCidade } from "@/components/BuscaCidade";
import { Icone } from "@/components/Icone";
import { Marca } from "@/components/Marca";
import { Aviso, Botao, BotaoLink, Campo, Contador, Entrada, Opcao } from "@/components/ui";
import { useMunicipios, useTarifas } from "@/lib/dados";
import { nomeDistribuidora } from "@/lib/resumo";
import { useCasa, useCasaCarregada } from "@/lib/store";

type Passo = "estado" | "cidade" | "distribuidora" | "beneficio" | "aparelhos" | "conta";

const semAcento = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/** Aparelhos que aparecem já na primeira tela — os mais comuns nas casas brasileiras. */
const APARELHOS_INICIAIS = [
  "chuveiro",
  "geladeira",
  "tv-pequena",
  "ventilador",
  "lampada-led",
  "maquina-lavar",
  "micro-ondas",
  "ferro",
  "carregador-celular",
  "roteador",
  "ar-condicionado",
  "computador",
];

const BENEFICIOS: { id: Beneficio; titulo: string; descricao: string }[] = [
  { id: "tarifa-social", titulo: "Sim, tenho Tarifa Social", descricao: "Família no CadÚnico com renda de até meio salário mínimo por pessoa, ou alguém recebe o BPC." },
  { id: "desconto-social", titulo: "Sim, com renda até 1 salário mínimo por pessoa", descricao: "Família no CadÚnico com renda entre meio e um salário mínimo por pessoa." },
  { id: "nenhum", titulo: "Não", descricao: "A conta vem com a tarifa normal." },
  { id: "nao-sei", titulo: "Não sei", descricao: "Sem problema. No fim mostramos como descobrir se você tem direito." },
];

export function Cadastro() {
  const router = useRouter();
  const carregada = useCasaCarregada();
  const jaTemCasa = useCasa((s) => Boolean(s.residencia));
  const definirResidencia = useCasa((s) => s.definirResidencia);
  const adicionarDoCatalogo = useCasa((s) => s.adicionarDoCatalogo);
  const apagarTudo = useCasa((s) => s.apagarTudo);

  const tarifas = useTarifas();
  const [passo, setPasso] = useState<Passo>("estado");
  const [uf, setUf] = useState<string>();
  const [municipio, setMunicipio] = useState<Municipio>();
  const [distribuidoraId, setDistribuidoraId] = useState<string>();
  const [beneficio, setBeneficio] = useState<Beneficio>();
  const [pessoas, setPessoas] = useState(3);
  const [lampadas, setLampadas] = useState(5);
  const [escolhidos, setEscolhidos] = useState<string[]>(["chuveiro", "geladeira", "tv-pequena", "lampada-led", "carregador-celular"]);
  const [contaKwh, setContaKwh] = useState("");
  const [contaValor, setContaValor] = useState("");
  const [recomecar, setRecomecar] = useState(false);
  const tituloRef = useRef<HTMLHeadingElement>(null);

  const municipios = useMunicipios(uf);

  const distribuidorasPorId = useMemo(() => new Map((tarifas.dados?.distribuidoras ?? []).map((d) => [d.id, d])), [tarifas.dados]);

  /** Distribuidoras para escolher quando a cidade tem mais de uma (ou nenhuma conhecida). */
  const opcoesDistribuidora: Distribuidora[] = useMemo(() => {
    if (!tarifas.dados) return [];
    const daCidade = (municipio?.distribuidoras ?? []).map((id) => distribuidorasPorId.get(id)).filter((d): d is Distribuidora => Boolean(d));
    if (daCidade.length > 0) return daCidade;
    const doEstado = tarifas.dados.estados.find((e) => e.uf === uf)?.distribuidoras ?? [];
    const lista = doEstado.map((id) => distribuidorasPorId.get(id)).filter((d): d is Distribuidora => Boolean(d));
    return lista.length > 0 ? lista : tarifas.dados.distribuidoras;
  }, [tarifas.dados, municipio, uf, distribuidorasPorId]);

  const ordem: Passo[] = ["estado", "cidade", "distribuidora", "beneficio", "aparelhos", "conta"];
  const pulaDistribuidora = municipio !== undefined && municipio.distribuidoras.filter((id) => distribuidorasPorId.has(id)).length === 1;
  const passosVisiveis = ordem.filter((p) => !(p === "distribuidora" && pulaDistribuidora));
  const indice = passosVisiveis.indexOf(passo);

  // Leva o foco para o título a cada passo (ajuda quem usa leitor de tela).
  useEffect(() => {
    tituloRef.current?.focus();
  }, [passo]);

  const irPara = (p: Passo) => {
    setPasso(p);
    window.scrollTo({ top: 0 });
  };
  const avancar = () => {
    const prox = passosVisiveis[indice + 1];
    if (prox) irPara(prox);
  };
  const voltar = () => {
    const ant = passosVisiveis[indice - 1];
    if (ant) irPara(ant);
    else router.push("/");
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

  const concluir = (usarConta: boolean) => {
    if (!uf || !municipio || !distribuidoraId || !beneficio) return;
    const kwh = usarConta ? Number(contaKwh.replace(",", ".")) : 0;
    const valor = usarConta ? Number(contaValor.replace(/\./g, "").replace(",", ".")) : 0;
    definirResidencia({
      uf,
      municipioIbge: municipio.ibge,
      municipioNome: municipio.nome,
      distribuidoraId,
      beneficio,
      ligacao: "nao-sei",
      contaReferencia: kwh > 0 && valor > 0 ? { kwh, valor } : undefined,
    });
    for (const id of escolhidos) {
      if (id === "chuveiro") {
        const banho = { banhosPorDia: pessoas, minutosPorBanho: 8 };
        adicionarDoCatalogo(id, { banho, minutosPorDia: banho.banhosPorDia * banho.minutosPorBanho });
      } else if (id === "lampada-led") {
        adicionarDoCatalogo(id, { quantidade: lampadas });
      } else if (id === "carregador-celular") {
        adicionarDoCatalogo(id, { quantidade: Math.max(1, pessoas) });
      } else {
        adicionarDoCatalogo(id);
      }
    }
    router.push("/casa");
  };

  if (carregada && jaTemCasa && !recomecar) {
    return (
      <Moldura>
        <h1 className="text-[2rem] leading-tight font-extrabold">Você já cadastrou a sua casa</h1>
        <p className="mt-3 text-lg text-tinta-suave">Seus aparelhos estão guardados neste aparelho. Para mudar a cidade ou o benefício, use “Minha casa”.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <BotaoLink href="/casa">Ver a minha casa</BotaoLink>
          <Botao variante="perigo" onClick={() => setRecomecar(true)}>
            Apagar e começar do zero
          </Botao>
        </div>
      </Moldura>
    );
  }
  if (recomecar && jaTemCasa) {
    return (
      <Moldura>
        <h1 className="text-[2rem] leading-tight font-extrabold">Apagar tudo e começar de novo?</h1>
        <p className="mt-3 text-lg text-tinta-suave">A cidade, os cômodos e todos os aparelhos cadastrados serão apagados deste aparelho.</p>
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

  return (
    <Moldura
      progresso={
        <div className="flex items-center gap-3">
          <button type="button" onClick={voltar} className="inline-flex min-h-11 items-center gap-1.5 rounded-full pr-3 font-bold text-energia hover:bg-energia-claro">
            <ArrowLeft className="size-5" /> Voltar
          </button>
          <div className="flex-1">
            <div className="h-2 overflow-hidden rounded-full bg-linha" aria-hidden>
              <div className="h-full rounded-full bg-energia transition-[width] duration-300" style={{ width: `${((indice + 1) / passosVisiveis.length) * 100}%` }} />
            </div>
          </div>
          <span className="numeros text-[0.95rem] font-bold text-tinta-suave">
            {indice + 1} de {passosVisiveis.length}
          </span>
        </div>
      }
    >
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
                    irPara("aparelhos");
                  }}
                >
                  {b.titulo}
                </Opcao>
              </li>
            ))}
          </ul>
        </>
      )}

      {passo === "aparelhos" && (
        <>
          <Titulo ref={tituloRef} subtitulo="Marque o que tem na sua casa. Depois dá para ajustar o tempo de uso de cada um e incluir outros.">
            Quais aparelhos você tem?
          </Titulo>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-controle)] bg-papel px-4 py-3">
            <span className="font-bold">Quantas pessoas moram na casa?</span>
            <Contador valor={pessoas} aoMudar={setPessoas} min={1} max={15} rotulo="pessoas na casa" />
          </div>
          <ul className="mt-4 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
            {APARELHOS_INICIAIS.map((id) => {
              const item = itemDoCatalogo(id)!;
              const marcado = escolhidos.includes(id);
              return (
                <li key={id}>
                  <Opcao
                    papel="checkbox"
                    selecionada={marcado}
                    icone={<Icone nome={item.icone} className="size-7" />}
                    onClick={() => setEscolhidos((s) => (marcado ? s.filter((x) => x !== id) : [...s, id]))}
                  >
                    {id === "lampada-led" ? "Lâmpadas de LED" : item.nome}
                  </Opcao>
                  {id === "lampada-led" && marcado && (
                    <div className="mt-1 flex items-center justify-between gap-3 rounded-[var(--radius-controle)] bg-papel px-4 py-2">
                      <span className="font-bold">Quantas?</span>
                      <Contador valor={lampadas} aoMudar={setLampadas} min={1} max={60} rotulo="lâmpadas" />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="sticky bottom-0 -mx-4 mt-6 bg-gradient-to-t from-fundo from-70% px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Botao largo onClick={avancar} disabled={escolhidos.length === 0}>
              Continuar com {escolhidos.length} {escolhidos.length === 1 ? "aparelho" : "aparelhos"}
            </Botao>
          </div>
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
            <Botao
              largo
              variante="secundario"
              onClick={() => concluir(false)}
            >
              Pular, não tenho a conta agora
            </Botao>
          </div>
        </>
      )}
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

const Titulo = function Titulo({ children, subtitulo, ref }: { children: React.ReactNode; subtitulo?: React.ReactNode; ref: React.Ref<HTMLHeadingElement> }) {
  return (
    <div>
      <h1 ref={ref} tabIndex={-1} className="text-[clamp(1.85rem,6vw,2.4rem)] leading-tight font-extrabold tracking-tight outline-none">
        {children}
      </h1>
      {subtitulo && <p className="mt-2 max-w-[52ch] text-lg text-tinta-suave">{subtitulo}</p>}
    </div>
  );
};

function Carregando() {
  return (
    <div className="mt-6 space-y-2" aria-busy aria-label="Carregando">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-[var(--radius-controle)] bg-papel" />
      ))}
    </div>
  );
}
