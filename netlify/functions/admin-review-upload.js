const { getAdminClient } = require("./_supabase");
const { verifyAdmin } = require("./_adminAuth");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { token, password, id, action, reason } = JSON.parse(event.body || "{}");
    const supabase = getAdminClient();
    const auth = await verifyAdmin(supabase, token, password);

    if (!auth.ok) {
      return { statusCode: 401, body: JSON.stringify({ success: false, message: "Not authorized" }) };
    }

    if (!id || !["approve", "reject"].includes(action)) {
      return { statusCode: 400, body: JSON.stringify({ success: false, message: "Invalid request" }) };
    }

    const update =
      action === "approve"
        ? { status: "approved", approved_at: new Date().toISOString(), reason: null }
        : { status: "rejected", reason: reason || null };

    const { error } = await supabase.from("uploads").update(update).eq("id", id);

    if (error) {
      return { statusCode: 500, body: JSON.stringify({ success: false, message: "Database error: " + error.message }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ success: false, message: "Server error: " + err.message }) };
  }
};
