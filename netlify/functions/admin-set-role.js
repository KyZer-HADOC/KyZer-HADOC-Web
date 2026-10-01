const { getAdminClient } = require("./_supabase");
const { verifyAdmin } = require("./_adminAuth");

const VALID_ROLES = ["owner", "admin", "client"];

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { token, password, userId, role } = JSON.parse(event.body || "{}");
    const supabase = getAdminClient();
    const auth = await verifyAdmin(supabase, token, password);

    // Rank management is owner-only — a password alone (admin-level) can't assign ranks.
    if (!auth.ok || auth.role !== "owner") {
      return { statusCode: 401, body: JSON.stringify({ success: false, message: "Owner access required" }) };
    }

    if (!userId || !VALID_ROLES.includes(role)) {
      return { statusCode: 400, body: JSON.stringify({ success: false, message: "Invalid request" }) };
    }

    const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);

    if (error) {
      return { statusCode: 500, body: JSON.stringify({ success: false, message: "Database error: " + error.message }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ success: false, message: "Server error: " + err.message }) };
  }
};
