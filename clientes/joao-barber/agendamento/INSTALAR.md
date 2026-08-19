# Instalar o agendamento

> Passo a passo pra ligar o motor. Uns 20 minutos, uma vez só.
> **Tem que ser feito na conta Google do João**, não na do Miguel. Se for
> feito na conta errada, no dia em que vocês se separarem ele perde a
> agenda e a base inteira.

---

## O que é cada peça

```
Site (Netlify)                    formulário, mostra os horários
      │  pergunta "quais horários existem?"
      ▼
Apps Script (conta do João)       o motor. Lê a agenda, cria o evento,
      │                           grava a linha
      ├──────────► Google Agenda do João
      ├──────────► Planilha de agendamentos
      └──────────► devolve o link do WhatsApp
```

Custo: zero. Não tem servidor, não tem mensalidade, não tem cartão.

---

## Passo 1: a planilha

1. Logado na conta do João, criar uma planilha em
   https://sheets.new
2. Nomear como **João Barber · Agendamentos**
3. Renomear a primeira aba para **Agendamentos** (o nome tem que bater
   com o `SHEET_NOME` do script)
4. Copiar o **ID da planilha**, que fica na URL entre `/d/` e `/edit`:

```
https://docs.google.com/spreadsheets/d/AQUI_ESTA_O_ID/edit
```

O cabeçalho não precisa ser criado à mão, o script cria sozinho no
primeiro agendamento.

---

## Passo 2: o script

1. Abrir https://script.google.com e clicar em **Novo projeto**
2. Nomear como **João Barber · Agendamento**
3. Apagar o conteúdo do arquivo `Código.gs` e colar o conteúdo inteiro de
   `apps-script.gs`
4. Editar o bloco `CONFIG` no topo:

| Campo | O que colocar |
|---|---|
| `SHEET_ID` | o ID copiado no passo 1 |
| `WHATSAPP` | número do João, só dígitos, com 55 e DDD |
| `CHAVE` | um texto longo e único, inventado. Ex: `jb-2026-x7k2p9m4qz` |
| `SERVICOS` | conferir os minutos de cada serviço com o João |
| `EXPEDIENTE` | os dias e horários reais que ele atende |
| `DOMICILIO_EXTRA_MIN` | quanto tempo de deslocamento reservar |

5. Salvar

---

## Passo 3: testar antes de publicar

1. No seletor de função, escolher **testar** e clicar em **Executar**
2. Na primeira vez o Google pede autorização. Vai aparecer um aviso de
   "app não verificado", que é normal, porque o app é dele mesmo.
   Clicar em **Avançado** e depois em **Acessar João Barber (não seguro)**
3. Abrir **Registro de execução**. Tem que aparecer o nome da agenda, o
   nome da planilha e uma lista de horários

Se der erro aqui, é configuração, não é código. Conferir o `SHEET_ID` e o
nome da aba.

---

## Passo 4: publicar o motor

1. Canto superior direito, **Implantar** → **Nova implantação**
2. Na engrenagem, escolher o tipo **App da Web**
3. Preencher:
   - **Executar como:** Eu (a conta do João)
   - **Quem pode acessar:** Qualquer pessoa
4. **Implantar** e copiar a **URL do app da Web**. Termina em `/exec`

> "Qualquer pessoa" assusta, mas é o que permite o site do João conversar
> com o motor sem login. Quem protege é a `CHAVE`: sem ela, o script
> recusa qualquer chamada.

---

## Passo 5: ligar no site

No `site/index.html`, no bloco de configuração do agendamento, preencher:

```js
const AGENDA_URL   = 'https://script.google.com/macros/s/.../exec';
const AGENDA_CHAVE = 'a mesma chave que está no script';
```

Publicar o site (`/publicar-site`) e testar marcando um horário de
verdade. Depois é só apagar o evento de teste da agenda e a linha da
planilha.

---

## Quando mudar alguma coisa no script

Toda vez que editar o código, tem que **implantar de novo**, senão a
mudança não vale no ar:

**Implantar** → **Gerenciar implantações** → ícone de lápis → em Versão,
escolher **Nova versão** → **Implantar**.

A URL não muda, então não precisa mexer no site de novo.

---

## Limites, pra não ter surpresa

- **Fila de horários:** dois clientes clicando no mesmo segundo não
  conseguem marcar o mesmo horário. O script tranca e confere de novo
  antes de gravar
- **Cancelamento:** a versão 1 não tem botão de cancelar. O cliente pede
  no WhatsApp e o João apaga da agenda. Quando incomodar, a gente coloca
- **Fuso:** está fixo em `America/Sao_Paulo`
- **Volume:** as cotas gratuitas do Apps Script são muito maiores do que
  a agenda de um barbeiro. Não vai bater no teto
- **Mensagem automática no WhatsApp:** o site abre a conversa com o texto
  já escrito, e o cliente envia com um toque. A resposta automática vem
  da **mensagem de saudação do WhatsApp Business**, que é grátis. Disparo
  feito por robô só existe na API paga da Meta, e as gambiarras derrubam
  o número
- **Privacidade:** a planilha tem telefone de cliente. Não compartilhar
  com link público, só com quem precisa
