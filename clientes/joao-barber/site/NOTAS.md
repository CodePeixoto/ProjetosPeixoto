# Site do João Barber: notas

Página única (`index.html`), HTML/CSS/JS puro, sem framework e sem build.
Abre direto no navegador. Mobile-first, porque quase todo o tráfego vai
vir do link da bio do Instagram, ou seja, celular.

Layout baseado na referência que o Miguel mandou (estilo EliteCuts),
sem as partes que ele cortou: a linha de apoio acima do título, o box
de "20% OFF" e a tarja de ícones genéricos no rodapé do hero.

---

## ⚠️ A mídia atual NÃO é do João Lucas

**Trocar antes de publicar.** As fotos e o vídeo que estão no site hoje
são de uma barbearia vintage estrangeira (dá pra ver a capa da marca
"HAIR HOOD", placas de Route 66, um barbeiro tatuado de terno risca de
giz). Não é o João nem a Rota 020.

Dois motivos pra não subir assim:

1. **O público dele conhece a cara dele.** É clientela local e seguidor
   de Instagram, vão notar na hora. Um barbeiro autônomo vende
   confiança antes de vender corte
2. **Direito autoral**, é material de terceiros, usado num site
   comercial

Serve como demonstração de layout pro João ver. Pra ir pro ar, precisa
de material real dele.

---

## Como a mídia do hero funciona

Duas camadas, as duas opcionais, o código roda com uma, com as duas ou
com nenhuma. É só colocar os arquivos nas pastas; não precisa mexer no
HTML.

### Camada 1: fotos em loop (a base, aparece em tudo)

Estão em `site/img/`. O hero usa quatro, nesta ordem:

```
foto-4.jpg  →  foto-7.jpg  →  foto-6.jpg  →  foto-2.jpg
```

Passam uma a cada 5s, com transição suave e zoom lento (Ken Burns). A
primeira carrega junto com a página; as outras três só depois que a
página abriu, pra não atrasar a abertura.

**Pra trocar quais fotos aparecem:** editar as 4 linhas `hero-slide`
no `index.html` (procurar por `foto-4.jpg`). Tem 8 fotos disponíveis
na pasta, da `foto-1` à `foto-8`.

**Como devem ser as fotos:**
- Horizontal, no mínimo 1600px de largura
- Assunto **à direita** do enquadramento, a esquerda fica coberta
  pelo texto no desktop
- Abaixo de 300 KB cada (as atuais estão entre 67 e 121 KB)

### Camada 2: vídeo (entra por cima, só no desktop)

```
site/video/hero.mp4
```

Regras já implementadas no código:

- **Só carrega em tela ≥ 900px.** No celular fica só as fotos, quem
  chega pelo link do Instagram não vai gastar 4G com vídeo
- Não carrega em economia de dados nem em conexão 2G
- Não carrega pra quem pediu "menos animação" no sistema
- Sem som, em loop. Se o navegador barrar o autoplay, as fotos
  continuam rodando normalmente

**Como deve ser o vídeo:**
- 10 a 15 segundos, em loop
- **Sem áudio** (toca mudo de qualquer jeito, e sem áudio o arquivo
  fica bem menor)
- Horizontal, com o assunto à direita
- **Abaixo de 3 MB**
- Movimento calmo. Câmera tremendo ou corte rápido atrapalha a leitura
  do texto por cima

---

## Compressão: o que foi feito e como repetir

O material entregue estava inviável pra web e foi comprimido:

| | Antes | Depois |
|---|---|---|
| 8 fotos (PNG) | 11 MB | **688 KB** (JPG, 1920px, qualidade 74) |
| Vídeo (4K 60fps HEVC, 30s) | **162 MB** | **1,05 MB** (720p 30fps H.264, 15s, sem áudio) |

Os arquivos originais foram movidos pra `clientes/joao-barber/midia-original/`.
Estão preservados, mas fora da pasta do site (senão os 166 MB iam
junto pro ar e pro Git; a pasta está no `.gitignore`).

**Regra pro futuro:** vídeo de celular moderno grava em 4K 60fps e gera
40+ MB por minuto. Nunca subir direto. Ferramentas grátis pra comprimir:
- Vídeo: [handbrake.fr](https://handbrake.fr), preset "Web > Gmail Medium 5 Minutes 480p30" já resolve
- Fotos: [squoosh.app](https://squoosh.app) ou [tinypng.com](https://tinypng.com)

### De onde tirar o material real

O João tem 67 posts e vários reels no Instagram. Pedir os **arquivos
originais** pra ele (o que baixa do Instagram vem recomprimido e fica
ruim). Se não tiver, vale gravar material novo no celular durante um
atendimento, 2 minutos de vídeo dão o suficiente pra tirar o loop e
várias fotos.

## Outros pendentes: confirmar com o João Lucas

Marcados com `<!-- PLACEHOLDER -->` no código:

1. **Dias e horários** que ele atende na Rota 020 (hoje só diz
   "durante a semana")
2. **Quais bairros** ele cobre a domicílio (hoje "Sobradinho e região")
3. **Logo**, está usando wordmark em texto ("João**Barber**" +
   "Sobradinho · DF"). Trocar pelo brasão JB quando o arquivo chegar
   (pedir em PNG com fundo transparente, ou SVG)
4. **Serviços**, confirmados por ele: corte, barba, combos,
   acabamento/pezinho (sobrancelha). Confirmar se falta algo
   (platinado, pigmentação, barboterapia)
5. **Preços**, de propósito fora do site. Sem valor publicado, o
   cliente é obrigado a chamar no WhatsApp, e aí ele fecha na conversa

## Dados já confirmados

- WhatsApp: `https://wa.me/message/4J746DNCQC6ED1`
- Instagram: `@joao_barber._`
- Barbearia Rota 020: QD 08 BL 19, Sobradinho, DF (do perfil
  @barbeariarotaa020)

## Ideia pra depois

Uma seção de **galeria** com fotos dos cortes dele seria forte, é o
que mais convence em barbearia. Não foi feita porque ainda não temos
as fotos em boa resolução. Pedir um punhado das melhores pro João.

## Publicar

**Não está no ar.** Foi publicado em 19/08/2026 pra testar o fluxo, em
`joao-barber-k7x.netlify.app`, e o projeto foi apagado no mesmo dia a
pedido do Miguel. O endereço não existe mais.

Publicar de novo é só pedir (`/publicar-site`): o Claude cria o projeto e
devolve o link. Como o projeto anterior foi apagado, **o endereço novo
provavelmente será diferente**. A partir da próxima vez, o id fica salvo
em `clientes/joao-barber/.netlify-site-id` e aí o link passa a ser fixo.

Quando for publicar pra valer, três travas precisam sair juntas:
proteção de visitante (no painel da Netlify, em Site configuration →
Access & security), o `robots.txt` e a meta `noindex` do `index.html`.
Só depois que a mídia real do João estiver no lugar.

Domínio próprio (ex: `joaobarber.com.br`) fica pra quando ele aprovar, e
registrado no CPF dele, não no do Miguel.

## Próximo passo sugerido (fora do site)

Um site sozinho não traz cliente. O que faz ele aparecer pra quem
procura "barbeiro em Sobradinho" no Google é o **Google Meu Negócio**.
É grátis e provavelmente traz mais retorno que o site nesse momento.
Vale propor junto.

---

## Reescrita do conteúdo (definida em 19/08/2026)

Depois da conversa gravada (`../conversa-dialogo.md`), ficou claro que o
site está bonito e falando a coisa errada. Ele foi escrito antes de a
gente saber quem o João é. O que muda:

### Seção Sobre: a história real

Hoje é texto genérico de barbearia. Tem que virar a história dele, que é
específica e vende sozinha:

- Ele passou pelo **Plano Piloto cortando cabelo de diplomata e de
  deputado**, onde o corte difícil não era degradê, era tesoura. Isso é
  credencial forte e não está escrito em lugar nenhum
- Ele **odiava sentar na cadeira, pedir um corte e receber outro**. Por
  isso pergunta tudo antes. Essa é a origem do método dele
- Voltou pra Sobradinho de propósito, é daqui

### Seção nova: como funciona o atendimento

O diferencial dele virando página. São as perguntas que ele faz antes de
ligar a máquina, e nas palavras dele:

1. "O que você pretende fazer no cabelo hoje?"
2. "Americano mais curto, mais alto ou médio? Lateral mais volumosa,
   quadrada ou arredondada?"
3. "Tem alguma coisa no seu cabelo que você não curte que faça?"
4. "Tem algum ponto que fica mais volumoso quando corta?"

Mais a política dele sobre altura: se o cliente pede dois dedos e vai
ficar curto demais, ele avisa antes e propõe um e meio.

É essa seção que faz alguém escolher ele sem nunca ter cortado com ele.

### Seção nova: consulta por foto

Ele já faz e não divulga. O cliente manda uma foto de frente e uma de
lado, ele planeja o corte antes do horário. Vira porta de entrada pra
cliente novo e reforça tudo que está na seção acima.

### O que continua valendo

Preço fora do site (obriga a chamar no WhatsApp, e é lá que ele fecha),
identidade dourado e preto, mobile-first, CTA pro WhatsApp em vários
pontos.

### Ordem

O site é a **semana 4** do plano. Não adianta reescrever antes de ter a
foto e o vídeo reais dele, que é o que trava a publicação.

---

## Publicar

Agora existe skill pra isso: `/publicar-site`. Sobe a pasta `site/` pro
Netlify e devolve link público de graça, no mesmo endereço toda vez que
atualizar. O passo do Netlify Drop manual descrito acima virou plano B.

---

## Agendamento pelo site (feito em 20/08/2026)

A seção `#agendar` fica entre a de domicílio e a de contato. É o pedido
número 1 do João ("um agendamento, organizar mais essa parte") e o buraco
que existia no meio do projeto: o motor estava escrito em
`../agendamento/apps-script.gs` e não tinha tela nenhuma pra falar com ele.

### Dois modos, um código só

Tudo é decidido pelo bloco `AGENDA`, no começo do script de agendamento
(procurar por `var AGENDA` no `index.html`):

```js
var AGENDA = {
  URL:      '',   // URL do app da Web do Apps Script, termina em /exec
  CHAVE:    '',   // a mesma CHAVE do apps-script.gs
  WHATSAPP: ''    // número do João, só dígitos, com 55 e DDD
};
```

- **Com `URL` e `CHAVE` vazias** (é o estado de hoje): modo demonstração.
  Os horários são calculados no próprio navegador e **nada é gravado em
  lugar nenhum**. Um aviso em dourado explica isso na tela, e a
  confirmação repete. Serve pra mostrar a tela funcionando pro João antes
  de existir conta Google
- **Com as duas preenchidas:** quem responde é o Apps Script na conta do
  João. Ele lê a agenda de verdade, cria o evento e grava a linha na
  planilha. O passo a passo está em `../agendamento/INSTALAR.md`

Trocar de um modo pro outro é só preencher os dois campos. Nada mais muda.

### O fluxo

Serviço, depois local, depois dia e horário, depois nome e WhatsApp.
Confirmação com resumo e botão que abre a conversa com a mensagem pronta.

Detalhes que valem lembrar:

- **Domicílio** abre campo de endereço e soma `DOMICILIO_EXTRA_MIN` de
  deslocamento, então oferece menos horários que a barbearia. É proposital
- **Aniversário** é opcional, e é o campo que alimenta o brinde de
  aniversário mais pra frente
- **"Como você me achou"** responde sozinho, com o tempo, uma das
  perguntas em aberto do `projeto.md`: de onde vêm os clientes novos
- Sem JavaScript a seção mostra um recado e manda pro WhatsApp

### O que é PROVISÓRIO e precisa bater com o motor

Serviços, durações, expediente e tempo de deslocamento estão **copiados**
do `CONFIG` do `apps-script.gs`. São um chute até o João confirmar.

> Quando ele confirmar, mudar **nos dois lugares**. Se o site oferecer um
> horário que o motor não reconhece, o cliente leva erro na cara.

### Os botões mudaram

Todos os CTAs passaram a apontar pra `#agendar`. O WhatsApp continua no
site, mas como alternativa: botão secundário no hero, seção de contato
inteira, rodapé e o link do fim do agendamento. O preço continua fora do
site de propósito, então quem quer saber valor ainda chama no WhatsApp, e
é lá que o João fecha.

O botão da seção de domicílio leva `data-local="domicilio"`: quem chega
por ele já encontra o domicílio marcado.

### Testado em 20/08/2026

Fluxo inteiro dirigido por script no Chrome, 28 verificações, todas
passando: troca de dia, marcação única, formulário vazio recusado,
máscara de telefone e de aniversário, confirmação e recomeço. Layout
conferido em 390px e em 1280px.

### O que falta (depende do João)

1. Dias e horários reais que ele atende, na barbearia e a domicílio
2. Duração real de cada serviço, e se falta algum
3. Quanto tempo reservar de deslocamento
4. O número de WhatsApp dele em dígitos, pra mensagem já ir escrita
   (hoje, sem ele, o botão cai no link curto do perfil, que não aceita
   texto pronto)
