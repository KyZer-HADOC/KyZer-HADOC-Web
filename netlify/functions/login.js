const { getAnonClient } = require("./_supabase");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { email, password } = JSON.parse(event.body || "{}");

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "Missing fields" }),
      };
    }

    const supabase = getAnonClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error || !data.session) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, message: "Wrong email or password" }),
      };
    }

    const username =
      (data.user.user_metadata && data.user.user_metadata.username) || data.user.email;

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        token: data.session.access_token,
        username,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: "Server error: " + err.message }),
    };
  }
};
