export type DeviceConnectionStatus = "online" | "offline" | "degraded";
export type SensorParameter =
  | "dissolvedOxygen"
  | "ph"
  | "temperature"
  | "salinity"
  | "ammonia"
  | "nitrite";

export interface SensorDevice {
  id: string;
  pondId: string;
  serialNumber: string;
  connectionStatus: DeviceConnectionStatus;
  batteryPercentage: number;
  lastSyncAt: string;
  firmwareVersion: string;
}

export interface SensorReading {
  id: string;
  pondId: string;
  timestamp: string;
  dissolvedOxygen: number;
  ph: number;
  temperature: number;
  salinity: number;
  ammonia: number;
  nitrite: number;
}
