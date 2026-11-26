import type { Metadata } from "next";
import Link from "next/link";
import { contatoDoSite } from "@/aplicacao/contato.servidor";
import { VERSAO_DOS_TERMOS } from "@/config/termos";
import { dataDaVersao, PaginaDeTexto } from "@/funcionalidades/legal/PaginaDeTexto";

export const metadata: Metadata = { title: "Política de privacidade" };

/**
 * Política de privacidade (LGPD), escrita a partir do que o código faz (ADR-007, ADR-008, ADR-009). Mudou o que o site
 * guarda ou manda? Mude este texto e a VERSAO_DOS_TERMOS (config/termos.ts).
 */
export default function Privacidade() {
  const { email, responsavel } = contatoDoSite();
  return (
    <PaginaDeTexto titulo="Política de privacidade" versao={dataDaVersao(VERSAO_DOS_TERMOS)}>
      <p>
        O Eficiência Energética é um site gratuito para entender a conta de luz. Ele foi feito para guardar o mínimo possível sobre você. Aqui está, em
        palavras simples, o que guardamos, onde, para quê e como apagar.
      </p>

      <section aria-labelledby="sem-conta">
        <h2 id="sem-conta">Sem conta: tudo fica no seu aparelho</h2>
        <p>
          Não pedimos nome, CPF, endereço nem telefone. O que você cadastra fica guardado só no navegador deste aparelho: a cidade e a empresa de luz, o
          benefício (Tarifa Social), o tipo de ligação, quantas pessoas moram, os cômodos, os aparelhos, as contas de luz, as leituras do relógio, a meta,
          as dicas marcadas e as escolhas de leitura (letra maior, mais contraste). Nada disso vai para nenhum servidor.
        </p>
        <p>Para mostrar os preços, o site baixa arquivos públicos da ANEEL e do IBGE, iguais para todo mundo. Baixar esses arquivos não envia nada seu.</p>
      </section>

      <section aria-labelledby="contagem">
        <h2 id="contagem">Contagem de uso, sem saber quem é você</h2>
        <p>
          Para saber se o site está ajudando, ele conta, por dia, quantas vezes algumas coisas acontecem: abrir o site, terminar o cadastro, anotar uma
          conta, pôr uma dica no plano, definir uma meta, compartilhar, imprimir, ouvir a tela e abrir a comparação. Quando você anota uma conta, conta só se
          a estimativa ficou perto ou longe dela, nunca os números.
        </p>
        <p>
          Não guardamos quem fez, de onde, nem a que horas: só o total do dia. Não usamos cookie para isso, nem ferramentas de propaganda. Se o seu navegador
          está com &quot;Não rastrear&quot; ou &quot;Controle Global de Privacidade&quot; ligado, o site não conta nada.
        </p>
      </section>

      <section aria-labelledby="opiniao">
        <h2 id="opiniao">&quot;Isto te ajudou?&quot;</h2>
        <p>
          Se você responder, guardamos a nota de 1 a 5, a parte do site (painel, dicas) e o dia, e o texto, se você escrever. É anônimo: não pedimos nem
          guardamos nada que diga quem você é, e o site recusa texto com telefone ou e-mail.
        </p>
      </section>

      <section aria-labelledby="com-conta">
        <h2 id="com-conta">Com conta (opcional)</h2>
        <p>Se você criar uma conta, para abrir a casa em outro celular e mandar links para a família, guardamos:</p>
        <ul>
          <li>o seu e-mail e a sua senha (só uma versão embaralhada dela, que não volta para a senha);</li>
          <li>a sua casa, com tudo o que está na lista acima, cifrada: quem abrir o banco de dados não consegue ler;</li>
          <li>os links da família (só um código embaralhado de cada um) e o nome que você der a eles;</li>
          <li>quando você concordou com estes termos e qual versão deles.</li>
        </ul>
        <p>
          Para entrar na conta, o site usa um cookie só, cifrado, que não mostra o seu e-mail. A sessão dura até 30 dias. Quem abre um link da família vê a
          cidade, a conta estimada, os cômodos, os aparelhos e as 3 últimas contas de luz; não vê o seu e-mail, quantas pessoas moram, a meta nem as leituras.
        </p>
      </section>

      <section aria-labelledby="onde">
        <h2 id="onde">Onde os dados ficam e quem ajuda a guardar</h2>
        <ul>
          <li>Banco de dados da conta: Supabase, com os dados em São Paulo (Brasil).</li>
          <li>Site: Vercel, com as funções do site rodando em São Paulo. Como todo site, a Vercel registra por pouco tempo dados técnicos de acesso.</li>
          <li>E-mails da conta (confirmar e trocar a senha): enviados por um serviço de e-mail, só para o seu endereço.</li>
        </ul>
        <p>
          Para evitar abuso (alguém tentando adivinhar senhas, por exemplo), o site conta tentativas por endereço de internet. O endereço vira um código
          embaralhado que não volta para ele, e a contagem some em um dia.
        </p>
      </section>

      <section aria-labelledby="quanto-tempo">
        <h2 id="quanto-tempo">Por quanto tempo</h2>
        <ul>
          <li>No aparelho: até você apagar.</li>
          <li>Conta: até você apagar. Conta criada e não confirmada pelo e-mail some sozinha em 7 dias.</li>
          <li>Contagem de uso e opiniões: guardadas sem identificar ninguém, para comparar o uso ao longo do tempo.</li>
        </ul>
      </section>

      <section aria-labelledby="direitos">
        <h2 id="direitos">Os seus direitos e como usar</h2>
        <p>Pela Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018), você pode saber, ver, corrigir, levar e apagar os seus dados. No site:</p>
        <ul>
          <li>Ver e corrigir: tudo fica nas telas do site, e você muda quando quiser.</li>
          <li>Levar: em Minha casa, &quot;Baixar meus dados&quot; baixa um arquivo com tudo o que está guardado.</li>
          <li>
            Apagar: em Minha casa, &quot;Apagar todos os meus dados&quot; apaga o que está no aparelho e, se você tem conta, a conta, a casa guardada nela e
            os links da família.
          </li>
        </ul>
      </section>

      <section aria-labelledby="contato">
        <h2 id="contato">Quem cuida e como falar com a gente</h2>
        <p>
          O site é um projeto independente{responsavel ? <>, mantido por {responsavel}</> : null}. Para dúvidas, pedidos sobre os seus dados ou problemas de
          privacidade,{" "}
          {email ? (
            <>
              escreva para <a href={`mailto:${email}`} className="font-bold text-energia underline underline-offset-4">{email}</a>.
            </>
          ) : (
            <>o endereço de contato vai ser publicado aqui em breve.</>
          )}
        </p>
        <p>
          Se este texto mudar, a data no alto muda junto. Veja também os{" "}
          <Link href="/termos" className="font-bold text-energia underline underline-offset-4">
            Termos de uso
          </Link>
          .
        </p>
      </section>
    </PaginaDeTexto>
  );
}
