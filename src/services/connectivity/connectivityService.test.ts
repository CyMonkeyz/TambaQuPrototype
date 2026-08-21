import { beforeEach, describe, expect, it } from "vitest";
import { getEffectiveConnectivity, isDataConnectionAvailable, useConnectivityStore } from "../../store/connectivity-store";

beforeEach(() => {
  useConnectivityStore.setState({ browserOnline: true, demoOverride: "auto", pendingCount: 0, failedCount: 0, syncState: "idle" });
});

describe("application connectivity semantics", () => {
  it("tracks browser online and offline hints", () => {
    expect(getEffectiveConnectivity()).toBe("online");
    useConnectivityStore.getState().setBrowserOnline(false);
    expect(getEffectiveConnectivity()).toBe("offline");
  });

  it("keeps demo connectivity separate from sensor device status", () => {
    useConnectivityStore.getState().setDemoOverride("offline");
    expect(isDataConnectionAvailable()).toBe(false);
    useConnectivityStore.getState().setDemoOverride("degraded");
    expect(getEffectiveConnectivity()).toBe("degraded");
    expect(isDataConnectionAvailable()).toBe(true);
  });

  it("stores pending and partial-failure counts explicitly", () => {
    useConnectivityStore.getState().setSyncCounts(3, 1);
    expect(useConnectivityStore.getState()).toMatchObject({ pendingCount: 3, failedCount: 1 });
  });
});
