const { getAdminClient } = require("./_supabase");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { email, username, password } = JSON.parse(event.body || "{}");

    if (!email || !username || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "Missing fields" }),
      };
    }

    if (password.length < 6) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: "Password must be at least 6 characters" }),
      };
    }

    const supabase = getAdminClient();

    const { data, error } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true, // skip email confirmation entirely
      user_metadata: { username: username.trim() },
    });

    if (error) {
      const msg = error.message.includes("already been registered")
        ? "This email is already registered"
        : error.message;
      return {
        statusCode: 409,
        body: JSON.stringify({ success: false, message: msg }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Account created! You can log in now." }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: "Server error: " + err.message }),
    };
  }
};
