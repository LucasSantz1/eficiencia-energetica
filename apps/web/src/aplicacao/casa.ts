"use client";

// Porta das telas para a casa guardada no aparelho (ADR-001: aplicacao é a única porta para infraestrutura).
// Hoje é só reexportação; é aqui que a sincronização com o servidor vai entrar (E4) sem mudar as telas.
// Só reexportação nomeada: o Next não aceita `export *` em módulo "use client". O store tem um só `create`,
// em infraestrutura/armazenamento/casa.ts — nunca criar outro aqui.
export { useCasa, useCasaCarregada, type DadosCasa } from "@/infraestrutura/armazenamento/casa";
export { novoId } from "@/infraestrutura/identificador";
