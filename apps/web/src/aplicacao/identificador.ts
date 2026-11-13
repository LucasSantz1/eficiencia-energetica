// Sem "use client" de propósito (HIS-002b, critério 8): rascunho.ts não tem diretiva e importava novoId de
// aplicacao/casa.ts, que é "use client". aplicacao/ continua a única porta para infraestrutura/.
export { novoId } from "@/infraestrutura/identificador";
