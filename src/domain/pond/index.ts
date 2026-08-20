export type PondOperationalStatus = "active" | "maintenance" | "inactive";

export interface Pond {
  id: string;
  farmId: string;
  name: string;
  code: string;
  areaM2: number;
  cultureDay: number;
  stockingDate: string;
  status: PondOperationalStatus;
  deviceId: string;
}
