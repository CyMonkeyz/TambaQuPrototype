import { Activity, AlertTriangle, CheckCircle2, Download, Gauge, RadioTower } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ErrorState, LoadingSkeleton } from "../../components/ui/Feedback";
import { repositories } from "../../data/repositories";
import type { ActionLog } from "../../domain/action";
import type { Alert } from "../../domain/alert";
import { SENSOR_PARAMETERS } from "../../domain/monitoring";
import type { Pond } from "../../domain/pond";
import type { Recommendation, RiskAssessment } from "../../domain/risk";
import type { SensorDevice, SensorReading } from "../../domain/sensor";
import { useDemoRepositoryRevision } from "../../hooks/useDemoRepositoryRevision";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useRepositoryData } from "../../hooks/useRepositoryData";
import {
  aggregateReportKpis,
  countRiskLevels,
  filterReadingsByPeriod,
  summarizeActions,
  summarizeParameter,
  type ReportPeriod,
} from "../../services/reporting/reportService";
import { useAppStore } from "../../store/app-store";
import { formatSensorValue, getSensorMeta } from "../../utils/formatters";
import { OfflineDataNotice } from "../../components/offline/ConnectivityStatus";

interface ReportData {
  ponds: Pond[];
  readings: Record<string, SensorReading[]>;
  risks: RiskAssessment[];
  alerts: Alert[];
  actions: ActionLog[];
  devices: SensorDevice[];
  recommendations: Recommendation[];
}

async function loadReport(farmId: string): Promise<ReportData> {
  const [ponds, risks, alerts, actions, devices] = await Promise.all([
    repositories.pond.getByFarmId(farmId),
    repositories.risk.getCurrentByFarmId(farmId),
    repositories.alert.getByFarmId(farmId),
    repositories.action.getByFarmId(farmId),
    repositories.sensor.getDevicesByFarmId(farmId),
  ]);
  const histories = await Promise.all(ponds.map((pond) => repositories.sensor.getHistory(pond.id, 720)));
  const recommendationGroups = await Promise.all(risks.map((risk) => repositories.risk.getRecommendations(risk.id)));
  return {
    ponds,
    risks,
    alerts,
    actions,
    devices,
    recommendations: recommendationGroups.flat(),
    readings: Object.fromEntries(ponds.map((pond, index) => [pond.id, histories[index]])),
  };
}

function ReportMetric({ label, value, detail, icon: Icon }: { label: string; value: string | number; detail: string; icon: typeof Activity }) {
  return <Card className="p-4 shadow-none"><div className="flex items-start justify-between gap-2"><div><p className="text-xs text-foreground-muted">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p><p className="mt-1 text-[11px] text-foreground-muted">{detail}</p></div><Icon className="text-primary" size={18} /></div></Card>;
}

export function ReportsPage() {
  useDocumentTitle("Laporan");
  const farm = useAppStore((state) => state.activeFarm);
  const revision = useDemoRepositoryRevision();
  const { data, isLoading, error, retry } = useRepositoryData(
    () => loadReport(farm?.id ?? ""),
    `${farm?.id}:${revision}`,
  );
  const [pondId, setPondId] = useState("all");
  const [period, setPeriod] = useState<ReportPeriod>("24h");

  const report = useMemo(() => {
    if (!data) return null;
    const pondIds = new Set(pondId === "all" ? data.ponds.map((pond) => pond.id) : [pondId]);
    const risks = data.risks.filter((item) => pondIds.has(item.pondId));
    const alerts = data.alerts.filter((item) => pondIds.has(item.pondId));
    const actions = data.actions.filter((item) => pondIds.has(item.pondId));
    const devices = data.devices.filter((item) => pondIds.has(item.pondId));
    const recommendations = data.recommendations.filter((item) => risks.some((risk) => risk.id === item.riskAssessmentId));
    const readings = [...pondIds].flatMap((id) => filterReadingsByPeriod(data.readings[id] ?? [], period));
    return {
      readings,
      risks,
      kpis: aggregateReportKpis({ risks, alerts, actions, connections: devices.map((item) => item.connectionStatus) }),
      riskCounts: countRiskLevels(risks),
      actionSummary: summarizeActions(recommendations, actions),
    };
  }, [data, period, pondId]);

  return (
    <>
      <PageHeader
        eyebrow="Operational review"
        title="Operational Reports"
        description="Ringkasan kualitas air, risiko, perangkat, rekomendasi, dan tindakan dari sumber data demo yang sama."
        actions={<Button className="no-print" variant="secondary" leadingIcon={<Download size={17} />} onClick={() => window.print()}>Cetak / Simpan PDF</Button>}
      />
      <section className="no-print mt-6 flex flex-wrap gap-3 rounded-2xl border border-border bg-surface p-4" aria-label="Filter laporan">
        <label className="text-xs font-semibold text-foreground-muted">Kolam<select className="ml-2 min-h-10 rounded-xl border border-border bg-white px-3 text-sm text-foreground" value={pondId} onChange={(event) => setPondId(event.target.value)}><option value="all">Semua kolam</option>{data?.ponds.map((pond) => <option key={pond.id} value={pond.id}>{pond.name}</option>)}</select></label>
        <label className="text-xs font-semibold text-foreground-muted">Periode<select className="ml-2 min-h-10 rounded-xl border border-border bg-white px-3 text-sm text-foreground" value={period} onChange={(event) => setPeriod(event.target.value as ReportPeriod)}><option value="24h">24 jam</option><option value="7d">7 hari</option><option value="30d">30 hari</option><option value="cycle">Siklus tersedia</option></select></label>
      </section>
      <p className="mt-4 text-xs text-foreground-muted">{farm?.name} · Data sintetis untuk demonstrasi produk · Bukan laporan laboratorium.</p>
      {report?.readings.at(-1) && <div className="mt-4"><OfflineDataNotice timestamp={report.readings.at(-1)?.timestamp} /></div>}
      <div className="mt-6">
        {isLoading ? <LoadingSkeleton rows={5} /> : error || !data || !report ? <ErrorState onRetry={retry} /> : (
          <div className="space-y-5">
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-6" aria-label="KPI laporan">
              <ReportMetric icon={Gauge} label="Rata-rata Risiko" value={report.kpis.averageRisk} detail="Skor lintas kolam" />
              <ReportMetric icon={Activity} label="Risiko Tertinggi" value={report.kpis.highestRisk} detail="Skor saat ini" />
              <ReportMetric icon={AlertTriangle} label="Peringatan Aktif" value={report.kpis.activeAlerts} detail="Belum diselesaikan" />
              <ReportMetric icon={CheckCircle2} label="Tindakan" value={report.kpis.actionsTaken} detail="Tercatat pada demo" />
              <ReportMetric icon={RadioTower} label="Uptime" value={`${report.kpis.uptime}%`} detail="Estimasi fixture" />
              <ReportMetric icon={CheckCircle2} label="Kelengkapan" value={`${report.kpis.completeness}%`} detail="Estimasi data tersedia" />
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
              <Card className="overflow-hidden">
                <div className="border-b border-border p-5"><h2 className="font-semibold">Water Quality Summary</h2><p className="mt-1 text-xs text-foreground-muted">Nilai gabungan sesuai kolam dan periode terpilih.</p></div>
                <div className="grid gap-3 p-4 md:hidden">{SENSOR_PARAMETERS.map((parameter) => { const item = summarizeParameter(report.readings, parameter); const meta = getSensorMeta(parameter); return <div key={parameter} className="rounded-xl bg-surface-muted p-4"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold">{meta.label}</h3><span className="text-xs font-semibold text-primary">{item.trend === "up" ? "Naik" : item.trend === "down" ? "Turun" : "Stabil"}</span></div><p className="mt-2 text-xl font-semibold">{formatSensorValue(parameter, item.current).value} <span className="text-xs text-foreground-muted">{meta.unit}</span></p><dl className="mt-3 grid grid-cols-3 gap-2 text-xs"><div><dt className="text-foreground-muted">Rata-rata</dt><dd className="mt-1 font-semibold">{formatSensorValue(parameter, item.average).value}</dd></div><div><dt className="text-foreground-muted">Min</dt><dd className="mt-1 font-semibold">{formatSensorValue(parameter, item.minimum).value}</dd></div><div><dt className="text-foreground-muted">Max</dt><dd className="mt-1 font-semibold">{formatSensorValue(parameter, item.maximum).value}</dd></div></dl></div>; })}</div>
                <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-surface-muted text-xs text-foreground-muted"><tr>{["Parameter", "Saat ini", "Rata-rata", "Minimum", "Maksimum", "Tren"].map((label) => <th key={label} scope="col" className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-border">{SENSOR_PARAMETERS.map((parameter) => { const item = summarizeParameter(report.readings, parameter); const meta = getSensorMeta(parameter); return <tr key={parameter}><td className="px-4 py-3 font-semibold">{meta.label}</td><td className="px-4 py-3">{formatSensorValue(parameter, item.current).value} {meta.unit}</td><td className="px-4 py-3">{formatSensorValue(parameter, item.average).value}</td><td className="px-4 py-3">{formatSensorValue(parameter, item.minimum).value}</td><td className="px-4 py-3">{formatSensorValue(parameter, item.maximum).value}</td><td className="px-4 py-3 capitalize">{item.trend === "up" ? "Naik" : item.trend === "down" ? "Turun" : "Stabil"}</td></tr>; })}</tbody></table></div>
              </Card>
              <div className="space-y-4">
                <Card className="p-5"><h2 className="font-semibold">Risk Events</h2><div className="mt-4 space-y-3">{[{key:"safe",label:"Aman",color:"bg-[var(--risk-safe)]"},{key:"warning",label:"Waspada",color:"bg-[var(--risk-warning)]"},{key:"critical",label:"Kritis",color:"bg-[var(--risk-critical)]"}].map((item) => <div key={item.key}><div className="flex justify-between text-xs"><span>{item.label}</span><strong>{report.riskCounts[item.key as keyof typeof report.riskCounts]}</strong></div><div className="mt-1 h-2 rounded-full bg-surface-muted"><div className={`h-full rounded-full ${item.color}`} style={{ width: `${(report.riskCounts[item.key as keyof typeof report.riskCounts] / Math.max(1, report.risks.length)) * 100}%` }} /></div></div>)}</div></Card>
                <Card className="p-5"><h2 className="font-semibold">Action Completion</h2><p className="mt-3 text-3xl font-semibold">{report.actionSummary.completionRate}%</p><dl className="mt-4 grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-xl bg-surface-muted p-2"><dt className="text-foreground-muted">Disarankan</dt><dd className="mt-1 font-semibold">{report.actionSummary.recommended}</dd></div><div className="rounded-xl bg-surface-muted p-2"><dt className="text-foreground-muted">Selesai</dt><dd className="mt-1 font-semibold">{report.actionSummary.completed}</dd></div><div className="rounded-xl bg-surface-muted p-2"><dt className="text-foreground-muted">Tertunda</dt><dd className="mt-1 font-semibold">{report.actionSummary.pending}</dd></div></dl></Card>
              </div>
            </section>
            <Card className="p-5 shadow-none"><h2 className="font-semibold">Data Quality Notes</h2><p className="mt-2 text-sm leading-6 text-foreground-muted">Uptime dan kelengkapan merupakan estimasi deterministik dari status perangkat demo. Perubahan simulator langsung tercermin di laporan ini; interpretasi tetap memerlukan verifikasi kondisi lapangan.</p></Card>
          </div>
        )}
      </div>
    </>
  );
}
