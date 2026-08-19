# MazyOS: sistema operacional do negócio

Sua empresa roda em cima desse arquivo. Aqui ficam as regras de operação
do MazyOS. como o Claude lê o contexto, aprende com correções, mantém
tudo atualizado e cria skills novas conforme a operação evolui.

Esse arquivo é editável. Quando o `/instalar` rodar, ele complementa o
final dessa página com as regras específicas do seu negócio.

---

## Contexto do negócio

No início de toda conversa, ler os seguintes arquivos (quando existirem
e estiverem preenchidos):

1. `_memoria/empresa.md`: quem é o usuário, o que faz, como funciona o negócio
2. `_memoria/preferencias.md`: tom de voz, estilo de escrita, o que evitar
3. `_memoria/estrategia.md`: foco atual, prioridades, prazos

Usar essas informações como base pra qualquer resposta ou decisão. Ao
sugerir prioridades, formatos ou abordagens, considerar o foco atual
descrito em `estrategia.md`.

Pra qualquer tarefa visual (carrossel, post, landing page), consultar
`identidade/design-guide.md` como referência de estilo.

Não é necessário listar o que foi lido nem confirmar a leitura. Apenas
usar o contexto naturalmente.

---

## Fluxo de trabalho

Antes de executar qualquer tarefa, verificar se existe skill relevante
em `.claude/skills/`. Se encontrar, seguir as instruções da skill. Se
não encontrar, executar a tarefa normalmente.

Ao concluir uma tarefa que não tinha skill mas parece repetível (o
usuário provavelmente vai pedir de novo no futuro), perguntar:

> "Isso pode virar uma skill pra próxima vez. Quer que eu crie?"

Não perguntar pra tarefas pontuais ou perguntas simples. Só quando o
padrão de repetição for claro.

---

## Aprender com correções

Quando o usuário corrigir algo, melhorar uma resposta ou dar uma
instrução que parece permanente (frases como "na verdade é assim", "não
faça mais isso", "prefiro assim", "sempre que...", "evita...", "da
próxima vez..."), perguntar:

> "Quer que eu salve isso pra não precisar repetir?"

Se sim, identificar onde faz mais sentido salvar:

- **Sobre o negócio** (clientes, serviços, mercado) → `_memoria/empresa.md`
- **Sobre preferências e estilo** (tom de voz, formato, o que evitar) → `_memoria/preferencias.md`
- **Sobre prioridades e foco** (projetos, metas, prazos) → `_memoria/estrategia.md`
- **Regra de comportamento nessa pasta** → próprio `CLAUDE.md`

Salvar com uma linha nova clara, sem reformatar o arquivo inteiro.
Confirmar mostrando a linha adicionada.

Não perguntar se a correção for óbvia de contexto imediato (ex: "na
verdade o arquivo se chama X"). Só perguntar quando a informação tiver
valor duradouro.

---

## Manter contexto atualizado

Ao terminar uma tarefa que mudou algo relevante (cliente novo, skill
nova, mudança de foco, processo novo, ferramenta instalada, estrutura
alterada), perguntar:

> "Isso mudou algo no teu contexto. Quer que eu atualize a memória?"

Se sim, identificar o que atualizar:

- **Cliente, serviço, ferramenta, equipe** → `_memoria/empresa.md`
- **Mudança de prioridade ou foco** → `_memoria/estrategia.md`
- **Tom ou estilo** → `_memoria/preferencias.md`
- **Pasta, regra de organização, skill criada** → `CLAUDE.md`
- **Visual (cores, fontes, logo)** → `identidade/design-guide.md`

Mostrar o que vai mudar antes de salvar. Não reformatar o arquivo
inteiro, só adicionar ou editar a linha relevante.

**Quando NÃO perguntar:**
- Tarefas pontuais sem impacto no contexto (escrever um email avulso, criar um post)
- Perguntas simples ou conversas sem ação
- Mudanças já salvas pelo bloco "Aprender com correções"

**Dica:** rode `/atualizar` pra uma varredura completa quando houver dúvida.

---

## Criação de skills

Quando o usuário pedir skill nova:

1. Verificar se existe template relevante em `templates/skills/`. Se
   existir, usar como base e adaptar pro contexto
2. Perguntar se é específica desse projeto ou útil em qualquer:
   - Específica → `.claude/skills/nome-da-skill/SKILL.md` (local)
   - Universal → `~/.claude/skills/nome-da-skill/SKILL.md` (global)
3. Ler `_memoria/empresa.md` e `_memoria/preferencias.md` pra calibrar
   o conteúdo da skill ao contexto do negócio
4. Se a skill precisar de arquivos de apoio (templates, exemplos),
   criar dentro da pasta da skill
5. Seguir o fluxo da skill-creator nativa do Claude Code

---

# Miguel · Marketing Digital

> Perfil: **Freelancer**. Miguel vende tempo e talento pra clientes
> terceiros, o sistema gira em torno de captar, entregar e cobrar.

## O que é esse workspace

Operação freelancer de marketing digital do Miguel. Aqui ficam todos os
clientes, briefings, entregas e (no futuro) cobrança.

**Estrutura de pastas:**
- `_memoria/`: quem é o Miguel, como fala, foco atual
- `identidade/`: marca pessoal do Miguel aplicada nas entregas (ainda em aberto)
- `clientes/`: uma subpasta por cliente, autossuficiente (ex: `clientes/joao-barber/`)
- `marketing/`: conteúdo próprio do Miguel (Insta, LinkedIn, portfolio)
- `saidas/`: emails, documentos pontuais
- `dados/`: arquivos a analisar
- `templates/`: moldes de perfil e de skill usados pelo MazyOS
- `scripts/`: scripts de apoio do sistema
- `.claude/skills/`: as skills do MazyOS
- `propostas/`: ainda não existe. Criar na primeira proposta.

Dentro de um cliente, quando tiver agendamento, entra também
`agendamento/` (código do Apps Script e o passo a passo de instalação).

## Quem sou

Miguel, freelancer de marketing digital (sites, Meta Ads, Google Ads,
Google Meu Negócio, conteúdo de redes sociais, e sistemas simples de
agendamento). Primeiro cliente pago fechado em 19/08/2026.

## Meu serviço

- Sites
- **Agendamento online** integrado à agenda do cliente (Google Agenda +
  planilha + WhatsApp), sem mensalidade de ferramenta
- Meta Ads e Google Ads
- Google Meu Negócio
- Conteúdo/carrossel pra Instagram

Primeira referência de preço, praticada com o João Barber:
**R$ 300 de implementação e R$ 200 por mês.** Capacidade simultânea:
1 projeto enquanto o primeiro case estiver rodando.

## Clientes ativos

**João Lucas** (Instagram "João Barber"), 21 anos, barbeiro na Barbearia
Rota 020 em Sobradinho, com CNPJ próprio e atendimento a domicílio.
Primeiro cliente pago. Fechou verbalmente em 17/08/2026, viu o site em
19/08. Cobrança começa em meados de setembro.

Pasta em `clientes/joao-barber/`: `projeto.md` (tudo sobre o projeto),
`conversa-dialogo.md` (transcrição), `identidade.md`, `site/` e
`agendamento/`.

## Como trabalho

Ainda sem processo formal. Primeira vez captando e entregando pra
cliente. Vai se definindo com o case do João Lucas.

## Tom de voz

Sem exemplo real ainda. Calibrar aos poucos, sem inventar um tom fixo
(ver `_memoria/preferencias.md`).

Evitar: travessão em qualquer texto, e emoji em contexto formal.
A regra completa do travessão está em `_memoria/preferencias.md`.

## Regras do sistema

- Cliente novo → criar pasta `clientes/<Nome>/` com um **`projeto.md`**
  único, que junta briefing, escopo, plano e preço. Não espalhar em
  vários arquivos, foi o que aconteceu no João Barber e teve que ser
  consolidado depois
- Proposta enviada → `clientes/<Nome>/proposta.html` (ou pasta
  `propostas/` se ainda não fechou)
- **Cliente com marca própria** → criar `clientes/<Nome>/identidade.md`.
  Esse arquivo sobrepõe o `identidade/design-guide.md` da raiz em tudo
  que for visual daquele cliente. A raiz é a marca do Miguel, não a do
  cliente. Foi assim que o João Barber foi montado (dourado e preto,
  fonte Oswald)
- **Mídia bruta de cliente** (vídeo de celular, foto original) → guardar
  em `clientes/<Nome>/midia-original/`, fora da pasta que vai pro ar.
  Já está no `.gitignore`, porque são arquivos grandes demais pro Git.
  Na pasta do site entra só a versão comprimida

## Ferramentas conectadas

Entraram na operação em agosto/2026, por causa do case do João Barber:

- [x] **GitHub** (`github.com/CodePeixoto/ProjetosPeixoto`), onde o
      workspace vive. Privado, tem dado de cliente. O repositório do
      MazyOS original (`mazzeoia/MazyOS`) foi desconectado em 19/08, era
      de terceiro
- [x] **Netlify**, hospedagem dos sites. O Claude publica direto pela
      linha de comando com a skill `/publicar-site`: cria o projeto,
      sobe e devolve o link, sem ninguém abrir navegador. Token pessoal
      em `.claude/.netlify-token`, fora do Git
- [x] **Google Agenda + Planilhas + Apps Script**, o motor do
      agendamento. Roda de graça dentro da conta Google do cliente
- [x] **Google Meu Negócio**, perfil do cliente

Ainda fora da operação:

- [ ] Notion
- [ ] Gmail (existe na conta pessoal, não é ferramenta de trabalho)
- [ ] Stripe / cobrança
- [ ] Canva, Metricool, Firecrawl (uso esporádico, não assumir
      disponibilidade no fluxo de cliente)

*(Marcar quando de fato entrarem na operação)*
