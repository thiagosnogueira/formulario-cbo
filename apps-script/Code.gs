const CONFIG = {
  spreadsheetId: "1eQ-Q1nbEa4xSrw0QQ4fOuGlG66NcLS292XkHf57HMAQ",
  sheetName: "Solicitacoes",
  alwaysSendTo: [
    "contato@cboceanica.com.br",
    "tarsis_alecrim@hotmail.com"
  ],
  alwaysSendWhatsAppTo: [
    "5521981072211",
    "5521996901364"
  ],
  ministries: {
    recepcao: {
      email: ["fcotrim25@hotmail.com"],
      whatsapp: ["5521982411285"]
    },
    sonoplastia: {
      email: ["judsongds@hotmail.com"],
      whatsapp: ["5521986676434"]
    },
    midia: {
      email: ["EMAIL_MIDIA@exemplo.com"],
      whatsapp: ["5521999126969"]
    },
    comunicacao: {
      email: ["EMAIL_COMUNICACAO@exemplo.com"],
      whatsapp: ["21968416623"]
    },
    louvor: {
      email: ["andreyrfreire@gmail.com"],
      whatsapp: ["5521995215122"]
    },
    juventude: {
      email: ["thiago.thinog@gmail.com", "nogueiraadeline@gmail.com"],
      whatsapp: ["5521983879944", "5521983429233"]
    },
    mulheres: {
      email: ["EMAIL_MULHERES@exemplo.com"],
      whatsapp: ["5521964612429"]
    },
    acao_social: {
      email: ["danielebastosadv@yahoo.com"],
      whatsapp: ["5521975458869"]
    },
    esportes: {
      email: ["vladimir.lapa@hotmail.com"],
      whatsapp: ["5521980120413"]
    },
    ensino: {
      email: ["vilarmilton@gmail.com"],
      whatsapp: ["5521967758584"]
    },
    mensageiras_do_rei: {
      email: ["nogueiraadeline@gmail.com"],
      whatsapp: ["5521983429233"]
    },
    infantil: {
      email: ["alenunesp@gmail.com"],
      whatsapp: ["5521993162056"]
    },
    missoes: {
      email: ["barbaracdgomes@gmail.com"],
      whatsapp: ["5521995727164"]
    },
    eventos: {
      email: ["vinha.p@hotmail.com"],
      whatsapp: ["55219XXXXXXXX"]
    },
    casais: {
      email: ["arquimedes.melo@gmail.com", "marcinhasenamelo@gmail.com"],
      whatsapp: ["5521988977160", "5521988924160"]
    },
    cr: {
      email: ["arquimedes.melo@gmail.com", "marcinhasenamelo@gmail.com"],
      whatsapp: ["5521988977160", "5521988924160"]
    }
  }
};

function doGet(e) {
  try {
    const p = (e && e.parameter) || {};

    if (p.submit === "1") {
      const data = {
        nomeEvento: p.nomeEvento || "",
        nomeResponsavel: p.nomeResponsavel || "",
        contato: p.contato || "",
        dataHoraInicio: p.dataHoraInicio || "",
        dataHoraFim: p.dataHoraFim || "",
        objetivo: p.objetivo || "",
        espacos: normalizeCsvArray_(p.espacos),
        ministerios: normalizeCsvArray_(p.ministerios)
      };

      return processarSolicitacao_(data);
    }

    return jsonResponse_({
      success: true,
      message: "Web App ativo."
    });
  } catch (error) {
    return jsonResponse_({
      success: false,
      message: error.message || "Erro no doGet."
    });
  }
}

function doPost(e) {
  try {
    const data = parseRequestData_(e);
    return processarSolicitacao_(data);
  } catch (error) {
    return jsonResponse_({
      success: false,
      message: error.message || "Erro ao processar solicitação."
    });
  }
}

function processarSolicitacao_(data) {
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
  enviarWhatsAppMinisterios_(data);

  return jsonResponse_({
    success: true,
    message: "Solicitação enviada com sucesso."
  });
}

function parseRequestData_(e) {
  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (err) {
      // continua
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

function normalizeCsvArray_(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
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
    .flatMap(id => {
      const ministerio = CONFIG.ministries[id];
      if (!ministerio || !ministerio.email) return [];
      return Array.isArray(ministerio.email) ? ministerio.email : [ministerio.email];
    })
    .filter(Boolean);

  const emails = [...new Set([
    ...(Array.isArray(CONFIG.alwaysSendTo) ? CONFIG.alwaysSendTo : []),
    ...emailsMinisterios
  ])];

  if (!emails.length) return;

  const labels = getLabels_();

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

function enviarWhatsAppMinisterios_(data) {
  const accountSid = PropertiesService.getScriptProperties().getProperty("TWILIO_SID");
  const authToken = PropertiesService.getScriptProperties().getProperty("TWILIO_TOKEN");

  const labels = getLabels_();

  const numerosMinisterios = (data.ministerios || [])
    .flatMap(id => {
      const ministerio = CONFIG.ministries[id];
      if (!ministerio || !ministerio.whatsapp) return [];
      return Array.isArray(ministerio.whatsapp) ? ministerio.whatsapp : [ministerio.whatsapp];
    })
    .filter(Boolean);

  const numeros = [...new Set([
    ...(Array.isArray(CONFIG.alwaysSendWhatsAppTo) ? CONFIG.alwaysSendWhatsAppTo : []),
    ...numerosMinisterios
  ])];

  if (!numeros.length) return;

  const ministeriosFormatados = (data.ministerios || [])
    .map(id => labels[id] || id)
    .join(", ");

  numeros.forEach(numero => {
    const mensagem =
`📢 *Nova solicitação de evento*

📌 *Evento:* ${data.nomeEvento}
👤 *Responsável:* ${data.nomeResponsavel}
📞 *Contato:* ${data.contato}

🕐 *Início:* ${data.dataHoraInicio}
🕐 *Fim:* ${data.dataHoraFim}

📍 *Espaços:* ${(data.espacos || []).join(", ")}

🎯 *Objetivo:*
${data.objetivo}

👥 *Ministérios acionados:*
${ministeriosFormatados}`;

    const url = "https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json";

    const payload = {
      To: "whatsapp:" + numero,
      From: "whatsapp:+14155238886",
      Body: mensagem
    };

    const options = {
      method: "post",
      payload: payload,
      headers: {
        Authorization: "Basic " + Utilities.base64Encode(accountSid + ":" + authToken)
      },
      muteHttpExceptions: true
    };

    UrlFetchApp.fetch(url, options);
  });
}

function getLabels_() {
  return {
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
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function escapeHtml_(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
