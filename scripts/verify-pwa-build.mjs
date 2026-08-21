import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

const dist = join(process.cwd(), "dist");
const requiredFiles = [
  "index.html",
  "manifest.webmanifest",
  "sw.js",
  "pwa-192x192.png",
  "pwa-512x512.png",
  "maskable-icon-512x512.png",
];

await Promise.all(requiredFiles.map((file) => access(join(dist, file))));

const manifest = JSON.parse(
  await readFile(join(dist, "manifest.webmanifest"), "utf8"),
);
if (
  manifest.name !== "TambaQu" ||
  manifest.start_url !== "/app/dashboard" ||
  manifest.display !== "standalone"
) {
  throw new Error("Manifest PWA tidak memenuhi kontrak install TambaQu.");
}
for (const size of ["192x192", "512x512"]) {
  if (!manifest.icons?.some((icon) => icon.sizes === size)) {
    throw new Error(`Icon manifest ${size} tidak ditemukan.`);
  }
}

const serviceWorker = await readFile(join(dist, "sw.js"), "utf8");
if (!serviceWorker.includes("index.html") || !serviceWorker.includes("precacheAndRoute")) {
  throw new Error("Service worker tidak berisi app-shell precache yang diharapkan.");
}

console.log(
  `PWA build valid: ${requiredFiles.length} artifacts, manifest installable, app shell precached.`,
);
