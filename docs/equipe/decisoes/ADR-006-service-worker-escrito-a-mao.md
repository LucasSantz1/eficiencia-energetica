# ADR-006 · Modo sem internet com um service worker escrito à mão, sem Serwist

- **Status:** proposto (2026-11-25, quem orquestra, no modo turbo combinado com o dono). Vai para a rodada de
  verificação do fim da Sprint 3 (seguranca e tech-lead).
- **Data:** 2026-11-25
- **Responsável:** quem orquestra; revisão: tech-lead e seguranca

## Contexto

A HIS-301 pede o site funcionando sem internet. O planejamento falava em Serwist. Com o Next 16 e o Turbopack, o
caminho do Serwist é o pacote `@serwist/turbopack` (9.6.0), que gera o service worker numa rota do próprio site e traz
`@swc/core`, `esbuild` (dependência par), `zod`, `browserslist` e mais 5 pacotes. O projeto já trocou o zod por leitores
escritos à mão (ADR-004) pelo mesmo motivo: peso, superfície de ataque e código que ninguém da equipe lê.

O site é quase todo estático (8 páginas pré-renderizadas), a casa da pessoa fica no `localStorage`, e os dados públicos
são 29 arquivos JSON em `/dados` (tarifas, relatório e 27 estados). O que precisa ficar guardado é pouco e previsível.

## Decisão

1. **`apps/web/public/sw.js`, escrito à mão (~120 linhas), sem dependência.** Ele:
   - guarda na instalação as 8 páginas, os arquivos de `/_next/static` que o HTML delas cita e o `tarifas.json`;
   - páginas e `/dados`: primeiro a rede, com 4 s de tempo máximo (3G fraco); depois, a cópia guardada;
   - `/_next/static` e ícones: primeiro a cópia (o nome tem hash);
   - pedidos de navegação do Next (`?_rsc=`) vão direto à rede; se falharem, o Next abre a página inteira e a cópia
     responde;
   - só guarda resposta `ok`, do próprio site, sem redirecionamento; só pedidos `GET` do próprio site passam por ele;
   - página nunca guardada e sem internet: um aviso curto em HTML ("Você está sem internet"), status 503.
2. **Nada da pessoa no cache.** As páginas são as mesmas para todo mundo. A única cópia que diz algo sobre ela é a do
   `municipios/UF.json` (o estado da cidade), e "Apagar todos os meus dados" apaga as cópias de `dados-*` (LGPD).
3. **Versão no nome do cache** (`paginas-v1`, `arquivos-v1`, `dados-v1`): trocar a versão no `sw.js` apaga as cópias
   antigas na ativação. O `/sw.js` vai com `Cache-Control: no-cache` para a versão nova chegar logo.
4. **Registro só no build de produção** (`infraestrutura/offline/servico.ts`), a partir do layout
   (`funcionalidades/offline/LigarOffline`). Falhar o registro só tira o modo sem internet.
5. **Testes:** o `playwright.config` bloqueia o service worker (`serviceWorkers: "block"`) em todos os testes, porque
   ele responderia por fora do `page.route` dos testes de falha; só o `offline.spec.ts` o liga.

## Alternativas

- **`@serwist/turbopack`:** precache completo gerado no build e estratégias prontas. Rejeitado por agora: 9
  dependências diretas (uma delas um compilador nativo) para um arquivo de ~120 linhas, contra o princípio de páginas
  leves e o ADR-004. Volta a ser opção se o site passar a ter muitas rotas dinâmicas ou precisar de sincronização em
  segundo plano.
- **Só o `experimental.useOffline` do Next 16:** tenta de novo a navegação quando a rede volta, mas não abre a página
  sem internet depois de fechar o navegador (o guia do próprio Next manda usar um service worker para isso).

## Consequências

- Mudança no `sw.js` passa pela seguranca (como o `next.config.ts`): ele vê todo pedido do site.
- Os arquivos de `/_next/static` de versões antigas ficam no cache `arquivos-v1` até a versão do `sw.js` mudar.
  Aceito: são poucos kB por versão; trocar a versão a cada mudança grande do site limpa tudo.
- O e2e não cobre o service worker fora do `offline.spec.ts`; um defeito nele que só aparece junto com outra tela
  passa pelos outros testes. A rodada de verificação testa o site inteiro com ele ligado.
