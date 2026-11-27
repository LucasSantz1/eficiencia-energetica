"use client";

import Link from "next/link";
import { useState } from "react";
import { formatarReais, LIMITES } from "@ee/core";
import type { SituacaoDaMeta } from "@ee/core/meta";
import { useMeta } from "@/aplicacao/meta";
import type { useResumo } from "@/aplicacao/resumo";
import { contarUso } from "@/aplicacao/uso";
import { Aviso } from "@/ui/Aviso";
import { Botao, BotaoLink } from "@/ui/Botao";
import { Campo } from "@/ui/Campo";
import { useCampoNumerico } from "@/ui/campos/useCampoNumerico";
import { Entrada } from "@/ui/Entrada";
import { focarTitulo } from "@/ui/foco";
import { focarPrimeiroErro } from "@/ui/foco";
import {
  AJUDA_DA_META,
  cabecalhoDasDicas,
  E_ESTIMATIVA,
  linhaDaConfianca,
  linhaDoDentro,
  linhasDoPiso,
  META_SALVA,
  mensagensDaMeta,
  reais,
  ROTULO_DA_META,
  SEM_CIP_NA_ECONOMIA,
  SO_NESTE_APARELHO,
  tituloDaMeta,
} from "./textosDaMeta";

type Dados = Pick<ReturnType<typeof useResumo>, "aparelhos" | "residencia" | "preco" | "dicas">;

const ID_DO_CAMPO = "meta-valor";
const ID_DO_TITULO = "titulo-meta";
const ID_DO_MUDAR = "meta-mudar";

function focar(id: string) {
  requestAnimationFrame(() => {
    const el = document.getElementById(id);
    if (el && !el.matches("button, input")) el.tabIndex = -1;
    el?.focus();
  });
}

/**
 * Meta de gasto (HIS-104): "quero pagar até R$ X". O campo fica à esquerda e o resultado à direita no computador; no
 * celular, um embaixo do outro. A meta só vive no aparelho (store, versão 3). Nenhuma conta aqui: tudo vem do core.
 */
export function MetaDeGasto({ dados, naFolha = false, className = "" }: { dados: Dados; naFolha?: boolean; className?: string }) {
  const { metaReais, situacao, definirMeta } = useMeta(dados);
  const [editando, setEditando] = useState(false);
  const [tirando, setTirando] = useState(false);
  const [salvou, setSalvou] = useState(false);
  const campo = useCampoNumerico({ faixa: LIMITES.metaMensal, casas: 2, obrigatorio: true, mensagens: mensagensDaMeta(), inicial: metaReais, chave: metaReais, dinheiro: true });
  const mostrarCampo = editando || metaReais === undefined;

  const salvar = () => {
    const resultado = campo.conferir();
    if (focarPrimeiroErro([{ id: ID_DO_CAMPO, resultado }]) || campo.valorValido === undefined) return;
    definirMeta(campo.valorValido);
    contarUso("meta-definida");
    setEditando(false);
    setSalvou(true);
    focar(ID_DO_MUDAR);
  };
  const editarCom = (centavos?: number) => {
    setEditando(true);
    setSalvou(false);
    setTirando(false);
    if (centavos !== undefined) campo.definir(centavos / 100);
    focar(ID_DO_CAMPO);
  };
  const tirar = () => {
    definirMeta(undefined);
    setTirando(false);
    setSalvou(false);
    // Na folha, o título é o da folha (um só, para o leitor de tela não ouvir "Sua meta" duas vezes).
    if (naFolha) requestAnimationFrame(focarTitulo);
    else focar(ID_DO_TITULO);
  };

  return (
    <section
      id="meta"
      aria-labelledby={naFolha ? undefined : ID_DO_TITULO}
      className={naFolha ? className : `scroll-mt-4 rounded-[var(--radius-cartao)] bg-papel p-5 sm:p-6 lg:grid lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-x-10 ${className}`}
    >
      <div>
        {/* Na folha o título é o da própria folha (QA, 25/11: "Sua meta" saía duas vezes no leitor de tela). */}
        {!naFolha && (
          <h2 id={ID_DO_TITULO} className="text-[1.375rem] font-bold tracking-tight">
            Sua meta
          </h2>
        )}
        {mostrarCampo ? (
          <form
            noValidate
            className={naFolha ? "" : "mt-3"}
            onSubmit={(e) => {
              e.preventDefault();
              salvar();
            }}
          >
            <Campo rotulo={ROTULO_DA_META} id={ID_DO_CAMPO} ajuda={AJUDA_DA_META} erro={campo.erro} alerta={campo.alerta}>
              <Entrada id={ID_DO_CAMPO} inputMode="decimal" prefixo="R$" placeholder="Ex.: 120,00" value={campo.texto} onChange={(e) => campo.aoMudar(e.target.value)} onBlur={campo.aoSair} />
            </Campo>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Botao type="submit">Salvar meta</Botao>
              {metaReais !== undefined && (
                <Botao type="button" variante="fantasma" onClick={() => setEditando(false)}>
                  Cancelar
                </Botao>
              )}
            </div>
          </form>
        ) : (
          <div className={naFolha ? "" : "mt-3"}>
            <p className="text-lg">
              Meta: <strong className="numeros">{formatarReais(metaReais ?? 0)}</strong> por mês
            </p>
            {tirando ? (
              <div className="mt-4">
                <p className="font-bold">Tirar a meta de {formatarReais(metaReais ?? 0)}?</p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <Botao type="button" variante="perigo" onClick={tirar}>
                    Sim, tirar
                  </Botao>
                  <Botao type="button" variante="secundario" onClick={() => setTirando(false)}>
                    Manter
                  </Botao>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Botao id={ID_DO_MUDAR} type="button" variante="secundario" onClick={() => editarCom()}>
                  Mudar meta
                </Botao>
                <Botao type="button" variante="fantasma" onClick={() => setTirando(true)}>
                  Tirar a meta
                </Botao>
              </div>
            )}
          </div>
        )}
        {/* Sempre na página (vazia antes de salvar): o leitor anuncia a confirmação e o título do estado, não o cartão inteiro. */}
        <p role="status" className="mt-3 font-bold text-energia-forte empty:hidden">
          {salvou && situacao && (
            <>
              {META_SALVA}
              <span className="sr-only"> {tituloDaMeta(situacao)}</span>
            </>
          )}
        </p>
        <p className="mt-3 text-[0.95rem] text-tinta-suave">{SO_NESTE_APARELHO}</p>
      </div>

      {situacao && metaReais !== undefined && (
        <div className={naFolha ? "mt-6" : "mt-6 lg:mt-0"}>
          <ResultadoDaMeta situacao={situacao} metaReais={metaReais} dados={dados} aoUsar={editarCom} />
        </div>
      )}
    </section>
  );
}

function ResultadoDaMeta({ situacao: s, metaReais, dados, aoUsar }: { situacao: SituacaoDaMeta; metaReais: number; dados: Dados; aoUsar: (centavos: number) => void }) {
  const titulo = <h3 className="text-xl leading-snug font-extrabold">{tituloDaMeta(s)}</h3>;
  const cip = dados.residencia?.contaReferencia?.iluminacaoPublica;
  const metaCentavos = Math.round(metaReais * 100);

  if (s.tipo === "sem-dados") return <Aviso tom="faisca" anunciar={false}>{titulo}</Aviso>;

  if (s.tipo === "abaixo-do-piso") {
    return (
      <Aviso tom="faisca" anunciar={false}>
        {titulo}
        {linhasDoPiso(s.pisoCentavos, dados.residencia?.ligacao, dados.residencia?.beneficio, cip).map((linha) => (
          <p key={linha} className="mt-2">
            {linha}
          </p>
        ))}
        <p className="mt-2 font-bold">Tente uma meta a partir de {reais(s.pisoCentavos)}.</p>
        <Botao type="button" variante="secundario" className="mt-4" onClick={() => aoUsar(s.pisoCentavos)}>
          Usar {reais(s.pisoCentavos)}
        </Botao>
      </Aviso>
    );
  }

  const confianca = linhaDaConfianca(s.confianca, s.contaCentavos);
  const acoes = s.confianca.tipo === "parcial" && (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
      <BotaoLink href="/casa/ajustes#conta" variante="secundario">
        Colocar minha conta de luz
      </BotaoLink>
      {s.confianca.motivo === "divergencia" && (
        <BotaoLink href="/casa/comodos" variante="fantasma">
          Ver meus aparelhos
        </BotaoLink>
      )}
    </div>
  );

  if (s.tipo === "dentro") {
    return (
      <div className="rounded-[var(--radius-controle)] bg-fundo px-4 py-4 text-tinta">
        {titulo}
        <p className="mt-2">{linhaDoDentro(s.contaCentavos, s.folgaCentavos, metaCentavos, s.confianca)}</p>
        {confianca && s.confianca.tipo === "parcial" && s.confianca.motivo === "divergencia" && <p className="mt-2">{confianca}</p>}
        {acoes}
        <p className="mt-4 text-[0.95rem] text-tinta-suave">{E_ESTIMATIVA}</p>
      </div>
    );
  }

  const completa = s.confianca.tipo === "completa";
  const naoChega = completa && !s.chegaLa && s.passos.length > 0;
  const titulos = new Map(dados.dicas.map((d) => [d.id, d]));
  const temTroca = s.passos.some((p) => titulos.get(p.dicaId)?.tipo === "troca");
  const parte = Math.min(1, metaCentavos / s.contaCentavos);
  return (
    <div>
      {titulo}
      <p className="mt-2 numeros">
        Sua conta estimada é {reais(s.contaCentavos)}. A meta é {reais(metaCentavos)}.
      </p>
      {/* A seta da etiqueta mostra a meta dentro da conta; o número está no texto e no rótulo (nunca só a cor). */}
      <div role="img" aria-label={`Conta de ${reais(s.contaCentavos)}, meta de ${reais(metaCentavos)}`} className="mt-3 h-4 overflow-hidden rounded-full bg-faixa-e/25">
        <div className="cresce-x seta-etiqueta h-full bg-energia" style={{ width: `${parte * 100}%` }} />
      </div>
      {confianca && <p className="mt-3">{confianca}</p>}

      {s.passos.length > 0 ? (
        <>
          <h4 className="mt-5 font-extrabold">{cabecalhoDasDicas(s.passos.length, s.chegaLa)}</h4>
          <ul className="mt-2 divide-y divide-separador rounded-[var(--radius-controle)] bg-fundo">
            {s.passos.map((p, i) => (
              <li key={p.dicaId} className="numeros px-4 py-3">
                <strong>{titulos.get(p.dicaId)?.titulo ?? "Dica"}</strong>: {i === 0 ? "economiza" : "economiza mais"} <strong className="text-energia-forte">{reais(p.ganhoCentavos)}</strong>
              </li>
            ))}
          </ul>
          {naoChega ? (
            <>
              <p className="mt-3 numeros">
                Elas economizam {reais(s.totalCentavos)}. Ainda faltam {reais(s.contaDepoisCentavos - metaCentavos)}. Com elas, sua conta pode ficar em {reais(s.contaDepoisCentavos)}.
              </p>
              <p className="mt-2 font-bold">Quer tentar uma meta de {reais(s.contaDepoisCentavos)}?</p>
              <Botao type="button" variante="secundario" className="mt-3" onClick={() => aoUsar(s.contaDepoisCentavos)}>
                Usar {reais(s.contaDepoisCentavos)}
              </Botao>
            </>
          ) : (
            <p className="mt-3 numeros">
              {s.passos.length > 1 ? "Juntas, economizam" : "Ela economiza"} {completa ? "" : "cerca de "}
              {reais(s.totalCentavos)}.{completa && ` A sua conta fica em ${reais(s.contaDepoisCentavos)}.`}
              {s.passos.length > 1 && " Cada valor é o que a dica economiza depois das de cima, por isso pode ser menor que na aba Dicas."}
            </p>
          )}
          <p className="mt-2">{temTroca ? "A troca pede comprar algo." : s.passos.length > 1 ? "Todas são sem gastar nada." : "É sem gastar nada."}</p>
          <Link href="/casa/dicas" transitionTypes={["nav-forward"]} className="mt-3 inline-flex min-h-11 items-center font-bold text-energia underline underline-offset-2">
            Ver as dicas
          </Link>
        </>
      ) : (
        <p className="mt-3">Ainda não achamos dicas que baixem a sua conta. Veja se dá para usar menos algum aparelho.</p>
      )}
      {acoes}
      <div className="mt-4 space-y-1 text-[0.95rem] text-tinta-suave">
        <p>{E_ESTIMATIVA}</p>
        {!cip && s.passos.length > 0 && <p>{SEM_CIP_NA_ECONOMIA}</p>}
      </div>
    </div>
  );
}
