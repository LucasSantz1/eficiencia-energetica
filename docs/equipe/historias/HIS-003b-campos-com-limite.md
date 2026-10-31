# HIS-003b · Campos com limite e "Confere?"

| Campo | Valor |
| --- | --- |
| Épico | E0 · Fundação |
| Sprint | 0 |
| Tamanho | M (≈ 1,5 dia com o qa: passos b1–b3) |
| Papéis principais | frontend, ux-acessibilidade, qa |
| Status | Preparada (implementação bloqueada: ver "Dependências") |
| Branch | `his-003b-campos` (sai do `main` **depois** da integração da HIS-003a) |

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

_(tech-lead, 2026-10-30; movido da HIS-003 sem mudança. Contratos de domínio usados aqui — `LIMITES`, `validarFaixa`,
`precoDaContaForaDoComum`, `alertaDaLeitura`, `consumoDaCasaForaDoComum`, `lerNumeroDigitado` — e a decisão D1.3 sobre
o `CampoContexto` estão na HIS-003a, D1 e D2.)_

### T5 e T6, campos fora do limite e "Confere?" (do D5)

- `ui/Campo.tsx`:
  - `id` passa a ser obrigatório; todos os usos já têm.
  - Ganha `erro` e `alerta: { titulo; texto; aoConfirmar; aoCorrigir }`.
  - Região `aria-live` sempre na página, com os ids `{id}-erro`, `{id}-alerta` e `{id}-ajuda`.
  - Os botões do alerta ficam fora da região.
  - No "Corrigir", o foco vai para a entrada com o texto selecionado; no "Sim", só o foco. A `Entrada` se registra pelo
    contexto.
- `ui/Entrada.tsx`: lê o contexto (`aria-invalid`, `aria-describedby`, junto com o que vier por prop, e `border-alerta`).
- `ui/campos/useCampoNumerico.ts`:
  - Guarda o texto, se o campo já foi tocado e qual valor a pessoa confirmou.
  - Mostra a mensagem ao sair do campo e no `conferir()`. Depois disso, confere a cada tecla.
  - `valorValido` é o que pode ser salvo.
- `ui/campos/mensagens.ts`: textos do T5 e do T6 a partir de `LIMITES` e dos `formatar*`.
- `ui/conta/CamposDaConta.tsx`: kWh, valor e o alerta de preço, para `uso: "calibracao" | "acompanhamento"`. Substitui
  as três cópias de hoje (cadastro, ajustes e acompanhamento).
- Telas:
  - `EditorAparelho`: o `Math.min(30000)` sai.
  - `TelaComodos`: nome do cômodo.
  - Leitura do relógio: `maxLength={6}` e alerta ao salvar.
  - `ui/AvisoConsumoAlto.tsx`: aviso do consumo estimado da casa.
  - Pessoas até 20.

### Testes (do D8)

| Arquivo | O que prova |
| --- | --- |
| `campos.spec.ts` | potência vazia, 0, 75.001 e 10.001 (ao sair do campo, `aria-invalid`/`aria-describedby`, mín. e máx. formatados, "Sim" salva, "Corrigir" seleciona); "Ver o resultado" com erro põe o foco no 1º campo errado; preço da conta 150 kWh / R$ 1.359,00 dá alerta, e com Tarifa Social não; conta 0 no acompanhamento é aceita; leitura acima de 100 kWh por dia dá alerta |

- **axe:** entram o campo com erro e o campo com alerta.
- **Peso:** a referência `peso-js.json` muda de propósito no PR; mesmo teto do D8 da 003a (acima de +4 kB gzip por
  rota, falar com o tech-lead antes).

### Passos (do D9)

| Passo | Quem | O quê | Est. |
| --- | --- | --- | --- |
| b1 | frontend | `Campo`/`Entrada` com contexto, `useCampoNumerico`, `mensagens.ts` | 0,5 d |
| b2 | frontend | `CamposDaConta` nos 3 lugares, `EditorAparelho`, `TelaComodos`, leitura, `AvisoConsumoAlto`, pessoas até 20 | 0,75 d |
| b3 | qa | `campos.spec.ts` + axe | 0,25–0,5 d |

## Ameaças

_(seguranca)_ Ver a HIS-003a: A4 (texto ou número gigante), A9 (`maxLength`) e o R9 da etapa 6 (`maxLength` = máximo do
esquema; nenhum limite fora do `limites.ts`). Revisão desta parte na etapa 6 da 003b.

## Plano de testes

_(qa)_ A escrever a partir do `campos.spec.ts` acima e dos casos 1–23 da 003a.

## Perguntas abertas

- (nenhuma)

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
