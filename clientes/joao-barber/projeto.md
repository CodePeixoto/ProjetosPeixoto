# João Barber · o projeto inteiro

> Arquivo único do cliente: briefing, escopo, plano, preço e riscos.
> Atualizado em 30/08/2026.
>
> Fonte bruta: `conversa-dialogo.md` (transcrição de 29 min, 17/08).
> Identidade visual: `identidade.md`. Site: `NOTAS-SITE.md`.
> Motor do agendamento: `agendamento/` (`INDICE.md` tem todo campo que
> entra e sai, `CLASP.md` tem como publicar, `RELACIONAMENTO.md` tem a
> camada 3).

---

## Estado em 30/08/2026: parte técnica fechada

**Site, agendamento, cancelamento e camada 3 de relacionamento funcionam
de ponta a ponta.** O que falta não é código: é conteúdo e informação do
João, mais o Google Meu Negócio.

| Peça | Onde | Estado |
|---|---|---|
| Site | `joao-barber-aqz.netlify.app` | No ar, **escondido** (`noindex` + `robots.txt` + senha da Netlify), porque a mídia ainda é de terceiros |
| Motor | Apps Script na conta `joaobarber.agenda@gmail.com` | v2 + camada 3 publicada (versão 4+), URL `/exec` fixa |
| Planilha | 7 abas: Config, Serviços, Expediente, Agendamentos, Clientes, Mensagens, Datas | Montada pela função `montarPlanilha` |
| Agenda | Google Agenda da mesma conta | Recebe os eventos |
| Gatilhos | `resumoSemanal` (semanal), `confirmacoesDoDia` (diário) | Instalados por `instalarGatilhos` |

### O que a camada 3 trouxe (30/08)

Detalhe em `agendamento/RELACIONAMENTO.md`. Recall, aniversário, datas
comemorativas e confirmação do dia seguinte: dois gatilhos de tempo
mandam email pro João com link de WhatsApp pronto por pessoa. Nada
dispara mensagem sozinho, ele envia um a um do número dele. Textos na aba
`Mensagens`, calendário na aba `Datas`. **Janela de agenda encurtada de
21 pra 14 dias** a pedido do Miguel. Testado rodando as duas funções na
mão e conferindo o email.

### O que o v2 trouxe (29/08)

1. **A planilha virou o painel.** Serviços, expediente e regras saíram do
   código pras abas Config, Serviços e Expediente. O João edita a
   planilha e vale em até 2 minutos, sem publicar nada. Acabou a cópia
   dupla entre site e script
2. **A aba Clientes se preenche sozinha**: uma linha por pessoa, que
   atualiza a cada visita (nome, aniversário, primeira vez, última
   visita, nº de visitas, observações que acumulam). É a "ficha do
   cliente" começando a existir, sem inchar a planilha. Casa pelo
   telefone normalizado (DDD + 8 últimos dígitos), então o mesmo cliente
   digitando o número de jeitos diferentes não vira duas linhas
3. **Confirmação obrigatória**: ao confirmar, o site abre o WhatsApp do
   João já escrito, sem botão opcional
4. **Cancelamento pelo site**: cada marcação gera um código de 4 letras.
   O cliente desmarca sozinho até X horas antes (parâmetro na Config).
   Apaga o evento, marca a linha como Cancelado (não apaga, é dado) e
   avisa o João
5. **Publicar o motor virou um comando**: `./publicar-motor.ps1 -Nota
   "..."` na pasta `agendamento/`, via clasp, sem abrir o editor

### Testado contra o endpoint real

29/08 (v2): config lida da planilha, dias e horários batendo com a aba
Expediente, domicílio com menos horários que a barbearia, chave errada
recusada, marcações com código, horário sumindo ao marcar e voltando ao
cancelar, código inexistente e cancelamento repetido recusados, dedup de
cliente exercitada.

30/08 (camada 3): `resumoSemanal` e `confirmacoesDoDia` rodados na mão,
email chegou certo. Bug corrigido no caminho: o campo Hora vinha da
planilha como data (o Google converte "09:00" em valor de hora) e
quebrava o link de WhatsApp; o motor passou a normalizar com `hhmm()`.
Dia da semana nos emails forçado pra português (`diaSemanaPt`), porque o
`EEEE` do `formatDate` sai no idioma da conta.

### O que trava o projeto

**Tudo o que falta depende do João, ou é o Google Meu Negócio.** Não
sobrou trabalho técnico.

- **O número de WhatsApp dele.** Passou `61 8160-7166`, um dígito a menos
  que o padrão. Está `5561981607166` na aba Config, **a confirmar**. É o
  mais urgente: a confirmação virou obrigatória e com o número errado
  ela não abre
- **Lista de contatos antigos** na aba Clientes (WhatsApp, Nome,
  Aniversário, Última visita). Sem ela o recall e o aniversário da
  camada 3 ficam vazios, só pegam quem marcar daqui pra frente
- **Mídia real** (fotos, vídeo, retrato, logo JB): é o que trava tirar o
  `noindex` e divulgar o site
- **Dados reais** de serviço, expediente, preço, bairros e deslocamento.
  Agora se corrige na planilha, não no código
- **Números da linha de base** (seção 7)
- **Google Meu Negócio**: cadastro dá pra começar já, verificação precisa
  do vídeo do João
- **Mensagem de ausência do WhatsApp Business**: config no app, telefone
  do João

### Pendências pequenas do Miguel

Fechadas em 30/08: dados de teste apagados (Agendamentos e Clientes),
aba `Agendamentos (v1)` removida, célula "Antecedência mínima" da Config
corrigida pra `2`, gatilhos da camada 3 instalados, idioma da conta
`joaobarber.agenda` trocado pra português.

Abertas:

- Apagar o "Projeto sem título" vazio em script.google.com (o clasp não
  tem permissão de Drive pra isso)
- Repetir `setx NETLIFY_AUTH_TOKEN` e `clasp login` no PC quando for
  mexer por lá
- O token antigo da Netlify (`Hospedagem de sites de cliente`, criado
  19/08) **expira em 18/09/2026**: renomear ou revogar

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
Ver a arquitetura na seção 4. **Tela pronta em 20/08/2026**, rodando com
dados provisórios até o João confirmar serviços, durações e expediente.

**2. Recall de 15 dias.** Lista de quem passou do prazo desde o último
corte. **Construído em 30/08/2026** (`agendamento/RELACIONAMENTO.md`):
gatilho semanal no motor monta a lista e manda por email pro João com
link de WhatsApp pronto por pessoa. Ele envia um por um, do número dele.
Pendente só a base de clientes antiga (a nova se preenche sozinha).

**3. Aniversário e datas comemorativas.** Entram na mesma lista da semana
do item 2: aniversariantes dos próximos 7 dias e a data comemorativa da
semana (aba `Datas`), com textos prontos na aba `Mensagens`. Brinde que
custa pouco e vale muito: hidratação, sobrancelha, acabamento. Nunca
desconto no corte, porque desconto ensina o cliente a esperar desconto.

**Confirmação do dia seguinte** entrou junto: todo fim de tarde o motor
lista quem tem horário amanhã pro João confirmar.

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
  foto". Detalhes em `NOTAS-SITE.md`
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
CAMADA 2  Agendamento (tela no proprio site + Apps Script)
          horarios reais que ele definiu, cai na agenda dele,
          e devolve a conversa ja escrita no WhatsApp
                    |
CAMADA 3  Base + painel (Google Sheets alimentado por Apps Script)
          le a agenda dele, monta a lista de clientes,
          acende quem passou de 15 dias, avisa aniversario da semana
                    |
CAMADA 4  WhatsApp (manual, com texto pronto)
          ele chama, um a um, do numero dele
```

### Camada 2: horários reais, na cara da marca dele

> **Correção de rota, registrada em 21/08.** Esta seção dizia, até aqui,
> que a camada 2 seriam os "Horários de agendamento" do Google Agenda,
> embutidos no site. O que foi construído em 19 e 20/08 é diferente:
> **tela própria dentro do site, conversando com um Apps Script** que roda
> na conta Google dele. O documento estava atrás do código.

O princípio de não escrever um sistema de agenda do zero continua valendo,
e continua sendo respeitado: **não tem servidor, não tem banco de dados,
não tem mensalidade.** Quem guarda o horário é a Agenda do João, quem
guarda o histórico é a Planilha, e quem costura os dois é um script de 300
linhas dentro da conta dele. Custo zero.

O que a página pronta do Google não entregava, e pesou na decisão:

- **A planilha.** A camada 3 (recall de 15 dias, aniversário) precisa de
  uma base que se preencha sozinha. O Apps Script grava a linha no mesmo
  movimento em que cria o evento. Com a página do Google, ia ser preciso
  escrever um script assim mesmo, só que depois e por fora
- **Tempo de deslocamento.** Domicílio ocupa a duração do serviço mais o
  trajeto. Isso é regra por serviço e por local, e a conta Google gratuita
  é limitada em página de agendamento
- **A marca.** A pessoa não sai do site nem cai numa tela do Google. É
  preto e dourado do começo ao fim
- **O fim do fluxo é o WhatsApp dele.** Confirmou, abre a conversa com a
  mensagem já escrita. É onde ele fecha e onde ele é bom

Plano B, se o Apps Script apertar: **Cal.com**, grátis, conecta na mesma
agenda do Google, permite perguntas extras e cores da marca. E a página do
Google segue existindo como plano C, para o caso de tudo dar errado.

### Camada 3: a lista da semana por email

**Construída em 30/08/2026.** Detalhe técnico em
`agendamento/RELACIONAMENTO.md`.

O desenho mudou do plano original. Era pra ser uma página escondida do
site com listas ("quem chamar hoje", "aniversários", "próximos") e botão
de marcar atendimento feito. Virou mais simples e sem página nova:

- O **Apps Script** (grátis, na conta do João) já lê a agenda e escreve
  na aba `Clientes`, que se preenche sozinha a cada agendamento
- **Dois gatilhos de tempo** no mesmo motor:
  - `resumoSemanal`: uma vez por semana, email com aniversariantes,
    recall (15 a 60 dias sem cortar e sem horário marcado), data
    comemorativa da semana e a agenda dos próximos 7 dias
  - `confirmacoesDoDia`: todo fim de tarde, email com quem tem horário
    amanhã pra confirmar
- Cada pessoa vem com um **link `wa.me` pronto**: o João toca, o WhatsApp
  abre na conversa com o texto escrito, ele envia. Um por um, do número
  dele
- Textos e datas moram nas abas `Mensagens` e `Datas`, o João edita sem
  tocar em código

Por que email e não página: não tem telefone de cliente exposto em URL
nenhuma (o risco que a página escondida trazia), não tem tela nova pra
manter, e o email já é o canal que ele abre no celular. A página com
botão "atendimento feito" fica na fila de "depois", se a lista por email
não bastar.

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

O caminho pra um dia ter disparo oficial (API da Meta, número dedicado,
templates aprovados, custo, e quando passa a valer a pena) está mapeado
em `agendamento/RELACIONAMENTO.md`. Hoje não vale: o envio manual com
texto pronto entrega quase o mesmo com zero risco pro número dele.

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
não existe "antes e depois" e o case vira favor.

**É a lista de perguntas da próxima conversa com ele.** Desde o v2, quase
tudo aqui se resolve **editando a planilha**, sem tocar em código nem
republicar nada — a coluna diz onde cada resposta entra.

| O que perguntar | Onde a resposta entra |
|---|---|
| **O número de WhatsApp dele em dígitos**, com 55 e DDD (o link curto do perfil não aceita texto pronto). Ele passou `61 8160-7166`, que tem um dígito a menos: **confirmar** | aba Config |
| Dias e horários na Rota 020 e no domicílio | aba Expediente |
| Duração real de cada serviço, e se falta algum (hoje o chute é corte 40, barba 30, combo 70, acabamento 20, sobrancelha 15) | aba Serviços |
| Quanto tempo reservar de deslocamento no domicílio (hoje 45 min) | Config, "Extra domicílio" |
| Um email dele pra receber aviso de marcação e cancelamento | Config, "Email de aviso" |
| Preço de corte, barba, combo, e quanto a mais no domicílio | fica fora do site de propósito (seção 3) |
| Quais bairros ele cobre a domicílio | texto do site |
| Fotos e vídeo reais dele trabalhando, e retrato pra seção Sobre | `site/img/` e `site/video/` |
| Logo JB em PNG com fundo transparente, ou SVG | `site/` |

Os que **não** são configuração, e servem pra medir o case:

- [ ] Quantos horários ele atende por dia e quantos enchem
- [ ] Quantos clientes fixos tem hoje
- [ ] De onde vêm os clientes novos hoje

Esses três param de precisar de pergunta com o tempo: a aba Clientes e o
campo "como me achou" respondem sozinhos conforme o agendamento roda.

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
