# HIS-003 · Base de segurança e robustez

| Campo | Valor |
| --- | --- |
| Épico | E0 · Fundação |
| Sprint | 0 |
| Tamanho | M |
| Papéis principais | seguranca, frontend, tech-lead |
| Status | Preparada |
| Branch | `his-003-seguranca` |

## Problema e valor

Como **família que usa o site**, eu quero **que ele nunca mostre tela branca e que meus dados fiquem protegidos**
para **confiar no site e não perder o que cadastrei**.

Hoje o localStorage e os JSON de `/dados` são lidos sem validação. Um dado corrompido (ou alterado por extensão do
navegador) pode quebrar a tela. O site também não envia cabeçalhos de segurança e o CI não confere vulnerabilidades.

## Critérios de aceite

1. **Dado** qualquer requisição ao site, **quando** a resposta chega, **então** ela tem `Content-Security-Policy`
   (sem `unsafe-eval`; `frame-ancestors 'none'`), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`,
   `Referrer-Policy: strict-origin-when-cross-origin` e `Permissions-Policy` sem câmera/microfone/localização por enquanto.
2. **Dado** um localStorage com JSON inválido ou com campos fora do formato, **quando** o site abre, **então** ele não quebra:
   descarta só o que é inválido (ex.: um aparelho com potência negativa) e avisa a pessoa em linguagem simples quando algo for descartado.
3. **Dado** um `tarifas.json` ou `municipios/{UF}.json` fora do formato, **quando** carregado, **então** o site mostra mensagem
   amigável com "Tentar de novo", sem tela branca.
4. **Dado** um erro inesperado em qualquer página, **quando** acontece, **então** aparece a tela de erro do projeto (`error.tsx`)
   com "Tentar de novo" e "Voltar ao início", sem detalhes técnicos.
5. **Dado** os campos de entrada (nome de cômodo, potência, minutos, kWh, valor da conta), **quando** a pessoa digita,
   **então** há limites de tamanho e faixa definidos em um só lugar e testados.
6. **Dado** um push, **quando** o CI roda, **então** `pnpm audit --audit-level high` passa e o Dependabot está configurado
   para npm e GitHub Actions.
7. Existe `.env.example` (vazio por enquanto, com comentário) e `.env*` está no `.gitignore`.

## Fora do escopo

- Autenticação e banco (E4).
- Limite de taxa (não há endpoint próprio ainda).

## Desenho técnico (proposta inicial)

- `zod` 4 (versão exata) com esquemas em `infraestrutura/validacao/` — os tipos continuam vindo de `@ee/core`;
  o esquema é conferido contra o tipo com `satisfies z.ZodType<T>`.
- Validação dentro do `migrate`/`merge` do persist e no carregamento de `/dados`.
- Cabeçalhos em `next.config.ts` (`headers()`); CSP com `nonce` só se for necessário — conferir a documentação do Next 16
  em `node_modules/next/dist/docs/` sobre CSP e scripts inline.
- Limites em `packages/core/src/limites.ts` (domínio), usados pela interface e pela validação.

## Ameaças (proposta inicial do seguranca, a completar)

| Ameaça | Gravidade | Mitigação |
| --- | --- | --- |
| localStorage corrompido quebra o site (indisponibilidade para a pessoa) | alta | validação com zod + descarte parcial + tela de erro |
| JSON público alterado no deploy/CDN | média | validação ao carregar; rotina só publica dado validado |
| Injeção de script por nome de cômodo/aparelho | baixa (React escapa) | proibir `dangerouslySetInnerHTML`, limitar tamanho, CSP |
| Clickjacking | baixa | `frame-ancestors 'none'` |
| Dependência vulnerável | média | `pnpm audit` no CI, Dependabot, versões exatas |

## Perguntas abertas

- [ ] `[para: ux-acessibilidade]` Texto do aviso quando parte dos dados salvos foi descartada.
- [ ] `[para: dominio-energia]` Faixas aceitáveis: potência (W), minutos por dia, kWh da conta e valor da conta.

## Conversa da equipe

### [scrum-master] 2026-10-29 — história refinada
- O que fiz: critérios de aceite a partir da análise do código atual (leitura sem validação em `lib/store.ts` e `lib/dados.ts`).
- Para o próximo (seguranca + dominio-energia + ux-acessibilidade): completar ameaças, faixas e textos. Fazer depois da HIS-001 para os arquivos já estarem no lugar novo.
