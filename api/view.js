export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).send("Missing url");
  try {
    const r = await fetch(url);
    const html = await r.text();
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", "inline; filename=index.html");
    res.setHeader("Cache-Control", "public, max-age=60");
    res.setHeader("X-Content-Type-Options", "nosniff");
    return res.status(200).send(html);
  } catch (e) {
    return res.status(500).send("Failed: " + e.message);
  }
}