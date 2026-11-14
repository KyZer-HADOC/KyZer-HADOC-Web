// Step 2: after the browser finished uploading straight to storage, record it in the DB (status = pending).
const { getAdminClient } = require("./_supabase");
const { r2Configured, headSize, remove: r2Remove } = require("./_r2");
const { SUPABASE_MAX_BYTES, MAX_FILE_BYTES, CATEGORY_RULES, LINK_ALLOWED, cleanUrl, extOf } = require("./_uploadRules");

const json = (statusCode, obj) => ({ statusCode, body: JSON.stringify(obj) });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const { token, id, name, category, fileName, fileType, description, hasCover, externalUrl, useR2 } = JSON.parse(event.body || "{}");
    if (!token) return json(401, { success: false, message: "Please log in first" });

    const supabase = getAdminClient();
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData || !userData.user) {
      return json(401, { success: false, message: "Session expired, please log in again" });
    }
    const authUser = userData.user;

    const isLink = !!externalUrl;
    if (!UUID.test(id || "") || !name || (!isLink && !fileName) || !Object.prototype.hasOwnProperty.call(CATEGORY_RULES, category)) {
      return json(400, { success: false, message: "Bad request" });
    }
    let filePath = null;
    let size = 0;
    let linkUrl = null;
    let storage = "supabase";

    if (isLink) {
      if (!LINK_ALLOWED(category)) return json(400, { success: false, message: "Links are not allowed for this category" });
      linkUrl = cleanUrl(externalUrl);
      if (!linkUrl) return json(400, { success: false, message: "Invalid link" });
    } else {
      const ext = extOf(fileName);
      const allowed = CATEGORY_RULES[category];
      if (allowed && !allowed.includes(ext)) {
        return json(400, { success: false, message: "File type not allowed for this category" });
      }

      filePath = `${category}/${id}${ext}`;

      if (useR2) {
        // Big file: it went to Cloudflare R2. Confirm it arrived and re-check its real size.
        if (category === "Images" || !r2Configured()) return json(400, { success: false, message: "Bad request" });
        storage = "r2";
        const real = await headSize(filePath);
        if (real === null) return json(400, { success: false, message: "Upload not found - please try again" });
        size = real;
        if (size > MAX_FILE_BYTES) {
          await r2Remove(filePath);
          return json(413, { success: false, message: "File is too big (max 200 MB)" });
        }
      } else {
        // Make sure the file really arrived, and re-check its real size.
        const { data: found, error: listErr } = await supabase.storage
          .from("upload-files").list(category, { search: id, limit: 5 });
        const obj = !listErr && found && found.find((f) => f.name === `${id}${ext}`);
        if (!obj) return json(400, { success: false, message: "Upload not found - please try again" });

        size = (obj.metadata && obj.metadata.size) || 0;
        if (size > SUPABASE_MAX_BYTES) {
          await supabase.storage.from("upload-files").remove([filePath]);
          return json(413, { success: false, message: "File is too big for this upload type" });
        }
      }
    }

    const email = authUser.email;
    const username =
      (authUser.user_metadata && (authUser.user_metadata.display_name || authUser.user_metadata.full_name || authUser.user_metadata.name)) ||
      (email ? email.split("@")[0] : "user");

    const { error: dbErr } = await supabase.from("uploads").insert({
      id,
      name: String(name).slice(0, 120),
      category,
      description: description ? String(description).slice(0, 500) : null,
      file_path: filePath,
      file_name: String(isLink ? (fileName || name) : fileName).slice(0, 200),
      file_type: isLink ? "link" : (fileType || "application/octet-stream"),
      file_size: size,
      ...(linkUrl ? { external_url: linkUrl } : {}),
      ...(storage !== "supabase" ? { storage } : {}),
      image_path: hasCover ? `${category}/${id}-cover` : null,
      status: "pending",
      uploader_email: email,
      uploader_username: username,
      auth_user_id: authUser.id,
    });
    if (dbErr) return json(500, { success: false, message: "Database error: " + dbErr.message });

    return json(200, { success: true, id });
  } catch (err) {
    return json(500, { success: false, message: "Server error: " + err.message });
  }
};
