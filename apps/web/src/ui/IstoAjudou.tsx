"use client";

import { Annoyed, Frown, Laugh, Meh, Smile, type LucideIcon } from "lucide-react";
import { useId, useState } from "react";
import { Aviso } from "@/ui/Aviso";
import { Botao } from "@/ui/Botao";

const NOTAS: { nota: number; rotulo: string; Icone: LucideIcon }[] = [
  { nota: 1, rotulo: "Não ajudou", Icone: Frown },
  { nota: 2, rotulo: "Ajudou pouco", Icone: Annoyed },
  { nota: 3, rotulo: "Mais ou menos", Icone: Meh },
  { nota: 4, rotulo: "Ajudou", Icone: Smile },
  { nota: 5, rotulo: "Ajudou muito", Icone: Laugh },
];

/**
 * "Isto te ajudou?" (E12, ADR-009): cinco carinhas, de "Não ajudou" a "Ajudou muito", e um texto opcional curto. Sem
 * regra de negócio: quem usa diz o que fazer ao enviar e ao dispensar. Nunca abre sozinho por cima da tela: é um
 * cartão no fim da página, que a pessoa pode ignorar.
 */
export function IstoAjudou({
  pergunta,
  aoEnviar,
  aoDispensar,
}: {
  pergunta: string;
  aoEnviar: (nota: number, texto: string) => Promise<{ ok: true } | { ok: false; mensagem: string }>;
  aoDispensar: () => void;
}) {
  const id = useId();
  const [nota, setNota] = useState<number>();
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState<"escolhendo" | "enviando" | "enviada">("escolhendo");
  const [erro, setErro] = useState<string>();

  if (estado === "enviada") {
    return (
      <div role="status" className="rounded-[var(--radius-cartao)] bg-energia-claro p-5 font-bold text-energia-forte">
        Obrigado! A sua opinião ajuda a melhorar o site.
      </div>
    );
  }

  return (
    <section aria-labelledby={`${id}-titulo`} className="rounded-[var(--radius-cartao)] border border-linha/70 bg-papel p-5 sm:p-6">
      <h2 id={`${id}-titulo`} className="text-lg font-bold">
        {pergunta}
      </h2>
      <fieldset className="mt-3">
        <legend className="sr-only">Escolha de 1 a 5</legend>
        <div className="grid grid-cols-5 gap-2">
          {NOTAS.map(({ nota: valor, rotulo, Icone }) => {
            const escolhida = nota === valor;
            return (
              <label
                key={valor}
                className={`flex min-h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-[var(--radius-controle)] border-2 px-1 py-2 text-center text-[0.8rem] leading-tight font-bold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-faisca ${
                  escolhida ? "border-energia bg-energia-claro text-energia-forte" : "border-linha text-tinta-suave hover:border-energia/50"
                }`}
              >
                <input type="radio" name={`${id}-nota`} value={valor} checked={escolhida} onChange={() => setNota(valor)} className="sr-only" />
                <Icone aria-hidden className={`size-7 ${escolhida ? "pulo" : ""}`} strokeWidth={2.2} />
                <span>{rotulo}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {nota !== undefined && (
        <div className="mt-4 space-y-2">
          <label htmlFor={`${id}-texto`} className="block font-bold">
            Quer contar mais? (opcional)
          </label>
          <textarea
            id={`${id}-texto`}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={280}
            rows={3}
            aria-describedby={`${id}-ajuda`}
            className="w-full rounded-[var(--radius-controle)] border-2 border-linha bg-papel px-4 py-3 text-lg outline-none focus:border-energia"
          />
          <p id={`${id}-ajuda`} className="text-[0.95rem] text-tinta-suave">
            É anônimo. Não escreva nome, telefone nem endereço. {280 - [...texto].length} letras restantes.
          </p>
        </div>
      )}

      <div role="status" className="mt-3 empty:hidden">
        {erro && (
          <Aviso tom="alerta" anunciar={false}>
            {erro}
          </Aviso>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {nota !== undefined && (
          <Botao
            disabled={estado === "enviando"}
            onClick={async () => {
              setEstado("enviando");
              setErro(undefined);
              const resultado = await aoEnviar(nota, texto);
              if (resultado.ok) setEstado("enviada");
              else {
                setEstado("escolhendo");
                setErro(resultado.mensagem);
              }
            }}
          >
            {estado === "enviando" ? "Enviando…" : "Enviar"}
          </Botao>
        )}
        <Botao variante="fantasma" onClick={aoDispensar}>
          Agora não
        </Botao>
      </div>
    </section>
  );
}
