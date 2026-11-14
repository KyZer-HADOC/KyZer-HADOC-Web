// netlify/functions/track.mjs   (setup once: npm install @netlify/blobs)
// Receives page views + button clicks from index.html and stores the totals.
import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  if (req.method !== "POST") return new Response("ok");
  const ua = req.headers.get("user-agent") || "";
  if (/bot|crawl|spider|preview|headless/i.test(ua)) return new Response("ignored");

  let b;
  try { b = await req.json(); } catch { return new Response("bad request", { status: 400 }); }

  const type = b.type === "click" ? "click" : "view";
  const label = String(b.label || "").slice(0, 60);
  const device = /mobi|android|iphone|ipad/i.test(ua) ? "mobile" : "desktop";
  const country = context?.geo?.country?.code || "??";
  let ref = "direct";
  try {
    const h = new URL(b.ref).hostname;
    if (h && h !== new URL(req.url).hostname) ref = h;
  } catch {}
  const vid = String(b.vid || "").slice(0, 40);
  const day = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" });

  const store = getStore("kx-stats");
  const d = (await store.get("data", { type: "json" })) ||
    { views: 0, clicks: 0, byDay: {}, buttons: {}, devices: {}, countries: {}, refs: {}, uniq: {}, recent: [] };

  d.byDay[day] = d.byDay[day] || { v: 0, c: 0 };
  if (type === "view") {
    d.views++; d.byDay[day].v++;
    d.devices[device] = (d.devices[device] || 0) + 1;
    d.countries[country] = (d.countries[country] || 0) + 1;
    d.refs[ref] = (d.refs[ref] || 0) + 1;
    if (vid && !d.uniq[vid] && Object.keys(d.uniq).length < 20000) d.uniq[vid] = 1;
  } else {
    d.clicks++; d.byDay[day].c++;
    d.buttons[label || "unknown"] = (d.buttons[label || "unknown"] || 0) + 1;
  }
  d.recent.unshift({ t: Date.now(), type, label, device, country, ref });
  d.recent = d.recent.slice(0, 100);
  Object.keys(d.byDay).sort().slice(0, -90).forEach((k) => delete d.byDay[k]);

  // small site = fine; two visitors at the exact same millisecond may overwrite each other
  await store.setJSON("data", d);
  return new Response("ok");
};

export const config = { path: "/api/track" };
