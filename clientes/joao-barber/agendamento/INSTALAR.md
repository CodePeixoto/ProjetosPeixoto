# Instalar o agendamento (v2)

> Passo a passo pra ligar o motor. Uns 25 minutos, uma vez só.
>
> **Tem que rodar numa conta Google que no fim das contas seja do João.**
> Decidido em 20/08/2026: o Miguel cria uma conta nova dedicada ao projeto
> e entrega por senha quando o João assumir. Assim não tem migração de
> agenda nem de planilha depois, e nada fica misturado com a conta pessoal
> do Miguel.
>
> **A tela do site já existe e já funciona sem isso aqui**, em modo
> demonstração (ver `../site/NOTAS.md`). O que este passo a passo faz é
> trocar os horários de mentira pelos de verdade.
>
> **Já rodou a v1?** As mudanças da v2 estão no fim, em "Migrar da v1".
>
> **Atalho pelo terminal:** os passos 2 (colar o script) e 4 (publicar) dá
> pra fazer sem abrir o editor, com o `clasp`. Ver `CLASP.md` nesta pasta.
> Este passo a passo continua valendo como caminho manual e como
> referência do que cada peça faz.

---

## O que é cada peça

```
Site (Netlify)                    formulário, mostra os horários
      │  pergunta "quais serviços e horários existem?"
      ▼
Apps Script (conta do João)       o motor. Lê a config e a agenda,
      │                           cria o evento, grava as linhas
      ├──────────► Google Agenda do João
      ├──────────► Planilha (5 abas)
      ├──────────► email de aviso pro João (opcional)
      └──────────► devolve o link do WhatsApp + o código
```

Custo: zero. Não tem servidor, não tem mensalidade, não tem cartão.

A diferença da v1: **serviços, expediente e regras agora moram na planilha**,
nas abas Config, Serviços e Expediente. O João edita lá, sem abrir o código.

---

## Passo 1: a planilha (5 abas)

Só é preciso criar a planilha e copiar o id. **As abas o próprio motor
monta**, com a função `montarPlanilha` (ver abaixo).

1. Logado na conta do João, criar uma planilha em https://sheets.new
2. Nomear como **João Barber · Agendamentos**
3. Copiar o **ID da planilha**, na URL entre `/d/` e `/edit`, e colar no
   `SHEET_ID` do bloco `NUCLEO` do `apps-script.gs`

### As abas: deixe o motor montar

Depois que o script estiver na conta (passo 2), rodar **uma vez** a função
`montarPlanilha` — no editor, ou por `clasp run montarPlanilha`. Ela:

- cria as 5 abas com os nomes certos, na ordem certa
- preenche `Config`, `Serviços` e `Expediente` com os valores de partida
- formata as colunas de hora do Expediente como **texto** antes de
  escrever (é o detalhe que mais quebra quando se faz à mão: o Google
  converte "09:00" em hora de verdade e o motor lê outra coisa)
- cria o cabeçalho de `Agendamentos` e `Clientes`
- se a aba `Agendamentos` for a da v1 (sem a coluna `Código`), guarda ela
  como **`Agendamentos (v1)`** e começa uma limpa, porque as colunas
  mudaram de ordem

**É seguro rodar de novo:** aba que já tem conteúdo não é tocada, e nada
é apagado. O log diz exatamente o que foi feito em cada aba.

Depois disso, só uma coisa precisa de olho humano: na aba **Config**,
conferir o **WhatsApp do João** (só dígitos, com 55 e DDD). É por esse
número que a mensagem de confirmação abre.

### Se preferir fazer à mão

As colunas de cada aba estão em `INDICE.md`, seção 3. Os valores de
partida estão dentro da própria função `montarPlanilha`, no fim do
`apps-script.gs` — é de lá que dá pra copiar. Nesse caminho, **lembrar de
formatar as colunas de hora do Expediente como texto** (Formatar →
Número → Texto simples) **antes** de colar, senão o Google converte
"09:00" em hora de verdade e o motor lê errado.

---

## Passo 2: o script

1. Abrir https://script.google.com e clicar em **Novo projeto**
2. Nomear como **João Barber · Agendamento**
3. Apagar o conteúdo de `Código.gs` e colar o `apps-script.gs` inteiro
4. No bloco `NUCLEO` no topo, ajustar só se precisar:

| Campo | O que colocar |
|---|---|
| `SHEET_ID` | o ID copiado no passo 1 |
| `CHAVE` | um texto longo e único. **O mesmo tem que estar no site** |
| `ABA_*` | só mexer se você renomeou alguma aba |

Serviços, WhatsApp, expediente e regras **não** ficam aqui: estão na planilha.

5. Salvar

---

## Passo 3: testar antes de publicar

1. No seletor de função, escolher **testar** e clicar em **Executar**
2. Na primeira vez o Google pede autorização. Vai aparecer "app não
   verificado", que é normal (o app é dele mesmo). **Avançado** →
   **Acessar João Barber (não seguro)**
3. Abrir **Registro de execução**. Tem que aparecer: nome da agenda, o
   WhatsApp da Config, a lista de serviços ativos, o expediente de hoje e
   uma lista de horários livres

Se der erro aqui, é a planilha, não o código: conferir os nomes das 5 abas
e o `SHEET_ID`.

---

## Passo 4: publicar o motor

1. Canto superior direito, **Implantar** → **Nova implantação**
2. Na engrenagem, tipo **App da Web**
3. Preencher:
   - **Executar como:** Eu (a conta do João)
   - **Quem pode acessar:** Qualquer pessoa
4. **Implantar** e copiar a **URL do app da Web** (termina em `/exec`)

> "Qualquer pessoa" assusta, mas é o que deixa o site conversar com o motor
> sem login. Quem protege é a `CHAVE`.

---

## Passo 5: ligar no site

No `site/index.html`, procurar por `var AGENDA` (perto do fim do arquivo) e
preencher:

```js
var AGENDA = {
  URL:      'https://script.google.com/macros/s/.../exec',
  CHAVE:    'a mesma CHAVE que está no script',
  WHATSAPP: '5561981607166'   // fallback, se o motor não responder
};
```

Com `URL` e `CHAVE` preenchidas, o motor entra: o site pede a config
(`acao=config`) e passa a ler serviços e horários de verdade. Com elas
vazias, roda em demonstração.

Publicar (`/publicar-site`) e testar marcando um horário real. Depois é só
apagar o evento de teste da agenda e as linhas de teste nas abas
Agendamentos e Clientes.

---

## Quando mudar alguma coisa

**No script (código):** toda vez que editar, tem que **implantar de novo**:
**Implantar** → **Gerenciar implantações** → lápis → Versão: **Nova versão**
→ **Implantar**. A URL não muda.

> Pelo terminal isso é um comando só: `./publicar-motor.ps1 -Nota "..."`
> na pasta `agendamento/` (faz `clasp push` + nova versão). Ver `CLASP.md`.

**Na planilha (serviços, horário, regras):** nada a fazer. O motor relê a
config sozinho, no máximo 2 minutos depois (é o cache). O site pega a lista
nova de serviços na próxima vez que a página abrir.

---

## Cancelamento pelo site

A v2 tem. O cliente recebe um **código** de 4 letras ao agendar (na tela, no
WhatsApp e no email). Pra desmarcar, ele volta no site, abre "Precisa
desmarcar um horário?" e digita o código. O motor apaga o evento, marca a
linha como Cancelado (não apaga, é dado) e abre o WhatsApp pro cliente te
avisar.

O parâmetro **"Cancelar pelo site até"** na aba Config define o limite: a X
horas do horário, o site para de deixar cancelar e manda falar com você.
`0` desliga o cancelamento pelo site inteiro.

---

## Limites, pra não ter surpresa

- **Fila de horários:** dois clientes no mesmo segundo não marcam o mesmo
  horário. O script tranca e confere antes de gravar
- **Fuso:** fixo em `America/Sao_Paulo`
- **Cache da config:** mudança na planilha demora até 2 min pra valer
- **Código repetido:** a chance de dois códigos iguais é mínima nesse volume
  e o motor não checa. Se acontecer, o cancelamento acha a marcação mais
  recente com aquele código
- **Mensagem automática no WhatsApp:** o site abre a conversa com o texto
  pronto e o cliente envia com um toque. Disparo por robô só na API paga da
  Meta, e as gambiarras derrubam o número
- **Privacidade:** a planilha tem telefone e aniversário de cliente. Não
  compartilhar com link público, só com quem precisa

---

## Migrar da v1

Quem já tinha a v1 rodando:

1. **Planilha:** criar as abas novas `Config`, `Serviços`, `Expediente`,
   `Clientes` a partir dos modelos. A aba `Agendamentos` da v1 tinha outras
   colunas (Aniversário, Como me achou, Observação, Compareceu, ID do
   evento) — a v2 usa `Agendado em, Código, Status, Data do corte, Hora,
   Nome, WhatsApp, Serviço, Local, Compareceu, ID do evento`. Mais simples
   começar uma aba `Agendamentos` nova e guardar a antiga como
   `Agendamentos (v1)`
2. **Script:** colar o `apps-script.gs` novo por cima, conferir `SHEET_ID` e
   `CHAVE` no bloco `NUCLEO`, e **implantar nova versão**
3. **Site:** já está atualizado (pede `acao=config`, tela de confirmação
   nova, bloco de cancelamento). Só publicar
