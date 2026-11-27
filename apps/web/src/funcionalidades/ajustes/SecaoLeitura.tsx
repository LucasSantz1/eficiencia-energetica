"use client";

import { useLeitura } from "@/aplicacao/useLeitura";
import { Interruptor } from "@/ui/Interruptor";
import { SecaoDeAjuste } from "./SecaoDeAjuste";

/** "Leitura" em Minha casa (HIS-102): letra maior e mais contraste, guardados neste aparelho. */
export function SecaoLeitura() {
  const [leitura, mudar] = useLeitura();
  return (
    <SecaoDeAjuste titulo="Leitura" id="leitura" icone="leitura" descricao="A escolha fica guardada só neste aparelho.">
      <div className="space-y-2">
        <Interruptor
          rotulo="Letra maior"
          descricao="Deixa todo o texto do site maior."
          ligado={leitura.letraMaior}
          aoMudar={(letraMaior) => mudar({ letraMaior })}
        />
        <Interruptor
          rotulo="Mais contraste"
          descricao="Deixa as cores mais fortes, para ler no sol."
          ligado={leitura.maisContraste}
          aoMudar={(maisContraste) => mudar({ maisContraste })}
        />
      </div>
    </SecaoDeAjuste>
  );
}
