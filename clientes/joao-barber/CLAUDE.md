# João Barber (João Lucas)

> Projeto criado em 2026-08-09. Pasta dedicada, instruções aqui
> sobrescrevem as da raiz quando relevantes.

## Onde está tudo

Quatro arquivos, de propósito. Não criar arquivo novo sem necessidade
real: o que for contexto do projeto entra no `projeto.md`.

| Arquivo | O que é |
|---|---|
| `projeto.md` | O projeto inteiro: cliente, escopo, plano, preço, riscos |
| `conversa-dialogo.md` | Transcrição bruta da conversa de 17/08. Fonte, não se edita |
| `identidade.md` | Identidade visual dele. Separado porque é consultado a cada peça |
| `site/NOTAS.md` | Documentação técnica do site |
| `agendamento/` | Apps Script do agendamento e o passo a passo de instalação |

Mídia bruta fica em `midia-original/` (fora do Git). Carrossel em
`carrossel/`. O arquivo `.netlify-site-id` guarda o id do projeto na
Netlify e não deve ser apagado: é ele que mantém o endereço do site
estável entre publicações.

## Regra que filtra qualquer entrega nova

O João quer abrir a própria barbearia em Sobradinho (shopping ou quadras
14 a 17 / Alto da Boa Vista). Antes de propor qualquer coisa, perguntar:
**"se ele sair da Rota 020 amanhã, isso vai junto com ele?"**. Se não for,
não entra.

## Contexto que herda da raiz

Esse projeto herda o tom de voz e contexto do negócio de `_memoria/` da
raiz. **Identidade visual é exceção:** o João Lucas tem marca própria
(dourado + preto), separada da Barbearia Rota 020. Usar sempre o
`identidade.md` dessa pasta, nunca o `identidade/design-guide.md` da raiz,
que é a marca do Miguel.

## Específico desse projeto

- Dourado `#C9A227` sobre preto `#0E0E0E`, fonte Oswald, estilo editorial.
  Logo real ainda pendente, usar wordmark em texto até o arquivo chegar
- A marca é do João Lucas, não da Rota 020 onde ele trabalha
- Preço fechado: R$ 300 de implementação e R$ 200 por mês
- Site publicado em https://joao-barber-k7x.netlify.app, ainda fechado
  pra visitante e com `noindex`, porque a mídia atual não é dele
