import type { SensorParameter } from "../domain/sensor";

const WIB_TIME_ZONE = "Asia/Jakarta";

const sensorMeta: Record<
  SensorParameter,
  {
    label: string;
    shortLabel: string;
    unit: string;
    decimals: number;
    description: string;
  }
> = {
  dissolvedOxygen: {
    label: "Oksigen terlarut",
    shortLabel: "DO",
    unit: "mg/L",
    decimals: 1,
    description: "Kadar oksigen yang terlarut dalam air.",
  },
  ph: {
    label: "pH",
    shortLabel: "pH",
    unit: "",
    decimals: 1,
    description: "Tingkat keasaman atau kebasaan air.",
  },
  temperature: {
    label: "Suhu",
    shortLabel: "Suhu",
    unit: "°C",
    decimals: 1,
    description: "Suhu air pada titik pemantauan sensor.",
  },
  salinity: {
    label: "Salinitas",
    shortLabel: "Salinitas",
    unit: "ppt",
    decimals: 0,
    description: "Kadar garam terlarut dalam air.",
  },
  ammonia: {
    label: "Amonia",
    shortLabel: "NH3",
    unit: "mg/L",
    decimals: 2,
    description: "Indikasi kadar amonia dalam air.",
  },
  nitrite: {
    label: "Nitrit",
    shortLabel: "NO2",
    unit: "mg/L",
    decimals: 2,
    description: "Indikasi kadar nitrit dalam air.",
  },
};

export function getSensorMeta(parameter: SensorParameter) {
  return sensorMeta[parameter];
}

export function formatSensorValue(parameter: SensorParameter, value: number) {
  const meta = sensorMeta[parameter];
  const formatted = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  }).format(value);
  return {
    value: formatted,
    unit: meta.unit,
    label: meta.label,
    shortLabel: meta.shortLabel,
  };
}

export function formatWibTime(timestamp: string) {
  return (
    new Intl.DateTimeFormat("id-ID", {
      timeZone: WIB_TIME_ZONE,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .format(new Date(timestamp))
      .replace(".", ":") + " WIB"
  );
}

export function formatUpdatedAt(timestamp: string) {
  return `Terakhir diperbarui ${formatWibTime(timestamp)}`;
}

export function formatDate(timestamp: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: WIB_TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(timestamp));
}

export function formatRelativeDemoTime(
  timestamp: string,
  reference = "2026-08-20T14:42:00.000Z",
) {
  const minutes = Math.max(
    0,
    Math.round(
      (new Date(reference).getTime() - new Date(timestamp).getTime()) / 60_000,
    ),
  );
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  return `${hours} jam lalu`;
}
