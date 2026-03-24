const CONFIG = {
  spreadsheetId: "1eQ-Q1nbEa4xSrw0QQ4fOuGlG66NcLS292XkHf57HMAQ",
  sheetName: "Solicitacoes",
  alwaysSendTo: "contato@cboceanica.com.br",
  ministries: {
    recepcao: { email: "fcotrim25@hotmail.com" },
    sonoplastia: { email: "judsongds@hotmail.com" },
    midia: { email: "EMAIL_MIDIA@exemplo.com" },
    comunicacao: { email: "EMAIL_COMUNICACAO@exemplo.com" },
    louvor: { email: "andreyrfreire@gmail.com" },
    juventude: { email: ["thiago.thinog@gmail.com", "nogueiraadeline@gmail.com"] },
    mulheres: { email: "EMAIL_MULHERES@exemplo.com" },
    acao_social: { email: "EMAIL_ACAO_SOCIAL@exemplo.com" },
    esportes: { email: "vladimir.lapa@hotmail.com" },
    ensino: { email: "vilarmilton@gmail.com" },
    mensageiras_do_rei: { email: "nogueiraadeline@gmail.com" },
    infantil: { email: "EMAIL_INFANTIL@exemplo.com" },
    missoes: { email: "EMAIL_MISSOES@exemplo.com" },
    eventos: { email: "vinha.p@hotmail.com" },
    casais: { email: ["arquimedes.melo@gmail.com", "marcinhasenamelo@gmail.com"] },
    cr: { email: ["arquimedes.melo@gmail.com", "marcinhasenamelo@gmail.com"] }
  }
};

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      message: "Web App ativo."
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = parseRequestData_(e);

    validarDados_(data);

    const sheet = getOrCreateSheet_();

    sheet.appendRow([
      new Date(),
      data.nomeEvento || "",
      data.nomeResponsavel || "",
      data.contato || "",
      data.dataHoraInicio || "",
      data.dataHoraFim || "",
      (data.espacos || []).join(", "),
      data.objetivo || "",
      (data.ministerios || []).join(", ")
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
      // se não for JSON, continua para ler como form POST
    }
  }

  const p = e.parameter || {};
  const ps = e.parameters || {};

  return {
    nomeEvento: p.nomeEvento || "",
    nomeResponsavel: p.nomeResponsavel || "",
    contato: p.contato || "",
    dataHoraInicio: p.dataHoraInicio || "",
    dataHoraFim: p.dataHoraFim || "",
    objetivo: p.objetivo || "",
    espacos: normalizeArray_(ps.espacos || p.espacos),
    ministerios: normalizeArray_(ps.ministerios || p.ministerios)
  };
}

function normalizeArray_(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function validarDados_(data) {
  if (!data.nomeEvento) throw new Error("Nome do evento é obrigatório.");
  if (!data.nomeResponsavel) throw new Error("Nome do responsável é obrigatório.");
  if (!data.contato) throw new Error("Contato é obrigatório.");
  if (!data.dataHoraInicio) throw new Error("Data e hora de início é obrigatória.");
  if (!data.dataHoraFim) throw new Error("Data e hora de fim é obrigatória.");
  if (!data.objetivo) throw new Error("Objetivo é obrigatório.");
  if (!Array.isArray(data.espacos) || data.espacos.length === 0) {
    throw new Error("Selecione ao menos um espaço.");
  }
  if (!Array.isArray(data.ministerios) || data.ministerios.length === 0) {
    throw new Error("Selecione ao menos um ministério.");
  }

  const inicio = new Date(data.dataHoraInicio);
  const fim = new Date(data.dataHoraFim);

  if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
    throw new Error("Datas inválidas.");
  }

  if (fim <= inicio) {
    throw new Error("A data/hora de fim deve ser maior que a de início.");
  }
}

function getOrCreateSheet_() {
  const ss = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  let sheet = ss.getSheetByName(CONFIG.sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.sheetName);
    sheet.appendRow([
      "Timestamp",
      "Nome do Evento",
      "Nome do Responsável",
      "Contato",
      "Data/Hora Início",
      "Data/Hora Fim",
      "Espaços",
      "Objetivo",
      "Ministérios"
    ]);
  }

  return sheet;
}

function enviarEmailsMinisterios_(data) {
  const emailsMinisterios = (data.ministerios || [])
    .map(id => CONFIG.ministries[id] && CONFIG.ministries[id].email)
    .filter(Boolean);

  const emails = [...new Set([
    ...(CONFIG.alwaysSendTo ? [CONFIG.alwaysSendTo] : []),
    ...emailsMinisterios
  ])];

  if (!emails.length) return;

  const labels = {
    recepcao: "Recepção",
    sonoplastia: "Sonoplastia",
    midia: "Mídia",
    comunicacao: "Comunicação",
    louvor: "Louvor",
    juventude: "Juventude",
    mulheres: "Mulheres",
    acao_social: "Ação Social",
    esportes: "Esportes",
    ensino: "Ensino",
    mensageiras_do_rei: "Mensageiras do Rei",
    infantil: "Infantil",
    missoes: "Missões",
    eventos: "Eventos",
    casais: "Casais",
    cr: "CR"
  };

  const ministeriosFormatados = (data.ministerios || [])
    .map(id => labels[id] || id)
    .join(", ");

  const assunto = `CBO - Nova solicitação de evento: ${data.nomeEvento}`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Nova solicitação de evento</h2>
      <p><strong>Nome do evento:</strong> ${escapeHtml_(data.nomeEvento)}</p>
      <p><strong>Responsável:</strong> ${escapeHtml_(data.nomeResponsavel)}</p>
      <p><strong>Contato:</strong> ${escapeHtml_(data.contato)}</p>
      <p><strong>Início:</strong> ${escapeHtml_(data.dataHoraInicio)}</p>
      <p><strong>Fim:</strong> ${escapeHtml_(data.dataHoraFim)}</p>
      <p><strong>Espaços:</strong> ${escapeHtml_((data.espacos || []).join(", "))}</p>
      <p><strong>Objetivo:</strong> ${escapeHtml_(data.objetivo)}</p>
      <p><strong>Ministérios acionados:</strong> ${escapeHtml_(ministeriosFormatados)}</p>
    </div>
  `;

  MailApp.sendEmail({
    to: emails.join(","),
    subject: assunto,
    htmlBody: htmlBody
  });
}

function escapeHtml_(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
