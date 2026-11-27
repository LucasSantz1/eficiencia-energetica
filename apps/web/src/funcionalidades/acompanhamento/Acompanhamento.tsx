"use client";

import { ChevronRight, Gauge, Pencil, Plus, Receipt } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  alertaDaLeitura,
  competenciaAtual,
  formatarCompetencia,
  formatarKwh,
  formatarReais,
  historicoContas,
  lerNumeroDigitado,
  LIMITES,
  mediaDasContas,
  periodosDeLeitura,
  validarFaixa,
  type ContaMensal,
  type ContaReferencia,
  type LeituraRelogio,
  faixaDaEstimativa,
  contaPareceAlta,
} from "@ee/core";
import { useCasa } from "@/aplicacao/casa";
import { contarUso } from "@/aplicacao/uso";
import { Aviso } from "@/ui/Aviso";
import { Barras } from "@/ui/Barras";
import { Botao } from "@/ui/Botao";
import { Campo } from "@/ui/Campo";
import { TITULO_CONFERE } from "@/ui/campos/mensagens";
import { CamposDaConta } from "@/ui/conta/CamposDaConta";
import { useCamposDaConta } from "@/ui/conta/useCamposDaConta";
import { Entrada } from "@/ui/Entrada";
import { focarPrimeiroErro } from "@/ui/foco";
import { Folha } from "@/ui/Folha";
import { Pilulas } from "@/ui/Pilulas";
import { confereALeitura } from "./mensagensDoRelogio";

const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const mesCurto = (competencia: string) => {
  const [ano, mes] = competencia.split("-").map(Number);
  return `${MESES_CURTOS[(mes ?? 1) - 1]}${ano && ano !== new Date().getFullYear() ? `/${String(ano).slice(2)}` : ""}`;
};
const dataCurta = (iso: string) => {
  const [, mes, dia] = iso.split("-").map(Number);
  return `${dia}/${String(mes).padStart(2, "0")}`;
};
const hojeISO = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
const dataPorExtenso = (iso: string) => new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
/** O relógio tem de 4 a 6 dígitos: o tamanho máximo sai do limite do `limites.ts` (R9 da 003a). */
const DIGITOS_DA_LEITURA = String(LIMITES.leituraKwh.max).length;
/** Número do relógio que o store aceita, com as mesmas funções do core; `undefined` se não der para salvar. */
const leituraValida = (texto: string) => {
  const lido = lerNumeroDigitado(texto, 0);
  return lido.tipo === "numero" && validarFaixa(LIMITES.leituraKwh, lido.valor) !== "fora" ? lido.valor : undefined;
};

/**
 * Acompanhamento mês a mês (contas de luz) e dia a dia (leituras do relógio).
 * Compara o consumo real com a estimativa feita a partir dos aparelhos cadastrados.
 */
export function Acompanhamento({ estimativaKwhMes }: { estimativaKwhMes: number }) {
  const [aba, setAba] = useState<"contas" | "relogio">("contas");
  return (
    <section aria-labelledby="titulo-acompanhamento">
      {/* No computador o "Mês a mês" ocupa a largura toda (pedido do responsável, 24/11): título e escolha numa linha só. */}
      <div className="lg:flex lg:items-end lg:justify-between lg:gap-8">
      <div>
      <h2 id="titulo-acompanhamento" className="text-[1.375rem] font-bold tracking-tight">
        Mês a mês
      </h2>
      <p className="mt-1 max-w-[56ch] text-tinta-suave">Anote suas contas de luz ou o número do relógio de luz para ver como o consumo real se compara com a estimativa.</p>
      </div>
      <div className="mt-4 lg:mt-0 lg:shrink-0">
        <Pilulas
          rotulo="Tipo de registro"
          opcoes={[
            { valor: "contas", rotulo: "Contas de luz" },
            { valor: "relogio", rotulo: "Relógio de luz" },
          ]}
          valor={aba}
          aoMudar={setAba}
        />
      </div>
      </div>
      <div className="mt-5 rounded-[var(--radius-cartao)] bg-papel p-4 sm:p-6">{aba === "contas" ? <Contas estimativaKwhMes={estimativaKwhMes} /> : <Relogio estimativaKwhDia={estimativaKwhMes / 30} />}</div>
    </section>
  );
}

/** Conta aberta na folha. `sessao` é criada ao abrir e não muda ao trocar o mês: é a chave dos campos. */
interface ContaEmEdicao {
  id?: string;
  competencia: string;
  inicial?: ContaReferencia;
  sessao: object;
}

function Contas({ estimativaKwhMes }: { estimativaKwhMes: number }) {
  const contas = useCasa((s) => s.contas);
  const beneficio = useCasa((s) => s.residencia?.beneficio);
  const salvar = useCasa((s) => s.salvarConta);
  const remover = useCasa((s) => s.removerConta);
  const [editando, setEditando] = useState<ContaEmEdicao>();
  // No acompanhamento a conta zerada vale (casa fechada, Tarifa Social): faixa `…Acompanhamento` do limites.ts.
  const camposDaConta = useCamposDaConta({ uso: "acompanhamento", beneficio, ids: { kwh: "conta-kwh-m", valor: "conta-valor-m" }, inicial: editando?.inicial, chave: editando?.sessao });
  const historico = historicoContas(contas);
  const ultimas = historico.slice(-12);

  const abrirNova = () => setEditando({ competencia: competenciaAtual(), sessao: {} });
  // A primeira conta troca "Anotar conta" por "Anotar outra conta": a folha devolveria o foco a um botão que sumiu, e ele
  // cairia no <body> (qa, 25/11). Depois de salvar, o foco vai para o botão novo.
  const botaoOutraConta = useRef<HTMLButtonElement>(null);
  const focarOutraConta = useRef(false);
  useEffect(() => {
    if (editando || !focarOutraConta.current) return;
    focarOutraConta.current = false;
    requestAnimationFrame(() => botaoOutraConta.current?.focus());
  }, [editando]);

  return (
    <>
      {historico.length === 0 ? (
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Receipt className="size-10 shrink-0 text-energia" aria-hidden />
          <p className="flex-1">Ainda não há contas anotadas. Pegue a última conta de luz e anote o consumo (kWh) e o valor: leva 30 segundos.</p>
          <Botao onClick={abrirNova}>
            <Plus className="size-5" aria-hidden /> Anotar conta
          </Botao>
        </div>
      ) : (
        <div className="lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-10">
          <div>
          <Barras
            rotulo="Consumo das contas de luz por mês"
            unidade="kWh por mês"
            barras={ultimas.map((c) => ({ id: c.id, rotulo: mesCurto(c.competencia), valor: c.kwh, detalhe: `${formatarCompetencia(c.competencia)}: ${formatarKwh(c.kwh)}, ${formatarReais(c.valor)}${c.precoKwh === undefined ? "" : ` (${formatarReais(c.precoKwh)} por kWh)`}` }))}
            referencia={estimativaKwhMes > 0 ? { valor: estimativaKwhMes, rotulo: `Estimativa: ${formatarKwh(estimativaKwhMes)}` } : undefined}
          />
          <NumerosDasContas contas={historico} estimativaKwhMes={estimativaKwhMes} />
          </div>
          <div className="mt-6 lg:mt-0">
          <h3 className="font-bold text-tinta-suave">Contas anotadas</h3>
          <ul className="mt-2 divide-y divide-separador border-t border-separador">
            {[...historico].reverse().map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-3">
                <span className="flex-1 font-bold first-letter:uppercase">{formatarCompetencia(c.competencia)}</span>
                <span className="numeros text-right">
                  <span className="block font-extrabold">{formatarReais(c.valor)}</span>
                  <span className="block text-[0.9rem] text-tinta-suave">{formatarKwh(c.kwh)}</span>
                </span>
                <button
                  type="button"
                  aria-label={`Editar conta de ${formatarCompetencia(c.competencia)}`}
                  onClick={() => setEditando({ id: c.id, competencia: c.competencia, inicial: { kwh: c.kwh, valor: c.valor }, sessao: {} })}
                  className="grid size-11 place-items-center rounded-full text-tinta-suave hover:bg-fundo"
                >
                  <Pencil className="size-5" />
                </button>
              </li>
            ))}
          </ul>
          <Botao ref={botaoOutraConta} variante="secundario" className="mt-4" onClick={abrirNova}>
            <Plus className="size-5" aria-hidden /> Anotar outra conta
          </Botao>
          <ComparacaoConta ultima={historico.at(-1)!} anterior={historico.at(-2)} estimativaKwhMes={estimativaKwhMes} />
          <ConvitePorQueAlta ultima={historico.at(-1)!} anterior={historico.at(-2)} estimativaKwhMes={estimativaKwhMes} />
          </div>
        </div>
      )}

      <Folha
        aberta={Boolean(editando)}
        aoFechar={() => setEditando(undefined)}
        titulo={editando?.id ? "Editar conta" : "Anotar conta de luz"}
        rodape={
          editando && (
            <div className="flex flex-col gap-3">
              {/* Botão de enviar do formulário de cima (atributo form): Enter num campo também salva (QA, 25/11). */}
              <Botao
                largo
                type="submit"
                form="form-da-conta"
                disabled={!editando.competencia}
                onClick={(evento) => {
                  evento.preventDefault();
                  // Só salva o que passou pelo T5/T6; o resto fica na folha, com o foco no primeiro campo que não passou.
                  const conta = camposDaConta.conferir();
                  if (!conta) return;
                  salvar({ id: editando.id, competencia: editando.competencia, ...conta });
                  // Conta nova (não edição): conta o uso e o quanto a estimativa acertou, só a faixa (ADR-009).
                  if (!editando.id) {
                    contarUso("conta-anotada");
                    const faixa = faixaDaEstimativa(conta.kwh, estimativaKwhMes);
                    if (faixa) contarUso(faixa);
                  }
                  if (historico.length === 0) focarOutraConta.current = true;
                  setEditando(undefined);
                }}
              >
                Salvar conta
              </Botao>
              {editando.id && (
                <Botao
                  largo
                  variante="perigo"
                  onClick={() => {
                    remover(editando.id!);
                    setEditando(undefined);
                  }}
                >
                  Apagar esta conta
                </Botao>
              )}
            </div>
          )
        }
      >
        {editando && (
          <form
            id="form-da-conta"
            noValidate
            className="space-y-5"
            onSubmit={(evento) => {
              // Enter num campo: o mesmo que tocar em "Salvar conta".
              evento.preventDefault();
              document.querySelector<HTMLButtonElement>('button[form="form-da-conta"]')?.click();
            }}
          >
            <Campo rotulo="Mês da conta" id="conta-mes" ajuda="O mês de referência que aparece na conta.">
              <input id="conta-mes" type="month" value={editando.competencia} max={competenciaAtual()} onChange={(e) => setEditando({ ...editando, competencia: e.target.value })} className="min-h-12 w-full rounded-[var(--radius-controle)] border-2 border-linha bg-papel px-4 text-lg font-bold" />
            </Campo>
            <CamposDaConta className="space-y-5" campos={camposDaConta} textos={{ consumo: "Consumo", ajudaDoConsumo: "“Consumo (kWh)” ou “kWh faturado”.", valor: "Valor total" }} />
          </form>
        )}
      </Folha>
    </>
  );
}

/** Três números curtos embaixo do gráfico: média por mês, preço médio do kWh e a última conta. */
function NumerosDasContas({ contas, estimativaKwhMes }: { contas: ContaMensal[]; estimativaKwhMes: number }) {
  const media = mediaDasContas(contas);
  const ultima = contas.at(-1);
  if (!media || !ultima) return null;
  const itens = [
    { rotulo: "Média por mês", valor: formatarReais(media.valorMes), detalhe: formatarKwh(media.kwhMes) },
    media.precoKwh === undefined
      ? { rotulo: "Preço médio", valor: "Sem consumo", detalhe: "as contas anotadas têm 0 kWh" }
      : { rotulo: "Preço médio", valor: formatarReais(media.precoKwh), detalhe: "por kWh, com impostos" },
    { rotulo: "Última conta", valor: formatarReais(ultima.valor), detalhe: `${formatarKwh(ultima.kwh)}; a estimativa é ${formatarKwh(estimativaKwhMes)}` },
  ];
  return (
    <dl className="mt-4 grid grid-cols-1 gap-2 min-[480px]:grid-cols-3">
      {itens.map((i) => (
        <div key={i.rotulo} className="rounded-[var(--radius-controle)] bg-fundo px-4 py-3">
          <dt className="text-[0.92rem] font-bold text-tinta-suave">{i.rotulo}</dt>
          <dd className="numeros text-lg font-extrabold">{i.valor}</dd>
          <dd className="numeros text-[0.9rem] text-tinta-suave">{i.detalhe}</dd>
        </div>
      ))}
    </dl>
  );
}

function ComparacaoConta({ ultima, anterior, estimativaKwhMes }: { ultima: ContaMensal; anterior?: ContaMensal; estimativaKwhMes: number }) {
  const frases: string[] = [];
  if (anterior) {
    const dif = ultima.kwh - anterior.kwh;
    if (Math.abs(dif) >= 1) frases.push(`Em ${formatarCompetencia(ultima.competencia)} você gastou ${formatarKwh(Math.abs(dif))} ${dif > 0 ? "a mais" : "a menos"} que no mês anterior.`);
  }
  if (ultima.kwh === 0) {
    // Comparar 0 kWh com a estimativa diria "o tempo de uso pode estar maior", e não é isso (qa, 25/11).
    frases.push("Esta conta veio sem consumo (0 kWh). Com a casa fechada, paga-se só o mínimo da ligação e as taxas, por isso ela fica fora da comparação com a estimativa.");
  } else if (estimativaKwhMes > 0) {
    const razao = ultima.kwh / estimativaKwhMes;
    if (razao > 1.25) frases.push("A conta real está bem acima da estimativa: talvez algum aparelho fique ligado mais tempo do que o cadastrado. Vale revisar o tempo de uso do chuveiro e do ar-condicionado.");
    else if (razao < 0.75) frases.push("A conta real está abaixo da estimativa: o tempo de uso de algum aparelho pode estar maior que o real.");
    else frases.push("A estimativa está perto da conta real. Ótimo: as dicas estão calculadas com números confiáveis.");
  }
  if (frases.length === 0) return null;
  return (
    <div className="mt-4">
      <Aviso>{frases.join(" ")}</Aviso>
    </div>
  );
}

function Relogio({ estimativaKwhDia }: { estimativaKwhDia: number }) {
  const leituras = useCasa((s) => s.leituras);
  const salvar = useCasa((s) => s.salvarLeitura);
  const remover = useCasa((s) => s.removerLeitura);
  // `confere` mostra o "Confere?" (T6); `confirmado` é o par "data|número" que a pessoa disse que está certo.
  const [editando, setEditando] = useState<{ id?: string; data: string; valor: string; confere?: boolean; confirmado?: string }>();
  const { periodos, ignoradas } = periodosDeLeitura(leituras);
  const ordenadas = [...leituras].sort((a, b) => b.data.localeCompare(a.data));
  const ultimo = periodos.at(-1);

  // Compara com a leitura anterior mais próxima (sem a que está sendo editada): mais de 100 kWh por dia pergunta.
  const valorKwh = editando ? leituraValida(editando.valor) : undefined;
  const nova: LeituraRelogio | undefined = editando && valorKwh !== undefined ? { id: editando.id ?? "nova", data: editando.data, valorKwh } : undefined;
  const anterior = nova ? leituras.filter((l) => l.id !== nova.id && l.data < nova.data).sort((a, b) => b.data.localeCompare(a.data))[0] : undefined;
  const raro = nova && anterior ? alertaDaLeitura(anterior, nova) : undefined;
  const par = nova ? `${nova.data}|${nova.valorKwh}` : undefined;
  const pendente = Boolean(raro) && par !== editando?.confirmado;
  const alertaDoRelogio =
    editando?.confere && pendente && raro && anterior && nova
      ? {
          titulo: TITULO_CONFERE,
          texto: confereALeitura(dataPorExtenso(anterior.data), dataPorExtenso(nova.data), raro.kwhPorDia),
          aoConfirmar: () => setEditando({ ...editando, confere: false, confirmado: par }),
          aoCorrigir: () => setEditando({ ...editando, confere: false }),
        }
      : undefined;

  const listaDeLeituras = ordenadas.length > 0 && (
    <ul className="mt-2 divide-y divide-separador border-t border-separador">
      {ordenadas.map((l) => (
        <li key={l.id} className="flex items-center gap-3 py-3">
          <span className="flex-1 font-bold">{new Date(`${l.data}T12:00:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}</span>
          <span className="numeros font-extrabold">{l.valorKwh.toLocaleString("pt-BR")}</span>
          <button type="button" aria-label="Editar leitura" onClick={() => setEditando({ id: l.id, data: l.data, valor: String(l.valorKwh) })} className="grid size-11 place-items-center rounded-full text-tinta-suave hover:bg-fundo">
            <Pencil className="size-5" />
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {leituras.length < 2 ? (
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Gauge className="size-10 shrink-0 text-energia" aria-hidden />
          <div className="flex-1 space-y-1">
            <p>Anote o número do relógio de luz hoje e de novo daqui a alguns dias. A diferença mostra quanto a casa gastou de verdade por dia.</p>
            {leituras.length === 1 && <p className="font-bold">Falta mais uma leitura para calcular.</p>}
          </div>
          <Botao onClick={() => setEditando({ data: hojeISO(), valor: "" })}>
            <Plus className="size-5" aria-hidden /> Anotar leitura
          </Botao>
        </div>
      ) : (
        <div className="lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-10">
          <div>
          <Barras
            rotulo="Consumo por dia entre as leituras do relógio"
            unidade="kWh por dia"
            barras={periodos.slice(-12).map((p) => ({
              id: p.ate.id,
              rotulo: dataCurta(p.ate.data),
              valor: p.kwhPorDia,
              detalhe: `De ${dataCurta(p.de.data)} a ${dataCurta(p.ate.data)}: ${formatarKwh(p.kwh)} em ${p.dias} ${p.dias === 1 ? "dia" : "dias"}, ${formatarKwh(p.kwhPorDia)} por dia`,
            }))}
            referencia={estimativaKwhDia > 0 ? { valor: estimativaKwhDia, rotulo: `Estimativa: ${formatarKwh(estimativaKwhDia)} por dia` } : undefined}
          />
          {ultimo && (
            <div className="mt-4">
              <Aviso>
                No último período a casa gastou {formatarKwh(ultimo.kwhPorDia)} por dia. Nesse ritmo, o mês fecha em cerca de {formatarKwh(ultimo.projecaoMes)}.
              </Aviso>
            </div>
          )}
          <Botao variante="secundario" className="mt-4" onClick={() => setEditando({ data: hojeISO(), valor: "" })}>
            <Plus className="size-5" aria-hidden /> Anotar leitura de hoje
          </Botao>
          </div>
          <div className="mt-6 lg:mt-0">
            <h3 className="font-bold text-tinta-suave">Leituras anotadas</h3>
            {listaDeLeituras}
          </div>
        </div>
      )}
      {ignoradas.length > 0 && (
        <div className="mt-4">
          <Aviso tom="faisca">Algumas leituras ficaram menores que a anterior e foram ignoradas. Confira se o número foi digitado certo.</Aviso>
        </div>
      )}
      {leituras.length < 2 && listaDeLeituras && <div className="mt-5">{listaDeLeituras}</div>}

      <Folha
        aberta={Boolean(editando)}
        aoFechar={() => setEditando(undefined)}
        titulo={editando?.id ? "Editar leitura" : "Anotar leitura do relógio"}
        rodape={
          editando && (
            <div className="flex flex-col gap-3">
              <Botao
                largo
                disabled={!editando.data || valorKwh === undefined}
                onClick={() => {
                  if (valorKwh === undefined) return;
                  // T6: o número raro só é salvo depois do "Sim, está certo"; o foco vai para o campo com a pergunta.
                  if (pendente) {
                    setEditando({ ...editando, confere: true });
                    focarPrimeiroErro([{ id: "leitura-valor", resultado: "alerta" }]);
                    return;
                  }
                  salvar({ id: editando.id, data: editando.data, valorKwh });
                  setEditando(undefined);
                }}
              >
                Salvar leitura
              </Botao>
              {editando.id && (
                <Botao
                  largo
                  variante="perigo"
                  onClick={() => {
                    remover(editando.id!);
                    setEditando(undefined);
                  }}
                >
                  Apagar esta leitura
                </Botao>
              )}
            </div>
          )
        }
      >
        {editando && (
          <div className="space-y-5">
            <Campo rotulo="Dia da leitura" id="leitura-data">
              <input id="leitura-data" type="date" value={editando.data} max={hojeISO()} onChange={(e) => setEditando({ ...editando, data: e.target.value, confere: false })} className="min-h-12 w-full rounded-[var(--radius-controle)] border-2 border-linha bg-papel px-4 text-lg font-bold" />
            </Campo>
            <Campo rotulo="Número do relógio" id="leitura-valor" ajuda="Anote os números pretos do relógio de luz, da esquerda para a direita, sem os vermelhos (se houver)." alerta={alertaDoRelogio}>
              <Entrada
                id="leitura-valor"
                inputMode="numeric"
                sufixo="kWh"
                placeholder="Ex.: 12345"
                maxLength={DIGITOS_DA_LEITURA}
                value={editando.valor}
                onChange={(e) => setEditando({ ...editando, valor: e.target.value.replace(/[^\d]/g, ""), confere: false })}
              />
            </Campo>
          </div>
        )}
      </Folha>
    </>
  );
}

/**
 * Entrada do "Por que a conta veio alta?" (27/11). Quando a última conta passou 15% da anterior ou 25% da estimativa, um
 * cartão chama a atenção; senão, só um link discreto, para quem achou a conta alta por outro motivo.
 */
function ConvitePorQueAlta({ ultima, anterior, estimativaKwhMes }: { ultima: ContaMensal; anterior: ContaMensal | undefined; estimativaKwhMes: number }) {
  const href = `/casa/conta-alta?conta=${encodeURIComponent(ultima.id)}`;
  if (contaPareceAlta(ultima, anterior, estimativaKwhMes > 0 ? estimativaKwhMes : undefined)) {
    return (
      <Link href={href} className="mt-5 flex items-center gap-3 rounded-[var(--radius-cartao)] border-2 border-faisca/60 bg-faisca/10 p-4 transition-colors hover:bg-faisca/20">
        <span className="flex-1">
          <span className="block font-bold first-letter:uppercase">A conta de {formatarCompetencia(ultima.competencia)} veio mais alta</span>
          <span className="block text-tinta-suave">Descubra o que pesou: bandeira, dias, consumo…</span>
        </span>
        <ChevronRight className="size-5 shrink-0" aria-hidden />
      </Link>
    );
  }
  return (
    <Link href={href} className="mt-4 inline-flex min-h-11 items-center gap-1 font-bold text-energia underline underline-offset-4">
      Achou a conta alta? Veja por quê
    </Link>
  );
}
