import type { DeviceConnectionStatus } from "../../domain/sensor";
import { cn } from "../../utils/cn";

const tones: Record<DeviceConnectionStatus, string> = {
  online: "bg-[var(--status-online)]",
  offline: "bg-[var(--status-offline)]",
  degraded: "bg-[var(--status-degraded)]",
};

export function StatusDot({ status }: { status: DeviceConnectionStatus }) {
  return (
    <span
      className={cn("inline-block size-2 rounded-full", tones[status])}
      aria-hidden="true"
    />
  );
}
