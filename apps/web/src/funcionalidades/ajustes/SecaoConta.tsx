"use client";

import { Copy, Link2, Share2, Trash2, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { apagarConvite, criarConvite, listarConvites, sair, useConta, useSincroniaAtual, type Convite } from "@/aplicacao/conta";
import { Aviso } from "@/ui/Aviso";
import { Botao, BotaoLink } from "@/ui/Botao";
import { Campo } from "@/ui/Campo";
import { Entrada } from "@/ui/Entrada";

const DATA = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" });

const TEXTO_DA_SINCRONIA = {
  parada: "",
  sincronizando: "Guardando na conta…",
  "em-dia": "A sua casa está guardada na conta.",
  pendente: "Falta guardar na conta a última mudança. Vai sozinho quando a internet voltar.",
  escolher: "Escolha, no topo da tela, qual casa fica.",
  "atualizada-de-outro-aparelho": "Trouxemos a casa que foi salva em outro aparelho.",
} as const;

/**
 * "Sua conta" em Minha casa (E4): entrar/criar, quem está na conta, sair e os links de convidado (HIS-407). Sem as
 * variáveis da conta no servidor, a seção nem aparece: o site funciona como antes, só no aparelho.
 */
export function SecaoConta() {
  const conta = useConta();
  const sincronia = useSincroniaAtual();
  if (conta.tipo === "desligada" || conta.tipo === "carregando") return null;
  return (
    <section id="conta-online" aria-labelledby="conta-online-titulo" className="scroll-mt-24">
      <h2 id="conta-online-titulo" className="mb-3 text-[1.375rem] font-bold tracking-tight">
        Sua conta
      </h2>
      {conta.tipo === "sem-internet" && <p className="text-tinta-suave">Sem internet agora. A sua casa continua neste aparelho.</p>}
      {conta.tipo === "sem-conta" && (
        <>
          <p className="max-w-[56ch] text-tinta-suave">
            Opcional. Com conta, a sua casa abre em outro aparelho, e você pode mandar um link para a família acompanhar a conta de luz, só para ver.
          </p>
          <BotaoLink href="/entrar" className="mt-4">
            <UserRound className="size-5" aria-hidden /> Entrar ou criar conta
          </BotaoLink>
        </>
      )}
      {conta.tipo === "conectada" && (
        <>
          <p className="text-lg">
            Você está na conta <strong className="break-all">{conta.email}</strong>.
          </p>
          {TEXTO_DA_SINCRONIA[sincronia.tipo] && <p className="mt-1 text-tinta-suave">{TEXTO_DA_SINCRONIA[sincronia.tipo]}</p>}
          <LinksDeConvidado />
          <Botao variante="secundario" className="mt-6" onClick={() => void sair()}>
            Sair da conta
          </Botao>
          <p className="mt-2 max-w-[56ch] text-[0.95rem] text-tinta-suave">Saindo, a casa continua neste aparelho; só para de ir para a conta.</p>
        </>
      )}
    </section>
  );
}

/** Links "só para ver" (HIS-407). O link aparece uma vez, na hora de criar: o servidor guarda só um código embaralhado. */
function LinksDeConvidado() {
  const [convites, setConvites] = useState<Convite[]>();
  const [nome, setNome] = useState("");
  const [novo, setNovo] = useState<{ endereco: string; nome?: string }>();
  const [erro, setErro] = useState<string>();
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let valendo = true;
    void listarConvites().then((lista) => valendo && setConvites(lista ?? []));
    return () => {
      valendo = false;
    };
  }, []);

  const criar = async () => {
    setErro(undefined);
    setCopiado(false);
    const feito = await criarConvite(nome);
    if (!feito.ok) return setErro(feito.mensagem);
    setNovo({ endereco: feito.endereco, nome: feito.convite.nome });
    setNome("");
    setConvites((lista) => [...(lista ?? []), feito.convite]);
  };

  const apagar = async (id: string) => {
    const resposta = await apagarConvite(id);
    if (resposta.status === 200) setConvites((lista) => lista?.filter((c) => c.id !== id));
  };

  const copiar = async (endereco: string) => {
    try {
      await navigator.clipboard.writeText(endereco);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  };

  const compartilhar = (endereco: string) => {
    void navigator.share?.({ title: "Conta de luz da casa", text: "Acompanhe a conta de luz da nossa casa (só para ver):", url: endereco }).catch(() => undefined);
  };

  return (
    <div className="mt-6 rounded-[var(--radius-cartao)] bg-papel p-5">
      <h3 className="flex items-center gap-2 text-lg font-extrabold">
        <Link2 className="size-5 text-energia" aria-hidden /> Links para a família acompanhar
      </h3>
      <p className="mt-1 max-w-[56ch] text-tinta-suave">Quem abrir o link vê a conta e os aparelhos, mas não muda nada. Apague o link quando quiser e ele para de funcionar na hora.</p>

      {novo && (
        <div className="mt-4 space-y-3 rounded-[var(--radius-controle)] bg-energia-claro p-4">
          <p className="font-bold text-energia-forte">Link {novo.nome ? `para ${novo.nome} ` : ""}criado. Copie agora: ele só aparece esta vez.</p>
          <p className="rounded-[var(--radius-controle)] bg-papel p-3 font-mono text-[0.9rem] break-all">{novo.endereco}</p>
          <div className="flex flex-wrap gap-2">
            <Botao variante="secundario" onClick={() => void copiar(novo.endereco)}>
              <Copy className="size-5" aria-hidden /> {copiado ? "Copiado" : "Copiar link"}
            </Botao>
            {typeof navigator !== "undefined" && "share" in navigator && (
              <Botao variante="secundario" onClick={() => compartilhar(novo.endereco)}>
                <Share2 className="size-5" aria-hidden /> Compartilhar
              </Botao>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Campo id="convite-nome" rotulo="Para quem é? (opcional)" ajuda="Só para você reconhecer o link na lista.">
            <Entrada id="convite-nome" maxLength={40} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Mãe" />
          </Campo>
        </div>
        <Botao onClick={() => void criar()}>Criar link</Botao>
      </div>
      <div role="status" className="mt-3">
        {erro && (
          <Aviso tom="alerta" anunciar={false}>
            {erro}
          </Aviso>
        )}
      </div>

      {convites && convites.length > 0 && (
        <ul className="mt-4 divide-y divide-separador border-t border-separador">
          {convites.map((c) => (
            <li key={c.id} className="flex items-center gap-3 py-3">
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{c.nome ?? "Link sem nome"}</span>
                <span className="block text-[0.9rem] text-tinta-suave">Criado em {DATA.format(new Date(c.criadoEm))}</span>
              </span>
              <button
                type="button"
                onClick={() => void apagar(c.id)}
                aria-label={`Apagar o link ${c.nome ?? "sem nome"}`}
                className="grid size-11 shrink-0 place-items-center rounded-full text-alerta hover:bg-alerta-claro"
              >
                <Trash2 className="size-5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
