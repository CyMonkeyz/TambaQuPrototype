import { describe, expect, it } from "vitest";
import { validateImageData, validateMeasurements } from "./validation";
describe("untrusted input boundaries", () => {
  it("rejects remote image URLs, forged image MIME, and oversized bodies", () => {
    for (const value of [
      "https://127.0.0.1/private",
      "data:image/png;base64,PGh0bWw+",
      "data:image/svg+xml;base64,AAAA",
      "x".repeat(5_600_001),
    ])
      expect(() => validateImageData(value)).toThrow();
  });
  it("recognizes binary PNG signature", () => {
    const data = "data:image/png;base64," + btoa("\x89PNG\r\n\x1a\n");
    expect(validateImageData(data)).toBe(data);
  });
  it("supports partial readings without inventing missing parameters", () => {
    expect(validateMeasurements({ temperature: 29, ph: null })).toEqual({
      temperature: 29,
    });
    expect(validateMeasurements({ dissolvedOxygen: 0 })).toEqual({
      dissolvedOxygen: 0,
    });
  });
  it("rejects empty, NaN, numeric strings, and out-of-range measurements", () => {
    for (const value of [
      {},
      { ph: NaN },
      { ph: "7.8" },
      { ph: 15 },
      { temperature: Infinity },
    ])
      expect(() => validateMeasurements(value)).toThrow();
  });
});
