import Link from "next/link";
import { BotaoComecar } from "@/components/BotaoComecar";
import { BarraEtiqueta } from "@/components/Etiqueta";
import { Marca } from "@/components/Marca";
import { Simulador } from "@/components/Simulador";

const EXEMPLO_RANKING = [
  { nome: "Chuveiro elétrico", valor: "R$ 118", relativo: 1, participacao: 0.42 },
  { nome: "Geladeira", valor: "R$ 31", relativo: 0.27, participacao: 0.11 },
  { nome: "TV", valor: "R$ 17", relativo: 0.15, participacao: 0.06 },
  { nome: "Lâmpadas", valor: "R$ 6", relativo: 0.06, participacao: 0.02 },
];

export default function Inicio() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 pt-4 sm:px-6">
        <Marca />
        <BotaoComecar compacto />
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-10 pb-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-14 lg:pt-16">
          <div>
            <h1 className="max-w-[16ch] text-[clamp(2.4rem,7vw,4rem)] leading-[1.02] font-extrabold tracking-tight">Quanto cada aparelho custa na sua conta de luz?</h1>
            <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-tinta-suave">
              Marque os aparelhos da sua casa e por quanto tempo usa. Mostramos quanto cada um gasta por mês, com a tarifa da sua cidade, e o que fazer para pagar menos.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <BotaoComecar />
              <span className="text-tinta-suave">Grátis e sem cadastro</span>
            </div>
          </div>
          <Simulador />
        </section>

        <section aria-labelledby="como-funciona" className="border-y border-linha bg-papel">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 id="como-funciona" className="text-[1.9rem] leading-tight font-extrabold tracking-tight">
              Em três passos, você descobre quem mais gasta
            </h2>
            <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
              <ol className="space-y-6">
                {[
                  ["Diga onde você mora", "Com o estado e a cidade, usamos a tarifa da distribuidora que atende a sua rua e a bandeira do mês, direto dos dados da ANEEL."],
                  ["Marque seus aparelhos", "Chuveiro, geladeira, TV… Já vem com valores comuns. Se quiser, ajuste com o que está escrito na etiqueta."],
                  ["Veja o resultado e as dicas", "Você vê quanto cada aparelho pesa na conta e quanto economiza com cada mudança, em reais."],
                ].map(([titulo, texto], i) => (
                  <li key={titulo} className="flex gap-4">
                    <span className="numeros grid size-11 shrink-0 place-items-center rounded-full bg-energia text-lg font-extrabold text-white">{i + 1}</span>
                    <div>
                      <h3 className="text-xl font-extrabold">{titulo}</h3>
                      <p className="mt-1 max-w-[52ch] text-tinta-suave">{texto}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <figure className="rounded-[var(--radius-cartao)] border-2 border-linha p-5 sm:p-6">
                <figcaption className="flex items-baseline justify-between gap-3">
                  <span className="text-lg font-extrabold">Quem mais gasta</span>
                  <span className="text-[0.95rem] text-tinta-suave">exemplo de uma casa</span>
                </figcaption>
                <ul className="mt-5 space-y-4">
                  {EXEMPLO_RANKING.map((a) => (
                    <li key={a.nome}>
                      <div className="mb-1.5 font-bold">{a.nome}</div>
                      <BarraEtiqueta relativo={a.relativo} participacao={a.participacao}>
                        {a.valor}
                      </BarraEtiqueta>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-[0.95rem] text-tinta-suave">As cores são as mesmas da etiqueta amarela dos eletrodomésticos: verde pesa pouco, vermelho pesa muito.</p>
              </figure>
            </div>
          </div>
        </section>

        <section aria-labelledby="para-quem" className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 id="para-quem" className="text-[1.9rem] leading-tight font-extrabold tracking-tight">
              Feito para ajudar a família a economizar
            </h2>
            <p className="mt-4 max-w-[52ch] text-lg text-tinta-suave">
              A conta de luz pesa no orçamento. Saber onde está o gasto é o primeiro passo para pagar menos, sem abrir mão do que é importante.
            </p>
          </div>
          <dl className="grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-lg font-extrabold">Tarifa Social</dt>
              <dd className="mt-1 text-tinta-suave">Famílias no CadÚnico com renda de até meio salário mínimo por pessoa não pagam os primeiros 80 kWh do mês. O cálculo já considera isso.</dd>
            </div>
            <div>
              <dt className="text-lg font-extrabold">Tarifa sempre atual</dt>
              <dd className="mt-1 text-tinta-suave">As tarifas e a bandeira vêm dos dados abertos da ANEEL e são conferidas todos os dias.</dd>
            </div>
            <div>
              <dt className="text-lg font-extrabold">Seus dados ficam com você</dt>
              <dd className="mt-1 text-tinta-suave">O que você cadastra fica guardado só neste aparelho. Não pedimos nome, CPF nem e-mail.</dd>
            </div>
            <div>
              <dt className="text-lg font-extrabold">Funciona no celular</dt>
              <dd className="mt-1 text-tinta-suave">Letras grandes, botões fáceis de tocar e funciona mesmo em celulares simples.</dd>
            </div>
          </dl>
        </section>
      </main>

      <footer className="border-t border-linha">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-[0.95rem] text-tinta-suave sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Projeto de pesquisa da Fatec Presidente Prudente — Análise e Desenvolvimento de Sistemas.</p>
          <Link href="/sobre" className="font-bold text-energia underline-offset-4 hover:underline">
            Sobre o projeto e as fontes dos dados
          </Link>
        </div>
      </footer>
    </div>
  );
}
