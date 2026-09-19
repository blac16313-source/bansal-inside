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

    // --- PRIVATE LOCK INJECTION (added) ---
    // This script checks Supabase is_public at RUNTIME when site is opened
    const LOCK_SCRIPT = `
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
(async()=>{
  try{
    const SUPA_URL='https://trvmbblhssurxxoxlyus.supabase.co';
    const SUPA_ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRydm1iYmxoc3N1cnh4b3hseXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMTIyNTgsImV4cCI6MjEwNDg4ODI1OH0.psn7mm8NMTNuHQbAPMlw79gldt1Pdh_CejN4zJSeIeg';
    const supa = supabase.createClient(SUPA_URL, SUPA_ANON);
    const projectName = ${JSON.stringify(name || "")};
    if(!projectName) return;
    const { data } = await supa.from('projects').select('is_public,user_id').eq('name', projectName).order('updated_at',{ascending:false}).limit(1).maybeSingle();
    if(data && data.is_public === false){
      const { data: sess } = await supa.auth.getSession();
      if(!sess.session || sess.session.user.id !== data.user_id){
        document.documentElement.innerHTML = '<div style="display:flex;min-height:100vh;align-items:center;justify-content:center;background:#050507;color:#fff;font-family:Inter,system-ui"><div style="text-align:center;background:#FFFBF2;color:#111;padding:36px 28px;border-radius:20px;max-width:400px;margin:20px"><div style="font-size:44px">🔒</div><div style="font-size:20px;font-weight:800;margin-top:12px">This project is Private</div><div style="color:#666;margin-top:8px;font-size:14px;line-height:1.5">Owner has set this project to private. Please login with owner account on webidex.in to view.</div><a href="https://www.webidex.in" style="display:inline-block;margin-top:18px;background:#111;color:white;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:700;font-size:13px">Go to Webidex</a></div></div>';
        document.documentElement.style.display='block';
      }
    }
  }catch(e){ console.log('lock check failed', e); }
})();
</script>
`;

    let finalCode = code;
    if(finalCode.toLowerCase().includes('<head>')){
      finalCode = finalCode.replace(/<head>/i, '<head>' + LOCK_SCRIPT);
    } else if(finalCode.toLowerCase().includes('<html>')){
      finalCode = finalCode.replace(/<html[^>]*>/i, (m)=> m + LOCK_SCRIPT);
    } else {
      finalCode = LOCK_SCRIPT + finalCode;
    }
    // --- END LOCK INJECTION ---

    await put(`websites/${id}/index.html`, finalCode, {
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