/**
 * João Barber · motor de agendamento
 * ---------------------------------------------------------------
 * Roda dentro da conta Google do João, de graça, sem servidor.
 *
 * O que ele faz:
 *   1. Lê a Agenda do João e devolve pro site só os horários livres
 *   2. Recebe o agendamento, confere de novo se o horário ainda está
 *      livre, cria o evento na Agenda e grava a linha na Planilha
 *   3. Devolve pro site o link de WhatsApp com a mensagem pronta
 *
 * Instalação: ver INSTALAR.md nessa mesma pasta.
 */

/* ==================================================================
   CONFIGURAÇÃO
   Só essa parte precisa ser editada.
   ================================================================== */

var CONFIG = {

  // Deixe vazio pra usar a agenda principal da conta.
  CALENDAR_ID: '',

  // ID da planilha. Está na URL, entre /d/ e /edit.
  SHEET_ID: 'COLE_O_ID_DA_PLANILHA_AQUI',
  SHEET_NOME: 'Agendamentos',

  // WhatsApp do João, só números, com país e DDD.
  WHATSAPP: '5561999999999',   // <<< TROCAR

  FUSO: 'America/Sao_Paulo',

  // Chave que o site manda junto. Serve pra ninguém de fora ficar
  // criando evento na agenda dele. Trocar por qualquer texto longo,
  // e repetir o mesmo valor no site.
  CHAVE: 'TROCAR_POR_UM_TEXTO_LONGO_E_UNICO',

  // Serviços. A duração é o que reserva o espaço na agenda.
  // >>> CONFIRMAR OS TEMPOS REAIS COM O JOÃO <<<
  SERVICOS: {
    'corte':       { nome: 'Corte',                   minutos: 40 },
    'barba':       { nome: 'Barba',                   minutos: 30 },
    'combo':       { nome: 'Corte + barba',           minutos: 70 },
    'acabamento':  { nome: 'Acabamento / pezinho',    minutos: 20 },
    'sobrancelha': { nome: 'Sobrancelha',             minutos: 15 }
  },

  // Atendimento a domicílio ocupa mais tempo por causa do
  // deslocamento. Esse tempo entra além da duração do serviço.
  DOMICILIO_EXTRA_MIN: 45,

  // Horários de trabalho. 0 = domingo, 6 = sábado.
  // Pode ter mais de uma faixa no mesmo dia (almoço no meio).
  // >>> CONFIRMAR COM O JOÃO <<<
  EXPEDIENTE: {
    0: [],
    1: [['09:00', '12:00'], ['13:30', '19:00']],
    2: [['09:00', '12:00'], ['13:30', '19:00']],
    3: [['09:00', '12:00'], ['13:30', '19:00']],
    4: [['09:00', '12:00'], ['13:30', '19:00']],
    5: [['09:00', '12:00'], ['13:30', '20:00']],
    6: [['08:00', '17:00']]
  },

  // De quanto em quanto tempo os horários aparecem na lista.
  PASSO_MIN: 15,

  // Antecedência mínima pra marcar (evita alguém marcar pra daqui a
  // 5 minutos) e até quantos dias pra frente a agenda abre.
  ANTECEDENCIA_MIN_HORAS: 2,
  JANELA_DIAS: 21
};

/* ==================================================================
   ENTRADA: consulta de horários (o site chama por GET)
   ================================================================== */

function doGet(e) {
  try {
    var p = e.parameter || {};
    if (p.chave !== CONFIG.CHAVE) return json({ erro: 'chave invalida' });

    if (p.acao === 'horarios') {
      return json({
        ok: true,
        data: p.data,
        horarios: horariosLivres(p.data, p.servico, p.local)
      });
    }
    if (p.acao === 'dias') {
      return json({ ok: true, dias: diasComVaga(p.servico, p.local) });
    }
    return json({ erro: 'acao desconhecida' });

  } catch (err) {
    return json({ erro: String(err) });
  }
}

/* ==================================================================
   ENTRADA: gravação do agendamento (o site chama por POST)
   ================================================================== */

function doPost(e) {
  var trava = LockService.getScriptLock();
  try {
    // Trava por 10 segundos. Sem isso, duas pessoas clicando no mesmo
    // segundo conseguem marcar o mesmo horário.
    trava.waitLock(10000);

    var d = JSON.parse(e.postData.contents);
    if (d.chave !== CONFIG.CHAVE) return json({ erro: 'chave invalida' });

    var servico = CONFIG.SERVICOS[d.servico];
    if (!servico) return json({ erro: 'servico invalido' });

    var inicio = new Date(d.inicio);                 // ISO vindo do site
    var dur = duracaoTotal(d.servico, d.local);
    var fim = new Date(inicio.getTime() + dur * 60000);

    // Confere de novo, agora que está travado. O horário pode ter
    // sido tomado entre a consulta e o envio.
    if (!estaLivre(inicio, fim)) {
      return json({ erro: 'ocupado', mensagem: 'Esse horário acabou de ser preenchido. Escolha outro.' });
    }

    var local = d.local === 'domicilio'
      ? 'A domicílio: ' + (d.endereco || 'endereço a confirmar')
      : 'Barbearia Rota 020';

    var titulo = servico.nome + ' · ' + d.nome;
    var descricao = [
      'Cliente: ' + d.nome,
      'WhatsApp: ' + d.telefone,
      'Serviço: ' + servico.nome,
      'Local: ' + local,
      d.aniversario ? 'Aniversário: ' + d.aniversario : '',
      d.origem ? 'Como me achou: ' + d.origem : '',
      d.observacao ? 'Observação: ' + d.observacao : '',
      '',
      'Agendado pelo site.'
    ].filter(String).join('\n');

    var evento = agenda().createEvent(titulo, inicio, fim, {
      description: descricao,
      location: local
    });

    gravarNaPlanilha(d, inicio, servico, local, evento.getId());

    return json({
      ok: true,
      whatsapp: linkWhatsApp(d, inicio, servico, local),
      quando: formatar(inicio, "EEEE, d 'de' MMMM 'às' HH:mm")
    });

  } catch (err) {
    return json({ erro: String(err) });
  } finally {
    trava.releaseLock();
  }
}

/* ==================================================================
   CÁLCULO DE HORÁRIOS
   ================================================================== */

function duracaoTotal(chaveServico, local) {
  var base = CONFIG.SERVICOS[chaveServico].minutos;
  return local === 'domicilio' ? base + CONFIG.DOMICILIO_EXTRA_MIN : base;
}

function horariosLivres(dataTexto, chaveServico, local) {
  if (!CONFIG.SERVICOS[chaveServico]) return [];

  var dur = duracaoTotal(chaveServico, local);
  var dia = new Date(dataTexto + 'T12:00:00');
  var faixas = CONFIG.EXPEDIENTE[dia.getDay()] || [];
  if (!faixas.length) return [];

  var agora = new Date();
  var minimo = new Date(agora.getTime() + CONFIG.ANTECEDENCIA_MIN_HORAS * 3600000);

  // Puxa os eventos do dia de uma vez só. Consultar a agenda dentro
  // do laço deixaria isso lento demais.
  var abertura = montarHora(dataTexto, faixas[0][0]);
  var fechamento = montarHora(dataTexto, faixas[faixas.length - 1][1]);
  var ocupados = agenda().getEvents(abertura, fechamento).map(function (ev) {
    return { ini: ev.getStartTime().getTime(), fim: ev.getEndTime().getTime() };
  });

  var livres = [];
  faixas.forEach(function (faixa) {
    var cursor = montarHora(dataTexto, faixa[0]);
    var limite = montarHora(dataTexto, faixa[1]);

    while (cursor.getTime() + dur * 60000 <= limite.getTime()) {
      var fim = new Date(cursor.getTime() + dur * 60000);

      var colide = ocupados.some(function (o) {
        return cursor.getTime() < o.fim && fim.getTime() > o.ini;
      });

      if (!colide && cursor >= minimo) {
        livres.push(Utilities.formatDate(cursor, CONFIG.FUSO, 'HH:mm'));
      }
      cursor = new Date(cursor.getTime() + CONFIG.PASSO_MIN * 60000);
    }
  });

  return livres;
}

function diasComVaga(chaveServico, local) {
  var saida = [];
  var hoje = new Date();
  for (var i = 0; i < CONFIG.JANELA_DIAS; i++) {
    var d = new Date(hoje.getTime() + i * 86400000);
    var texto = Utilities.formatDate(d, CONFIG.FUSO, 'yyyy-MM-dd');
    if ((CONFIG.EXPEDIENTE[d.getDay()] || []).length) {
      saida.push({
        data: texto,
        rotulo: formatar(d, "EEE, d/MM"),
        vagas: horariosLivres(texto, chaveServico, local).length
      });
    }
  }
  return saida;
}

function estaLivre(inicio, fim) {
  return agenda().getEvents(inicio, fim).length === 0;
}

/* ==================================================================
   PLANILHA
   ================================================================== */

function gravarNaPlanilha(d, inicio, servico, local, eventoId) {
  var aba = SpreadsheetApp.openById(CONFIG.SHEET_ID)
    .getSheetByName(CONFIG.SHEET_NOME);

  if (!aba) throw new Error('Aba "' + CONFIG.SHEET_NOME + '" não existe na planilha.');

  // Cria o cabeçalho na primeira vez.
  if (aba.getLastRow() === 0) {
    aba.appendRow([
      'Agendado em', 'Data do corte', 'Hora', 'Nome', 'WhatsApp',
      'Serviço', 'Local', 'Aniversário', 'Como me achou', 'Observação',
      'Compareceu', 'ID do evento'
    ]);
    aba.setFrozenRows(1);
  }

  aba.appendRow([
    new Date(),
    Utilities.formatDate(inicio, CONFIG.FUSO, 'yyyy-MM-dd'),
    Utilities.formatDate(inicio, CONFIG.FUSO, 'HH:mm'),
    d.nome,
    "'" + d.telefone,          // aspas mantêm o zero e o formato
    servico.nome,
    local,
    d.aniversario || '',
    d.origem || '',
    d.observacao || '',
    '',                         // preenchido depois, no painel
    eventoId
  ]);
}

/* ==================================================================
   AUXILIARES
   ================================================================== */

function agenda() {
  return CONFIG.CALENDAR_ID
    ? CalendarApp.getCalendarById(CONFIG.CALENDAR_ID)
    : CalendarApp.getDefaultCalendar();
}

function montarHora(dataTexto, hhmm) {
  var partes = dataTexto.split('-');
  var hm = hhmm.split(':');
  return new Date(partes[0], partes[1] - 1, partes[2], hm[0], hm[1], 0);
}

function formatar(data, padrao) {
  return Utilities.formatDate(data, CONFIG.FUSO, padrao);
}

function linkWhatsApp(d, inicio, servico, local) {
  var texto = 'Opa João! Acabei de agendar pelo site.\n\n'
    + 'Nome: ' + d.nome + '\n'
    + 'Serviço: ' + servico.nome + '\n'
    + 'Quando: ' + formatar(inicio, "dd/MM 'às' HH:mm") + '\n'
    + 'Onde: ' + local;

  return 'https://wa.me/' + CONFIG.WHATSAPP + '?text=' + encodeURIComponent(texto);
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ==================================================================
   TESTE
   Rodar essa função no editor pra conferir se a agenda e a planilha
   estão acessíveis, antes de ligar o site.
   ================================================================== */

function testar() {
  var hoje = Utilities.formatDate(new Date(), CONFIG.FUSO, 'yyyy-MM-dd');
  Logger.log('Agenda: ' + agenda().getName());
  Logger.log('Planilha: ' + SpreadsheetApp.openById(CONFIG.SHEET_ID).getName());
  Logger.log('Horários livres hoje para corte: ' + horariosLivres(hoje, 'corte', 'barbearia'));
}
