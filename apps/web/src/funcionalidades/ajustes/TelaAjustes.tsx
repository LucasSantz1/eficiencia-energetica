"use client";

import { ChevronDown, Download } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { distribuidorasDaCidade, ehUf, ESTADOS, formatarReais, precoKwh, type ArquivoParaBusca, type Beneficio, type ContaReferencia, type Ligacao, type Municipio } from "@ee/core";
import { useCasa } from "@/aplicacao/casa";
import { useConta } from "@/aplicacao/conta-estado";
import { useMunicipios } from "@/aplicacao/dados-publicos";
import { baixarMeusDados } from "@/aplicacao/exportar";
import { apagarPreferenciaDeLeitura } from "@/aplicacao/leitura";
import { apagarMarcasDeOpiniao } from "@/aplicacao/opiniao";
import { nomeDistribuidora, useResumo } from "@/aplicacao/resumo";
import { Aviso } from "@/ui/Aviso";
import { AvisoFalhaDeCarga } from "@/ui/AvisoFalhaDeCarga";
import { Botao } from "@/ui/Botao";
import { BuscaCidade } from "@/ui/BuscaCidade";
import { Campo } from "@/ui/Campo";
import { CamposDaConta } from "@/ui/conta/CamposDaConta";
import { ExemploDeConta } from "@/ui/conta/ExemploDeConta";
import { useCamposDaConta, type CamposDaContaEstado } from "@/ui/conta/useCamposDaConta";
import { Folha } from "@/ui/Folha";
import { Opcao } from "@/ui/Opcao";
import { NavegacaoDosAjustes } from "./NavegacaoDosAjustes";
import { SecaoConta } from "./SecaoConta";
import { SecaoContagem } from "./SecaoContagem";
import { GrupoDeAjustes, SecaoDeAjuste } from "./SecaoDeAjuste";
import { SecaoInstalar } from "./SecaoInstalar";
import { SecaoLeitura } from "./SecaoLeitura";

const BENEFICIOS: { id: Beneficio; titulo: string; descricao: string }[] = [
  { id: "tarifa-social", titulo: "Tarifa Social", descricao: "CadÚnico com renda de até meio salário mínimo por pessoa, BPC, ou CadÚnico com renda de até 3 salários mínimos e alguém que precisa de aparelho elétrico para a saúde. A energia dos primeiros 80 kWh é de graça." },
  { id: "desconto-social", titulo: "Desconto Social", descricao: "CadÚnico com renda entre meio e um salário mínimo por pessoa. Desconto até 120 kWh." },
  { id: "nenhum", titulo: "Não tenho benefício", descricao: "A conta vem com a tarifa normal." },
  { id: "nao-sei", titulo: "Não sei", descricao: "Calculamos com a tarifa normal." },
];

const LIGACOES: { id: Ligacao; titulo: string; descricao: string }[] = [
  { id: "monofasica", titulo: "Monofásica", descricao: "A mais comum em casas. A conta mínima é de 30 kWh." },
  { id: "bifasica", titulo: "Bifásica", descricao: "A conta mínima é de 50 kWh." },
  { id: "trifasica", titulo: "Trifásica", descricao: "Comum em casas com muitos aparelhos fortes. A conta mínima é de 100 kWh." },
  { id: "nao-sei", titulo: "Não sei", descricao: "Consideramos monofásica. O tipo aparece na conta de luz." },
];

export function TelaAjustes() {
  const { residencia, arquivo, distribuidora } = useResumo();
  const atualizar = useCasa((s) => s.atualizarResidencia);
  const definirResidencia = useCasa((s) => s.definirResidencia);
  const temCasaSemCidade = useCasa((s) => s.comodos.length > 0 || s.aparelhos.length > 0);
  const [mudandoCidade, setMudandoCidade] = useState(false);
  // A chave muda só quando a pessoa volta para a tarifa da ANEEL: aí os campos ficam em branco de novo.
  const [chaveDaConta, setChaveDaConta] = useState(0);
  const camposDaConta = useCamposDaConta({ uso: "ajustes", beneficio: residencia?.beneficio, ids: { kwh: "aj-kwh", valor: "aj-valor", iluminacao: "aj-cip" }, inicial: chaveDaConta === 0 ? residencia?.contaReferencia : undefined, chave: chaveDaConta });
  const [contaSalva, setContaSalva] = useState(false);
  const conta = useConta();
  // "Conta e família" só existe quando o site tem conta (sem as variáveis, a seção some, e o atalho também).
  const contaVisivel = conta.tipo !== "desligada" && conta.tipo !== "carregando";
  const itensDoIndice = useMemo(
    () => [
      { id: "ajustes-casa", nome: "A casa" },
      { id: "ajustes-conta-de-luz", nome: "Conta de luz" },
      ...(contaVisivel ? [{ id: "ajustes-conta", nome: "Conta e família" }] : []),
      { id: "ajustes-aparelho", nome: "Neste aparelho" },
      { id: "ajustes-dados", nome: "Privacidade" },
    ],
    [contaVisivel],
  );

  const municipios = useMunicipios(residencia?.uf);
  const municipioAtual = municipios.dados?.municipios.find((m) => m.ibge === residencia?.municipioIbge);
  // Com o id de hoje no lugar do antigo (HIS-111): um municipios/{UF}.json antigo no cache ainda pode trazer rge-sul.
  const opcoesDistribuidora = arquivo && municipioAtual ? distribuidorasDaCidade(arquivo, municipioAtual.distribuidoras) : [];

  if (!residencia) {
    // T1b: a cidade saiu e os aparelhos ficaram. Só "Onde você mora"; a escolha cria a residência de novo, sem apagar
    // os aparelhos (o /comecar apagaria, D5). Benefício e ligação voltam para "não sei" até a pessoa escolher.
    return (
      <div className="space-y-6">
          <h1 className="text-[2rem] leading-tight font-extrabold tracking-tight">Minha casa</h1>
          {temCasaSemCidade && (
            <SecaoDeAjuste titulo="Onde você mora" id="onde-mora" descricao="A cidade e a empresa de luz decidem o preço do kWh.">
              <Botao onClick={() => setMudandoCidade(true)}>Escolher minha cidade</Botao>
            </SecaoDeAjuste>
          )}
          <SecaoLeitura />
          <SeusDados />
          <TrocarCidade
            aberta={mudandoCidade}
            aoFechar={() => setMudandoCidade(false)}
            estados={arquivo?.estados ?? []}
            arquivo={arquivo}
            aoEscolher={(m, distribuidoraId) => {
              definirResidencia({ uf: m.uf, municipioIbge: m.ibge, municipioNome: m.nome, distribuidoraId, beneficio: "nao-sei", ligacao: "nao-sei" });
              setMudandoCidade(false);
            }}
          />
        </div>
      );
    }

    // "Conta salva" só quando a tela conferiu (T5/T6) e o store aceitou: desde a 003a ele recusa em silêncio.
    const salvarConta = () => {
      const conta = camposDaConta.conferir();
      if (!conta) return setContaSalva(false);
      atualizar({ contaReferencia: conta });
      setContaSalva(mesmaConta(useCasa.getState().residencia?.contaReferencia, conta));
    };

    // Redesenho de 26/11 (pedido do dono): no computador, o índice fixo à esquerda e os cartões numa coluna só, com o
    // título à esquerda e os controles à direita. A ordem do código é a do celular (HIS-112, critério 8).
    return (
      <div>
        <h1 className="text-[2rem] leading-tight font-extrabold tracking-tight">Minha casa</h1>
        <div className="mt-5 lg:mt-8 lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-10">
          <NavegacaoDosAjustes itens={itensDoIndice} />
          <div className="mt-8 space-y-10 lg:mt-0">
            <GrupoDeAjustes id="ajustes-casa" nome="A casa">
              <SecaoDeAjuste titulo="Onde você mora" id="onde-mora" descricao="A cidade e a empresa de luz decidem o preço do kWh.">
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-controle)] bg-fundo px-4 py-4">
                  <div className="min-w-0">
                    <p className="text-lg font-extrabold">
                      {residencia.municipioNome} – {residencia.uf}
                    </p>
                    <p className="text-tinta-suave">
                      Distribuidora: {nomeDistribuidora(distribuidora)}
                      {distribuidora && `, tarifa de ${formatarReais(distribuidora.tarifaKwh)} por kWh sem impostos`}
                    </p>
                  </div>
                  <Botao variante="secundario" onClick={() => setMudandoCidade(true)}>
                    Mudar cidade
                  </Botao>
                </div>
                {opcoesDistribuidora.length > 1 && (
                  <div className="mt-5 space-y-2">
                    <p className="font-bold">Mais de uma empresa atende a sua cidade. Qual manda a sua conta?</p>
                    {opcoesDistribuidora.map((d) => (
                      <Opcao key={d.id} selecionada={residencia.distribuidoraId === d.id} onClick={() => atualizar({ distribuidoraId: d.id })} descricao={`${formatarReais(d.tarifaKwh)} por kWh, sem impostos`}>
                        {nomeDistribuidora(d)}
                      </Opcao>
                    ))}
                  </div>
                )}
              </SecaoDeAjuste>

              <SecaoDeAjuste titulo="Benefício na conta de luz" id="beneficio" descricao="A Tarifa Social e o Desconto Social baixam o preço da energia.">
                <div className="space-y-2">
                  {BENEFICIOS.map((b) => (
                    <Opcao key={b.id} selecionada={residencia.beneficio === b.id} onClick={() => atualizar({ beneficio: b.id })} descricao={b.descricao}>
                      {b.titulo}
                    </Opcao>
                  ))}
                </div>
                <p className="mt-3 text-[0.95rem] text-tinta-suave">Para ter direito, a família precisa estar no CadÚnico. A inscrição é feita no CRAS da sua cidade. O desconto vem sozinho quando o CadÚnico está em dia e a conta está no nome de alguém da família. Quem precisa de aparelho para a saúde pede na distribuidora, com atestado médico.</p>
                {/* Sem prefetch: a Minha casa não baixa o guia a cada visita (tech-lead, HIS-103b). */}
                <p className="mt-2">
                  <Link href="/tarifa-social" prefetch={false} transitionTypes={["nav-forward"]} className="inline-flex min-h-11 items-center font-bold text-energia underline underline-offset-4">
                    Ver se pode ter direito
                  </Link>
                </p>
              </SecaoDeAjuste>

              <SecaoDeAjuste titulo="Tipo de ligação" id="ligacao" descricao="Decide a conta mínima do mês, mesmo gastando pouco.">
                <div className="space-y-2">
                  {LIGACOES.map((l) => (
                    <Opcao key={l.id} selecionada={residencia.ligacao === l.id} onClick={() => atualizar({ ligacao: l.id })} descricao={l.descricao}>
                      {l.titulo}
                    </Opcao>
                  ))}
                </div>
              </SecaoDeAjuste>
            </GrupoDeAjustes>

            <GrupoDeAjustes id="ajustes-conta-de-luz" nome="Conta de luz">
              <SecaoDeAjuste titulo="Sua conta de luz" id="conta" descricao="Com dois números da conta, o valor fica mais certinho.">
                <details className="group mb-5">
                  <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1 font-bold text-energia [&::-webkit-details-marker]:hidden">
                    Onde acho esses números? <ChevronDown className="size-5 transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <ExemploDeConta className="mt-3" />
                </details>
                <CamposDaConta
                  className="grid gap-5 sm:grid-cols-2"
                  campos={semAvisoAoMudar(camposDaConta, () => setContaSalva(false))}
                  textos={{ consumo: "Consumo do mês (kWh)", ajudaDoConsumo: "O número 1 do exemplo.", valor: "Total a pagar", ajudaDoValor: "O número 2 do exemplo." }}
                />
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {/* Sempre habilitado (T5): botão desabilitado não diz o que falta. */}
                  <Botao onClick={salvarConta}>Usar estes valores</Botao>
                  {residencia.contaReferencia && (
                    <Botao
                      variante="fantasma"
                      onClick={() => {
                        atualizar({ contaReferencia: undefined });
                        setChaveDaConta((chave) => chave + 1);
                        setContaSalva(false);
                      }}
                    >
                      Voltar para a tarifa da ANEEL
                    </Botao>
                  )}
                </div>
                {contaSalva && residencia.contaReferencia && (
                  <div className="mt-4">
                    {precoKwh(residencia, distribuidora, undefined).origem === "conta" ? (
                      <Aviso>Pronto. O kWh na sua conta sai por {formatarReais(precoKwh(residencia, distribuidora, undefined).valor)}, e o resumo já usa esse valor.</Aviso>
                    ) : (
                      <Aviso tom="faisca">Com a Tarifa Social, quase todo o consumo dessa conta foi isento, então ela não mostra o preço do kWh. Continuamos usando a tarifa da ANEEL.</Aviso>
                    )}
                  </div>
                )}
              </SecaoDeAjuste>
              <LinhaDaMeta />
            </GrupoDeAjustes>

            {contaVisivel && (
              <GrupoDeAjustes id="ajustes-conta" nome="Conta e família">
                <SecaoConta />
              </GrupoDeAjustes>
            )}

            <GrupoDeAjustes id="ajustes-aparelho" nome="Neste aparelho">
              <SecaoLeitura />
              <SecaoInstalar />
              <SecaoContagem />
            </GrupoDeAjustes>

            <GrupoDeAjustes id="ajustes-dados" nome="Privacidade">
              <SeusDados />
            </GrupoDeAjustes>
          </div>
        </div>

        <TrocarCidade
          aberta={mudandoCidade}
          aoFechar={() => setMudandoCidade(false)}
          ufAtual={residencia.uf}
          estados={arquivo?.estados ?? []}
          arquivo={arquivo}
          aoEscolher={(m, distribuidoraId) => {
            atualizar({ uf: m.uf, municipioIbge: m.ibge, municipioNome: m.nome, distribuidoraId });
            setMudandoCidade(false);
          }}
        />
      </div>
    );
  }

function mesmaConta(salva: ContaReferencia | undefined, enviada: ContaReferencia): boolean {
  return salva?.kwh === enviada.kwh && salva.valor === enviada.valor && salva.iluminacaoPublica === enviada.iluminacaoPublica;
}

/** Digitar de novo tira o "Pronto": ele fala da conta que foi salva, não da que está nos campos. */
function semAvisoAoMudar(campos: CamposDaContaEstado, aoMudar: () => void): CamposDaContaEstado {
  const comAviso = (campo: CamposDaContaEstado["kwh"]) => ({ ...campo, aoMudar: (texto: string) => (campo.aoMudar(texto), aoMudar()) });
  return { ...campos, kwh: comAviso(campos.kwh), valor: comAviso(campos.valor), iluminacao: comAviso(campos.iluminacao) };
}

/**
 * "Apagar todos os meus dados" (LGPD). Aparece em toda Minha casa, também sem cidade e quando a casa guardada não deu
 * para ler (D-3a-1 do qa): a Casca só abre esta tela sem cidade quando há algum dado guardado.
 */
function SeusDados() {
  const router = useRouter();
  const apagarTudo = useCasa((s) => s.apagarTudo);
  const [confirmarApagar, setConfirmarApagar] = useState(false);
  const conta = useConta();
  const comConta = conta.tipo === "conectada";
  const [erroDaConta, setErroDaConta] = useState<"sessao" | "falha">();
  return (
    <SecaoDeAjuste
      titulo="Seus dados"
      id="seus-dados"
      tom="perigo"
      descricao={
        comConta
          ? "O que você cadastrou fica neste navegador e na sua conta (para abrir em outro aparelho e para os links da família)."
          : "O que você cadastrou fica guardado neste navegador. Se você criou uma conta, entre nela antes de apagar, para apagar também o que está lá."
      }
    >
      <div>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Botao variante="secundario" onClick={() => baixarMeusDados(conta.tipo === "conectada" ? conta.email : undefined)}>
            <Download className="size-5" aria-hidden /> Baixar meus dados
          </Botao>
          <span className="text-[0.95rem] text-tinta-suave">Um arquivo com a casa e as escolhas guardadas neste aparelho. Ele fica na pasta de downloads: apague depois, se o celular for de mais gente.</span>
        </div>
        {!confirmarApagar ? (
          <Botao variante="perigo" onClick={() => setConfirmarApagar(true)}>
            Apagar todos os meus dados
          </Botao>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold">{comConta ? "Apagar a casa, todos os aparelhos, a sua conta e os links da família?" : "Apagar a casa e todos os aparelhos?"}</span>
            <Botao
              variante="perigo"
              onClick={async () => {
                // LGPD: com conta, "todos os meus dados" inclui o que está no servidor. Se o servidor não responder, nada
                // é apagado no aparelho, para a pessoa poder tentar de novo sem achar que apagou tudo.
                if (comConta) {
                  const resposta = await (await import("./apagarComConta")).apagarConta();
                  if (resposta.status !== 200) return setErroDaConta(resposta.status === 401 ? "sessao" : "falha");
                }
                apagarTudo();
                // A escolha de leitura mora numa chave própria: "todos os meus dados" inclui ela (LGPD, HIS-102).
                apagarPreferenciaDeLeitura();
                apagarMarcasDeOpiniao();
                router.push("/");
              }}
            >
              Sim, apagar
            </Botao>
            <Botao variante="fantasma" onClick={() => setConfirmarApagar(false)}>
              Cancelar
            </Botao>
          </div>
        )}
        <div role="status" className="mt-3">
          {erroDaConta && (
            <Aviso tom="alerta" anunciar={false}>
              {erroDaConta === "sessao"
                ? "Você saiu da conta. Entre de novo para apagar também o que está nela. Nada foi apagado."
                : "Não deu para apagar a conta agora. Confira a internet e tente de novo. Nada foi apagado."}
            </Aviso>
          )}
        </div>
      </div>
      <p className="mt-6">
        <Link href="/sobre" className="inline-flex min-h-11 items-center font-bold text-energia underline underline-offset-4">
          De onde vêm as tarifas e como o cálculo é feito
        </Link>
      </p>
    </SecaoDeAjuste>
  );
}

/** "Meta de luz" (HIS-104): só uma linha aqui; o campo e o resultado ficam no painel, onde a pessoa já vê o R$. */
function LinhaDaMeta() {
  const meta = useCasa((s) => s.metaMensal);
  return (
    <SecaoDeAjuste titulo="Meta de luz" id="meta-de-luz" descricao="Um valor por mês para a conta não passar. Você acompanha no painel.">
      <p className="text-lg">{meta === undefined ? "Você ainda não tem uma meta." : <>Meta de luz: <strong className="numeros">{formatarReais(meta)}</strong> por mês</>}</p>
      <Link href="/casa#meta" className="mt-3 inline-flex min-h-11 items-center font-bold text-energia underline underline-offset-2">
        {meta === undefined ? "Definir meta" : "Mudar meta"}
      </Link>
    </SecaoDeAjuste>
  );
}

function TrocarCidade({
  aberta,
  aoFechar,
  ufAtual,
  estados,
  arquivo,
  aoEscolher,
}: {
  aberta: boolean;
  aoFechar: () => void;
  ufAtual?: string;
  estados: { uf: string; nome: string; distribuidoras: string[] }[];
  arquivo: ArquivoParaBusca | undefined;
  aoEscolher: (m: Municipio, distribuidoraId: string) => void;
}) {
  const [ufEscolhida, setUf] = useState(ufAtual);
  // Sem cidade salva (T1b), começa pelo primeiro estado da lista, que é o que o seletor mostra.
  const uf = ufEscolhida ?? estados[0]?.uf;
  const [escolhido, setEscolhido] = useState<Municipio>();
  const municipios = useMunicipios(uf);

  const opcoes = useMemo(() => {
    if (!escolhido || !arquivo) return [];
    const daCidade = distribuidorasDaCidade(arquivo, escolhido.distribuidoras);
    if (daCidade.length > 0) return daCidade;
    return distribuidorasDaCidade(arquivo, estados.find((e) => e.uf === uf)?.distribuidoras ?? []);
  }, [escolhido, arquivo, estados, uf]);

  return (
    <Folha
      aberta={aberta}
      aoFechar={() => {
        setEscolhido(undefined);
        aoFechar();
      }}
      titulo={escolhido ? "Qual empresa manda a sua conta?" : "Mudar cidade"}
    >
      {!escolhido ? (
        <div className="space-y-4">
          <Campo rotulo="Estado" id="troca-uf">
            <select id="troca-uf" value={uf} onChange={(e) => setUf(e.target.value)} className="min-h-12 w-full rounded-[var(--radius-controle)] border-2 border-linha bg-papel px-4 text-lg font-bold">
              {estados.map((e) => (
                <option key={e.uf} value={e.uf}>
                  {e.nome}
                </option>
              ))}
            </select>
          </Campo>
          <div className="empty:hidden">
            <AvisoFalhaDeCarga
              assunto={{ tipo: "cidades", estado: ehUf(uf) ? ESTADOS[uf] : "" }}
              fraseDeSeguranca="Sua casa continua salva."
              falhasSeguidas={municipios.falhasSeguidas}
              semInternet={municipios.semInternet}
              carregando={municipios.carregando}
              aoTentarDeNovo={municipios.tentarDeNovo}
            />
          </div>
          {municipios.dados && (
            <BuscaCidade
              autoFocus={false}
              municipios={municipios.dados.municipios}
              aoEscolher={(m) => {
                const validas = arquivo ? distribuidorasDaCidade(arquivo, m.distribuidoras) : [];
                const [unica] = validas;
                if (validas.length === 1 && unica) aoEscolher(m, unica.id);
                else setEscolhido(m);
              }}
            />
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="mb-3 text-tinta-suave">Veja o nome no topo da sua conta de luz de {escolhido.nome}.</p>
          {opcoes.map((d) => (
            <Opcao
              key={d.id}
              selecionada={false}
              onClick={() => {
                aoEscolher(escolhido, d.id);
                setEscolhido(undefined);
              }}
            >
              {nomeDistribuidora(d)}
            </Opcao>
          ))}
        </div>
      )}
    </Folha>
  );
}
