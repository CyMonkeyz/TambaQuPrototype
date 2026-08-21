import type { DeviceHealthStatus, SensorDevice } from "../../domain/sensor";

export type DeviceFilter = "all" | DeviceHealthStatus;

const healthRank: Record<DeviceHealthStatus, number> = {
  offline: 4,
  maintenance: 3,
  attention: 2,
  healthy: 1,
};

export function getDeviceHealthStatus(device: SensorDevice): DeviceHealthStatus {
  if (device.connectionStatus === "offline") return "offline";
  if (device.healthStatus === "maintenance") return "maintenance";
  if (
    device.connectionStatus === "degraded" ||
    device.batteryPercentage < 30 ||
    device.signalStrength === "poor"
  ) return "attention";
  return device.healthStatus;
}

export function sortDevicesByAttention(devices: SensorDevice[]) {
  return [...devices].sort(
    (a, b) =>
      healthRank[getDeviceHealthStatus(b)] - healthRank[getDeviceHealthStatus(a)] ||
      a.serialNumber.localeCompare(b.serialNumber),
  );
}

export function filterDevices(devices: SensorDevice[], filter: DeviceFilter) {
  return filter === "all"
    ? devices
    : devices.filter((device) => getDeviceHealthStatus(device) === filter);
}

export function daysUntilCalibration(device: SensorDevice, reference: string) {
  return Math.ceil(
    (Date.parse(device.nextCalibrationAt) - Date.parse(reference)) / 86_400_000,
  );
}

export function getSignalLabel(device: SensorDevice) {
  return {
    excellent: "Sangat kuat",
    good: "Baik",
    fair: "Cukup",
    poor: "Lemah",
    none: "Tidak ada",
  }[device.signalStrength];
}
