"use client";

import { useConta } from "@/aplicacao/conta-estado";
import { dispensarConviteDaConta, useConviteDaConta } from "@/aplicacao/convite-da-conta";
import { Botao, BotaoLink } from "@/ui/Botao";
import { focarTitulo } from "@/ui/foco";
import { Folha } from "@/ui/Folha";

/**
 * Logo depois do cadastro, para quem está sem conta e só se o site tem conta: conta que dá para abrir a casa em outro
 * celular. "Agora não" fecha e não volta; a casa continua toda no aparelho (princípio 1: nada atrás de cadastro).
 */
/** Ao fechar, o foco vai para o título da casa: o botão que trouxe a pessoa até aqui já não existe (QA, D3). */
function fechar() {
  dispensarConviteDaConta();
  requestAnimationFrame(focarTitulo);
}

export function ConviteDaConta() {
  const pendente = useConviteDaConta();
  const conta = useConta();
  return (
    <Folha
      aberta={pendente && conta.tipo === "sem-conta"}
      aoFechar={fechar}
      titulo="Ver a sua casa em outro celular"
      rodape={
        <div className="flex flex-col gap-3 sm:flex-row">
          <BotaoLink href="/entrar?modo=criar" onClick={dispensarConviteDaConta}>
            Criar conta grátis
          </BotaoLink>
          <Botao variante="secundario" onClick={fechar}>
            Agora não
          </Botao>
        </div>
      }
    >
      <div className="space-y-3 text-lg">
        <p>A sua casa ficou guardada neste celular.</p>
        <p>Com uma conta de e-mail e senha, você abre a casa em outro celular e pode mandar um link para a família acompanhar a conta.</p>
        <p className="text-tinta-suave">É opcional. Sem conta, tudo continua funcionando aqui.</p>
      </div>
    </Folha>
  );
}
