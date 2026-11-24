const { getAdminClient } = require("./_supabase");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: { "Allow": "POST" }, body: "Method Not Allowed" };
  }
  try {
    const body = JSON.parse(event.body || "{}");
    const token = body.token;
    if (!token || typeof token !== "string") {
      return { statusCode: 401, body: JSON.stringify({ success: false, message: "Please sign in on the main website first." }) };
    }
    const supabase = getAdminClient();
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    const user = userData && userData.user;
    if (userError || !user || !user.email) {
      return { statusCode: 401, body: JSON.stringify({ success: false, message: "Your main-site session has expired. Please log in again." }) };
    }
    // The service-role key stays server-side. Only a one-time token hash leaves this function.
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: user.email
    });
    if (error) {
      return { statusCode: 400, body: JSON.stringify({ success: false, message: error.message }) };
    }
    const tokenHash = data && data.properties && data.properties.hashed_token;
    if (!tokenHash) {
      return { statusCode: 500, body: JSON.stringify({ success: false, message: "Supabase did not return a sign-in token." }) };
    }
    return {
      statusCode: 200,
      headers: { "Cache-Control": "no-store", "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, tokenHash: tokenHash })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ success: false, message: "Sign-in handoff failed." }) };
  }
};
