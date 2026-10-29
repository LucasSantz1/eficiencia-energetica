# Roteiro

## Fase 1: site (feito)

- Cadastro da casa sem conta: estado, cidade, distribuidora, benefício, pessoas, cômodos (quantidade e nome), aparelhos e lâmpadas por cômodo com quantidade e tempo de uso, e conta de luz opcional.
- Acompanhamento editável, painel geral dos aparelhos, histórico de contas e leituras do relógio de luz.
- Plano de economia com simulação das dicas escolhidas.
- Tarifa e bandeira atualizadas todo dia a partir da ANEEL.
- Resumo, aparelhos por cômodo, dicas com economia em R$ e ajustes.
- Instalável no celular (manifest de PWA).

## Fase 2: publicar

1. Criar o projeto na [Vercel](https://vercel.com) apontando para este repositório.
   - Root Directory: `apps/web`
   - Framework: Next.js (detectado sozinho)
   - Cada commit da rotina de dados gera um novo deploy com as tarifas atualizadas.
2. Configurar um domínio, se quiser.

## Fase 3: conta opcional e sincronização

- "Usa antes, cria conta depois": o formato salvo no navegador (`DadosCasa` em `apps/web/src/lib/store.ts`) é o mesmo que irá para o servidor.
- Sugestão: Supabase (Postgres + login por e-mail, Google ou link mágico), com tabelas `residencias`, `comodos` e `aparelhos` e Row Level Security por usuário.
- Ao criar a conta, os dados locais são enviados uma vez e passam a sincronizar.

## Fase 4: aplicativo de celular

- Expo (React Native) em `apps/mobile`, usando o mesmo `@ee/core` (cálculos, catálogo e dicas não mudam).
- Os dados de tarifa vêm dos mesmos arquivos publicados pelo site (`/dados/tarifas.json` e `/dados/municipios/{UF}.json`).
- Os ícones usam a biblioteca Lucide, que também existe para React Native (`lucide-react-native`), com os mesmos nomes.
- Extras do app: lembrete mensal para registrar a conta e leitura da conta de luz pela câmera.

## Melhorias de cálculo a estudar

- Impostos por estado (ICMS) e PIS/COFINS por distribuidora, para estimar a conta sem precisar da conta real.
- Percentual exato do Desconto Social por distribuidora.
- Tarifa Branca para quem tem esse tipo de medição.
- Ampliar a lista de nomes comerciais das distribuidoras (`packages/core/src/distribuidoras.ts`).
