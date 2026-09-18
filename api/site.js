import { get } from "@vercel/blob";

export default async function handler(req, res) {
  try {
    let { id, file } = req.query;

    // If id is empty, try to get it from host header (for subdomain)
    if (!id) {
      const host = req.headers.host || "";
      // host = clax.webidex.in -> id = clax
      const parts = host.split('.');
      if (parts.length >= 3 && parts[0]!== 'www') {
        id = parts[0];
      }
    }

    if (!id) {
      return res.status(400).send("Missing site ID");
    }

    // Default file to index.html if not provided or if path is "/"
    if (!file || file === "" || file === "/") {
      file = "index.html";
    }

    const pathname = `websites/${id}/${file}`;

    const blob = await get(pathname, {
      access: "public"
    });

    if (!blob) {
      return res.status(404).send(`Website ${id}/${file} not found`);
    }

    // Set correct content-type
    if (file.endsWith(".css")) res.setHeader("Content-Type", "text/css");
    else if (file.endsWith(".js")) res.setHeader("Content-Type", "application/javascript");
    else res.setHeader("Content-Type", "text/html; charset=utf-8");

    res.setHeader("Cache-Control", "public, max-age=60");

    // blob.stream or blob url - handle both
    if (blob.stream) {
      const reader = blob.stream.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
      res.end();
    } else {
      // fallback: fetch blob url
      const r = await fetch(blob.url);
      const text = await r.text();
      return res.status(200).send(text);
    }

  } catch (error) {
    console.error(error);
    return res.status(500).send("Failed to load website: " + error.message);
  }
}