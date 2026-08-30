# Relacionamento: recall, aniversário, datas e confirmação

> A camada 3 do projeto (ver `../projeto.md`, seção 4). Mora no mesmo
> `apps-script.gs`, roda de graça dentro da conta do João, e **não
> dispara mensagem nenhuma sozinho**. Monta a lista e manda pro João
> decidir e enviar.
>
> Criado em 30/08/2026.

---

## O que faz

Dois emails automáticos pro João, cada um com um link de WhatsApp pronto
por pessoa. Ele abre o link, o WhatsApp já monta a conversa com aquele
cliente e o texto escrito, ele lê, ajusta se quiser e envia. Um por um,
do número dele.

### 1. Lista da semana (`resumoSemanal`)

Chega **uma vez por semana** (padrão: segunda de manhã). Quatro blocos:

| Bloco | Quem entra |
|---|---|
| **Aniversário** | cliente que faz aniversário nos próximos 7 dias |
| **Recall** | passou de X dias desde o último corte e não tem horário marcado. Padrão: entre 15 e 60 dias. Quem sumiu faz mais de 60 dias não entra, pra não virar disparo em massa |
| **Data da semana** | feriado ou data comemorativa cadastrada na aba Datas que cai nos próximos 7 dias |
| **Já agendados** | os horários confirmados dos próximos 7 dias, só pra ele ter a visão |

### 2. Confirmação do dia seguinte (`confirmacoesDoDia`)

Roda **todo dia, fim da tarde** (padrão: 18h). Lista quem tem horário
marcado **amanhã**, com o texto de confirmação pronto. Se não tem ninguém
amanhã, não manda email nenhum.

---

## Como o João usa

1. Abre o email (no celular mesmo).
2. Vai pessoa por pessoa. Toca no link embaixo do nome.
3. O WhatsApp abre já na conversa daquela pessoa, com o texto escrito.
4. Lê, ajusta se quiser, **envia**.
5. Passa pra próxima.

Leva uns minutos por semana. O trabalho de decidir "quem" e "o que
falar" já está feito; sobra só o toque de enviar, que é onde ele é bom e
onde a conversa acontece de verdade.

**A resposta do cliente cai no WhatsApp normal dele.** O sistema não
acompanha se confirmou ou não: isso é conversa, e é com o João.

---

## O que fica na planilha (o João edita, sem tocar em código)

### aba `Config`, parâmetros novos

| Parâmetro | Padrão | O que faz |
|---|---|---|
| Recall a partir de | 15 | dias desde o último corte pra entrar no recall |
| Recall ignora após | 60 | dias. Acima disso, não entra no recall automático |
| Dia do resumo | Segunda | dia da semana que a lista chega |
| Hora do resumo | 8 | hora aproximada da lista da semana |
| Hora da confirmação | 18 | hora aproximada do email de confirmação de amanhã |
| Email de aviso | *(vazio)* | onde os dois emails chegam. Vazio = cai no email da própria conta (`joaobarber.agenda@gmail.com`) |

**Mudou "Dia do resumo" ou uma das horas?** Rodar `instalarGatilhos` de
novo (o gatilho é criado no código, não relê a planilha sozinho). Os
outros parâmetros valem na hora, é só editar a célula.

### aba `Mensagens`, os textos

Uma linha por tipo: `recall`, `aniversario`, `confirmacao`. Editar a
coluna de texto muda a mensagem. Curingas que o motor troca:

- `{nome}` — primeiro nome do cliente
- `{dias}` — dias desde o último corte (só no recall)
- `{hora}`, `{servico}`, `{local}` — só na confirmação

Se apagar uma linha, o motor usa um texto padrão embutido (em
`PADRAO_MSG`, no `apps-script.gs`).

### aba `Datas`, o calendário comemorativo

`data (dd/mm)` · `nome` · `mensagem` · `ativo`. Já vem com Dia do
Cliente, Natal e Ano Novo. O João acrescenta o que quiser (Dia dos Pais,
Páscoa: essas mudam de dia todo ano, então ele põe a data daquele ano
quando chegar perto). `ativo` em branco ou `não` desliga a linha sem
apagar.

---

## Instalação (uma vez, o Miguel faz)

Depende da base de clientes existir. Ver "A lista do João" abaixo.

1. **Publicar o motor novo:**
   ```powershell
   cd clientes/joao-barber/agendamento
   ./publicar-motor.ps1 -Nota "camada 3: recall, aniversario, datas, confirmacao"
   ```

2. **Autorizar os escopos novos.** O motor passou a usar `ScriptApp`
   (criar gatilho) e ler o email da conta. Isso **exige autorização
   manual** na tela do navegador, nenhum comando pula:
   - `clasp open-script` abre o editor
   - rodar a função `montarPlanilha` uma vez (ela cria as abas Mensagens
     e Datas e acrescenta os parâmetros novos na Config)
   - na tela "app não verificado": **Avançado → Acessar (não seguro)**

3. **Conferir a Config.** O `montarPlanilha` **não mexe em valor que já
   existe**, então a "Janela de agenda" continua no que estava. Se for
   pra ficar em 14 dias, editar a célula à mão.

4. **Ligar os gatilhos:**
   ```powershell
   clasp run instalarGatilhos
   ```
   (ou pelo editor: escolher `instalarGatilhos` → Executar). O log diz o
   que foi criado. Se `clasp run` reclamar de credencial, roda pelo
   editor.

5. **Testar sem esperar a semana virar:** rodar `resumoSemanal` e
   `confirmacoesDoDia` na mão (editor ou `clasp run`) e conferir o email
   que chega.

### A lista do João

O recall e o aniversário só valem com base de clientes. A aba `Clientes`
se preenche sozinha a cada novo agendamento, mas isso só pega quem marca
**daqui pra frente**. Pra primeira leva, o João precisa jogar os
contatos antigos dele na aba, uma vez.

Colunas que importam pro relacionamento: **WhatsApp**, **Nome**,
**Aniversário** (dd/mm), **Última visita** (dd/mm/aaaa ou aaaa-mm-dd).
As outras podem ficar vazias. O jeito mais rápido: ele exporta os
contatos da agenda do celular, o Miguel limpa num CSV e cola.

Enquanto a lista não vem, o sistema já funciona: só vai listando quem
passa pelo agendamento.

---

## Por que não é automático no WhatsApp

Essa é a pergunta que sempre volta, então fica registrada.

**Mandar mensagem no WhatsApp por robô, sem risco de banimento, só tem um
caminho: a API oficial (WhatsApp Business Platform / Cloud API, da
Meta).** Qualquer biblioteca não oficial (as que "leem" o WhatsApp Web,
tipo Baileys, venom-bot, wppconnect) funciona por um tempo e depois
derruba o número. Num negócio onde o número **é a agenda inteira do
João**, isso não é risco que se corre.

### O que a API oficial exige

| Requisito | Detalhe |
|---|---|
| CNPJ | o João tem |
| Conta no Meta Business + WhatsApp Business Platform | cadastro e verificação da empresa, leva de dias a semanas |
| Um provedor (BSP) ou a Cloud API direto | ex: 360dialog, Gupshup, Twilio, ou a Cloud API da Meta direto (mais barata, mais trabalho de setup) |
| Número dedicado | **não dá pra usar o número pessoal que já está no WhatsApp comum.** Tem que ser um número novo, só pra API. O João perderia o histórico de conversa se quisesse migrar o atual |
| Modelos de mensagem aprovados | cada texto de template (recall, aniversário) passa por aprovação da Meta antes de poder disparar. Muda o texto, re-aprova |
| Janela de 24h | fora de uma conversa iniciada pelo cliente nas últimas 24h, só dá pra mandar template pago |

### Custo (ordem de grandeza, 2026)

A Meta cobra por conversa iniciada pela empresa. Conversa de "utilidade"
(confirmação de agendamento) e de "marketing" (recall, promoção) têm
preços diferentes, na casa de **R$ 0,08 a R$ 0,35 por conversa** no
Brasil, mais a mensalidade do BSP se usar um (uns R$ 50 a R$ 300/mês).
Pra um barbeiro com dezenas de clientes/mês, é troco. O peso não é o
dinheiro, é o setup e a manutenção.

### Quando vale a pena migrar

Não agora. Vale reconsiderar quando:

- o volume de recall/confirmação passar de umas 30 a 40 mensagens por
  semana e o envio manual virar peso real
- o João topar um **número novo dedicado**, separado do pessoal
- tiver alguém (o Miguel, ou o Hermes) pra cuidar da conta Meta, dos
  templates e das renovações

Até lá, o envio manual com texto pronto entrega 90% do resultado com 0%
do risco. E o gesto de enviar à mão mantém a mensagem pessoal, que num
mercado local pequeno é a parte que funciona.

### Plano de migração, se um dia for

1. João abre um chip novo só pra isso (ou um número virtual).
2. Cadastro no Meta Business, verificação da empresa, número ligado na
   Cloud API.
3. Um Apps Script novo (ou o Hermes) recebe a lista que hoje vira email
   e, em vez de montar link `wa.me`, chama a API da Meta com o template
   aprovado.
4. O `resumoSemanal` continua existindo como painel de controle: o
   disparo automático fica só pra confirmação (utilidade) e o recall
   segue semiautomático, com o João aprovando a leva antes de sair.
5. O site passa a usar o mesmo número pra confirmação de agendamento, aí
   sim automática.

Nada disso muda o que está montado hoje. É camada por cima.

---

## Arquivos

- Código: `apps-script.gs`, seção "RELACIONAMENTO" e função `montarPlanilha`
- Dados: abas `Config`, `Mensagens`, `Datas`, `Clientes`, `Agendamentos`
  (mapa completo em `INDICE.md`)
- Publicar: `CLASP.md`
