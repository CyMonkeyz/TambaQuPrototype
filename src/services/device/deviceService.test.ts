import { describe, expect, it } from "vitest";
import { demoDevices } from "../../data/mock/fixtures";
import { filterDevices, getDeviceHealthStatus, sortDevicesByAttention } from "./deviceService";

describe("device health helpers", () => {
  it("gives offline connectivity the highest health precedence", () => {
    expect(getDeviceHealthStatus(demoDevices[3])).toBe("offline");
  });

  it("sorts attention-worthy devices before healthy ones", () => {
    expect(getDeviceHealthStatus(sortDevicesByAttention(demoDevices)[0])).toBe("offline");
  });

  it("filters by derived health", () => {
    expect(filterDevices(demoDevices, "attention").map((item) => item.id)).toEqual(["device-b"]);
  });
});
