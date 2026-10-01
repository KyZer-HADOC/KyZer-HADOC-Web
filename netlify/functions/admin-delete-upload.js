const { getAdminClient } = require("./_supabase");
const { verifyAdmin } = require("./_adminAuth");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { token, password, id } = JSON.parse(event.body || "{}");
    const supabase = getAdminClient();
    const auth = await verifyAdmin(supabase, token, password);

    // Deleting is owner-only — a password alone (admin-level) can never delete.
    if (!auth.ok || auth.role !== "owner") {
      return { statusCode: 401, body: JSON.stringify({ success: false, message: "Owner access required" }) };
    }

    if (!id) {
      return { statusCode: 400, body: JSON.stringify({ success: false, message: "Missing id" }) };
    }

    const { data: row, error: fetchErr } = await supabase
      .from("uploads")
      .select("file_path, image_path")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr) {
      return { statusCode: 500, body: JSON.stringify({ success: false, message: "Database error: " + fetchErr.message }) };
    }
    if (!row) {
      return { statusCode: 404, body: JSON.stringify({ success: false, message: "Upload not found" }) };
    }

    if (row.file_path) {
      await supabase.storage.from("upload-files").remove([row.file_path]);
    }
    if (row.image_path) {
      await supabase.storage.from("upload-images").remove([row.image_path]);
    }

    const { error: delErr } = await supabase.from("uploads").delete().eq("id", id);
    if (delErr) {
      return { statusCode: 500, body: JSON.stringify({ success: false, message: "Database error: " + delErr.message }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ success: false, message: "Server error: " + err.message }) };
  }
};
