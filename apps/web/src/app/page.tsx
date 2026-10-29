import { carregarNumerosDoInicio } from "@/aplicacao/numeros-do-inicio.servidor";
import { PaginaInicial } from "@/funcionalidades/inicio/PaginaInicial";

// Os números da página vêm dos dados da ANEEL, que são atualizados todo dia.
// Fica exportado aqui: o Next só lê a configuração de cache direto do arquivo da rota.
export const revalidate = 86400;

export default async function Pagina() {
  return <PaginaInicial numeros={await carregarNumerosDoInicio()} />;
}
