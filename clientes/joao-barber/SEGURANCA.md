# Segurança e privacidade do João Barber

> Auditoria feita em 31/08/2026, depois de o Miguel perguntar se havia
> restrição jurídica no site. A pergunta abriu uma revisão maior: o
> agendamento coleta dado de gente e mexe na agenda de um negócio real,
> então valia olhar o sistema inteiro, não só o texto legal.
>
> Este arquivo é a fonte sobre o assunto. O que for código está no
> `agendamento/apps-script.gs` e no `site/index.html`; o que for
> obrigação do Miguel ou do João está aqui na lista do fim.
>
> **Aviso:** nada aqui é parecer jurídico. É trabalho técnico com base
> na LGPD, no Código Civil e no material da ANPD. Pro porte do João
> resolve, mas quem assina responsabilidade legal é advogado.

---

## 1. O resumo em cinco linhas

O site não tinha nenhuma falha que vazasse dado de cliente pra fora. O
que ele tinha era o contrário: **falta de porteiro na entrada.** Qualquer
pessoa conseguia mandar dado direto pro motor sem passar pela tela, e o
motor aceitava. Isso permitia encher a agenda de horário falso e,
principalmente, desmarcar horário dos outros chutando código de 4 letras.
Tudo isso foi fechado. O que sobrou depende de informação do João e de
uma decisão do Miguel, não de código.

---

## 2. As falhas encontradas, e o que foi feito

Ordem por risco real, do pior pro menor.

### 2.1 Desmarcar chutando código  ·  risco alto  ·  CORRIGIDO

**O que era.** Pra desmarcar, bastava acertar 4 letras. São 32 letras
possíveis em 4 posições, pouco mais de um milhão de combinações, e nada
limitava quantas tentativas cabiam por minuto. Um script simples ia
derrubando horário de cliente até acertar, e o João só descobriria pelo
email de cancelamento, um por um, depois do estrago.

**O que foi feito.** O site passou a pedir o código **e os 4 últimos
dígitos do WhatsApp** usado na marcação. Quem chuta agora precisa acertar
as duas coisas juntas. Além disso, 8 tentativas erradas em 15 minutos
travam a função inteira e a pessoa cai no WhatsApp do João.

Detalhe que importa: a resposta é **igual** pra código que não existe e
pra código certo com telefone errado. Se fosse diferente, a tela viraria
uma máquina de descobrir quais códigos existem.

### 2.2 O motor aceitava qualquer horário  ·  risco alto  ·  CORRIGIDO

**O que era.** O motor confiava no instante que chegava no POST. Ele
conferia só se a agenda estava livre naquele intervalo. Ou seja: dava pra
marcar 3 da manhã de domingo, marcar numa data que não existe, marcar
daqui a dois anos, ou marcar num minuto quebrado que não encaixa na
grade. A tela do site nunca ofereceria isso, mas quem chama o motor
direto não passa pela tela.

**O que foi feito.** Antes de gravar, o motor confere se aquele horário
está na lista que ele mesmo ofereceria pra aquele serviço, local e dia.
Isso cobre expediente, antecedência mínima e encaixe na grade de uma vez
só. A janela de 14 dias virou uma checagem à parte.

### 2.3 A chave do site é pública, e sempre foi  ·  risco médio  ·  MITIGADO

**O que é.** A `CHAVE` viaja dentro do HTML da página. Qualquer pessoa
que abrir o código-fonte a enxerga. Isso não tem conserto enquanto o
site for estático e o motor for aberto (`ANYONE_ANONYMOUS`): é assim que
a arquitetura funciona, e a alternativa seria um servidor próprio, que
custa dinheiro e manutenção e não passa no filtro do "vai junto com o
João quando ele abrir a barbearia dele".

**O que foi feito.** Como a chave não segura ninguém decidido, o que
segura são os freios:

- no máximo 3 marcações do mesmo número a cada 6 horas
- no máximo 12 marcações pelo site por hora, no total
- campo isca escondido no formulário: robô que preenche tudo é recusado
- corpo de requisição acima de 8 KB nem chega a ser lido

Não é blindagem, é limite de estrago. Um ataque dedicado ainda incomoda,
mas para de ser automático e barato, e o João continua com a agenda.

### 2.4 Campos sem limite nem conferência  ·  risco médio  ·  CORRIGIDO

**O que era.** Nome, endereço e observação iam direto pra planilha e pro
evento da agenda, do tamanho que viessem. Telefone entrava sem validação,
então marcação com número inventado gerava horário que o João não
conseguia confirmar.

**O que foi feito.** Nome cortado em 60 caracteres, endereço em 200,
observação em 300. Caractere de controle é removido. O telefone precisa
ser um número brasileiro plausível: 10 ou 11 dígitos, DDD válido, e
celular começando com 9. Domicílio sem endereço é recusado.

### 2.5 Código de cancelamento podia se repetir  ·  risco médio  ·  CORRIGIDO

**O que era.** O sorteio era cego. Parece improvável repetir num universo
de um milhão, mas repetição de sorteio acontece bem antes do fim da lista:
por volta da milésima marcação a chance de duas iguais já passa de 50%.
Código repetido significa desmarcar o horário da pessoa errada.

**O que foi feito.** O motor confere a coluna Código antes de devolver.

### 2.6 Mensagem de erro entregando as tripas  ·  risco baixo  ·  CORRIGIDO

**O que era.** Quando dava erro, o motor devolvia a mensagem crua da
exceção pro navegador, e ela pode citar id de planilha e nome de aba.

**O que foi feito.** O navegador recebe uma frase genérica. O detalhe vai
pro log da conta do João, onde só ele vê.

### 2.7 Texto da planilha entrando como HTML  ·  risco baixo  ·  CORRIGIDO

**O que era.** O site montava os cartões de serviço com `innerHTML`,
usando o nome e a descrição que vêm da planilha. Hoje quem edita a
planilha é o João, então o risco é pequeno. Mas é o tipo de porta que só
é lembrada depois que alguém entra por ela.

**O que foi feito.** Tudo que vem de fora agora entra como texto, nunca
como marcação. Vale pros cartões, pra linha de resumo e pro código na
tela de confirmação.

### 2.8 O site podia ser aberto dentro de um iframe  ·  risco baixo  ·  CORRIGIDO

**O que era.** Nenhum cabeçalho de segurança. Dava pra abrir o site
dentro de outra página e fingir que aquele agendamento era de outra
pessoa. E, se algum script estranho entrasse na página, nada impedia ele
de mandar os dados do formulário pra outro servidor.

**O que foi feito.** Arquivo `site/_headers`, que a Netlify aplica
sozinha. Ele bloqueia iframe, força HTTPS por um ano, desliga câmera,
microfone e localização, e a parte que mais vale: a **Content Security
Policy** diz de onde a página pode carregar coisa e, sobretudo, **pra
onde ela pode mandar dado**. Só o motor do João.

Duas pegadinhas que quase quebraram o agendamento e estão anotadas
dentro do `_headers`:

1. O Apps Script responde com um desvio pra `script.googleusercontent.com`.
   Sem esse domínio liberado, o agendamento inteiro para de funcionar.
2. O JS e o CSS moram dentro do `index.html`, sem etapa de build, então a
   política precisa de `'unsafe-inline'`. É uma concessão consciente, e o
   caminho pra tirar está na seção 6.

### 2.9 Dado de cliente guardado pra sempre  ·  LGPD  ·  CORRIGIDO

**O que era.** Nada apagava nada. Cliente que sumiu em 2026 continuaria
com nome, telefone, endereço e aniversário na planilha em 2035. A LGPD
manda apagar quando o dado deixa de servir pra finalidade que justificou
a coleta (art. 15 e 16).

**O que foi feito.** Função `limparDadosAntigos`, num gatilho mensal.
Quem não aparece há mais que "Guardar dados por" meses (24 por padrão)
perde nome, telefone, aniversário e observação. Sobra a linha anonimizada
com a contagem de visitas, que serve de estatística e não identifica
ninguém. O João recebe email dizendo o que foi limpo.

### 2.10 Sem jeito de pedir pra não receber mensagem  ·  LGPD  ·  CORRIGIDO

**O que era.** O recall e o aniversário se apoiam em legítimo interesse
(art. 7, IX). Essa base exige um jeito fácil de a pessoa se opor
(art. 18), e não existia nenhum.

**O que foi feito.** Coluna **"Não enviar"** na aba Clientes. Escreveu
qualquer coisa ali, a pessoa some do recall e do aniversário na mesma
hora. A confirmação do dia seguinte continua, porque é sobre um horário
que ela mesma marcou, não é divulgação. Os textos padrão de recall e
aniversário passaram a terminar avisando que basta pedir pra parar.

### 2.11 Nenhuma informação sobre uso de dados  ·  LGPD  ·  CORRIGIDO

**O que era.** O site coletava nome, telefone, endereço, aniversário e
observação com uma frase de uma linha. A LGPD (art. 9) pede finalidade,
prazo, compartilhamento, direitos e contato do responsável.

**O que foi feito.** Página `site/privacidade.html`, escrita em português
de gente, linkada no rodapé e dentro do próprio formulário. Ela cobre:
quem responde, o que é coletado e por quê, com que base legal, por quanto
tempo, quem mais vê (Google, Netlify, WhatsApp), transferência
internacional, os direitos do art. 18 e como exercer, o caminho da ANPD,
corte de menor de idade e foto de cliente.

Duas frases novas entraram no próprio formulário, que é onde a pessoa
está na hora de decidir: o link da política, e o aviso de que corte de
menor é marcado pelo responsável. O rótulo do aniversário passou a dizer
pra que serve ("só pra eu te dar parabéns"), porque finalidade escondida
não vale como autorização.

**Revisão de 31/08, depois de comparar com uma política grande de
verdade (a do Canva).** A comparação não serviu pra copiar estrutura,
porque o Canva descreve anúncio, cookie, IA e conta de menor, e o João
tem um formulário de seis campos. Serviu pra passar a nossa item por
item pelo art. 9. Cinco buracos apareceram, e os cinco foram fechados:

1. **Consequência de não dar o dado opcional** (art. 18, VIII). A tabela
   tinha a coluna "Obrigatório?", mas faltava dizer em texto que campo
   opcional é opcional de verdade e não muda o atendimento
2. **Registro de acesso da hospedagem.** A página dizia que não
   acompanha a navegação, o que é verdade, mas a Netlify guarda log com
   IP como qualquer hospedagem. Omitir isso é omissão
3. **Ausência de decisão automatizada** (art. 20). Não existe nenhuma no
   sistema do João, e dizer isso vale mais que ficar calado
4. **Quem responde e quem opera** (art. 9, VI). O João é o controlador,
   o Miguel é quem mexe na ferramenta. Estava implícito, agora está
   escrito
5. **O iframe do mapa.** Ele faz o navegador do visitante falar com o
   Google, e se a pessoa estiver logada numa conta Google, o Google
   reconhece por conta própria. Isso está fora do alcance do João, e
   agora está dito

### Política de cookies: não existe, de propósito

Medido com navegador de verdade, com a página inteira aberta e o mapa
carregado: **zero cookies, `localStorage` vazio, `sessionStorage`
vazio.** O site não cria nada no navegador de ninguém.

Por isso não existe página de política de cookies, e criar uma agora
seria pior que não ter: descreveria tratamento que não acontece, e
documento que promete o que não existe é problema, não proteção.

Isso muda no dia do Meta Pixel ou do Google Analytics. Ver seção 6.

---

## 3. Como isso é testado

Entrou `agendamento/teste-motor.js`. Ele roda o motor fora do Google, com
planilha, agenda, cache e email de mentira, e faz **44 verificações**,
quase todas de segurança: horário fora do expediente, data no passado,
data inválida, minuto quebrado, telefone falso, nome de uma letra, corpo
gigante, isca de robô, freio de marcação, freio de chute de código,
cancelamento com telefone errado, código repetido, vazamento de erro,
faxina de dados antigos e opt-out.

```
cd clientes/joao-barber/agendamento
node teste-motor.js
```

Regra: **mexeu no `apps-script.gs`, roda o teste antes de publicar.** Se
algum dos 44 falhar, não publica.

O site foi conferido em Chromium a 1440px e 390px: menu que acompanha a
rolagem, isca invisível, campo dos 4 dígitos, links da política, texto
com tag virando texto e nenhuma rolagem horizontal.

---

## 4. O que ainda depende de gente

Nada disso é código. É o que sobra.

### Miguel

| # | O quê | Por quê |
|---|---|---|
| 1 | Publicar o motor (`./publicar-motor.ps1`) e o site (`/publicar-site`) | enquanto não publicar, as correções acima só existem no computador |
| 2 | Rodar `montarPlanilha` uma vez | cria a linha "Guardar dados por" na Config e a coluna "Não enviar" na aba Clientes |
| 3 | Rodar `instalarGatilhos` uma vez | liga a faxina mensal de dados antigos |
| 4 | Ligar verificação em duas etapas na conta `joaobarber.agenda@gmail.com` | essa conta guarda a agenda e a lista de clientes inteira. Hoje ela está protegida só por senha, e a senha está com você. É o maior risco isolado que sobrou no sistema |
| 5 | Acordo escrito com o João sobre dados | quem é o dono dos dados (ele), quem opera (você), e o que acontece com o teu acesso quando terminar |
| 6 | Decidir o prazo de guarda | está em 24 meses. É palpite razoável, não decisão tomada |

### João Lucas

| # | O quê | Por quê |
|---|---|---|
| 1 | Nome completo e CNPJ | vão no rodapé do site e na política. Hoje estão marcados como pendência na página |
| 2 | Um email de contato pra dados | a lei exige um canal pra quem quiser pedir acesso ou exclusão. O `joaobarber.agenda@gmail.com` serve |
| 3 | Autorização de imagem de cada cliente que aparecer em foto | texto pronto na seção 5. Sem isso, publicar foto de cliente é dano moral presumido pelo STJ, mesmo sem prejuízo provado |
| 4 | Trocar a mídia de terceiro pela dele | as fotos e o vídeo de hoje não são dele. É por isso que o site está escondido |
| 5 | Ok do dono da Rota 020 | o site usa o nome, o endereço e o mapa da barbearia dele. WhatsApp basta, desde que fique registrado |
| 6 | Mensagem de ausência no WhatsApp Business | fecha o ciclo de quem manda mensagem fora do expediente |

---

## 5. Termo de autorização de imagem

Direito de imagem no Brasil é art. 5º, X da Constituição e art. 20 do
Código Civil. A Súmula 403 do STJ diz que **publicar imagem de alguém com
fim comercial sem autorização gera indenização sem precisar provar
prejuízo.** Publicar foto de corte no site ou no Instagram é uso
comercial. Deixar tirar a foto não é o mesmo que deixar publicar.

O ideal é papel assinado. Se for por WhatsApp (que é o realista aqui), o
que vale é mandar o texto abaixo e guardar a resposta de aceite. Vale
como prova, com força menor que assinatura, e é muito melhor que nada.
Para menor de idade, quem responde é o pai, a mãe ou o responsável.

**Texto pro João mandar:**

> Fala [nome]! Ficou bom demais o corte. Posso postar a foto no meu
> Instagram e no meu site pra mostrar o trabalho?
>
> É de graça e sem prazo pra acabar, mas você manda: se um dia quiser que
> eu tire do ar, é só falar que eu tiro, sem precisar explicar. Não vou
> usar pra mais nada além de divulgar meu trabalho como barbeiro, e não
> passo pra ninguém.
>
> Se puder, me responde aqui com "autorizo" que eu guardo essa mensagem.

Para menor de idade, trocar a primeira linha por:

> Fala [nome do responsável]! Posso postar a foto do corte do [nome da
> criança] no meu Instagram e no meu site pra mostrar o trabalho? Como
> ele é menor de idade, a autorização precisa ser sua.

Cobre o que um termo válido pede: finalidade determinada, canais,
gratuidade, prazo, direito de revogar e quem autoriza. O que ele não
cobre é anúncio pago com a imagem da pessoa: se um dia o João impulsionar
um post com foto de cliente, pede autorização nova, dizendo que é
anúncio.

---

## 6. O que muda quando entrar anúncio

Hoje o site **não usa cookie, não tem Google Analytics e não tem pixel de
rede social.** Por isso não precisa de aviso de cookie, e a política diz
isso com todas as letras.

Isso muda no dia em que entrar Meta Pixel ou Google Analytics pros Ads,
que está no plano. Nesse dia, três coisas passam a ser obrigatórias:

1. Aviso de cookie pedindo permissão **antes** de carregar o rastreador,
   não depois
2. A política atualizada dizendo o que cada rastreador coleta
3. A CSP do `_headers` liberando os domínios novos, senão o pixel
   simplesmente não carrega e ninguém entende por quê

Anotado aqui pra não ser descoberto no dia da pressa.

---

## 7. Melhorias possíveis que ficaram de fora

Nenhuma é urgente. Estão aqui pra não serem esquecidas.

- **Tirar o `'unsafe-inline'` da CSP.** Hoje o JS e o CSS moram dentro do
  `index.html`, o que obriga a concessão. Sai de duas formas: pondo o
  hash do script no cabeçalho (quebra toda vez que o script muda, e o
  site quebra em silêncio) ou movendo o JS pra um arquivo próprio (mexe
  na estrutura que o `CLAUDE.md` da pasta registra de propósito). Decisão
  do Miguel, não do Claude
- **Hospedar a fonte Oswald dentro do site**, em vez de puxar do Google.
  Tira um terceiro do caminho e um parágrafo da política. Custa uns
  100 KB no repositório
- **Trocar o mapa embutido por uma imagem com link.** Mesmo motivo. Perde
  o mapa arrastável
- **Sortear o código com fonte criptográfica** em vez de `Math.random()`.
  Com o telefone junto e o freio de 8 tentativas, hoje isso não é o elo
  fraco

---

## 8. O que este trabalho não cobre

Vale ser honesto sobre a fronteira:

- **Não é parecer jurídico.** A política de privacidade é um bom modelo,
  não um documento revisado por advogado
- **Não protege contra quem tem a senha.** Se a conta Google do João for
  invadida, nada aqui ajuda. É por isso que a verificação em duas etapas
  é o item 4 da lista do Miguel
- **Não impede um ataque dedicado.** Os freios encarecem e atrasam. Quem
  insistir muito ainda incomoda, e a resposta nesse caso é trocar a chave
  e republicar os dois lados
- **O teste automático roda um Apps Script de mentira.** Fuso horário,
  autorização e cota da conta só aparecem no teste de verdade, na conta
  do João
