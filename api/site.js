import { list } from "@vercel/blob";

const SUPABASE_URL = 'https://supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRydm1iYmxoc3N1cnh4b3hseXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMTIyNTgsImV4cCI6MjEwNDg4ODI1OH0.psn7mm8NMTNuHQbAPMlw79gldt1Pdh_CejN4zJSeIeg';

export default async function handler(req, res) {
  try {
    let { id, file } = req.query;

    // --- CUSTOM DOMAIN CHECK (BECH MEIN CRASH NAHI HOGA) ---
    if (!id) {
      const hostname = req.headers.host || ''; 
      const cleanHost = hostname.replace('www.', '').toLowerCase().trim();

      if (cleanHost !== 'webidex.in' && cleanHost !== 'localhost:3000') {
        try {
          const domainQuery = await fetch(`${SUPABASE_URL}/rest/v1/projects?custom_domain=eq.${encodeURIComponent(cleanHost)}&select=live_url`, {
            headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
          });
          const matchedProjects = await domainQuery.json();
          
          if (Array.isArray(matchedProjects) && matchedProjects.length > 0) {
            const liveUrl = matchedProjects[0].live_url || '';
            const parts = liveUrl.split('/s/');
            if (parts.length > 1) {
              id = parts[1].split('?')[0].split('#')[0];
            }
          }
        } catch (domainErr) {
          console.log("Domain lookup fail", domainErr.message);
        }
      }
    }

    if (!id || id === "www") return res.status(404).send("Website not found");
    id = id.toLowerCase().trim();
    const slug = id;
    const filePath = file ? file : "index.html";
    const prefix = `websites/${id}/`;
    const { blobs } = await list({ prefix });
    if (!blobs || blobs.length === 0) return res.status(404).send(`Website ${id} not found`);
    let targetBlob = blobs.find(b => b.pathname === `${prefix}${filePath}`);
    if (!targetBlob) targetBlob = blobs.find(b => b.pathname === `${prefix}index.html`);
    if (!targetBlob) return res.status(404).send(`File not found`);
    const response = await fetch(targetBlob.url);
    let content = await response.text();

    if (filePath === "index.html" || filePath.endsWith(".html")) {
      try {
        const q = await fetch(`${SUPABASE_URL}/rest/v1/projects?live_url=ilike.*${slug}*&select=id,views`, {
          headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
        });
        const projects = await q.json();
        if (Array.isArray(projects) && projects.length > 0) {
          for (let p of projects) {
            await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${p.id}`, {
              method: "PATCH",
              headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({ views: (p.views || 0) + 1 })
            });
          }
        }
      } catch (e) { console.log("count fail", e.message); }
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    return res.status(200).send(content);
  } catch (e) {
    return res.status(500).send("Error: " + e.message);
  }
}
