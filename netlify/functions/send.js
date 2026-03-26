exports.handler = async function (event) {
  const API_URL = "https://script.google.com/macros/s/AKfycbzi8rH_ynhUwMwXig9SHRuxUMEDlFa9rsPeJfukfvcDCw2m7WaybAnW1-z0yS6LPPeD/exec";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: event.body
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
