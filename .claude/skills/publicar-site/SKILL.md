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

## Pré-requisito: o token (uma vez na vida)

```bash
test -s .claude/.netlify-token && echo "TOKEN OK" || echo "SEM TOKEN"
```

Se aparecer `SEM TOKEN`, **parar** e passar isso pro usuário:

> 1. Abre https://app.netlify.com/user/applications
> 2. Em **Personal access tokens**, clica em **New access token**, dá um
>    nome (`MazyOS`) e copia o código
> 3. Cola no teu PowerShell, dentro da pasta do projeto:
>    ```powershell
>    'O_TOKEN_AQUI' | Out-File -NoNewline -Encoding ascii .claude\.netlify-token
>    ```
> 4. Me avisa que tá pronto

Não pedir o token no chat. Não repetir o valor dele em resposta nenhuma.
O arquivo já está no `.gitignore`.

---

## Publicar

Descobrir de qual cliente se trata. A pasta é `clientes/<cliente>/site`.

### 1. Conferir a pasta e carregar o token

```bash
export NETLIFY_AUTH_TOKEN=$(cat .claude/.netlify-token)
ls clientes/<cliente>/site/index.html
```

### 2. Criar o projeto, se for a primeira vez do cliente

Existe projeto quando `clientes/<cliente>/.netlify-site-id` existe.
Se não existir:

```bash
SLUG=$(npx -y netlify-cli@latest api listAccountsForUser --json 2>/dev/null \
  | grep -o '"slug":"[^"]*"' | head -1 | sed 's/.*:"//;s/"//')

npx -y netlify-cli@latest sites:create \
  --name <cliente>-<3 letras aleatórias> \
  --account-slug "$SLUG" --json > /tmp/novo-site.json

grep -o '"site_id":"[^"]*"' /tmp/novo-site.json | head -1 \
  | sed 's/.*:"//;s/"//' > clientes/<cliente>/.netlify-site-id
```

O `--name` vira o endereço (`<nome>.netlify.app`) e precisa ser único no
Netlify inteiro, por isso as três letras no fim. Se der erro de nome em
uso, tentar de novo com outro sufixo.

Commitar o arquivo `.netlify-site-id`, ele é o que garante que o link não
muda nas próximas publicações.

### 3. Publicar

```bash
npx -y netlify-cli@latest deploy \
  --dir clientes/<cliente>/site \
  --site $(cat clientes/<cliente>/.netlify-site-id) \
  --prod --json
```

O link está no campo `ssl_url` da resposta.

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
