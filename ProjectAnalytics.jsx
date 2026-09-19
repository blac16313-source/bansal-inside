import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function ProjectAnalytics({ projectName }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectName) return;
    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
       .from("project_analytics")
       .select("*")
       .eq("project_name", projectName)
       .order("created_at", { ascending: false })
       .limit(200);
      if (!error) setData(data || []);
      setLoading(false);
    };
    fetch();
  }, [projectName]);

  if (loading) return <div className="p-4 text-sm text-neutral-500">Loading analytics...</div>;
  if (!data.length) return <div className="p-4 text-sm text-neutral-500 rounded-xl bg-neutral-50 border">No views yet. Share your link!</div>;

  const total = data.length;
  const unique = new Set(data.map(d => d.ip_hash)).size;

  // Last 7 days
  const days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0,10);
  });
  const countByDay = days.map(day => data.filter(x => x.created_at.slice(0,10) === day).length);
  const max = Math.max(...countByDay, 1);

  const referrers = Object.entries(
    data.reduce((acc, cur) => {
      const r = cur.referrer?.replace(/^https?:\/\//,'').slice(0,20) || 'direct';
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    }, {})
  ).sort((a,b)=>b[1]-a[1]).slice(0,3);

  return (
    <div className="w-full rounded-[20px] bg-white border border-black/10 p-5 space-y-5">
      {/* Top stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#FFFBF2] rounded-2xl p-4 border">
          <div className="text-[11px] uppercase tracking-widest text-neutral-500 font-bold">Total Views</div>
          <div className="text-2xl font-extrabold mt-1">{total}</div>
        </div>
        <div className="bg-[#111] text-white rounded-2xl p-4">
          <div className="text-[11px] uppercase tracking-widest text-white/60 font-bold">Unique</div>
          <div className="text-2xl font-extrabold mt-1">{unique}</div>
        </div>
      </div>

      {/* Chart */}
      <div>
        <div className="text-xs font-bold mb-3">Last 7 days</div>
        <div className="flex items-end gap-2 h-[70px]">
          {days.map((day, i) => (
            <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className="w-full bg-black rounded-full transition-all"
                style={{ height: `${(countByDay[i]/max)*60 + 4}px` }}
              />
              <div className="text-[10px] text-neutral-500">{day.slice(5)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Referrers */}
      {referrers.length > 0 && (
        <div>
          <div className="text-xs font-bold mb-2">Top referrers</div>
          <div className="space-y-1.5">
            {referrers.map(([ref, count]) => (
              <div key={ref} className="flex justify-between text-xs bg-neutral-50 rounded-full px-3 py-2">
                <span className="truncate">{ref}</span>
                <span className="font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent */}
      <div>
        <div className="text-xs font-bold mb-2">Recent views</div>
        <div className="space-y-1 max-h-[120px] overflow-auto">
          {data.slice(0,5).map(v => (
            <div key={v.id} className="text-[11px] flex justify-between text-neutral-600">
              <span>{new Date(v.created_at).toLocaleString()}</span>
              <span className="truncate max-w-[100px]">{v.referrer || 'direct'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}