import { parameters } from "./model.ts";
export const deviceTypes = {
  pond_hub: ["gateway"],
  sensor_node: ["telemetry"],
  aqua_weather: ["weather"],
  aero_pilot: ["aerator"],
  pond_guard: ["guard"],
} as const;
export const isUuid = (v: unknown): v is string =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v,
  );
export interface TelemetryV2 {
  schemaVersion: 2;
  messageId: string;
  nodeId: string;
  measuredAt: string;
  firmwareVersion: string;
  measurements: {
    probeId: string;
    calibrationId?: string;
    parameter: keyof typeof parameters;
    value: number;
    quality: "valid" | "unverified" | "invalid";
  }[];
}
export function validateTelemetry(p: unknown, now = Date.now()): TelemetryV2 {
  const v = p as TelemetryV2;
  if (
    !v ||
    v.schemaVersion !== 2 ||
    !isUuid(v.messageId) ||
    !isUuid(v.nodeId) ||
    typeof v.firmwareVersion !== "string" ||
    !v.firmwareVersion.length ||
    v.firmwareVersion.length > 80
  )
    throw new Error("Identitas telemetry v2 tidak valid.");
  const age = now - Date.parse(v.measuredAt);
  if (!Number.isFinite(age) || age < -60000 || age > 7 * 86400000)
    throw new Error("Waktu pengukuran tidak valid.");
  if (
    !Array.isArray(v.measurements) ||
    !v.measurements.length ||
    v.measurements.length > 10
  )
    throw new Error("Isi 1–10 pengukuran.");
  const seen = new Set<string>();
  for (const m of v.measurements) {
    const meta = parameters[m.parameter];
    if (
      !meta ||
      !isUuid(m.probeId) ||
      (m.calibrationId && !isUuid(m.calibrationId)) ||
      typeof m.value !== "number" ||
      !Number.isFinite(m.value) ||
      m.value < meta.min ||
      m.value > meta.max ||
      !["valid", "unverified", "invalid"].includes(m.quality) ||
      seen.has(m.probeId)
    )
      throw new Error("Nilai, kualitas atau probe tidak valid.");
    seen.add(m.probeId);
  }
  return v;
}
export function validateFeedback(status: unknown, feedback: unknown) {
  if (!["acknowledged", "succeeded", "failed"].includes(String(status)))
    throw new Error("Status perintah tidak valid.");
  if (status === "succeeded") {
    const f = feedback as Record<string, unknown>;
    if (
      !f ||
      f.outputVerified !== true ||
      typeof f.observedState !== "string" ||
      !["on", "off"].includes(f.observedState)
    )
      throw new Error("Keberhasilan memerlukan umpan balik keluaran.");
  }
}
