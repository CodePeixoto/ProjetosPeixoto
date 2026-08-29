/**
 * João Barber · motor de agendamento (v2)
 * ---------------------------------------------------------------
 * Roda dentro da conta Google do João, de graça, sem servidor.
 *
 * O que mudou da v1:
 *   - Serviços, expediente e regras agora moram na PLANILHA (abas
 *     Config, Serviços, Expediente). O João edita lá, sem tocar em
 *     código, e o site lê a mesma config. Acabou a cópia dupla.
 *   - Cada agendamento gera um CÓDIGO curto. Com ele o cliente
 *     desmarca pelo próprio site, até um limite de horas antes.
 *   - A aba Clientes se preenche sozinha: uma linha por pessoa, que
 *     atualiza a cada visita em vez de encher a planilha.
 *   - Aviso por email pro João a cada marcação e cancelamento.
 *
 * Instalação e estrutura da planilha: ver INSTALAR.md e INDICE.md
 * nessa mesma pasta.
 */

/* ==================================================================
   O QUE FICA NO CÓDIGO
   Só isso. Todo o resto está na planilha.
   ================================================================== */

var NUCLEO = {

  // ID da planilha. Está na URL, entre /d/ e /edit.
  SHEET_ID: '1gYhv0o2NJMmlnX1avw72y2ofrjJDH6r-9zx_fDsrkAU',

  // Chave que o site manda junto. Sem ela o script recusa a chamada.
  // Tem que ser igual à do bloco AGENDA no site.
  CHAVE: 'jb-fdded1b286dc138fe9dab196',

  FUSO: 'America/Sao_Paulo',

  // Deixe vazio pra usar a agenda principal da conta.
  CALENDAR_ID: '',

  // Nomes das abas. Mudou o nome da aba na planilha? Muda aqui também.
  ABA_CONFIG:   'Config',
  ABA_SERVICOS: 'Serviços',
  ABA_EXPED:    'Expediente',
  ABA_AGEND:    'Agendamentos',
  ABA_CLIENTES: 'Clientes',

  // Segundos que a config lida da planilha fica guardada em cache.
  // O João edita a planilha e a mudança passa a valer em, no máximo,
  // esse tempo. Sem isso, toda consulta de horário releria 3 abas.
  CACHE_SEG: 120
};

/* ==================================================================
   CONFIG: lida da planilha, guardada em cache
   ================================================================== */

function lerConfig() {
  var cache = CacheService.getScriptCache();
  var guardado = cache.get('config');
  if (guardado) return JSON.parse(guardado);

  var ss = SpreadsheetApp.openById(NUCLEO.SHEET_ID);

  var cfg = {
    whatsapp: '',
    emailAviso: '',
    antecedenciaHoras: 2,
    janelaDias: 21,
    passoMin: 15,
    domicilioExtra: 45,
    cancelarAteHoras: 6,
    servicos: {},
    expediente: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
  };

  // --- aba Config: pares "parâmetro | valor" ---
  aba(ss, NUCLEO.ABA_CONFIG).getDataRange().getValues().forEach(function (r) {
    var chave = String(r[0]).trim().toLowerCase();
    var val = r[1];
    if (!chave) return;
    if (chave.indexOf('whatsapp') === 0)       cfg.whatsapp = soDigitos(val);
    else if (chave.indexOf('email') === 0)     cfg.emailAviso = String(val).trim();
    else if (chave.indexOf('anteced') === 0)   cfg.antecedenciaHoras = num(val, cfg.antecedenciaHoras);
    else if (chave.indexOf('janela') === 0)    cfg.janelaDias = num(val, cfg.janelaDias);
    else if (chave.indexOf('passo') === 0)     cfg.passoMin = num(val, cfg.passoMin);
    else if (chave.indexOf('domic') === 0)     cfg.domicilioExtra = num(val, 0);
    else if (chave.indexOf('cancel') === 0)    cfg.cancelarAteHoras = num(val, 0);
  });

  // --- aba Serviços: chave | nome | minutos | descrição | ativo ---
  aba(ss, NUCLEO.ABA_SERVICOS).getDataRange().getValues().slice(1).forEach(function (r) {
    var chave = String(r[0]).trim().toLowerCase();
    if (!chave) return;
    if (!verdadeiro(r[4])) return;   // ativo != sim
    cfg.servicos[chave] = {
      nome: String(r[1]).trim(),
      minutos: num(r[2], 30),
      texto: String(r[3] || '').trim()
    };
  });

  // --- aba Expediente: dia | abre | fecha | abre 2 | fecha 2 ---
  var nomeDia = {
    'domingo': 0, 'segunda': 1, 'terça': 2, 'terca': 2, 'quarta': 3,
    'quinta': 4, 'sexta': 5, 'sábado': 6, 'sabado': 6
  };
  aba(ss, NUCLEO.ABA_EXPED).getDataRange().getValues().slice(1).forEach(function (r) {
    var d = nomeDia[String(r[0]).trim().toLowerCase()];
    if (d === undefined) return;
    var faixas = [];
    if (hhmm(r[1]) && hhmm(r[2])) faixas.push([hhmm(r[1]), hhmm(r[2])]);
    if (hhmm(r[3]) && hhmm(r[4])) faixas.push([hhmm(r[3]), hhmm(r[4])]);
    cfg.expediente[d] = faixas;
  });

  cache.put('config', JSON.stringify(cfg), NUCLEO.CACHE_SEG);
  return cfg;
}

function aba(ss, nome) {
  var a = ss.getSheetByName(nome);
  if (!a) throw new Error('A aba "' + nome + '" não existe na planilha. Confere o nome.');
  return a;
}

function num(v, padrao) {
  var s = String(v == null ? '' : v).trim().replace(',', '.').replace(/[^\d.-]/g, '');
  if (s === '') return padrao;
  var n = Number(s);
  return isNaN(n) ? padrao : n;
}

function soDigitos(v) { return String(v).replace(/\D+/g, ''); }

/**
 * Chave de identidade do cliente, pra achar quem já veio antes.
 *
 * O mesmo cliente digita o número de jeitos diferentes: com e sem o 9,
 * com e sem o 55, com e sem DDD. Sem normalizar, o mesmo Mateus vira
 * três linhas. A chave é DDD + os 8 últimos dígitos, que é a parte que
 * não muda nunca:
 *
 *   5561981607166 → 6181607166
 *     61981607166 → 6181607166
 *      6181607166 → 6181607166   (mesmo cliente, mesma linha)
 *     61999887766 → 6199887766   (outro número, linha nova)
 *
 * Dois clientes diferentes com o mesmo DDD e os mesmos 8 dígitos finais
 * não existem: seria o mesmo telefone.
 */
function chaveTelefone(v) {
  var d = soDigitos(v);
  if (d.length > 11 && d.indexOf('55') === 0) d = d.slice(2);   // tira o país
  if (d.length < 10) return d;                                  // incompleto, usa como veio
  var ddd = d.slice(0, 2);
  return ddd + d.slice(-8);
}

function verdadeiro(v) {
  var s = String(v).trim().toLowerCase();
  return s === '' || s === 'sim' || s === 's' || s === 'x' || s === 'true' || s === '1';
}

// Aceita "9:00", "09:00", "09:00:00" ou uma célula formatada como hora.
function hhmm(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'HH:mm');
  var m = String(v).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return '';
  return (m[1].length < 2 ? '0' + m[1] : m[1]) + ':' + m[2];
}

/* ==================================================================
   ENTRADA: consultas (o site chama por GET)
   ================================================================== */

function doGet(e) {
  try {
    var p = e.parameter || {};
    if (p.chave !== NUCLEO.CHAVE) return json({ erro: 'chave invalida' });

    var cfg = lerConfig();

    if (p.acao === 'config') {
      return json({ ok: true, servicos: cfg.servicos, domicilioExtra: cfg.domicilioExtra });
    }
    if (p.acao === 'horarios') {
      return json({
        ok: true,
        data: p.data,
        horarios: horariosLivres(cfg, p.data, p.servico, p.local)
      });
    }
    if (p.acao === 'dias') {
      return json({ ok: true, dias: diasComVaga(cfg, p.servico, p.local) });
    }
    return json({ erro: 'acao desconhecida' });

  } catch (err) {
    return json({ erro: String(err) });
  }
}

/* ==================================================================
   ENTRADA: gravação (o site chama por POST)
   ================================================================== */

function doPost(e) {
  var trava = LockService.getScriptLock();
  try {
    trava.waitLock(10000);

    var d = JSON.parse(e.postData.contents);
    if (d.chave !== NUCLEO.CHAVE) return json({ erro: 'chave invalida' });

    if (d.acao === 'cancelar') return cancelar(d);

    return agendar(d);

  } catch (err) {
    return json({ erro: String(err) });
  } finally {
    trava.releaseLock();
  }
}

function agendar(d) {
  var cfg = lerConfig();

  var servico = cfg.servicos[d.servico];
  if (!servico) return json({ erro: 'servico invalido' });

  var inicio = new Date(d.inicio);                 // ISO vindo do site
  var dur = duracaoTotal(cfg, d.servico, d.local);
  var fim = new Date(inicio.getTime() + dur * 60000);

  // Confere de novo, agora que está travado.
  if (!estaLivre(inicio, fim)) {
    return json({ erro: 'ocupado', mensagem: 'Esse horário acabou de ser preenchido. Escolha outro.' });
  }

  var local = d.local === 'domicilio'
    ? 'A domicílio: ' + (d.endereco || 'endereço a confirmar')
    : 'Barbearia Rota 020';

  var codigo = novoCodigo();

  var descricao = [
    'Cliente: ' + d.nome,
    'WhatsApp: ' + d.telefone,
    'Serviço: ' + servico.nome,
    'Local: ' + local,
    'Código: ' + codigo,
    d.aniversario ? 'Aniversário: ' + d.aniversario : '',
    d.origem ? 'Como me achou: ' + d.origem : '',
    d.observacao ? 'Observação: ' + d.observacao : '',
    '',
    'Agendado pelo site.'
  ].filter(String).join('\n');

  var evento = agenda().createEvent(servico.nome + ' · ' + d.nome, inicio, fim, {
    description: descricao,
    location: local
  });

  var ss = SpreadsheetApp.openById(NUCLEO.SHEET_ID);
  gravarAgendamento(ss, d, inicio, servico, local, codigo, evento.getId());
  upsertCliente(ss, d, inicio);

  avisarEmail(cfg, 'Novo agendamento',
    d.nome + ' marcou ' + servico.nome + '\n'
    + formatar(inicio, "EEEE, dd/MM 'às' HH:mm") + '\n'
    + local + '\n'
    + 'WhatsApp: ' + d.telefone + '\n'
    + 'Código: ' + codigo);

  return json({
    ok: true,
    codigo: codigo,
    whatsapp: linkWhatsApp(cfg, d, inicio, servico, local, codigo),
    quando: formatar(inicio, "EEEE, d 'de' MMMM 'às' HH:mm")
  });
}

function cancelar(d) {
  var cfg = lerConfig();
  var cod = String(d.codigo || '').trim().toUpperCase();
  if (!cod) return json({ erro: 'sem codigo', mensagem: 'Digite o código do agendamento.' });

  var ss = SpreadsheetApp.openById(NUCLEO.SHEET_ID);
  var a = aba(ss, NUCLEO.ABA_AGEND);
  var linhas = a.getDataRange().getValues();
  var cab = linhas[0];
  var cCod = cab.indexOf('Código');
  var cStatus = cab.indexOf('Status');
  var cEvento = cab.indexOf('ID do evento');
  var cData = cab.indexOf('Data do corte');
  var cHora = cab.indexOf('Hora');
  var cNome = cab.indexOf('Nome');

  for (var i = linhas.length - 1; i >= 1; i--) {
    if (String(linhas[i][cCod]).trim().toUpperCase() !== cod) continue;

    if (String(linhas[i][cStatus]).trim().toLowerCase().indexOf('cancel') === 0) {
      return json({ erro: 'ja cancelado', mensagem: 'Esse agendamento já está cancelado.' });
    }

    var ev = null;
    try { ev = agenda().getEventById(linhas[i][cEvento]); } catch (e) {}
    var inicio = ev ? ev.getStartTime() : null;

    if (cfg.cancelarAteHoras > 0 && inicio &&
        inicio.getTime() - Date.now() < cfg.cancelarAteHoras * 3600000) {
      return json({
        erro: 'tarde',
        mensagem: 'Falta menos de ' + cfg.cancelarAteHoras + 'h pro horário. Pra desmarcar agora, é melhor falar comigo no WhatsApp.',
        whatsapp: linkZap(cfg, 'Oi João, preciso desmarcar meu horário de '
          + linhas[i][cData] + ' às ' + linhas[i][cHora] + ' (código ' + cod + '), mas já está em cima da hora.')
      });
    }

    if (ev) ev.deleteEvent();
    a.getRange(i + 1, cStatus + 1).setValue('Cancelado ' + formatar(new Date(), 'dd/MM HH:mm'));

    avisarEmail(cfg, 'Cancelamento pelo site',
      linhas[i][cNome] + ' desmarcou o horário de '
      + linhas[i][cData] + ' às ' + linhas[i][cHora] + ' (código ' + cod + ')');

    return json({
      ok: true,
      whatsapp: linkZap(cfg, 'Oi João, precisei desmarcar meu horário de '
        + linhas[i][cData] + ' às ' + linhas[i][cHora] + ' pelo site (código ' + cod + ').')
    });
  }

  return json({ erro: 'nao achou', mensagem: 'Não achei esse código. Confere as letras, ou me chama no WhatsApp.' });
}

/* ==================================================================
   CÁLCULO DE HORÁRIOS
   ================================================================== */

function duracaoTotal(cfg, chaveServico, local) {
  var base = cfg.servicos[chaveServico].minutos;
  return local === 'domicilio' ? base + cfg.domicilioExtra : base;
}

function horariosLivres(cfg, dataTexto, chaveServico, local) {
  if (!cfg.servicos[chaveServico]) return [];

  var dur = duracaoTotal(cfg, chaveServico, local);
  var dia = new Date(dataTexto + 'T12:00:00');
  var faixas = cfg.expediente[dia.getDay()] || [];
  if (!faixas.length) return [];

  var minimo = new Date(Date.now() + cfg.antecedenciaHoras * 3600000);

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
        livres.push(Utilities.formatDate(cursor, NUCLEO.FUSO, 'HH:mm'));
      }
      cursor = new Date(cursor.getTime() + cfg.passoMin * 60000);
    }
  });

  return livres;
}

function diasComVaga(cfg, chaveServico, local) {
  var saida = [];
  var hoje = new Date();
  for (var i = 0; i < cfg.janelaDias; i++) {
    var d = new Date(hoje.getTime() + i * 86400000);
    var texto = Utilities.formatDate(d, NUCLEO.FUSO, 'yyyy-MM-dd');
    if ((cfg.expediente[d.getDay()] || []).length) {
      saida.push({
        data: texto,
        rotulo: formatar(d, 'EEE, d/MM'),
        vagas: horariosLivres(cfg, texto, chaveServico, local).length
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

function gravarAgendamento(ss, d, inicio, servico, local, codigo, eventoId) {
  var a = aba(ss, NUCLEO.ABA_AGEND);

  if (a.getLastRow() === 0) {
    a.appendRow([
      'Agendado em', 'Código', 'Status', 'Data do corte', 'Hora', 'Nome',
      'WhatsApp', 'Serviço', 'Local', 'Compareceu', 'ID do evento'
    ]);
    a.setFrozenRows(1);
  }

  a.appendRow([
    new Date(),
    codigo,
    'Confirmado',
    Utilities.formatDate(inicio, NUCLEO.FUSO, 'yyyy-MM-dd'),
    Utilities.formatDate(inicio, NUCLEO.FUSO, 'HH:mm'),
    d.nome,
    "'" + soDigitos(d.telefone),
    servico.nome,
    local,
    '',
    eventoId
  ]);
}

// Uma linha por pessoa. Atualiza em vez de duplicar.
function upsertCliente(ss, d, inicio) {
  var a = aba(ss, NUCLEO.ABA_CLIENTES);

  if (a.getLastRow() === 0) {
    a.appendRow([
      'WhatsApp', 'Nome', 'Aniversário', 'Como me achou',
      'Primeira vez', 'Última visita', 'Visitas', 'Observações'
    ]);
    a.setFrozenRows(1);
  }

  var chave = chaveTelefone(d.telefone);
  var hojeTxt = Utilities.formatDate(inicio, NUCLEO.FUSO, 'yyyy-MM-dd');
  var dados = a.getDataRange().getValues();

  // Já veio antes? Atualiza a linha dele em vez de criar outra.
  for (var i = 1; i < dados.length; i++) {
    if (chaveTelefone(dados[i][0]) !== chave) continue;

    a.getRange(i + 1, 6).setValue(hojeTxt);                          // última visita
    a.getRange(i + 1, 7).setValue((Number(dados[i][6]) || 0) + 1);   // visitas

    // só preenche o que estava vazio: o que o João editou à mão fica de pé
    if (!dados[i][1] && d.nome)              a.getRange(i + 1, 2).setValue(d.nome);
    if (!dados[i][2] && d.aniversario)       a.getRange(i + 1, 3).setValue(d.aniversario);
    if (!dados[i][3] && d.origem)            a.getRange(i + 1, 4).setValue(d.origem);

    // observação é a exceção: acumula, porque cada visita traz uma nova
    if (d.observacao) {
      a.getRange(i + 1, 8).setValue(
        (dados[i][7] ? dados[i][7] + ' | ' : '') + hojeTxt + ': ' + d.observacao);
    }
    return;
  }

  // Primeira vez dessa pessoa.
  a.appendRow([
    "'" + soDigitos(d.telefone),
    d.nome,
    d.aniversario || '',
    d.origem || '',
    hojeTxt,
    hojeTxt,
    1,
    d.observacao ? hojeTxt + ': ' + d.observacao : ''
  ]);
}

/* ==================================================================
   AUXILIARES
   ================================================================== */

function agenda() {
  return NUCLEO.CALENDAR_ID
    ? CalendarApp.getCalendarById(NUCLEO.CALENDAR_ID)
    : CalendarApp.getDefaultCalendar();
}

function novoCodigo() {
  var abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // sem O/0 e I/1
  var s = '';
  for (var i = 0; i < 4; i++) s += abc.charAt(Math.floor(Math.random() * abc.length));
  return s;
}

function montarHora(dataTexto, hhmmTxt) {
  var p = dataTexto.split('-');
  var t = hhmmTxt.split(':');
  return new Date(p[0], p[1] - 1, p[2], t[0], t[1], 0);
}

function formatar(data, padrao) {
  return Utilities.formatDate(data, NUCLEO.FUSO, padrao);
}

function linkWhatsApp(cfg, d, inicio, servico, local, codigo) {
  return linkZap(cfg,
    'Opa João! Acabei de agendar pelo site.\n\n'
    + 'Nome: ' + d.nome + '\n'
    + 'Serviço: ' + servico.nome + '\n'
    + 'Quando: ' + formatar(inicio, "dd/MM 'às' HH:mm") + '\n'
    + 'Onde: ' + local + '\n'
    + 'Código: ' + codigo);
}

function linkZap(cfg, texto) {
  return 'https://wa.me/' + cfg.whatsapp + '?text=' + encodeURIComponent(texto);
}

function avisarEmail(cfg, assunto, corpo) {
  if (!cfg.emailAviso) return;
  try {
    MailApp.sendEmail(cfg.emailAviso, 'João Barber · ' + assunto, corpo);
  } catch (e) {}
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ==================================================================
   TESTE
   Rodar essa função no editor pra conferir se planilha, abas e
   agenda estão acessíveis, antes de ligar o site.
   ================================================================== */

function testar() {
  var cfg = lerConfig();
  var hoje = Utilities.formatDate(new Date(), NUCLEO.FUSO, 'yyyy-MM-dd');
  Logger.log('Agenda: ' + agenda().getName());
  Logger.log('WhatsApp na Config: ' + (cfg.whatsapp || '(vazio!)'));
  Logger.log('Serviços ativos: ' + Object.keys(cfg.servicos).join(', '));
  Logger.log('Expediente hoje: ' + JSON.stringify(cfg.expediente[new Date().getDay()]));
  Logger.log('Horários livres hoje pra corte: ' + horariosLivres(cfg, hoje, 'corte', 'barbearia'));
}

/* ==================================================================
   MONTAR A PLANILHA
   Cria e preenche as 5 abas sozinho, no lugar de fazer na mão.
   Rodar uma vez, no editor ou com  clasp run montarPlanilha.

   É seguro rodar de novo: só mexe no que está faltando ou vazio.
   Nunca apaga dado. Se a aba Agendamentos ainda for a da v1 (sem a
   coluna Código), ela é RENOMEADA pra "Agendamentos (v1)" e uma nova
   entra no lugar, porque as colunas mudaram de ordem.
   ================================================================== */

function montarPlanilha() {
  var ss = SpreadsheetApp.openById(NUCLEO.SHEET_ID);
  var feito = [];

  function pegarOuCriar(nome) {
    var a = ss.getSheetByName(nome);
    if (!a) { a = ss.insertSheet(nome); feito.push('aba "' + nome + '" criada'); }
    return a;
  }

  // Escreve só se a aba estiver vazia, pra não passar por cima do que
  // o João já ajustou.
  function preencherSeVazia(a, linhas) {
    if (a.getLastRow() > 0) { feito.push('"' + a.getName() + '" já tinha conteúdo, não mexi'); return false; }
    a.getRange(1, 1, linhas.length, linhas[0].length).setValues(linhas);
    a.setFrozenRows(1);
    feito.push(linhas.length > 1
      ? '"' + a.getName() + '" preenchida (' + (linhas.length - 1) + ' linhas)'
      : '"' + a.getName() + '" cabeçalho criado, pronta pra receber dados');
    return true;
  }

  /* ---------- Config ---------- */
  preencherSeVazia(pegarOuCriar(NUCLEO.ABA_CONFIG), [
    ['Parâmetro', 'Valor', 'Ajuda'],
    ['WhatsApp do João', '5561981607166', 'só números, com 55 e DDD. É por aqui que a confirmação abre. CONFERIR com o João'],
    ['Email de aviso', '', 'recebe aviso de cada marcação e cancelamento. Vazio = não recebe'],
    ['Antecedência mínima', 2, 'horas. Não deixa marcar em cima da hora'],
    ['Janela de agenda', 21, 'dias pra frente que a agenda abre'],
    ['Passo dos horários', 15, 'minutos entre um horário e o próximo na lista'],
    ['Extra domicílio', 45, 'minutos de deslocamento, além da duração do serviço'],
    ['Cancelar pelo site até', 6, 'horas antes do horário. 0 desliga o cancelamento pelo site']
  ]);

  /* ---------- Serviços ---------- */
  preencherSeVazia(pegarOuCriar(NUCLEO.ABA_SERVICOS), [
    ['chave', 'nome', 'minutos', 'descrição', 'ativo'],
    ['corte',       'Corte',                40, 'Do clássico ao degradê, decidido na conversa', 'sim'],
    ['barba',       'Barba',                30, 'Desenho, navalha e toalha quente',             'sim'],
    ['combo',       'Corte + barba',        70, 'Os dois na mesma sessão',                      'sim'],
    ['acabamento',  'Acabamento / pezinho', 20, 'Manutenção rápida entre um corte e outro',     'sim'],
    ['sobrancelha', 'Sobrancelha',          15, 'Limpeza e alinhamento',                        'sim']
  ]);

  /* ---------- Expediente ----------
     As colunas de hora viram TEXTO antes de receber valor. Sem isso o
     Google converte "09:00" em hora de verdade e o motor lê outra coisa. */
  var exp = pegarOuCriar(NUCLEO.ABA_EXPED);
  if (exp.getLastRow() === 0) {
    exp.getRange(1, 2, 20, 4).setNumberFormat('@');
    preencherSeVazia(exp, [
      ['dia', 'abre', 'fecha', 'abre 2', 'fecha 2'],
      ['Domingo', '',      '',      '',      ''],
      ['Segunda', '09:00', '12:00', '13:30', '19:00'],
      ['Terça',   '09:00', '12:00', '13:30', '19:00'],
      ['Quarta',  '09:00', '12:00', '13:30', '19:00'],
      ['Quinta',  '09:00', '12:00', '13:30', '19:00'],
      ['Sexta',   '09:00', '12:00', '13:30', '20:00'],
      ['Sábado',  '08:00', '17:00', '',      '']
    ]);
  } else {
    feito.push('"' + NUCLEO.ABA_EXPED + '" já tinha conteúdo, não mexi');
  }

  /* ---------- Agendamentos ----------
     A v1 tinha outras colunas. Se o cabeçalho não tem "Código", essa
     aba é da v1: renomeia e começa uma limpa. */
  var CAB_AGEND = ['Agendado em', 'Código', 'Status', 'Data do corte', 'Hora', 'Nome',
                   'WhatsApp', 'Serviço', 'Local', 'Compareceu', 'ID do evento'];

  var precisaCabecalho = true;
  var ag = ss.getSheetByName(NUCLEO.ABA_AGEND);

  if (ag && ag.getLastRow() > 0) {
    var cab = ag.getRange(1, 1, 1, ag.getLastColumn()).getValues()[0];
    if (cab.indexOf('Código') === -1) {
      // é a aba da v1: guarda com outro nome e deixa o campo livre
      var arquivo = 'Agendamentos (v1)';
      var n = 2;
      while (ss.getSheetByName(arquivo)) { arquivo = 'Agendamentos (v' + (n++) + ')'; }
      ag.setName(arquivo);
      feito.push('aba antiga guardada como "' + arquivo + '" (era da v1, colunas diferentes)');
    } else {
      feito.push('"' + NUCLEO.ABA_AGEND + '" já está no formato v2, não mexi');
      precisaCabecalho = false;
    }
  }

  // cobre os três casos: aba não existia, existia vazia, ou acabou de ser
  // renomeada. Sem isso, uma aba vazia ficava sem cabeçalho.
  if (precisaCabecalho) {
    preencherSeVazia(pegarOuCriar(NUCLEO.ABA_AGEND), [CAB_AGEND]);
  }

  /* ---------- Clientes ---------- */
  preencherSeVazia(pegarOuCriar(NUCLEO.ABA_CLIENTES), [
    ['WhatsApp', 'Nome', 'Aniversário', 'Como me achou',
     'Primeira vez', 'Última visita', 'Visitas', 'Observações']
  ]);

  /* ---------- ordem das abas, só pra ficar legível ---------- */
  [NUCLEO.ABA_CONFIG, NUCLEO.ABA_SERVICOS, NUCLEO.ABA_EXPED,
   NUCLEO.ABA_AGEND, NUCLEO.ABA_CLIENTES].forEach(function (nome, i) {
    var a = ss.getSheetByName(nome);
    if (a) { ss.setActiveSheet(a); ss.moveActiveSheet(i + 1); }
  });

  // A config muda, então o cache velho não serve mais.
  CacheService.getScriptCache().remove('config');

  Logger.log('== montarPlanilha ==');
  feito.forEach(function (l) { Logger.log('  - ' + l); });
  Logger.log('Planilha: ' + ss.getName());
  Logger.log('Abas agora: ' + ss.getSheets().map(function (s) { return s.getName(); }).join(', '));
  Logger.log('\nAgora rode  testar  pra conferir que o motor lê tudo.');

  return feito;
}
