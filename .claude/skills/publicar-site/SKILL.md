---
name: publicar-site
description: Publica ou atualiza o site de um cliente no ar, de graça, pelo Netlify. Use quando o usuário disser "publicar o site", "colocar no ar", "subir o site do <cliente>", "atualizar o site", "/publicar-site" ou pedir um link real pra mandar pro cliente.
---

# Publicar site

Coloca a pasta `site/` de um cliente no ar e devolve um link público, que
abre em qualquer celular sem login. Grátis, sem cartão.

Existem dois caminhos. **O caminho 1 é o padrão.** O caminho 2 é reserva,
pra quando o site não estiver ligado ao Git.

---

## Caminho 1: automático pelo GitHub (padrão)

O repositório `CodePeixoto/ProjetosPeixoto` está ligado ao Netlify. Cada
`git push` na `main` republica o site sozinho, em cerca de um minuto.

Então publicar é só salvar:

```bash
git add -A
git commit -m "<o que mudou>"
git push
```

Ou usar a skill `/salvar`, que faz o mesmo.

Depois, confirmar pro usuário que o push saiu e que o Netlify leva cerca
de um minuto. Se ele quiser acompanhar, o painel fica em
https://app.netlify.com, na aba **Deploys** do projeto.

**Quando o cliente for novo** e ainda não tiver site ligado no Netlify,
o usuário precisa criar o projeto uma vez, pela interface:

1. Netlify, **Add new project** → **Import an existing project** → GitHub
2. Escolher `CodePeixoto/ProjetosPeixoto`
3. Nas configurações de build:
   - Branch: `main`
   - Base directory: vazio
   - Build command: vazio
   - **Publish directory:** `clientes/<cliente>/site`
4. Deploy

Cada cliente vira um projeto separado no Netlify, apontando pra uma pasta
diferente do mesmo repositório.

---

## Caminho 2: pela linha de comando (reserva)

Serve quando não dá pra usar o Git, ou pra publicar uma pasta que não
está no repositório.

Precisa do token pessoal do Netlify. Conferir se já existe:

```bash
cat .claude/.netlify-token 2>/dev/null || echo "SEM TOKEN"
```

Se aparecer `SEM TOKEN`, passar essas instruções pro usuário e parar:

1. Abrir https://app.netlify.com/user/applications
2. Em **Personal access tokens**, criar um novo e copiar
3. Salvar **no PowerShell dele**, não colando no chat:
   ```powershell
   'O_TOKEN' | Out-File -NoNewline -Encoding ascii .claude\.netlify-token
   ```

Com o token no lugar:

```bash
export NETLIFY_AUTH_TOKEN=$(cat .claude/.netlify-token)

# primeira vez do cliente: cria o projeto
SLUG=$(npx -y netlify-cli@latest api listAccountsForUser 2>/dev/null | grep -o '"slug": *"[^"]*"' | head -1 | sed 's/.*: *"//;s/"//')
npx -y netlify-cli@latest sites:create --name <cliente>-<3 letras> --account-slug "$SLUG" --json > /tmp/site.json
grep -o '"site_id": *"[^"]*"' /tmp/site.json | head -1 | sed 's/.*: *"//;s/"//' > clientes/<cliente>/.netlify-site-id

# publicar
npx -y netlify-cli@latest deploy \
  --dir clientes/<cliente>/site \
  --site $(cat clientes/<cliente>/.netlify-site-id) \
  --prod --json
```

O link está no campo `ssl_url` da resposta.

Nunca escrever o token em arquivo versionado nem repetir ele no chat.

---

## Antes de publicar, checar

Publicar é público. Qualquer um com o link vê.

- [ ] **A mídia é do cliente?** Foto de banco de imagem ou de outra
      barbearia em site comercial é problema de direito autoral, e o
      público local percebe na hora
- [ ] Sobrou algum `<!-- PLACEHOLDER -->` no HTML?
- [ ] Telefone, WhatsApp e Instagram estão certos?
- [ ] O cliente aprovou o conteúdo? Site no ar é a cara dele

Se algum item falhar, avisar e perguntar antes de publicar.

### Bloqueio de indexação

Enquanto o site não tiver a mídia real, ele fica com `robots.txt` e a
meta tag `noindex`. O link funciona pra quem receber, mas não aparece no
Google.

**Quando o material real do cliente entrar, remover os dois**, senão o
site nunca vai ser encontrado. No João Barber os dois estão marcados com
comentário dizendo isso.

---

## Domínio próprio

O endereço `.netlify.app` é grátis e funciona pra sempre. Pra trocar por
um domínio de verdade (ex: `joaobarber.com.br`), o registro é feito **pelo
cliente** em https://registro.br (em torno de R$ 40 por ano) e apontado no
painel do Netlify, em **Domain settings**. O DNS leva algumas horas.

Domínio no nome do freelancer vira refém quando a relação termina. Quem
paga e registra é o cliente.

---

## Se der errado

- **O repositório não aparece na lista do Netlify.** O app do Netlify no
  GitHub foi instalado com acesso só a alguns repositórios. Na tela de
  seleção, usar a opção de configurar o app e liberar o repositório novo
- **Deploy sai vazio ou dá 404.** O `Publish directory` está apontando pra
  pasta errada. Tem que ser a pasta que contém o `index.html`
- **`npx` demora na primeira vez.** Ele baixa o Netlify CLI. Normal
- **`Not authorized` no caminho 2.** Token errado ou revogado
