const { getAdminClient } = require("./_supabase");

exports.handler = async function (event) {
  try {
    const category = event.queryStringParameters && event.queryStringParameters.category;

    if (!category) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "Category is required" }),
      };
    }

    if (category === "Images") {
      return { statusCode: 403, body: JSON.stringify({ success: false, message: "Locked" }) };
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("uploads")
      .select("*")
      .eq("status", "approved")
      .eq("category", category);

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, message: "Database error: " + error.message }),
      };
    }

    const items = data.map((row) => ({
      id: row.id,
      name: row.name,
      fileName: row.file_name,
      description: row.description,
      hasImage: !!row.image_path,
      isLink: !!row.external_url,
    }));

    return { statusCode: 200, body: JSON.stringify({ success: true, items }) };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: "Server error: " + err.message }),
    };
  }
};
