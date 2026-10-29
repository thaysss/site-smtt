// Instalar como Apps Script vinculado à planilha. Segredos nas Propriedades do script.
const CABECALHO = ['ID SMTT', 'Responsável', 'Contato', 'Data e início (AAAA-MM-DDTHH:mm)', 'Local', 'Descrição'];
const CAMPOS = ['chave', 'nome_solicitante', 'telefone', 'data_evento', 'local_evento', 'descricao'];

function prepararIntegracao() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Eventos SMTT');
  if (!sheet) {
    sheet = ss.insertSheet('Eventos SMTT');
    sheet.getRange(1, 1, 1, 6).setValues([CABECALHO]);
    sheet.setFrozenRows(1);
    sheet.getRange('A:F').setNumberFormat('@');
    sheet.autoResizeColumns(1, 6);
  }
  if (!ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'sincronizarEventos')) {
    ScriptApp.newTrigger('sincronizarEventos').timeBased().everyMinutes(5).create();
  }
}

function sincronizarEventos() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const props = PropertiesService.getScriptProperties();
    const url = props.getProperty('SMTT_SYNC_URL');
    const token = props.getProperty('SMTT_SYNC_TOKEN');
    if (!url || !url.startsWith('https://') || !token || token.length < 32) throw new Error('Configure URL HTTPS e token.');
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Eventos SMTT');
    if (!sheet) throw new Error('Execute prepararIntegracao primeiro.');
    const n = sheet.getLastRow();
    const data = n > 1 ? sheet.getRange(2, 1, n - 1, 6).getDisplayValues() : [];
    const rows = [];
    const locations = {};
    data.forEach((r, index) => {
      if (r.every(v => !v)) return;
      if (!r[1] || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(r[3])) throw new Error('Confira responsável e data na linha ' + (index + 2));
      if (!r[0]) {
        r[0] = Utilities.getUuid();
        sheet.getRange(index + 2, 1).setValue(r[0]);
      }
      if (locations[r[0]]) throw new Error('ID duplicado na linha ' + (index + 2));
      locations[r[0]] = index + 2;
      rows.push(Object.fromEntries(CAMPOS.map((f, i) => [f, r[i]])));
    });
    SpreadsheetApp.flush();
    const reply = UrlFetchApp.fetch(url, {method: 'post', contentType: 'application/json',
      headers: {Authorization: 'Bearer ' + token}, payload: JSON.stringify({eventos: rows}),
      followRedirects: false, muteHttpExceptions: true});
    if (reply.getResponseCode() !== 200) throw new Error('Falha de sincronização HTTP ' + reply.getResponseCode());
    const body = JSON.parse(reply.getContentText());
    const conflicts = new Set(body.conflitos.map(c => c.chave));
    body.eventos.forEach(event => {
      if (conflicts.has(event.chave)) return;
      const values = CAMPOS.map(f => String(event[f] || ''));
      let line = locations[event.chave];
      if (line) {
        // A pessoa pode editar enquanto a requisição está em andamento.
        const before = data[line - 2];
        const now = sheet.getRange(line, 1, 1, 6).getDisplayValues()[0];
        if (JSON.stringify(now) !== JSON.stringify(before)) return;
      } else line = sheet.getLastRow() + 1;
      // RichText grava texto literal, inclusive conteúdo iniciado por '='.
      sheet.getRange(line, 1, 1, 6).setRichTextValues([values.map(v => SpreadsheetApp.newRichTextValue().setText(v).build())]);
    });
    if (conflicts.size) throw new Error('Conflito nos IDs: ' + [...conflicts].join(', ') + '. Confira os dados nos dois sistemas antes de corrigir.');
  } finally { lock.releaseLock(); }
}
