const { getAdminClient } = require("./_supabase");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { password, id, action, reason } = JSON.parse(event.body || "{}");

    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, message: "Wrong password" }),
      };
    }

    if (!id || !["approve", "reject"].includes(action)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "Bad request" }),
      };
    }

    const supabase = getAdminClient();

    if (action === "reject") {
      const { error } = await supabase
        .from("uploads")
        .update({
          status: "rejected",
          reason: reason || "No reason given",
          rejected_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        return {
          statusCode: 500,
          body: JSON.stringify({ success: false, message: "Database error: " + error.message }),
        };
      }
      return { statusCode: 200, body: JSON.stringify({ success: true, message: "Rejected" }) };
    }

    // approve
    const { error } = await supabase
      .from("uploads")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, message: "Database error: " + error.message }),
      };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, message: "Approved" }) };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: "Server error: " + err.message }),
    };
  }
};
