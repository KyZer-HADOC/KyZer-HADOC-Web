// Images tab gate. Access = VIP/Admin/Owner rank (token) OR the secret code stored in the
// Netlify env var IMAGES_SECRET_CODE. Returns the image list with short-lived (60s) signed URLs.
const crypto = require("crypto");
const { getAdminClient } = require("./_supabase");
const { isVipPlus } = require("./_role");

const json = (statusCode, obj) => ({ statusCode, body: JSON.stringify(obj) });

function codeMatches(input) {
  const expected = process.env.IMAGES_SECRET_CODE;
  if (!expected || !input) return false;
  const a = crypto.createHash("sha256").update(String(input)).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const { token, code, checkOnly } = JSON.parse(event.body || "{}");

    let ok = await isVipPlus(token);
    if (!ok && code) {
      ok = codeMatches(code);
      if (!ok) {
        await new Promise((r) => setTimeout(r, 700)); // slow down guessing
        return json(401, { success: false, message: "Wrong code" });
      }
    }
    if (!ok) return json(401, { success: false, message: "locked" });
    if (checkOnly) return json(200, { success: true, items: [] });

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("uploads")
      .select("id, name, file_path, file_name")
      .eq("status", "approved")
      .eq("category", "Images")
      .order("approved_at", { ascending: false });
    if (error) return json(500, { success: false, message: "Database error: " + error.message });

    const items = [];
    for (const row of data) {
      const { data: signed } = await supabase.storage
        .from("upload-files").createSignedUrl(row.file_path, 60);
      if (signed) items.push({ id: row.id, name: row.name, fileName: row.file_name, url: signed.signedUrl });
    }
    return json(200, { success: true, items });
  } catch (err) {
    return json(500, { success: false, message: "Server error: " + err.message });
  }
};
