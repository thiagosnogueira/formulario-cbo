const CONFIG = {
  spreadsheetId: "1QXcJTR9daMCyhz416zLePsiLSzHW3FcQfpADxpqzVTw",
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
      whatsapp: ["55219XXXXXXXX"]
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
      whatsapp: ["55219XXXXXXXX"]
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
      email: ["EMAIL_MISSOES@exemplo.com"],
      whatsapp: ["55219XXXXXXXX"]
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

function doGet() {
  return jsonResponse_({
    success: true,
    message: "Web App ativo."
  });
}

function doPost(e) {
  try {
    const data = parseRequestData_(e);

    validarDados_(data);

    salvarSolicitacao_(data);
    enviarEmailsMinisterios_(data);
    enviarWhatsAppMinisterios_(data);

    return jsonResponse_({
      success: true,
      message: "Solicitação enviada com sucesso."
    });
  } catch (error) {
    registrarErro_("PROCESSAMENTO", error);
    return jsonResponse_({
      success: false,
      message: error.message || "Erro ao processar solicitação."
    });
  }
}

function parseRequestData_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("Corpo da requisição não recebido.");
  }

  let payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    throw new Error("JSON inválido no corpo da requisição.");
  }

  return {
    nomeEvento: (payload.nomeEvento || "").trim(),
    nomeResponsavel: (payload.nomeResponsavel || "").trim(),
    contato: (payload.contato || "").trim(),
    dataHoraInicio: payload.dataHoraInicio || "",
    dataHoraFim: payload.dataHoraFim || "",
    objetivo: (payload.objetivo || "").trim(),
    espacos: normalizeArray_(payload.espacos),
    ministerios: normalizeArray_(payload.ministerios)
  };
}

function normalizeArray_(value) {
  if (!value) return [];
  return Array.isArray(value)
    ? value.map(String).map(v => v.trim()).filter(Boolean)
    : [String(value).trim()].filter(Boolean);
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

function salvarSolicitacao_(data) {
  const sheet = getOrCreateSheet_();

  sheet.appendRow([
    new Date(),
    data.nomeEvento,
    data.nomeResponsavel,
    data.contato,
    data.dataHoraInicio,
    data.dataHoraFim,
    data.espacos.join(", "),
    data.objetivo,
    data.ministerios.join(", ")
  ]);
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
    .map(String)
    .map(v => v.trim())
    .filter(Boolean)
    .filter(email => !/@exemplo\.com$/i.test(email));

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
      <p><strong>Início:</strong> ${escapeHtml_(formatDateTime_(data.dataHoraInicio))}</p>
      <p><strong>Fim:</strong> ${escapeHtml_(formatDateTime_(data.dataHoraFim))}</p>
      <p><strong>Espaços:</strong> ${escapeHtml_(data.espacos.join(", "))}</p>
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
  const props = PropertiesService.getScriptProperties();

  const provider = (props.getProperty("WHATSAPP_PROVIDER") || "meta").toLowerCase();

  if (provider === "meta") {
    enviarWhatsAppMeta_(data);
    return;
  }

  throw new Error("Provider de WhatsApp não suportado.");
}

function enviarWhatsAppMeta_(data) {
  const props = PropertiesService.getScriptProperties();
  const accessToken = props.getProperty("META_ACCESS_TOKEN");
  const phoneNumberId = props.getProperty("META_PHONE_NUMBER_ID");
  const apiVersion = props.getProperty("META_API_VERSION") || "v25.0";
  const templateName = props.getProperty("META_TEMPLATE_NAME");
  const templateLang = props.getProperty("META_TEMPLATE_LANG") || "pt_BR";

  if (!accessToken || !phoneNumberId || !templateName) {
    registrarLogSimples_("WHATSAPP_META_CONFIG", "Faltam META_ACCESS_TOKEN, META_PHONE_NUMBER_ID ou META_TEMPLATE_NAME");
    return;
  }

  const labels = getLabels_();

  const numerosMinisterios = (data.ministerios || [])
    .flatMap(id => {
      const ministerio = CONFIG.ministries[id];
      if (!ministerio || !ministerio.whatsapp) return [];
      return Array.isArray(ministerio.whatsapp) ? ministerio.whatsapp : [ministerio.whatsapp];
    })
    .map(String)
    .map(v => onlyDigits_(v))
    .filter(Boolean)
    .filter(numero => !/X/.test(numero));

  const numeros = [...new Set([
    ...(Array.isArray(CONFIG.alwaysSendWhatsAppTo) ? CONFIG.alwaysSendWhatsAppTo.map(onlyDigits_) : []),
    ...numerosMinisterios
  ])].filter(Boolean);

  if (!numeros.length) return;

  const ministeriosFormatados = (data.ministerios || [])
    .map(id => labels[id] || id)
    .join(", ");

  const endpoint = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  const requests = numeros.map(numero => ({
    url: endpoint,
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + accessToken
    },
    payload: JSON.stringify({
      messaging_product: "whatsapp",
      to: numero,
      type: "template",
      template: {
        name: templateName,
        language: { code: templateLang },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: safeTemplateText_(data.nomeEvento) },
              { type: "text", text: safeTemplateText_(data.nomeResponsavel) },
              { type: "text", text: safeTemplateText_(data.contato) },
              { type: "text", text: safeTemplateText_(formatDateTime_(data.dataHoraInicio)) },
              { type: "text", text: safeTemplateText_(formatDateTime_(data.dataHoraFim)) },
              { type: "text", text: safeTemplateText_(data.espacos.join(", ")) },
              { type: "text", text: safeTemplateText_(data.objetivo) },
              { type: "text", text: safeTemplateText_(ministeriosFormatados) }
            ]
          }
        ]
      }
    }),
    muteHttpExceptions: true
  }));

  const responses = UrlFetchApp.fetchAll(requests);

  const falhas = [];
  responses.forEach((res, index) => {
    const code = res.getResponseCode();
    if (code < 200 || code >= 300) {
      falhas.push({
        numero: numeros[index],
        code: code,
        body: res.getContentText()
      });
    }
  });

  if (falhas.length) {
    registrarLogSimples_(
      "WHATSAPP_META_FALHAS",
      JSON.stringify(falhas).slice(0, 45000)
    );
  }
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

function registrarErro_(tipo, error) {
  const mensagem = [
    error && error.message ? error.message : "Erro sem mensagem",
    error && error.stack ? error.stack : ""
  ].join("\n\n");

  registrarLogSimples_(tipo, mensagem);
}

function registrarLogSimples_(tipo, mensagem) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.spreadsheetId);
    let sheet = ss.getSheetByName("Debug");

    if (!sheet) {
      sheet = ss.insertSheet("Debug");
      sheet.appendRow(["Timestamp", "Tipo", "Mensagem"]);
    }

    sheet.appendRow([new Date(), tipo, String(mensagem || "")]);
  } catch (e) {
    Logger.log("Falha ao registrar log: " + e.message);
  }
}

function formatDateTime_(value) {
  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value || "");

  return Utilities.formatDate(
    date,
    Session.getScriptTimeZone() || "America/Sao_Paulo",
    "dd/MM/yyyy 'às' HH:mm"
  );
}

function onlyDigits_(value) {
  return String(value || "").replace(/\D/g, "");
}

function safeTemplateText_(value) {
  const text = String(value || "").trim();
  return text ? text.substring(0, 1024) : "-";
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
