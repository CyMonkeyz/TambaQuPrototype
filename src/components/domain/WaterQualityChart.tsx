import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonitoringRange } from "../../domain/monitoring";
import { RANGE_HOURS, SENSOR_PARAMETERS } from "../../domain/monitoring";
import type { SensorParameter, SensorReading } from "../../domain/sensor";
import { calculateTrend, interpretTrend } from "../../services/monitoring";
import { cn } from "../../utils/cn";
import {
  formatSensorValue,
  formatWibTime,
  getSensorMeta,
} from "../../utils/formatters";

const rangeLabels: Record<MonitoringRange, string> = {
  "6h": "6 Jam",
  "24h": "24 Jam",
  "7d": "7 Hari",
};

function formatAxisTime(timestamp: string, range: MonitoringRange) {
  return new Intl.DateTimeFormat(
    "id-ID",
    range === "7d"
      ? { timeZone: "Asia/Jakarta", day: "numeric", month: "short" }
      : {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        },
  )
    .format(new Date(timestamp))
    .replace(".", ":");
}

export default function WaterQualityChart({
  history,
  parameter,
  range,
  onParameterChange,
  onRangeChange,
}: {
  history: SensorReading[];
  parameter: SensorParameter;
  range: MonitoringRange;
  onParameterChange: (parameter: SensorParameter) => void;
  onRangeChange: (range: MonitoringRange) => void;
}) {
  const meta = getSensorMeta(parameter);
  const chartData = useMemo(
    () =>
      history.slice(-(RANGE_HOURS[range] + 1)).map((reading) => ({
        timestamp: reading.timestamp,
        value: reading[parameter],
      })),
    [history, parameter, range],
  );
  const trend = useMemo(
    () =>
      calculateTrend(
        chartData.map((item) => item.value),
        Math.min(6, chartData.length - 1),
      ),
    [chartData],
  );
  const interpretation = interpretTrend(parameter, trend.direction);
  const latest = chartData.at(-1)?.value ?? 0;
  const latestFormatted = formatSensorValue(parameter, latest);
  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold text-primary">
            Riwayat Kualitas Air
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            {meta.label} · {rangeLabels[range]}
          </h2>
          <p className="mt-1 text-sm text-foreground-muted">
            Nilai terbaru{" "}
            <strong className="text-foreground">
              {latestFormatted.value} {latestFormatted.unit}
            </strong>{" "}
            · {interpretation.label}
          </p>
        </div>
        <div
          className="inline-flex w-fit rounded-xl bg-surface-muted p-1"
          role="group"
          aria-label="Pilih rentang waktu"
        >
          {(Object.keys(rangeLabels) as MonitoringRange[]).map((item) => (
            <button
              key={item}
              className={cn(
                "min-h-11 rounded-lg px-3 text-xs font-semibold",
                range === item
                  ? "bg-white text-primary shadow-sm"
                  : "text-foreground-muted",
              )}
              onClick={() => onRangeChange(item)}
            >
              {rangeLabels[item]}
            </button>
          ))}
        </div>
      </div>
      <div
        className="mt-4 flex gap-1 overflow-x-auto pb-1"
        role="group"
        aria-label="Pilih parameter grafik"
      >
        {SENSOR_PARAMETERS.map((item) => (
          <button
            key={item}
            className={cn(
              "min-h-11 shrink-0 rounded-lg px-3 text-xs font-semibold",
              parameter === item
                ? "bg-primary text-white"
                : "bg-surface-muted text-foreground-muted",
            )}
            onClick={() => onParameterChange(item)}
          >
            {getSensorMeta(item).shortLabel}
          </button>
        ))}
      </div>
      <div
        className="mt-4 h-[230px] w-full sm:h-[270px]"
        role="img"
        aria-label={`Grafik ${meta.label} selama ${rangeLabels[range]}`}
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
          >
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="4 4"
              vertical={false}
            />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value) => formatAxisTime(String(value), range)}
              tick={{ fill: "var(--foreground-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              minTickGap={28}
            />
            <YAxis
              tick={{ fill: "var(--foreground-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={["auto", "auto"]}
            />
            <ChartTooltip
              labelFormatter={(value) => `${formatWibTime(String(value))}`}
              formatter={(value) => [
                `${formatSensorValue(parameter, Number(value)).value} ${meta.unit}`,
                meta.label,
              ]}
              contentStyle={{
                borderColor: "var(--border)",
                borderRadius: 12,
                boxShadow: "var(--shadow-card)",
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--primary)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: "var(--primary)" }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs leading-5 text-foreground-muted">
        Grafik memiliki ringkasan tekstual di atas. Status dan interpretasi
        menggunakan konfigurasi demo TambaQu, bukan ambang biologis universal.
      </p>
    </div>
  );
}
