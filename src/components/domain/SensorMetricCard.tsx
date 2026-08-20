import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CircleGauge,
  Droplets,
  FlaskConical,
  Thermometer,
  Waves,
} from "lucide-react";
import type { TrendCalculation } from "../../domain/monitoring";
import type { SensorParameter } from "../../domain/sensor";
import { getSensorHealth, interpretTrend } from "../../services/monitoring";
import { cn } from "../../utils/cn";
import { formatSensorValue, getSensorMeta } from "../../utils/formatters";

const iconMap = {
  dissolvedOxygen: Droplets,
  ph: CircleGauge,
  temperature: Thermometer,
  salinity: Waves,
  ammonia: FlaskConical,
  nitrite: FlaskConical,
} satisfies Record<SensorParameter, typeof Droplets>;

const healthConfig = {
  normal: {
    label: "Normal",
    className: "text-risk-safe bg-[var(--risk-safe-bg)]",
  },
  attention: {
    label: "Perlu perhatian",
    className: "text-risk-warning bg-[var(--risk-warning-bg)]",
  },
  "high-risk": {
    label: "Risiko tinggi",
    className: "text-risk-critical bg-[var(--risk-critical-bg)]",
  },
};

export function SensorMetricCard({
  parameter,
  value,
  trend,
  selected = false,
  onSelect,
}: {
  parameter: SensorParameter;
  value: number;
  trend: TrendCalculation;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const formatted = formatSensorValue(parameter, value);
  const description = getSensorMeta(parameter).description;
  const health = healthConfig[getSensorHealth(parameter, value)];
  const interpretation = interpretTrend(parameter, trend.direction);
  const TrendIcon =
    trend.direction === "up"
      ? ArrowUp
      : trend.direction === "down"
        ? ArrowDown
        : ArrowRight;
  const Icon = iconMap[parameter];
  const trendValue =
    trend.percentage === null
      ? "Data tren belum cukup"
      : `${Math.abs(trend.percentage).toLocaleString("id-ID", { maximumFractionDigits: 1 })}% · 6 jam`;
  return (
    <button
      type="button"
      className={cn(
        "min-h-[148px] rounded-2xl border bg-surface p-4 text-left shadow-[var(--shadow-card)] transition-[border-color,transform,box-shadow] hover:-translate-y-0.5",
        selected ? "border-primary ring-2 ring-[#bfe9e4]" : "border-border",
      )}
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`Pilih ${formatted.label} untuk grafik`}
      title={`${formatted.label}: ${description}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-surface-muted text-primary">
          <Icon size={18} aria-hidden="true" />
        </span>
        <span
          className={`rounded-full px-2 py-1 text-[10px] font-bold ${health.className}`}
        >
          {health.label}
        </span>
      </div>
      <p className="mt-3 text-xs font-semibold text-foreground-muted">
        {formatted.label}
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-[-.04em]">
        {formatted.value}{" "}
        {formatted.unit && (
          <span className="text-xs font-medium text-foreground-muted">
            {formatted.unit}
          </span>
        )}
      </p>
      <div
        className={cn(
          "mt-2 flex items-center gap-1.5 text-xs font-semibold",
          interpretation.sentiment === "negative"
            ? "text-risk-critical"
            : interpretation.sentiment === "positive"
              ? "text-risk-safe"
              : "text-foreground-muted",
        )}
      >
        <TrendIcon size={14} />
        <span>{interpretation.label}</span>
        <span className="font-normal text-foreground-muted">
          · {trendValue}
        </span>
      </div>
    </button>
  );
}
