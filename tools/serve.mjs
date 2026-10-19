// Serve the repository on this machine, so the demo (demo/index.html) can load the cards and the
// theme the way Home Assistant would: as files next to each other, the cards as an ES module.
//
//   node tools/serve.mjs [--port 8770]      then open http://localhost:8770/demo/
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const i = process.argv.indexOf("--port");
const port = Number(i > 0 ? process.argv[i + 1] : 8770);
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".yaml": "text/yaml", ".woff2": "font/woff2",
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".css": "text/css", ".json": "application/json" };

export function serve(p = port) {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = path.join(ROOT, url);
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!fs.existsSync(file)) { res.writeHead(404).end("Not found"); return; }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream", "cache-control": "no-store" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(p, "127.0.0.1", () => ok(server)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await serve();
  console.log(`Collage demo: http://localhost:${port}/demo/`);
}
