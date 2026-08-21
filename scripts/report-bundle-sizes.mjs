import { readdir, readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import path from "node:path";

const assetsDirectory = path.resolve("dist/assets");
const files = (await readdir(assetsDirectory))
  .filter((name) => name.endsWith(".js"))
  .map(async (name) => {
    const content = await readFile(path.join(assetsDirectory, name));
    return {
      name,
      minifiedKb: content.byteLength / 1_000,
      gzipKb: gzipSync(content).byteLength / 1_000,
    };
  });

const rows = (await Promise.all(files))
  .sort((a, b) => b.minifiedKb - a.minifiedKb)
  .map((item) => ({
    file: item.name,
    "minified (kB)": item.minifiedKb.toFixed(2),
    "gzip (kB)": item.gzipKb.toFixed(2),
  }));

console.table(rows);
