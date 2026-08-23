import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonitoringRange } from "../../domain/monitoring";
import type { RiskTrendPoint } from "../../domain/risk";
import { formatWibTime } from "../../utils/formatters";

const ranges: Array<{ value: MonitoringRange; label: string }> = [
  { value: "6h", label: "6 Jam" },
  { value: "24h", label: "24 Jam" },
  { value: "7d", label: "7 Hari" },
];

export function RiskTrendChart({
  points,
  range,
  onRangeChange,
}: {
  points: RiskTrendPoint[];
  range: MonitoringRange;
  onRangeChange: (range: MonitoringRange) => void;
}) {
  const start = points[0]?.score ?? 0;
  const end = points.at(-1)?.score ?? 0;
  return (
    <section aria-labelledby="risk-trend-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.12em] text-primary">
            Perubahan skor
          </p>
          <h2 id="risk-trend-title" className="mt-1 text-lg font-semibold">
            Tren Risiko · {ranges.find((item) => item.value === range)?.label}
          </h2>
        </div>
        <div
          className="flex rounded-xl bg-surface-muted p-1"
          aria-label="Rentang tren risiko"
        >
          {ranges.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`min-h-11 rounded-lg px-3 text-xs font-semibold ${range === item.value ? "bg-surface text-primary shadow-sm" : "text-foreground-muted"}`}
              aria-pressed={range === item.value}
              onClick={() => onRangeChange(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div
        className="mt-5 h-44 w-full min-w-0"
        role="img"
        aria-label={`Grafik skor risiko dari ${start} menjadi ${end}`}
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart
            data={points}
            margin={{ top: 5, right: 8, left: -22, bottom: 0 }}
          >
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value) =>
                formatWibTime(value).replace(" WIB", "")
              }
              tick={{ fontSize: 11 }}
              minTickGap={20}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 40, 70, 100]}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              labelFormatter={(value) => formatWibTime(String(value))}
              formatter={(value) => [`${value}/100`, "Skor Risiko"]}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="var(--primary)"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs leading-5 text-foreground-muted">
        Skor risiko berubah dari {start} menjadi {end}. Grafik memakai aturan
        demo dan riwayat data yang sama dengan halaman pemantauan.
      </p>
    </section>
  );
}
