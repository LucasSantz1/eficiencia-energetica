# HIS-102 · Letra maior e mais contraste

| Campo | Valor |
| --- | --- |
| Épico | E1 · Inclusão |
| Sprint | 1 (Inclusão I) |
| Tamanho | P |
| Processo | Modo rápido (não é sensível: a escolha não é dado da pessoa e não sai do aparelho) |
| Branch | `his-102-letra-contraste` |

## Problema e valor

Como **pessoa que enxerga pouco ou usa o celular no sol**, eu quero **aumentar a letra e deixar as cores mais fortes**
para **ler os valores da conta sem esforço**. A escolha fica guardada no aparelho e vale no site inteiro, desde a
primeira tela, sem piscar.

## Critérios de aceite

1. **Dado** Minha casa, **então** há uma seção "Leitura" com dois interruptores (`role="switch"`, toque de 44 px ou
   mais): "Letra maior" e "Mais contraste", cada um com uma frase curta que diz o que faz.
2. **Dado** um interruptor ligado, **quando** recarrego ou abro outra página do site, **então** ele continua ligado e a
   tela já abre com a letra ou as cores escolhidas, sem piscar a versão normal.
3. **Dado** a escolha guardada, **então** ela fica numa chave própria e pequena do navegador
   (`eficiencia-energetica:leitura`), separada da casa salva. Valor estranho ou quebrado vale como "desligado".
4. **Dado** "Letra maior", **então** o texto do site fica cerca de 25% maior (125%), e a 390 px nenhuma tela rola para
   o lado. **Dado** "Mais contraste", **então** os textos de apoio, as linhas e os botões ficam com cores mais escuras.
5. **Dado** "Apagar todos os meus dados", **então** a escolha de leitura também é apagada.
6. **Dado** a barreira, **então** lint, typecheck, test, build e e2e passam; o axe não acusa nada com os dois ligados,
   a 390 e 1440 px; o 11a do peso sobe no máximo 1 024 B.

## Fora do escopo

- Tema escuro e escolher o tamanho exato da letra.
- Levar a escolha para fora de Minha casa (por exemplo, para a página inicial antes do cadastro): fica para depois.

## Desenho (frontend, modo rápido)

- `infraestrutura/armazenamento/leitura.ts`: lê, valida, grava e apaga a chave, sempre com `try/catch`; põe
  `data-letra="maior"` e `data-contraste="mais"` no `<html>`.
- Primeira pintura: o layout raiz põe no `<head>` um `<script>` de uma linha que lê a chave e marca o `<html>` antes de
  pintar. A CSP da HIS-003a não usa nonce nem hash (`script-src 'self' 'unsafe-inline'`), então o script inline já é
  permitido. Ele é texto filho do `<script>`, sem `dangerouslySetInnerHTML`: o código não tem `&`, `<`, `>` nem aspas
  (o React escaparia esses caracteres), e um teste de unidade confere isso.
- CSS: `globals.css` muda o tamanho da letra da raiz (125%) e compensa o `--spacing`, para só a letra crescer; o
  contraste troca os tokens `--color-tinta-suave`, `--color-linha` e `--color-energia`.

## Conversa da equipe
