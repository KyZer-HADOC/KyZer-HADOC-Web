const { getAdminClient } = require("./_supabase");
const { verifyAdmin } = require("./_adminAuth");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { token, password, status } = JSON.parse(event.body || "{}");
    const supabase = getAdminClient();
    const auth = await verifyAdmin(supabase, token, password);

    if (!auth.ok) {
      return { statusCode: 401, body: JSON.stringify({ success: false, message: "Not authorized" }) };
    }

    const { data, error } = await supabase
      .from("uploads")
      .select("id, name, category, description, image_path, file_path, file_name, file_size, status, uploader_email, uploader_username, submitted_at, approved_at, reason")
      .eq("status", status || "pending")
      .order("submitted_at", { ascending: false });

    if (error) {
      return { statusCode: 500, body: JSON.stringify({ success: false, message: "Database error: " + error.message }) };
    }

    const items = await Promise.all((data || []).map(async (row) => {
      let fileUrl = null;
      let imageUrl = null;
      if (row.file_path) {
        const { data: signed } = await supabase.storage.from("upload-files").createSignedUrl(row.file_path, 3600);
        fileUrl = signed && signed.signedUrl;
      }
      if (row.image_path) {
        const { data: signedImg } = await supabase.storage.from("upload-images").createSignedUrl(row.image_path, 3600);
        imageUrl = signedImg && signedImg.signedUrl;
      }
      return {
        id: row.id,
        name: row.name,
        category: row.category,
        description: row.description,
        fileName: row.file_name,
        fileSize: row.file_size,
        fileUrl,
        imageUrl,
        status: row.status,
        uploaderEmail: row.uploader_email,
        uploaderUsername: row.uploader_username,
        submittedAt: row.submitted_at,
        approvedAt: row.approved_at,
        reason: row.reason,
      };
    }));

    return { statusCode: 200, body: JSON.stringify({ success: true, items }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ success: false, message: "Server error: " + err.message }) };
  }
};
