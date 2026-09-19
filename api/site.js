import { list } from "@vercel/blob";

export default async function handler(req, res) {
  try {
    let { id, file } = req.query;
    if (!id) {
      const host = req.headers.host || "";
      const parts = host.split('.');
      if (parts.length >= 3 && parts[0]!== 'www') id = parts[0];
    }
    if (!id) return res.status(400).send("Missing site ID");
    if (!file || file === "/" || file === "") file = "index.html";

    const prefix = `websites/${id}/`;
    const { blobs } = await list({ prefix });

    let target = blobs.find(b => b.pathname === `websites/${id}/${file}`);
    if (!target) target = blobs.find(b => b.pathname.endsWith("/index.html"));

    if (!target) return res.status(404).send(`Website ${id} not found`);

    const html = await fetch(target.url).then(r => r.text());

    if (file.endsWith(".css")) res.setHeader("Content-Type", "text/css");
    else if (file.endsWith(".js")) res.setHeader("Content-Type", "application/javascript");
    else res.setHeader("Content-Type", "text/html; charset=utf-8");

    return res.status(200).send(html);
  } catch (e) {
    console.error(e);
    return res.status(500).send("Failed: " + e.message);
  }
}