// Step 1 of the big-file upload: validates the request and hands the browser
// signed upload URLs so the file goes straight to Supabase Storage
// (bypasses Netlify's 6 MB function payload limit). <=50 MB -> Supabase, 50-200 MB -> Cloudflare R2.
// Link uploads (externalUrl) skip the file part and only get an id (+ optional cover upload URL).
const crypto = require("crypto");
const { getAdminClient } = require("./_supabase");
const { r2Configured, presignPut } = require("./_r2");
const { SUPABASE_MAX_BYTES, MAX_FILE_BYTES, MAX_COVER_BYTES, CATEGORY_RULES, NEEDS_COVER, LINK_ALLOWED, cleanUrl, extOf } = require("./_uploadRules");

const json = (statusCode, obj) => ({ statusCode, body: JSON.stringify(obj) });

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const { token, category, fileName, fileSize, coverName, coverSize, externalUrl } = JSON.parse(event.body || "{}");
    if (!token) return json(401, { success: false, message: "Please log in first" });

    const supabase = getAdminClient();
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData || !userData.user) {
      return json(401, { success: false, message: "Session expired, please log in again" });
    }

    if (!Object.prototype.hasOwnProperty.call(CATEGORY_RULES, category)) {
      return json(400, { success: false, message: "Invalid category" });
    }
    const isLink = !!externalUrl;
    if (isLink) {
      if (!LINK_ALLOWED(category)) return json(400, { success: false, message: "Links are not allowed for this category" });
      if (!cleanUrl(externalUrl)) return json(400, { success: false, message: "Invalid link (must start with http:// or https://)" });
    } else {
      if (!fileName || !Number.isFinite(fileSize) || fileSize <= 0) {
        return json(400, { success: false, message: "Missing file" });
      }
      if (fileSize > MAX_FILE_BYTES) {
        return json(413, { success: false, message: "File is too big (max 200 MB). Use the Link option for bigger files." });
      }
      if (fileSize > SUPABASE_MAX_BYTES) {
        if (category === "Images") return json(413, { success: false, message: "Images can be max 50 MB" });
        if (!r2Configured()) return json(503, { success: false, message: "50 MB ට වඩා ලොකු upload තාම set up කරලා නෑ. දැනට Link option එක use කරන්න." });
      }
      const allowed = CATEGORY_RULES[category];
      const ext = extOf(fileName);
      if (allowed && !allowed.includes(ext)) {
        return json(400, { success: false, message: "This category only accepts: " + allowed.join(", ") });
      }
    }

    const wantsCover = !!coverName;
    if (wantsCover && (!Number.isFinite(coverSize) || coverSize > MAX_COVER_BYTES)) {
      return json(413, { success: false, message: "Cover image is too big (max 8 MB)" });
    }

    const id = crypto.randomUUID();
    let file = null;
    if (!isLink && fileSize > SUPABASE_MAX_BYTES) {
      const key = `${category}/${id}${extOf(fileName)}`;
      file = { r2: true, path: key, url: await presignPut(key) };
    } else if (!isLink) {
      const filePath = `${category}/${id}${extOf(fileName)}`;
      const { data: fileSigned, error: fileErr } = await supabase.storage
        .from("upload-files").createSignedUploadUrl(filePath);
      if (fileErr) return json(500, { success: false, message: "Could not start upload: " + fileErr.message });
      file = { path: filePath, token: fileSigned.token };
    }

    let cover = null;
    if (wantsCover) {
      const coverPath = `${category}/${id}-cover`;
      const { data: coverSigned, error: coverErr } = await supabase.storage
        .from("upload-images").createSignedUploadUrl(coverPath);
      if (coverErr) return json(500, { success: false, message: "Could not start cover upload: " + coverErr.message });
      cover = { path: coverPath, token: coverSigned.token };
    }

    return json(200, {
      success: true,
      id,
      file,
      cover,
    });
  } catch (err) {
    return json(500, { success: false, message: "Server error: " + err.message });
  }
};
