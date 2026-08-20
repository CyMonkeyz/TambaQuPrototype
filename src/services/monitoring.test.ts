import { describe, expect, it } from "vitest";
import type { PondMonitoringOverview } from "../domain/monitoring";
import {
  calculateTrend,
  getDataFreshness,
  getFarmRiskSummary,
  sortPondMonitoring,
} from "./monitoring";

function pondItem(
  id: string,
  name: string,
  score: number,
  level: "safe" | "warning" | "critical",
  sync = "2026-08-20T14:42:00.000Z",
) {
  return {
    pond: {
      id,
      farmId: "farm",
      name,
      code: id,
      areaM2: 1000,
      cultureDay: 43,
      stockingDate: "2026-07-09",
      status: "active",
      deviceId: `device-${id}`,
    },
    risk: {
      id: `risk-${id}`,
      pondId: id,
      timestamp: sync,
      score,
      level,
      confidence: 0.8,
      contributors: [],
      summary: "",
    },
    reading: {
      id: `reading-${id}`,
      pondId: id,
      timestamp: sync,
      dissolvedOxygen: 5,
      ph: 8,
      temperature: 29,
      salinity: 19,
      ammonia: 0.03,
      nitrite: 0.02,
    },
    history: [],
    recommendations: [],
    actions: [],
    device: {
      id: `device-${id}`,
      pondId: id,
      serialNumber: id,
      connectionStatus: "online",
      batteryPercentage: 80,
      lastSyncAt: sync,
      firmwareVersion: "1",
    },
  } satisfies PondMonitoringOverview;
}

describe("monitoring domain helpers", () => {
  it("calculates a deterministic trend and handles a zero baseline", () => {
    const result = calculateTrend([4.8, 4.5, 4.2], 2);
    expect(result).toMatchObject({ direction: "down", hasEnoughData: true });
    expect(result.absoluteChange).toBeCloseTo(-0.6);
    expect(calculateTrend([0, 1], 1).percentage).toBeNull();
    expect(calculateTrend([4.2], 6).hasEnoughData).toBe(false);
  });

  it("classifies freshness using demo UX thresholds", () => {
    const reference = "2026-08-20T14:42:00.000Z";
    expect(getDataFreshness("2026-08-20T14:39:00.000Z", reference).state).toBe(
      "fresh",
    );
    expect(getDataFreshness("2026-08-20T14:24:00.000Z", reference).state).toBe(
      "stale",
    );
    expect(getDataFreshness("2026-08-20T13:42:00.000Z", reference).state).toBe(
      "old",
    );
  });

  it("derives farm risk counts and highest-priority pond", () => {
    const ponds = [
      pondItem("a", "Kolam A", 22, "safe"),
      pondItem("b", "Kolam B", 67, "warning"),
      pondItem("c", "Kolam C", 84, "critical"),
    ];
    expect(getFarmRiskSummary(ponds)).toMatchObject({
      safe: 1,
      warning: 1,
      critical: 1,
      total: 3,
      highestRiskPond: ponds[2],
    });
  });

  it("sorts ponds by risk, name, or latest update", () => {
    const safe = pondItem(
      "a",
      "Kolam A",
      22,
      "safe",
      "2026-08-20T14:40:00.000Z",
    );
    const critical = pondItem(
      "c",
      "Kolam C",
      84,
      "critical",
      "2026-08-20T14:39:00.000Z",
    );
    expect(sortPondMonitoring([safe, critical], "risk")[0].pond.id).toBe("c");
    expect(sortPondMonitoring([critical, safe], "name")[0].pond.id).toBe("a");
    expect(sortPondMonitoring([critical, safe], "updated")[0].pond.id).toBe(
      "a",
    );
  });
});
