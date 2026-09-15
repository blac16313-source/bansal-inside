import { get } from "@vercel/blob";

export default async function handler(req, res) {
  try {
    const { id, file } = req.query;

    if (!id || !file) {
      return res.status(400).send("Missing site ID or file name");
    }

    const pathname = `websites/${id}/${file}`;

    const blob = await get(pathname, {
      access: "public"
    });

    if (!blob || !blob.stream) {
      return res.status(404).send("Website not found");
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", "inline");

    const reader = blob.stream.getReader();

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      res.write(Buffer.from(value));
    }

    res.end();

  } catch (error) {
    console.error(error);
    return res.status(500).send("Failed to load website");
  }
}