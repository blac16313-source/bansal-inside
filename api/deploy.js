import { put } from "@vercel/blob";

export default async function handler(req, res) {
  // CORS - so any website can deploy
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { code, name, domain } = req.body || {};
    
    if (!code) return res.status(400).json({ error: "Website code is required" });
    
    const safeName = (name || "website").replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 40);
    const id = crypto.randomUUID();

    // Upload website code to blob - SAME as your old logic
    const blob = await put(`websites/${id}/${safeName}.html`, code, {
      access: "public",
      contentType: "text/html; charset=utf-8",
      addRandomSuffix: false,
    });

    // Proxied URL = opens directly, no download - SAME as your old logic
    const host = req.headers.host || 'webidex.in';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const publicUrl = `${protocol}://${host}/api/view?url=${encodeURIComponent(blob.url)}`;

    // Generic - works for any domain, no hardcode
    // If domain passed (like claxindia.com), you can save mapping later in DB
    // For now just return URLs, deploy.js stays generic

    return res.status(200).json({ 
      success: true, 
      url: publicUrl, 
      rawUrl: blob.url, 
      id,
      domain: domain || null
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Deployment failed: " + e.message });
  }
}