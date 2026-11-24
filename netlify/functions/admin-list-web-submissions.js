const { getAdminClient } = require("./_supabase");
const { verifyAdmin } = require("./_adminAuth");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  try {
    const { token, password, status } = JSON.parse(event.body || "{}");
    const allowed = ["pending", "approved", "rejected"];
    const selectedStatus = allowed.includes(status) ? status : "pending";
    const supabase = getAdminClient();
    const auth = await verifyAdmin(supabase, token, password);
    if (!auth.ok) {
      return { statusCode: 401, body: JSON.stringify({ success: false, message: "Not authorized" }) };
    }
    const { data, error } = await supabase
      .from("web_submissions")
      .select("id,name,url,category,description,tags,status,uploader_email,uploader_name,submitted_at,reviewed_at,reason")
      .eq("status", selectedStatus)
      .order("submitted_at", { ascending: false })
      .limit(200);
    if (error) {
      return { statusCode: 500, body: JSON.stringify({ success: false, message: "Database error: " + error.message }) };
    }
    const items = (data || []).map(function (row) {
      return {
        id: row.id, name: row.name, url: row.url, category: row.category,
        description: row.description, tags: row.tags || [], status: row.status,
        uploaderEmail: row.uploader_email, uploaderName: row.uploader_name,
        submittedAt: row.submitted_at, reviewedAt: row.reviewed_at, reason: row.reason
      };
    });
    return { statusCode: 200, body: JSON.stringify({ success: true, items: items }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ success: false, message: "Server error: " + err.message }) };
  }
};
