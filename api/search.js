// Kids Safe Player — YouTube Search proxy (Vercel Serverless Function)
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  const q = ((req.query && req.query.q) || "").trim();
  if (!q) { res.status(400).json({ error: "empty_query", results: [] }); return; }
  const key = process.env.YT_API_KEY;
  if (!key) { res.status(500).json({ error: "server_not_configured", results: [] }); return; }
  const api = new URL("https://www.googleapis.com/youtube/v3/search");
  api.searchParams.set("part", "snippet");
  api.searchParams.set("type", "video");
  api.searchParams.set("maxResults", "25");
  api.searchParams.set("safeSearch", "strict");
  api.searchParams.set("videoEmbeddable", "true");
  api.searchParams.set("q", q);
  api.searchParams.set("key", key);
  try {
    const r = await fetch(api.toString());
    const data = await r.json();
    if (!r.ok) {
      const reason = (data.error && data.error.errors && data.error.errors[0].reason) || "api_error";
      res.status(502).json({ error: reason, results: [] }); return;
    }
    const results = (data.items || []).map((it) => ({
      id: it.id.videoId,
      title: (it.snippet && it.snippet.title) || "",
      channel: (it.snippet && it.snippet.channelTitle) || "",
      thumb: (it.snippet && it.snippet.thumbnails && it.snippet.thumbnails.medium && it.snippet.thumbnails.medium.url) || "",
    }));
    res.setHeader("Cache-Control", "public, max-age=600");
    res.status(200).json({ results });
  } catch (e) {
    res.status(502).json({ error: "network_error", results: [] });
  }
};
