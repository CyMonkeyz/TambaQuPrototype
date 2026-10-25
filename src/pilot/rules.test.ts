import { describe, expect, it } from "vitest";
import { assessWater, parseExtraction, textForAI } from "./rules";
const now = Date.parse("2026-10-22T08:00:00Z");
const healthy = {
  measuredAt: new Date(now).toISOString(),
  quality: "valid",
  dissolvedOxygen: 5,
  ph: 7.8,
  temperature: 29,
};
describe("pilot water assessment", () => {
  it("never labels missing, stale, future, or unverified data safe", () => {
    for (const data of [
      {},
      { ...healthy, dissolvedOxygen: null },
      { ...healthy, measuredAt: new Date(now - 180001).toISOString() },
      { ...healthy, quality: "unverified" },
      { ...healthy, measuredAt: new Date(now + 60001).toISOString() },
    ])
      expect(assessWater(data, now).level).toBe("unknown");
  });
  it("preserves zero as a critical oxygen value", () => {
    expect(assessWater({ ...healthy, dissolvedOxygen: 0 }, now).level).toBe(
      "critical",
    );
  });
  it("explains warning parameters and safe baseline", () => {
    expect(assessWater(healthy, now).level).toBe("safe");
    const warning = assessWater({ ...healthy, ph: 9 }, now);
    expect(warning.level).toBe("warning");
    expect(warning.reasons[0]).toContain("pH");
  });
});
describe("image context fidelity", () => {
  const extraction = {
    text: "Kolam B\nDO 3,2 mg/L",
    context: "Catatan pukul 05.00; DO kolom kedua",
    observations: [
      {
        label: "DO",
        value: "3,2",
        unit: "mg/L",
        context: "Kolam B, pukul 05.00",
      },
    ],
    tables: [
      { title: "Pengukuran", columns: ["Kolam", "DO"], rows: [["B", "3,2"]] },
    ],
    uncertainties: ["Tanggal terpotong"],
  };
  it("retains original numbers, units, table relationships, and uncertainty", () => {
    expect(parseExtraction(extraction)).toEqual(extraction);
    const text = textForAI(extraction);
    for (const word of ["3,2", "mg/L", "Tanggal terpotong", "05.00"])
      expect(text).toContain(word);
  });
  it("rejects incomplete or malformed extraction instead of silently dropping fields", () => {
    for (const value of [
      null,
      {},
      { ...extraction, tables: [{ rows: "invalid" }] },
      { ...extraction, observations: [{ label: "DO", value: 3.2 }] },
    ])
      expect(() => parseExtraction(value)).toThrow();
  });
});
