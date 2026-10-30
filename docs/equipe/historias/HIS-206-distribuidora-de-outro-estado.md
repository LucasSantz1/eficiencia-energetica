# HIS-206 · Distribuidora de outro estado na cidade (Nova Santa Rita, PI, ligada à CERTAJA)

| Campo | Valor |
| --- | --- |
| Épico | E2 · Precisão da conta |
| Sprint | backlog (proposta: Sprint 2, primeira da "Precisão I") |
| Tamanho | P (se a confirmação mostrar mais de ~10 cidades, reavaliar e quebrar) |
| Papéis principais | dominio-energia, backend (qa confere) |
| Status | Preparando |
| Branch | `his-206-distribuidora-de-outro-estado` (sai do `main` depois da HIS-111 integrada) |

## Problema e valor

Como **família de Nova Santa Rita (PI)**, eu quero **ver só a distribuidora que atende a minha cidade** para **a
estimativa da conta usar o preço certo**.

Hoje `apps/web/public/dados/municipios/PI.json` liga Nova Santa Rita (IBGE 2207959) a `equatorial-pi` **e** a
`certaja`. A CERTAJA é uma cooperativa do Rio Grande do Sul. Existe uma Nova Santa Rita no RS (IBGE 4313375), que no
nosso arquivo só tem `rge-sul`. A rotina liga cidade e conjunto pelo código do município (`CodMunicipio`, em
`packages/dados/src/aneel/municipios.ts`), não pelo nome. Então a suspeita é um código de município errado no **IndQual
Município da ANEEL**. Isso ainda **não está confirmado**.

Se a pessoa escolher a CERTAJA, a conta sai cerca de 18% menor que a real: tarifa sem impostos de R$ 0,78042/kWh
contra R$ 0,94669/kWh da Equatorial Piauí (`tarifas.json` de hoje). É um caso de número errado, mas pequeno: uma cidade
confirmada, e a família costuma escolher o nome que está na conta dela. Por isso vai para o backlog, e não para a
Sprint 0 como a HIS-111.

**O mesmo padrão em outras cidades (scrum-master, 2026-10-30, a confirmar):** Triunfo (PB, 2516805) × `certaja` e
Soledade (PB, 2516102) × `coprel`. Nos dois casos é uma cooperativa do RS ligada a uma cidade da Paraíba que tem o mesmo
nome de uma cidade gaúcha. O dominio-energia confirma a lista completa no passo 1.

## Critérios de aceite

1. **Dado** o IndQual Município e os atributos dos conjuntos da ANEEL baixados no dia, **quando** o dominio-energia
   confere Nova Santa Rita (PI), Triunfo (PB) e Soledade (PB), **então** fica registrado na seção "Regras de negócio e
   fontes", para cada uma: o conjunto, o `CodMunicipio` que a ANEEL publica, o município do conjunto segundo os
   atributos, a conclusão ("erro da ANEEL", "erro nosso" ou "está certo") e o link da fonte com a data da consulta.
2. **Dado** os arquivos gerados pela rotina, **quando** se procuram todas as cidades ligadas a uma distribuidora cuja
   área de concessão ou permissão não inclui a UF da cidade, **então** a lista completa vai para a história (é o
   tamanho real do problema). Se tiver mais de ~10 cidades, o scrum-master reavalia o tamanho antes da etapa 4.
3. **Dado** um caso confirmado como erro, **quando** a rotina diária roda, **então** a cidade não aparece mais ligada
   àquela distribuidora no `municipios/<UF>.json`, e a correção fica numa tabela no código com a fonte citada (sem
   editar à mão os arquivos de `apps/web/public/dados/`).
4. **Dado** uma ligação nova entre cidade e distribuidora de UF diferente que não está na tabela de correções,
   **quando** a rotina roda, **então** ela falha com uma mensagem que diz a cidade, a UF e a distribuidora, e não
   publica os arquivos.
5. **Dado** uma casa já salva com Nova Santa Rita (PI) e `certaja`, **quando** a pessoa abre o site depois da correção,
   **então** a casa continua abrindo sem erro e a distribuidora passa a ser a Equatorial Piauí (o mesmo caminho do
   `substituidas` da HIS-111, ADR-005, se o tech-lead confirmar que serve).
6. **Dado** a rotina com a correção, **quando** os arquivos **publicados** são conferidos depois da primeira execução no
   `main`, **então** as cidades do critério 1 com "erro" mostram só a distribuidora certa.

## Fora do escopo

- Corrigir outros dados do IndQual que não sejam a ligação cidade × distribuidora.
- Nomes comerciais novos (HIS-205) e impostos (HIS-202).
- Distribuidora vencida ou sucedida (HIS-111).

## Dependências

- **HIS-111 no `main`:** ela mexe na mesma rotina de municípios (índice por CNPJ, sucessões, ADR-005). Começar antes
  daria conflito.
- Avisar a ANEEL do erro (canal de dados abertos ou Fala.BR) é recomendado, mas **não bloqueia** a história.

## Regras de negócio e fontes

_(dominio-energia)_ Passo 1: conferir os três casos e montar a lista completa (critérios 1 e 2).

## Fluxo e textos

_(ux-acessibilidade)_ Não muda nenhum texto, a não ser que o tech-lead decida avisar quem já salvou a casa. Nesse caso,
usar o aviso da HIS-111 (D7).

## Desenho técnico

_(tech-lead / backend)_ Onde fica a tabela de correções, como é a barreira do critério 4 e se o `substituidas` serve
para o critério 5.

## Ameaças

_(seguranca)_ Baixo: só dados públicos. Conferir que a tabela de correções não abre caminho para pular as barreiras da
rotina (sem `--forcar`, igual ao V7 da HIS-111).

| Ameaça | Gravidade | Mitigação |
| --- | --- | --- |
| … | … | … |

## Plano de testes

_(qa)_ Teste de unidade da barreira (critério 4) com uma ligação plantada; e2e da casa salva (critério 5); conferência
dos publicados (critério 6).

## Perguntas abertas

- [ ] `[para: dominio-energia]` Os três casos são erro do IndQual da ANEEL? Qual é a lista completa (critérios 1 e 2)?
  Bloqueia o desenho técnico.
- [ ] `[para: backend]` Qual é a lista de UFs de cada distribuidora que a barreira do critério 4 vai usar (área de
  concessão ou permissão), e de onde ela vem? Bloqueia a etapa 4.

## Conversa da equipe

### [scrum-master] 2026-10-30 — história criada no backlog (Sprint 2 proposta)
- O que fiz: abri a história a partir do caso de Nova Santa Rita (PI) × `certaja`. Procurei nos `municipios/*.json` e
  achei o mesmo padrão em Triunfo (PB) × `certaja` e Soledade (PB) × `coprel`. A rotina liga pelo `CodMunicipio`.
- Decisões e porquê: vai para o backlog, primeira da Sprint 2. É número errado (~18% menor), mas numa cidade, e a
  família costuma escolher a distribuidora da conta dela. Entra depois da HIS-111 porque mexe na mesma rotina.
- Para o próximo: **dominio-energia** (pergunta aberta, critérios 1 e 2) ‖ **backend** (UFs por distribuidora).
