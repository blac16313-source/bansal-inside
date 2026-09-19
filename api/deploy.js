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

    // CLEAN SHORT NAME - max 6 letters
    let safeName = (name || "site").replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 6);
    if (safeName.length < 3) safeName = "site" + safeName;

    // SHORT random - only 3 letters/numbers
    const shortId = Math.random().toString(36).substring(2, 5); // ex: a7b

    const id = `${safeName}${shortId}`; // ex: flwish + a7b = flwisha7b -> 9 letters total

    await put(`websites/${id}/index.html`, code, {
      access: "public",
      contentType: "text/html; charset=utf-8",
      addRandomSuffix: false,
    });

    return res.status(200).json({
      success: true,
      url: `https://www.webidex.in/s/${id}`, // ex: webidex.in/s/flwisha7b
      subdomainUrl: `https://${id}.webidex.in`, // ex: flwisha7b.webidex.in
      id,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Deployment failed: " + e.message });
  }
}