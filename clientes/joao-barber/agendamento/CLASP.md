# clasp: mexer no motor sem abrir o editor

> O `clasp` é a ferramenta oficial do Google pra Apps Script pela linha de
> comando. Com ele o Miguel sobe o `apps-script.gs` e publica uma nova
> versão do App da Web direto do terminal, igual já faz com a Netlify no
> `/publicar-site`.
>
> **Roda tudo na conta Google do João.** No fim, a conta é dele: a última
> seção aqui é o checklist de entrega e logout, pra máquina do Miguel não
> ficar com acesso.

---

## O que o clasp resolve e o que não

| Resolve | Não resolve |
|---|---|
| Subir o `apps-script.gs` pro projeto | Criar a planilha e as 5 abas (é feito na mão, ver `INSTALAR.md` passo 1) |
| Publicar nova versão do App da Web (URL `/exec` fixa) | Preencher `Config`, `Serviços`, `Expediente` |
| Ver quem está logado e listar deployments | A autorização de escopos na 1ª execução (tela do Google, uma vez) |
| Baixar o código de volta (`clasp pull`) se editarem pelo navegador | Ligar `URL` e `CHAVE` no `site/index.html` (isso é edição de arquivo + `/publicar-site`) |

Planilha continua manual. Se um dia valer a pena, dá pra escrever uma
função no próprio motor que monta as abas sozinha — não é o caso agora.

---

## Passo 0: a conta Google do João

Decidido em 20/08/2026: conta **nova, dedicada ao projeto**, criada pelo
Miguel e entregue por senha quando o João assumir. Não é a conta pessoal
do João nem a do Miguel.

1. Criar a conta (ex: `joaobarber.agenda@gmail.com`) e guardar a senha no
   gerenciador do Miguel
2. Ligar a **Apps Script API** dessa conta:
   https://script.google.com/home/usersettings → **API do Apps Script: Ativado**
   (sem isso o `clasp push` dá "User has not enabled the Apps Script API")
3. Fazer a planilha das 5 abas (`INSTALAR.md`, passo 1) e copiar o `SHEET_ID`

---

## Passo 1: instalar o clasp (uma vez por máquina)

```powershell
npm install -g @google/clasp
clasp --version
```

Vale pro notebook e pro PC separadamente (a pasta é sincronizada pelo
OneDrive, mas o clasp é global, fora dela).

---

## Passo 2: primeiro setup do projeto

> **⚠️ Aqui é CLONE, não CREATE.** O motor do João **já existe** na conta
> dele (foi criado pelo editor em 26/08 e está no ar desde então; é o que
> o site chama hoje). `clasp create` faria um projeto **novo**, com uma
> URL `/exec` **nova**, e o site continuaria apontando pro antigo — dois
> motores na conta e nenhum ligado direito. `create` só serve pra um
> cliente novo, começando do zero.

Tudo isso na pasta `clientes/joao-barber/agendamento/`.

```powershell
cd clientes/joao-barber/agendamento

# 1. logar NA CONTA DO JOÃO (abre o navegador). Confira o email na tela.
clasp login
clasp show-authorized-user      # tem que dizer joaobarber.agenda@gmail.com

# 2. achar o scriptId do motor que já existe
clasp list-scripts
```

O `scriptId` também está na URL do editor: abra
https://script.google.com logado na conta do João, entre no projeto
**João Barber · Agendamento**, e o id é o pedaço da URL entre
`/projects/` e `/edit`.

```powershell
# 3. trazer o projeto existente pra esta pasta
clasp clone <SCRIPT_ID> --rootDir .
```

O `clone` gera o `.clasp.json` com o `scriptId` e **baixa o código que
está na conta**. Esse arquivo é ignorado pelo Git (é específico da
conta). Se precisar recriar à mão, copie `.clasp.json.exemplo` pra
`.clasp.json` e cole o `scriptId`.

> **Cuidado:** o `clone` pode sobrescrever o `apps-script.gs` local com a
> versão v1 que está na conta. O nosso v2 está no Git, então se isso
> acontecer é só `git checkout clientes/joao-barber/agendamento/apps-script.gs`
> pra trazer o certo de volta antes de publicar.

```powershell
# 4. conferir o NUCLEO no apps-script.gs: SHEET_ID (da planilha nova de 5
#    abas) e CHAVE (a mesma que está no site)

# 5. publicar: sobe o código e aponta o deployment que já está no ar
./publicar-motor.ps1 -Nota "motor v2: config na planilha, cancelamento"
```

### Por que não tem `-PrimeiraVez` aqui

O `.deployment-id` **já vem preenchido no repositório** com o deployment
que está no ar:

```
AKfycbz8Ru6MWqpabFjvHY5SEs31NTsEoYjG4ZCY74xlQNxRtIqlzY2RY-YXisGvulgbTerErQ
```

Ele saiu da própria URL do site: em
`https://script.google.com/macros/s/<ID>/exec`, o pedaço entre `/s/` e
`/exec` **é** o deployment id. Por isso o `publicar-motor.ps1` já sabe
qual App da Web atualizar, e a URL não muda.

`-PrimeiraVez` só existe pro caso de um projeto novo, do zero (outro
cliente). Rodar aqui criaria um segundo deployment com outra URL — o
script recusa se o `.deployment-id` já existir.

Na 1ª vez que o motor v2 rodar, o Google pede autorização dos escopos
novos (o `send_mail` do aviso por email não existia na v1). É a conta do
João autorizando o próprio script. Tela "app não verificado" é normal:
**Avançado → Acessar (não seguro)**.

### Testar o motor antes de ligar no site

```powershell
clasp run testar
```

Se `clasp run` reclamar de credenciais/escopos, roda a função `testar`
pelo editor uma vez (`clasp open-script` abre o projeto no navegador).
Tem que aparecer no log: nome da agenda, WhatsApp da Config, serviços
ativos, expediente de hoje e horários livres.

---

## Passo 3: ligar no site

No `site/index.html`, procurar `var AGENDA` e preencher `URL` (a `/exec`) e
`CHAVE` (a mesma do `NUCLEO`). Depois `/publicar-site`. Detalhe no
`INSTALAR.md`, passo 5.

---

## Rotina: mudou o código

Toda vez que editar o `apps-script.gs`:

```powershell
cd clientes/joao-barber/agendamento
./publicar-motor.ps1 -Nota "o que mudou"
```

O script faz `clasp push` + publica **nova versão** do App da Web. A URL
`/exec` **não muda**. É o que substitui o "Implantar → Gerenciar
implantações → Nova versão" do editor.

Mudou só a planilha (serviços, horário, regras)? Nada a fazer — o motor
relê sozinho em até 2 min.

Editaram o código pelo navegador e você quer trazer de volta:

```powershell
clasp pull
```

(cuidado: sobrescreve o `apps-script.gs` local com o que está na conta)

---

## Entrega pro João: tirar o acesso da máquina do Miguel

Quando o João assumir a conta. Fazer **tudo**, na ordem:

1. **Logout do clasp**
   ```powershell
   clasp logout
   ```
   Isso apaga o token. Confirme:
   ```powershell
   clasp show-authorized-user   # tem que dizer que não há ninguém autorizado
   ```

2. **Apagar o `.clasprc.json`**, se sobrou
   - fica em `C:\Users\<usuário>\.clasprc.json` (e às vezes uma cópia na
     pasta do projeto). Apagar os dois.
   ```powershell
   Remove-Item "$HOME\.clasprc.json" -ErrorAction SilentlyContinue
   Remove-Item ".\.clasprc.json" -ErrorAction SilentlyContinue
   ```

3. **Apagar o `.clasp.json` local** (não é segredo, mas sem ele o
   `publicar-motor.ps1` não roda por engano)
   ```powershell
   Remove-Item ".\.clasp.json" -ErrorAction SilentlyContinue
   ```
   O `.deployment-id` pode ficar: é o mesmo id que já está na URL pública
   do site, não dá acesso a nada sozinho.

4. **Revogar o acesso do clasp na conta do João** (o passo que de fato
   corta o vínculo): logado na conta do João em
   https://myaccount.google.com/connections → achar **clasp** (ou "Google
   Apps Script CLI") → **Remover acesso**.

5. **Sair da conta do João no navegador** — remover o perfil/inícios de
   sessão usados no setup. Se usou uma janela anônima, só fechar.

6. **Conectores da claude.ai**, se algum foi apontado pra conta do João
   durante o setup (Google Agenda / Drive / Gmail): claude.ai →
   Configurações → Conectores → desconectar. Os conectores do dia a dia
   do Miguel são das contas **dele** (`miguelcerpeixoto@gmail.com` e a de
   estudante) e continuam normais.

7. **Entregar ao João**: email da conta, senha, e ativar a verificação em
   duas etapas com o telefone dele. A partir daí, mudança no motor só com
   ele refazendo o `clasp login`, ou pelo editor do Apps Script.

Depois disso, a máquina do Miguel não tem mais acesso a nada da conta do
João. Pra mexer no motor de novo, é refazer o Passo 2 (login).

---

## Problemas comuns

| Sintoma | Causa / solução |
|---|---|
| `User has not enabled the Apps Script API` | Passo 0.2: ligar em script.google.com/home/usersettings |
| `clasp push` sobe arquivo demais | conferir o `.claspignore` desta pasta (só `appsscript.json` e `apps-script.gs` sobem) |
| `clasp: command not found` | `npm install -g @google/clasp`; reabrir o terminal |
| Publiquei mas o site não mudou | o site lê `acao=config` com cache de 120s; e mudança de código exige o `create-deployment` (o `publicar-motor.ps1` já faz) |
| `clasp create` reclama que já existe `.clasp.json` | apagar o `.clasp.json` ou usar `clasp clone <scriptId>` |
| Publiquei e apareceu uma URL `/exec` diferente | usaram `create` ou `-PrimeiraVez` num projeto que já existia. O motor certo é o do `.deployment-id`; apagar o deployment/script extra em `clasp list-deployments` / `clasp list-scripts` |
| `clone` sobrescreveu o `apps-script.gs` com a versão antiga | `git checkout clientes/joao-barber/agendamento/apps-script.gs` |
| Logado na conta errada | `clasp logout` → `clasp login` de novo, conferindo o email na tela (`clasp show-authorized-user` mostra quem está) |
| `clasp deploy` gerou uma URL nova | não usar `clasp deploy` solto pra atualizar: cada chamada cria um deployment novo. O `publicar-motor.ps1` atualiza o mesmo (`update-deployment`) |

---

## Opcional: o Claude mexendo no motor direto

O clasp v3 traz um servidor MCP (`clasp mcp`). Dá pra registrar no Claude
Code, logado na conta do João, e aí o Claude faz `push` / `deploy` / lê
log sem passar pelo `publicar-motor.ps1`:

```powershell
claude mcp add clasp-joao -- clasp mcp
```

Mesma regra de sempre: é acesso à conta do João. Ao entregar, remover o
servidor (`claude mcp remove clasp-joao`) além do checklist acima.

---

## Referências

- clasp (Google): https://developers.google.com/apps-script/guides/clasp
- repositório: https://github.com/google/clasp
- comandos v3: `create`/`clone`/`deploy` são apelidos de
  `create-script`/`clone-script`/`create-deployment`
