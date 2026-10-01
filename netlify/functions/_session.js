const { getAnonClient } = require("./_supabase");

async function getSessionUser(token) {
  if (!token) return null;
  const supabase = getAnonClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data || !data.user) return null;

  return {
    id: data.user.id,
    email: data.user.email,
    username: (data.user.user_metadata && data.user.user_metadata.username) || data.user.email,
  };
}

module.exports = { getSessionUser };
