// Sem "use client" de propósito: o layout raiz (servidor) importa o script da primeira pintura por aqui.
// Porta das telas para a preferência de leitura (HIS-102; ADR-001: aplicacao é a única porta para infraestrutura).
export {
  apagarPreferenciaDeLeitura,
  assinarPreferenciaDeLeitura,
  gravarPreferenciaDeLeitura,
  LEITURA_PADRAO,
  lerPreferenciaDeLeitura,
  SCRIPT_DA_PRIMEIRA_PINTURA,
  type PreferenciaDeLeitura,
} from "@/infraestrutura/armazenamento/leitura";
