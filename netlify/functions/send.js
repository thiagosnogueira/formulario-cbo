exports.handler = async function (event) {
  const API_URL = "https://script.google.com/macros/s/AKfycbzi8rH_ynhUwMwXig9SHRuxUMEDlFa9rsPeJfukfvcDCw2m7WaybAnW1-z0yS6LPPeD/exec";

  try {
    const payload = JSON.parse(event.body || "{}");

    const params = new URLSearchParams();

    params.append("nomeEvento", payload.nomeEvento || "");
    params.append("nomeResponsavel", payload.nomeResponsavel || "");
    params.append("contato", payload.contato || "");
    params.append("dataHoraInicio", payload.dataHoraInicio || "");
    params.append("dataHoraFim", payload.dataHoraFim || "");
    params.append("objetivo", payload.objetivo || "");

    (payload.espacos || []).forEach(item => params.append("espacos", item));
    (payload.ministerios || []).forEach(item => params.append("ministerios", item));

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
      },
      body: params.toString(),
      redirect: "follow"
    });

    const responseText = await response.text();
    const contentType = response.headers.get("content-type") || "";

    console.log("Apps Script HTTP:", response.status);
    console.log("Apps Script content-type:", contentType);
    console.log("Apps Script raw response:", responseText);

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
          error: result.message || "Apps Script não processou a solicitação.",
          raw: result
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
    console.error("Netlify function error:", error);

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
