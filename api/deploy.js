// api/deploy.js - Webidex Deploy API FINAL
let SITES = global._webidex_sites || (global._webidex_sites = new Map());

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET /api/deploy?name=my-site -> Serve HTML
  if (req.method === 'GET') {
    const name = (req.query.name || '').toLowerCase().trim();
    if (!name) return res.status(400).json({ error: 'name required' });
    
    const site = SITES.get(name);
    if (!site) {
      return res.status(404).send('<h1 style="font-family:Inter;text-align:center;margin-top:100px">404 - Site not found<br><a href="/">Go to Webidex</a></h1>');
    }
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(site.code);
  }

  // POST only for deploy
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  try {
    const { code, name, gmail } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: 'code and name required' });
    }

    // Clean name
    let clean = name.toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '');

    if (clean.length < 3) return res.status(400).json({ error: 'Name min 3 chars' });
    if (clean.length > 30) return res.status(400).json({ error: 'Name max 30 chars' });

    // Save
    SITES.set(clean, {
      code,
      name: clean,
      gmail: gmail || 'anon',
      createdAt: new Date().toISOString()
    });

    // URLs
    const prettyUrl = `https://${clean}.webidex.app`;
    const realUrl = `/api/deploy?name=${clean}`;

    return res.status(200).json({
      url: prettyUrl,
      realUrl: realUrl,
      name: clean,
      message: 'Deployed successfully'
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}