import { put } from "@vercel/blob";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method!== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { code, name } = req.body || {};
    if (!code) return res.status(400).json({ error: "Website code is required" });

    const safeName = (name || "site").replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase().slice(0, 25);
    const shortId = crypto.randomUUID().split("-")[0];
    const id = `${safeName}-${shortId}`;

    await put(`websites/${id}/index.html`, code, {
      access: "public",
      contentType: "text/html; charset=utf-8",
      addRandomSuffix: false,
    });

    return res.status(200).json({
      success: true,
      url: `https://www.webidex.in/s/${id}`,
      subdomainUrl: `https://${id}.webidex.in`,
      id,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Deployment failed: " + e.message });
  }
}