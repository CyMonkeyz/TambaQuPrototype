import type { Assessment, Extraction } from "./types.ts";

export function assessWater(
  data: Record<string, unknown>,
  now = Date.now(),
): Assessment {
  const age = now - Date.parse(String(data.measuredAt));
  if (
    !Number.isFinite(age) ||
    age > 180_000 ||
    age < -60_000 ||
    data.quality !== "valid"
  )
    return {
      level: "unknown",
      title: "Periksa data",
      reasons: ["Data belum tersedia, terlambat, atau belum valid."],
    };
  const doValue = data.dissolvedOxygen;
  const ph = data.ph;
  const temperature = data.temperature;
  if (
    [doValue, ph, temperature].some(
      (v) => typeof v !== "number" || !Number.isFinite(v),
    )
  )
    return {
      level: "unknown",
      title: "Data belum lengkap",
      reasons: ["Oksigen, pH, dan suhu dibutuhkan untuk ringkasan awal."],
    };
  const reasons: string[] = [];
  const oxygen = doValue as number;
  if (oxygen < 4)
    reasons.push("Oksigen terlarut rendah. Periksa pengukuran dan aerasi.");
  if ((ph as number) < 7 || (ph as number) > 8.5)
    reasons.push("pH di luar rentang acuan awal.");
  if ((temperature as number) < 26 || (temperature as number) > 32)
    reasons.push("Suhu di luar rentang acuan awal.");
  return {
    level: oxygen < 3 ? "critical" : reasons.length ? "warning" : "safe",
    title:
      oxygen < 3
        ? "Segera periksa kolam"
        : reasons.length
          ? "Perlu perhatian"
          : "Dalam rentang acuan",
    reasons,
  };
}

export function parseExtraction(value: unknown): Extraction {
  if (!value || typeof value !== "object")
    throw new Error("Hasil pembacaan gambar tidak valid.");
  const v = value as Record<string, unknown>;
  if (
    typeof v.text !== "string" ||
    typeof v.context !== "string" ||
    !Array.isArray(v.observations) ||
    !Array.isArray(v.tables) ||
    !Array.isArray(v.uncertainties)
  )
    throw new Error("Hasil pembacaan belum lengkap. Coba lagi.");
  if (
    !v.uncertainties.every((x) => typeof x === "string") ||
    !v.observations.every(
      (x) =>
        x &&
        typeof x.label === "string" &&
        typeof x.value === "string" &&
        (x.unit === null || typeof x.unit === "string") &&
        typeof x.context === "string",
    ) ||
    !v.tables.every(
      (x) =>
        x &&
        typeof x.title === "string" &&
        Array.isArray(x.columns) &&
        x.columns.every((c: unknown) => typeof c === "string") &&
        Array.isArray(x.rows) &&
        x.rows.every(
          (r: unknown) =>
            Array.isArray(r) && r.every((c) => typeof c === "string"),
        ),
    )
  )
    throw new Error("Struktur hasil gambar tidak valid.");
  return {
    text: v.text,
    context: v.context,
    observations: v.observations,
    tables: v.tables,
    uncertainties: v.uncertainties,
  } as Extraction;
}

export function textForAI(extraction: Extraction): string {
  return JSON.stringify({
    ...extraction,
    provenance: "Ekstraksi gambar, perlu verifikasi pengguna",
  });
}
