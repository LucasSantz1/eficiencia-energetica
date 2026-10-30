# Contexto · UX e acessibilidade

## O que eu cuido

- Fluxos e textos de todas as telas, consistência visual, acessibilidade (WCAG 2.2 AA).
- Tokens e animações em `apps/web/src/app/globals.css`; componentes de interface em `components/ui.tsx` (futuro `src/ui/`).

## Estado atual

- Telas: início, cadastro (estado em lista → cidade → distribuidora → benefício → pessoas → cômodos → cada cômodo →
  revisão → conta), acompanhamento, cômodos, plano de economia, minha casa, sobre.
- Identidade: tinta azul-marinho, verde-energia para ação/economia, amarelo-faísca para destaque, cores da etiqueta do
  INMETRO (A–E) para peso na conta. Fontes Atkinson Hyperlegible Next e Archivo (títulos da página inicial).
- Movimento: deslizar entre páginas, entrada no painel, números contando, barras crescendo; desligado com movimento reduzido.

## Decisões em vigor

- Uma decisão por tela no cadastro; sempre um caminho "não sei"; valores em R$ primeiro.
- Nada no site sobre espaços para parceiros nem sobre instituição de ensino.
- Nome acessível de botão começa pelo texto que aparece nele, na mesma ordem (WCAG 2.5.3); o que só o leitor ouve vem
  depois. Casa ilustrada da `/`: "Cômodo, NN% da conta, R$ X por mês" (HIS-002a). "Quem mais gasta": todo o texto
  visível na ordem do código e depois "por mês. É NN% da conta. Toque para ajustar." (o axe 4.14 compara palavra por
  palavra, em sequência; nada entra no meio).
- Região que rola para o lado: `role="region"` + `aria-label` curto + `tabIndex={0}` sempre, com o foco padrão
  (Painel geral: "Tabela com todos os aparelhos da casa", HIS-002a).
- Texto sobre cor de faixa da etiqueta: A e E com branco (4,72 e 5,21:1); B, C e D com tinta (5,80, 8,45 e 5,50:1).
  Nunca branco em B, C ou D (HIS-110).
- Erros e avisos (HIS-003):
  - Dado descartado usa `Aviso tom="faisca"` (status), não `alerta`.
  - Região `role="status"`/`aria-live` sempre presente e vazia antes do texto.
  - Erro de campo aparece ao sair do campo, com `aria-invalid` + `aria-describedby` + ícone + borda.
  - Nunca corrigir número escondido. Botão de continuar não fica `disabled`: mostra o erro e foca o campo.
  - Quando o elemento com foco some, o foco vai para o `h1` da tela.
  - Tela de erro foca o `h1` ao abrir.
  - Nada técnico na tela.
  - Valor raro (alerta do dominio): "Confere?" junto do campo (amarelo, sem `aria-invalid`, sem `dialog`).
    - Mostra o valor entendido e uma pista do erro.
    - Botões "Sim, está certo" e "Corrigir"; nenhum recebe o foco sozinho.
    - Salva só depois de confirmar.
  - Para o celular ou computador da pessoa, dizemos "aqui": "aparelho" é só eletrodoméstico.
- Distribuidora que muda (HIS-111, F1/F2):
  - A conta muda sem a pessoa fazer nada: avisar uma vez, na `Casca`, só na visita da troca e só sem conta de luz.
    O aviso some com "Entendi" e não guarda nada novo no aparelho.
  - O texto diz que o site usava o preço antigo. Nunca mostrar id nem sigla solta; sem nome conhecido, o texto sai
    sem o nome antigo.
  - Sem preço (`indisponivel`), a tela nunca mostra R$ 0,00. Mostra "Falta o preço da luz" e leva para a conta de luz.
    Nada de "tarifa vencida", "vigência" ou "ANEEL" na tela.

## Pendências

- HIS-111: respostas do tech-lead (nome do id antigo, `{ de, para }` durante a visita, `Aviso` sem `role` próprio) e
  do dominio-energia (nomes de EDEVP, CNEE, EEB, CFLO, CERR). Revisar as capturas do h7. R$ 0,00 nos cômodos sem preço
  e o caminho "A minha não está aqui" no cadastro: com o scrum-master.

- HIS-003: revisar as capturas de T1 a T5 quando o frontend implementar. Conferir com o dominio-energia o formato de
  `{min}` e `{max}`.
- Roteiro do teste com famílias (HIS-106), com o Scrum Master.
- HIS-002a: revisar `excecoes-axe.ts` quando o qa montar; conferir no A5 os 5 nomes da casa ilustrada, os 6 do
  "Quem mais gasta" (D-A5-1) e a região da tabela (D-A5-2).
- Contorno de foco faísca com contraste baixo (cerca de 1,6:1 no branco, 1,4:1 no fundo; WCAG 1.4.11 pede 3:1):
  proposto ao scrum-master como história própria (muda a tela do site todo).
- HIS-110: aprovar a cor nas capturas 390/1280 px (proposta: faixa D com `text-tinta`).
- Observação para depois (sem história): passar o mouse num cômodo troca a legenda `aria-live` e o leitor de tela
  anuncia sem a pessoa pedir; avaliar com o teste de famílias (HIS-106) antes de mudar.

## Orientações do responsável

_(espaço para o dono do projeto escrever orientações a este papel)_
