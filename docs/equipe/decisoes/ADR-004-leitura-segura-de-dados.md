# ADR-004 · Leitura segura dos dados de fora, com leitores no `@ee/core`

- **Status:** aceito (2026-10-30, tech-lead). A `seguranca` confirmou a P-tl-1 da HIS-003 (nota de 2026-10-30) com
  duas condições, R4c e R4d, que estão nas consequências.
- **Data:** 2026-10-30
- **Responsável:** tech-lead, com seguranca

## Contexto

Hoje o site lê três coisas sem conferir: a casa salva no `localStorage`, os arquivos de `/dados` e o que a pessoa
digita. Uma casa corrompida trava o site para sempre: a falha P1 da HIS-003, em que o `JSON.parse` lança e a
hidratação nunca termina. E um número fora do formato entra direto na conta: a falha P2, em que, com a mesma versão,
o `migrate` não roda.

O mesmo formato é lido em três lugares:
- o site, no navegador e no servidor;
- a rotina de dados, que não pode importar de `apps/web`;
- o app Expo, no futuro.

O site é feito para celular simples e 3G.

## Decisão

1. **Os leitores ficam no `@ee/core`** e são funções puras com a forma `lerX(bruto: unknown): X | undefined`, ou
   `{ resultado, descartados }`:
   - os limites de cada campo ficam em `limites.ts`, com a fonte de cada número;
   - os leitores da casa salva, em `casa-salva.ts`;
   - os de `/dados`, em `arquivos-publicos.ts`;
   - o número digitado, em `entrada.ts`.

   O leitor monta um objeto novo, campo por campo, e nunca espalha o bruto.
2. **Sem biblioteca de esquema.** São leitores escritos à mão, sem dependência nova no domínio.
3. **Casa salva (zustand `persist`):**
   - um `storage` próprio que não lança;
   - um `merge` que sempre passa pelo `lerCasaSalva`;
   - um `migrate` que só repassa o que recebeu;
   - a versão limpa é regravada depois de um descarte.

   O formato salvo e a versão não mudam. As ações do store passam pelos mesmos leitores antes de gravar.
4. **O mesmo leitor serve aos três lugares**, cada um com a sua política:
   - **navegador:** a entrada inválida sai, e a estrutura errada mostra o aviso com "Tentar de novo";
   - **servidor:** lança, então o build falha ou a revalidação mantém a versão anterior;
   - **rotina:** qualquer descarte impede a gravação, mesmo com `--forcar`.
5. **Valor fora do limite rígido descarta o item, e nada é corrigido.** Só existem dois consertos, os do
   dominio-energia, que não inventam número. Um valor na faixa de alerta nunca é descartado.

## Alternativas consideradas

- **`zod` 4.6.7:**
  - pesa 93 098 B em gzip no conjunto de esquemas da casa;
  - testa `new Function`, que a CSP sem `unsafe-eval` bloqueia, o que gera erro no console;
  - não resolve a parte própria: descarte com contagem, ids repetidos, referência ao cômodo e consertos.
- **`zod/mini`:** pesa 8 173 B em gzip e não usa `eval`. Mesmo assim, põe cerca de 7 kB a mais em quase toda rota, para
  cobrir só a conferência de cada campo, e cria a primeira dependência do domínio.
- **Esquemas em `apps/web/infraestrutura/`:** a rotina e o app não conseguiriam importar.
- **Pacote novo `packages/contratos`:** mais um pacote para manter, e ele dependeria do `limites.ts` do core de
  qualquer jeito.
- **Validar só no `migrate`:** não pega a P2.
- **Validar dentro do `getItem`:** o resultado do descarte não chega ao estado sem uma variável solta.

## Consequências

- Os leitores escritos à mão pesam cerca de 1,3 kB em gzip.
- **Leitor completo (R4c, condição da seguranca):** o risco novo do leitor à mão é esquecer um campo opcional, o que
  apagaria em silêncio, na primeira ação salva, a conta ou a etiqueta de todas as famílias. Por isso:
  - cada leitor tem a lista dos seus campos, conferida pelo `typecheck` (`Exclude<keyof T, (typeof CAMPOS)[number]>`
    tem que ser `never`): campo novo no tipo sem leitor quebra o build;
  - a fixture `casa-completa`, com **todo** opcional preenchido, passa `toEqual` no `lerCasaSalva` e num ciclo
    hidratar → ação → salvar;
  - o texto devolvido é o original, **sem `trim`** (o leitor só confere `trim().length > 0`).
- **Leitor total (R4d, condição da seguranca):** o leitor nunca lança, porque um `merge` que lança faz o `persist` não
  marcar a hidratação (a falha P1 volta). Teste com os casos do R4 e 1.000 valores JSON gerados com semente fixa, sem
  biblioteca. O `merge` tem `try/catch` que, se algo lançar, deixa a casa vazia em memória **sem regravar**. Data
  conferida por componentes UTC (`Date.UTC` e comparação de ano, mês e dia), nunca `Date.parse` nem `new Date(texto)`.
  Tamanho conferido antes de qualquer expressão regular. Só se lê propriedade própria (`Object.hasOwn`, A3).
- Todo campo novo salvo, ou de arquivo público, precisa de leitor e teste no core, com caso de borda e com chave extra.
- O peso de JS sobe de propósito na HIS-003 (referência `peso-js.json` atualizada no PR).
- Se um dia a quantidade de formatos crescer muito (API do Supabase no E4), reavaliar o `zod/mini`, com medição de
  peso e o teste da CSP.
- O app Expo reaproveita os leitores sem mudança.
- Um arquivo de dados com formato ruim agora reprova o build e a rotina, em vez de chegar à família.
