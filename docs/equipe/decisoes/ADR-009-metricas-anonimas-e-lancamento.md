# ADR-009 · Métricas anônimas de uso, "Isto te ajudou?" e a limpeza diária do lançamento

- **Status:** proposto (2026-11-27, quem orquestra, a pedido do dono no modo turbo; a seguranca vetou a 1ª versão por A1
  e revisa as correções)
- **Data:** 2026-11-27
- **Responsável:** quem orquestra; revisão: seguranca (poder de veto)

## Contexto

O dono vai divulgar o site no começo de dezembro. Ele quer medir o uso e a satisfação desde o primeiro dia (E12) e
fechar as pendências de segurança antes do lançamento (ADR-007).

Pedidos e regras do planejamento que entram em conflito:
- A HIS-405 previa métricas "só com sim".
- O dono quer números desde o lançamento, e quase ninguém liga um "sim" de métrica.

## Decisão

1. **Contagem de uso anônima e sem pedir "sim", com saída fácil.** Decisão do dono, registrada aqui porque contraria a
   HIS-405.
   - **O que fica guardado:** só `uso_por_dia(dia, evento, quantas)`, de uma lista fixa de 15 eventos (`@ee/core`,
     `metricas.ts`, igual no banco).
   - **O que não fica:** id, cookie, IP (nem o código do IP), hora, cidade ou casa. Não dá para saber quem fez nem
     juntar dois eventos da mesma pessoa: é dado anônimo (LGPD, art. 12), não pseudonimizado.
   - **Quem não é contado:** o navegador não manda nada com GPC ou "Do Not Track" ligado, nem com "Contar o meu uso"
     desligado em Minha casa. A escolha fica fora do "Apagar tudo": apagar não pode voltar a contar quem pediu para não
     contar.
   - **Teto:** no máximo 200 mil por dia e por evento, para quem chamar sem parar.
2. **"Isto te ajudou?"**
   - **O que fica guardado:** nota de 1 a 5, momento (painel, dica, conta, comparação), dia e texto opcional de até 280
     letras. O id é aleatório (uuid), não sequencial.
   - **Conferência do texto, no core e de novo no banco:**
     - sem telefone ou e-mail;
     - sem caractere de controle, invisível ou de troca de direção;
     - sem = + - @ no começo (fórmula de planilha).
   - **Teto:** 2000 opiniões por dia.
   - **Limite de tentativas:** 10 por hora por IP (ADR-008), então um código do IP fica de 1 a 2 dias. A política diz
     isso.
   - **Retenção:** o texto some depois de 12 meses; a nota fica. A opinião não fica ligada a ninguém, então não dá para
     apagar uma: a política avisa.
   - **Na tela:** um cartão no fim da página (nunca por cima), uma vez por aparelho e por momento.
3. **Limpeza diária** (`limpeza_diaria()`, pg_cron às 03:17 de Brasília), que apaga:
   - contas não confirmadas há 7 dias;
   - sessões do Supabase com mais de 31 dias (o limite de 30 dias do site vale também lá, B4);
   - tentativas com mais de 1 dia;
   - texto das opiniões com mais de 12 meses.
4. **Registro do "concordo"** (B10):
   - o site manda a versão (`config/termos.ts`) e a data no cadastro;
   - um gatilho copia para `consentimentos`, que ninguém muda pela API.
5. **Termos de uso e Política de privacidade:**
   - escritas a partir do código: cada frase da política tem de bater com o que o código faz;
   - contato e responsável vêm de `CONTATO_EMAIL` e `RESPONSAVEL_PELO_SITE`;
   - mudou o que o site guarda ou manda: muda a política e a `VERSAO_DOS_TERMOS`.

## Alternativas

- **Vercel Web Analytics ou Plausible:** um script e um serviço a mais, e os dados fora do Brasil. Para 15 contadores, o
  Postgres que já existe basta.
- **Métrica só com "sim" (HIS-405):** respeita mais a vontade explícita, mas dá números muito baixos para o que o dono
  precisa mostrar. Como a contagem não identifica ninguém, a saída fácil (o interruptor, GPC e DNT) foi o equilíbrio
  escolhido.
- **Limite por IP também na contagem de uso** (1ª versão, vetada por A1): deixava em `tentativas` um registro da
  atividade de cada IP durante o dia.

## Consequências

- **Quem quer forjar números consegue,** chamando a rota sem parar, até o teto. Aceito: os números são indicativos, e o
  painel do E12 pode comparar as visitas com as contagens.
- **Ler as opiniões exige cuidado** no painel do E12 (HIS-1203) e em qualquer exportação: mostrar o texto só como texto
  e escapar o CSV.
- **Antes de divulgar,** é preciso preencher `CONTATO_EMAIL` e `RESPONSAVEL_PELO_SITE` na Vercel. As páginas são
  estáticas: trocar a variável pede um novo deploy.
- **Depois de rodar a migração,** conferir no banco: `select * from cron.job;`.
- **O RIPD do E12** (relatório de impacto) continua pendente para o painel com dados juntados.
