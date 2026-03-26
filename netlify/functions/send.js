exports.handler = async function (event) {
  const API_URL = "https://script.google.com/macros/s/AKfycbzi8rH_ynhUwMwXig9SHRuxUMEDlFa9rsPeJfukfvcDCw2m7WaybAnW1-z0yS6LPPeD/exec";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: event.body
    });

    const responseText = await response.text();

    let result = {};
    try {
      result = JSON.parse(responseText);
    } catch (_) {
      result = { success: true };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        success: result.success !== false,
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
