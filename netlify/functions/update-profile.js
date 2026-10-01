const { getAdminClient } = require("./_supabase");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { token, first_name, last_name, avatarBase64, avatarType } = JSON.parse(event.body || "{}");

    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ success: false, message: "Please log in first" }) };
    }

    const supabase = getAdminClient();
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData || !userData.user) {
      return { statusCode: 401, body: JSON.stringify({ success: false, message: "Session expired, please log in again" }) };
    }
    const userId = userData.user.id;

    const update = {
      first_name: first_name || null,
      last_name: last_name || null,
      display_name: [first_name, last_name].filter(Boolean).join(" ") || null,
    };

    if (avatarBase64) {
      const ext = (avatarType && avatarType.split("/")[1]) || "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const buffer = Buffer.from(avatarBase64, "base64");

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, buffer, { contentType: avatarType || "image/jpeg", upsert: true });

      if (uploadErr) {
        return { statusCode: 500, body: JSON.stringify({ success: false, message: "Avatar upload failed: " + uploadErr.message }) };
      }

      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
      update.avatar_url = publicUrlData.publicUrl;
    }

    const { error: dbErr } = await supabase.from("profiles").update(update).eq("id", userId);
    if (dbErr) {
      return { statusCode: 500, body: JSON.stringify({ success: false, message: "Database error: " + dbErr.message }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, avatar_url: update.avatar_url || null }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ success: false, message: "Server error: " + err.message }) };
  }
};
