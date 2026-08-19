# João Barber · o projeto inteiro

> Arquivo único do cliente. Junta o que antes estava espalhado em
> `briefing.md`, `analise-conversa.md`, `plano-de-acao.md` e
> `conversa-com-joao.md`. Atualizado em 19/08/2026.
>
> Fonte bruta: `conversa-dialogo.md` (transcrição de 29 min, 17/08).
> Identidade visual: `identidade.md`. Documentação do site: `site/NOTAS.md`.
> Motor do agendamento: `agendamento/`.
>
> **Site no ar (fechado):** https://joao-barber-k7x.netlify.app

---

## 1. Quem é o cliente

João Lucas, 21 anos, barbeiro na Barbearia Rota 020 (Sobradinho, DF) com
CNPJ próprio. Atende também a domicílio. Instagram `@joao_barber._`,
336 seguidores. WhatsApp `wa.me/message/4J746DNCQC6ED1`. Amigo próximo do
Miguel. Primeiro cliente pago.

**Ele não é um barbeiro com agenda vazia.** Isso é o erro de leitura que a
gente cometeu no começo. Na conversa de 29 minutos ele não citou horário
vago uma única vez. Citou, sem ninguém perguntar:

- Quer abrir a **própria barbearia**, e ficar em Sobradinho. Voltou do
  Plano de propósito, lá gastava demais e o deslocamento não compensava
- Lugares que ele já escolheu: o shopping de Sobradinho, ou "lá pra cima"
  (quadras 14 a 17), ou o Alto da Boa Vista. Motivo: quase não tem
  barbearia com diferencial ali
- Horizonte que ele deu: 2028
- "Pra eu estar ali no Alto da Boa Vista, eu tenho que entregar um nível
  acima"

Passou pelo Plano Piloto cortando cabelo de **diplomata e de deputado**,
onde o corte difícil não era degradê, era tesoura, e o que o público
valorizava era experiência. Credencial pesada, hoje invisível.

### O diferencial que ele já pratica

Ele descreveu a rotina de atendimento em detalhe. Não é papo, é método:

1. Nunca aceita o pedido cru. Cliente pede "americano", ele pergunta alto,
   médio ou baixo, e o que quer no volume da lateral
2. Procura o que o cara **não** gosta: "tem alguma coisa no seu cabelo que
   você não curte que faça?"
3. Corrige quando o cliente está errado: "dois dedos vai ficar muita
   coisa, vamos tirar um e meio"
4. Lê se o cara quer conversar ou quer silêncio, e respeita
5. Assume o erro: "se eu errar a culpa é minha, porque a informação eu
   tenho"

Nas palavras dele: *"eu toco direto na dor do cliente, porque se eu sei a
dor dele eu sei onde eu preciso solucionar"*. Nasceu de ele odiar sentar
na cadeira, pedir um corte e receber outro.

Ele também **já faz consulta à distância**: pede foto de frente e de lado
pra planejar o corte antes. Não cobra, não divulga.

### A regra que filtra qualquer entrega

> **Se ele sair da Rota 020 amanhã, isso vai junto com ele?**

Base de clientes vai. Google no nome dele vai. Rotina de atendimento vai.
Seguidor do perfil dele vai. Post marcando a barbearia não vai.

A frase que resume o serviço pra ele: *"quando tu abrir a tua barbearia,
tu não abre do zero, abre com clientela."*

---

## 2. O que ele pediu, nas palavras dele

Fechou a conversa com **"então fecha nós aí"**. Já disse sim.

| # | Pedido | Palavra dele |
|---|---|---|
| 1 | Agendamento, organizar essa parte | "um agendamento, organizar mais essa parte" |
| 2 | Site que passe credibilidade | "também é da hora" |
| 3 | Saudação automática | mensagem no primeiro contato, depois de pegar o telefone |
| 4 | Aniversário com brinde | "você tem uma hidratação grátis, feliz aniversário" |
| 5 | Datas comemorativas | "Dia dos Pais, Páscoa, o máximo de datas que desse" |
| 6 | Recall de 15 dias | proposta do Miguel, resposta dele: "achei isso da hora" |

---

## 3. Escopo: o que é agora e o que é depois

### Agora (as quatro que importam)

**1. Agendamento pelo site.** É o coração, e tudo o mais pendura nele.
Ver a arquitetura na seção 4.

**2. Recall de 15 dias.** Lista de quem passou do prazo desde o último
corte. Ele abre uma vez por dia e chama, um por um, do número dele.

**3. Aniversário e datas comemorativas.** Aviso da semana mais textos
prontos. Brinde que custa pouco e vale muito: hidratação, sobrancelha,
acabamento. Nunca desconto no corte, porque desconto ensina o cliente a
esperar desconto.

**4. Google Meu Negócio.** Como negócio com área de atendimento, sem
endereço público. Abrir cedo, a verificação demora dias e quem grava o
vídeo é ele.

### Depois (fila, não some)

- **Ficha do cliente com preferências** (o que ele não gosta, altura,
  observações). O Miguel gostou mas decidiu que não é do momento. Vale
  muito quando ele tiver a própria barbearia com outros barbeiros, porque
  é o que faz os outros atenderem no padrão dele. **Boa parte da ficha vai
  se preencher sozinha pelo agendamento**, então quando chegar a hora vai
  faltar pouco
- **Site reformulado**: Sobre com a história real (o barbeiro que odiava
  pedir um corte e receber outro, mais o Plano Piloto), seção "como
  funciona o atendimento" com as perguntas dele, e seção "consulta por
  foto". Detalhes em `site/NOTAS.md`
- **Conteúdo pro Instagram.** A transcrição já tem uns dez temas na voz
  dele: por que eu pergunto antes de cortar, "dois dedos" é mais do que
  você imagina, low fade e a diferença entre sério e molecão
- **Mapa da concorrência de Sobradinho** (shopping, quadras 14 a 17, Alto
  da Boa Vista) com preço, nota no Google, seguidores e estrutura. Ele
  está decidindo onde abrir no achismo. Custa um sábado e é a decisão de
  maior impacto financeiro da vida dele nos próximos três anos
- **WhatsApp Business completo** (etiquetas, catálogo, respostas rápidas).
  Entra só o que serve ao fluxo do agendamento, ver seção 4

---

## 4. Arquitetura: as quatro camadas

Desenho definido pelo Miguel em 19/08 e lapidado aqui. A regra que guiou:
**não construir nada que já exista de graça, e manter tudo dentro da conta
Google do João**, pra passar no filtro do "vai junto com ele".

```
CAMADA 1  Site publico (Netlify, estatico)
          quem ele e, o que faz, onde trabalha, prova social, botao Agendar
                    |
CAMADA 2  Agendamento (Horarios de agendamento do Google Agenda)
          horarios reais que ele definiu, cai na agenda dele,
          confirmacao automatica por email
                    |
CAMADA 3  Base + painel (Google Sheets alimentado por Apps Script)
          le a agenda dele, monta a lista de clientes,
          acende quem passou de 15 dias, avisa aniversario da semana
                    |
CAMADA 4  WhatsApp (manual, com texto pronto)
          ele chama, um a um, do numero dele
```

### Camada 2: horários reais, sem construir nada

O Miguel perguntou se dá pra mostrar os horários disponíveis de verdade.
Dá, e é mais fácil do que parece, **porque a gente não constrói isso**.

Os **Horários de agendamento do Google Agenda** já fazem: o João marca
quais dias e faixas ele atende, o Google gera uma página pública, o
cliente escolhe um horário que existe, o evento entra na agenda dele e o
cliente recebe confirmação sozinho. Grátis na conta comum, e a página
pode ser embutida dentro do site.

O erro seria escrever um sistema de agenda do zero. Isso é banco de dados,
servidor, conflito de horário, fuso, cancelamento. Custa dinheiro e
manutenção pra sempre, e entrega o que o Google entrega de graça.

Plano B, se a página do Google apertar (poucos campos personalizados, ou
precisar de webhook): **Cal.com**, grátis, conecta na mesma agenda do
Google, permite perguntas extras e cores da marca.

### Camada 3: o painel, no lugar da planilha crua

O Miguel preferiu algo no site em vez de planilha, onde ele marque "esse
cortou tal dia" e o sistema diga quem chamar. É o desenho certo, e a
planilha não desaparece, ela vira o banco de dados por trás.

- O **Apps Script** (grátis, dentro da conta Google dele) lê a agenda e
  escreve na planilha. A base se preenche sozinha a cada agendamento
- Uma **página escondida do site**, com a cara da marca dele, mostra três
  listas: quem chamar hoje, aniversários da semana, e os próximos
  agendados. Com botão de marcar atendimento feito
- Abre no celular, sem instalar nada

Fica pra depois do agendamento estar rodando, porque painel sem dado é
tela vazia.

**Cuidado:** essa página tem telefone de cliente. Não pode ficar num
endereço adivinhável nem indexada no Google. Entra com chave na URL, fora
do mapa do site e com `noindex`.

### O limite que precisa estar claro: mensagem automática no WhatsApp

Confirmação automática por **email e convite de agenda**: o Google faz.

Mensagem automática **no WhatsApp**, disparada por sistema: só existe pela
API oficial do WhatsApp Business, que é paga, exige aprovação da Meta e
CNPJ verificado. As bibliotecas não oficiais que prometem isso derrubam o
número, e o número dele é a agenda inteira dele.

Então, no que a gente monta:

- Confirmação do agendamento: automática, por email
- Resposta imediata no WhatsApp: mensagem de ausência do WhatsApp
  Business, que é automática e grátis
- Recall, aniversário e datas: **texto pronto, envio manual, um a um**

Isso não é limitação do projeto, é como funciona pra todo mundo. Prometer
disparo automático no WhatsApp pro João seria promessa que quebra.

## 5. Google Meu Negócio, pra quem atende em casa

Pergunta do Miguel: isso aparece? Alguém procura isso?

**Como cadastrar:** negócio com **área de atendimento**. No cadastro, na
hora de informar endereço, marcar que não recebe cliente no local e
definir as regiões atendidas (Sobradinho e as quadras que ele cobre). O
endereço fica escondido, só a área aparece.

**O que esperar, sendo honesto:**

- Busca por "barbeiro a domicílio Sobradinho" existe, mas é **volume
  baixo**. Não é isso que vai encher a agenda
- Negócio sem endereço físico **compete pior no mapa** que barbearia com
  ponto. Não dá pra prometer primeiro lugar
- **O ganho de verdade é outro:** quando alguém ouve falar dele e procura
  "João Barber Sobradinho", ele existe, com foto, serviço, horário e
  avaliação. Hoje quem procura acha a Rota 020
- **As avaliações são o ativo.** Nota no Google é a prova social que o
  Instagram não dá, e ela **vai junto quando ele abrir a barbearia dele**.
  Passa a regra do filtro com folga
- É grátis e aparece também quando ele for indicado

**Conclusão:** vale fazer, e vale fazer cedo por causa da verificação,
mas posicionado como **reputação e credibilidade**, não como canal de
aquisição. Prometer clientes vindos do Google seria promessa furada.

---

## 6. Preço: fechado

**R$ 300 de implementação e R$ 200 por mês.** Oferecido pelo Miguel e
aceito pelo João ("falou que estava tranquilo").

Está fechado e não se reabre. Mudar preço depois de um sim é o jeito mais
rápido de transformar cliente em desconfiado.

Observações pro Miguel, não pra ele:

- R$ 200 por mês é o piso saudável. Cobre o trabalho, não vira esmola, e
  cabe num barbeiro empregado de 21 anos
- **Ele pagar é melhor que não pagar.** Cliente que paga responde
  mensagem, manda foto e aparece na reunião. Cliente de graça some
- Revisar em 90 dias, com resultado na mesa. Anúncio pago ou conteúdo
  recorrente entram como valor novo, não como bondade
- Não misturar corte com pagamento. Ele corta o cabelo do Miguel porque
  são amigos. Se virar moeda, o serviço vira favor
- **O gargalo comercial do Miguel foi vencido aqui.** Ele falou um número
  em voz alta e ouviu sim. Isso vale registrar

---

## 7. O que ainda falta saber

A conversa foi ótima em estratégia e não tocou em número nenhum. Sem isso
não existe "antes e depois" e o case vira favor:

- [ ] Quantos horários ele atende por dia e quantos enchem
- [ ] Quantos clientes fixos tem hoje
- [ ] Preço de corte, barba, combo, e quanto a mais no domicílio
- [ ] Quais bairros ele cobre a domicílio
- [ ] Dias e horários na Rota 020 e no domicílio
- [ ] De onde vêm os clientes novos hoje
- [ ] Fotos e vídeo reais dele trabalhando (o site ainda usa material de
      terceiros e não pode ir pro ar assim)

---

## 8. Riscos

- **Ele é empregado da Rota 020.** Tudo se ancora no domicílio e na marca
  pessoal, nunca em competição com a barbearia. Se ele hesitar em algum
  ponto, recuar sem discutir
- **Disparo em massa derruba o número dele.** Recall é manual, um a um, do
  número dele. Não é negociável, e o número dele é a agenda inteira
- **Dados de cliente.** Telefone e aniversário são dados pessoais. Servem
  pra relacionamento com quem já é cliente dele, não pra lista nem repasse
- **Amigo não cobra prazo de amigo.** O jeito de o projeto morrer é ele
  sumir. Contato semanal com dia fixo, combinado em voz alta
- **Escopo aberto.** Pedido novo entra na fila do mês seguinte
- **Conflito de clientela.** Se o Miguel for prospectar outros barbeiros,
  não pode ser na mesma região do João. Atender o concorrente da esquina
  queima o primeiro cliente
