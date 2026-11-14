const { getAdminClient } = require("./_supabase");
const { presignGet } = require("./_r2");

exports.handler = async function (event) {
  try {
    const id = event.queryStringParameters && event.queryStringParameters.id;
    const asset = event.queryStringParameters && event.queryStringParameters.asset; // 'image' or undefined

    if (!id) {
      return { statusCode: 400, body: "Missing id" };
    }

    const supabase = getAdminClient();
    const { data: row, error } = await supabase
      .from("uploads")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !row) {
      return { statusCode: 404, body: "Not found" };
    }

    if (row.status !== "approved") {
      return { statusCode: 403, body: "Not available" };
    }

    // Images category is protected: it is only served through /api/images-access
    if (row.category === "Images") {
      return { statusCode: 403, body: "Locked" };
    }

    if (asset === "image") {
      if (!row.image_path) {
        return { statusCode: 404, body: "No image" };
      }
      const { data } = supabase.storage.from("upload-images").getPublicUrl(row.image_path);
      return {
        statusCode: 302,
        headers: { Location: data.publicUrl },
        body: "",
      };
    }

    // Link uploads: just send the visitor to the shared link (Drive, Mega, etc.)
    if (row.external_url) {
      return { statusCode: 302, headers: { Location: row.external_url }, body: "" };
    }

    if (row.storage === "r2") {
      try {
        const url = await presignGet(row.file_path, row.file_name, 120);
        return { statusCode: 302, headers: { Location: url }, body: "" };
      } catch (e) {
        return { statusCode: 500, body: "Could not generate download link" };
      }
    }

    const { data: signedData, error: signErr } = await supabase.storage
      .from("upload-files")
      .createSignedUrl(row.file_path, 60, {
        download: row.file_name,
      });

    if (signErr || !signedData) {
      return { statusCode: 500, body: "Could not generate download link" };
    }

    return {
      statusCode: 302,
      headers: { Location: signedData.signedUrl },
      body: "",
    };
  } catch (err) {
    return { statusCode: 500, body: "Server error" };
  }
};
