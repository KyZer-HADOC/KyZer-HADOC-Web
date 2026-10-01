exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { password, trailer } = JSON.parse(event.body || "{}");
    const n = trailer === 2 ? 2 : 1;

    const expectedPassword = n === 2 ? process.env.TRAILER02_PASSWORD : process.env.TRAILER01_PASSWORD;
    const url = n === 2 ? process.env.TRAILER02_URL : process.env.TRAILER01_URL;

    if (!expectedPassword || !url) {
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, message: "Trailer " + n + " isn't configured yet (missing env vars)" }),
      };
    }

    if (password !== expectedPassword) {
      return { statusCode: 200, body: JSON.stringify({ success: false }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, url }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ success: false, message: "Server error: " + err.message }) };
  }
};
