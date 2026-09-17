// api/deploy.js - Webidex FINAL
let SITES = global._webidex_sites || (global._webidex_sites = new Map());

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET - Serve deployed site: /api/deploy?name=my-shop
  if (req.method === 'GET') {
    const name = (req.query.name || '').toLowerCase().trim();
    if (!name) return res.status(400).json({ error: 'name required' });
    
    const site = SITES.get(name);
    if (!site) {
      return res.status(404).send(`
        <html><head><style>body{font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:#FFFBF2}</style></head>
        <body><div style="text-align:center"><h1>404 - Site not found</h1><p>${name} does not exist</p><a href="/">Go to Webidex</a></div></body></html>
      `);
    }
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    return res.status(200).send(site.code);
  }

  // POST - Deploy new site
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

    if (clean.length < 3) return res.status(400).json({ error: 'Min 3 chars' });
    if (clean.length > 30) return res.status(400).json({ error: 'Max 30 chars' });

    // Save in memory (use DB later for persistence)
    SITES.set(clean, {
      code,
      name: clean,
      gmail: gmail || 'anon',
      createdAt: new Date().toISOString()
    });

    // Real working URL (this is what shows in link box)
    const realUrl = `/api/deploy?name=${clean}`;

    return res.status(200).json({
      name: clean,
      realUrl: realUrl, // actual working link
      url: realUrl,
      fullUrl: realUrl,
      message: 'Deployed'
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}