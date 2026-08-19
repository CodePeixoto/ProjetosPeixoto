# Empresa

> Memória central do negócio. O Claude lê esse arquivo antes de cada resposta.
> Preenchido pelo `/instalar`. Você pode editar a qualquer momento.

**Nome:** Miguel · Marketing Digital
**Negócio:** Freelancer prestando serviço de marketing digital (sites, Meta Ads, Google Ads, Google Meu Negócio, conteúdo/redes sociais)
**O que faz:** Ainda em fase de aprendizado e primeiro case. Está estruturando site, anúncios (Meta Ads, Google Ads), GMB e conteúdo de redes sociais pra clientes locais.
**Perfil:** Freelancer
**Atende clientes:** Primeiro cliente fechado (verbalmente) em 17/08/2026: João Lucas, 21 anos, barbeiro na Barbearia Rota 020 com CNPJ próprio, atende a domicílio, identificado no Instagram como "João Barber". É amigo próximo do Miguel. Disse sim ao pacote. Preço fechado: R$ 300 de implementação e R$ 200 por mês, aceito por ele. O pagamento começa por volta de meados de setembro/2026.
**Equipe:** Sozinho.
**Ferramentas:** GitHub (repositório `mazzeoia/MazyOS`), Netlify (hospedagem, ligada no GitHub, publica a cada push), Google Agenda + Planilhas + Apps Script (motor do agendamento) e Google Meu Negócio. Canva, Metricool e Firecrawl seguem em uso esporádico, fora do fluxo de cliente. Ver `CLAUDE.md`.
**Principais entregas:** Site, **agendamento online** (Google Agenda + planilha + WhatsApp, sem mensalidade de ferramenta), carrossel/conteúdo pra Instagram, Google Meu Negócio, Meta Ads e Google Ads. Preço praticado: R$ 300 de implementação e R$ 200 por mês.

## Contexto adicional

Miguel está no início da carreira como freelancer de marketing digital. Ainda não vendeu nenhum serviço. O objetivo de médio prazo é ganhar experiência real através do case do João Lucas, aprender a precificar, vender e conduzir clientes, e no futuro construir um negócio/ecossistema próprio maior.

## Já entregue no case João Barber (agosto/2026)

Feito, mas **ainda não apresentado a ele**:

- **Site completo** em `clientes/joao-barber/site/`: página única em HTML, CSS e JS puros, sem framework nem build. Seis blocos (hero, sobre, serviços, trabalhos, a domicílio, contato) mais rodapé. Hero com fotos em loop e vídeo de fundo, animações de entrada, mapa da barbearia e CTA pro WhatsApp em vários pontos
- **Identidade visual dele** em `clientes/joao-barber/identidade.md`: dourado `#C9A227` sobre preto `#0B0B0B`, fonte Oswald, estilo editorial. Separada da Barbearia Rota 020, onde ele trabalha
- **Briefing** em `clientes/joao-barber/briefing.md`
- **Roteiro da primeira conversa** em `clientes/joao-barber/conversa-com-joao.md`, com as perguntas de diagnóstico e o checklist do que trazer de volta

Pendente pra publicar: fotos e vídeo reais do João (o material atual é de exemplo e não é dele), retrato dele pra seção Sobre, preços e horários.

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

## Publicação de sites

Skill `/publicar-site` sobe a pasta `site/` de qualquer cliente pro
Netlify e devolve link público, de graça. Precisa do token pessoal do
Netlify salvo em `.claude/.netlify-token` (fora do Git).
