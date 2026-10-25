import { describe, it, expect } from "vitest";
import {
  validateEntity,
  assessMeasurements,
  feedSummary,
  csv,
  type Entity,
} from "./model";
import { validateTelemetry, validateFeedback } from "./deviceContract";
const row = (data: Record<string, unknown>) =>
  ({
    id: crypto.randomUUID(),
    farm_id: "farm",
    mutation_id: crypto.randomUUID(),
    version: 1,
    created_at: new Date().toISOString(),
    ...data,
  }) as Entity;
describe("proposal-aligned operational rules", () => {
  it("keeps missing and expired data unknown instead of safe", () => {
    expect(assessMeasurements([], []).level).toBe("unknown");
    const rules = ["dissolvedOxygen", "ph", "temperature"].map((parameter) =>
      row({
        parameter,
        minimum: 0,
        maximum: 50,
        critical_minimum: 0,
        critical_maximum: 60,
        max_age_minutes: 3,
      }),
    );
    const readings = rules.map((r) =>
      row({
        parameter: r.parameter,
        value: 5,
        quality: "valid",
        measured_at: new Date(Date.now() - 240000).toISOString(),
      }),
    );
    expect(assessMeasurements(readings, rules).level).toBe("unknown");
  });
  it("reports a confirmed critical parameter even if other inputs are missing", () => {
    const rules = [
      row({
        parameter: "dissolvedOxygen",
        minimum: 4,
        maximum: 8,
        critical_minimum: 3,
        critical_maximum: 12,
        max_age_minutes: 3,
      }),
    ];
    expect(
      assessMeasurements(
        [
          row({
            parameter: "dissolvedOxygen",
            value: 2,
            quality: "valid",
            measured_at: new Date().toISOString(),
          }),
        ],
        rules,
      ).level,
    ).toBe("critical");
  });
  it("rejects impossible values and strips server-owned fields", () => {
    expect(() =>
      validateEntity("measurements", {
        parameter: "ph",
        value: 15,
        source: "manual",
        quality: "valid",
        measured_at: new Date().toISOString(),
        method: "Kit",
      }),
    ).toThrow();
    const clean = validateEntity("actions", {
      title: "Periksa",
      note: "Ukur ulang",
      status: "done",
      farm_id: "other",
      created_by: "other",
      version: 100,
    });
    expect(clean).not.toHaveProperty("farm_id");
    expect(clean).not.toHaveProperty("created_by");
    expect(clean).not.toHaveProperty("version");
  });
  it("rejects inverted thresholds and reversed energy periods", () => {
    expect(() =>
      validateEntity("thresholds", {
        parameter: "ph",
        minimum: 8,
        maximum: 7,
        critical_minimum: 6,
        critical_maximum: 9,
        max_age_minutes: 3,
        reference: "SOP",
      }),
    ).toThrow();
    expect(() =>
      validateEntity("energy", {
        kwh: 1,
        started_at: "2026-10-25",
        ended_at: "2026-10-24",
        meter: "M1",
      }),
    ).toThrow();
  });
  it("keeps shared inventory across cycles but filters planning totals", () => {
    const rows = [
      row({ product: "A", entry_type: "stock_in", quantity_kg: 20 }),
      row({
        product: "A",
        entry_type: "actual",
        quantity_kg: 4,
        cycle_id: "previous",
      }),
      row({
        product: "A",
        entry_type: "actual",
        quantity_kg: 3,
        cycle_id: "current",
      }),
      row({
        product: "A",
        entry_type: "plan",
        quantity_kg: 5,
        cycle_id: "current",
      }),
    ];
    expect(feedSummary(rows, "current")[0]).toEqual({
      product: "A",
      stock: 13,
      planned: 5,
      actual: 3,
      difference: -2,
    });
  });
  it("quotes multiline CSV and neutralizes spreadsheet formulas", () => {
    const out = csv([{ note: '=HYPERLINK("test")', details: "line1\nline2" }]);
    expect(out).toContain('"\'=HYPERLINK(""test"")"');
    expect(out).toContain('"line1\nline2"');
  });
});
describe("firmware contract", () => {
  const packet = () => ({
    schemaVersion: 2,
    messageId: crypto.randomUUID(),
    nodeId: crypto.randomUUID(),
    measuredAt: new Date().toISOString(),
    firmwareVersion: "0.1.0",
    measurements: [
      {
        probeId: crypto.randomUUID(),
        parameter: "dissolvedOxygen",
        value: 0,
        quality: "unverified",
      },
    ],
  });
  it("accepts partial measurements and a real zero", () => {
    expect(validateTelemetry(packet()).measurements[0].value).toBe(0);
  });
  it("rejects duplicate probes, future clocks and invalid quality", () => {
    const p = packet();
    p.measurements.push(p.measurements[0]);
    expect(() => validateTelemetry(p)).toThrow();
    expect(() =>
      validateTelemetry({
        ...packet(),
        measuredAt: new Date(Date.now() + 120000).toISOString(),
      }),
    ).toThrow();
    const q = packet();
    q.measurements[0].quality = "safe";
    expect(() => validateTelemetry(q)).toThrow();
  });
  it("requires feedback before declaring output successful", () => {
    expect(() => validateFeedback("succeeded", {})).toThrow();
    expect(() => validateFeedback("acknowledged", {})).not.toThrow();
    expect(() =>
      validateFeedback("succeeded", {
        outputVerified: true,
        observedState: "on",
      }),
    ).not.toThrow();
  });
});
