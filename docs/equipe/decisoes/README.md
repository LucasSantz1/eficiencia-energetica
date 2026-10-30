# Decisões de arquitetura (ADRs)

| ADR | Decisão | Status |
| --- | --- | --- |
| [ADR-001](ADR-001-camadas.md) | Arquitetura em camadas com dependência só para baixo; regra 4 revisada e verificador `pnpm camadas` na HIS-001 | aceito |
| [ADR-002](ADR-002-espacos-reservados.md) | Espaços reservados para parceiros, desligados | aceito |
| [ADR-003](ADR-003-qualidade-automatica.md) | Qualidade automática no CI: ESLint × script de camadas, e2e em PR e `main`, axe com exceções por elemento, peso de JS com referência, CI de menor poder | aceito |
| [ADR-004](ADR-004-leitura-segura-de-dados.md) | Leitura segura dos dados de fora: leitores escritos à mão no `@ee/core` (sem zod), `storage` próprio + `merge` que valida, mesmo leitor no navegador, servidor e rotina | proposto |
| [ADR-005](ADR-005-distribuidora-que-deixa-de-existir.md) | Distribuidora que deixa de existir: tarifa vencida há mais de 6 meses não sai, sucessão só por CNPJ ou ato oficial, `substituidas` no `tarifas.json`, rotina para na dúvida | proposto |

Para uma decisão nova: copie o formato (Status, Data, Responsável, Contexto, Decisão, Alternativas, Consequências),
numere em sequência e acrescente aqui.
