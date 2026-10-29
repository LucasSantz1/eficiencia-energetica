"use client";

import { formatarReais, precoKwh, type Beneficio, type Distribuidora, type Ligacao, type Municipio } from "@ee/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BuscaCidade } from "@/ui/BuscaCidade";
import { Aviso } from "@/ui/Aviso";
import { Botao } from "@/ui/Botao";
import { Campo } from "@/ui/Campo";
import { Entrada } from "@/ui/Entrada";
import { Folha } from "@/ui/Folha";
import { Opcao } from "@/ui/Opcao";
import { useMunicipios } from "@/aplicacao/dados-publicos";
import { nomeDistribuidora, useResumo } from "@/aplicacao/resumo";
import { useCasa } from "@/aplicacao/casa";

const BENEFICIOS: { id: Beneficio; titulo: string; descricao: string }[] = [
  { id: "tarifa-social", titulo: "Tarifa Social", descricao: "CadÚnico com renda de até meio salário mínimo por pessoa, ou BPC. Os primeiros 80 kWh são de graça." },
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

export default function Ajustes() {
  const router = useRouter();
  const { residencia, arquivo, distribuidora } = useResumo();
  const atualizar = useCasa((s) => s.atualizarResidencia);
  const apagarTudo = useCasa((s) => s.apagarTudo);
  const [mudandoCidade, setMudandoCidade] = useState(false);
  const [confirmarApagar, setConfirmarApagar] = useState(false);
  const [kwh, setKwh] = useState(residencia?.contaReferencia ? String(residencia.contaReferencia.kwh).replace(".", ",") : "");
  const [valor, setValor] = useState(residencia?.contaReferencia ? residencia.contaReferencia.valor.toFixed(2).replace(".", ",") : "");
  const [contaSalva, setContaSalva] = useState(false);

  const municipios = useMunicipios(residencia?.uf);
  const municipioAtual = municipios.dados?.municipios.find((m) => m.ibge === residencia?.municipioIbge);
  const porId = useMemo(() => new Map((arquivo?.distribuidoras ?? []).map((d) => [d.id, d])), [arquivo]);
  const opcoesDistribuidora = (municipioAtual?.distribuidoras ?? []).map((id) => porId.get(id)).filter((d): d is Distribuidora => Boolean(d));

  if (!residencia) return null;

  const salvarConta = () => {
    const k = Number(kwh.replace(",", "."));
    const v = Number(valor.replace(/\./g, "").replace(",", "."));
    atualizar({ contaReferencia: k > 0 && v > 0 ? { kwh: k, valor: v } : undefined });
    setContaSalva(true);
  };

  return (
    <div className="space-y-12">
      <h1 className="text-[2rem] leading-tight font-extrabold tracking-tight">Minha casa</h1>

      <Secao titulo="Onde você mora">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-controle)] bg-papel px-4 py-4">
          <div>
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
      </Secao>

      <Secao titulo="Benefício na conta de luz">
        <div className="space-y-2">
          {BENEFICIOS.map((b) => (
            <Opcao key={b.id} selecionada={residencia.beneficio === b.id} onClick={() => atualizar({ beneficio: b.id })} descricao={b.descricao}>
              {b.titulo}
            </Opcao>
          ))}
        </div>
        <p className="mt-3 text-[0.95rem] text-tinta-suave">Para ter direito, a família precisa estar no CadÚnico. A inscrição é feita no CRAS da sua cidade, e a distribuidora aplica o desconto automaticamente.</p>
      </Secao>

      <Secao titulo="Tipo de ligação" id="ligacao">
        <div className="space-y-2">
          {LIGACOES.map((l) => (
            <Opcao key={l.id} selecionada={residencia.ligacao === l.id} onClick={() => atualizar({ ligacao: l.id })} descricao={l.descricao}>
              {l.titulo}
            </Opcao>
          ))}
        </div>
      </Secao>

      <Secao titulo="Sua conta de luz" id="conta">
        <p className="mb-5 max-w-[56ch] text-tinta-suave">Com o consumo e o valor de uma conta, usamos o preço real do kWh na sua cidade, já com impostos. Fica bem mais perto do que você paga.</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Campo rotulo="Consumo do mês" id="aj-kwh" ajuda="“Consumo (kWh)” na conta.">
            <Entrada id="aj-kwh" inputMode="decimal" sufixo="kWh" placeholder="Ex.: 150" value={kwh} onChange={(e) => (setKwh(e.target.value.replace(/[^\d,.]/g, "")), setContaSalva(false))} />
          </Campo>
          <Campo rotulo="Valor total" id="aj-valor" ajuda="O valor a pagar.">
            <Entrada id="aj-valor" inputMode="decimal" prefixo="R$" placeholder="Ex.: 135,90" value={valor} onChange={(e) => (setValor(e.target.value.replace(/[^\d,.]/g, "")), setContaSalva(false))} />
          </Campo>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Botao onClick={salvarConta} disabled={!kwh || !valor}>
            Usar estes valores
          </Botao>
          {residencia.contaReferencia && (
            <Botao
              variante="fantasma"
              onClick={() => {
                atualizar({ contaReferencia: undefined });
                setKwh("");
                setValor("");
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
      </Secao>

      <Secao titulo="Seus dados">
        <p className="max-w-[56ch] text-tinta-suave">Tudo o que você cadastrou fica guardado só neste navegador. Se limpar os dados do navegador, as informações são apagadas.</p>
        <div className="mt-4">
          {!confirmarApagar ? (
            <Botao variante="perigo" onClick={() => setConfirmarApagar(true)}>
              Apagar todos os meus dados
            </Botao>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold">Apagar a casa e todos os aparelhos?</span>
              <Botao
                variante="perigo"
                onClick={() => {
                  apagarTudo();
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
        </div>
        <p className="mt-6">
          <Link href="/sobre" className="font-bold text-energia underline underline-offset-4">
            De onde vêm as tarifas e como o cálculo é feito
          </Link>
        </p>
      </Secao>

      <TrocarCidade
        aberta={mudandoCidade}
        aoFechar={() => setMudandoCidade(false)}
        ufAtual={residencia.uf}
        estados={arquivo?.estados ?? []}
        distribuidorasValidas={porId}
        aoEscolher={(m, distribuidoraId) => {
          atualizar({ uf: m.uf, municipioIbge: m.ibge, municipioNome: m.nome, distribuidoraId });
          setMudandoCidade(false);
        }}
      />
    </div>
  );
}

function Secao({ titulo, id, children }: { titulo: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id ?? titulo}-titulo`} className="scroll-mt-24">
      <h2 id={`${id ?? titulo}-titulo`} className="mb-4 text-2xl font-extrabold tracking-tight">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function TrocarCidade({
  aberta,
  aoFechar,
  ufAtual,
  estados,
  distribuidorasValidas,
  aoEscolher,
}: {
  aberta: boolean;
  aoFechar: () => void;
  ufAtual: string;
  estados: { uf: string; nome: string; distribuidoras: string[] }[];
  distribuidorasValidas: Map<string, Distribuidora>;
  aoEscolher: (m: Municipio, distribuidoraId: string) => void;
}) {
  const [uf, setUf] = useState(ufAtual);
  const [escolhido, setEscolhido] = useState<Municipio>();
  const municipios = useMunicipios(uf);

  const opcoes = useMemo(() => {
    if (!escolhido) return [];
    const daCidade = escolhido.distribuidoras.map((id) => distribuidorasValidas.get(id)).filter((d): d is Distribuidora => Boolean(d));
    if (daCidade.length > 0) return daCidade;
    return (estados.find((e) => e.uf === uf)?.distribuidoras ?? []).map((id) => distribuidorasValidas.get(id)).filter((d): d is Distribuidora => Boolean(d));
  }, [escolhido, distribuidorasValidas, estados, uf]);

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
          {municipios.dados && (
            <BuscaCidade
              autoFocus={false}
              municipios={municipios.dados.municipios}
              aoEscolher={(m) => {
                const validas = m.distribuidoras.filter((id) => distribuidorasValidas.has(id));
                if (validas.length === 1) aoEscolher(m, validas[0]!);
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
