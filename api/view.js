import { supabase } from '../lib/supabase.js';

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).send("Use /s/:id");

  try {
    const { data } = await supabase.from('projects').select('views').eq('id', id).single();
    if (data) {
      await supabase.from('projects').update({ views: (data.views || 0) + 1 }).eq('id', id);
    }
  } catch (e) {}

  return res.redirect(308, `/s/${id}`);
}