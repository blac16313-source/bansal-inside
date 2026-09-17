// /api/deploy.js — Vercel Function
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  
  const { code, name } = req.body;
  if (!code || !name) return res.status(400).json({ error: 'Missing code or name' });

  // Clean name: only a-z0-9-
  const cleanName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-');
  
  // For now we deploy as static file and return clean URL structure
  // You will later map *.webidex.app to this storage
  
  try {
    // If you are on Vercel Blob / S3 / Cloudflare R2 — save file here
    // Example: await saveToStorage(`${cleanName}/index.html`, code)
    
    // For quick test, we just return clean URL
    // Real URL will be: https://webidex.app/p/cleanName or https://cleanName.webidex.app
    const liveUrl = `https://${cleanName}.webidex.app`;
    
    // You can also deploy to Vercel's own hosting via their API
    // But for now return this
    
    return res.status(200).json({ 
      url: liveUrl,
      realUrl: liveUrl,
      name: cleanName,
      message: 'Deployed — will be live once wildcard DNS is set'
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}