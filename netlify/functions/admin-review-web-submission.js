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
      return { statusCode: 400, body: JSON.stringify({ success: false, message: "Invalid review request" }) };
    }
    const update = {
      status: action === "approve" ? "approved" : "rejected",
      reason: action === "approve" ? null : (String(reason || "").trim().slice(0, 300) || null),
      reviewed_at: new Date().toISOString(),
      reviewed_by: auth.userId || null
    };
    const { data, error } = await supabase
      .from("web_submissions")
      .update(update)
      .eq("id", id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (error) {
      return { statusCode: 500, body: JSON.stringify({ success: false, message: "Database error: " + error.message }) };
    }
    if (!data) {
      return { statusCode: 404, body: JSON.stringify({ success: false, message: "This submission is no longer pending. Refresh the list." }) };
    }
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ success: false, message: "Server error: " + err.message }) };
  }
};
