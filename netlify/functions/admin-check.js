const { getAdminClient } = require("./_supabase");
const { verifyAdmin } = require("./_adminAuth");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { token, password } = JSON.parse(event.body || "{}");
    const supabase = getAdminClient();
    const result = await verifyAdmin(supabase, token, password);

    if (!result.ok) {
      return { statusCode: 200, body: JSON.stringify({ authorized: false }) };
    }

    return { statusCode: 200, body: JSON.stringify({ authorized: true, role: result.role }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ authorized: false, message: err.message }) };
  }
};
