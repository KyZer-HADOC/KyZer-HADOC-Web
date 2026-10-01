const crypto = require("crypto");
const { getAdminClient } = require("./_supabase");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const {
      token, name, category, fileName, fileType, fileBase64,
      description, imageBase64, imageType
    } = JSON.parse(event.body || "{}");

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
    const uploaderEmail = authUser.email;
    const uploaderUsername =
      (authUser.user_metadata && (authUser.user_metadata.display_name || authUser.user_metadata.full_name || authUser.user_metadata.name)) ||
      (uploaderEmail ? uploaderEmail.split("@")[0] : "user");

    if (!name || !category || !fileName || !fileBase64) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "Missing required fields" }),
      };
    }

    const needsImage = category === "AI" || category.startsWith("Minecraft-");
    if (needsImage && !imageBase64) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "Image is required for this category" }),
      };
    }

    const id = crypto.randomUUID();

    // Upload the main file to the private bucket
    // Storage keys must be safe (ASCII, no spaces/unicode). Keep only the file
    // extension from the original name; the human-readable original name is
    // still stored in file_name for display/download purposes.
    const extMatch = /\.[a-zA-Z0-9]+$/.exec(fileName || "");
    const ext = extMatch ? extMatch[0] : "";
    const filePath = `${category}/${id}${ext}`;
    const fileBuffer = Buffer.from(fileBase64, "base64");

    const { error: fileErr } = await supabase.storage
      .from("upload-files")
      .upload(filePath, fileBuffer, {
        contentType: fileType || "application/octet-stream",
        upsert: false,
      });

    if (fileErr) {
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, message: "File upload failed: " + fileErr.message }),
      };
    }

    // Upload the cover image to the public bucket, if provided
    let imagePath = null;
    if (imageBase64) {
      imagePath = `${category}/${id}-cover`;
      const imageBuffer = Buffer.from(imageBase64, "base64");
      const { error: imgErr } = await supabase.storage
        .from("upload-images")
        .upload(imagePath, imageBuffer, {
          contentType: imageType || "image/jpeg",
          upsert: false,
        });
      if (imgErr) {
        return {
          statusCode: 500,
          body: JSON.stringify({ success: false, message: "Image upload failed: " + imgErr.message }),
        };
      }
    }

    const { error: dbErr } = await supabase.from("uploads").insert({
      id,
      name,
      category,
      description: description || null,
      file_path: filePath,
      file_name: fileName,
      file_type: fileType || "application/octet-stream",
      file_size: fileBuffer.length,
      image_path: imagePath,
      status: "pending",
      uploader_email: uploaderEmail,
      uploader_username: uploaderUsername,
      // Storing the Supabase auth user id too makes future lookups (and RLS, if you add it) reliable
      // even if the same person later changes their email.
      auth_user_id: authUser.id,
    });

    if (dbErr) {
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, message: "Database error: " + dbErr.message }),
      };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, id }) };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: "Server error: " + err.message }),
    };
  }
};
