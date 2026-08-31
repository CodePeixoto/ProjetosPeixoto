/* TESTE DO MOTOR  ·  rodar com:  node teste-motor.js
   (de dentro da pasta agendamento, ou de qualquer lugar com o caminho completo)
   ------------------------------------------------------------------
   Roda o apps-script.gs fora do Google, com um Apps Script de mentira
   no lugar (planilha, agenda, cache e email fingidos). Serve pra pegar
   regressão de LÓGICA e de SEGURANÇA antes de publicar, sem gastar
   agenda de verdade nem cota da conta do João.

   Não substitui o teste na conta real: fuso, autorização e quota só
   aparecem lá. Mas se um destes 44 falhar, não publica.

   Depois de mexer no apps-script.gs:  node teste-motor.js  e só então
   ./publicar-motor.ps1

   Simulador mínimo do Apps Script pra exercitar doGet/doPost/agendar/cancelar
   fora do Google. Não substitui o teste na conta real, mas pega regressão de
   lógica, que é onde a segurança mora. */
const fs = require('fs');
const path = require('path').join(__dirname, 'apps-script.gs');

const FUSO_OFFSET = -3 * 60; // Brasília, sem horário de verão

function emBrasilia(d) { return new Date(d.getTime() + (FUSO_OFFSET - d.getTimezoneOffset() * -1 * 0) * 0 + FUSO_OFFSET * 60000 - d.getTimezoneOffset() * 60000 * 0); }

// --- Utilities.formatDate simplificado, sempre em UTC-3 ---
const DIAS = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
function partes(d) {
  const t = new Date(d.getTime() + FUSO_OFFSET * 60000);
  return { y: t.getUTCFullYear(), M: t.getUTCMonth() + 1, d: t.getUTCDate(), H: t.getUTCHours(), m: t.getUTCMinutes(), w: t.getUTCDay() };
}
const p2 = n => (n < 10 ? '0' : '') + n;

global.Utilities = {
  formatDate(date, tz, pat) {
    const q = partes(date);
    return pat
      .replace(/EEEE/g, DIAS[q.w]).replace(/EEE/g, DIAS[q.w].slice(0, 3))
      .replace(/yyyy/g, q.y).replace(/MMMM/g, MESES[q.M - 1])
      .replace(/MM/g, p2(q.M)).replace(/dd/g, p2(q.d))
      .replace(/HH/g, p2(q.H)).replace(/mm/g, p2(q.m))
      .replace(/\bd\b/g, q.d);
  }
};
global.Session = { getScriptTimeZone: () => 'America/Sao_Paulo', getEffectiveUser: () => ({ getEmail: () => 'joaobarber.agenda@gmail.com' }) };

// --- Cache ---
const cacheMap = new Map();
global.CacheService = {
  getScriptCache: () => ({
    get: k => (cacheMap.has(k) ? cacheMap.get(k) : null),
    put: (k, v) => cacheMap.set(k, v),
    remove: k => cacheMap.delete(k)
  })
};

// --- Planilha ---
function novaAba(nome, linhas) {
  const a = { nome, linhas };
  a.getName = () => nome;
  a.getLastRow = () => a.linhas.length;
  a.getDataRange = () => ({ getValues: () => a.linhas.map(r => r.slice()) });
  a.appendRow = r => a.linhas.push(r.slice());
  a.setFrozenRows = () => {};
  a.getLastColumn = () => (a.linhas[0] ? a.linhas[0].length : 0);
  a.getRange = (lin, col) => ({
    setValue: v => { a.linhas[lin - 1][col - 1] = v; },
    getValues: () => [a.linhas[lin - 1].slice()]
  });
  return a;
}
const abas = {};
global.SpreadsheetApp = {
  openById: () => ({ getSheetByName: n => abas[n] || null })
};

// --- Agenda ---
let eventos = [];
global.CalendarApp = {
  getDefaultCalendar: () => ({
    getEvents: (ini, fim) => eventos.filter(e => e.ini < fim.getTime() && e.fim > ini.getTime())
      .map(e => ({ getStartTime: () => new Date(e.ini), getEndTime: () => new Date(e.fim), getId: () => e.id, deleteEvent: () => { eventos = eventos.filter(x => x.id !== e.id); } })),
    createEvent: (titulo, ini, fim) => {
      const id = 'ev' + (eventos.length + 1);
      eventos.push({ id, titulo, ini: ini.getTime(), fim: fim.getTime() });
      return { getId: () => id };
    },
    getEventById: id => {
      const e = eventos.find(x => x.id === id);
      if (!e) return null;
      return { getStartTime: () => new Date(e.ini), getEndTime: () => new Date(e.fim), deleteEvent: () => { eventos = eventos.filter(x => x.id !== id); } };
    }
  })
};

global.MailApp = { sendEmail: () => {} };
global.LockService = { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) };
global.ScriptApp = { getProjectTriggers: () => [], newTrigger: () => ({}) };
global.Logger = { log: () => {} };
global.ContentService = {
  MimeType: { JSON: 'json' },
  createTextOutput: s => ({ setMimeType: () => JSON.parse(s) })
};

// --- carrega o motor ---
eval(fs.readFileSync(path, 'utf8'));

/* ================== montagem do cenário ================== */
function montarAbas() {
  abas['Config'] = novaAba('Config', [
    ['Parâmetro', 'Valor', 'Ajuda'],
    ['WhatsApp do João', '5561981607166', ''],
    ['Email de aviso', '', ''],
    ['Antecedência mínima', 2, ''],
    ['Janela de agenda', 14, ''],
    ['Passo dos horários', 15, ''],
    ['Extra domicílio', 45, ''],
    ['Cancelar pelo site até', 6, ''],
    ['Guardar dados por', 24, '']
  ]);
  abas['Serviços'] = novaAba('Serviços', [
    ['chave', 'nome', 'minutos', 'descrição', 'ativo'],
    ['corte', 'Corte', 40, 'x', 'sim'],
    ['barba', 'Barba', 30, 'y', 'sim']
  ]);
  abas['Expediente'] = novaAba('Expediente', [
    ['dia', 'abre', 'fecha', 'abre 2', 'fecha 2'],
    ['Domingo', '', '', '', ''],
    ['Segunda', '09:00', '12:00', '13:30', '19:00'],
    ['Terça', '09:00', '12:00', '13:30', '19:00'],
    ['Quarta', '09:00', '12:00', '13:30', '19:00'],
    ['Quinta', '09:00', '12:00', '13:30', '19:00'],
    ['Sexta', '09:00', '12:00', '13:30', '20:00'],
    ['Sábado', '08:00', '17:00', '', '']
  ]);
  abas['Agendamentos'] = novaAba('Agendamentos', []);
  abas['Clientes'] = novaAba('Clientes', []);
  abas['Mensagens'] = novaAba('Mensagens', [['chave', 'texto']]);
  abas['Datas'] = novaAba('Datas', [['data', 'nome']]);
  cacheMap.clear();
  eventos = [];
}

const CHAVE = 'jb-fdded1b286dc138fe9dab196';
function post(obj) {
  return doPost({ postData: { contents: JSON.stringify(Object.assign({ chave: CHAVE }, obj)) } });
}
function get(obj) {
  return doGet({ parameter: Object.assign({ chave: CHAVE }, obj) });
}

// acha um horário livre de verdade pra usar nos testes
function horarioBom(indiceDia) {
  const cfg = lerConfig();
  const dias = diasComVaga(cfg, 'corte', 'barbearia').filter(d => d.vagas > 0);
  const dia = dias[Math.min(indiceDia || 0, dias.length - 1)].data;
  const hora = horariosLivres(cfg, dia, 'corte', 'barbearia')[0];
  return { dia, hora, iso: dia + 'T' + hora + ':00-03:00' };
}

/* ================== testes ================== */
let ok = 0, falhou = 0;
function checa(nome, condicao, extra) {
  if (condicao) { ok++; console.log('  ok   ' + nome); }
  else { falhou++; console.log('  FALHOU ' + nome + (extra ? '  -> ' + JSON.stringify(extra) : '')); }
}

console.log('\n=== 1. agendamento normal continua funcionando ===');
montarAbas();
let h = horarioBom();
let r = post({ servico: 'corte', local: 'barbearia', inicio: h.iso, nome: 'Mateus Silva', telefone: '(61) 9 8877-6655' });
checa('marca e devolve código', r.ok === true && /^[A-Z0-9]{4}$/.test(r.codigo || ''), r);
checa('gravou na aba Agendamentos', abas['Agendamentos'].linhas.length === 2);
checa('gravou o cliente', abas['Clientes'].linhas.length === 2);
checa('criou o evento na agenda', eventos.length === 1);
const codigoBom = r.codigo;

console.log('\n=== 2. horário fora do expediente é recusado (era o buraco maior) ===');
montarAbas();
const madrugada = h.dia + 'T03:00:00-03:00';
r = post({ servico: 'corte', local: 'barbearia', inicio: madrugada, nome: 'Robo', telefone: '61988776655' });
checa('3 da manhã recusado', r.ok !== true, r);
checa('nada foi criado na agenda', eventos.length === 0);

console.log('\n=== 3. horário no passado e fora da janela ===');
montarAbas();
r = post({ servico: 'corte', local: 'barbearia', inicio: '2020-01-06T10:00:00-03:00', nome: 'Passado', telefone: '61988776655' });
checa('data no passado recusada', r.ok !== true, r);
r = post({ servico: 'corte', local: 'barbearia', inicio: '2030-01-07T10:00:00-03:00', nome: 'Futuro', telefone: '61988776655' });
checa('data muito no futuro recusada', r.ok !== true, r);
r = post({ servico: 'corte', local: 'barbearia', inicio: 'banana', nome: 'Lixo', telefone: '61988776655' });
checa('data inválida recusada', r.ok !== true, r);

console.log('\n=== 4. horário desencaixado da grade ===');
montarAbas();
h = horarioBom();
const desencaixado = h.dia + 'T' + h.hora.slice(0, 3) + '07:00-03:00';
r = post({ servico: 'corte', local: 'barbearia', inicio: desencaixado, nome: 'Fora da grade', telefone: '61988776655' });
checa('minuto quebrado recusado', r.ok !== true, r);

console.log('\n=== 5. dados sujos ===');
montarAbas();
h = horarioBom();
r = post({ servico: 'corte', local: 'barbearia', inicio: h.iso, nome: 'x', telefone: '61988776655' });
checa('nome de 1 letra recusado', r.erro === 'nome', r);
r = post({ servico: 'corte', local: 'barbearia', inicio: h.iso, nome: 'Mateus', telefone: '123' });
checa('telefone curto recusado', r.erro === 'telefone', r);
r = post({ servico: 'corte', local: 'barbearia', inicio: h.iso, nome: 'Mateus', telefone: '6188776655' });
checa('fixo de 10 dígitos aceito', r.ok === true, r);
montarAbas(); h = horarioBom();
r = post({ servico: 'corte', local: 'barbearia', inicio: h.iso, nome: 'Mateus', telefone: '61088776655' });
checa('celular sem o 9 recusado', r.erro === 'telefone', r);
r = post({ servico: 'inexistente', local: 'barbearia', inicio: h.iso, nome: 'Mateus', telefone: '61988776655' });
checa('serviço inventado recusado', r.erro === 'servico invalido', r);
r = post({ servico: 'corte', local: 'domicilio', inicio: h.iso, nome: 'Mateus', telefone: '61988776655', endereco: 'a' });
checa('domicílio sem endereço recusado', r.erro === 'endereco', r);

console.log('\n=== 6. tamanho e caractere de controle ===');
montarAbas(); h = horarioBom();
r = post({ servico: 'corte', local: 'barbearia', inicio: h.iso, nome: 'M'.repeat(500), telefone: '61988776655', observacao: 'z'.repeat(5000) });
const linha = abas['Agendamentos'].linhas[1];
checa('nome cortado em 60', r.ok === true && linha[5].length === 60, linha && linha[5] && linha[5].length);
checa('corpo gigante recusado antes de virar objeto',
  doPost({ postData: { contents: 'x'.repeat(9000) } }).erro === 'grande demais');

console.log('\n=== 7. isca de robô ===');
montarAbas(); h = horarioBom();
r = post({ servico: 'corte', local: 'barbearia', inicio: h.iso, nome: 'Robo', telefone: '61988776655', confirmacao: 'http://spam' });
checa('preencheu a isca, foi recusado', r.erro === 'recusado', r);
checa('nada gravado', abas['Agendamentos'].linhas.length === 0);

console.log('\n=== 8. freio de marcação em massa ===');
montarAbas();
let aceitos = 0;
for (let i = 0; i < 8; i++) {
  const cfg = lerConfig();
  const livres = horariosLivres(cfg, horarioBom().dia, 'corte', 'barbearia');
  if (!livres[i]) break;
  const rr = post({ servico: 'corte', local: 'barbearia', inicio: horarioBom().dia + 'T' + livres[i] + ':00-03:00', nome: 'Insistente ' + i, telefone: '61988776655' });
  if (rr.ok) aceitos++;
}
checa('mesmo número travado depois de 3', aceitos === 3, { aceitos });

console.log('\n=== 9. cancelamento ===');
montarAbas(); h = horarioBom(3);
r = post({ servico: 'corte', local: 'barbearia', inicio: h.iso, nome: 'Mateus Silva', telefone: '61988776655' });
const cod = r.codigo;
checa('marcou pra cancelar depois', !!cod, r);
let c = post({ acao: 'cancelar', codigo: cod });
checa('sem telefone não cancela', c.erro === 'sem telefone', c);
c = post({ acao: 'cancelar', codigo: cod, telefone: '1111' });
checa('telefone errado não cancela', c.ok !== true, c);
checa('resposta não entrega que o código existe', c.erro === 'nao achou', c);
checa('evento continua de pé', eventos.length === 1);
c = post({ acao: 'cancelar', codigo: cod, telefone: '6655' });
checa('código e telefone certos cancelam', c.ok === true, c);
checa('evento apagado', eventos.length === 0);
c = post({ acao: 'cancelar', codigo: cod, telefone: '6655' });
checa('não cancela duas vezes', c.erro === 'ja cancelado', c);

console.log('\n=== 10. freio contra chute de código ===');
montarAbas(); h = horarioBom();
post({ servico: 'corte', local: 'barbearia', inicio: h.iso, nome: 'Alvo', telefone: '61988776655' });
let bloqueado = null;
for (let i = 0; i < 12; i++) {
  const rr = post({ acao: 'cancelar', codigo: 'AAA' + (i % 9 + 2), telefone: '9999' });
  if (rr.erro === 'demais' && bloqueado === null) bloqueado = i;
}
checa('trava depois de 8 chutes errados', bloqueado === 8, { bloqueado });
checa('o horário de verdade continua marcado', eventos.length === 1);

console.log('\n=== 11. código único ===');
montarAbas();
const ss = SpreadsheetApp.openById();
abas['Agendamentos'].linhas = [['Agendado em', 'Código', 'Status', 'Data do corte', 'Hora', 'Nome', 'WhatsApp', 'Serviço', 'Local', 'Compareceu', 'ID do evento']];
const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'.split('');
// ocupa quase tudo que começa com A pra forçar o desvio
for (const a of alfabeto) for (const b of alfabeto) abas['Agendamentos'].linhas.push(['', 'AA' + a + b, 'Confirmado', '', '', '', '', '', '', '', '']);
const gerados = new Set();
for (let i = 0; i < 200; i++) gerados.add(novoCodigo(ss));
let colidiu = 0;
gerados.forEach(g => { if (g.indexOf('AA') === 0) colidiu++; });
checa('nunca devolve código que já está na planilha', colidiu === 0, { colidiu });

console.log('\n=== 12. chave e ações desconhecidas ===');
montarAbas();
checa('POST sem chave recusado', doPost({ postData: { contents: '{"acao":"cancelar"}' } }).erro === 'chave invalida');
checa('GET sem chave recusado', doGet({ parameter: { acao: 'config' } }).erro === 'chave invalida');
checa('ação inventada recusada', get({ acao: 'apagarTudo' }).erro === 'acao desconhecida');
const cfgResp = get({ acao: 'config' });
checa('config não devolve dado de cliente',
  !JSON.stringify(cfgResp).match(/telefone|whatsapp|cliente/i), Object.keys(cfgResp));

console.log('\n=== 13. erro interno não vaza pro navegador ===');
montarAbas();
delete abas['Serviços'];
cacheMap.clear();
const vazou = get({ acao: 'dias', servico: 'corte', local: 'barbearia' });
checa('mensagem genérica, sem id de planilha',
  vazou.erro === 'falha' && !JSON.stringify(vazou).includes('1gYhv'), vazou);

console.log('\n=== 14. faxina de dados antigos ===');
montarAbas();
const velho = new Date(); velho.setMonth(velho.getMonth() - 30);
const novo = new Date();
abas['Clientes'].linhas = [
  ['WhatsApp', 'Nome', 'Aniversário', 'Como me achou', 'Primeira vez', 'Última visita', 'Visitas', 'Observações', 'Não enviar'],
  ['61988776655', 'Antigo Sumido', '10/05', 'Instagram', '2020-01-01', Utilities.formatDate(velho, '', 'yyyy-MM-dd'), 4, 'gosta curto', ''],
  ['61999887766', 'Cliente Atual', '11/06', 'Google', '2025-01-01', Utilities.formatDate(novo, '', 'yyyy-MM-dd'), 9, 'barba', '']
];
limparDadosAntigos();
checa('cliente sumido virou anônimo', abas['Clientes'].linhas[1][0] === 'anonimizado' && abas['Clientes'].linhas[1][1] === '(cliente antigo)', abas['Clientes'].linhas[1]);
checa('contagem de visitas sobrou', abas['Clientes'].linhas[1][6] === 4);
checa('cliente atual não foi tocado', abas['Clientes'].linhas[2][1] === 'Cliente Atual');

console.log('\n=== 15. quem pediu pra não receber sai das listas ===');
montarAbas();
const ontem = new Date(Date.now() - 30 * 86400000);
abas['Clientes'].linhas = [
  ['WhatsApp', 'Nome', 'Aniversário', 'Como me achou', 'Primeira vez', 'Última visita', 'Visitas', 'Observações', 'Não enviar'],
  ['61988776655', 'Quer Receber', '', '', '', Utilities.formatDate(ontem, '', 'yyyy-MM-dd'), 3, '', ''],
  ['61999887766', 'Pediu Pra Parar', '', '', '', Utilities.formatDate(ontem, '', 'yyyy-MM-dd'), 3, '', 'sim']
];
let corpoEmail = '';
global.MailApp = { sendEmail: (para, assunto, corpo) => { corpoEmail = corpo; } };
resumoSemanal();
checa('quem quer receber aparece no recall', corpoEmail.includes('Quer Receber'));
checa('quem pediu pra parar não aparece', !corpoEmail.includes('Pediu Pra Parar'));


console.log('=== 16. planilha antiga ganha a coluna Não enviar ===');
montarAbas();
abas['Clientes'].linhas = [
  ['WhatsApp','Nome','Aniversário','Como me achou','Primeira vez','Última visita','Visitas','Observações'],
  ['61988776655','Antigo','','','','2026-08-01',2,'']
];
const feito = [];
completarClientes(SpreadsheetApp.openById(), feito);
checa('coluna criada no fim do cabeçalho', abas['Clientes'].linhas[0][8] === 'Não enviar', abas['Clientes'].linhas[0]);
completarClientes(SpreadsheetApp.openById(), feito);
checa('rodar de novo não duplica', abas['Clientes'].linhas[0].filter(x => x === 'Não enviar').length === 1, abas['Clientes'].linhas[0]);

console.log('\n---------------------------------------------');
console.log('passaram: ' + ok + '   falharam: ' + falhou);
process.exit(falhou ? 1 : 0);
