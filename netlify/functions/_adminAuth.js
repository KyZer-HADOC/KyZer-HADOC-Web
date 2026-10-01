// netlify/functions/_adminAuth.js
//
// Shared authorization check for all admin-* functions.
// Two ways to get access:
//  1) `token` — a Supabase auth access_token belonging to a user whose
//     profiles.role is 'owner' or 'admin'.
//  2) `password` — matches process.env.ADMIN_PASSWORD. This grants
//     'admin'-level access only (never 'owner'), so it can never be used
//     to manage ranks — only to approve/reject uploads.
//
// Returns { ok: true, role: 'owner' | 'admin' } or { ok: false }.

async function verifyAdmin(supabase, token, password) {
  if (token) {
    const { data: userData, error } = await supabase.auth.getUser(token);
    if (!error && userData && userData.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .maybeSingle();
      const role = profile && profile.role;
      if (role === "owner" || role === "admin") {
        return { ok: true, role, userId: userData.user.id };
      }
    }
  }

  if (password && process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD) {
    return { ok: true, role: "admin", userId: null };
  }

  return { ok: false };
}

module.exports = { verifyAdmin };
