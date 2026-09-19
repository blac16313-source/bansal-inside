import { list } from "@vercel/blob";

export default async function handler(req, res) {
  try {
    let { id, file } = req.query;

    if (!id || id === "www") {
      return res.status(404).send("Website not found - No ID");
    }

    // clean id
    id = id.toLowerCase().trim();

    const filePath = file? file : "index.html";
    const prefix = `websites/${id}/`;

    // List files for this site
    const { blobs } = await list({ prefix });

    if (!blobs || blobs.length === 0) {
      return res.status(404).send(`Website ${id} not found - no files in blob. Checked ${prefix}`);
    }

    // Find exact file
    let targetBlob = blobs.find(b => b.pathname === `${prefix}${filePath}`);

    // Fallback to index.html
    if (!targetBlob) {
      targetBlob = blobs.find(b => b.pathname === `${prefix}index.html`);
    }

    if (!targetBlob) {
      return res.status(404).send(`File ${filePath} not found for ${id}`);
    }

    const response = await fetch(targetBlob.url);
    let content = await response.text();

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=60");
    return res.status(200).send(content);

  } catch (e) {
    console.error(e);
    return res.status(500).send("Error loading site: " + e.message);
  }
}