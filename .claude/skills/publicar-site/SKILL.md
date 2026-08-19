---
name: publicar-site
description: Publica ou atualiza o site de um cliente no ar, de graça, pelo Netlify. Use quando o usuário disser "publicar o site", "colocar no ar", "subir o site do <cliente>", "atualizar o site", "/publicar-site" ou pedir um link real pra mandar pro cliente.
---

# Publicar site

Sobe a pasta `site/` de um cliente pro Netlify e devolve um link real,
público, que abre em qualquer celular sem login. Grátis, sem cartão.

A primeira publicação de cada cliente cria o site. Da segunda em diante,
atualiza o mesmo endereço, então o link que o cliente já tem nunca muda.

---

## Antes de rodar: o token (só uma vez na vida)

O deploy precisa de um token pessoal do Netlify. Verificar se já existe:

```bash
cat .claude/.netlify-token 2>/dev/null || echo "SEM TOKEN"
```

Se aparecer `SEM TOKEN`, parar e passar essas instruções pro usuário:

1. Criar conta grátis em https://app.netlify.com/signup (dá pra entrar com o GitHub ou com email)
2. Abrir https://app.netlify.com/user/applications
3. Em **Personal access tokens**, clicar em **New access token**
4. Dar um nome qualquer (ex: `MazyOS`) e copiar o código gerado
5. Colar aqui no chat

Ao receber o código, salvar assim (o arquivo está no `.gitignore`, não vai
pro GitHub):

```bash
printf '%s' "COLE_O_TOKEN_AQUI" > .claude/.netlify-token
```

Nunca escrever o token dentro de um arquivo versionado, nem repetir ele
em resposta no chat.

---

## Publicar

Receber (ou perguntar) qual cliente. A pasta padrão é
`clientes/<cliente>/site`.

### 1. Carregar o token e conferir a pasta

```bash
export NETLIFY_AUTH_TOKEN=$(cat .claude/.netlify-token)
ls clientes/<cliente>/site/index.html
```

### 2. Se o cliente ainda não tem site criado

Existe site quando o arquivo `clientes/<cliente>/.netlify-site-id` existe.
Se não existir, criar:

```bash
SLUG=$(npx -y netlify-cli@latest api listAccountsForUser 2>/dev/null | grep -o '"slug": *"[^"]*"' | head -1 | sed 's/.*: *"//;s/"//')
npx -y netlify-cli@latest sites:create --name <cliente>-<3 letras aleatórias> --account-slug "$SLUG" --json > /tmp/site.json
grep -o '"site_id": *"[^"]*"' /tmp/site.json | head -1 | sed 's/.*: *"//;s/"//' > clientes/<cliente>/.netlify-site-id
```

O `--name` vira o endereço (`<nome>.netlify.app`) e precisa ser único no
Netlify inteiro, por isso as letras aleatórias no fim. Se der erro de nome
em uso, tentar de novo com outro sufixo.

### 3. Subir

```bash
npx -y netlify-cli@latest deploy \
  --dir clientes/<cliente>/site \
  --site $(cat clientes/<cliente>/.netlify-site-id) \
  --prod --json
```

Ler o campo `ssl_url` da resposta. Esse é o link pra entregar.

### 4. Confirmar

Mostrar o link e avisar em uma linha o que foi publicado (ex: "site do
João Barber no ar, com as fotos novas"). Se for a primeira publicação
daquele cliente, lembrar que esse link entra na bio do Instagram.

---

## Antes de publicar, checar

Não subir sem passar por isso. Publicar é público, qualquer um com o
link vê.

- [ ] **A mídia é do cliente?** Foto de banco de imagem ou de outra
      barbearia em site comercial é problema de direito autoral e o
      público local percebe na hora
- [ ] Sobrou algum `<!-- PLACEHOLDER -->` no HTML?
- [ ] Telefone, WhatsApp e Instagram são os certos?
- [ ] O cliente aprovou o conteúdo? Site no ar é a cara dele, não a sua

Se algum item falhar, avisar e perguntar antes de subir.

---

## Domínio próprio

O endereço `.netlify.app` funciona pra sempre e é grátis. Pra trocar por
um domínio de verdade (ex: `joaobarber.com.br`), o registro é feito pelo
cliente no https://registro.br (em torno de R$ 40 por ano) e depois
apontado no painel do Netlify, em **Domain settings**. O DNS leva algumas
horas pra propagar.

Quem paga o domínio é o cliente, e o registro fica no CPF ou CNPJ dele.
Domínio no nome do freelancer vira refém quando a relação termina.

---

## Se der errado

- **`npx` demora na primeira vez.** Ele baixa o Netlify CLI, é normal levar
  um minuto. Da segunda vez em diante é rápido
- **`Not authorized`.** Token errado ou revogado. Refazer o passo do token
- **Deploy sai vazio.** Conferir se apontou pra pasta que tem o
  `index.html` dentro, não pra pasta do cliente
