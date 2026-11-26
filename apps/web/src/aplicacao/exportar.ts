"use client";

import { VERSAO_DOS_TERMOS } from "@/config/termos";
import { useCasa } from "@/infraestrutura/armazenamento/casa";
import { dadosSalvaveis } from "@/infraestrutura/armazenamento/hidratacao";
import { lerPreferenciaDeLeitura } from "@/infraestrutura/armazenamento/leitura";

/**
 * "Baixar meus dados" (LGPD, art. 18, V: portabilidade; HIS-404). Um arquivo JSON com tudo o que o site guarda sobre a
 * casa neste aparelho, no mesmo formato da casa salva, mais as escolhas de leitura. Gerado no próprio navegador: nada
 * vai ao servidor para isso. Com conta, a casa da conta é a mesma deste aparelho (a sincronia mantém igual).
 */
export function baixarMeusDados(emailDaConta: string | undefined) {
  const arquivo = {
    site: "Eficiência Energética",
    geradoEm: new Date().toISOString(),
    versaoDosTermos: VERSAO_DOS_TERMOS,
    ...(emailDaConta ? { conta: { email: emailDaConta } } : {}),
    casa: dadosSalvaveis(useCasa.getState()),
    leitura: lerPreferenciaDeLeitura(),
  };
  const blob = new Blob([JSON.stringify(arquivo, null, 2)], { type: "application/json" });
  const endereco = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = endereco;
  link.download = `meus-dados-eficiencia-energetica-${arquivo.geradoEm.slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  // Dá tempo de o navegador começar o download antes de soltar o endereço.
  setTimeout(() => URL.revokeObjectURL(endereco), 1000);
}
