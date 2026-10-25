import { execFileSync } from "node:child_process";
import { copyFile } from "node:fs/promises";
execFileSync(process.execPath, ["node_modules/@vite-pwa/assets-generator/dist/cli.mjs", "--preset", "minimal", "public/brand/tambaqu-current-icon.png"], { stdio: "inherit" });
for (const name of ["pwa-64x64.png", "pwa-192x192.png", "pwa-512x512.png", "maskable-icon-512x512.png", "apple-touch-icon-180x180.png", "favicon.ico"]) {
  await copyFile(`public/brand/${name}`, `public/${name}`);
}
