# João Barber · registro de tratamento de dados

> Documento interno. **Não vai pro ar**, mora fora de `site/`.
> Criado em 31/08/2026, depois de conferir o sistema contra o texto
> oficial da Lei 13.709/2018 e a Resolução CD/ANPD nº 2/2022.
>
> Ele existe por dois motivos concretos:
>
> 1. O art. 37 da LGPD obriga o controlador a manter registro das
>    operações de tratamento, **"especialmente quando baseado no
>    legítimo interesse"**. O recall e o aniversário do João são
>    exatamente isso
> 2. O art. 6, inciso X, cobra "responsabilização e prestação de
>    contas": não basta cumprir, tem que conseguir demonstrar
>
> A Resolução CD/ANPD nº 2/2022, art. 9, permite que agente de pequeno
> porte mantenha esse registro **de forma simplificada**. É o que este
> arquivo é.

---

## 1. Quem é quem

| Papel | Quem | O que faz |
|---|---|---|
| **Controlador** | João Lucas, barbeiro, MEI *(CNPJ pendente)* | Decide o que é coletado e por quê. Responde perante o titular e a ANPD |
| **Operador** | Miguel, prestador de serviço | Montou e mantém o site e o motor. Age conforme instrução do controlador (art. 39) |
| **Encarregado** | Não indicado | Dispensado pelo art. 11 da Res. CD/ANPD 2/2022. O canal de comunicação exigido no lugar é o WhatsApp e o email do agendamento |

**Suboperadores**, quem entra na cadeia por baixo: Google (Agenda,
Planilhas, Apps Script), Netlify (hospedagem), Meta (WhatsApp).

---

## 2. Registro das operações

### 2.1 Agendamento de horário

| Item | Conteúdo |
|---|---|
| **Finalidade** | Marcar, confirmar, lembrar e desmarcar um atendimento |
| **Base legal** | Art. 7, V: execução de contrato a pedido do titular |
| **Dados** | Nome, WhatsApp, serviço, dia, hora, local, endereço (só a domicílio), observação sobre o corte |
| **Titulares** | Clientes do João. Menor de idade é agendado pelo responsável |
| **Onde fica** | Google Agenda e Planilha, na conta `joaobarber.agenda@gmail.com` |
| **Quem acessa** | João. O Miguel tem acesso técnico enquanto durar a prestação |
| **Prazo** | 24 meses da última visita. Depois, anonimização automática |
| **Transferência internacional** | Sim, servidores do Google e da Netlify fora do Brasil. Base: art. 33, IX, combinado com art. 7, V |

### 2.2 Recall: lembrar quem sumiu

| Item | Conteúdo |
|---|---|
| **Finalidade** | Avisar quem já é cliente que faz tempo do último corte |
| **Base legal** | **Art. 7, IX: legítimo interesse.** É o tratamento que faz este registro ser obrigatório |
| **Dados** | Nome, WhatsApp, data da última visita |
| **Prazo** | Some junto com o cadastro, aos 24 meses |
| **Como sair** | Pedir ao João, por qualquer canal. Ele escreve "sim" na coluna "Não enviar" e a pessoa sai das listas |

**Teste de legítimo interesse** (art. 10), que é o que a ANPD pediria:

- **Finalidade legítima:** manter relação com quem já é cliente, o que o
  art. 10, I chama de apoio e promoção das atividades do controlador
- **Necessidade:** usa só nome, telefone e data da última visita. Nada
  além, como manda o art. 10, §1
- **Expectativa do titular:** quem marca corte com um barbeiro espera ser
  lembrado por ele. Não é lista comprada nem contato frio
- **Salvaguardas:** saída em uma palavra, coluna "Não enviar" na
  planilha, e nada dispara sozinho. O motor monta a lista, o João lê e
  envia um por um

### 2.3 Aniversário

| Item | Conteúdo |
|---|---|
| **Finalidade** | Mandar parabéns |
| **Base legal** | Art. 7, I: consentimento. O campo é opcional e a finalidade está escrita ao lado dele |
| **Dados** | Dia e mês. **O ano não é pedido**, de propósito |
| **Como revogar** | Apagar a data na planilha, ou a mesma coluna "Não enviar" |

### 2.4 Origem: "como você me achou"

| Item | Conteúdo |
|---|---|
| **Finalidade** | Saber que divulgação traz cliente |
| **Base legal** | Art. 7, IX: legítimo interesse |
| **Salvaguardas** | Opcional, tem "prefiro não dizer", e não alimenta propaganda apontada pra ninguém |

### 2.5 Registro de acesso ao site

| Item | Conteúdo |
|---|---|
| **Finalidade** | Manter o site no ar e protegido |
| **Base legal** | Art. 7, IX: legítimo interesse |
| **Dados** | Endereço IP, data e hora, guardados pela Netlify |
| **Observação** | O João não consulta nem cruza esse log. Nenhum cookie é criado, medido com navegador em 31/08/2026 |

---

## 3. O que o sistema **não** faz

Vale registrar, porque muda o que a lei cobra:

- **Não trata dado sensível** (art. 5, II). Não pergunta saúde, religião,
  origem, opinião nem biometria. O único caminho por onde isso poderia
  entrar é o campo livre de observação, e por isso ele passou a avisar
  pra falar de saúde pessoalmente
- **Não toma decisão automatizada** (art. 20). Nada aprova, recusa ou
  classifica ninguém. Quem confirma o horário é o João
- **Não faz perfil comportamental** nem propaganda apontada
- **Não usa cookie, analytics ou pixel.** Isso muda no dia do Meta Pixel,
  e aí este documento muda junto
- **Não pede CPF, RG nem dado de pagamento**
- **Não vende, troca ou empresta a lista pra ninguém**

---

## 4. Política simplificada de segurança da informação

Permitida pelo art. 13 da Res. CD/ANPD 2/2022, que manda considerar
"custos de implementação" e "estrutura, escala e volume". O detalhe
técnico de cada item está em `SEGURANCA.md`.

| Medida | Como está |
|---|---|
| Controle de acesso | Conta Google única, senha forte e verificação em duas etapas |
| Canal criptografado | HTTPS obrigatório no site, com HSTS no `_headers` |
| Minimização | Seis campos, dois obrigatórios. Sem CPF, sem pagamento |
| Validação de entrada | O motor recusa horário fora do expediente, telefone inválido e campo gigante |
| Contra abuso | Freio de marcação por número e por hora, freio de tentativa de cancelamento, campo isca contra robô |
| Autenticação do cancelamento | Código de 4 letras **mais** os 4 últimos dígitos do WhatsApp |
| Proteção no navegador | CSP, anti-iframe e Permissions-Policy no `_headers` |
| Eliminação | Faxina mensal automática aos 24 meses |
| Registro de alteração | Todo o código versionado em repositório privado no GitHub |
| Teste | 44 verificações automáticas, rodadas antes de cada publicação |

---

## 5. Plano de resposta a incidente

O art. 48 da LGPD obriga comunicar à ANPD **e ao titular** o incidente
que possa trazer risco relevante. O art. 14, II da Res. 2/2022 dá prazo
em dobro pra agente de pequeno porte, **menos** quando houver potencial
comprometimento à integridade física.

O que conta como incidente aqui: alguém entrar na conta
`joaobarber.agenda@gmail.com`, a planilha ser compartilhada por engano,
o celular do João ser perdido logado, ou o motor passar a devolver dado
de cliente pra quem não devia.

**Nas primeiras horas**

1. Trocar a senha da conta Google e encerrar todas as sessões abertas
2. Conferir `myaccount.google.com/security` e o histórico de acesso
3. Revogar qualquer aplicativo conectado que não seja reconhecido
4. Avisar o Miguel, pra ele conferir motor, planilha e permissões

**Depois, pra decidir se comunica**

Pergunta única: esse vazamento pode trazer risco relevante pra alguém?
Uma lista com nome, telefone e **endereço de casa** de clientes é risco
relevante. Na dúvida, comunica.

**A comunicação precisa dizer** (art. 48, §1). Escrever nesta ordem:

1. Que dados foram atingidos
2. Quantos e quais titulares
3. Que medidas de segurança existiam
4. Quais os riscos pra essas pessoas
5. Por que demorou, se demorou
6. O que foi feito e o que vai ser feito pra reverter

**Pra quem:** ANPD, pelo canal em `gov.br/anpd`, e cada pessoa atingida,
pelo WhatsApp que já está no cadastro.

---

## 6. Conferência contra a lei, feita em 31/08/2026

| Artigo | O que cobra | Situação |
|---|---|---|
| Art. 6, I a IX | Princípios | Atendidos |
| Art. 6, X | Prestação de contas | **Este documento é a resposta.** Antes não existia |
| Art. 7 | Base legal por finalidade | Cinco finalidades, cada uma com base declarada na página e aqui |
| Art. 9 | O que informar ao titular | Conferido item por item em 31/08 |
| Art. 10 | Requisitos do legítimo interesse | Teste registrado em 2.2 |
| Art. 11 | Dado sensível | Não trata. O campo livre passou a avisar |
| Art. 14 | Criança e adolescente | Agendamento pelo responsável, com aviso no formulário e seção na página |
| Art. 15 e 16 | Fim do tratamento e eliminação | Faxina automática aos 24 meses |
| Art. 18 | Direitos do titular | Os nove incisos na página |
| Art. 19 | Prazo de resposta | Imediato no simplificado, 15 dias no completo. Mais rigoroso que o dobro que a Res. 2/2022 permitiria |
| Art. 20 | Decisão automatizada | Não existe, e está dito |
| Art. 33 | Transferência internacional | Base declarada: art. 33, IX com art. 7, V |
| Art. 37 | Registro das operações | **Este documento.** Era a maior lacuna |
| Art. 39 | Operador segue o controlador | Pendente de acordo escrito entre Miguel e João |
| Art. 41 | Encarregado | Dispensado pelo porte, canal disponível |
| Art. 46 e 47 | Segurança | Seção 4, detalhe em `SEGURANCA.md` |
| Art. 48 | Incidente | **Seção 5.** Antes existia a promessa na página, sem procedimento nenhum |

### O que ficou pendente, e é de gente, não de código

1. **CNPJ e nome completo do João**, aqui e na página
2. **Email de contato** pro canal do titular
3. **Acordo escrito entre Miguel e João** (art. 39), dizendo quem
   controla, quem opera, e o que acontece com o acesso do Miguel no fim
4. **Autorização de imagem** de cada cliente que aparecer em foto. Texto
   pronto na seção 5 do `SEGURANCA.md`

> Nada aqui é parecer jurídico. É conferência técnica feita contra o
> texto da lei, suficiente pro porte do João, e não substitui advogado
> se um dia o negócio crescer.
