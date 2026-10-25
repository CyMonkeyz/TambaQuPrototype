import { useState, useEffect } from "react";
import { Activity, ArrowRight, Droplets, Thermometer } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { SensorMetricCard } from "../components/domain/SensorMetricCard";
import { parameters, labelFor, assessMeasurements, type Entity } from "./model";
export function Trend({
  rows,
  parameter,
}: {
  rows: Entity[];
  parameter: keyof typeof parameters;
}) {
  const series = rows
    .filter(
      (r) =>
        r.parameter === parameter &&
        Number.isFinite(Date.parse(String(r.measured_at))),
    )
    .sort((a, b) => String(a.measured_at).localeCompare(String(b.measured_at)));
  const valid = series.filter(
    (r) => r.quality === "valid" && Number.isFinite(Number(r.value)),
  );
  const values = valid.map((r) => Number(r.value));
  const lo = Math.min(...values),
    hi = Math.max(...values),
    span = hi - lo || 1;
  const start = Date.parse(String(series[0]?.measured_at)),
    duration = Date.parse(String(series.at(-1)?.measured_at)) - start || 1;
  const segments: string[][] = [[]];
  for (const r of series) {
    if (r.quality !== "valid" || !Number.isFinite(Number(r.value))) {
      segments.push([]);
      continue;
    }
    segments
      .at(-1)!
      .push(
        `${40 + ((Date.parse(String(r.measured_at)) - start) / duration) * 500},${180 - ((Number(r.value) - lo) / span) * 140}`,
      );
  }
  return (
    <div className="mt-5 rounded-xl bg-[#f8fbfd] p-3">
      {valid.length < 2 ? (
        <p className="py-14 text-center text-sm text-foreground-muted">
          Grafik akan muncul setelah dua pengukuran valid.
        </p>
      ) : (
        <svg
          viewBox="0 0 580 225"
          className="w-full"
          role="img"
          aria-label={`Grafik ${labelFor(parameter)}: ${values[0]} menjadi ${values.at(-1)} ${parameters[parameter].unit}`}
        >
          <line x1="40" y1="190" x2="550" y2="190" stroke="#c8dce4" />
          <line
            x1="40"
            y1="40"
            x2="550"
            y2="40"
            stroke="#e0eaf0"
            strokeDasharray="4 5"
          />
          {segments.map((segment, index) => (
            <polyline
              key={index}
              points={segment.join(" ")}
              fill="none"
              stroke="#0B6E8E"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          ))}
          <text x="4" y="45" fontSize="11" fill="#55717A">
            {hi.toLocaleString("id-ID")}
          </text>
          <text x="4" y="185" fontSize="11" fill="#55717A">
            {lo.toLocaleString("id-ID")}
          </text>
          <text x="40" y="215" fontSize="10" fill="#55717A">
            {new Date(String(series[0].measured_at)).toLocaleString("id-ID", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </text>
          <text x="550" y="215" textAnchor="end" fontSize="10" fill="#55717A">
            {new Date(String(series.at(-1)?.measured_at)).toLocaleString(
              "id-ID",
              {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              },
            )}
          </text>
        </svg>
      )}
    </div>
  );
}
export function MeasurementView({
  measurements,
  rules,
  brainHref,
}: {
  measurements: Entity[];
  rules: Entity[];
  brainHref: string;
}) {
  const [parameter, setParameter] =
    useState<keyof typeof parameters>("dissolvedOxygen");
  const [hours, setHours] = useState(24);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) setNow(Date.now());
    }, 60000);
    return () => clearInterval(timer);
  }, []);
  const assessment = assessMeasurements(measurements, rules, now);
  const core = ["dissolvedOxygen", "ph", "temperature"] as const;
  const latest = (key: string) =>
    measurements
      .filter((r) => r.parameter === key)
      .sort((a, b) =>
        String(b.measured_at).localeCompare(String(a.measured_at)),
      )[0];
  const tile = (key: keyof typeof parameters) => {
    const r = latest(key);
    const meta = parameters[key];
    if (core.includes(key as (typeof core)[number])) {
      const rule = rules
        .filter((row) => row.parameter === key)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
      const samples = measurements
        .filter(
          (row) =>
            row.parameter === key &&
            row.quality === "valid" &&
            Date.parse(String(row.measured_at)) >= now - 6 * 3600000,
        )
        .sort((a, b) =>
          String(a.measured_at).localeCompare(String(b.measured_at)),
        );
      const first = Number(samples[0]?.value),
        last = Number(samples.at(-1)?.value),
        delta = last - first;
      const percentage =
        samples.length > 1 && first !== 0
          ? (delta / Math.abs(first)) * 100
          : null;
      const label = !r
        ? "Belum diukur"
        : !rule
          ? "Atur acuan"
          : r.quality !== "valid" ||
              now - Date.parse(String(r.measured_at)) >
                Number(rule.max_age_minutes) * 60000
            ? "Periksa data"
            : Number(r.value) < Number(rule.minimum) ||
                Number(r.value) > Number(rule.maximum)
              ? "Perlu perhatian"
              : "Dalam acuan";
      return (
        <SensorMetricCard
          key={key}
          parameter={key as (typeof core)[number]}
          value={r ? Number(r.value) : null}
          trend={{
            direction: delta > 0 ? "up" : delta < 0 ? "down" : "stable",
            percentage,
            absoluteChange: Number.isFinite(delta) ? delta : 0,
            hasEnoughData: samples.length > 1,
          }}
          assessmentLabel={label}
          sourceLabel={
            r
              ? `${labelFor(String(r.source))} · ${labelFor(String(r.quality))}`
              : "Belum ada pengukuran"
          }
          measuredAt={r ? String(r.measured_at) : undefined}
          selected={parameter === key}
          onSelect={() => setParameter(key)}
        />
      );
    }
    const Icon =
      key === "temperature" ? Thermometer : key === "ph" ? Activity : Droplets;
    return (
      <button
        key={key}
        aria-pressed={parameter === key}
        onClick={() => setParameter(key)}
        className={`measurement-tile rounded-2xl border bg-white p-5 text-left ${parameter === key ? "border-primary ring-2 ring-primary/15" : "border-border"}`}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground-muted">
          <Icon size={18} className="text-primary" />
          {meta.label}
        </span>
        <span className="my-4 block text-3xl font-semibold text-[#083F55]">
          {r
            ? Number(r.value).toLocaleString("id-ID", {
                maximumFractionDigits: 2,
              })
            : "—"}{" "}
          <span className="text-xs font-normal">{r ? meta.unit : ""}</span>
        </span>
        <span className="block text-xs text-foreground-muted">
          {r
            ? `${labelFor(String(r.source))} · ${labelFor(String(r.quality))}`
            : "Belum diukur"}
        </span>
        {r && (
          <time className="mt-1 block text-xs text-foreground-muted">
            {new Date(String(r.measured_at)).toLocaleString("id-ID")}
          </time>
        )}
      </button>
    );
  };
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">{core.map(tile)}</div>
      <details className="rounded-xl border border-border bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold">
          Hasil uji tambahan
        </summary>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(Object.keys(parameters) as (keyof typeof parameters)[])
            .filter((k) => !core.includes(k as (typeof core)[number]))
            .map(tile)}
        </div>
      </details>
      <div className="grid items-start gap-5 xl:grid-cols-[1.7fr_1fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-primary">
                RIWAYAT PENGUKURAN
              </p>
              <h2 className="mt-2 text-lg font-semibold">
                {labelFor(parameter)}{" "}
                <span className="text-sm font-normal text-foreground-muted">
                  {parameters[parameter].unit}
                </span>
              </h2>
            </div>
            <select
              aria-label="Rentang grafik"
              className="min-h-11 rounded-lg border border-border bg-white px-3 text-sm"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
            >
              <option value={6}>6 jam</option>
              <option value={24}>24 jam</option>
              <option value={168}>7 hari</option>
            </select>
          </div>
          <Trend
            parameter={parameter}
            rows={measurements.filter(
              (r) => Date.parse(String(r.measured_at)) >= now - hours * 3600000,
            )}
          />
          <p className="mt-3 text-xs text-foreground-muted">
            Titik grafik memakai hasil valid. Data hilang tidak diganti angka
            nol.
          </p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Activity size={20} /> PondBrain
          </div>
          <h2 className="my-4 text-xl font-semibold">{assessment.title}</h2>
          <p className="text-sm leading-6 text-foreground-muted">
            {assessment.reasons[0]}
          </p>
          <Link
            className="mt-5 inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-primary"
            to={brainHref}
          >
            Lihat analisis <ArrowRight size={16} />
          </Link>
        </Card>
      </div>
    </div>
  );
}
