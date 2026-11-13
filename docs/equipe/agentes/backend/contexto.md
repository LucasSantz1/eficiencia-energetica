# Contexto · Back-end

## O que eu cuido

- Rotina de dados `packages/dados/` e a Action `.github/workflows/atualizar-dados.yml`.
- Futuro: `supabase/` (migrações, RLS, funções), `apps/web/src/infraestrutura/` para a sincronização, Web Push.

## Estado atual

- Rotina: baixa CSVs da ANEEL com 6 tentativas e espera crescente (`csv.ts`), detecta Latin-1/UTF-8, lê tarifas B1
  vigentes, bandeiras e municípios (IndQual Município × atributos dos conjuntos), usa cópia local do IBGE, valida
  (`montar.ts`), remove duplicados por slug e só grava se a assinatura mudou (`escrever.ts`).
- Resultado atual: 114 distribuidoras e 5.561 de 5.571 municípios com distribuidora.
- O resumo da rotina sai como anotação `::notice` no job (lido pela API de check-runs).
- Ainda não há banco nem servidor próprio.
- **HIS-003a (2026-11-03, branch `his-003a-dados-quebrados`, sem push):** a1, a2, a3 e a6 feitos.
  - Core: `limites.ts` (único lugar dos limites), `entrada.ts`, `estados.ts`, `casa-salva.ts`, `arquivos-publicos.ts`
    e `leitura-segura.ts` (apoio, fora do `index.ts`). `DadosCasa` mora em `tipos.ts`.
  - Rotina: `formato.ts` (`conferirFormato`), chamado dentro do `escreverArquivos`; qualquer descarte impede a gravação,
    mesmo com `--forcar`. O `dados:exemplo` também passa por ele.
  - `atualizar-dados.yml` em dois jobs (`gerar` só leitura; `publicar` sem instalar nada, só no `main`).
- **HIS-111 (2026-10-30), h0–h5 feitos na branch `his-111-tarifas-vencidas`** (ainda não no `main`):
  - `fontes.ts` lê as fontes; `rotina.ts` monta, confere e grava (`executarAtualizacao`, testável numa pasta
    temporária); `atualizar.ts` é só a linha de comando.
  - `base/sucessoes.json` (10 linhas, com ato e fonte) e `sucessoes.ts` (leitor que lança com a linha; V9 e V10).
  - D4: tarifa vencida há mais de 6 meses sai; de 1 dia a 6 meses, aviso. V7 conta os valores da vigência.
  - D1 (mesmo CNPJ), D2 (sucessão) e D3 (regra segura) em `montar.ts`; `substituidas` no `tarifas.json`.
  - Duas barreiras: `conferirCoerencia` (V1–V4, V7–V10), que nunca passa com `--forcar`; `validar` (inclui V5 e V6),
    que passa.
  - `pnpm dados:diagnosticar` e `diagnosticar-dados.yml`: o passo 0, só leitura.
  - Core: `acharDistribuidora`, `distribuidorasDaCidade` e `trocaDeDistribuidora`.
  - `anotacoes.ts`: todo texto da ANEEL que vai para o log ou para o resumo passa por escape (R2).
  - **Passo 0 (execução 41095055344, 30/10) analisado.** O arquivo de conjuntos da ANEEL para em **2014**. Depois
    dele: D3 só para vínculo sem tarifa publicada; a sigla não liga CNPJs de raiz diferente
    (`ligacoesPelaSiglaRecusadas`); linha 11 do `sucessoes.json` (antiga CPFL SANTA CRUZ); critério 2 do diagnóstico
    sem o falso positivo do id `cpfl-santa-cruz`. Commits `8e0d990`, `2804a5c`, `cc51fcb`, `3d916ce`, `0e8167b`.
  - **Segunda execução (41130096649):** a regra da sigla recusou a RGE antiga (02016439000138, 263 cidades). Entrou
    a linha 12 no `sucessoes.json` (RGE antiga → RGE), que o dominio-energia ainda precisa confirmar. O diagnóstico
    roda de novo.
  - **Terceira execução:** a coerência reprovou a linha da RGE porque o `resumirAgentes` agrupava só pela sigla.
    Agora agrupa por sigla + CNPJ. O diagnóstico roda de novo.
- A rede do ambiente de nuvem **não alcança** `dadosabertos.aneel.gov.br` (o proxy devolve 403). Para usar os CSVs
  brutos, só pela Action ou numa máquina com acesso.

## Decisões em vigor

- Ler a ANEEL direto (a tarifas-energia-api usa só a TE e bandeiras fixas).
- A API do IBGE falha nos runners do GitHub: usar a cópia em `packages/dados/base`.
- Supabase planejado com RLS em todas as tabelas e só consultas parametrizadas.
- (HIS-003a) Na casa salva, medida confere só o limite físico (sem `inteiro` nem `casas`); contagem (quantidade, banho,
  pessoas) confere inteiro. Tela nova usa a faixa completa. Leitor sem `try/catch` próprio: o `merge` pega, sem regravar.
- (HIS-003a) Todo leitor tem a lista de campos com `listaCompleta<keyof T>()`: campo novo no tipo quebra o `typecheck`,
  e o teste de chaves reprova se o leitor não devolver o campo.
- (HIS-111, ADR-005) Mesmo CNPJ = mesma empresa: fica a vigência mais recente, e a sigla antiga (não vigente) vira
  renomeação em `substituidas`. CNPJ diferente só troca com uma linha de `base/sucessoes.json` (ato + fonte https),
  revisada pelo dominio-energia por PR. A rotina nunca escreve em `base/` (R4). Coincidência de datas só aparece como
  candidata no relatório.
- (HIS-111) Barreiras de número errado ou de contrato (V1–V4, V7–V10) não passam com `--forcar`. As de cobertura
  (V5, V6 e as de antes) passam.
- (HIS-111, depois do passo 0) D3: um vínculo só é "extinto" quando o conjunto parou antes de `ano máximo − 1`
  **e** ele não chega a nenhuma tarifa publicada. Com a regra segura, ele só sai quando a cidade tem outro vínculo que
  fica. O ano sozinho não serve: o arquivo de conjuntos para em 2014.
- (HIS-111, ADR-005 item 2) A sigla só liga um vínculo a uma tarifa quando um dos lados não tem CNPJ ou os dois têm a
  mesma raiz (8 dígitos). Nome igual com outra raiz fica sem tarifa (V5) e entra em `ligacoesPelaSiglaRecusadas`.
- (HIS-111) V4 = sucessora publicada (vigente ou dentro dos 6 meses do D4). Pergunta aberta ao tech-lead.
- (HIS-111, h8) O id publicado sai do `idDaSigla` do core (o `slug` da rotina é ele). A rotina do Actions não aceita
  `--forcar`; publicar com barreira reclamando só por PR, rodando na máquina.
- (HIS-111) Texto de fora no log do Actions: `anotacao()` para `::notice`/`::warning` e `umaLinha()` para o resto.
  O resumo do job usa `celulaMarkdown()` e `limitarResumo()`.

## Pendências

- **HIS-111:** no `main`; h8 na branch `his-111-h8` (12/11), falta o PR. O main (com o h8) já está junto na 003a
  (`7ee7448`), com o `\r` e o P8 conferidos. Perguntas abertas: Guarapuava
  (dominio-energia) e Nova Santa Rita PI (história futura, scrum-master).
- Para a a6 da HIS-003 (fora da HIS-111): o passo "Publicar resumo" do `atualizar-dados.yml` põe as últimas 120
  linhas numa anotação, e isso escapa de novo as linhas `::notice` da rotina. É só aparência; quem reescrever o
  workflow pode tirar essas linhas do resumo.
- HIS-003a: rebase sobre a HIS-111 quando ela entrar. Conflito só nos imports da `tarifas.ts`; depois, ler
  `substituidas` no `lerArquivoTarifas` pelo contrato P8 da 111 (o `typecheck` vai exigir) e rodar os testes da rotina
  da 111, que passam a gravar pelo `conferirFormato`.

- HIS-205 (mais nomes comerciais de distribuidoras) e HIS-202 (impostos) com o especialista em energia.
- Épico E4 (Supabase) a partir da Sprint 6.

## Orientações do responsável

_(espaço para o dono do projeto escrever orientações a este papel)_
