# Índice do agendamento: todo dado que entra e sai

> Mapa completo do motor (`apps-script.gs`) e do que ele troca com o site.
> Serve pra montar e entender a planilha. Atualizado em 30/08/2026 (v2
> + camada 3 de relacionamento, ver `RELACIONAMENTO.md`).

---

## 1. O caminho de uma marcação

```
Cliente no site
   │  escolhe serviço, local, dia, hora, preenche nome e WhatsApp
   ▼
Site  ──POST──►  Motor (Apps Script na conta do João)
                    │  1. confere se o horário ainda está livre
                    │  2. cria o evento na Google Agenda
                    │  3. grava 1 linha na aba Agendamentos
                    │  4. cria ou atualiza a linha do cliente na aba Clientes
                    │  5. manda email pro João (se configurado)
                    │  6. gera o CÓDIGO curto
                    ▼
Site  ◄──resposta──  { ok, codigo, whatsapp, quando }
   │
   ▼  abre o WhatsApp do João com a mensagem pronta (passo obrigatório)
```

Config (serviços, expediente, regras) é lida da **planilha**, não do código.
Fica em cache por 120 segundos: o João edita a planilha e a mudança passa a
valer em, no máximo, 2 minutos.

---

## 2. O que o site coleta (formulário)

| Campo | Origem | Obrigatório | Formato | Vai pra |
|---|---|---|---|---|
| Serviço | passo 1 | sim | chave (`corte`, `barba`...) | Agendamentos, evento |
| Local | passo 2 | sim | `barbearia` ou `domicilio` | Agendamentos, evento |
| Endereço | passo 2 (só domicílio) | sim se domicílio | texto livre | evento (no campo Local) |
| Dia + hora | passo 3 | sim | ISO `2026-09-02T15:00:00-03:00` | evento, Agendamentos |
| Nome | passo 4 | sim | texto | Agendamentos, Clientes, evento |
| WhatsApp | passo 4 | sim | dígitos (máscara no site) | Agendamentos, Clientes, evento |
| Aniversário | passo 4 | não | `dd/mm` | Clientes, evento |
| Como me achou | passo 4 | não | lista fixa | Clientes, evento |
| Observação | passo 4 | não | texto livre | Clientes, evento |

Lista fixa de "como me achou": Instagram, Google, Indicação de amigo, Já sou
cliente, Outro.

---

## 3. As 7 abas da planilha

Nomes exatos (com acento). Se renomear uma aba, tem que ajustar o `NUCLEO`
no `apps-script.gs`. As duas últimas (`Mensagens`, `Datas`) são da camada
3 de relacionamento; detalhe em `RELACIONAMENTO.md`.

### 3.1 `Config` — parâmetro / valor  *(o João edita)*

| Parâmetro | Exemplo | O que faz |
|---|---|---|
| WhatsApp do João | `5561981607166` | número que recebe a confirmação. Só dígitos, com 55 e DDD |
| Email de aviso | *(vazio)* | recebe email a cada marcação e cancelamento, e as listas da camada 3. Vazio = cai no email da própria conta |
| Antecedência mínima | `2` | horas. Bloqueia marcação em cima da hora |
| Janela de agenda | `14` | dias pra frente que a agenda abre. Curto de propósito, deixa margem pra imprevisto |
| Passo dos horários | `15` | minutos entre um horário e o próximo na lista |
| Extra domicílio | `45` | minutos de deslocamento, somados à duração do serviço |
| Cancelar pelo site até | `6` | horas antes do horário. `0` desliga o cancelamento pelo site |
| Guardar dados por | `24` | meses sem o cliente voltar. Passou disso, a faxina mensal anonimiza a linha dele. `0` desliga (LGPD, art. 15 e 16) |
| Recall a partir de | `15` | dias desde o último corte pra entrar no recall |
| Recall ignora após | `60` | dias. Acima disso, fora do recall automático |
| Dia do resumo | `Segunda` | dia da semana em que a lista da semana chega por email |
| Hora do resumo | `8` | hora aproximada da lista da semana |
| Hora da confirmação | `18` | hora aproximada do email de confirmação do dia seguinte |

O motor casa pelo começo do texto (`whatsapp`, `email`, `anteced`, `janela`,
`passo`, `domic`, `cancel`, `guardar`, `recall`, `recall ignora`, `dia do resumo`,
`hora do resumo`, `hora da confirm`), então a redação exata do rótulo não
trava nada.

Mudou `Dia do resumo` ou uma das horas? Rodar `instalarGatilhos` de novo:
o gatilho de tempo é criado no código e não relê a planilha sozinho.

### 3.2 `Serviços` — tabela  *(o João edita)*

| Coluna | Exemplo | Nota |
|---|---|---|
| chave | `corte` | id interno, minúsculo, sem espaço. **Tem que bater com o site** |
| nome | `Corte` | o que aparece pro cliente |
| minutos | `40` | duração. É o que reserva o espaço na agenda |
| descrição | `Do clássico ao degradê...` | linha de apoio no card do site |
| ativo | `sim` | `não` esconde o serviço sem apagar a linha |

### 3.3 `Expediente` — tabela  *(o João edita)*

| dia | abre | fecha | abre 2 | fecha 2 |
|---|---|---|---|---|
| Segunda | 09:00 | 12:00 | 13:30 | 19:00 |
| ... | | | | |

- Uma linha por dia da semana (Domingo a Sábado, com acento).
- Dia vazio (sem horas) = não atende.
- A segunda faixa é opcional, serve pro intervalo de almoço.
- Formatar as células de hora como **texto**, pra não virar valor de data.

### 3.4 `Agendamentos` — registro de eventos  *(se preenche sozinho)*

Uma linha por marcação. **É a aba que cresce.** Não guarda aniversário,
origem nem observação: isso mora em `Clientes`, pra não repetir.

| Coluna | Vem de | Exemplo |
|---|---|---|
| Agendado em | relógio do motor | `2026-08-29 10:12` |
| Código | gerado pelo motor | `K7QP` |
| Status | motor | `Confirmado` / `Cancelado 29/08 14:03` |
| Data do corte | dia escolhido | `2026-09-02` |
| Hora | hora escolhida | `15:00` |
| Nome | formulário | `Fulano` |
| WhatsApp | formulário (com `'` na frente, pra manter o zero) | `'5561999990000` |
| Serviço | nome do serviço | `Corte` |
| Local | motor | `Barbearia Rota 020` / `A domicílio: ...` |
| Compareceu | **o João preenche depois** (pro recall) | vazio / `sim` / `não` |
| ID do evento | Google Agenda | `abc123@google.com` |

### 3.5 `Clientes` — a base que se preenche sozinha  *(se preenche sozinho)*

Uma linha por pessoa, casada pelo número de WhatsApp. **Atualiza, não
duplica.** É a ficha do cliente do `projeto.md` começando a existir.

| Coluna | Como é preenchida |
|---|---|
| WhatsApp | chave da linha. Só dígitos, com `'` na frente |
| Nome | do primeiro agendamento (só preenche se estiver vazio) |
| Aniversário | na primeira vez que o cliente informar |
| Como me achou | do primeiro agendamento |
| Primeira vez | data do primeiro agendamento |
| Última visita | atualizada a cada novo agendamento |
| Visitas | contador, +1 a cada agendamento |
| Observações | **acumula**: `2026-09-02: não curto a lateral curta \| 2026-10-01: ...` |
| Não enviar | **o João escreve à mão.** Qualquer coisa aqui (`sim`) tira a pessoa do recall e do aniversário. É o direito de oposição da LGPD (art. 18) virado em coluna. A confirmação do dia seguinte continua, porque é sobre um horário que a própria pessoa marcou |

#### Como o motor sabe que é a mesma pessoa

Pelo **telefone, nunca pelo nome.** Dois Mateus com números diferentes
são duas linhas, sempre.

O problema é que a mesma pessoa digita o número de jeito diferente a
cada vez. Por isso a comparação não é no texto cru: o motor reduz o
número a uma **chave de DDD + os 8 últimos dígitos** (`chaveTelefone()`),
que é a parte que não muda:

| O que a pessoa digitou | Chave | Resultado |
|---|---|---|
| `5561981607166` | `6181607166` | linha do Mateus |
| `61981607166` | `6181607166` | **mesma** linha, atualiza |
| `6181607166` (sem o 9) | `6181607166` | **mesma** linha, atualiza |
| `(61) 9 8160-7166` | `6181607166` | **mesma** linha, atualiza |
| `61999887766` | `6199887766` | **outro** Mateus, linha nova |
| `11981607166` | `1181607166` | outro DDD, linha nova |

Dois clientes distintos com o mesmo DDD e os mesmos 8 dígitos finais não
existem: seria o mesmo telefone.

#### O que sobrescreve e o que não

Numa visita seguinte, o motor só atualiza **Última visita** e **Visitas**.
Nome, aniversário e origem só são gravados **se a célula estiver vazia**,
então o que o João corrigir à mão na planilha fica de pé. Observação é a
exceção: acumula, porque cada visita traz uma nova.

### 3.6 `Mensagens` — textos da camada 3  *(o João edita)*

Uma linha por tipo. O motor troca os curingas na hora de montar o link.

| chave | curingas | usado em |
|---|---|---|
| `recall` | `{nome}`, `{dias}` | lista da semana, bloco recall |
| `aniversario` | `{nome}` | lista da semana, bloco aniversário |
| `confirmacao` | `{nome}`, `{hora}`, `{servico}`, `{local}` | email de confirmação de amanhã |

Linha apagada = o motor usa o texto embutido (`PADRAO_MSG` no código).

### 3.7 `Datas` — calendário comemorativo  *(o João edita)*

| Coluna | Exemplo | Nota |
|---|---|---|
| data (dd/mm) | `15/09` | formatar como texto. O motor também aceita se virar data |
| nome | `Dia do Cliente` | aparece na lista da semana |
| mensagem | `Fala {nome}! ...` | texto sugerido, o João manda pra quem quiser |
| ativo | `sim` | `não` desliga sem apagar |

Datas móveis (Dia dos Pais, Páscoa) o João cadastra com a data daquele
ano quando chegar perto.

---

## 4. O que vai pro evento da Google Agenda

- **Título:** `Corte · Fulano`
- **Quando:** início = horário escolhido, fim = início + duração (+ extra se domicílio)
- **Local:** `Barbearia Rota 020` ou `A domicílio: <endereço>`
- **Descrição:** cliente, WhatsApp, serviço, local, código, e o que tiver de
  aniversário / origem / observação, mais a linha "Agendado pelo site."

---

## 5. Endpoints do motor

Todos exigem `chave` igual à do `NUCLEO.CHAVE` / bloco `AGENDA` do site.

| Método | Parâmetros | Resposta |
|---|---|---|
| GET `acao=config` | — | `{ ok, servicos:{...}, domicilioExtra }` |
| GET `acao=dias` | `servico`, `local` | `{ ok, dias:[{data, rotulo, vagas}] }` |
| GET `acao=horarios` | `servico`, `local`, `data` | `{ ok, data, horarios:["09:00", ...] }` |
| POST *(marcar)* | `servico, local, endereco, inicio, nome, telefone, aniversario, origem, observacao` | `{ ok, codigo, whatsapp, quando }` |
| POST `acao=cancelar` | `codigo` | `{ ok, whatsapp }` ou `{ erro, mensagem, whatsapp? }` |

Erros possíveis no POST de marcar: `servico invalido`, `ocupado` (com
`mensagem`), `chave invalida`.
Erros no cancelar: `sem codigo`, `nao achou`, `ja cancelado`, `tarde` (faltam
menos de X horas, vem com `whatsapp` pra falar com o João).

---

## 6. O código curto

- **Nasce** no motor, na hora de gravar a marcação. 4 caracteres do conjunto
  `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (sem O/0 e I/1).
- **Aparece** em: tela de confirmação do site, mensagem de WhatsApp pro João,
  email de aviso, coluna Código da aba Agendamentos, descrição do evento.
- **Serve pra:** o cliente desmarcar pelo site sem precisar falar com ninguém,
  enquanto faltar mais que "Cancelar pelo site até" horas.
- **Nunca se repete:** antes de devolver, o motor confere a coluna Código
  inteira. Sorteio cego repetiria por volta da milésima marcação, e código
  repetido significa desmarcar o horário da pessoa errada.
- **Sozinho ele não desmarca nada.** Desde 31/08/2026 o site pede o código
  **e os 4 últimos dígitos do WhatsApp** usado na marcação. Além disso, 8
  tentativas erradas em 15 minutos travam a porta. Sem isso, 4 letras eram
  a única coisa entre um robô e a agenda do João. Detalhe em
  `../SEGURANCA.md`.

---

## 7. Onde a config é lida (a ordem)

```
Planilha (Config / Serviços / Expediente)
   │  lerConfig() junta tudo num objeto
   ▼
Cache do Apps Script (120s)
   │
   ├──► doGet/doPost do motor usam pra calcular horário e duração
   └──► GET acao=config entrega serviços e extra de domicílio pro site
             │
             ▼
        Site: se o motor responde, usa isso. Se não (motor antigo ou fora
        do ar), cai na cópia embutida no index.html (bloco "fallback de
        serviços e expediente")
```

O expediente **não** é enviado pro site: quem calcula horário livre é sempre
o motor, lendo a agenda de verdade. A cópia de expediente no site só serve
pro modo demonstração.

---

## 8. Camada 3: relacionamento (não passa pelo site)

Dois gatilhos de tempo no próprio motor, criados por `instalarGatilhos`.
Nada dispara mensagem: cada um monta um email pro João com link `wa.me`
pronto por pessoa. Detalhe e o caminho pra API oficial do WhatsApp em
`RELACIONAMENTO.md`.

| Função | Quando | O que manda |
|---|---|---|
| `resumoSemanal` | 1x/semana (`Dia do resumo` + `Hora do resumo`) | aniversariantes dos próximos 7 dias, recall (entre `Recall a partir de` e `Recall ignora após` dias, sem horário futuro), data comemorativa da semana, e a agenda dos próximos 7 dias |
| `confirmacoesDoDia` | todo dia (`Hora da confirmação`) | horários marcados pra **amanhã**, com texto de confirmação. Não manda email se amanhã está vazio |

Lê das abas `Clientes` (recall, aniversário), `Agendamentos` (agenda e
confirmação), `Mensagens` (textos) e `Datas` (calendário). Escopos novos
no motor por causa disso: `script.scriptapp` (criar gatilho) e
`userinfo.email` (achar o email da conta se a Config não tiver).
