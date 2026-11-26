import type { Metadata } from "next";
import Link from "next/link";
import { contatoDoSite } from "@/aplicacao/contato.servidor";
import { VERSAO_DOS_TERMOS } from "@/config/termos";
import { dataDaVersao, PaginaDeTexto } from "@/funcionalidades/legal/PaginaDeTexto";

export const metadata: Metadata = { title: "Termos de uso" };

/** Termos de uso. Mudou algo que muda o combinado com quem usa? Mude a VERSAO_DOS_TERMOS (config/termos.ts). */
export default function Termos() {
  const { email } = contatoDoSite();
  return (
    <PaginaDeTexto titulo="Termos de uso" versao={dataDaVersao(VERSAO_DOS_TERMOS)}>
      <p>Estes são os combinados para usar o Eficiência Energética. São curtos de propósito.</p>

      <section aria-labelledby="o-que-e">
        <h2 id="o-que-e">O que o site é</h2>
        <ul>
          <li>Um site gratuito, para sempre, que mostra quanto cada aparelho pesa na conta de luz e dá dicas para pagar menos.</li>
          <li>Um projeto independente. Não é da ANEEL, de nenhuma distribuidora de energia nem do governo.</li>
          <li>Nenhuma parte essencial pede cadastro ou pagamento. A conta é opcional.</li>
        </ul>
      </section>

      <section aria-labelledby="estimativas">
        <h2 id="estimativas">Os valores são estimativas</h2>
        <p>
          Os valores saem dos aparelhos e dos tempos de uso que você informa e das tarifas públicas da ANEEL. A conta de verdade pode ser diferente: os
          impostos e a taxa de iluminação pública mudam por cidade, e os dias de leitura variam. A conta que vale é a da sua distribuidora.
        </p>
        <p>
          As informações sobre a Tarifa Social ajudam a entender quem pode ter direito, mas quem decide é o CadÚnico e a distribuidora. Use o site para
          entender e planejar, não como documento oficial.
        </p>
      </section>

      <section aria-labelledby="conta">
        <h2 id="conta">Se você criar uma conta</h2>
        <ul>
          <li>Use um e-mail seu e uma senha que só você sabe. Se achar que alguém descobriu a senha, troque e use &quot;Sair de todos os aparelhos&quot;.</li>
          <li>Quem tiver um link da família que você criou vê a sua casa (só para ver). Mande só para quem você quer e apague o link quando quiser.</li>
          <li>Você pode apagar a conta e tudo o que está nela quando quiser, em Minha casa.</li>
        </ul>
      </section>

      <section aria-labelledby="uso">
        <h2 id="uso">Uso justo</h2>
        <p>
          Não use o site para atrapalhar outras pessoas nem o próprio site: tentar entrar na conta de outra pessoa, mandar pedidos em massa por programa ou
          procurar falhas para causar dano. Achou uma falha de segurança? Conte para a gente, sem divulgar antes.
        </p>
      </section>

      <section aria-labelledby="mudancas">
        <h2 id="mudancas">Mudanças</h2>
        <p>
          O site pode mudar, ganhar ou perder partes. Se estes termos mudarem, a data no alto muda junto, e quem criar conta depois concorda com a versão
          nova. O que fazemos com os seus dados está na{" "}
          <Link href="/privacidade" className="font-bold text-energia underline underline-offset-4">
            Política de privacidade
          </Link>
          .
        </p>
        <p>
          {email ? (
            <>
              Dúvidas: <a href={`mailto:${email}`} className="font-bold text-energia underline underline-offset-4">{email}</a>.
            </>
          ) : (
            <>O endereço de contato vai ser publicado em breve.</>
          )}
        </p>
      </section>
    </PaginaDeTexto>
  );
}
