---
name: publicar-site
description: Publica ou atualiza o site de um cliente na Netlify e devolve o link pronto pra mandar. Cria o projeto sozinho na primeira vez. Use quando o usuário disser "publica o site do <cliente>", "coloca no ar", "sobe o site", "atualiza o site", "/publicar-site" ou pedir um link pra mandar pro cliente.
---

# Publicar site

O usuário pede, o Claude publica, o usuário recebe o link. Ele não abre
navegador, não clica em nada, não configura projeto.

Funciona pra qualquer pasta `clientes/<cliente>/site/`. Na primeira vez de
cada cliente, o projeto é criado automaticamente. Nas seguintes, atualiza
o mesmo endereço, então o link que o cliente já tem nunca muda.

---

## Pré-requisito: o token (uma vez por máquina)

**O token vive fora da pasta do projeto, nunca dentro dela.** Essa pasta
está sincronizada pelo OneDrive: qualquer arquivo salvo aqui aparece
sozinho nas duas máquinas do Miguel (notebook e PC), não tem como um
arquivo local "existir só numa delas". Por isso o token mora numa
**variável de ambiente do Windows**, que o OneDrive não sincroniza, e o
recomendado é **um token diferente por máquina** (assim, se uma delas for
perdida ou tiver a sessão comprometida, revoga só aquele token no painel
da Netlify, sem afetar a outra máquina).

```bash
test -n "$NETLIFY_AUTH_TOKEN" && echo "TOKEN OK" || echo "SEM TOKEN"
```

No Windows, o `setx` só vale pra terminais novos. Se a variável foi
criada agora e o `SEM TOKEN` insistir, dá pra ler direto do ambiente do
usuário sem reiniciar nada:

```powershell
$env:NETLIFY_AUTH_TOKEN = [Environment]::GetEnvironmentVariable('NETLIFY_AUTH_TOKEN','User')
```

Se aparecer `SEM TOKEN`, **parar** e passar isso pro usuário:

> 1. Abre https://app.netlify.com/user/applications
> 2. Em **Personal access tokens**, clica em **New access token**. Dê um
>    nome que identifique a máquina (ex: `MazyOS-Notebook` ou
>    `MazyOS-PC`), não reaproveite o mesmo token nas duas
> 3. Copia o código e cola **no PowerShell dessa máquina** (não precisa
>    estar na pasta do projeto):
>    ```powershell
>    setx NETLIFY_AUTH_TOKEN "O_TOKEN_AQUI"
>    ```
> 4. Fecha e abre o terminal de novo (o `setx` só vale pra sessões
>    novas), e me avisa que tá pronto

Não pedir o token no chat. Não repetir o valor dele em resposta nenhuma.

---

## Publicar

Descobrir de qual cliente se trata. A pasta é `clientes/<cliente>/site`.

### 1. Conferir a pasta e o token

```bash
ls clientes/<cliente>/site/index.html
```

**Rodar o deploy de dentro da pasta do cliente** (`cd clientes/<cliente>`
e `--dir site`). O Netlify CLI resolve o `--dir` a partir da pasta que
contém o `.netlify/`, então caminho relativo à raiz do repositório é
concatenado errado e dá "deploy directory has not been found".

### 2. Criar o projeto, se for a primeira vez do cliente

Existe projeto quando `clientes/<cliente>/.netlify-site-id` existe.
Se não existir:

O `netlify api` **não aceita `--json`** (é opção global do CLI, não do
subcomando) e `sites:create` também não. A saída vem como texto:

```powershell
# 1. descobrir o slug da conta
npx -y netlify-cli@latest api listAccountsForUser | ConvertFrom-Json |
  Select-Object -First 1 -ExpandProperty slug

# 2. criar o projeto (3 letras aleatórias no fim, pra o nome ser único)
npx -y netlify-cli@latest sites:create --name <cliente>-<3 letras> --account-slug <SLUG>
```

O `--name` vira o endereço (`<nome>.netlify.app`) e precisa ser único no
Netlify inteiro. Se der erro de nome em uso, tentar outro sufixo.

Copiar o **Project ID** da saída pra `clientes/<cliente>/.netlify-site-id`
e **commitar**: é ele que garante que o link não muda nas publicações
seguintes.

### 3. Publicar

**De dentro da pasta do cliente**, com `--dir site` (ver o aviso do
passo 1):

```powershell
cd clientes/<cliente>
npx -y netlify-cli@latest deploy --dir site --site <ID do .netlify-site-id> --prod
```

O link sai na linha **Production URL**. Se a saída disser
`CDN requesting 0 files`, é porque o conteúdo publicado já é idêntico ao
local: não é erro, é "nada mudou".

### 4. Entregar

Mostrar o link em destaque e dizer em uma linha o que foi publicado.
Se for a primeira vez daquele cliente, lembrar que esse endereço é
definitivo e serve pra bio do Instagram.

---

## Antes de publicar, checar

Publicar é público. Qualquer um com o link vê. Se algum item falhar,
avisar e perguntar antes de subir.

- [ ] **A mídia é do cliente?** Foto de banco de imagem ou de outra
      empresa em site comercial é problema de direito autoral, e o
      público local percebe na hora
- [ ] Sobrou algum `<!-- PLACEHOLDER -->` no HTML?
- [ ] Telefone, WhatsApp e redes sociais estão certos?
- [ ] O cliente aprovou o conteúdo? Site no ar é a cara dele

### Bloqueio de indexação

Site que ainda não tem a mídia real vai com `robots.txt` e a meta tag
`noindex`. O link funciona pra quem receber, mas não aparece no Google.

**Quando o material real entrar, remover os dois**, senão o site nunca é
encontrado. No João Barber os dois estão marcados com comentário.

---

## Domínio próprio

O endereço `.netlify.app` é grátis e funciona pra sempre. Pra trocar por
um domínio de verdade, o registro é feito **pelo cliente** em
https://registro.br (em torno de R$ 40 por ano) e apontado no painel do
Netlify, em **Domain settings**. O DNS leva algumas horas.

Domínio no nome do freelancer vira refém quando a relação termina. Quem
paga e registra é o cliente.

---

## Se der errado

- **`Not authorized`.** Token errado, revogado ou vencido. Refazer o
  passo do token
- **Nome em uso** no `sites:create`. Trocar o sufixo e rodar de novo
- **Deploy sai vazio ou dá 404.** O `--dir` está apontando pra pasta
  errada. Tem que ser a pasta que contém o `index.html`
- **`npx` demorando.** Só na primeira vez, ele baixa o Netlify CLI

---

## Alternativa: deploy automático pelo GitHub

Não é o fluxo padrão, mas existe. Se o usuário conectar o repositório
`CodePeixoto/ProjetosPeixoto` na interface do Netlify e apontar o
**Publish directory** pra `clientes/<cliente>/site`, todo `git push`
republica sozinho.

Vantagem: atualização sem comando nenhum. Desvantagem: cada cliente novo
exige criar o projeto na mão, pela interface. Por isso o caminho do token
é o padrão aqui.
