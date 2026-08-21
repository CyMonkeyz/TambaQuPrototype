import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Waves,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FarmMonitoringData, PondMonitoringOverview } from "../../domain/monitoring";
import type { Farm } from "../../domain/farm";
import type { User } from "../../domain/user";
import { getFarmRiskSummary } from "../../services/monitoring";
import { getPendingRecommendations } from "../../services/selectors";
import { useSimulationStore } from "../../store/simulation-store";
import { formatWibTime } from "../../utils/formatters";
import { Card } from "../ui/Card";
import { RiskBadge } from "../ui/RiskBadge";
import { StatusBadge } from "../ui/StatusBadge";

type SortKey = "risk" | "name" | "sync" | "do";

const lineColors: Record<string, string> = {
  "pond-a": "#90aaa7",
  "pond-b": "#087f74",
  "pond-c": "#b23a3a",
  "pond-d": "#bdc9c7",
};

function KpiCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Waves;
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <Card className="p-4 shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-foreground-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
          <p className="mt-1 text-xs text-foreground-muted">{detail}</p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-muted text-primary">
          <Icon size={18} aria-hidden="true" />
        </span>
      </div>
    </Card>
  );
}

function buildFarmTrend(ponds: PondMonitoringOverview[]) {
  const timestamps = ponds[0]?.history.slice(-12).map((item) => item.timestamp) ?? [];
  return timestamps.map((timestamp, index) => {
    const point: Record<string, string | number> = {
      time: new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      })
        .format(new Date(timestamp))
        .replace(".", ":"),
    };
    ponds.forEach((item) => {
      const samples = item.history.slice(-12);
      const reading = samples[index] ?? samples.at(-1);
      const latest = samples.at(-1);
      if (!reading || !latest) return;
      const doDelta = (latest.dissolvedOxygen - reading.dissolvedOxygen) * 7;
      const ammoniaDelta = (reading.ammonia - latest.ammonia) * 55;
      point[item.pond.id] = Math.max(
        0,
        Math.min(100, Math.round(item.risk.score - doDelta - ammoniaDelta)),
      );
    });
    return point;
  });
}

function comparePonds(a: PondMonitoringOverview, b: PondMonitoringOverview, sort: SortKey) {
  if (sort === "name") return a.pond.name.localeCompare(b.pond.name, "id-ID");
  if (sort === "sync") return Date.parse(b.device.lastSyncAt) - Date.parse(a.device.lastSyncAt);
  if (sort === "do") return a.reading.dissolvedOxygen - b.reading.dissolvedOxygen;
  return b.risk.score - a.risk.score;
}

export function OperationsDashboard({
  data,
  farm,
  user,
}: {
  data: FarmMonitoringData;
  farm: Farm | null;
  user: User | null;
}) {
  const [sort, setSort] = useState<SortKey>("risk");
  const simulationStatus = useSimulationStore((state) => state.status);
  const summary = getFarmRiskSummary(data.ponds);
  const activeAlerts = data.alerts
    .filter((alert) => alert.status !== "resolved")
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  const actions = data.ponds
    .flatMap((item) => item.actions.map((action) => ({ ...action, pond: item.pond })))
    .sort((a, b) => Date.parse(b.performedAt) - Date.parse(a.performedAt));
  const pending = data.ponds.reduce(
    (total, item) => total + getPendingRecommendations(item.recommendations, item.actions).length,
    0,
  );
  const healthyDevices = data.ponds.filter(
    (item) => item.device.healthStatus === "healthy" && item.device.connectionStatus === "online",
  ).length;
  const sortedPonds = useMemo(
    () => [...data.ponds].sort((a, b) => comparePonds(a, b, sort)),
    [data.ponds, sort],
  );
  const trend = useMemo(() => buildFarmTrend(data.ponds), [data.ponds]);
  const attention = [...data.ponds].sort((a, b) => b.risk.score - a.risk.score).slice(0, 3);
  const latestSync = Math.max(...data.ponds.map((item) => Date.parse(item.device.lastSyncAt)));

  return (
    <div className="space-y-5">
      <section className="flex items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-primary">Ringkasan Operasional</p>
            <span className="rounded-full bg-[#dff3f0] px-2.5 py-1 text-[11px] font-semibold text-primary">
              Demo · {simulationStatus}
            </span>
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-.04em]">{farm?.name}</h1>
          <p className="mt-2 text-sm text-foreground-muted">
            {farm?.location} · {summary.total} kolam aktif · Operator {user?.name ?? "Andi Setiawan"}
          </p>
        </div>
        <div className="text-right text-xs text-foreground-muted">
          <p className="inline-flex items-center gap-2 font-semibold text-[var(--status-online)]">
            <span className="size-2 rounded-full bg-[var(--status-online)]" /> Sistem online
          </p>
          <p className="mt-1">Sinkron terakhir {formatWibTime(new Date(latestSync).toISOString())}</p>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3 xl:grid-cols-6" aria-label="Ringkasan KPI tambak">
        <KpiCard icon={Waves} label="Kolam Aktif" value={summary.total} detail="Satu area pemeliharaan" />
        <KpiCard icon={ShieldCheck} label="Aman" value={summary.safe} detail="Risiko operasional rendah" />
        <KpiCard icon={Activity} label="Waspada" value={summary.warning} detail="Perlu pemantauan" />
        <KpiCard icon={AlertTriangle} label="Kritis" value={summary.critical} detail="Prioritas segera" />
        <KpiCard icon={AlertTriangle} label="Peringatan Aktif" value={activeAlerts.length} detail="Belum diselesaikan" />
        <KpiCard icon={CheckCircle2} label="Tindakan Tertunda" value={pending} detail={`${actions.length} tindakan tercatat`} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-semibold">Operasional Kolam</h2>
              <p className="mt-1 text-xs text-foreground-muted">Satu tabel untuk memindai risiko, sensor, dan prioritas.</p>
            </div>
            <Link to="/app/ponds" className="inline-flex items-center gap-1 text-xs font-semibold text-primary">Semua kolam <ArrowRight size={14} /></Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-surface-muted text-xs text-foreground-muted">
                <tr>
                  {[
                    ["name", "Kolam"], ["risk", "Risiko"], ["do", "DO"],
                  ].map(([key, label]) => (
                    <th key={key} scope="col" className="px-4 py-3 font-semibold">
                      <button className="hover:text-foreground" onClick={() => setSort(key as SortKey)}>{label}{sort === key ? " ↓" : ""}</button>
                    </th>
                  ))}
                  <th scope="col" className="px-4 py-3 font-semibold">pH</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Suhu</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Amonia</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Perangkat</th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    <button className="hover:text-foreground" onClick={() => setSort("sync")}>Sinkron{sort === "sync" ? " ↓" : ""}</button>
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">Tindakan Tertunda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedPonds.map((item) => {
                  return (
                    <tr key={item.pond.id} className="hover:bg-[#f9fcfb]">
                      <td className="px-4 py-3"><Link className="font-semibold hover:text-primary" to={`/app/ponds/${item.pond.id}`}>{item.pond.name}</Link><p className="mt-0.5 text-[11px] text-foreground-muted">Hari ke-{item.pond.cultureDay}</p></td>
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><span className="font-semibold tabular-nums">{item.risk.score}</span><RiskBadge level={item.risk.level} /></div></td>
                      <td className="px-4 py-3 font-medium tabular-nums">{item.reading.dissolvedOxygen.toFixed(1)} mg/L</td>
                      <td className="px-4 py-3 font-medium tabular-nums">{item.reading.ph.toFixed(1)}</td>
                      <td className="px-4 py-3 font-medium tabular-nums">{item.reading.temperature.toFixed(1)} °C</td>
                      <td className="px-4 py-3 font-medium tabular-nums">{item.reading.ammonia.toFixed(2)} mg/L</td>
                      <td className="px-4 py-3"><StatusBadge status={item.device.connectionStatus} /></td>
                      <td className="px-4 py-3 text-xs text-foreground-muted">{formatWibTime(item.device.lastSyncAt)}</td>
                      <td className="px-4 py-3"><Link className="font-semibold text-primary" to={`/app/pondbrain?pond=${item.pond.id}`}>{getPendingRecommendations(item.recommendations, item.actions).length}</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div><h2 className="font-semibold">Butuh Perhatian</h2><p className="mt-1 text-xs text-foreground-muted">Prioritas PondBrain lintas kolam</p></div>
            <ShieldCheck className="text-primary" size={20} />
          </div>
          <div className="mt-4 space-y-3">
            {attention.map((item, index) => {
              const recommendations = getPendingRecommendations(item.recommendations, item.actions);
              return (
              <div key={item.pond.id} className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded-lg bg-surface-muted text-xs font-semibold">{index + 1}</span><p className="text-sm font-semibold">{item.pond.name}</p></div><RiskBadge level={item.risk.level} /></div>
                <p className="mt-2 text-xs font-semibold">{recommendations[0]?.title ?? "Monitoring rutin"}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-foreground-muted">DO {item.reading.dissolvedOxygen.toFixed(1)} mg/L · Amonia {item.reading.ammonia.toFixed(2)} mg/L · {recommendations.length} tindakan prioritas</p>
                <Link to={`/app/pondbrain?pond=${item.pond.id}`} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">Buka PondBrain <ArrowRight size={13} /></Link>
              </div>
            )})}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
        <Card className="p-5">
          <div className="flex items-start justify-between"><div><h2 className="font-semibold">Tren Risiko Tambak</h2><p className="mt-1 text-xs text-foreground-muted">Perbandingan indikator risiko 12 titik terbaru. Kolam B dan C disorot.</p></div><span className="text-xs text-foreground-muted">Skor 0–100</span></div>
          <div className="mt-4 h-64" role="img" aria-label="Grafik tren Risk Score seluruh kolam dalam 12 titik terbaru">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ left: -20, right: 10 }}>
                <CartesianGrid stroke="#e6efed" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#607476" }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#607476" }} tickLine={false} axisLine={false} />
                <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
                {data.ponds.map((item) => (
                  <Line key={item.pond.id} type="monotone" dataKey={item.pond.id} name={item.pond.name} stroke={lineColors[item.pond.id]} strokeWidth={item.pond.id === "pond-b" || item.pond.id === "pond-c" ? 3 : 1.5} dot={false} isAnimationActive={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="sr-only">Grafik membandingkan perubahan Risk Score Kolam A, B, C, dan D; tabel operasional di atas menyediakan nilai terbaru setiap kolam.</p>
        </Card>
        <div className="grid gap-4">
          <Card className="p-5">
            <h2 className="font-semibold">Distribusi Risiko</h2>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[{label:"Aman",value:summary.safe,color:"bg-[var(--risk-safe-bg)] text-risk-safe"},{label:"Waspada",value:summary.warning,color:"bg-[var(--risk-warning-bg)] text-risk-warning"},{label:"Kritis",value:summary.critical,color:"bg-[var(--risk-critical-bg)] text-risk-critical"}].map((item) => <div key={item.label} className={`rounded-xl p-3 ${item.color}`}><p className="text-xl font-semibold">{Math.round((item.value / Math.max(1, summary.total)) * 100)}%</p><p className="mt-1 text-[11px] font-medium">{item.label} · {item.value}</p></div>)}
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between"><h2 className="font-semibold">Kesehatan Perangkat</h2><Link to="/app/devices" className="text-xs font-semibold text-primary">Kelola</Link></div>
            <p className="mt-3 text-2xl font-semibold">{healthyDevices}<span className="text-sm text-foreground-muted">/{data.ponds.length} sehat</span></p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(healthyDevices / data.ponds.length) * 100}%` }} /></div>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between"><h2 className="font-semibold">Peringatan Terbaru</h2><Link to="/app/alerts" className="text-xs font-semibold text-primary">Lihat semua</Link></div>
          <div className="mt-3 divide-y divide-border">
            {activeAlerts.slice(0, 5).map((alert) => {
              const pond = data.ponds.find((item) => item.pond.id === alert.pondId)?.pond;
              return <div key={alert.id} className="flex items-start gap-3 py-3"><AlertTriangle size={16} className={alert.severity === "critical" ? "mt-0.5 text-risk-critical" : "mt-0.5 text-risk-warning"} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{pond?.name} · {alert.title}</p><p className="mt-1 text-xs text-foreground-muted">{formatWibTime(alert.timestamp)} · {alert.status}</p></div></div>;
            })}
            {activeAlerts.length === 0 && <p className="py-5 text-sm text-foreground-muted">Tidak ada peringatan aktif.</p>}
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between"><h2 className="font-semibold">Tindakan Terbaru</h2><Link to="/app/reports" className="text-xs font-semibold text-primary">Buka laporan</Link></div>
          <div className="mt-3 divide-y divide-border">
            {actions.slice(0, 5).map((action) => <div key={action.id} className="flex items-start gap-3 py-3"><Clock3 size={16} className="mt-0.5 text-primary" /><div><p className="text-sm font-semibold">{action.pond.name} · {action.actionTitle}</p><p className="mt-1 text-xs text-foreground-muted">{formatWibTime(action.performedAt)} · {action.syncStatus}</p></div></div>)}
          </div>
        </Card>
      </section>
    </div>
  );
}
