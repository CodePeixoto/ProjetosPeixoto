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
  ABA_CONFIG:    'Config',
  ABA_SERVICOS:  'Serviços',
  ABA_EXPED:     'Expediente',
  ABA_AGEND:     'Agendamentos',
  ABA_CLIENTES:  'Clientes',
  ABA_MENSAGENS: 'Mensagens',
  ABA_DATAS:     'Datas',

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
    janelaDias: 14,
    passoMin: 15,
    domicilioExtra: 45,
    cancelarAteHoras: 6,
    guardarMeses: 24,
    recallDias: 15,
    recallLimiteDias: 60,
    resumoDia: 'Segunda',
    resumoHora: 8,
    confirmarHora: 18,
    servicos: {},
    expediente: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
  };

  // --- aba Config: pares "parâmetro | valor" ---
  aba(ss, NUCLEO.ABA_CONFIG).getDataRange().getValues().forEach(function (r) {
    var chave = String(r[0]).trim().toLowerCase();
    var val = r[1];
    if (!chave) return;
    if (chave.indexOf('whatsapp') === 0)             cfg.whatsapp = soDigitos(val);
    else if (chave.indexOf('email') === 0)           cfg.emailAviso = String(val).trim();
    else if (chave.indexOf('anteced') === 0)         cfg.antecedenciaHoras = num(val, cfg.antecedenciaHoras);
    else if (chave.indexOf('janela') === 0)          cfg.janelaDias = num(val, cfg.janelaDias);
    else if (chave.indexOf('passo') === 0)           cfg.passoMin = num(val, cfg.passoMin);
    else if (chave.indexOf('domic') === 0)           cfg.domicilioExtra = num(val, 0);
    else if (chave.indexOf('cancel') === 0)          cfg.cancelarAteHoras = num(val, 0);
    else if (chave.indexOf('guardar') === 0)         cfg.guardarMeses = num(val, cfg.guardarMeses);
    else if (chave.indexOf('recall ignora') === 0)   cfg.recallLimiteDias = num(val, cfg.recallLimiteDias);
    else if (chave.indexOf('recall') === 0)          cfg.recallDias = num(val, cfg.recallDias);
    else if (chave.indexOf('dia do resumo') === 0)   cfg.resumoDia = String(val).trim() || cfg.resumoDia;
    else if (chave.indexOf('hora do resumo') === 0)  cfg.resumoHora = num(val, cfg.resumoHora);
    else if (chave.indexOf('hora da confirm') === 0) cfg.confirmarHora = num(val, cfg.confirmarHora);
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
   PORTARIA: o que entra pelo site não é confiável
   ------------------------------------------------------------------
   O App da Web é aberto (ANYONE_ANONYMOUS) e a CHAVE viaja dentro do
   HTML do site, então ela é pública: qualquer pessoa que abrir o
   código-fonte da página consegue chamar o motor direto. A chave serve
   contra varredura automática, não contra alguém decidido.

   O que protege de verdade é isto aqui: conferir tudo que chega, e
   limitar quantas vezes a mesma coisa pode ser tentada. Sem isso, dá
   pra encher a agenda de horário falso ou ficar chutando código de
   cancelamento até derrubar o horário de outra pessoa.
   ================================================================== */

var LIMITE = {
  NOME:       60,     // caracteres
  ENDERECO:   200,
  OBSERVACAO: 300,

  // Freios. A janela é em segundos e o teto do CacheService do Apps
  // Script é 21600 (6 horas), então nada aqui passa disso.
  CANCEL_ERRO:      8,    CANCEL_ERRO_SEG:   900,    // 8 chutes em 15 min
  AGENDA_TELEFONE:  3,    AGENDA_TEL_SEG:  21600,    // 3 marcações por número em 6h
  AGENDA_TOTAL:    12,    AGENDA_TOTAL_SEG: 3600     // 12 marcações no site por hora
};

/**
 * Limpa texto que veio de fora antes de gravar em qualquer lugar.
 * Chama-se limpo() e não texto() porque "texto" já é nome de variável
 * em outras funções daqui, e a sombra confundiria na leitura.
 * Tira caractere de controle, junta espaço repetido e corta no limite.
 * Sem isso, um POST feito na mão grava megabytes na planilha.
 */
function limpo(v, max) {
  return String(v == null ? '' : v)
    .replace(/[\x00-\x1F\x7F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max || 200);
}

/**
 * Devolve o telefone só em dígitos se ele for um celular brasileiro
 * plausível, ou '' se não for. Número inválido significa horário que o
 * João não consegue confirmar, então é melhor recusar na entrada.
 */
function telefoneValido(v) {
  var d = soDigitos(v);
  if (d.length > 11 && d.indexOf('55') === 0) d = d.slice(2);
  if (d.length !== 10 && d.length !== 11) return '';
  var ddd = Number(d.slice(0, 2));
  if (ddd < 11 || ddd > 99) return '';
  if (d.length === 11 && d.charAt(2) !== '9') return '';   // celular começa com 9
  return d;
}

/**
 * Contador com prazo de validade, guardado no cache do script.
 * Devolve quantas vezes aquela chave já apareceu dentro da janela.
 * É a base dos freios: não precisa de planilha nem de escopo novo.
 */
function contar(chave, segundos) {
  var c = CacheService.getScriptCache();
  var n = Number(c.get(chave) || 0) + 1;
  c.put(chave, String(n), Math.min(segundos, 21600));
  return n;
}

// Lê o contador sem somar. Serve pra barrar antes de fazer o trabalho.
function tentativas(chave) {
  return Number(CacheService.getScriptCache().get(chave) || 0);
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
    // a mensagem crua da exceção pode citar id de planilha e nome de
    // aba. Isso fica no log da conta do João, não vai pro navegador
    console.error('doGet: ' + err);
    return json({ erro: 'falha', mensagem: 'Não consegui consultar a agenda agora.' });
  }
}

/* ==================================================================
   ENTRADA: gravação (o site chama por POST)
   ================================================================== */

function doPost(e) {
  var trava = LockService.getScriptLock();
  try {
    trava.waitLock(10000);

    // corpo gigante nem chega a virar objeto: 8 KB é muito mais do que
    // qualquer agendamento honesto ocupa
    var cru = (e && e.postData && e.postData.contents) || '';
    if (cru.length > 8192) return json({ erro: 'grande demais' });

    var d = JSON.parse(cru);
    if (d.chave !== NUCLEO.CHAVE) return json({ erro: 'chave invalida' });

    if (d.acao === 'cancelar') return cancelar(d);

    return agendar(d);

  } catch (err) {
    console.error('doPost: ' + err);
    return json({ erro: 'falha', mensagem: 'Não consegui gravar agora. Tenta de novo em instantes.' });
  } finally {
    trava.releaseLock();
  }
}

function agendar(d) {
  var cfg = lerConfig();

  /* --- 1. isca de robô ---------------------------------------------
     Campo escondido no formulário. Gente nunca preenche, robô que sai
     preenchendo tudo, sim. Recusa sem explicar o motivo. */
  if (limpo(d.confirmacao, 40)) return json({ erro: 'recusado' });

  /* --- 2. conferir e cortar tudo que veio de fora ------------------ */
  var nome = limpo(d.nome, LIMITE.NOME);
  var tel  = telefoneValido(d.telefone);
  if (nome.length < 2) {
    return json({ erro: 'nome', mensagem: 'Coloca teu nome pra eu saber quem chega.' });
  }
  if (!tel) {
    return json({ erro: 'telefone', mensagem: 'Confere o número com DDD, é por ali que eu confirmo.' });
  }

  var servico = cfg.servicos[d.servico];
  if (!servico) return json({ erro: 'servico invalido' });

  var ondeChave = (d.local === 'domicilio') ? 'domicilio' : 'barbearia';
  var endereco = ondeChave === 'domicilio' ? limpo(d.endereco, LIMITE.ENDERECO) : '';
  if (ondeChave === 'domicilio' && endereco.length < 6) {
    return json({ erro: 'endereco', mensagem: 'Preciso do endereço pra saber onde te encontrar.' });
  }

  // o resto do motor passa a trabalhar só com o que foi conferido
  d.nome = nome;
  d.telefone = tel;
  d.local = ondeChave;
  d.endereco = endereco;
  d.aniversario = limpo(d.aniversario, 5);
  d.origem = limpo(d.origem, 40);
  d.observacao = limpo(d.observacao, LIMITE.OBSERVACAO);

  /* --- 3. freios ---------------------------------------------------
     Marcar pelo site é livre. Encher a agenda de horário falso, não. */
  if (contar('ag-tel-' + chaveTelefone(tel), LIMITE.AGENDA_TEL_SEG) > LIMITE.AGENDA_TELEFONE) {
    return json({
      erro: 'demais',
      mensagem: 'Esse número já marcou várias vezes seguidas. Me chama no WhatsApp que a gente resolve na conversa.'
    });
  }
  if (contar('ag-total', LIMITE.AGENDA_TOTAL_SEG) > LIMITE.AGENDA_TOTAL) {
    return json({
      erro: 'demais',
      mensagem: 'Chegou marcação demais ao mesmo tempo por aqui. Tenta daqui a pouco, ou me chama no WhatsApp.'
    });
  }

  /* --- 4. o horário tem que ser um dos que o motor ofereceu --------
     Antes daqui, o motor aceitava qualquer instante que chegasse no
     POST: 3 da manhã, domingo fechado, ano que vem, ou uma data que
     nem existe. Conferir contra a própria lista resolve os quatro de
     uma vez, porque ela já respeita expediente, antecedência e o
     encaixe no passo da grade. A janela de dias fica logo abaixo,
     que é a única regra que a lista não cobre. */
  var inicio = new Date(d.inicio);
  if (isNaN(inicio.getTime())) {
    return json({ erro: 'horario', mensagem: 'Esse horário não é válido. Escolhe de novo na tela.' });
  }

  var limiteJanela = Date.now() + (cfg.janelaDias + 1) * 86400000;
  if (inicio.getTime() > limiteJanela) {
    return json({ erro: 'horario', mensagem: 'Só dá pra marcar dentro dos próximos ' + cfg.janelaDias + ' dias.' });
  }

  var diaTexto = Utilities.formatDate(inicio, NUCLEO.FUSO, 'yyyy-MM-dd');
  var horaTexto = Utilities.formatDate(inicio, NUCLEO.FUSO, 'HH:mm');
  if (horariosLivres(cfg, diaTexto, d.servico, ondeChave).indexOf(horaTexto) === -1) {
    return json({
      erro: 'ocupado',
      mensagem: 'Esse horário não está mais disponível. Escolhe outro na tela.'
    });
  }

  var dur = duracaoTotal(cfg, d.servico, ondeChave);
  var fim = new Date(inicio.getTime() + dur * 60000);

  // Confere de novo, agora que está travado.
  if (!estaLivre(inicio, fim)) {
    return json({ erro: 'ocupado', mensagem: 'Esse horário acabou de ser preenchido. Escolha outro.' });
  }

  var local = ondeChave === 'domicilio'
    ? 'A domicílio: ' + endereco
    : 'Barbearia Rota 020';

  var ss = SpreadsheetApp.openById(NUCLEO.SHEET_ID);
  var codigo = novoCodigo(ss);

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

/**
 * Desmarca pelo código.
 *
 * Passou a exigir também os 4 últimos dígitos do WhatsApp. Motivo: o
 * código tem 4 letras de um alfabeto de 32, e sozinho ele era a única
 * coisa entre um estranho e o horário de outra pessoa. Chutar código
 * até acertar é trabalho de robô, não de gente. Com o telefone junto,
 * quem chuta precisa acertar as duas coisas ao mesmo tempo, e o freio
 * abaixo corta a repetição.
 *
 * A resposta é a mesma pra código que não existe e pra telefone que
 * não bate, de propósito: senão a tela vira um jeito de descobrir
 * quais códigos existem.
 */
function cancelar(d) {
  var cfg = lerConfig();
  var cod = String(d.codigo || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  var fim4 = soDigitos(d.telefone).slice(-4);

  if (!cod) return json({ erro: 'sem codigo', mensagem: 'Digite o código do agendamento.' });
  if (fim4.length < 4) {
    return json({
      erro: 'sem telefone',
      mensagem: 'Digite também os 4 últimos números do WhatsApp que você usou pra marcar.'
    });
  }

  if (tentativas('cancel-erro') >= LIMITE.CANCEL_ERRO) {
    return json({
      erro: 'demais',
      mensagem: 'Teve tentativa demais por aqui nos últimos minutos. Espera um pouco, ou me chama no WhatsApp que eu desmarco.'
    });
  }

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
  var cTel = cab.indexOf('WhatsApp');

  for (var i = linhas.length - 1; i >= 1; i--) {
    if (String(linhas[i][cCod]).trim().toUpperCase() !== cod) continue;
    // código certo com telefone errado cai fora sem dar pista nenhuma
    if (cTel >= 0 && soDigitos(linhas[i][cTel]).slice(-4) !== fim4) continue;

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

  contar('cancel-erro', LIMITE.CANCEL_ERRO_SEG);
  return json({
    erro: 'nao achou',
    mensagem: 'Não achei esse agendamento. Confere o código e os 4 últimos números, ou me chama no WhatsApp.'
  });
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
      'Primeira vez', 'Última visita', 'Visitas', 'Observações', 'Não enviar'
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

/**
 * Sorteia um código de 4 letras que ainda não foi usado.
 *
 * Antes o sorteio era cego. São 32^4 (pouco mais de um milhão) de
 * combinações, o que parece muito, mas repetição de sorteio acontece
 * bem antes do fim da lista: por volta da milésima marcação a chance
 * de duas iguais já passa de 50%. Código repetido significa desmarcar
 * o horário da pessoa errada, então agora ele confere a coluna antes.
 */
function novoCodigo(ss) {
  var abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // sem O/0 e I/1
  var usados = {};

  try {
    var linhas = aba(ss, NUCLEO.ABA_AGEND).getDataRange().getValues();
    var col = linhas.length ? linhas[0].indexOf('Código') : -1;
    if (col >= 0) {
      for (var i = 1; i < linhas.length; i++) {
        usados[String(linhas[i][col]).trim().toUpperCase()] = true;
      }
    }
  } catch (e) {
    // planilha ainda sem a aba: segue com sorteio simples
    console.error('novoCodigo: ' + e);
  }

  var s = '';
  for (var tentativa = 0; tentativa < 40; tentativa++) {
    s = '';
    for (var j = 0; j < 4; j++) s += abc.charAt(Math.floor(Math.random() * abc.length));
    if (!usados[s]) return s;
  }

  console.error('novoCodigo: 40 sorteios seguidos caíram em código já usado');
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
   RELACIONAMENTO: recall, aniversário, datas e confirmação
   ------------------------------------------------------------------
   Nada dispara mensagem sozinho. O motor monta a LISTA da semana e a
   lista de confirmações de amanhã e manda por EMAIL pro João, com um
   link de WhatsApp pronto por pessoa. Ele abre, confere o texto e
   envia, um a um, do número dele.

   Por que não é automático no WhatsApp: só a API oficial da Meta
   (paga, exige CNPJ verificado e aprovação de modelo de mensagem)
   dispara sem risco. Biblioteca não oficial derruba o número, e o
   número do João é a agenda inteira dele. O caminho pra migrar pra
   API oficial, quando fizer sentido, está em RELACIONAMENTO.md.

   Ligado por dois gatilhos de tempo, criados por instalarGatilhos
   (rodar uma vez; ver CLASP.md).
   ================================================================== */

var PADRAO_MSG = {
  recall:      'Fala {nome}, tudo certo? Vi aqui que já faz {dias} dias desde o teu último corte. Bora marcar? Me manda um dia que fica bom pra ti. Se não quiser mais receber lembrete meu, é só falar que eu paro.',
  aniversario: 'Opa {nome}! Passando pra te desejar um feliz aniversário. Quando quiser marcar o corte é só chamar. Abraço! Se não quiser mais receber mensagem minha, é só falar.',
  confirmacao: 'Oi {nome}, tudo bem? Confirmando o teu horário de amanhã às {hora} ({servico}, {local}). Posso confirmar?'
};

function lerMensagens() {
  var cache = CacheService.getScriptCache();
  var guardado = cache.get('mensagens');
  if (guardado) return JSON.parse(guardado);

  var out = {};
  var a = SpreadsheetApp.openById(NUCLEO.SHEET_ID).getSheetByName(NUCLEO.ABA_MENSAGENS);
  if (a && a.getLastRow() > 1) {
    a.getDataRange().getValues().slice(1).forEach(function (r) {
      var k = String(r[0]).trim().toLowerCase();
      if (k && String(r[1] || '').trim()) out[k] = String(r[1]).trim();
    });
  }
  cache.put('mensagens', JSON.stringify(out), NUCLEO.CACHE_SEG);
  return out;
}

// Monta o texto final trocando {nome}, {dias}, {hora}, {servico}, {local}.
function textoMsg(chave, dados) {
  var msgs = lerMensagens();
  var tpl = msgs[chave] || PADRAO_MSG[chave] || '';
  return String(tpl).replace(/\{(\w+)\}/g, function (_, k) {
    return (dados[k] === undefined || dados[k] === null) ? '' : String(dados[k]);
  });
}

function lerDatas() {
  var a = SpreadsheetApp.openById(NUCLEO.SHEET_ID).getSheetByName(NUCLEO.ABA_DATAS);
  if (!a || a.getLastRow() < 2) return [];
  return a.getDataRange().getValues().slice(1).map(function (r) {
    return {
      data: ddmm(r[0]),                          // "15/09", mesmo se o Sheets virou data
      nome: String(r[1] || '').trim(),
      mensagem: String(r[2] || '').trim(),
      ativo: verdadeiro(r[3])
    };
  }).filter(function (d) { return d.data && d.ativo; });
}

// Devolve "dd/MM" de uma célula que pode ser texto "15/09" ou um Date
// (o Sheets converte "15/09" em data sozinho, dependendo do formato).
function ddmm(v) {
  if (v instanceof Date) return Utilities.formatDate(v, NUCLEO.FUSO, 'dd/MM');
  return String(v || '').trim();
}

// Número no formato que o wa.me aceita: 55 + DDD + 9 dígitos.
// Assume celular (adiciona o 9 se vier sem). Fixo de cliente é raro aqui.
function numeroInternacional(v) {
  var d = soDigitos(v);
  if (d.indexOf('55') === 0 && d.length >= 12) d = d.slice(2);   // tira país e renormaliza
  if (d.length === 10) d = d.slice(0, 2) + '9' + d.slice(2);     // celular sem o 9
  return '55' + d;
}

function linkClienteWhats(telefone, texto) {
  return 'https://wa.me/' + numeroInternacional(telefone) + '?text=' + encodeURIComponent(texto);
}

// Lê célula de data: aceita Date, "yyyy-MM-dd" ou "dd/mm/aaaa".
function comoData(v) {
  if (v instanceof Date) return new Date(v.getFullYear(), v.getMonth(), v.getDate());
  var s = String(v || '').trim();
  var m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (m) { var ano = +m[3]; if (ano < 100) ano += 2000; return new Date(ano, +m[2] - 1, +m[1]); }
  return null;
}

// Próxima ocorrência de uma data anual (aniversário, feriado) a partir
// de hoje (inclusive). Aceita "dd/mm", "dd/mm/aaaa" ou um Date.
function proximaDataAnual(txt, ref) {
  var dia, mes;
  if (txt instanceof Date) {
    dia = txt.getDate(); mes = txt.getMonth() + 1;
  } else {
    var m = String(txt || '').match(/(\d{1,2})[\/\-.](\d{1,2})/);
    if (!m) return null;
    dia = +m[1]; mes = +m[2];
  }
  if (!dia || !mes || mes > 12 || dia > 31) return null;
  var base = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  var alvo = new Date(base.getFullYear(), mes - 1, dia);
  if (alvo < base) alvo = new Date(base.getFullYear() + 1, mes - 1, dia);
  return alvo;
}

function isoData(v) {
  if (v instanceof Date) return Utilities.formatDate(v, NUCLEO.FUSO, 'yyyy-MM-dd');
  return String(v).trim().slice(0, 10);
}

// Dia da semana em português. O EEEE do formatDate sai no idioma da conta
// Google, que na conta do projeto está em inglês ("Monday").
function diaSemanaPt(d) {
  return ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
          'quinta-feira', 'sexta-feira', 'sábado'][d.getDay()];
}

// Agendamentos de hoje pra frente, não cancelados. Serve pra não
// mandar recall pra quem já tem horário marcado, e pra listar a agenda.
function agendamentosPorVir() {
  var ss = SpreadsheetApp.openById(NUCLEO.SHEET_ID);
  var linhas = aba(ss, NUCLEO.ABA_AGEND).getDataRange().getValues();
  if (linhas.length < 2) return { temChave: {}, lista: [] };

  var cab = linhas[0];
  var c = {
    status: cab.indexOf('Status'), data: cab.indexOf('Data do corte'),
    hora: cab.indexOf('Hora'), nome: cab.indexOf('Nome'),
    tel: cab.indexOf('WhatsApp'), serv: cab.indexOf('Serviço'), local: cab.indexOf('Local')
  };
  var hojeTxt = Utilities.formatDate(new Date(), NUCLEO.FUSO, 'yyyy-MM-dd');
  var temChave = {}, lista = [];

  for (var i = 1; i < linhas.length; i++) {
    var r = linhas[i];
    if (String(r[c.status]).trim().toLowerCase().indexOf('cancel') === 0) continue;
    var dataTxt = isoData(r[c.data]);
    if (dataTxt < hojeTxt) continue;
    temChave[chaveTelefone(r[c.tel])] = true;
    lista.push({
      dataTxt: dataTxt, hora: hhmm(r[c.hora]), nome: String(r[c.nome] || 'cliente'),
      tel: r[c.tel], servico: String(r[c.serv] || ''), local: String(r[c.local] || '')
    });
  }
  return { temChave: temChave, lista: lista };
}

/* ==================================================================
   resumoSemanal  ·  gatilho: uma vez por semana, de manhã
   Aniversários da semana + recall + data comemorativa + agenda dos
   próximos 7 dias. Um email só, com link de WhatsApp por pessoa.
   ================================================================== */
function resumoSemanal() {
  var cfg = lerConfig();
  var ss = SpreadsheetApp.openById(NUCLEO.SHEET_ID);
  var hoje = new Date();
  var hojeDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  var fim = new Date(hojeDia.getTime() + 7 * 86400000);
  var fimTxt = Utilities.formatDate(fim, NUCLEO.FUSO, 'yyyy-MM-dd');

  var futuros = agendamentosPorVir();

  var clientes = aba(ss, NUCLEO.ABA_CLIENTES).getDataRange().getValues();
  var cab = clientes[0];
  var c = {
    tel: cab.indexOf('WhatsApp'), nome: cab.indexOf('Nome'),
    aniv: cab.indexOf('Aniversário'), ult: cab.indexOf('Última visita'),
    naoEnviar: cab.indexOf('Não enviar')
  };

  var aniversario = [], recall = [];

  for (var i = 1; i < clientes.length; i++) {
    var r = clientes[i];
    if (!r[c.tel]) continue;
    /* Direito de oposição, art. 18 da LGPD, virado em coluna: quem
       pedir pra não receber mais recebe um "sim" na coluna "Não
       enviar" e some destas duas listas. A confirmação do dia
       seguinte continua, porque ela é sobre um horário que a própria
       pessoa marcou, não é divulgação. */
    if (c.naoEnviar >= 0 && String(r[c.naoEnviar]).trim()) continue;
    if (String(r[c.tel]).indexOf('anonimizado') === 0) continue;
    var nome = String(r[c.nome] || 'cliente');
    var chave = chaveTelefone(r[c.tel]);

    var aniv = proximaDataAnual(r[c.aniv], hoje);
    if (aniv && aniv >= hojeDia && aniv < fim) {
      aniversario.push({
        nome: nome, quando: diaSemanaPt(aniv) + ', ' + formatar(aniv, 'dd/MM'),
        link: linkClienteWhats(r[c.tel], textoMsg('aniversario', { nome: nome }))
      });
    }

    var ult = comoData(r[c.ult]);
    if (ult && !futuros.temChave[chave]) {
      var dias = Math.round((hojeDia - ult) / 86400000);
      if (dias >= cfg.recallDias && dias <= cfg.recallLimiteDias) {
        recall.push({
          nome: nome, dias: dias, ult: formatar(ult, 'dd/MM'),
          link: linkClienteWhats(r[c.tel], textoMsg('recall', { nome: nome, dias: dias }))
        });
      }
    }
  }

  recall.sort(function (a, b) { return b.dias - a.dias; });

  var datas = lerDatas().filter(function (d) {
    var prox = proximaDataAnual(d.data, hoje);
    return prox && prox >= hojeDia && prox < fim;
  });

  var agenda7 = futuros.lista
    .filter(function (a) { return a.dataTxt < fimTxt; })
    .sort(function (a, b) { return (a.dataTxt + a.hora).localeCompare(b.dataTxt + b.hora); });

  var L = [];
  L.push('Bom dia, João.');
  L.push('Lista da semana, ' + formatar(hojeDia, 'dd/MM') + ' a ' + formatar(new Date(fim.getTime() - 86400000), 'dd/MM') + '.');
  L.push('Toca no link de cada um, lê o texto e manda. Um por um, do teu número.');
  L.push('');

  L.push('== ANIVERSÁRIO (' + aniversario.length + ') ==');
  if (!aniversario.length) L.push('  ninguém essa semana');
  aniversario.forEach(function (a) {
    L.push('  ' + a.nome + '  ·  ' + a.quando);
    L.push('  ' + a.link);
    L.push('');
  });

  L.push('== RECALL, passou de ' + cfg.recallDias + ' dias sem cortar (' + recall.length + ') ==');
  if (!recall.length) L.push('  ninguém no ponto');
  recall.forEach(function (x) {
    L.push('  ' + x.nome + '  ·  ' + x.dias + ' dias (último ' + x.ult + ')');
    L.push('  ' + x.link);
    L.push('');
  });

  if (datas.length) {
    L.push('== DATA DA SEMANA ==');
    datas.forEach(function (d) {
      L.push('  ' + d.nome + '  ·  ' + d.data);
      if (d.mensagem) L.push('  Texto (troca o {nome}): ' + d.mensagem);
      L.push('  Manda pra quem faz sentido, não precisa ser a base toda.');
      L.push('');
    });
  }

  L.push('== JÁ AGENDADOS, próximos 7 dias (' + agenda7.length + ') ==');
  if (!agenda7.length) L.push('  nada marcado ainda');
  agenda7.forEach(function (a) {
    L.push('  ' + a.dataTxt.split('-').reverse().slice(0, 2).join('/') + ' ' + a.hora
      + '  ·  ' + a.nome + '  ·  ' + a.servico + '  ·  ' + a.local);
  });
  L.push('');
  L.push('---');
  L.push('Quem sumiu faz mais de ' + cfg.recallLimiteDias + ' dias não entra no recall pra não virar spam. Pra reativar esses, me fala.');

  enviarLista(cfg, 'Lista da semana · ' + formatar(hojeDia, 'dd/MM'), L.join('\n'));
}

/* ==================================================================
   confirmacoesDoDia  ·  gatilho: todo dia, fim da tarde
   Lista os horários de amanhã pro João confirmar hoje.
   ================================================================== */
function confirmacoesDoDia() {
  var cfg = lerConfig();
  var amanha = new Date(Date.now() + 86400000);
  var amanhaTxt = Utilities.formatDate(amanha, NUCLEO.FUSO, 'yyyy-MM-dd');

  var doDia = agendamentosPorVir().lista.filter(function (a) { return a.dataTxt === amanhaTxt; });
  if (!doDia.length) return;   // amanhã sem ninguém: não enche a caixa de email

  doDia.sort(function (a, b) { return a.hora.localeCompare(b.hora); });

  var L = [];
  L.push('João, confirmações pra amanhã, ' + diaSemanaPt(amanha) + ', ' + formatar(amanha, 'dd/MM') + ' (' + doDia.length + ').');
  L.push('Manda agora. Quem não responder até de manhã, tu decide segurar ou liberar o horário.');
  L.push('');
  doDia.forEach(function (a) {
    L.push('  ' + a.hora + '  ·  ' + a.nome + '  ·  ' + a.servico + '  ·  ' + a.local);
    L.push('  ' + linkClienteWhats(a.tel, textoMsg('confirmacao', {
      nome: a.nome, hora: a.hora, servico: a.servico, local: a.local
    })));
    L.push('');
  });

  enviarLista(cfg, 'Confirmar amanhã · ' + doDia.length + ' horário(s)', L.join('\n'));
}

function enviarLista(cfg, assunto, corpo) {
  var para = cfg.emailAviso || Session.getEffectiveUser().getEmail();
  if (!para) { Logger.log('Sem email de destino: preencha "Email de aviso" na aba Config.'); return; }
  MailApp.sendEmail(para, 'João Barber · ' + assunto, corpo);
}

/* ==================================================================
   instalarGatilhos  ·  rodar UMA vez, e de novo se mudar dia/hora
   na aba Config. Cria os dois gatilhos de tempo.
   ================================================================== */
function instalarGatilhos() {
  var cfg = lerConfig();

  ScriptApp.getProjectTriggers().forEach(function (t) {
    var f = t.getHandlerFunction();
    if (f === 'resumoSemanal' || f === 'confirmacoesDoDia' || f === 'limparDadosAntigos') {
      ScriptApp.deleteTrigger(t);
    }
  });

  var DIAS = {
    'domingo': ScriptApp.WeekDay.SUNDAY, 'segunda': ScriptApp.WeekDay.MONDAY,
    'terca': ScriptApp.WeekDay.TUESDAY, 'terça': ScriptApp.WeekDay.TUESDAY,
    'quarta': ScriptApp.WeekDay.WEDNESDAY, 'quinta': ScriptApp.WeekDay.THURSDAY,
    'sexta': ScriptApp.WeekDay.FRIDAY, 'sabado': ScriptApp.WeekDay.SATURDAY,
    'sábado': ScriptApp.WeekDay.SATURDAY
  };
  var dia = DIAS[String(cfg.resumoDia).trim().toLowerCase()] || ScriptApp.WeekDay.MONDAY;

  ScriptApp.newTrigger('resumoSemanal').timeBased()
    .onWeekDay(dia).atHour(faixaHora(cfg.resumoHora)).create();

  ScriptApp.newTrigger('confirmacoesDoDia').timeBased()
    .everyDays(1).atHour(faixaHora(cfg.confirmarHora)).create();

  // faxina de dados antigos, uma vez por mês, de madrugada
  ScriptApp.newTrigger('limparDadosAntigos').timeBased()
    .onMonthDay(1).atHour(4).create();

  Logger.log('Gatilhos criados:');
  Logger.log('  resumoSemanal      -> toda ' + cfg.resumoDia + ', por volta de ' + faixaHora(cfg.resumoHora) + 'h');
  Logger.log('  confirmacoesDoDia  -> todo dia, por volta de ' + faixaHora(cfg.confirmarHora) + 'h');
  Logger.log('  limparDadosAntigos -> dia 1 de cada mês, de madrugada');
  Logger.log('Mudou dia/hora na aba Config? Rode instalarGatilhos de novo.');
}

/* ==================================================================
   limparDadosAntigos  ·  o prazo de guarda da LGPD, em código
   ------------------------------------------------------------------
   A LGPD manda apagar o dado pessoal quando ele deixa de ser
   necessário pra finalidade que justificou a coleta (art. 15 e 16).
   Cliente que não volta há anos não é mais base de agendamento nem de
   recall: é arquivo morto com telefone e endereço de gente dentro.

   O que este gatilho faz, uma vez por mês:
     - aba Clientes: quem não aparece há mais que "Guardar dados por"
       perde nome, telefone, aniversário e observação. Sobra a linha
       anonimizada, só com a contagem de visitas, que serve pra
       estatística e não identifica ninguém
     - aba Agendamentos: linha antiga perde nome e telefone pelo mesmo
       motivo. Data, serviço e local ficam

   Nada some da vista do João sem aviso: o resumo vai por email.
   Rodar na mão, sem esperar o dia 1, é seguro.
   ================================================================== */
function limparDadosAntigos() {
  var cfg = lerConfig();
  var meses = cfg.guardarMeses;
  if (!meses || meses <= 0) {
    Logger.log('Guardar dados por = 0: faxina desligada.');
    return;
  }

  var corte = new Date();
  corte.setMonth(corte.getMonth() - meses);
  var ss = SpreadsheetApp.openById(NUCLEO.SHEET_ID);
  var mexidas = [];

  /* ---------- Clientes ---------- */
  try {
    var ac = aba(ss, NUCLEO.ABA_CLIENTES);
    var lc = ac.getDataRange().getValues();
    var cab = lc[0] || [];
    var iTel = cab.indexOf('WhatsApp');
    var iNome = cab.indexOf('Nome');
    var iNasc = cab.indexOf('Aniversário');
    var iUlt = cab.indexOf('Última visita');
    var iObs = cab.indexOf('Observações');
    var n = 0;

    for (var i = 1; i < lc.length; i++) {
      var ultima = lc[i][iUlt];
      if (!ultima) continue;
      var quando = (ultima instanceof Date) ? ultima : new Date(String(ultima));
      if (isNaN(quando.getTime()) || quando >= corte) continue;
      if (String(lc[i][iTel]).indexOf('anonimizado') === 0) continue;   // já passou por aqui

      if (iTel >= 0)  ac.getRange(i + 1, iTel + 1).setValue('anonimizado');
      if (iNome >= 0) ac.getRange(i + 1, iNome + 1).setValue('(cliente antigo)');
      if (iNasc >= 0) ac.getRange(i + 1, iNasc + 1).setValue('');
      if (iObs >= 0)  ac.getRange(i + 1, iObs + 1).setValue('');
      n++;
    }
    if (n) mexidas.push(n + ' cliente(s) sem voltar há mais de ' + meses + ' meses foram anonimizados');
  } catch (e) {
    console.error('limparDadosAntigos/Clientes: ' + e);
  }

  /* ---------- Agendamentos ---------- */
  try {
    var aa = aba(ss, NUCLEO.ABA_AGEND);
    var la = aa.getDataRange().getValues();
    var cab2 = la[0] || [];
    var jData = cab2.indexOf('Data do corte');
    var jNome = cab2.indexOf('Nome');
    var jTel = cab2.indexOf('WhatsApp');
    var m = 0;

    for (var k = 1; k < la.length; k++) {
      var dt = la[k][jData];
      if (!dt) continue;
      var quando2 = (dt instanceof Date) ? dt : new Date(String(dt) + 'T12:00:00');
      if (isNaN(quando2.getTime()) || quando2 >= corte) continue;
      if (String(la[k][jNome]) === '(removido)') continue;

      if (jNome >= 0) aa.getRange(k + 1, jNome + 1).setValue('(removido)');
      if (jTel >= 0)  aa.getRange(k + 1, jTel + 1).setValue('');
      m++;
    }
    if (m) mexidas.push(m + ' agendamento(s) com mais de ' + meses + ' meses perderam nome e telefone');
  } catch (e) {
    console.error('limparDadosAntigos/Agendamentos: ' + e);
  }

  if (!mexidas.length) {
    Logger.log('Faxina rodou e não achou nada pra limpar.');
    return;
  }

  Logger.log(mexidas.join('\n'));
  avisarEmail(cfg, 'Limpeza de dados antigos',
    'A faxina mensal da planilha rodou hoje:\n\n' + mexidas.join('\n')
    + '\n\nIsso é a regra de prazo de guarda que está na política de privacidade '
    + 'do site. Pra mudar o prazo, é a linha "Guardar dados por" na aba Config.');
}

function faixaHora(n) {
  n = Number(n);
  if (isNaN(n)) return 8;
  return Math.max(0, Math.min(23, Math.round(n)));
}

/* ==================================================================
   TESTE
   Rodar essa função no editor pra conferir se planilha, abas e
   agenda estão acessíveis, antes de ligar o site.
   ================================================================== */

function testar() {
  var cfg = lerConfig();
  var hoje = Utilities.formatDate(new Date(), NUCLEO.FUSO, 'yyyy-MM-dd');

  Logger.log('=== O BÁSICO ===');
  Logger.log('Agenda: ' + agenda().getName());
  Logger.log('WhatsApp na Config: ' + (cfg.whatsapp || '(vazio!)'));
  Logger.log('Janela de agenda: ' + cfg.janelaDias + ' dias');
  Logger.log('Serviços ativos: ' + Object.keys(cfg.servicos).join(', '));
  Logger.log('Expediente hoje: ' + JSON.stringify(cfg.expediente[new Date().getDay()]));
  Logger.log('Horários livres hoje pra corte: ' + horariosLivres(cfg, hoje, 'corte', 'barbearia'));

  /* A partir daqui é a conferência da parte de segurança e LGPD que
     entrou em 31/08/2026. Só publicar o código não basta: duas coisas
     dependem de montarPlanilha e instalarGatilhos terem rodado, e sem
     elas o opt-out e a faxina ficam publicados mas dormindo. */
  Logger.log('');
  Logger.log('=== SEGURANÇA E LGPD ===');

  var gs = ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); });
  ['resumoSemanal', 'confirmacoesDoDia', 'limparDadosAntigos'].forEach(function (nome) {
    Logger.log('Gatilho ' + nome + ': ' + (gs.indexOf(nome) >= 0 ? 'INSTALADO' : 'FALTANDO (rode instalarGatilhos)'));
  });

  Logger.log('Prazo de guarda: ' + (cfg.guardarMeses > 0
    ? cfg.guardarMeses + ' meses'
    : 'DESLIGADO (a linha "Guardar dados por" falta na Config, ou está 0)'));

  try {
    var ac = aba(SpreadsheetApp.openById(NUCLEO.SHEET_ID), NUCLEO.ABA_CLIENTES);
    if (ac.getLastRow() === 0) {
      Logger.log('Aba Clientes: vazia, sem cabeçalho ainda');
    } else {
      var cab = ac.getRange(1, 1, 1, ac.getLastColumn()).getValues()[0]
        .map(function (v) { return String(v).trim(); });
      Logger.log('Coluna "Não enviar": ' + (cab.indexOf('Não enviar') >= 0
        ? 'EXISTE (escreva "sim" pra quem pedir pra não receber mensagem)'
        : 'FALTANDO (rode montarPlanilha)'));
      Logger.log('Clientes cadastrados: ' + (ac.getLastRow() - 1));
    }
  } catch (e) {
    Logger.log('Aba Clientes: erro ao ler, ' + e);
  }

  Logger.log('');
  Logger.log('Se aparecer FALTANDO ou DESLIGADO acima, rode montarPlanilha');
  Logger.log('e instalarGatilhos, nessa ordem, e rode testar() de novo.');
}

/* ==================================================================
   MONTAR A PLANILHA
   Cria e preenche as 7 abas sozinho, no lugar de fazer na mão.
   Rodar uma vez, no editor ou com  clasp run montarPlanilha.

   É seguro rodar de novo: só mexe no que está faltando ou vazio.
   Nunca apaga dado. Se a aba Agendamentos ainda for a da v1 (sem a
   coluna Código), ela é RENOMEADA pra "Agendamentos (v1)" e uma nova
   entra no lugar, porque as colunas mudaram de ordem. Numa planilha
   que já existe, acrescenta os parâmetros novos da aba Config e cria
   as abas Mensagens e Datas se faltarem.
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
    ['WhatsApp do João', '5561981607166', 'só números, com 55 e DDD. É por aqui que a confirmação abre. Confirmado em 31/08/2026'],
    ['Email de aviso', '', 'recebe aviso de cada marcação e cancelamento, e as listas da semana e de confirmação. Vazio = cai no email da própria conta'],
    ['Antecedência mínima', 2, 'horas. Não deixa marcar em cima da hora'],
    ['Janela de agenda', 14, 'dias pra frente que a agenda abre. Curto de propósito, deixa margem pra imprevisto'],
    ['Passo dos horários', 15, 'minutos entre um horário e o próximo na lista'],
    ['Extra domicílio', 45, 'minutos de deslocamento, além da duração do serviço'],
    ['Cancelar pelo site até', 6, 'horas antes do horário. 0 desliga o cancelamento pelo site'],
    ['Guardar dados por', 24, 'meses sem voltar. Passou disso, o cliente é anonimizado sozinho (LGPD). 0 desliga a faxina'],
    ['Recall a partir de', 15, 'dias desde o último corte pra pessoa entrar na lista de recall'],
    ['Recall ignora após', 60, 'dias. Quem sumiu faz mais que isso não entra no recall automático'],
    ['Dia do resumo', 'Segunda', 'dia da semana em que a lista da semana chega por email'],
    ['Hora do resumo', 8, 'hora aproximada do email da lista da semana'],
    ['Hora da confirmação', 18, 'hora aproximada do email com as confirmações do dia seguinte']
  ]);

  // Planilha que já existia: acrescenta só os parâmetros que faltam.
  completarConfig(ss, feito);
  completarClientes(ss, feito);

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
     'Primeira vez', 'Última visita', 'Visitas', 'Observações', 'Não enviar']
  ]);

  /* ---------- Mensagens (textos de recall, aniversário, confirmação) ---------- */
  preencherSeVazia(pegarOuCriar(NUCLEO.ABA_MENSAGENS), [
    ['chave', 'texto  ·  use {nome}, {dias}, {hora}, {servico}, {local}'],
    ['recall',      PADRAO_MSG.recall],
    ['aniversario', PADRAO_MSG.aniversario],
    ['confirmacao', PADRAO_MSG.confirmacao]
  ]);

  /* ---------- Datas comemorativas (dd/mm) ----------
     Coluna da data vira TEXTO antes de receber valor, senão o Google
     converte "15/09" numa data de verdade. O motor lida com os dois
     casos, mas texto é mais previsível pro João editar. */
  var dts = pegarOuCriar(NUCLEO.ABA_DATAS);
  if (dts.getLastRow() === 0) {
    dts.getRange(1, 1, 60, 1).setNumberFormat('@');
    preencherSeVazia(dts, [
      ['data (dd/mm)', 'nome', 'mensagem  ·  use {nome}', 'ativo'],
      ['15/09', 'Dia do Cliente', 'Fala {nome}! Hoje é Dia do Cliente e eu queria te agradecer por confiar o teu corte comigo. Valeu demais.', 'sim'],
      ['24/12', 'Natal',          'Fala {nome}, passando pra desejar um feliz Natal pra ti e tua família. Obrigado pela parceria esse ano.', 'sim'],
      ['31/12', 'Ano novo',       '{nome}, que o ano novo venha completo pra ti. Valeu pela confiança, e bora manter o visual em dia.', 'sim']
    ]);
  } else {
    feito.push('"' + NUCLEO.ABA_DATAS + '" já tinha conteúdo, não mexi');
  }
  // Datas que mudam de dia todo ano (Dia dos Pais, Páscoa): o João
  // acrescenta a linha com a data daquele ano quando chegar perto.

  /* ---------- ordem das abas, só pra ficar legível ---------- */
  [NUCLEO.ABA_CONFIG, NUCLEO.ABA_SERVICOS, NUCLEO.ABA_EXPED,
   NUCLEO.ABA_AGEND, NUCLEO.ABA_CLIENTES, NUCLEO.ABA_MENSAGENS,
   NUCLEO.ABA_DATAS].forEach(function (nome, i) {
    var a = ss.getSheetByName(nome);
    if (a) { ss.setActiveSheet(a); ss.moveActiveSheet(i + 1); }
  });

  // A config muda, então o cache velho não serve mais.
  CacheService.getScriptCache().remove('config');
  CacheService.getScriptCache().remove('mensagens');

  Logger.log('== montarPlanilha ==');
  feito.forEach(function (l) { Logger.log('  - ' + l); });
  Logger.log('Planilha: ' + ss.getName());
  Logger.log('Abas agora: ' + ss.getSheets().map(function (s) { return s.getName(); }).join(', '));
  Logger.log('\nAgora rode  testar  pra conferir que o motor lê tudo,');
  Logger.log('e  instalarGatilhos  pra ligar a lista da semana e as confirmações.');

  return feito;
}

// Acrescenta na aba Config os parâmetros que ainda não estão lá.
// Só roda quando a aba já tem conteúdo (planilha antiga); a aba vazia
// já sai completa pelo preencherSeVazia acima.
/**
 * Planilha que já existia não ganha coluna nova sozinha: o
 * preencherSeVazia só mexe em aba vazia. Esta função acrescenta a
 * coluna "Não enviar" na aba Clientes, que é onde o pedido de "não
 * quero mais receber mensagem" fica registrado (art. 18 da LGPD).
 * Sem ela, o recall continua chamando quem já pediu pra parar.
 */
function completarClientes(ss, feito) {
  var a = ss.getSheetByName(NUCLEO.ABA_CLIENTES);
  if (!a || a.getLastRow() === 0) return;

  var cab = a.getRange(1, 1, 1, a.getLastColumn()).getValues()[0]
    .map(function (v) { return String(v).trim(); });

  if (cab.indexOf('Não enviar') >= 0) {
    feito.push('Clientes: coluna "Não enviar" já estava lá');
    return;
  }

  a.getRange(1, cab.length + 1).setValue('Não enviar');
  feito.push('Clientes: coluna "Não enviar" criada (escreva "sim" pra quem pedir pra não receber mensagem)');
}

function completarConfig(ss, feito) {
  var a = ss.getSheetByName(NUCLEO.ABA_CONFIG);
  if (!a || a.getLastRow() === 0) return;

  var jaTem = a.getRange(1, 1, a.getLastRow(), 1).getValues()
    .map(function (r) { return String(r[0]).trim().toLowerCase(); });

  function falta(prefixo) {
    return !jaTem.some(function (e) { return e.indexOf(prefixo) === 0; });
  }
  // "recall" sozinho tem que ignorar a linha "recall ignora após"
  var temRecallBase = jaTem.some(function (e) {
    return e.indexOf('recall') === 0 && e.indexOf('recall ignora') !== 0;
  });

  var novas = [];
  if (!temRecallBase)          novas.push(['Recall a partir de', 15, 'dias desde o último corte pra pessoa entrar na lista de recall']);
  if (falta('recall ignora'))  novas.push(['Recall ignora após', 60, 'dias. Quem sumiu faz mais que isso não entra no recall automático']);
  if (falta('dia do resumo'))  novas.push(['Dia do resumo', 'Segunda', 'dia da semana em que a lista da semana chega por email']);
  if (falta('hora do resumo')) novas.push(['Hora do resumo', 8, 'hora aproximada do email da lista da semana']);
  if (falta('hora da confirm')) novas.push(['Hora da confirmação', 18, 'hora aproximada do email com as confirmações do dia seguinte']);
  if (falta('guardar'))        novas.push(['Guardar dados por', 24, 'meses sem voltar. Passou disso, o cliente é anonimizado sozinho (LGPD). 0 desliga a faxina']);

  novas.forEach(function (l) { a.appendRow(l); feito.push('Config: "' + l[0] + '" adicionada'); });
  if (!novas.length) feito.push('Config: parâmetros de relacionamento já estavam lá');
  else feito.push('Config: confira "Janela de agenda" à mão (o motor não mexe em valor já existente)');
}
