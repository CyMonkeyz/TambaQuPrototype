import type { LucideIcon } from "lucide-react";
import type { SensorParameter } from "../../domain/sensor";
import { formatSensorValue } from "../../utils/formatters";

export function SensorMetric({
  parameter,
  value,
  icon: Icon,
}: {
  parameter: SensorParameter;
  value: number;
  icon?: LucideIcon;
}) {
  const formatted = formatSensorValue(parameter, value);
  return (
    <div className="rounded-xl bg-surface-muted p-3.5">
      <div className="flex items-center gap-2 text-xs font-medium text-foreground-muted">
        {Icon && <Icon size={15} aria-hidden="true" />}
        {formatted.shortLabel}
      </div>
      <p className="mt-2 text-xl font-semibold tracking-[-.03em]">
        {formatted.value}{" "}
        {formatted.unit && (
          <span className="text-xs font-medium text-foreground-muted">
            {formatted.unit}
          </span>
        )}
      </p>
    </div>
  );
}
