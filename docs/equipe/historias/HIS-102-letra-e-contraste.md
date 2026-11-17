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

### [frontend] 2026-11-17 — critérios 1 a 6 feitos (`4f56e24`…), para a revisão do tech-lead
- Chave `eficiencia-energetica:leitura` lida e validada em `infraestrutura/armazenamento/leitura.ts`; script de uma linha no `<head>` (texto filho, sem `dangerouslySetInnerHTML`; a CSP já tem `'unsafe-inline'`); seção "Leitura" com `ui/Interruptor` (`role="switch"`); "Apagar todos os meus dados" apaga a chave.
- Achado do e2e: com a letra a 125%, o `truncate` cortava "em Sala" e o axe acusava `label-content-name-mismatch`; com a letra maior, nada trunca (regra fora das camadas, no `globals.css`).
- lint, typecheck, test (37 no site, 12 novos), build e e2e (259) verdes; peso 11a no máximo +782 B (`/casa/ajustes`). Capturas: `/tmp/claude-0/-home-claude/724c883e-847d-598e-bea6-965ed2231507/scratchpad/his102/`.

### [tech-lead] 2026-11-17 — revisão única da HIS-102 (código e segurança): aprovada, com 1 ajuste antes do merge
1. **Código aprovado.** A leitura da preferência é feita na fronteira (`interpretarPreferenciaDeLeitura`: até 200 caracteres, JSON e só `=== true` liga), sem `as` e sem `any`. A preferência passa por `aplicacao/` e sai junto com "Apagar todos os meus dados". O peso de +782 B no 11a está aceito. Numa cópia, lint, typecheck (102), test (242 + 37 + 104 + 152) e build verdes.
2. **CSP:** sim, o `script-src` tem `'unsafe-inline'` desde a HIS-003a (risco aceito pela seguranca, porque nonce obriga a página a ser dinâmica). O script desta história não abre brecha nova: é texto fixo e não usa dado da pessoa. Mas o `'unsafe-inline'` tira da CSP a 2ª barreira contra XSS. **Fechar numa história própria (seguranca + tech-lead), logo:** ligar `experimental.sri` (hash, página continua estática; documentado no guia de CSP do Next 16), tirar o `'unsafe-inline'` do `script-src` e pôr o `'sha256-…'` do `SCRIPT_DA_PRIMEIRA_PINTURA`, calculado com `node:crypto` no `next.config.ts`. O e2e já reprova "Refused to…". Pequeno, nesta PR: o script do `<head>` também deve ignorar texto com mais de 200 caracteres, a mesma regra do leitor.
3. **Ajuste (frontend, com o texto do ux):** a letra maior precisa estar onde todo mundo passa. Pôr o mesmo `Interruptor` "Letra maior" no topo da `Moldura` do `/comecar` e no topo da `Casca`, que aparece também sem cadastro. O controle fica no 11a das rotas e cabe nos +1 024 B. A página inicial fica para o ux decidir.
