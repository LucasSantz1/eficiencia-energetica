"use client";

import { Check, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { aparelhoInicial, formatarKwh, formatarReais, itemDoCatalogo, type Aparelho, type ImpactoDaCompra } from "@ee/core";
import { useAntesDeComprar } from "@/aplicacao/antes-de-comprar";
import { EditorAparelho } from "@/ui/aparelho/EditorAparelho";
import { SeletorCatalogo } from "@/ui/aparelho/SeletorCatalogo";
import { Botao } from "@/ui/Botao";
import { classesDeBotao } from "@/ui/estilosDeBotao";
import { IconeComFundo } from "@/ui/Icone";
import { Pilulas } from "@/ui/Pilulas";

/** O aparelho simulado não é de cômodo nenhum: o editor pede um id, e este nunca vai para a casa. */
const SEM_COMODO = "antes-de-comprar";

type Simulado = Omit<Aparelho, "id">;

/**
 * "Antes de comprar: quanto vai pesar?" (pedido do dono, 27/11). A pessoa escolhe o aparelho que pensa em comprar,
 * diz quanto vai usar, e vê quanto a conta da casa sobe por mês e por ano, com o preço e as regras da casa dela
 * (consumo mínimo, Tarifa Social). Nada é guardado, a não ser que ela toque em "Comprei".
 */
export function TelaAntesDeComprar() {
  const { calcular, comodos, tarifaSocial, semPreco, carregando, adicionarNaCasa, preco } = useAntesDeComprar();
  const [escolhendo, setEscolhendo] = useState(false);
  const [editando, setEditando] = useState<Simulado>();
  const [simulado, setSimulado] = useState<Simulado>();
  const [comodoId, setComodoId] = useState<string>();
  const [adicionado, setAdicionado] = useState(false);
  const resultado = useRef<HTMLHeadingElement>(null);

  const impacto = simulado ? calcular(simulado) : undefined;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-[clamp(1.9rem,7vw,2.6rem)] leading-tight font-extrabold tracking-tight">Antes de comprar</h1>
      <p className="mt-2 max-w-[56ch] text-lg text-tinta-suave">
        Vai comprar um aparelho? Veja antes quanto a sua conta de luz vai subir por mês, com o preço da sua cidade. É uma estimativa.
      </p>

      {/* Sem casa cadastrada, a Casca já mostra o "Vamos cadastrar a sua casa". */}
      {carregando ? (
        <p className="mt-8 text-tinta-suave">Buscando o preço da luz na sua cidade…</p>
      ) : semPreco ? (
        <p className="mt-8 rounded-[var(--radius-cartao)] bg-papel p-5">Sem o preço da luz da sua cidade agora, não dá para calcular. Tente de novo mais tarde.</p>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap gap-3">
            <Botao onClick={() => setEscolhendo(true)}>
              <ShoppingBag className="size-5" aria-hidden /> {simulado ? "Escolher outro aparelho" : "Escolher o aparelho"}
            </Botao>
            {simulado && (
              <Botao variante="secundario" onClick={() => setEditando(simulado)}>
                Mudar o uso
              </Botao>
            )}
          </div>

          {simulado && impacto && (
            <section aria-labelledby="resultado-da-compra" className="surgir mt-6 rounded-[var(--radius-cartao)] bg-papel p-5 sm:p-6" aria-live="polite">
              <div className="flex items-center gap-3">
                <IconeComFundo nome={itemDoCatalogo(simulado.catalogoId ?? "")?.icone} />
                <h2 id="resultado-da-compra" ref={resultado} tabIndex={-1} className="text-xl font-bold outline-none">
                  {simulado.nome}
                </h2>
              </div>
              <Resultado impacto={impacto} tarifaSocial={tarifaSocial} />
              <p className="mt-4 text-[0.95rem] text-tinta-suave">
                Gasta cerca de {formatarKwh(impacto.kwhDoAparelho)} por mês com o uso que você escolheu. Preço do kWh usado: {formatarReais(preco.valor)}
                {preco.incluiImpostos ? ", com impostos" : ", sem impostos"}.
              </p>

              <div className="mt-6 border-t border-linha pt-5">
                {adicionado ? (
                  <p className="flex items-center gap-2 font-bold text-energia" role="status">
                    <Check className="size-5" aria-hidden /> Pronto: o aparelho está na sua casa.
                  </p>
                ) : (
                  <>
                    <h3 className="font-bold">Comprou?</h3>
                    {comodos.length > 1 && (
                      <div className="mt-3 space-y-2">
                        <span className="block text-tinta-suave">Em qual cômodo ele vai ficar?</span>
                        <Pilulas rotulo="Cômodo" opcoes={comodos.map((c) => ({ valor: c.id, rotulo: c.nome }))} valor={comodoId ?? comodos[0]?.id ?? ""} aoMudar={setComodoId} />
                      </div>
                    )}
                    <Botao
                      variante="secundario"
                      className="mt-4"
                      disabled={comodos.length === 0}
                      onClick={() => {
                        const destino = comodoId ?? comodos[0]?.id;
                        if (!destino) return;
                        const { comodoId: _semComodo, ...semComodo } = simulado;
                        adicionarNaCasa(semComodo, destino);
                        setAdicionado(true);
                      }}
                    >
                      Adicionar na minha casa
                    </Botao>
                  </>
                )}
              </div>
            </section>
          )}

          {!simulado && (
            <p className="mt-6 max-w-[56ch] text-tinta-suave">
              Serve para qualquer aparelho da lista: ar-condicionado, air fryer, freezer, chuveiro, máquina de lavar… Nada fica guardado, a não ser que
              você toque em &quot;Adicionar na minha casa&quot;.
            </p>
          )}

          <SeletorCatalogo
            aberto={escolhendo}
            aoFechar={() => setEscolhendo(false)}
            aoEscolher={(catalogoId) => {
              const item = itemDoCatalogo(catalogoId);
              setEscolhendo(false);
              if (item) setEditando({ ...aparelhoInicial(item), comodoId: SEM_COMODO });
            }}
          />
          <EditorAparelho
            aparelho={editando}
            aberto={Boolean(editando)}
            aoFechar={() => setEditando(undefined)}
            preco={preco}
            comodos={[]}
            titulo="Quanto vai usar?"
            textoDoBotao="Ver quanto a conta sobe"
            aoSalvar={(dados) => {
              setSimulado({ ...dados, comodoId: SEM_COMODO });
              setAdicionado(false);
              // Depois de fechar a folha, o foco vai para o resultado (o leitor de tela lê o nome e o valor).
              requestAnimationFrame(() => resultado.current?.focus());
            }}
            aoRemover={() => undefined}
          />
        </>
      )}

      <Link href="/casa/comodos" className={`mt-10 ${classesDeBotao("fantasma")}`}>
        Ver os aparelhos da casa
      </Link>
    </div>
  );
}

function Resultado({ impacto, tarifaSocial }: { impacto: ImpactoDaCompra; tarifaSocial: boolean }) {
  if (impacto.aMaisPorMes < 0.5) {
    return (
      <p className="mt-4 text-lg">
        {tarifaSocial
          ? "Quase nada muda na conta: com a Tarifa Social, os primeiros 80 kWh do mês são de graça, e a sua casa com este aparelho ainda cabe nesse limite."
          : "Quase nada muda na conta: a sua casa ainda fica perto do consumo mínimo, que já é cobrado mesmo sem usar."}
      </p>
    );
  }
  return (
    <>
      <p className="mt-4 text-lg">A sua conta deve subir cerca de</p>
      <p className="numeros text-[2.5rem] leading-none font-extrabold text-alerta">+{formatarReais(impacto.aMaisPorMes)}</p>
      <p className="mt-1 text-lg">por mês, ou {formatarReais(impacto.aMaisPorAno)} em um ano.</p>
      <p className="mt-3 text-tinta-suave">
        De {formatarReais(impacto.contaAntes)} para {formatarReais(impacto.contaDepois)} por mês, na estimativa da sua casa.
      </p>
    </>
  );
}
