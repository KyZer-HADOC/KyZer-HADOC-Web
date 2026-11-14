// Files up to 50 MB go to Supabase Storage (free plan limit).
// Files from 50 MB up to 200 MB go to Cloudflare R2 (see _r2.js).
const SUPABASE_MAX_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_FILE_BYTES = 200 * 1024 * 1024;    // 200 MB overall
const MAX_COVER_BYTES = 8 * 1024 * 1024;  // 8 MB cover image

// category -> allowed file extensions (null = any)
const CATEGORY_RULES = {
  Hot: null,
  Special: null,
  AI: null,
  Images: [".jpg", ".jpeg", ".png", ".webp", ".gif"],
  "Minecraft-TexturePacks": [".zip"],
  "Minecraft-Mods": [".jar", ".zip"],
};

// Cover image is OPTIONAL for every category now.
const NEEDS_COVER = () => false;

// External links are allowed for every category except Images (those are served as <img> from storage).
const LINK_ALLOWED = (c) => c !== "Images";

// Returns a cleaned http(s) URL or null if invalid.
function cleanUrl(raw) {
  try {
    const u = new URL(String(raw || "").trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    const s = u.toString();
    return s.length > 800 ? null : s;
  } catch (e) { return null; }
}

function extOf(name) {
  const m = /\.[a-zA-Z0-9]+$/.exec(name || "");
  return m ? m[0].toLowerCase() : "";
}

module.exports = { SUPABASE_MAX_BYTES, MAX_FILE_BYTES, MAX_COVER_BYTES, CATEGORY_RULES, NEEDS_COVER, LINK_ALLOWED, cleanUrl, extOf };
