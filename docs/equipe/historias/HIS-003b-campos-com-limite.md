# HIS-003b · Campos com limite e "Confere?"

| Campo | Valor |
| --- | --- |
| Épico | E0 · Fundação |
| Sprint | 0 |
| Tamanho | M (≈ 1,5 dia com o qa: passos b1–b3) |
| Papéis principais | frontend, ux-acessibilidade, qa |
| Status | Preparada; desenho revisto em 2026-11-15 (a 003a já está no `main`) |
| Branch | `his-003b-campos` (saiu do `main` em `e24561a`) |

> **Origem:** dividida da HIS-003 pelo scrum-master em 2026-10-30, a partir da proposta D9 do tech-lead (P-tl-3). A
> outra parte é a [HIS-003a · Dados quebrados não travam o site](HIS-003-base-de-seguranca.md) (o arquivo manteve o
> nome antigo para não quebrar links). A numeração dos critérios continua a da HIS-003: aqui fica o critério 5 nas
> telas, e o critério 8 é novo (o T6 foi escrito depois dos critérios). T5, T6, o bloco "T5 e T6" do D5, o
> `campos.spec.ts` e os passos b1–b3 foram **movidos** para cá sem mudança. Valem para as duas e ficam na 003a: as
> "Regras de negócio e fontes" (faixas, "Limites prontos para as mensagens do T5" e casos 1–23), as "Ameaças" (A4, A9,
> R9) e o desenho D1–D4 (o `limites.ts`, o `entrada.ts` e o `CampoContexto` do D1.3 estão lá).

## Problema e valor

Como **família que cadastra os aparelhos e a conta**, eu quero **que o site me diga na hora, em palavras simples, quando
um número não pode estar certo ou parece estranho** para **não ver uma conta errada sem saber por quê**.

Hoje a potência é cortada em 30.000 W sem aviso (`Math.min`), "135.90" no valor da conta vira R$ 13.590 e nenhum campo
diz o que está errado. Um zero a mais na potência do chuveiro faz a conta estimada parecer real.

## Critérios de aceite

_(numeração da HIS-003 mantida)_

5. **Dado** os campos de potência, consumo da etiqueta, consumo e valor da conta (cadastro, ajustes e acompanhamento),
   nome do cômodo, nome do aparelho e leitura do relógio, **quando** a pessoa sai do campo ou toca no botão de continuar
   com um valor vazio, mal escrito ou fora do **rígido** do `limites.ts`, **então** aparece a mensagem do T5 com
   `{min}`/`{max}` formatados, a `Entrada` recebe `aria-invalid="true"` e `aria-describedby` com o id do erro, o valor
   não é salvo, o número digitado continua no campo (sem `Math.min`) e o foco vai para o primeiro campo errado. Os
   limites vêm só do `limites.ts` (nenhum número de faixa escrito na tela).
8. **Dado** um valor dentro do rígido, mas na faixa de **alerta** (potência > 10.000 W, etiqueta > 150 kWh, conta
   > 2.000 kWh ou > R$ 3.000,00, preço da conta fora de R$ 0,30 a R$ 3,00 por kWh com kWh ≥ 30 e sem Tarifa Social,
   leitura > 100 kWh por dia), **quando** a pessoa sai do campo, toca em continuar ou salva a leitura, **então** aparece
   o "Confere?" do T6 com "Sim, está certo" e "Corrigir", sem `aria-invalid`; o valor só é salvo depois de "Sim, está
   certo"; nenhum dos dois botões recebe o foco sozinho; e, com o consumo estimado da casa acima de 2.000 kWh/mês, o
   aviso "Confere seus aparelhos?" aparece no resumo do cadastro e no painel.

## Fora do escopo

- Leitura da casa salva, dados públicos, telas de erro, cabeçalhos e CI: [HIS-003a](HIS-003-base-de-seguranca.md).
- Deixar os minutos digitáveis: continuam no `Contador` (o texto para o caso de virarem digitáveis já está no T5).
- Explicar na tela o relógio que "dá a volta" e a casa decimal do relógio digital (riscos 1 e 2 do dominio-energia):
  backlog, com a ux.

## Dependências

- **HIS-003a no `main`:** `limites.ts`, `entrada.ts` (`lerNumeroDigitado`), `estados.ts` (passo a1), os leitores das
  ações do store (a4) e a fixture `errosEsperados` (a7).
- **HIS-002a no `main`:** fixture do e2e, axe e `peso-js.json`.
- Mexe nas mesmas telas que o T2 da 003a (`Cadastro`, `PainelAcompanhamento`) e no `Campo`/`Entrada`: por isso vem
  depois da 003a, não em paralelo.

## Regras de negócio e fontes

Ver a HIS-003a: "Regras de negócio e fontes", "Limites prontos para as mensagens do T5" e casos 1–23.

## Fluxo e textos

_(ux-acessibilidade, 2026-10-30; movido da HIS-003 sem mudança. As "Regras para todos os textos" do topo de "Fluxo e
textos" da HIS-003a valem aqui.)_

### T5. Campos fora do limite (critério 5)

| Campo (id) | Quando | Mensagem |
| --- | --- | --- |
| Potência (`ap-potencia`, `EditorAparelho`) | vazio ou zero | Digite a potência do aparelho, em watts (W). |
| Potência | fora da faixa | A potência vai de {min} a {max}. Confira a etiqueta ou a plaquinha atrás do aparelho. |
| Consumo na etiqueta (`ap-etiqueta`) | fora da faixa | Digite um consumo entre {min} e {max} por mês, como está na etiqueta. |
| Consumo da conta (`conta-kwh`, cadastro e acompanhamento) | fora da faixa | Digite um consumo entre {min} e {max}. Na conta, ele aparece como "Consumo (kWh)". |
| Valor da conta (`conta-valor`, cadastro e acompanhamento) | fora da faixa | Digite um valor entre {min} e {max}. É o valor total a pagar, com impostos. |
| Conta no cadastro ou nos ajustes (calibração) | consumo 0 ou valor R$ 0,00 | Com a conta zerada não dá para ajustar o cálculo. Se ela veio zerada, toque em "Pular, não tenho a conta agora". |

`{min}` da conta muda conforme a tela (dominio-energia): no cadastro e nos ajustes é 1 kWh e R$ 0,01; no
acompanhamento é 0 kWh e R$ 0,00. A mensagem é a mesma; muda só o número, que vem do uso certo no `limites.ts`.
| Campos com vírgula (kWh, valor) | número mal escrito (ex.: "1,2,5") | Escreva só o número. Para centavos, use vírgula: 135,90. |
| Nome do cômodo (`nome-comodo`) | vazio | Dê um nome ao cômodo, por exemplo: Quarto do casal. |
| Nome do aparelho (`ap-nome`) | vazio | Dê um nome ao aparelho, por exemplo: Geladeira. |

**Minutos (por dia e por banho)**
- Hoje usam `Contador` (+ e −) com `min` e `max`, e não dá para digitar. Por isso não precisam de mensagem: o botão para
  no limite.
- Conferir: o `+` e o `−` ficam `disabled` no limite, e o leitor ouve o valor novo.
- Se algum campo de minutos virar digitável:
  - por dia, texto fixo (sem `formatarTempo`, que escreve "1 min" e "o dia todo"): "O tempo de uso vai de 1 minuto a
    24 horas por dia.";
  - por banho: "Cada banho vai de {min} a {max} minutos."

**Nome com tamanho máximo:** o `maxLength` (40 e 60) já impede passar do limite. Mensagem não precisa.

**Comportamento**
- **Quando mostrar:** ao sair do campo ou ao tocar no botão de continuar, nunca a cada tecla. Quem digita "1" a caminho
  de "1500" não pode ver erro. Depois que a mensagem aparece, ela some assim que o valor fica certo (aí sim, conferindo
  a cada tecla).
- **Não corrigir o número escondido:** hoje a potência corta em 30.000 com `Math.min`. Isso sai e entra a mensagem. O
  campo mantém o que a pessoa digitou. O salvar automático guarda só valor válido, e a conta continua com o último
  valor válido.
- **Botão de continuar:** "Ver o resultado" fica habilitado, sem `disabled` (botão desabilitado não diz o que falta).
  Ao tocar com campo errado, aparecem as mensagens e o foco vai para o primeiro campo errado.

**Componentes e acessibilidade do T5**
- `Campo` ganha a prop `erro?: string`. A mensagem fica num `<p id="{id}-erro">`, com ícone `CircleAlert`
  (`aria-hidden`) e texto `text-alerta font-bold`. Fica abaixo da entrada e acima da ajuda.
- A ajuda também ganha id (`{id}-ajuda`); hoje não tem.
- `Entrada` recebe `aria-invalid="true"` e `aria-describedby="{id}-erro {id}-ajuda"`.
- A borda da `Entrada` vira `border-alerta`. O erro não depende só da cor: tem ícone, texto e borda.
- O `<p>` do erro fica dentro de um recipiente com `aria-live="polite"`, sempre na página (vazio quando está tudo
  certo). Assim a mensagem é lida quando aparece ao sair do campo.
- Contraste do `alerta` (#b42318): 6,6:1 sobre `papel`, 5,8:1 sobre `fundo` e 5,6:1 sobre `alerta-claro`. Passa AA nos três.

### T6. Valor possível, mas raro: "Confere?" (alerta do dominio-energia)

O T5 é para valor **impossível**: a tela não salva. O T6 é para valor **raro**: a tela pergunta e salva se a pessoa
confirmar. O texto nunca diz que o número está errado. Ele pergunta, mostra o valor que foi entendido e dá uma pista
do erro mais comum.

| Campo | Quando (dominio-energia) | Texto |
| --- | --- | --- |
| Potência (`ap-potencia`) | > 10.000 W | **Confere?** {valor} é muito para um aparelho de casa. Um chuveiro forte tem até 7.800 W. Veja se não sobrou um zero. |
| Consumo na etiqueta (`ap-etiqueta`) | > 150 kWh/mês | **Confere?** {valor} por mês é muito para um aparelho. As geladeiras que mais gastam ficam perto de 115 kWh por mês. Veja se você copiou o número que vem com "kWh/mês". |
| Consumo da conta (`conta-kwh`) | > 2.000 kWh | **Confere?** {valor} é muito mais do que uma casa costuma gastar: a média no Brasil é perto de 180 kWh por mês. Veja se você copiou o consumo do mês, e não o número do relógio de luz. |
| Valor da conta (`conta-valor`) | > R$ 3.000,00 | **Confere?** {valor} é uma conta muito alta para uma casa. Veja se a vírgula dos centavos está no lugar certo. |
| Consumo e valor juntos (preço por kWh, **estimativa**) | fora de R$ 0,30 a R$ 3,00 por kWh, com kWh ≥ 30 e sem Tarifa Social | **Confere os dois números?** Com {kwh} e {valor}, cada kWh sairia por {preco}. Costuma ficar entre R$ 0,30 e R$ 3,00. Veja se a vírgula está no lugar certo. |
| Leitura do relógio (acompanhamento) | > 100 kWh por dia entre duas leituras | **Confere?** Entre {data anterior} e {data nova}, isso dá {n} kWh por dia. Uma casa costuma gastar perto de 6 kWh por dia. Veja se você não pulou ou trocou um número do relógio. |

Botões, em todos: **[Sim, está certo]** e **[Corrigir]**.
- `{valor}`, `{kwh}` e `{preco}`: o número que a tela entendeu, formatado com `formatarWatts` / `formatarKwh` /
  `formatarReais`.
- Datas como "3 de outubro".
- Os números de referência saem do `limites.ts` e do catálogo, com a fonte que o dominio-energia já citou: 7.800 W do
  chuveiro no catálogo, 115 kWh da geladeira no catálogo, 178,2 kWh da EPE arredondado para "perto de 180", e
  5,9 kWh/dia para "perto de 6".

**Consumo estimado da casa > 2.000 kWh/mês** não é um campo, então não tem "Sim/Corrigir". Aparece como
`Aviso tom="faisca"` (`role="status"`) no resumo do cadastro e no painel:

> **Confere seus aparelhos?** A conta estimada da sua casa deu {kwh} por mês, muito acima do comum. Veja se algum
> aparelho ficou com potência ou tempo a mais.
> [Ver meus aparelhos]

Se o T6 da potência já apareceu e a pessoa confirmou, esse aviso da casa também aparece. Não precisa esconder.

**Comportamento**
- **Quando:** igual ao T5. Aparece ao sair do campo ou ao tocar em continuar, nunca a cada tecla.
  - O do preço aparece só quando os dois campos estão preenchidos, embaixo do campo "Valor total da conta".
  - O da leitura aparece ao tocar em salvar a leitura.
- **Salvar:** o valor em alerta só é salvo depois de "Sim, está certo". Até lá, a conta usa o último valor salvo.
- **"Sim, está certo":** o alerta some, o valor é salvo e o foco volta para o campo. O alerta não volta para o mesmo
  valor. Só volta se a pessoa mudar o número.
- **"Corrigir":** o alerta some e o foco vai para o campo, com o texto todo selecionado, pronto para digitar por cima.
  No alerta do preço, o foco vai para "Valor total da conta".
- **Tocar em continuar, ou fechar a `Folha`, sem responder:** não segue. O foco vai para o campo com o alerta (o leitor
  ouve o rótulo e a pergunta pelo `aria-describedby`). Nada se perde: o número digitado continua no campo.
- Nunca usar janela (`dialog`) para o "Confere?": a pergunta fica junto do campo, na mesma tela.

**Componentes e acessibilidade do T6**
- Mesmo lugar do erro do T5, dentro do `Campo`, abaixo da entrada.
  - A pergunta fica num `<p id="{id}-alerta">` dentro do recipiente `aria-live="polite"` que o T5 já criou.
  - Os dois botões ficam **fora** desse recipiente, logo abaixo. Assim o leitor anuncia a pergunta, e não
    "Sim, está certo, Corrigir".
- Visual: caixa `bg-faisca-claro text-tinta` (como o `Aviso tom="faisca"`) com ícone `CircleHelp` (`aria-hidden`).
  - Amarelo, não vermelho: o valor pode estar certo.
  - Contraste passa de 14:1.
- `Campo` ganha a prop `alerta?: { texto: string; aoConfirmar: () => void; aoCorrigir: () => void }`.
  - `erro` e `alerta` nunca aparecem juntos: o erro ganha.
- A `Entrada` em alerta **não** recebe `aria-invalid`, porque o valor é válido. Ela recebe
  `aria-describedby="{id}-alerta {id}-ajuda"`.
- O alerta do preço: as duas entradas apontam para o mesmo `id`.
- Botões:
  - "Sim, está certo": `Botao variante="secundario"`.
  - "Corrigir": `Botao variante="fantasma"`.
  - Os dois com `min-h-12`; em 360 px, um embaixo do outro.
  - O nome acessível é o próprio texto do botão. A pergunta acima já dá o contexto.
- Nenhum dos dois botões recebe o foco sozinho. Um Enter sem querer não pode confirmar um valor errado.
- Sem animação além do `surgir`. Com movimento reduzido, aparece pronto.

## Desenho técnico

_(tech-lead, 2026-10-30; **revisto em 2026-11-15** sobre o `main` em `e24561a`, com a 003a, a 110, a 112 e a 103. Os
contratos de domínio vêm da 003a e já estão no `main`: `LIMITES`, `LIMITES_DE_TEXTO`, `validarFaixa`,
`precoDaContaForaDoComum`, `alertaDaLeitura`, `consumoDaCasaForaDoComum`, `potenciaDoChuveiroMaisForteW`,
`maiorConsumoDeEtiquetaDoCatalogoKwh` (`packages/core/src/limites.ts`) e `lerNumeroDigitado`
(`packages/core/src/entrada.ts`). Nenhuma regra nova vai para o core.)_

### O que mudou desde o desenho de outubro (e por que ele foi revisto)

- **Os campos ainda leem número do jeito antigo.** São 5 lugares com `Number(t.replace(...))`: `Acompanhamento.tsx:25`
  (`numero`), `TelaAjustes.tsx:75-76`, `Cadastro.tsx:149-150`, `EditorAparelho.tsx:125` (etiqueta) e
  `EditorAparelho.tsx:191` (potência, com o `Math.min(30000, …)`). O "135.90" continua virando R$ 13.590.
- **Desde a 003a, as ações do store recusam em silêncio** o que o leitor não aceita (`salvarConta`, `salvarLeitura`,
  `atualizarResidencia`, `adicionarAparelho`... devolvem sem gravar). Hoje a tela não sabe que nada foi salvo. Na
  `TelaAjustes`, o "Conta salva" aparece mesmo quando o store recusou. É a razão principal desta história: **a tela
  confere antes, com as mesmas funções do core, e só chama a ação com valor válido.** O store continua sendo a 2ª
  barreira e não muda.
- **`CamposDaConta` ainda não existe:** são 3 cópias de kWh + valor (`Cadastro.tsx:515-520`, passo `conta`;
  `TelaAjustes.tsx:138-143`, seção `#conta`; `Acompanhamento.tsx:147-152`, na `Folha` "Anotar conta de luz").
- **Layout da 112:** a `/casa/ajustes` está em 2 colunas (a conta fica à esquerda); o `/comecar` tem o painel "Por que
  perguntamos" à direita, que **nunca** mostra erro nem "Confere?" (regra 5 do `/comecar` na 112); a `/casa` tem áreas
  de grade no `lg:` (`PainelAcompanhamento.tsx`); os cômodos têm dois desenhos (`ComodosNoComputador` e a sanfona) que
  abrem a **mesma** folha `EditarComodo` e o mesmo `EditorAparelho`.
- **Limites de texto escritos à mão:** `maxLength={40}` em `Cadastro.tsx:403` e `TelaComodos.tsx:334`, e `{60}` em
  `EditorAparelho.tsx:89`. Passam a vir de `LIMITES_DE_TEXTO` (R9 da 003a). O `Contador` de pessoas (`Cadastro.tsx:358`)
  tem `max={15}`, contra `LIMITES.pessoas.max` = 20.
- `ui/foco.ts` (`focarTitulo`, da 003a) existe. O foco "no 1º campo errado" usa um `focarPrimeiroErro` novo no mesmo
  arquivo, não o título.

### Contratos (T5 e T6)

- **`ui/Campo.tsx`** (é `"use client"`):
  - `id` passa a ser obrigatório, e todos os usos já têm;
  - ganha `erro?: string` e
    `alerta?: { titulo: string; texto: string; aoConfirmar: () => void; aoCorrigir: () => void }`;
  - publica `{ id, idsDescricao, invalido }` num `CampoContexto`.
  - Fica sempre na página uma região `aria-live="polite"` com `{id}-erro` e `{id}-alerta`. A ajuda continua `{id}-ajuda`,
    fora da região. Os botões "Sim, está certo" e "Corrigir" ficam fora da região, e nenhum recebe foco sozinho.
  - "Corrigir" põe o foco na entrada com o texto selecionado. "Sim" não move o foco.
- **`ui/Entrada.tsx`:** lê o contexto e junta `aria-invalid` e `aria-describedby` com o que vier por prop. A borda fica
  `border-alerta` quando é erro e `border-faisca` quando é alerta. Sem contexto (uso fora de `Campo`), fica igual a hoje.
- **`ui/campos/useCampoNumerico.ts`:**
  `useCampoNumerico({ faixa: Faixa; casas: 0 | 2; obrigatorio: boolean; inicial?: number; formatar: (n: number) => string })`
  devolve `{ texto, aoMudar, aoSair, erro, alerta, valorValido, conferir }`.
  - Guarda o texto, se o campo foi tocado e o valor que a pessoa confirmou no "Sim". Mostra a mensagem ao sair do campo
    ou no `conferir()`, e depois confere a cada tecla.
  - `conferir()` devolve `"ok" | "erro" | "alerta"` para a tela decidir: salvar, focar o erro ou esperar o "Sim".
  - **Só estado derivado e handlers; nenhum `useEffect` que copia estado** (a HIS-109 só desce, D17 da 002b).
- **`ui/campos/mensagens.ts`:** monta os textos do T5 e do T6 a partir de `LIMITES` e dos `formatar*` do core. Nenhum
  número de faixa na tela.
- **`ui/conta/CamposDaConta.tsx`:** `{ uso: "calibracao" | "acompanhamento"; beneficio: Beneficio; ... }`, com kWh,
  valor e o alerta de preço (`precoDaContaForaDoComum`). Substitui as 3 cópias. Na calibração a faixa é
  `contaKwhCalibracao` e `contaValorCalibracao`; no acompanhamento, as `…Acompanhamento` (0 é aceito).
- **`ui/AvisoConsumoAlto.tsx`:** usa `consumoDaCasaForaDoComum` e aparece no passo `revisao` do cadastro e no painel.
  No painel, vem logo depois da `section` da conta no código. No `lg:`, a raiz do `PainelAcompanhamento` usa uma de
  duas listas de áreas, as duas escritas por inteiro no código (o Tailwind precisa da classe literal): uma com a linha
  `'aviso aviso'` depois de `'conta conta'` e outra sem. Assim não sobra linha vazia com intervalo quando não há aviso.
- `ui/` só chama funções puras do `@ee/core` (ADR-001, regra 4). `aplicacao/` e `infraestrutura/` não mudam.

### Onde entra, tela por tela

| Arquivo (hoje) | Mudança |
| --- | --- |
| `ui/aparelho/EditorAparelho.tsx` | potência com `useCampoNumerico(LIMITES.potenciaW, 0)`; sai o `Math.min`; alerta acima de 10.000 W, com a referência `potenciaDoChuveiroMaisForteW()`; etiqueta com `kwhMesInformado`; nome com `maxLength={LIMITES_DE_TEXTO.nomeAparelho}`; "Salvar" chama `conferir()` em todos os campos e foca o 1º errado |
| `funcionalidades/acompanhamento/Acompanhamento.tsx` | o `numero` sai; conta com `CamposDaConta uso="acompanhamento"`; leitura com `maxLength={6}` e `alertaDaLeitura` ao salvar, comparando com a leitura anterior |
| `funcionalidades/ajustes/TelaAjustes.tsx` | conta com `CamposDaConta uso="calibracao"`; "Conta salva" só depois de o store aceitar (valor válido e, se houver alerta, depois do "Sim") |
| `funcionalidades/cadastro/Cadastro.tsx` | passo `conta` com `CamposDaConta uso="calibracao"`; `concluir` só com o valor válido; nome do cômodo com `LIMITES_DE_TEXTO.nomeComodo`; pessoas com `max={LIMITES.pessoas.max}`; `AvisoConsumoAlto` na `revisao`. Erro e alerta ficam no passo, nunca no painel do lado |
| `funcionalidades/comodos/TelaComodos.tsx` (`EditarComodo`) | nome com `LIMITES_DE_TEXTO.nomeComodo` e erro de nome vazio. Serve aos dois desenhos da 112 |
| `funcionalidades/acompanhamento/PainelAcompanhamento.tsx` | `AvisoConsumoAlto` e as duas listas de áreas |

### Peso

O 11a fica em até +3 072 B nas rotas com campo (`/comecar`, `/casa`, `/casa/comodos` e `/casa/ajustes`) e em até
+1 024 B nas outras. O 11b vai até +4 096 B. Conta-se só o incremento da 003b sobre o `main` de quando ela começar.
Passou disso, falar comigo antes de mudar o `peso-js.json`.

### Testes

| Arquivo | O que prova |
| --- | --- |
| `campos.spec.ts` (novo) | potência vazia, 0, 75.001 e 10.001 (ao sair do campo: `aria-invalid` e `aria-describedby`, mín. e máx. formatados, "Sim" salva, "Corrigir" seleciona); "Ver o resultado" com erro foca o 1º campo errado; "135.90" no valor vira R$ 135,90 e não R$ 13.590; conta de 150 kWh e R$ 1.359,00 dá alerta, e com Tarifa Social não; conta 0 no acompanhamento é aceita; leitura acima de 100 kWh por dia dá alerta; nos Ajustes, valor recusado não mostra "Conta salva" |
| `layout-computador.spec.ts` | a 1280 px, o erro do passo `conta` fica no passo, e o `aside` "Por que perguntamos" não muda |
| `apps/web/test/` (vitest) | `useCampoNumerico`: os estados `ok`, `erro` e `alerta`, e o "Sim" guardado só para o mesmo valor |

- **axe:** entram o campo com erro e o campo com alerta, a 390 e a 1280 px.
- **Celular:** nenhum pixel muda nas telas sem erro (mesma comparação do q3 da 112).

### Passos

| Passo | Quem | O quê | Est. |
| --- | --- | --- | --- |
| b1 | frontend | `Campo`/`Entrada` com contexto, `useCampoNumerico`, `mensagens.ts`, `focarPrimeiroErro` e o teste vitest | 0,5 d |
| b2 | frontend | `CamposDaConta` nos 3 lugares, `EditorAparelho`, `EditarComodo`, leitura, `AvisoConsumoAlto` (com as áreas da `/casa`), pessoas até 20, `LIMITES_DE_TEXTO` | 0,75 d |
| b3 | qa | `campos.spec.ts`, o caso no `layout-computador.spec.ts` e axe | 0,5 d |

## Ameaças

_(seguranca)_ Ver a HIS-003a: A4 (texto ou número gigante), A9 (`maxLength`) e o R9 da etapa 6 (`maxLength` = máximo do
esquema; nenhum limite fora do `limites.ts`). Revisão desta parte na etapa 6 da 003b.

## Plano de testes

_(qa)_ A escrever a partir do `campos.spec.ts` acima e dos casos 1–23 da 003a.

## Perguntas abertas

- [x] [para: tech-lead] Peso (P-fe-003b-1): sobre o `main` de `35f2893`, o 11a ficou em +3 315 B no `/comecar`, +4 424 B na
  `/casa`, +2 734 B na `/casa/comodos` e +3 218 B na `/casa/ajustes` (teto +3 072); `/` e `/casa/dicas` +461 B. O 11b foi
  a +12 435 B (teto +4 096): o Turbopack copia `Campo`, `useCampoNumerico`, `entrada.ts` e os textos em cada página que
  os usa, e o prefetch soma as 4 cópias. Já separei os textos por quem usa (−1,4 kB no 11b). O `peso-js.json` não mudou;
  tabela no diário do frontend (2026-11-15).
- [para: ux-acessibilidade] Nos Ajustes não há "Pular": a conta zerada mostra só a 1ª frase do T5 ("Com a conta zerada
  não dá para ajustar o cálculo."). Serve, ou querem outra 2ª frase?

## Conversa da equipe

### [scrum-master] 2026-10-30 — história criada pela quebra da HIS-003 (P-tl-3)
- O que fiz: criei a 003b a partir do modelo, movendo da HIS-003 o T5, o T6, o bloco "T5 e T6" do D5, o `campos.spec.ts`
  e os passos b1–b3, com remissões nos dois arquivos. Escrevi o critério 8 (T6), que faltava: os critérios da HIS-003
  são de antes do "Confere?".
- Decisões e porquê: vem **depois** da 003a, não em paralelo: depende do `limites.ts` e do `entrada.ts` (a1) e mexe no
  `Cadastro` e no `PainelAcompanhamento`, que o T2 da 003a também muda. Fica na Sprint 0: o corte escondido em
  30.000 W e o "135.90" lido como R$ 13.590 dão conta errada para a família.
- Arquivos alterados: este arquivo (novo), `HIS-003-base-de-seguranca.md`, `docs/planejamento.md`, `docs/equipe/quadro.md`.
- Para o próximo (frontend + qa): etapa 4 quando a 003a estiver no `main`. Antes, qa escreve o "Plano de testes".

### [tech-lead] 2026-11-15 — desenho técnico revisto para o código de hoje (`e24561a`)
- Os 5 lugares que ainda leem número do jeito antigo e as 3 cópias dos campos da conta estão mapeados, com os arquivos e linhas de hoje (tabela "Onde entra").
- Desde a 003a, o store recusa em silêncio. Por isso a tela confere antes, com as funções do core, e o store continua sendo a 2ª barreira; isso conserta também o "Conta salva" falso dos Ajustes.
- Para a 112: o erro nunca vai para o painel do `/comecar`; o `AvisoConsumoAlto` tem duas listas de áreas na `/casa`; o `EditarComodo` serve aos dois desenhos.
- O `useCampoNumerico` não pode ter efeito que copia estado (a HIS-109 só desce). Peso: até +3 072 B nas rotas com campo.
- Próximo: **qa** (Plano de testes a partir da tabela) → **frontend** (b1–b2).

### [frontend] 2026-11-15 — b1 e b2 feitos (`a535c64`, `84f1587`, `bf59d3d`)
- `Campo` com erro, "Confere?" e `CampoContexto`; `useCampoNumerico` (sem efeito), `CamposDaConta` nos 3 lugares, editor, cômodo, leitura e `AvisoConsumoAlto` (com a linha `aviso` na `/casa` do `lg:`).
- A tela confere com o core antes do store; "Pronto" nos Ajustes só se o store guardou. Mensagem não entra ao sair do campo para um botão (o toque se perdia com o botão empurrado).
- Barreira: lint, typecheck, test e build ok; e2e 225 ok, só o `peso-js` reprova (pergunta ao tech-lead). Capturas 390/1024/1280/1440 em `/tmp/claude-0/-home-claude/724c883e-847d-598e-bea6-965ed2231507/scratchpad/capturas-003b/` (fora do repositório); a 390 e 800 px, sem erro, só muda o botão que deixou de ser `disabled`.
- Para o qa (b3): casos do `campos.spec.ts`, axe com erro e alerta, Esc na folha com alerta aberto, toque no botão logo depois de digitar.
- Próximo: **tech-lead** (peso) e **qa** (b3).


### [ux-acessibilidade] 2026-11-15 — conta zerada nos Ajustes e revisão do "Confere?"
- Ajustes: manter a 1ª frase do T5 e acrescentar: "Para seguir sem conta, é só não tocar em “Usar estes valores”." Sem botão novo e sem culpa; o aviso fica junto do campo, como `status`.
- "Confere?" claro em 390 e 1440 px: amarelo com ícone e texto (não só cor), valor entendido, pista e dois botões. Conferir só que "Corrigir" tem alvo de 44 px de altura.

### [tech-lead] 2026-11-15 — P-fe-003b-1: peso aceito na 003b; o corte vem numa história própria, logo depois
1. **Medido em builds do `1c213e3` e do `35f2893`.** O core não é copiado (os `limites` ficam no chunk comum); o que se repete nas 4 páginas é o que só elas usam: `Campo`, `Entrada`, o hook, os textos e o `entrada.ts` (cerca de 2,5 kB por página). Testei as opções do Next (`turbopackChunking`). Com `minChunkSize` de 10 000, o 11b cai 22 kB, mas o 11a sobe até +5 kB. `generateComponentChunks` e `clusters` não mudam nada. Nenhuma ajuda sem piorar o 11a, então a configuração não muda.
2. **Aceito nesta história** (ela corrige conta errada, como o "135.90" lido como R$ 13.590): 11a até +4 608 B na `/casa` e até +3 584 B no `/comecar`, na `/casa/comodos` e na `/casa/ajustes`; 11b até +13 312 B. O frontend atualiza o `peso-js.json` com o `decisao` apontando para esta nota.
3. **O corte de verdade é carregar as folhas de edição só quando abrem**, com `next/dynamic`: `EditorAparelho`, "Anotar conta", "Anotar leitura" e `EditarComodo`. Isso tira o código dos campos do primeiro carregamento e do prefetch. O lint da 002b proíbe `import()` até haver regra própria, então isso vira uma **história nova, logo depois da 003b**, com ADR (`import()` só com caminho literal, dentro de `dynamic()`, conferido pelo script de camadas), seguranca e ux (o que a folha mostra enquanto carrega no 3G). Meta: tirar ao menos 3 kB do 11a da `/casa` e a maior parte do 11b. Quem orquestra leva ao scrum-master.


### [tech-lead] 2026-11-17 — revisão única da PR (código e segurança): aprovado
1. **Aprovado** (`a535c64..bf59d3d`, `425c7ed`, `16e832b` com o Next 16.4.6 e `23df555`). Os 5 `Number(replace)` saíram. Toda tela confere com o core (`lerNumeroDigitado` + `validarFaixa`, em `situacaoDoCampo`) antes de chamar o store, que continua sendo a 2ª barreira. O "Conta salva" falso foi corrigido: a tela só confirma quando o store gravou (`mesmaConta`).
2. **Segurança:** nenhum `as` sobre dado de fora, nenhum `any` e nenhum `!`. Os textos têm `maxLength` vindo de `LIMITES_DE_TEXTO` e a leitura tem 6 dígitos. Os números ficam presos às faixas do `limites.ts`, sem número escrito à mão na tela. Não há HTML a partir de texto, e o `useCampoNumerico` não tem efeito (continuam 7 linhas da HIS-109).
3. Como verifiquei: numa cópia, lint, typecheck (98 arquivos), test (242 + 25 + 104 + 152) e build verdes. `pnpm audit` sem alta nem crítica (1 moderada). Próximo: fechamento.
