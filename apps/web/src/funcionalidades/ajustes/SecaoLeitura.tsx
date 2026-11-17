"use client";

import { useSyncExternalStore } from "react";
import { assinarPreferenciaDeLeitura, gravarPreferenciaDeLeitura, LEITURA_PADRAO, lerPreferenciaDeLeitura } from "@/aplicacao/leitura";
import { Interruptor } from "@/ui/Interruptor";

/** "Leitura" em Minha casa (HIS-102): letra maior e mais contraste, guardados neste aparelho. */
export function SecaoLeitura() {
  const leitura = useSyncExternalStore(assinarPreferenciaDeLeitura, lerPreferenciaDeLeitura, () => LEITURA_PADRAO);
  return (
    <section aria-labelledby="leitura-titulo" className="scroll-mt-24">
      <h2 id="leitura-titulo" className="mb-4 text-2xl font-extrabold tracking-tight">
        Leitura
      </h2>
      <div className="space-y-2">
        <Interruptor
          rotulo="Letra maior"
          descricao="Deixa todo o texto do site maior."
          ligado={leitura.letraMaior}
          aoMudar={(letraMaior) => gravarPreferenciaDeLeitura({ ...leitura, letraMaior })}
        />
        <Interruptor
          rotulo="Mais contraste"
          descricao="Deixa as cores mais fortes, para ler no sol."
          ligado={leitura.maisContraste}
          aoMudar={(maisContraste) => gravarPreferenciaDeLeitura({ ...leitura, maisContraste })}
        />
      </div>
      <p className="mt-3 max-w-[56ch] text-[0.95rem] text-tinta-suave">A escolha fica guardada só neste aparelho.</p>
    </section>
  );
}
