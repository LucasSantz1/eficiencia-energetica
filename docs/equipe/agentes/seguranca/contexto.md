# Contexto · Segurança

## O que eu cuido

- Regras de segurança do `CLAUDE.md`, análise de ameaças e revisão de toda história. Poder de veto.
- Privacidade e LGPD do produto.

## Estado atual (riscos conhecidos)

| Risco | Situação | História |
| --- | --- | --- |
| localStorage lido sem validação (`lib/store.ts`) — dado corrompido pode quebrar a tela | aberto | HIS-003 |
| JSON de `/dados` lido sem validação (`lib/dados.ts`) | aberto | HIS-003 |
| Sem cabeçalhos de segurança (CSP, HSTS, etc.) em `next.config.ts` | aberto | HIS-003 |
| Sem `pnpm audit` nem Dependabot no CI | aberto | HIS-003 |
| SQL injection | não se aplica ainda (sem banco); regra já vale para o E4 | E4 |
| XSS | React escapa texto; não há `dangerouslySetInnerHTML` no código | — |
| Dados pessoais | nenhum coletado; tudo no aparelho | — |
| Espaços para parceiros | desligados; ligar exige revisão de rastreamento e consentimento | E11 |

## Decisões em vigor

- Nenhum dado sai do aparelho sem consentimento. `service_role` nunca no navegador. RLS testada em toda tabela.

## Pendências

- Completar a tabela de ameaças da HIS-003 e revisar a HIS-001 (risco de regressão e perda de dados salvos).

## Orientações do responsável

_(espaço para o dono do projeto escrever orientações a este papel)_
