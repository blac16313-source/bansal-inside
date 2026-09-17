import { put } from "@vercel/blob";
export default async function handler(req, res) {
  if (req.method!== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { code, name } = req.body || {};
    if (!code) return res.status(400).json({ error: "Website code is required" });
    const safeName = (name || "website").replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 40);
    const id = crypto.randomUUID();
    const blob = await put(`websites/${id}/${safeName}.html`, code, { access: "public", contentType: "text/html", addRandomSuffix: false });
    return res.status(200).json({ success: true, url: blob.url, id });
  } catch (e) {
    return res.status(500).json({ error: "Deployment failed: " + e.message });
  }
}