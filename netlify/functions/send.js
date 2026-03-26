exports.handler = async function (event) {
  const API_URL = "https://script.google.com/macros/s/AKfycbzi8rH_ynhUwMwXig9SHRuxUMEDlFa9rsPeJfukfvcDCw2m7WaybAnW1-z0yS6LPPeD/exec";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: event.body,
      redirect: "follow"
    });

    const responseText = await response.text();
    const contentType = response.headers.get("content-type") || "";
    const finalUrl = response.url || "";

    console.log("Apps Script HTTP:", response.status);
    console.log("Apps Script final URL:", finalUrl);
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
          status: response.status,
          contentType,
          finalUrl,
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
          status: response.status,
          contentType,
          finalUrl,
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
