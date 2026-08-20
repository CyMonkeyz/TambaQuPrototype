import { AlertTriangle, CheckCircle2, ClockAlert } from "lucide-react";
import type { DataFreshness } from "../../domain/monitoring";
import { cn } from "../../utils/cn";

const config: Record<
  DataFreshness,
  {
    icon: typeof CheckCircle2;
    label: string;
    description: string;
    className: string;
  }
> = {
  fresh: {
    icon: CheckCircle2,
    label: "Data terbaru",
    description: "Sinkronisasi berjalan normal",
    className: "text-risk-safe bg-[var(--risk-safe-bg)]",
  },
  stale: {
    icon: AlertTriangle,
    label: "Data mulai tertunda",
    description: "Pantau waktu sinkronisasi",
    className: "text-risk-warning bg-[var(--risk-warning-bg)]",
  },
  old: {
    icon: ClockAlert,
    label: "Data mungkin tidak terbaru",
    description: "Menampilkan data terakhir",
    className: "text-risk-critical bg-[var(--risk-critical-bg)]",
  },
};

export function FreshnessIndicator({
  state,
  minutesAgo,
  compact = false,
}: {
  state: DataFreshness;
  minutesAgo: number;
  compact?: boolean;
}) {
  const item = config[state];
  const Icon = item.icon;
  const timeLabel = minutesAgo < 1 ? "baru saja" : `${minutesAgo} menit lalu`;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-3 py-2",
        item.className,
      )}
    >
      <Icon size={16} aria-hidden="true" />
      <div>
        <p className="text-xs font-bold">{item.label}</p>
        {!compact && (
          <p className="mt-0.5 text-[11px] opacity-80">
            {item.description} · {timeLabel}
          </p>
        )}
      </div>
    </div>
  );
}
