import type { Metadata } from "next";
import Link from "next/link";
import { Marca } from "@/components/Marca";
import { TransicaoTela, VOLTAR } from "@/components/Movimento";

export const metadata: Metadata = { title: "Sobre o projeto" };

export default function Sobre() {
  return (
    <TransicaoTela>
    <div className="mx-auto max-w-2xl px-4 pt-4 pb-16 sm:px-6">
      <header>
        <Marca />
      </header>
      <main className="mt-10 space-y-10">
        <div>
          <h1 className="text-[2.2rem] leading-tight font-extrabold tracking-tight">Sobre o projeto</h1>
          <p className="mt-4 text-lg text-tinta-suave">
            O Eficiência Energética é um projeto independente e gratuito. O objetivo é ajudar as famílias, principalmente as que mais precisam, a entender onde está o gasto de energia e
            como pagar menos na conta de luz.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-2xl font-extrabold">Como o cálculo é feito</h2>
          <p>
            O consumo de cada aparelho é a potência multiplicada pelo tempo de uso: <strong>E = P × t</strong>. Uma geladeira de 75 W ligada 24 horas gasta 1,8 kWh por dia, ou 54 kWh em 30 dias.
          </p>
          <p>
            O custo é o consumo multiplicado pelo preço do kWh: <strong>Custo = Energia × Tarifa</strong>. A tarifa é a soma da TE (energia) com a TUSD (uso da rede) da sua distribuidora, mais o adicional da bandeira do mês. Com tarifa de R$ 0,65 por
            kWh, aquela geladeira custa R$ 35,10 por mês.
          </p>
          <p>Também consideramos o consumo mínimo cobrado pela distribuidora (30, 50 ou 100 kWh, conforme a ligação) e a Tarifa Social, que isenta os primeiros 80 kWh das famílias de baixa renda.</p>
          <p>
            As tarifas da ANEEL não incluem ICMS, PIS/COFINS nem a taxa de iluminação pública, que mudam por cidade. Por isso a conta real costuma ser maior. Se você informar uma conta de luz, usamos o preço real do kWh que você paga.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-extrabold">De onde vêm os dados</h2>
          <p>Todos os dados são públicos e são conferidos todos os dias por uma rotina automática:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <a className="font-bold text-energia underline underline-offset-2" href="https://dadosabertos.aneel.gov.br/dataset/tarifas-distribuidoras-energia-eletrica">
                Tarifas de aplicação das distribuidoras
              </a>{" "}
              (ANEEL): tarifa residencial B1 convencional vigente de cada distribuidora.
            </li>
            <li>
              <a className="font-bold text-energia underline underline-offset-2" href="https://dadosabertos.aneel.gov.br/dataset/bandeiras-tarifarias">
                Bandeiras tarifárias
              </a>{" "}
              (ANEEL): a bandeira de cada mês e o valor adicional.
            </li>
            <li>
              <a className="font-bold text-energia underline underline-offset-2" href="https://dadosabertos.aneel.gov.br/dataset/indqual-municipio">
                Indicadores de qualidade por município
              </a>{" "}
              (ANEEL): quais distribuidoras atendem cada cidade.
            </li>
            <li>Localidades do IBGE: lista de estados e municípios.</li>
          </ul>
          <p>Os valores de potência e tempo de uso dos aparelhos são referências comuns (PROCEL e etiquetas do INMETRO). Você pode ajustar cada um com os dados do seu aparelho.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-extrabold">Privacidade</h2>
          <p>Não pedimos nome, CPF, e-mail nem endereço. O que você cadastra fica guardado apenas no seu navegador.</p>
        </section>

        <p>
          <Link href="/" transitionTypes={VOLTAR} className="font-bold text-energia underline underline-offset-4">
            Voltar para o início
          </Link>
        </p>
      </main>
    </div>
    </TransicaoTela>
  );
}
