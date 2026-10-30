# Diário · Especialista em energia

Uma entrada por tarefa, da mais nova para a mais antiga. Formato:

```
## AAAA-MM-DD · HIS-NNN · resumo em uma linha
- O que fiz:
- Decisões e porquê:
- Arquivos:
- Próximos passos:
```

## 2026-10-30 · HIS-111 · linha 12 (RGE antiga → RGE): confirmada, REA sem número
- O que fiz: confirmei a linha 12 do `sucessoes.json`. Procurei o número da REA de dez/2018 (IstoÉ, Brasil Energia,
  fato relevante da RGE Sul, busca no cedoc): o site da ANEEL não abre daqui e nenhuma fonte aberta traz o número.
- Decisões e porquê: `ato` não mudou (sem fonte oficial verificável, não invento número). `desde` 2019-01-01 ok: a CPFL
  comunicou aprovação em 04/12/2018 e agrupamento em 31/12/2018 (imprensa; corrobora). Pus essa fonte na `observacao`.
  Aceito mergear sem o número, como na CERR.
- Arquivos: `packages/dados/base/sucessoes.json`, `docs/equipe/historias/HIS-111-tarifas-vencidas.md`, minha pasta.
- Próximos passos: quem tiver acesso ao cedoc/DOU acha a REA de dez/2018 e troca o `ato`.

## 2026-10-30 · HIS-111 · passo 0: CPFL Santa Cruz antiga entra, Equatorial PI é falso positivo, nomes do aviso
- O que fiz: confirmei, nas demonstrações da Cia. Jaguari, que a antiga CPFL Santa Cruz está na REA 6.723/2017.
  Acrescentei a linha 11 no `sucessoes.json`. Confirmei que a Equatorial PI é a antiga Cepisa, a mesma pessoa
  jurídica (só houve troca de controle em 2018). Achei os nomes das empresas antigas para o aviso F1.
- Decisões e porquê: endossei o D3 novo do backend (extinto só sem tarifa publicada), porque o arquivo de conjuntos
  para em 2014. Deixei a CNEE sem nome, porque "Nacional" sozinho não se entende e não achei fonte da marca. Mostrei
  que o "45" do critério 2 é falso positivo: o id `cpfl-santa-cruz` vencido é igual ao vigente.
- Arquivos: `packages/dados/base/sucessoes.json`, `docs/equipe/historias/HIS-111-tarifas-vencidas.md`, minha pasta.
- Próximos passos: o backend ajusta o `test/sucessoes.test.ts` para 11 linhas. Nova Santa Rita (PI) com `certaja`
  vai para uma história própria.

## 2026-10-29 · criação da equipe
- O que fiz: Regras em uso documentadas no contexto (consumo mínimo, Tarifa Social da Lei 15.235/2025, fator de ciclo).
- Próximos passos: ver "Pendências" em `contexto.md`.
