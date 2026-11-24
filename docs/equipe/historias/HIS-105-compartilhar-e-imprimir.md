# HIS-105 · Compartilhar e imprimir o resumo

| Campo | Valor |
| --- | --- |
| Épico | Inclusão II |
| Sprint | 4 (adiantada no modo rápido, pedido do dono em 17/11/2026) |
| Tamanho | P |
| Papéis principais | frontend; revisão do tech-lead (modo rápido) |
| Status | Em implementação |
| Branch | `his-105-compartilhar` (sai do `main` em `cc4df94`) |

> **Modo rápido** (`docs/equipe/processo.md`): não é sensível. Nada sai do aparelho para o nosso servidor; o texto só vai
> para onde a pessoa escolher (WhatsApp, e-mail, papel), e ela vê o texto antes de enviar.

## Problema e valor

Como **família que quer combinar com a casa toda como gastar menos luz**, eu quero **mandar o resumo da conta pelo
celular ou imprimir e pôr na geladeira** para **que todo mundo veja quem mais gasta e qual é a próxima dica**.

## Critérios de aceite

1. **Dado** o Acompanhamento (`/casa`) com aparelhos, **quando** o celular tem Web Share, **então** há o botão
   "Compartilhar resumo", que abre o compartilhar do aparelho (`navigator.share`) só com texto puro.
2. **Dado** o texto do resumo, **então** ele tem a conta estimada do mês em R$ (e o kWh depois), os 3 aparelhos que mais
   gastam (em R$ por mês) e a próxima dica (com a economia em R$), diz que é estimativa e tem o endereço do site.
   **Não** tem cidade, distribuidora, nome de cômodo nem nome que a pessoa digitou: o aparelho vai com o nome do
   catálogo; o que não é do catálogo vira "Outro aparelho".
3. **Dado** um navegador sem Web Share, **então** o botão é "Copiar resumo" e copia o mesmo texto. A região
   `role="status"`, sempre presente, avisa "Resumo copiado. Agora é só colar na conversa ou no e-mail.". Se não der
   para copiar, avisa "Não deu para copiar. Selecione o texto abaixo e copie." e mostra o texto num campo só de leitura.
4. **Dado** que a pessoa fecha o compartilhar sem escolher nada, **então** nada acontece (sem erro e sem aviso). Se o
   compartilhar falhar por outro motivo, o site copia o texto, como no critério 3.
5. **Dado** o botão "Imprimir", **então** abre a impressão do navegador. A folha impressa é feita só com CSS
   (`@media print`), sem página nova: sem navegação, sem botões, sem o "Mês a mês"; com a conta, os cômodos, quem mais
   gasta e a lista "Dicas para pagar menos" (até 5, só na folha), em preto e branco.
6. **Dado** o texto, **então** ele é montado por uma função pura (`aplicacao/textoDoResumo.ts`), com teste, que usa
   `formatarReais` e `formatarKwh` do `@ee/core`. Nenhuma conta nova: os valores vêm do `useResumo`.
7. **Dado** o peso de JS, **então** o 11a da `/casa` cresce no máximo +1 024 B (gzip).
8. **Dado** o e2e, **então** ele cobre o compartilhar (com `navigator.share` falso), o copiar (clipboard de verdade), a
   impressão (`page.emulateMedia({ media: "print" })`, com captura) em 390 e 1440 px, o axe, e nenhum pedido para fora
   do site.

## Textos (linguagem simples)

- Botões: "Compartilhar resumo" · "Copiar resumo" · "Imprimir".
- Avisos: "Resumo copiado. Agora é só colar na conversa ou no e-mail." · "Não deu para copiar. Selecione o texto abaixo e copie."
- Título só da folha impressa: "Dicas para pagar menos".
- Texto do resumo (exemplo):

  ```
  Nossa conta de luz estimada: R$ 182,40 por mês (215 kWh).

  Os aparelhos que mais gastam:
  1. Chuveiro elétrico: R$ 78,10 por mês
  2. Geladeira: R$ 29,70 por mês
  3. Ferro de passar: R$ 12,00 por mês

  Próxima dica: Banhos 2 minutos mais curtos. Economiza R$ 12,30 por mês.

  É uma estimativa, feita com o tempo de uso de cada aparelho.
  Faça a conta da sua casa, de graça: https://…
  ```

## Fora do escopo

- Imagem ou PDF do resumo, QR code, link com os dados da casa (seria dado saindo do aparelho).
- Compartilhar das outras abas (`/casa/comodos`, `/casa/dicas`). A folha impressa vale para qualquer tela, mas só a
  `/casa` foi desenhada para ela.

## Perguntas abertas

_(nenhuma)_

## Conversa da equipe
