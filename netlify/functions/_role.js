// Shared helper: look up the rank (owner/admin/vip/client) of the user behind a Supabase access token.
const { getAdminClient } = require("./_supabase");

const VIP_PLUS = ["vip", "admin", "owner"];

async function getRoleFromToken(token) {
  if (!token) return null;
  const supabase = getAdminClient();
  const { data: userData, error } = await supabase.auth.getUser(token);
  if (error || !userData || !userData.user) return null;
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", userData.user.id).maybeSingle();
  return { userId: userData.user.id, role: (profile && profile.role) || "client" };
}

async function isVipPlus(token) {
  const r = await getRoleFromToken(token);
  return !!r && VIP_PLUS.includes(r.role);
}

module.exports = { getRoleFromToken, isVipPlus, VIP_PLUS };
