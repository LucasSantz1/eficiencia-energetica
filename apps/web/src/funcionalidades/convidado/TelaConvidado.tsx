"use client";

import { Eye } from "lucide-react";
import Link from "next/link";
import { formatarCompetencia, formatarKwh, formatarReais } from "@ee/core";
import { useCasaDoConvidado, useResumoDaCasa } from "@/aplicacao/convidado";
import { Aviso } from "@/ui/Aviso";
import { useCodigoDoConvite } from "./useCodigoDoConvite";

const DATA_E_HORA = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

/**
 * A casa de quem mandou o link, só para ver (HIS-407, ADR-007). Nenhum botão muda nada: nem a tela tem como, nem o
 * servidor deixaria (a função do banco só lê). Nada fica guardado no aparelho do convidado.
 */
export function TelaConvidado() {
  const codigo = useCodigoDoConvite();
  const estado = useCasaDoConvidado(codigo);
  const casa = estado.tipo === "pronta" ? estado.casa : undefined;
  const dados = useResumoDaCasa(casa);

  return (
    <div>
      <p className="inline-flex items-center gap-2 rounded-full bg-energia-claro px-3 py-1 font-bold text-energia-forte">
        <Eye className="size-4" aria-hidden /> Só para ver
      </p>
      <h1 tabIndex={-1} className="mt-3 text-[2rem] leading-tight font-extrabold tracking-tight">
        Casa compartilhada
      </h1>
      <div role="status" className="mt-4">
        {estado.tipo === "carregando" && <p className="text-tinta-suave">Carregando a casa…</p>}
        {estado.tipo === "sem-codigo" && <Aviso anunciar={false}>Abra esta página pelo link que você recebeu.</Aviso>}
        {estado.tipo === "erro" && <Aviso tom="alerta" anunciar={false}>{estado.mensagem}</Aviso>}
      </div>

      {estado.tipo === "pronta" && casa?.residencia && (
        <>
          <p className="text-lg text-tinta-suave">
            {casa.residencia.municipioNome}
            {dados?.distribuidora ? `, ${dados.distribuidora}` : ""}. Atualizada em {DATA_E_HORA.format(new Date(estado.atualizadaEm))}.
          </p>

          <section aria-labelledby="conv-conta" className="mt-6 rounded-[var(--radius-cartao)] bg-papel p-5">
            <h2 id="conv-conta" className="font-bold text-energia">
              Conta estimada por mês
            </h2>
            {dados ? (
              <>
                <p className="numeros mt-1 text-[2.5rem] leading-none font-extrabold">{formatarReais(dados.resumo.conta.valor)}</p>
                <p className="mt-2 text-tinta-suave">{formatarKwh(dados.resumo.conta.consumoKwh)} por mês. É uma estimativa, pelo tempo de uso que a casa informou.</p>
              </>
            ) : (
              <p className="mt-2 text-tinta-suave">Carregando os preços da luz…</p>
            )}
          </section>

          {dados && dados.resumo.aparelhos.length > 0 && (
            <section aria-labelledby="conv-quem" className="mt-6 rounded-[var(--radius-cartao)] bg-papel p-5">
              <h2 id="conv-quem" className="text-xl font-extrabold">
                Quem gasta mais
              </h2>
              <ol className="mt-3 divide-y divide-separador">
                {dados.resumo.aparelhos.slice(0, 5).map((item) => (
                  <li key={item.aparelho.id} className="flex items-center justify-between gap-3 py-3">
                    <span className="min-w-0 font-bold">{item.aparelho.nome}</span>
                    <span className="numeros shrink-0 text-right">{formatarReais(item.valorMes)} por mês</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {dados && dados.resumo.comodos.length > 0 && (
            <section aria-labelledby="conv-comodos" className="mt-6 rounded-[var(--radius-cartao)] bg-papel p-5">
              <h2 id="conv-comodos" className="text-xl font-extrabold">
                Por cômodo
              </h2>
              <ul className="mt-3 divide-y divide-separador">
                {dados.resumo.comodos.map((c) => (
                  <li key={c.comodoId} className="flex items-center justify-between gap-3 py-3">
                    <span className="min-w-0 font-bold">{casa.comodos.find((x) => x.id === c.comodoId)?.nome ?? "Cômodo"}</span>
                    <span className="numeros shrink-0">{formatarReais(c.valorMes)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {dados && dados.contas.length > 0 && (
            <section aria-labelledby="conv-contas" className="mt-6 rounded-[var(--radius-cartao)] bg-papel p-5">
              <h2 id="conv-contas" className="text-xl font-extrabold">
                Últimas contas de luz
              </h2>
              <ul className="mt-3 divide-y divide-separador">
                {dados.contas.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                    <span className="font-bold first-letter:uppercase">{formatarCompetencia(c.competencia)}</span>
                    <span className="numeros text-right">
                      {formatarReais(c.valor)}, {formatarKwh(c.kwh)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="mt-8 text-tinta-suave">
            Quer ver quanto gasta a sua casa?{" "}
            <Link href="/" className="font-bold text-energia underline underline-offset-2">
              Use o Eficiência Energética de graça
            </Link>
            .
          </p>
        </>
      )}
    </div>
  );
}
