// Screenshots of the demo, for the README and for checking a change at a phone's width and a
// desktop's: serves the repository, opens each view in headless Chrome and saves an image.
//
//   node tools/shoot.mjs [--out docs/media] [--views home,doors,kitchen] [--widths 1300,390] [--sky 15:30]
//
// --sky sets the 3D sky's time of day, so a screenshot taken at night still shows the sun.
// Chrome is found at its usual macOS and Linux paths, or set CHROME to its executable. It runs in
// Paris time (TZ, unless set), so the demo's home point is Clamart and every screenshot shows the
// same place.
import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { serve } from "./serve.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const arg = (name, dflt) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : dflt; };
const out = path.resolve(ROOT, arg("out", "docs/media"));
const views = arg("views", "home,doors,kitchen").split(",");
const widths = arg("widths", "1300,390").split(",").map(Number);
const sky = arg("sky");
const port = 8771;

const chrome = process.env.CHROME || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
if (!chrome) { console.error("shoot: Chrome not found; set CHROME to its executable."); process.exit(1); }
fs.mkdirSync(out, { recursive: true });
const server = await serve(port);

const shot = (url, file, width, height, scale) => new Promise((ok, fail) => execFile(chrome, [
  "--headless=new", "--hide-scrollbars", `--force-device-scale-factor=${scale}`, `--window-size=${width},${height}`,
  "--virtual-time-budget=12000", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", `--screenshot=${file}`, url,
], { timeout: 90000, env: { ...process.env, TZ: process.env.TZ || "Europe/Paris" } }, (err) => (err ? fail(err) : ok())));

for (const view of views) {
  for (const width of widths) {
    const file = path.join(out, `${view}${width < 600 ? "-phone" : ""}.png`);
    const height = width < 600 ? 1700 : { home: 2040, doors: 1340, kitchen: 1420 }[view] || 1500;
    // At 1.5x: sharp on a screen, and each image stays under the 1 MB the privacy check allows.
    const phone = width < 600, scale = 1.5;
    await shot(`http://127.0.0.1:${port}/demo/?view=${view}${sky ? `&sky=${sky}` : ""}${phone ? `&width=${width}` : ""}`, file, phone ? 600 : width, height, scale);
    // A phone's page is drawn in the middle of a wider window: keep only its width.
    if (phone) await new Promise((ok) => execFile("sips", ["-c", String(height * scale), String(width * scale), file], () => ok()));
    // A JPEG is a tenth of the size; macOS converts with sips, elsewhere the PNG is kept.
    const jpg = file.replace(/\.png$/, ".jpg");
    const made = await new Promise((ok) => execFile("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "82", file, "--out", jpg], (err) => ok(!err)));
    if (made) fs.unlinkSync(file);
    console.log(`shoot: ${path.relative(ROOT, made ? jpg : file)}`);
  }
}
server.close();
