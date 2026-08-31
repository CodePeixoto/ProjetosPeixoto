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
| `SEGURANCA.md` | Auditoria de segurança e privacidade (31/08/2026), o plano de ação e o termo de imagem. Ler antes de mexer no agendamento |
| `NOTAS-SITE.md` | Documentação técnica do site e da tela de agendamento. **Mora fora de `site/`** de propósito: tudo que está dentro daquela pasta vai pro ar e fica baixável pela internet |
| `agendamento/` | Apps Script (`apps-script.gs`), instalação (`INSTALAR.md`), índice dos dados (`INDICE.md`), relacionamento/recall (`RELACIONAMENTO.md`), teste automático (`teste-motor.js`), e o fluxo por terminal: `CLASP.md` + `publicar-motor.ps1` + `appsscript.json` |

Mídia bruta fica em `midia-original/` (fora do Git). Carrossel em
`carrossel/`. Quando o site for publicado, aparece um `.netlify-site-id`
com o id do projeto na Netlify. Esse arquivo não deve ser apagado: é ele
que mantém o endereço estável entre publicações.

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
- **Site no ar em `joao-barber-aqz.netlify.app`**, mas escondido: sobe com
  `noindex`, `robots.txt` de bloqueio e proteção de senha da Netlify, os
  dois primeiros marcados com comentário pra remover. Só abrir de verdade
  quando a mídia for do João. Id do projeto em `.netlify-site-id`, que
  mantém o endereço estável entre publicações (não apagar)
- **A tela de agendamento vive dentro do `site/index.html`**, não em
  arquivo separado. Procurar por `var AGENDA` pra achar a configuração
- **Agendamento v2 (29/08/2026):** serviços, expediente e regras moram na
  **planilha** (abas Config, Serviços, Expediente), não mais no código.
  O motor lê de lá e o site pega a lista via `acao=config`. A cópia no
  `index.html` (bloco "fallback de serviços e expediente") só vale no
  modo demonstração. Índice completo dos dados em
  `agendamento/INDICE.md`
- O motor roda na conta Google do João, **já clonado e ligado** via
  `clasp`. Mudou o `apps-script.gs`? `./publicar-motor.ps1 -Nota "..."`
  na pasta `agendamento/` faz push + nova versão, e a URL `/exec` não
  muda. Setup e checklist de entrega em `agendamento/CLASP.md`
- As 5 abas da planilha são montadas pela função **`montarPlanilha`**
  dentro do próprio motor (é idempotente, seguro rodar de novo). O Claude
  não alcança a planilha: os conectores do Google são das contas do
  Miguel, e ela vive na conta do João
- **Escopo novo no motor exige autorização manual** do dono da conta, na
  tela do navegador. Nenhum comando pula isso. Se o `apps-script.gs`
  passar a usar um serviço Google novo, o Miguel tem que abrir o editor e
  rodar qualquer função uma vez
- `clasp` roda logado na conta do João. Quando ele assumir, seguir a
  seção "Entrega pro João" do `CLASP.md`: `clasp logout`, apagar
  `.clasprc.json` / `.clasp.json`, revogar o acesso em
  myaccount.google.com/connections. `.clasprc.json` e `.clasp.json` estão
  no `.gitignore` da raiz
- Com `URL` e `CHAVE` vazias no bloco `AGENDA`, o site roda em modo
  demonstração e avisa isso na tela. Hoje está ligado (motor real)
- Cada agendamento gera um **código** de 4 letras; o cliente desmarca
  pelo site com ele, até o limite de horas da aba Config
- **Camada 3 de relacionamento (30/08/2026):** dois gatilhos de tempo no
  motor (`resumoSemanal`, `confirmacoesDoDia`) mandam email pro João com
  link de WhatsApp pronto por pessoa: recall, aniversário, datas
  comemorativas e confirmação do dia seguinte. Nada dispara sozinho, o
  João envia um por um. Abas novas: `Mensagens` (textos) e `Datas`
  (calendário). Ligado por `instalarGatilhos` (uma vez). Detalhe e o
  caminho pra API oficial do WhatsApp em `agendamento/RELACIONAMENTO.md`
- **Janela de agenda: 14 dias** (aba Config), curta de propósito pra
  deixar margem de imprevisto. Default do código já é 14; numa planilha
  antiga o valor tem que ser trocado à mão
- Escopos do motor agora incluem `script.scriptapp` e `userinfo.email`
  (camada 3). Escopo novo = reautorizar pelo editor, como diz o item
  acima sobre autorização manual
- **Segurança e LGPD (31/08/2026):** auditoria inteira em `SEGURANCA.md`.
  O que mudou no comportamento e não pode ser desfeito sem pensar:
  desmarcar exige **código mais os 4 últimos dígitos do WhatsApp**; o
  motor só aceita horário que ele mesmo ofereceria; existem freios de
  marcação e de tentativa de cancelamento; campo isca contra robô no
  formulário; `site/_headers` com CSP na Netlify; `site/privacidade.html`
  linkada no rodapé e no formulário; faxina mensal que anonimiza cliente
  sem retorno há 24 meses; coluna "Não enviar" na aba Clientes pro
  opt-out
- **Mexeu no `apps-script.gs`? Rode `node teste-motor.js` antes de
  publicar.** São 44 verificações, quase todas de segurança. Falhou
  alguma, não publica
- Nada do que entrou em 31/08 pede escopo Google novo (só `CacheService`,
  que não usa escopo), então **não precisa reautorizar**. Mas precisa
  rodar `montarPlanilha` (cria a linha "Guardar dados por" e a coluna
  "Não enviar") e `instalarGatilhos` (liga a faxina mensal) uma vez
