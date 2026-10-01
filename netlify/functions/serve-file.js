const { getAdminClient } = require("./_supabase");

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
      .select("status, file_path, image_path, file_name")
      .eq("id", id)
      .single();

    if (error || !row) {
      return { statusCode: 404, body: "Not found" };
    }

    if (row.status !== "approved") {
      return { statusCode: 403, body: "Not available" };
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
