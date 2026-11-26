import "server-only"; // primeiro import: lê variáveis do servidor

/**
 * Contato e responsável do site, para a Política de privacidade (LGPD, art. 9º e 41). Ficam em variáveis de ambiente
 * (CONTATO_EMAIL e RESPONSAVEL_PELO_SITE na Vercel) para trocar sem mexer no código quando o domínio próprio sair.
 * Sem elas, a página diz que o contato ainda vai ser publicado: nada de endereço inventado.
 */
export function contatoDoSite(): { email: string | undefined; responsavel: string | undefined } {
  const email = process.env.CONTATO_EMAIL?.trim();
  const responsavel = process.env.RESPONSAVEL_PELO_SITE?.trim();
  return {
    email: email && /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(email) && email.length <= 120 ? email : undefined,
    responsavel: responsavel && responsavel.length <= 120 ? responsavel : undefined,
  };
}
