import { BANDEIRAS, bandeiraDoMes, competenciaAtual, formatarCompetencia, type ArquivoTarifas } from "@ee/core";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import Link from "next/link";
import { BotaoComecar } from "@/components/BotaoComecar";
import { BarraEtiqueta } from "@/components/Etiqueta";
import { Icone } from "@/components/Icone";
import { EspacoReservado } from "@/components/EspacoReservado";
import { CasaIlustrada } from "@/components/inicio/CasaIlustrada";
import { Marca } from "@/components/Marca";
import { Contagem, Revelar, TransicaoTela } from "@/components/Movimento";
import { Simulador } from "@/components/Simulador";

// Os números da página vêm dos dados da ANEEL, que são atualizados todo dia.
export const revalidate = 86400;

async function numerosReais() {
  try {
    const pasta = join(process.cwd(), "public", "dados");
    const tarifas = JSON.parse(await readFile(join(pasta, "tarifas.json"), "utf8")) as ArquivoTarifas;
    const relatorio = JSON.parse(await readFile(join(pasta, "relatorio.json"), "utf8")) as { municipios: number; municipiosSemDistribuidora: number };
    const bandeira = bandeiraDoMes(tarifas.bandeiras, competenciaAtual());
    return {
      distribuidoras: tarifas.distribuidoras.length,
      cidades: relatorio.municipios - relatorio.municipiosSemDistribuidora,
      bandeira: bandeira?.bandeira,
    };
  } catch {
    return undefined;
  }
}

const RANKING = [
  { nome: "Chuveiro elétrico", valor: "R$ 53,74", relativo: 1, participacao: 0.47 },
  { nome: "Geladeira", valor: "R$ 20,36", relativo: 0.38, participacao: 0.18 },
  { nome: "Ventilador", valor: "R$ 19,54", relativo: 0.36, participacao: 0.17 },
  { nome: "TV", valor: "R$ 7,33", relativo: 0.14, participacao: 0.06 },
  { nome: "Lâmpadas de LED", valor: "R$ 5,50", relativo: 0.1, participacao: 0.05 },
];

const PERGUNTAS = [
  {
    p: "Precisa pagar ou criar conta?",
    r: "Não. É grátis e não pede nome, CPF nem e-mail. O que você cadastra fica guardado só no seu celular ou computador.",
  },
  {
    p: "O valor vai ser igual ao da minha conta?",
    r: "Fica perto, mas é uma estimativa. A tarifa da ANEEL não inclui impostos nem a taxa de iluminação pública, que mudam por cidade. Se você anotar uma conta de luz, o cálculo passa a usar o preço real do kWh que você paga.",
  },
  {
    p: "Não sei a potência dos meus aparelhos. E agora?",
    r: "Não tem problema. Cada aparelho já vem com um valor comum, e o tempo de uso pode ser escolhido com um toque. Se quiser mais precisão, o sistema mostra onde fica a etiqueta de cada aparelho.",
  },
  {
    p: "De onde vêm a tarifa e a bandeira?",
    r: "Dos dados abertos da ANEEL, a agência que regula a energia no Brasil. Uma rotina confere as tarifas de cada distribuidora e a bandeira do mês todos os dias.",
  },
  {
    p: "Funciona para apartamento, quitinete ou casa alugada?",
    r: "Sim. Você escolhe quantos cômodos tem e o que tem em cada um, do jeito que for a sua casa.",
  },
];

export default async function Inicio() {
  const numeros = await numerosReais();
  const infoBandeira = numeros?.bandeira ? BANDEIRAS[numeros.bandeira.bandeira] : undefined;

  return (
    <TransicaoTela>
    <div className="min-h-dvh bg-papel">
      {/* Topo e abertura, em fundo noturno de largura total */}
      <div className="bg-noite text-white">
        <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 pt-4 sm:px-8">
          <Marca />
          <nav aria-label="Página inicial" className="hidden items-center gap-7 font-bold text-white/80 md:flex">
            <a href="#como-funciona" className="hover:text-white">
              Como funciona
            </a>
            <a href="#tarifa-social" className="hover:text-white">
              Tarifa Social
            </a>
            <a href="#perguntas" className="hover:text-white">
              Perguntas
            </a>
          </nav>
          <BotaoComecar compacto estilo="contorno" />
        </header>

        <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pt-14 pb-16 sm:px-8 lg:min-h-[calc(92dvh-4.5rem)] lg:grid-cols-[1.15fr_1fr] lg:gap-14 lg:pt-10">
          <div>
            <h1 className="titulo-largo surgir text-[clamp(2.6rem,8.4vw,4.3rem)]" style={{ animationDelay: "80ms", animationDuration: "700ms" }}>
              A conta de luz, cômodo por cômodo.
            </h1>
            <p className="surgir mt-7 max-w-[44ch] text-lg leading-relaxed text-white/80 sm:text-xl" style={{ animationDelay: "220ms" }}>
              Diga o que tem em cada cômodo da sua casa e descubra quanto cada aparelho custa por mês, com a tarifa da sua cidade e a bandeira do mês. Depois, veja como pagar menos.
            </p>
            <div className="surgir mt-9 flex flex-wrap items-center gap-x-6 gap-y-3" style={{ animationDelay: "360ms" }}>
              <BotaoComecar estilo="faisca" />
              <span className="text-white/70">Grátis. Não pede nome nem e-mail.</span>
            </div>
          </div>
          <CasaIlustrada />
        </section>
      </div>

      {/* Números */}
      <section aria-labelledby="numeros" className="border-b border-linha">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
          <h2 id="numeros" className="max-w-[24ch] text-[1.6rem] leading-tight font-extrabold tracking-tight sm:text-[2rem]">
            Dados oficiais, conferidos todos os dias
          </h2>
          <dl className="mt-10 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            <Revelar className="border-t-4 border-tinta pt-4">
              <dt className="sr-only">Distribuidoras</dt>
              <dd className="titulo-largo numeros text-[3.4rem]">{numeros ? <Contagem valor={numeros.distribuidoras} /> : "100+"}</dd>
              <dd className="mt-2 text-tinta-suave">distribuidoras de energia com a tarifa residencial vigente</dd>
            </Revelar>
            <Revelar className="border-t-4 border-tinta pt-4" atraso={100}>
              <dt className="sr-only">Cidades</dt>
              <dd className="titulo-largo numeros text-[3.4rem]">{numeros ? <Contagem valor={numeros.cidades} /> : "5.500+"}</dd>
              <dd className="mt-2 text-tinta-suave">cidades do Brasil já sabem qual empresa as atende</dd>
            </Revelar>
            <RevelarBandeira cor={infoBandeira?.cor}>
              <dt className="sr-only">Bandeira do mês</dt>
              <dd className="titulo-largo text-[3.4rem]">{infoBandeira ? infoBandeira.nome.split(" ")[0] : "Bandeira"}</dd>
              <dd className="mt-2 text-tinta-suave">{numeros?.bandeira ? `é a bandeira tarifária de ${formatarCompetencia(numeros.bandeira.competencia)}` : "do mês, direto da ANEEL"}</dd>
            </RevelarBandeira>
            <Revelar className="border-t-4 border-energia pt-4" atraso={300}>
              <dt className="sr-only">Tarifa Social</dt>
              <dd className="titulo-largo numeros text-[3.4rem]">
                <Contagem valor={80} sufixo=" kWh" />
              </dd>
              <dd className="mt-2 text-tinta-suave">por mês sem pagar nada para famílias com Tarifa Social</dd>
            </Revelar>
          </dl>
        </div>
      </section>

      {/* Simulador */}
      <section aria-labelledby="experimente" className="bg-fundo">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <Revelar>
            <h2 id="experimente" className="titulo-largo text-[clamp(2.2rem,5.5vw,3.6rem)]">
              Quanto custa um banho de 10 minutos?
            </h2>
            <p className="mt-6 max-w-[46ch] text-lg text-tinta-suave">
              O chuveiro elétrico costuma ser o que mais pesa na conta. Mude o tempo e veja o valor mudar. Depois do cadastro, a conta usa a tarifa da sua cidade e o que você tem em casa.
            </p>
          </Revelar>
          <Revelar atraso={150}>
            <Simulador />
          </Revelar>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" aria-labelledby="titulo-como" className="scroll-mt-4">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
          <Revelar>
            <h2 id="titulo-como" className="titulo-largo max-w-[18ch] text-[clamp(2.2rem,5.5vw,3.6rem)]">
              Três passos e você sabe onde está o gasto
            </h2>
          </Revelar>
          <div className="mt-14 grid gap-14 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
            <ol className="space-y-10">
              {[
                ["Diga onde você mora", "Com o estado e a cidade, usamos a tarifa da distribuidora que atende a sua rua e a bandeira do mês."],
                ["Conte os cômodos e o que tem em cada um", "Quartos, banheiro, cozinha… Cada cômodo já vem com os aparelhos comuns. É só dizer quantos tem: 2 TVs, 3 lâmpadas, 1 chuveiro."],
                ["Acompanhe e economize", "Veja quanto cada cômodo e cada aparelho custa, anote suas contas de luz mês a mês e monte um plano com as dicas que mais economizam."],
              ].map(([titulo, texto], i) => (
                <Revelar como="li" key={titulo} atraso={i * 120} className="grid grid-cols-[auto_1fr] gap-5">
                  <span className="titulo-largo numeros text-[3.2rem] text-energia">{i + 1}</span>
                  <div className="pt-1">
                    <h3 className="text-2xl font-extrabold tracking-tight">{titulo}</h3>
                    <p className="mt-2 max-w-[50ch] text-lg text-tinta-suave">{texto}</p>
                  </div>
                </Revelar>
              ))}
            </ol>

            <Revelar como="figure" atraso={150} className="self-start rounded-[1.75rem] border-2 border-linha p-6 sm:p-8">
              <figcaption className="text-xl font-extrabold">Quem mais gasta na casa do exemplo</figcaption>
              <ul className="mt-6 space-y-4">
                {RANKING.map((a, i) => (
                  <li key={a.nome}>
                    <div className="mb-1.5 font-bold">{a.nome}</div>
                    <BarraEtiqueta relativo={a.relativo} participacao={a.participacao} atraso={300 + i * 120}>
                      {a.valor}
                    </BarraEtiqueta>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-tinta-suave">As cores são as da etiqueta amarela dos eletrodomésticos: verde pesa pouco, vermelho pesa muito.</p>
            </Revelar>
          </div>
        </div>
      </section>

      {/* Tarifa Social: faixa de largura total */}
      <section id="tarifa-social" aria-labelledby="titulo-social" className="scroll-mt-4 bg-energia text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <Revelar>
            <h2 id="titulo-social" className="titulo-largo text-[clamp(2.2rem,5.5vw,3.6rem)]">
              Sua família pode pagar menos na conta de luz
            </h2>
            <p className="mt-6 max-w-[48ch] text-lg text-white/85">
              Desde 2025, famílias de baixa renda inscritas no CadÚnico têm direito a desconto ou isenção. O desconto é aplicado pela distribuidora automaticamente, e o nosso cálculo já considera a regra.
            </p>
            <div className="mt-9">
              <BotaoComecar estilo="faisca" texto="Calcular a minha conta" />
            </div>
          </Revelar>
          <dl className="grid gap-6 self-center">
            <Revelar className="rounded-[1.5rem] bg-white/10 p-6" atraso={100}>
              <dt className="text-lg font-bold">Tarifa Social</dt>
              <dd className="titulo-largo mt-2 text-[2.6rem]">80 kWh grátis</dd>
              <dd className="mt-2 text-white/85">Para famílias com renda de até meio salário mínimo por pessoa, ou que recebem o BPC.</dd>
            </Revelar>
            <Revelar className="rounded-[1.5rem] bg-white/10 p-6" atraso={220}>
              <dt className="text-lg font-bold">Desconto Social</dt>
              <dd className="titulo-largo mt-2 text-[2.6rem]">até 120 kWh</dd>
              <dd className="mt-2 text-white/85">Com desconto para famílias com renda entre meio e um salário mínimo por pessoa.</dd>
            </Revelar>
            <p className="flex gap-3 text-white/85">
              <Icone nome="hand-heart" className="mt-0.5 size-6 shrink-0" /> Para se inscrever no CadÚnico, procure o CRAS da sua cidade com os documentos da família.
            </p>
          </dl>
        </div>
      </section>

      {/* Garantias */}
      <section aria-label="Como o sistema cuida de você" className="border-b border-linha">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
          {[
            ["badge-check", "Feito com dados públicos", "Tarifas e bandeiras da ANEEL, a agência que regula a energia elétrica no Brasil."],
            ["plug-zap", "Seus dados ficam com você", "Nada sai do seu aparelho. Não pedimos nome, CPF, e-mail nem endereço."],
            ["smartphone", "Pensado para o celular", "Letras grandes, botões fáceis de tocar e leve para celulares simples."],
            ["lightbulb", "Dicas com valor em reais", "Cada dica mostra quanto economiza na sua casa, por mês e por ano."],
          ].map(([icone, titulo, texto], i) => (
            <Revelar key={titulo} atraso={i * 90}>
              <Icone nome={icone} className="size-8 text-energia" />
              <h3 className="mt-4 text-xl font-extrabold">{titulo}</h3>
              <p className="mt-2 text-tinta-suave">{texto}</p>
            </Revelar>
          ))}
        </div>
      </section>

      <EspacoReservado posicao="inicio-antes-perguntas" />

      {/* Perguntas */}
      <section id="perguntas" aria-labelledby="titulo-perguntas" className="scroll-mt-4">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-8 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          <h2 id="titulo-perguntas" className="titulo-largo text-[clamp(2.2rem,5.5vw,3.6rem)]">
            Perguntas comuns
          </h2>
          <Revelar className="divide-y divide-linha border-y border-linha">
            {PERGUNTAS.map(({ p, r }) => (
              <details key={p} className="group py-2">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-xl font-extrabold [&::-webkit-details-marker]:hidden">
                  {p}
                  <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-fundo text-2xl leading-none text-energia transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="max-w-[62ch] pb-4 text-lg text-tinta-suave">{r}</p>
              </details>
            ))}
          </Revelar>
        </div>
      </section>

      {/* Chamada final e rodapé */}
      <footer className="bg-noite text-white">
        <div className="mx-auto max-w-7xl px-4 pt-20 pb-10 sm:px-8">
          <Revelar className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="titulo-largo max-w-[14ch] text-[clamp(2.6rem,7vw,4.8rem)]">Comece pela sua casa.</h2>
            <BotaoComecar estilo="faisca" />
          </Revelar>
          <div className="mt-16 flex flex-col gap-6 border-t border-white/15 pt-8 text-white/70 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <Marca />
              <p className="max-w-[52ch]">Um projeto gratuito para ajudar as famílias a pagar menos na conta de luz.</p>
            </div>
            <ul className="space-y-2 font-bold">
              <li>
                <Link href="/sobre" className="hover:text-white">
                  Sobre o projeto e as fontes dos dados
                </Link>
              </li>
              <li>
                <a href="https://dadosabertos.aneel.gov.br" className="hover:text-white">
                  Dados abertos da ANEEL
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
    </TransicaoTela>
  );
}

/** Bloco da bandeira, com a borda na cor da bandeira do mês. */
function RevelarBandeira({ cor, children }: { cor?: string; children: React.ReactNode }) {
  return (
    <Revelar className="border-t-4 pt-4" atraso={200} estilo={{ borderColor: cor ?? "var(--color-tinta)" }}>
      {children}
    </Revelar>
  );
}
