# Acordo sobre os dados dos clientes

> Rascunho criado em 31/08/2026. **Ainda não assinado.**
>
> Por que ele existe: o art. 39 da LGPD diz que quem opera o sistema
> trata os dados conforme instrução de quem controla. Hoje o João é o
> controlador e o Miguel é o operador, mas isso nunca foi escrito. Sem
> registro, se acontecer alguma coisa não fica claro quem responde pelo
> quê.
>
> Como usar: ler junto com o João, ajustar o que estiver errado,
> imprimir em duas vias e assinar, ou assinar em PDF. Guardar uma cópia
> aqui na pasta com o nome `ACORDO-DADOS-assinado.pdf`.
>
> Isto é um acordo simples entre duas pessoas que se conhecem, escrito
> em português claro de propósito. Não é peça de advogado, e se o
> negócio crescer vale trocar por uma.

---

## Acordo sobre o tratamento de dados de clientes

**Entre:**

**João Lucas** *(nome completo pendente)*, barbeiro, CNPJ *(pendente)*,
que atende na Barbearia Espaço Rota 020 e a domicílio em Sobradinho DF.
Daqui pra frente, **o João**.

**Miguel** *(nome completo pendente)*, prestador de serviço de marketing
digital, CPF *(pendente)*. Daqui pra frente, **o Miguel**.

**Sobre o quê:** o site `joao-barber-aqz.netlify.app`, o sistema de
agendamento que roda na conta Google `joaobarber.agenda@gmail.com`, e os
dados de clientes que passam por eles.

---

### 1. Quem manda nos dados

Os dados dos clientes são **do João**. Ele é o controlador: decide o que
é coletado, pra que serve, por quanto tempo fica guardado e quem pode
ver.

O Miguel é o operador: montou e mantém as ferramentas, e só trata esses
dados pra fazer o sistema funcionar, seguindo o que o João determina.

Se um cliente reclamar, pedir cópia dos dados ou pedir pra apagar, quem
responde é o João. O Miguel ajuda no que for técnico.

### 2. O que o Miguel pode fazer

Só o necessário pra manter o serviço de pé:

- entrar na conta Google do João pra publicar correção no motor de
  agendamento e conferir se está funcionando
- ver a planilha e a agenda quando precisar resolver problema
- publicar mudança no site

E nada além disso. Especificamente, o Miguel **não pode**:

- copiar a lista de clientes pra fora, nem pra portfólio, nem pra
  exemplo, nem pra teste
- usar contato de cliente do João pra qualquer coisa que não seja o
  serviço do João
- passar os dados pra outra pessoa ou empresa sem o João autorizar por
  escrito
- mostrar a planilha ou a agenda com dado real em apresentação, proposta
  ou material de divulgação. Se precisar mostrar o sistema, usa dado
  inventado

### 3. Ferramentas de terceiros

O sistema usa Google (Agenda, Planilhas, Apps Script), Netlify
(hospedagem) e WhatsApp. O João sabe disso e concorda.

Se o Miguel precisar colocar uma ferramenta nova que veja dado de
cliente, avisa o João antes, e o João decide.

### 4. Segurança

O Miguel se compromete a manter as proteções que já estão no sistema, e
a não enfraquecer nenhuma sem avisar. O que está protegendo hoje está
listado em `SEGURANCA.md` e em `LGPD-REGISTRO.md`, nesta mesma pasta.

O João se compromete a manter a verificação em duas etapas ligada na
conta `joaobarber.agenda@gmail.com`, e a não passar a senha dela pra
ninguém.

### 5. Se acontecer um vazamento

Quem descobrir avisa o outro **no mesmo dia**.

O plano do que fazer, e o que a lei obriga a comunicar, está na seção 5
do `LGPD-REGISTRO.md`. A comunicação oficial à ANPD e aos clientes é
feita pelo João, que é o controlador, com o Miguel ajudando na parte
técnica.

### 6. Quando a prestação terminar

Termine como terminar, no prazo de **7 dias**:

- o Miguel sai da conta Google do João e apaga o login que ficou salvo
  no computador dele (`clasp logout`, e apagar `.clasprc.json` e
  `.clasp.json`)
- o João revoga o acesso do Miguel em `myaccount.google.com/connections`
  e troca a senha da conta
- o Miguel apaga qualquer cópia de dado de cliente que porventura tenha
  fora da conta do João
- o site, o código e o motor **ficam com o João**. Ele já paga por eles

O passo a passo técnico dessa saída está na seção "Entrega pro João" do
`agendamento/CLASP.md`.

### 7. Portfólio

O Miguel pode mostrar o site do João como trabalho dele, e falar do
projeto. Não pode mostrar dado de cliente, nem a planilha, nem a agenda.

Se quiser usar número de resultado (quantos agendamentos, quanto
aumentou), pergunta pro João antes.

### 8. Sobre foto de cliente

Foto de cliente só entra no site ou nas redes com autorização de quem
aparece, por escrito. Quem coleta essa autorização é o João, que é quem
está com a pessoa na hora. O texto pronto está na seção 5 do
`SEGURANCA.md`.

O Miguel não publica foto de cliente sem o João confirmar que a
autorização existe.

### 9. Prazo

Vale enquanto durar a prestação de serviço, e as partes que falam de
sigilo e de dados continuam valendo depois que ela acabar. É o que o
art. 47 da LGPD manda, segurança mesmo depois do término.

---

Sobradinho DF, ____ de __________________ de 2026.

<br>

_______________________________________
**João Lucas** · controlador

<br>

_______________________________________
**Miguel** · operador
