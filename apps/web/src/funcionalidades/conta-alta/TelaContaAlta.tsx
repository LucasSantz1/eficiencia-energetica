"use client";

import { CircleHelp, Receipt, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { formatarCompetencia, formatarKwh, formatarReais, paraFalar } from "@ee/core";
import type { MotivoDaContaAlta } from "@ee/core/conta-alta";
import { useContaAlta } from "@/aplicacao/conta-alta";
import { useOuvir } from "@/aplicacao/ouvir";
import { useResumo } from "@/aplicacao/resumo";
import { BotaoOuvir } from "@/ui/BotaoOuvir";
import { Campo } from "@/ui/Campo";
import { Entrada } from "@/ui/Entrada";
import { classesDeBotao } from "@/ui/estilosDeBotao";
import { IconeComFundo } from "@/ui/Icone";
import { PASSOS_DA_RECLAMACAO, PASSOS_DO_TESTE, frasesDosPassos } from "./passos";

/** Faixa aceita para "quantos dias a conta cobre" (uma conta tem perto de 30; acima de 60 é erro de digitação). */
const DIAS = { min: 1, max: 60 } as const;

/**
 * "Por que minha conta veio alta?" (pedido do dono, 27/11). A pessoa escolhe a conta, pode dizer quantos dias ela
 * cobre, e vê os motivos prováveis com quanto cada um pesou. Depois, o teste do relógio e como reclamar.
 */
export function TelaContaAlta() {
  const idDoEndereco = useSearchParams().get("conta") ?? undefined;
  const [idEscolhido, setIdEscolhido] = useState<string>();
  const [textoDosDias, setTextoDosDias] = useState("");
  const dias = lerDias(textoDosDias);
  const { contas, conta, anterior, motivos, carregando } = useContaAlta(idEscolhido ?? idDoEndereco, dias);
  const { resumo, residencia } = useResumo();
  const idDosDias = useId();
  const ouvir = useOuvir("conta-alta", () => [
    ...(conta ? [`A conta de ${formatarCompetencia(conta.competencia)} veio com ${paraFalar(formatarReais(conta.valor))}.`] : []),
    ...(motivos.length === 0 ? ["Pelos números anotados, nenhum motivo se destacou."] : motivos.flatMap((m) => [`${m.titulo}.`, paraFalar(m.texto)])),
    "Faça o teste do relógio.",
    ...frasesDosPassos(PASSOS_DO_TESTE),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-[clamp(1.9rem,7vw,2.6rem)] leading-tight font-extrabold tracking-tight">Por que a conta veio alta?</h1>
        {ouvir.disponivel && conta && <BotaoOuvir falando={ouvir.falando} aoTocar={ouvir.alternar} rotulo="Ouvir os motivos" />}
      </div>
      <p className="mt-2 max-w-[56ch] text-lg text-tinta-suave">
        Olhamos os números da sua conta e mostramos o que pode ter pesado. São estimativas: a conta tem impostos e taxas que mudam de cidade para cidade.
      </p>

      {contas.length === 0 ? (
        <SemConta />
      ) : (
        <>
          <section aria-labelledby="qual-conta" className="mt-8 rounded-[var(--radius-cartao)] bg-papel p-5 sm:p-6">
            <h2 id="qual-conta" className="text-xl font-bold">
              Qual conta?
            </h2>
            <label htmlFor="conta-escolhida" className="sr-only">
              Mês da conta
            </label>
            <select
              id="conta-escolhida"
              value={conta?.id}
              onChange={(e) => setIdEscolhido(e.target.value)}
              className="mt-3 min-h-12 w-full rounded-[var(--radius-controle)] border-2 border-linha bg-papel px-4 text-lg font-bold first-letter:uppercase"
            >
              {contas.map((c) => (
                <option key={c.id} value={c.id}>
                  {formatarCompetencia(c.competencia)}: {formatarReais(c.valor)}
                </option>
              ))}
            </select>

            {conta && (
              <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Numero rotulo="Esta conta" valor={formatarReais(conta.valor)} detalhe={formatarKwh(conta.kwh)} />
                <Numero
                  rotulo="Conta anterior"
                  valor={anterior ? formatarReais(anterior.valor) : "Não anotada"}
                  detalhe={anterior ? `${formatarKwh(anterior.kwh)}, ${formatarCompetencia(anterior.competencia)}` : "Anote para comparar"}
                />
                <Numero
                  rotulo="Sua casa explica"
                  valor={residencia && resumo.conta.consumoKwh > 0 ? formatarKwh(resumo.conta.consumoKwh) : "Sem aparelhos"}
                  detalhe="estimativa por mês"
                />
              </dl>
            )}

            <div className="mt-5 max-w-sm">
              <Campo
                rotulo="Quantos dias a conta cobre? (se quiser)"
                id={idDosDias}
                ajuda="Conte os dias entre a data da leitura anterior e a da atual, que estão na conta."
                erro={textoDosDias !== "" && dias === undefined ? `Digite um número de ${DIAS.min} a ${DIAS.max}.` : undefined}
              >
                <Entrada
                  id={idDosDias}
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={2}
                  value={textoDosDias}
                  onChange={(e) => setTextoDosDias(e.target.value.replace(/\D/g, ""))}
                  sufixo="dias"
                  placeholder="Ex.: 32"
                />
              </Campo>
            </div>
          </section>

          <section aria-labelledby="o-que-pesou" className="mt-8">
            <h2 id="o-que-pesou" className="text-[1.375rem] font-bold tracking-tight">
              O que pode ter pesado
            </h2>
            {conta && anterior && conta.valor !== anterior.valor && (
              <p className="mt-1 text-lg">
                Esta conta veio{" "}
                <strong className="numeros">
                  {formatarReais(Math.abs(conta.valor - anterior.valor))} {conta.valor > anterior.valor ? "a mais" : "a menos"}
                </strong>{" "}
                que a de {formatarCompetencia(anterior.competencia)}.
              </p>
            )}
            <div aria-live="polite" className="mt-4 space-y-3">
              {carregando ? (
                <p className="text-tinta-suave">Buscando a bandeira e o preço da sua cidade…</p>
              ) : motivos.length === 0 ? (
                <p className="rounded-[var(--radius-cartao)] bg-papel p-5">
                  Pelos números anotados, nenhum motivo se destacou: o consumo e o preço do kWh ficaram parecidos. Se a conta ainda parece alta, faça o teste do
                  relógio abaixo e confira a leitura.
                </p>
              ) : (
                motivos.map((m) => <CartaoDoMotivo key={m.id} motivo={m} />)
              )}
            </div>
          </section>
        </>
      )}

      <Passos
        id="teste-do-relogio"
        icone="raio"
        titulo="Faça o teste do relógio"
        introducao="Descobre se a casa gasta energia mesmo com tudo desligado: fuga de energia ou aparelho com defeito."
        passos={PASSOS_DO_TESTE}
      />
      <Passos
        id="como-reclamar"
        icone="conta-de-luz"
        titulo="Ainda acha que a conta está errada?"
        introducao="Você tem direito de pedir que a empresa de luz confira a conta, sem pagar nada por isso."
        passos={PASSOS_DA_RECLAMACAO}
      />
    </div>
  );
}

function lerDias(texto: string): number | undefined {
  if (texto === "") return undefined;
  const n = Number(texto);
  return Number.isInteger(n) && n >= DIAS.min && n <= DIAS.max ? n : undefined;
}

function SemConta() {
  return (
    <div className="mt-8 flex flex-col items-start gap-4 rounded-[var(--radius-cartao)] bg-papel p-5 sm:flex-row sm:items-center sm:p-6">
      <Receipt className="size-10 shrink-0 text-energia" aria-hidden />
      <p className="flex-1">Para comparar, anote a conta que veio alta (e, se tiver, a do mês anterior). Leva 30 segundos.</p>
      <Link href="/casa#titulo-acompanhamento" className={classesDeBotao("principal")}>
        Anotar conta
      </Link>
    </div>
  );
}

function Numero({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe: string }) {
  return (
    <div className="rounded-[var(--radius-controle)] bg-fundo p-4">
      <dt className="text-[0.95rem] font-bold text-tinta-suave">{rotulo}</dt>
      <dd className="numeros mt-1 text-xl font-extrabold">{valor}</dd>
      <dd className="text-[0.9rem] text-tinta-suave first-letter:uppercase">{detalhe}</dd>
    </div>
  );
}

function CartaoDoMotivo({ motivo }: { motivo: MotivoDaContaAlta }) {
  const forte = motivo.forca === "forte";
  return (
    <article className={`rounded-[var(--radius-cartao)] border-l-4 bg-papel p-5 ${forte ? "border-alerta" : "border-faisca"}`}>
      <p className={`inline-flex items-center gap-1.5 text-[0.9rem] font-bold ${forte ? "text-alerta" : "text-tinta-suave"}`}>
        {forte ? <Search className="size-4" aria-hidden /> : <CircleHelp className="size-4" aria-hidden />}
        {forte ? "Os números mostram" : "Vale conferir"}
      </p>
      <h3 className="mt-1 text-lg font-bold">{motivo.titulo}</h3>
      <p className="mt-1 text-tinta-suave">{motivo.texto}</p>
    </article>
  );
}

function Passos({ id, icone, titulo, introducao, passos }: { id: string; icone: string; titulo: string; introducao: string; passos: readonly { titulo: string; texto: string }[] }) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="mt-10 scroll-mt-24">
      <div className="flex items-center gap-3">
        <IconeComFundo nome={icone} />
        <h2 id={`${id}-titulo`} className="text-[1.375rem] font-bold tracking-tight">
          {titulo}
        </h2>
      </div>
      <p className="mt-2 max-w-[56ch] text-tinta-suave">{introducao}</p>
      <ol className="mt-4 space-y-3">
        {passos.map((p, i) => (
          <li key={p.titulo} className="flex gap-4 rounded-[var(--radius-cartao)] bg-papel p-5">
            <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-energia-claro font-extrabold text-energia">
              {i + 1}
            </span>
            <div>
              <h3 className="font-bold">{p.titulo}</h3>
              <p className="mt-1 text-tinta-suave">{p.texto}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
