# Espaços reservados para parceiros (documento interno)

Existem lugares no site preparados para, no futuro, mostrar conteúdo de parceiros (por exemplo, um programa de troca de
geladeira da distribuidora ou uma loja de lâmpadas LED). Hoje eles estão **desligados** e **não aparecem no site**.
Ver ADR-002.

## Como funciona

- Chave: `RECURSOS.espacosReservados` em `apps/web/src/config/recursos.ts` (hoje `false`).
- Componente: `EspacoReservado` (`posicao` obrigatória). Desligado, não renderiza nada — nenhum elemento, nenhum texto,
  nenhum espaço vazio.

| Posição | Onde fica |
| --- | --- |
| `inicio-antes-perguntas` | página inicial, antes de "Perguntas comuns" |
| `painel-apos-ranking` | acompanhamento, depois de "Quem mais gasta" e antes da melhor dica |
| `dicas-apos-lista` | plano de economia, depois das dicas e antes de "Também ajuda" |

## Regras para quando ligar (todas obrigatórias)

1. **Nunca** no cadastro, na tela de erro, nem entre a pessoa e uma ação essencial.
2. Conteúdo **relevante para economizar energia** e honesto; nada de crédito fácil, aposta ou promessa enganosa.
3. Identificado claramente como conteúdo de parceiro (rótulo visível), com o mesmo cuidado de acessibilidade do resto.
4. Leve: sem scripts de terceiros que deixem a página pesada; imagem otimizada; reservar a altura para não pular a tela.
5. **Sem rastreamento** de terceiros e sem cookies de publicidade sem consentimento explícito (LGPD).
   Nenhum dado da casa da pessoa é enviado ao parceiro.
6. Pessoa pode esconder o espaço.
7. Antes de ligar: plano de hospedagem que permita uso comercial (o plano Hobby da Vercel não permite),
   política de privacidade atualizada, revisão de `seguranca` e `ux-acessibilidade`, história própria no épico E11.

## Para adicionar uma posição nova

Acrescente o nome em `PosicaoReservada` (em `config/recursos.ts`), coloque `<EspacoReservado posicao="..." />` e atualize a tabela acima.
