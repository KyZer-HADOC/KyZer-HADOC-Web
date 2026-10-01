const { getAdminClient } = require("./_supabase");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { token } = JSON.parse(event.body || "{}");

    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, message: "Please log in first" }),
      };
    }

    const supabase = getAdminClient();

    // Verify the Supabase auth JWT sent by the browser and get the user it belongs to.
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData || !userData.user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, message: "Session expired, please log in again" }),
      };
    }
    const authUser = userData.user;

    // Prefer matching by the Supabase auth user id (set on new uploads).
    // Fall back to email for uploads submitted before this column existed.
    let { data, error } = await supabase
      .from("uploads")
      .select("id, name, category, status, reason, submitted_at")
      .eq("auth_user_id", authUser.id)
      .order("submitted_at", { ascending: false });

    if (!error && (!data || data.length === 0) && authUser.email) {
      const fallback = await supabase
        .from("uploads")
        .select("id, name, category, status, reason, submitted_at")
        .eq("uploader_email", authUser.email)
        .order("submitted_at", { ascending: false });
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, message: "Database error: " + error.message }),
      };
    }

    const items = (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      status: row.status,
      reason: row.reason,
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