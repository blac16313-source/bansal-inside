import { put } from "@vercel/blob";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { code, name } = req.body || {};
    if (!code) return res.status(400).json({ error: "Website code is required" });

    let safeName = (name || "site").replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 6);
    if (safeName.length < 3) safeName = "site" + safeName;

    const shortId = Math.random().toString(36).substring(2, 5);
    const id = `${safeName}${shortId}`;

    // --- 1. PRIVATE LOCK WITH WEBIDEX AD POPUP ---
    const LOCK_SCRIPT = `
<script>
(async()=>{
  try{
    const SUPA_URL='https://trvmbblhssurxxoxlyus.supabase.co';
    const SUPA_ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRydm1iYmxoc3N1cnh4b3hseXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMTIyNTgsImV4cCI6MjEwNDg4ODI1OH0.psn7mm8NMTNuHQbAPMlw79gldt1Pdh_CejN4zJSeIeg';
    const loader=document.createElement('script');
    loader.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    document.head.appendChild(loader);
    await new Promise(r=>loader.onload=r);
    const supa = supabase.createClient(SUPA_URL, SUPA_ANON);
    const projectName = ${JSON.stringify(name || "")};
    if(!projectName) return;
    window.__WEBIDEX_SUPA__ = supa;
    window.__WEBIDEX_PROJECT__ = projectName;
    window.__WEBIDEX_DEPLOYMENT__ = ${JSON.stringify(id)};
    const { data } = await supa.from('projects').select('is_public,user_id').eq('name', projectName).order('updated_at',{ascending:false}).limit(1).maybeSingle();
    if(data && data.is_public === false){
      const { data: sess } = await supa.auth.getSession();
      if(!sess.session || sess.session.user.id !== data.user_id){
        const showLock = () => {
          if(document.getElementById('webidex-lock')) return;
          const wrap=document.createElement('div');
          wrap.id='webidex-lock';
          wrap.innerHTML = \`
            <div style="position:fixed;inset:0;z-index:9999999;background:rgba(5,5,7,0.82);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui;">
              <div style="background:#FFFBF2;color:#111;padding:32px 26px;border-radius:24px;max-width:380px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
                <div style="width:56px;height:56px;background:#111;border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:26px">🔒</div>
                <div style="font-size:20px;font-weight:800;letter-spacing:-0.5px">This site is locked</div>
                <div style="color:#555;margin-top:8px;font-size:14px;line-height:1.5">This website was made private by the owner.<br/>Want to build your own?</div>
                <div style="font-weight:800;margin-top:6px;font-size:15px">webidex.in ✨</div>
                <a href="https://www.webidex.in" style="display:block;margin-top:20px;background:#111;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:700;font-size:14px;">Create your own website →</a>
                <div style="margin-top:12px;font-size:11px;color:#999">Powered by Webidex</div>
              </div>
            </div>
          \`;
          document.body.appendChild(wrap);
          document.documentElement.style.overflow='hidden';
          document.body.style.overflow='hidden';
        };
        if(document.readyState==='loading'){
          document.addEventListener('DOMContentLoaded', showLock);
        } else { showLock(); }
        setInterval(()=>{ if(!document.getElementById('webidex-lock')) showLock(); }, 500);
        window.__WEBIDEX_IS_PRIVATE_LOCKED__ = true;
        return;
      }
    }
  }catch(e){ console.log('lock err', e); }
})();
</script>
`;

    // --- 2. ANALYTICS TRACKING SCRIPT ---
    const TRACK_SCRIPT = `
<script>
(async()=>{
  try{
    // wait for supa from lock script
    let tries=0;
    while(!window.__WEBIDEX_SUPA__ && tries<50){ await new Promise(r=>setTimeout(r,100)); tries++; }
    const supa = window.__WEBIDEX_SUPA__;
    if(!supa) return;
    if(window.__WEBIDEX_IS_PRIVATE_LOCKED__) return; // don't count views if locked
    
    const projectName = window.__WEBIDEX_PROJECT__ || ${JSON.stringify(name || "")};
    const deploymentId = window.__WEBIDEX_DEPLOYMENT__ || ${JSON.stringify(id)};
    
    // avoid counting owner views (optional)
    // const { data: sess } = await supa.auth.getSession();
    // if(sess.session) return; // uncomment if you don't want to count owner

    await supa.from('project_analytics').insert({
      project_name: projectName,
      deployment_id: deploymentId,
      referrer: document.referrer || 'direct',
      user_agent: navigator.userAgent.slice(0,200),
      ip_hash: btoa(navigator.userAgent + Math.random()).slice(0,16)
    });
  }catch(e){ console.log('track err', e); }
})();
</script>
`;

    const finalCode = LOCK_SCRIPT + TRACK_SCRIPT + code;

    await put(`websites/${id}/index.html`, finalCode, {
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