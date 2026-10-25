const ranges: Record<string, [number, number]> = {
  temperature: [-10, 70],
  ph: [0, 14],
  dissolvedOxygen: [0, 30],
  salinity: [0, 100],
  ammonia: [0, 100],
  nitrite: [0, 100],
};
export function validateMeasurements(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Data pengukuran tidak valid.");
  const input = value as Record<string, unknown>;
  const output: Record<string, number> = {};
  for (const [key, [min, max]] of Object.entries(ranges)) {
    if (input[key] === undefined || input[key] === null || input[key] === "")
      continue;
    const n = input[key];
    if (typeof n !== "number" || !Number.isFinite(n) || n < min || n > max)
      throw new Error(`Nilai ${key} di luar batas pengukuran yang diterima.`);
    output[key] = n;
  }
  if (!Object.keys(output).length)
    throw new Error("Isi setidaknya satu parameter pengukuran.");
  return output;
}
export function validateImageData(value: unknown): string {
  if (typeof value !== "string" || value.length > 5_600_000)
    throw new Error("Gambar maksimal 4 MB.");
  const match =
    /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) throw new Error("Gunakan gambar JPG, PNG, atau WebP.");
  const bytes = atob(match[2]);
  if (bytes.length > 4 * 1024 * 1024) throw new Error("Gambar maksimal 4 MB.");
  const valid =
    match[1] === "jpeg"
      ? bytes.charCodeAt(0) === 255 &&
        bytes.charCodeAt(1) === 216 &&
        bytes.charCodeAt(2) === 255
      : match[1] === "png"
        ? bytes.slice(0, 8) === "\x89PNG\r\n\x1a\n"
        : bytes.startsWith("RIFF") && bytes.slice(8, 12) === "WEBP";
  if (!valid) throw new Error("Isi berkas tidak sesuai format gambar.");
  return value;
}
