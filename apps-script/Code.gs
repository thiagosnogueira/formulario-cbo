/**
 * Backend para formulário hospedado no GitHub Pages.
 *
 * Fluxo:
 * 1. O site envia um POST JSON para este Web App.
 * 2. O script registra a solicitação em uma aba do Google Sheets.
 * 3. O script envia e-mails apenas para os líderes dos ministérios marcados.
 * 4. Opcionalmente, também envia WhatsApp via WhatsApp Cloud API.
 */

const CONFIG = {
  spreadsheetId: 'COLE_AQUI_O_ID_DA_PLANILHA',
  sheetName: 'Solicitacoes',
  timezone: 'America/Sao_Paulo',
  whatsapp: {
    enabled: false,
    phoneNumberId: 'COLE_AQUI_O_PHONE_NUMBER_ID',
    accessToken: 'COLE_AQUI_O_ACCESS_TOKEN',
    apiVersion: 'v23.0'
  },
  ministries: {
    sonoplastia: {
      label: 'Sonoplastia',
      emails: ['lider.sonoplastia@exemplo.com'],
      whatsapp: []
    },
    midia: {
      label: 'Mídia',
      emails: ['lider.midia@exemplo.com'],
      whatsapp: []
    },
    comunicacao: {
      label: 'Comunicação',
      emails: ['lider.comunicacao@exemplo.com'],
      whatsapp: []
    },
    recepcao: {
      label: 'Recepção',
      emails: ['lider.recepcao@exemplo.com'],
      whatsapp: []
    },
    infantil: {
      label: 'Infantil',
      emails: ['lider.infantil@exemplo.com'],
      whatsapp: []
    },
    louvor: {
      label: 'Louvor',
      emails: ['thiago.thinog@gmail.com'],
      whatsapp: []
    }
  },
  spaces: {
    templo_maior: 'Templo Maior',
    templo_menor: 'Templo Menor',
    sala_lideres: 'Sala dos líderes',
    salao_vermelho: 'Salão vermelho',
    sala_azul: 'Sala Azul',
    sala_juventude: 'Sala da juventude',
    cozinha: 'Cozinha',
    gramado: 'Gramado',
    area_lazer: 'Área de Lazer',
    piscina: 'Piscina'
  }
};

function doPost(e) {
  try {
    const data = parseRequestData_(e);

    validarDados(data);

    const sheet = getOrCreateSheet_();

    const espacos = Array.isArray(data.espacos) ? data.espacos.join(", ") : "";
    const ministerios = Array.isArray(data.ministerios) ? data.ministerios.join(", ") : "";

    sheet.appendRow([
      new Date(),
      data.nomeEvento || "",
      data.nomeResponsavel || "",
      data.contato || "",
      data.dataHoraInicio || "",
      data.dataHoraFim || "",
      espacos,
      data.objetivo || "",
      ministerios
    ]);

    enviarEmailsMinisterios_(data);

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: "Solicitação enviada com sucesso."
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: error.message || "Erro ao processar solicitação."
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function parseRequestData_(e) {
  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (err) {
      // continua para tentar ler como form normal
    }
  }

  const p = e.parameter || {};

  return {
    nomeEvento: p.nomeEvento || "",
    nomeResponsavel: p.nomeResponsavel || "",
    contato: p.contato || "",
    dataHoraInicio: p.dataHoraInicio || "",
    dataHoraFim: p.dataHoraFim || "",
    objetivo: p.objetivo || "",
    espacos: normalizeArray_(p.espacos),
    ministerios: normalizeArray_(p.ministerios)
  };
}

function normalizeArray_(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function validatePayload(payload) {
  const requiredFields = ['nomeEvento', 'responsavel', 'contato', 'dataInicio', 'dataFim', 'espacos', 'objetivo', 'ministerios'];

  requiredFields.forEach((field) => {
    if (!payload[field] || (Array.isArray(payload[field]) && payload[field].length === 0)) {
      throw new Error('Campo obrigatório ausente: ' + field);
    }
  });

  const startDate = new Date(payload.dataInicio);
  const endDate = new Date(payload.dataFim);

  if (!(endDate > startDate)) {
    throw new Error('A data/hora final precisa ser maior que a data/hora inicial.');
  }
}

function appendToSheet(payload, selectedMinistries) {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const sheet = spreadsheet.getSheetByName(CONFIG.sheetName) || spreadsheet.insertSheet(CONFIG.sheetName);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Criado em',
      'Nome do evento',
      'Responsável',
      'Contato',
      'Data/hora início',
      'Data/hora fim',
      'Espaços solicitados',
      'Objetivo do evento',
      'Ministérios acionados'
    ]);
  }

  sheet.appendRow([
    Utilities.formatDate(new Date(), CONFIG.timezone, 'dd/MM/yyyy HH:mm:ss'),
    payload.nomeEvento,
    payload.responsavel,
    payload.contato,
    formatDateTime(payload.dataInicio),
    formatDateTime(payload.dataFim),
    mapSpaces(payload.espacos).join(', '),
    payload.objetivo,
    selectedMinistries.map((m) => m.label).join(', ')
  ]);
}

function notifyLeadersByEmail(payload, selectedMinistries) {
  selectedMinistries.forEach((ministry) => {
    if (!ministry.emails || ministry.emails.length === 0) return;

    const subject = '[Solicitação de Evento] ' + ministry.label + ' - ' + payload.nomeEvento;
    const body = buildLeaderMessage(payload, ministry.label);

    MailApp.sendEmail({
      to: ministry.emails.join(','),
      subject,
      body
    });
  });
}

function notifyLeadersByWhatsApp(payload, selectedMinistries) {
  selectedMinistries.forEach((ministry) => {
    (ministry.whatsapp || []).forEach((phone) => {
      sendWhatsAppText(phone, buildLeaderWhatsAppMessage(payload, ministry.label));
    });
  });
}

function sendWhatsAppText(to, text) {
  const url = 'https://graph.facebook.com/' + CONFIG.whatsapp.apiVersion + '/' + CONFIG.whatsapp.phoneNumberId + '/messages';

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: {
      preview_url: false,
      body: text
    }
  };

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + CONFIG.whatsapp.accessToken
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const status = response.getResponseCode();
  if (status < 200 || status >= 300) {
    throw new Error('Falha ao enviar WhatsApp. Status: ' + status + ' / Resposta: ' + response.getContentText());
  }
}

function buildLeaderMessage(payload, ministryLabel) {
  return [
    'Nova solicitação de evento para o ministério de ' + ministryLabel + '.',
    '',
    'Nome do evento: ' + payload.nomeEvento,
    'Responsável: ' + payload.responsavel,
    'Contato: ' + payload.contato,
    'Data e hora do início: ' + formatDateTime(payload.dataInicio),
    'Data e hora do fim: ' + formatDateTime(payload.dataFim),
    'Espaços solicitados: ' + mapSpaces(payload.espacos).join(', '),
    'Ministérios marcados: ' + payload.ministerios.map((key) => CONFIG.ministries[key]?.label || key).join(', '),
    '',
    'Objetivo do evento:',
    payload.objetivo
  ].join('\n');
}

function buildLeaderWhatsAppMessage(payload, ministryLabel) {
  return [
    'Nova solicitação de evento para *' + ministryLabel + '*.',
    'Evento: ' + payload.nomeEvento,
    'Responsável: ' + payload.responsavel,
    'Contato: ' + payload.contato,
    'Início: ' + formatDateTime(payload.dataInicio),
    'Fim: ' + formatDateTime(payload.dataFim),
    'Espaços: ' + mapSpaces(payload.espacos).join(', '),
    'Objetivo: ' + payload.objetivo
  ].join('\n');
}

function mapSpaces(spaceKeys) {
  return (spaceKeys || []).map((key) => CONFIG.spaces[key] || key);
}

function formatDateTime(value) {
  if (!value) return '';
  return Utilities.formatDate(new Date(value), CONFIG.timezone, 'dd/MM/yyyy HH:mm');
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
