exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { password } = JSON.parse(event.body || "{}");

    // Password saved as an Environment Variable in Netlify dashboard
    // (Site settings -> Environment variables), NOT in the code.
    const correctPassword = process.env.DOC_PASSWORD;
    const fileUrl = process.env.DOC_FILE_URL;

    if (!correctPassword || !fileUrl) {
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, message: "Server not configured" }),
      };
    }

    if (password === correctPassword) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, url: fileUrl }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: false, message: "Wrong password" }),
    };
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: "Bad request" }),
    };
  }
};
