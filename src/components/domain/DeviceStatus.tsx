import { BatteryMedium, RadioTower, RefreshCw, Cpu } from "lucide-react";
import type { SensorDevice } from "../../domain/sensor";
import { getDataFreshness } from "../../services/monitoring";
import { formatRelativeDemoTime, formatWibTime } from "../../utils/formatters";
import { StatusBadge } from "../ui/StatusBadge";

export function DeviceStatus({
  device,
  referenceTimestamp,
  detailed = false,
}: {
  device: SensorDevice;
  referenceTimestamp?: string;
  detailed?: boolean;
}) {
  const freshness = referenceTimestamp
    ? getDataFreshness(device.lastSyncAt, referenceTimestamp)
    : null;
  const connectionCopy =
    device.connectionStatus === "online"
      ? "Data terkirim normal"
      : device.connectionStatus === "degraded"
        ? "Sinkronisasi mungkin terlambat"
        : "Menampilkan data terakhir";
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-surface-muted text-primary">
            <RadioTower size={19} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold">{device.serialNumber}</p>
            <p className="mt-0.5 text-xs text-foreground-muted">
              {connectionCopy}
            </p>
          </div>
        </div>
        <StatusBadge status={device.connectionStatus} />
      </div>
      {detailed && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-surface-muted p-3">
            <span className="flex items-center gap-1.5 text-xs text-foreground-muted">
              <BatteryMedium size={15} />
              Baterai
            </span>
            <strong className="mt-2 block">{device.batteryPercentage}%</strong>
          </div>
          <div className="rounded-xl bg-surface-muted p-3">
            <span className="flex items-center gap-1.5 text-xs text-foreground-muted">
              <RefreshCw size={15} />
              Sinkron terakhir
            </span>
            <strong className="mt-2 block text-sm">
              {formatWibTime(device.lastSyncAt)}
            </strong>
          </div>
          <div className="rounded-xl bg-surface-muted p-3">
            <span className="flex items-center gap-1.5 text-xs text-foreground-muted">
              <Cpu size={15} />
              Firmware
            </span>
            <strong className="mt-2 block text-sm">
              v{device.firmwareVersion}
            </strong>
          </div>
        </div>
      )}
      <p className="mt-3 text-xs text-foreground-muted">
        Sinkron {formatRelativeDemoTime(device.lastSyncAt, referenceTimestamp)}
        {freshness?.state === "old" ? " · data mungkin tidak terbaru" : ""} ·
        Mode Demo
      </p>
    </div>
  );
}
