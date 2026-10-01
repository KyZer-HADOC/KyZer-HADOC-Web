const { getAdminClient } = require("./_supabase");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { password } = JSON.parse(event.body || "{}");

    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, message: "Wrong password" }),
      };
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("uploads")
      .select("id, name, category, file_name, uploader_username, uploader_email, submitted_at")
      .eq("status", "pending")
      .order("submitted_at", { ascending: false });

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, message: "Database error: " + error.message }),
      };
    }

    const items = data.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      fileName: row.file_name,
      uploaderUsername: row.uploader_username,
      uploaderEmail: row.uploader_email,
      submittedAt: row.submitted_at,
    }));

    return { statusCode: 200, body: JSON.stringify({ success: true, items }) };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: "Server error: " + err.message }),
    };
  }
};
