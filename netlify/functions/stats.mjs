// netlify/functions/stats.mjs
// Optional password: Netlify > Site settings > Environment variables > STATS_KEY = yourpassword
import { getStore } from "@netlify/blobs";

export default async (req) => {
  const key = Netlify.env.get("STATS_KEY");
  if (key && req.headers.get("x-stats-key") !== key) return new Response("unauthorized", { status: 401 });

  const d = (await getStore("kx-stats").get("data", { type: "json" })) ||
    { views: 0, clicks: 0, byDay: {}, buttons: {}, devices: {}, countries: {}, refs: {}, uniq: {}, recent: [] };
  const out = { ...d, uniques: Object.keys(d.uniq || {}).length };
  delete out.uniq;
  return new Response(JSON.stringify(out), { headers: { "content-type": "application/json", "cache-control": "no-store" } });
};

export const config = { path: "/api/stats" };
