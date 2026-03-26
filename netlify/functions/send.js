exports.handler = async function (event) {
  const API_URL = "https://script.google.com/macros/s/AKfycbzi8rH_ynhUwMwXig9SHRuxUMEDlFa9rsPeJfukfvcDCw2m7WaybAnW1-z0yS6LPPeD/exec";

  try {
    const payload = JSON.parse(event.body || "{}");

    const params = new URLSearchParams();
    params.append("submit", "1");
    params.append("nomeEvento", payload.nomeEvento || "");
    params.append("nomeResponsavel", payload.nomeResponsavel || "");
    params.append("contato", payload.contato || "");
    params.append("dataHoraInicio", payload.dataHoraInicio || "");
    params.append("dataHoraFim", payload.dataHoraFim || "");
    params.append("objetivo", payload.objetivo || "");
    params.append("espacos", (payload.espacos || []).join(","));
    params.append("ministerios", (payload.ministerios || []).join(","));

    const finalUrl = `${API_URL}?${params.toString()}`;

    const response = await fetch(finalUrl, {
      method: "GET",
      redirect: "follow"
    });

    const responseText = await response.text();

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      return {
        statusCode: 502,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          success: false,
          error: "Resposta inválida do App Script",
          raw: responseText.slice(0, 1200)
        })
      };
    }

    if (!response.ok || result.success !== true) {
      return {
        statusCode: 502,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          success: false,
          error: result.message || "Apps Script não processou a solicitação."
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        success: true,
        message: result.message || "Solicitação enviada com sucesso."
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        success: false,
        error: error.message || "Erro interno ao enviar solicitação."
      })
    };
  }
};
