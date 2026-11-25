"use client";

import { CircleHelp } from "lucide-react";
import { useEffect, useState } from "react";
import { consumoMensalKwh, formatarKwh, formatarReais, itemDoCatalogo, LIMITES, LIMITES_DE_TEXTO, type Aparelho, type Comodo, type PrecoKwh } from "@ee/core";
import { Botao } from "@/ui/Botao";
import { Campo } from "@/ui/Campo";
import { NOME_DO_APARELHO_VAZIO } from "@/ui/campos/mensagens";
import { indoParaUmBotao, useCampoNumerico } from "@/ui/campos/useCampoNumerico";
import { Contador } from "@/ui/Contador";
import { Entrada } from "@/ui/Entrada";
import { focarPrimeiroErro } from "@/ui/foco";
import { Folha } from "@/ui/Folha";
import { Pilulas } from "@/ui/Pilulas";
import { mensagensDaEtiqueta, mensagensDaPotencia } from "./mensagensDoAparelho";
import { SeletorFrequencia, SeletorTempo, SeletorVariantes } from "./TempoUso";


type Rascunho = Omit<Aparelho, "id"> & { id?: string };

/**
 * Formulário para criar ou ajustar um aparelho. Mostra na hora quanto ele custa por mês,
 * para a pessoa ver o efeito de cada mudança. Não lê a casa: os cômodos entram por props e
 * salvar/remover saem por callbacks (quem liga à casa é useEdicaoDeAparelho, em aplicacao/casa.ts).
 */
export function EditorAparelho({
  aparelho,
  aberto,
  aoFechar,
  preco,
  comodos,
  aoSalvar,
  aoRemover,
}: {
  aparelho: Rascunho | undefined;
  aberto: boolean;
  aoFechar: () => void;
  preco: PrecoKwh;
  comodos: Comodo[];
  /** Com id, atualiza o aparelho; sem id, cria um novo. */
  aoSalvar: (dados: Omit<Aparelho, "id">, id?: string) => void;
  aoRemover: (id: string) => void;
}) {
  const [r, setR] = useState<Rascunho | undefined>(aparelho);
  const [semEtiqueta, setSemEtiqueta] = useState(false);
  const [confirmarRemocao, setConfirmarRemocao] = useState(false);
  // T5 do nome vazio: aparece ao sair do campo ou ao salvar, e some na tecla que dá nome de novo.
  const [conferirNome, setConferirNome] = useState(false);
  // Os campos de número voltam ao valor salvo quando muda o aparelho em edição (a chave), sem efeito novo.
  const potencia = useCampoNumerico({ faixa: LIMITES.potenciaW, casas: 0, obrigatorio: true, mensagens: mensagensDaPotencia(), inicial: aparelho?.potenciaW || undefined, chave: aparelho });
  const etiqueta = useCampoNumerico({ faixa: LIMITES.kwhMesInformado, casas: 2, obrigatorio: true, mensagens: mensagensDaEtiqueta(), inicial: aparelho?.kwhMesInformado, chave: aparelho });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reinicia o rascunho quando muda o aparelho em edição (HIS-109)
    setR(aparelho);
    setSemEtiqueta(false);
    setConfirmarRemocao(false);
    setConferirNome(false);
  }, [aparelho]);

  if (!r) return <Folha aberta={false} aoFechar={aoFechar} titulo="">{null}</Folha>;

  const item = itemDoCatalogo(r.catalogoId);
  const modo = item?.modo ?? "tempo";
  const usaPotencia = modo !== "etiqueta";
  const usaEtiqueta = modo === "etiqueta" && !semEtiqueta;
  const mudar = (p: Partial<Rascunho>) => setR((atual) => (atual ? { ...atual, ...p } : atual));
  // A prévia usa o número que a tela entendeu (mesmo antes do "Sim"); enquanto o campo está errado, o último que valia.
  const comNumeros = {
    ...r,
    potenciaW: usaPotencia ? (potencia.valorLido ?? r.potenciaW) : r.potenciaW,
    kwhMesInformado: usaEtiqueta ? (etiqueta.valorLido ?? r.kwhMesInformado) : r.kwhMesInformado,
  };
  const kwh = consumoMensalKwh(comNumeros);
  const valor = kwh * preco.valor;
  const erroDoNome = conferirNome && !r.nome.trim() ? NOME_DO_APARELHO_VAZIO : undefined;

  // Confere todos os campos (na ordem da tela) antes de chamar a ação: desde a 003a o store recusa em silêncio.
  const salvar = () => {
    setConferirNome(true);
    const naoPassou = focarPrimeiroErro([
      { id: "ap-nome", resultado: r.nome.trim() ? "ok" : "erro" },
      ...(usaEtiqueta ? [{ id: "ap-etiqueta", resultado: etiqueta.conferir() }] : []),
      ...(usaPotencia ? [{ id: "ap-potencia", resultado: potencia.conferir() }] : []),
    ]);
    if (naoPassou) return;
    const { id, ...dados } = comNumeros;
    aoSalvar({ ...dados, nome: dados.nome.trim() }, id);
    aoFechar();
  };


  return (
    <Folha
      aberta={aberto}
      aoFechar={aoFechar}
      titulo={r.id ? "Ajustar aparelho" : "Novo aparelho"}
      rodape={
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3" aria-live="polite">
            <span className="text-tinta-suave">Custa por mês</span>
            <span className="text-right">
              <span className="numeros text-2xl font-extrabold">{formatarReais(valor)}</span>
              <span className="numeros ml-2 text-tinta-suave">{formatarKwh(kwh)}</span>
            </span>
          </div>
          <Botao largo onClick={salvar}>
            {r.id ? "Salvar mudanças" : "Adicionar aparelho"}
          </Botao>
        </div>
      }
    >
      <div className="space-y-7">
        <Campo rotulo="Nome" id="ap-nome" erro={erroDoNome}>
          <Entrada id="ap-nome" className="font-bold" value={r.nome} onChange={(e) => mudar({ nome: e.target.value })} onBlur={(evento) => indoParaUmBotao(evento) || setConferirNome(true)} maxLength={LIMITES_DE_TEXTO.nomeAparelho} />
        </Campo>

        {comodos.length > 1 && (
          <div className="space-y-2">
            <span className="block font-bold">Em qual cômodo?</span>
            <Pilulas rotulo="Cômodo" opcoes={comodos.map((c) => ({ valor: c.id, rotulo: c.nome }))} valor={r.comodoId} aoMudar={(comodoId) => mudar({ comodoId })} />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-bold">Quantidade</span>
          <Contador valor={r.quantidade} aoMudar={(quantidade) => mudar({ quantidade })} min={LIMITES.quantidade.min} max={LIMITES.quantidade.max} rotulo="quantidade" />
        </div>

        {item && (
          <SeletorVariantes
            catalogo={item}
            escolhas={r.variantes}
            base={r}
            preco={preco}
            aoMudar={(mudancas) => {
              mudar(mudancas);
              // A resposta do catálogo troca o número do campo, como antes (o texto do campo mora no useCampoNumerico).
              if (mudancas.potenciaW !== undefined) potencia.definir(mudancas.potenciaW);
              if (mudancas.kwhMesInformado !== undefined) etiqueta.definir(mudancas.kwhMesInformado);
            }}
          />
        )}

        {usaEtiqueta && (
          <Campo
            rotulo="Consumo na etiqueta"
            id="ap-etiqueta"
            erro={etiqueta.erro}
            alerta={etiqueta.alerta}
            ajuda={
              <>
                {item?.ondeEncontrar}{" "}
                <button type="button" className="font-bold text-energia underline" onClick={() => (setSemEtiqueta(true), mudar({ kwhMesInformado: item?.kwhMes }))}>
                  Não tenho a etiqueta
                </button>
              </>
            }
          >
            <Entrada id="ap-etiqueta" inputMode="decimal" sufixo="kWh/mês" value={etiqueta.texto} onChange={(e) => etiqueta.aoMudar(e.target.value)} onBlur={etiqueta.aoSair} />
          </Campo>
        )}
        {modo === "etiqueta" && semEtiqueta && <p className="text-tinta-suave">Usando o consumo comum para esse tipo de aparelho: {formatarKwh(item?.kwhMes ?? 0)} por mês.</p>}

        {modo === "banho" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-bold">Banhos por dia</span>
              <Contador
                valor={r.banho?.banhosPorDia ?? 1}
                min={LIMITES.banhosPorDia.min}
                max={LIMITES.banhosPorDia.max}
                rotulo="banhos por dia"
                aoMudar={(banhosPorDia) => {
                  const banho = { banhosPorDia, minutosPorBanho: r.banho?.minutosPorBanho ?? 8 };
                  mudar({ banho, minutosPorDia: banho.banhosPorDia * banho.minutosPorBanho });
                }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-bold">Minutos por banho</span>
              <Contador
                valor={r.banho?.minutosPorBanho ?? 8}
                min={LIMITES.minutosPorBanho.min}
                max={LIMITES.minutosPorBanho.max}
                unidade="min"
                rotulo="minutos por banho"
                aoMudar={(minutosPorBanho) => {
                  const banho = { banhosPorDia: r.banho?.banhosPorDia ?? 1, minutosPorBanho };
                  mudar({ banho, minutosPorDia: banho.banhosPorDia * banho.minutosPorBanho });
                }}
              />
            </div>
          </>
        )}

        {modo === "tempo" && (
          <>
            <SeletorFrequencia diasPorSemana={r.diasPorSemana} aoMudar={(diasPorSemana) => mudar({ diasPorSemana })} />
            <SeletorTempo key={r.id ?? "novo"} minutosPorDia={r.minutosPorDia} diario={r.diasPorSemana >= 1} aoMudar={(minutosPorDia) => mudar({ minutosPorDia })} />
          </>
        )}

        {usaPotencia && (
          <Campo
            rotulo="Potência"
            id="ap-potencia"
            erro={potencia.erro}
            alerta={potencia.alerta}
            ajuda={
              <span className="flex gap-2">
                <CircleHelp className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  {item?.ondeEncontrar ?? "Procure o número seguido de W (watts) na etiqueta do aparelho."}
                  {item && item.id !== "outro" && ` O comum é entre ${item.faixaW[0].toLocaleString("pt-BR")} e ${item.faixaW[1].toLocaleString("pt-BR")} W.`}
                </span>
              </span>
            }
          >
            {/* Sem Math.min: o número digitado fica no campo e o T5 diz o que está errado. */}
            <Entrada id="ap-potencia" inputMode="numeric" sufixo="W" value={potencia.texto} onChange={(e) => potencia.aoMudar(e.target.value)} onBlur={potencia.aoSair} />
          </Campo>
        )}

        {r.id && (
          <div className="border-t border-linha pt-5">
            {!confirmarRemocao ? (
              <Botao variante="perigo" onClick={() => setConfirmarRemocao(true)}>
                Remover este aparelho
              </Botao>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-bold">Remover {r.nome}?</span>
                <Botao
                  variante="perigo"
                  onClick={() => {
                    aoRemover(r.id!);
                    aoFechar();
                  }}
                >
                  Sim, remover
                </Botao>
                <Botao variante="fantasma" onClick={() => setConfirmarRemocao(false)}>
                  Cancelar
                </Botao>
              </div>
            )}
          </div>
        )}
      </div>
    </Folha>
  );
}
