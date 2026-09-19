export default function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).send("Use /s/:id");
  return res.redirect(308, `/s/${id}`);
}