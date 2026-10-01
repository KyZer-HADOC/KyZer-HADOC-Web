const { getAdminClient } = require("./_supabase");
const { verifyAdmin } = require("./_adminAuth");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { token, password } = JSON.parse(event.body || "{}");
    const supabase = getAdminClient();
    const auth = await verifyAdmin(supabase, token, password);

    // Rank management is owner-only — a password alone (admin-level) can't list/edit ranks.
    if (!auth.ok || auth.role !== "owner") {
      return { statusCode: 401, body: JSON.stringify({ success: false, message: "Owner access required" }) };
    }

    const { data: authUsers, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) {
      return { statusCode: 500, body: JSON.stringify({ success: false, message: "Auth error: " + listErr.message }) };
    }

    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, role, avatar_url");
    if (profErr) {
      return { statusCode: 500, body: JSON.stringify({ success: false, message: "Database error: " + profErr.message }) };
    }

    const profileMap = {};
    (profiles || []).forEach((p) => { profileMap[p.id] = p; });

    const items = authUsers.users
      .filter((u) => u.id !== auth.userId)
      .map((u) => {
        const p = profileMap[u.id] || {};
        return {
          id: u.id,
          email: u.email,
          first_name: p.first_name || null,
          last_name: p.last_name || null,
          role: p.role || "client",
          avatar_url: p.avatar_url || null,
        };
      });

    return { statusCode: 200, body: JSON.stringify({ success: true, items }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ success: false, message: "Server error: " + err.message }) };
  }
};
