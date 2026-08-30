# Empresa

> Memória central do negócio. O Claude lê esse arquivo antes de cada resposta.
> Preenchido pelo `/instalar`. Você pode editar a qualquer momento.

**Nome:** Miguel · Marketing Digital
**Negócio:** Freelancer prestando serviço de marketing digital (sites, Meta Ads, Google Ads, Google Meu Negócio, conteúdo/redes sociais)
**O que faz:** Ainda em fase de aprendizado e primeiro case. Está estruturando site, anúncios (Meta Ads, Google Ads), GMB e conteúdo de redes sociais pra clientes locais.
**Perfil:** Freelancer
**Atende clientes:** Primeiro cliente fechado (verbalmente) em 17/08/2026: João Lucas, 21 anos, barbeiro na Barbearia Rota 020 com CNPJ próprio, atende a domicílio, identificado no Instagram como "João Barber". É amigo próximo do Miguel. Disse sim ao pacote. Preço fechado: R$ 300 de implementação e R$ 200 por mês, aceito por ele. O pagamento começa por volta de meados de setembro/2026.
**Equipe:** Sozinho.
**Ferramentas:** GitHub (repositório privado `CodePeixoto/ProjetosPeixoto`), Netlify (hospedagem, publicada pelo Claude via `/publicar-site`), Google Agenda + Planilhas + Apps Script (motor do agendamento), clasp (publica o motor pelo terminal) e Google Meu Negócio. Canva, Metricool e Firecrawl seguem em uso esporádico, fora do fluxo de cliente. Ver `CLAUDE.md`.
**Principais entregas:** Site, **agendamento online** (Google Agenda + planilha + WhatsApp, sem mensalidade de ferramenta), carrossel/conteúdo pra Instagram, Google Meu Negócio, Meta Ads e Google Ads. Preço praticado: R$ 300 de implementação e R$ 200 por mês.

## Contexto adicional

Miguel está no início da carreira como freelancer de marketing digital. Vendeu o primeiro serviço em 17/08/2026 (João Lucas), e o pagamento começa em meados de setembro. O objetivo de médio prazo é ganhar experiência real através desse case, aprender a precificar, vender e conduzir clientes, e no futuro construir um negócio/ecossistema próprio maior.

## Já entregue no case João Barber (agosto/2026)

- **Site completo** em `clientes/joao-barber/site/`: página única em HTML, CSS e JS puros, sem framework nem build. Seis blocos (hero, sobre, serviços, trabalhos, a domicílio, contato) mais rodapé, mais a tela de agendamento. **Mostrado ao João em 19/08.** No ar desde 27/08 em `joao-barber-aqz.netlify.app`, escondido do Google
- **Agendamento funcionando de ponta a ponta** (v2, 29/08): tela no site, motor em Apps Script na conta `joaobarber.agenda@gmail.com`, horários lidos da agenda real, evento criado, planilha alimentada, código de cancelamento e confirmação obrigatória no WhatsApp
- **Camada 3 de relacionamento** (30/08): recall, aniversário, datas comemorativas e confirmação do dia seguinte. Dois gatilhos de tempo no motor mandam email pro João com link de WhatsApp pronto por pessoa, ele envia um a um. Nada dispara sozinho (disparo automático só na API paga da Meta). Abas `Mensagens` e `Datas` na planilha. Detalhe em `clientes/joao-barber/agendamento/RELACIONAMENTO.md`. **Com isso a parte técnica do case fechou.**
- **Identidade visual dele** em `clientes/joao-barber/identidade.md`: dourado `#C9A227` sobre preto `#0E0E0E`, fonte Oswald, estilo editorial. Separada da Barbearia Rota 020, onde ele trabalha

Pendente pra abrir o site de verdade: fotos e vídeo reais do João (o material atual é de exemplo e não é dele), retrato dele pra seção Sobre, e o logo JB. Os dados de serviço, horário e preço agora se resolvem editando a planilha, não o código.

## Virada de rota depois da conversa gravada (17/08/2026)

A conversa de 29 minutos transcrita em `clientes/joao-barber/conversa-dialogo.md`
mudou o entendimento do case. O João não é um barbeiro com agenda vazia.
É um cara de 21 anos com plano de abrir a **própria barbearia** em
Sobradinho (shopping ou quadras 14 a 17 / Alto da Boa Vista), pensando em
2028. O diferencial que ele já pratica é a consulta antes do corte
("eu toco direto na dor do cliente").

Isso reposiciona o serviço do Miguel: não é encher a cadeira desta semana,
é **montar o ativo que ele leva junto quando abrir a casa dele**.

Escopo, plano e preço em `clientes/joao-barber/projeto.md`, que é o
arquivo único do cliente.

## Publicação

**Site:** skill `/publicar-site` sobe a pasta `site/` de qualquer cliente
pro Netlify e devolve link público, de graça. O token fica na variável de
ambiente `NETLIFY_AUTH_TOKEN` do Windows, **um por máquina** (a pasta é
sincronizada pelo OneDrive, então arquivo aqui dentro apareceria nas
duas).

**Motor do agendamento:** `clientes/<cliente>/agendamento/publicar-motor.ps1`
faz push e publica nova versão do Apps Script sem abrir navegador, com a
URL fixa. Precisa de `clasp login` na conta Google do cliente, uma vez
por máquina. Detalhe em `clientes/joao-barber/agendamento/CLASP.md`.
