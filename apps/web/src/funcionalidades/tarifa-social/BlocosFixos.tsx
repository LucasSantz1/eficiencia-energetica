"use client";

import { ChevronDown } from "lucide-react";
import { useSyncExternalStore, type ReactNode } from "react";
import { useTelaLarga } from "@/ui/telaLarga";

/*
 * Os 3 blocos fixos do guia (HIS-103, "Fluxo e textos" 4; regras R8, R9 e R10 do dominio-energia). Links oficiais:
 * F6 (documentos do CadÚnico, gov.br, 15/12/2025) e F9 (reclamação na ANEEL, gov.br, 15/12/2025).
 */
const LINK_DOCUMENTOS = "https://www.gov.br/pt-br/servicos/inscrever-se-no-cadastro-unico-para-programas-sociais-do-governo-federal";
const LINK_ANEEL = "https://www.gov.br/pt-br/servicos/registrar-reclamacao-sobre-demanda-junto-a-distribuidora-de-energia-eletrica-ANEEL";

function assinarConexao(avisar: () => void): () => void {
  window.addEventListener("online", avisar);
  window.addEventListener("offline", avisar);
  return () => {
    window.removeEventListener("online", avisar);
    window.removeEventListener("offline", avisar);
  };
}

/** Sem internet só os links param: as perguntas e os blocos continuam (a regra vem junto da página). */
function useSemInternet(): boolean {
  return useSyncExternalStore(
    assinarConexao,
    () => !navigator.onLine,
    () => false,
  );
}

function LinkOficial({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-bold text-energia underline underline-offset-4">
      {children}
      <span className="sr-only"> (abre em outra página)</span>
    </a>
  );
}

function Telefone({ numero }: { numero: string }) {
  return (
    <a href={`tel:${numero}`} className="font-bold text-energia underline underline-offset-4">
      {numero}
    </a>
  );
}

/** Fechado no celular (a pessoa abre o que precisa) e aberto no computador, onde há espaço. */
function Bloco({ titulo, aberto, children }: { titulo: string; aberto: boolean; children: ReactNode }) {
  return (
    <details open={aberto} className="group rounded-[var(--radius-cartao)] bg-papel">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 text-lg font-extrabold [&::-webkit-details-marker]:hidden">
        <h2>{titulo}</h2>
        <ChevronDown className="size-6 shrink-0 text-tinta-suave transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="space-y-3 px-5 pb-5">{children}</div>
    </details>
  );
}

/** `emColunas`: no fim da página, no computador, os 3 blocos lado a lado (linhas de até 68 caracteres, HIS-112). */
export function BlocosFixos({ emColunas = false }: { emColunas?: boolean }) {
  const aberto = useTelaLarga();
  const semInternet = useSemInternet();
  return (
    <div className="space-y-3">
      <div role="status" className="empty:hidden">
        {semInternet && <p className="rounded-[var(--radius-controle)] bg-faisca-claro px-4 py-3">Sem internet agora. Os documentos continuam aqui; os links abrem quando voltar.</p>}
      </div>
      <div className={`space-y-3 ${emColunas ? "lg:grid lg:grid-cols-3 lg:items-start lg:gap-3 lg:space-y-0" : ""}`}>
      <Bloco titulo="Documentos para o CadÚnico" aberto={aberto}>
        <p className="text-tinta-suave">Gratuito, presencial.</p>
        <p>
          <strong>Quem responde pela família:</strong> CPF (de preferência) ou título de eleitor; documento com foto; comprovante de endereço ou declaração de residência assinada.
        </p>
        <p>
          <strong>Cada outra pessoa:</strong> um destes: CPF ou título de eleitor, certidão de nascimento ou casamento, RG ou carteira de trabalho.
        </p>
        <LinkOficial href={LINK_DOCUMENTOS}>Ver a lista no gov.br</LinkOficial>
      </Bloco>
      <Bloco titulo="Onde ir" aberto={aberto}>
        <p>
          <strong>CRAS ou posto do Cadastro Único da prefeitura:</strong> fazer ou atualizar o CadÚnico (renda, endereço, pessoas, ou mais de 2 anos).
        </p>
        <p>
          <strong>Distribuidora:</strong> conta em nome de outra pessoa, caso do aparelho de saúde, ou desconto que não aparece.
        </p>
        <p>
          Dúvida do CadÚnico: ligue <Telefone numero="121" /> (grátis).
        </p>
      </Bloco>
      <Bloco titulo="Não estou recebendo. O que fazer?" aberto={aberto}>
        <ol className="list-decimal space-y-2 pl-6">
          <li>Veja no CRAS se o CadÚnico está em dia e o endereço é o da conta.</li>
          <li>Veja se a conta está no nome de alguém da família.</li>
          <li>Ligue para a distribuidora e anote o número do protocolo.</li>
          <li>Sem solução: fale com a ouvidoria da distribuidora.</li>
          <li>
            Ainda sem solução: ANEEL, órgão do governo que cuida da luz, telefone <Telefone numero="167" /> (segunda a sábado, das 8h às 20h, grátis).
          </li>
        </ol>
        <LinkOficial href={LINK_ANEEL}>Falar com a ANEEL</LinkOficial>
      </Bloco>
      </div>
    </div>
  );
}
