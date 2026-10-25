import { CultivationShortcuts } from "../../components/domain/CultivationShortcuts";
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  MapPin,
  RadioTower,
} from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/common/PageHeader";
import { SectionHeader } from "../../components/common/SectionHeader";
import { FarmRiskOverview } from "../../components/domain/FarmRiskOverview";
import { FreshnessIndicator } from "../../components/domain/FreshnessIndicator";
import { MonitoringSummary } from "../../components/domain/MonitoringSummary";
import { PondPriorityList } from "../../components/domain/PondPriorityList";
import { PondSelector } from "../../components/domain/PondSelector";
import { RiskSummary } from "../../components/domain/RiskSummary";
import { SensorMetricCard } from "../../components/domain/SensorMetricCard";
import { Card } from "../../components/ui/Card";
import { ErrorState, LoadingSkeleton } from "../../components/ui/Feedback";
import { RiskBadge } from "../../components/ui/RiskBadge";
import { StatusBadge } from "../../components/ui/StatusBadge";
import type { MonitoringRange } from "../../domain/monitoring";
import { SENSOR_PARAMETERS } from "../../domain/monitoring";
import type { SensorParameter } from "../../domain/sensor";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useFarmMonitoring } from "../../hooks/useMonitoring";
import {
  calculateTrend,
  getDataFreshness,
  getFarmRiskSummary,
} from "../../services/monitoring";
import {
  getPendingRecommendations,
  getTopRiskContributor,
} from "../../services/selectors";
import { useAppStore } from "../../store/app-store";
import { formatWibTime, getSensorMeta } from "../../utils/formatters";
import { DEFAULT_DEMO_POND_ID } from "../../constants/demo";

const WaterQualityChart = lazy(
  () => import("../../components/domain/WaterQualityChart"),
);
export function DashboardPage() {
  useDocumentTitle("Beranda");
  const user = useAppStore((state) => state.activeUser);
  const farm = useAppStore((state) => state.activeFarm);
  const selectedPondId = useAppStore((state) => state.selectedPondId);
  const selectPond = useAppStore((state) => state.selectPond);
  const { data, isLoading, error, retry } = useFarmMonitoring(farm?.id ?? "");
  const [parameter, setParameter] =
    useState<SensorParameter>("dissolvedOxygen");
  const [range, setRange] = useState<MonitoringRange>("24h");

  useEffect(() => {
    if (!data?.ponds.length) return;
    const selectionIsValid = data.ponds.some(
      (item) => item.pond.id === selectedPondId,
    );
    if (!selectionIsValid)
      selectPond(
        data.ponds.find((item) => item.pond.id === DEFAULT_DEMO_POND_ID)?.pond
          .id ?? data.ponds[0].pond.id,
      );
  }, [data, selectPond, selectedPondId]);

  const selected = useMemo(
    () =>
      data?.ponds.find((item) => item.pond.id === selectedPondId) ??
      data?.ponds.find((item) => item.pond.id === DEFAULT_DEMO_POND_ID) ??
      data?.ponds[0],
    [data, selectedPondId],
  );

  if (isLoading) return <LoadingSkeleton rows={5} />;
  if (error || !data) return <ErrorState onRetry={retry} />;
  if (!selected) return <ErrorState onRetry={retry} />;

  const farmSummary = getFarmRiskSummary(data.ponds);
  const freshness = getDataFreshness(
    selected.device.lastSyncAt,
    selected.reading.timestamp,
  );
  const activeAlerts = data.alerts
    .filter((alert) => alert.status !== "resolved")
    .slice(0, 3);
  const pendingRecommendations = getPendingRecommendations(
    selected.recommendations,
    selected.actions,
  );
  const topContributor = getTopRiskContributor(selected.risk.contributors);
  const topContributorLabel =
    topContributor?.parameter === "weatherContext"
      ? "Konteks Lingkungan"
      : topContributor
        ? getSensorMeta(topContributor.parameter).label
        : "Belum tersedia";
  const chooseParameter = (nextParameter: SensorParameter) => {
    setParameter(nextParameter);
  };

  return (
    <>
      <div className="dashboard-workspace space-y-6">
        <PageHeader
          eyebrow={`Selamat datang, ${user?.name.split(" ")[0] ?? "Andi"}`}
          title="Ringkasan Operasional"
          description={`${farm?.name} · ${farm?.location}`}
          actions={<FreshnessIndicator {...freshness} />}
        />
        <FarmRiskOverview ponds={data.ponds} />
        <CultivationShortcuts />
        <Card className="overflow-hidden">
          <div className="border-b border-border bg-[#f9fcfb] p-5 sm:p-6">
            <PondSelector
              ponds={data.ponds}
              selectedPondId={selected.pond.id}
              onChange={selectPond}
            />
          </div>
          <div className="p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-semibold tracking-[-.035em]">
                    {selected.pond.name}
                  </h2>
                  <RiskBadge level={selected.risk.level} />
                  <StatusBadge status={selected.device.connectionStatus} />
                </div>
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground-muted">
                  <span>Hari ke-{selected.pond.cultureDay}</span>
                  <span>{selected.pond.areaM2.toLocaleString("id-ID")} m²</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={14} />
                    {farm?.location}
                  </span>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
                <div className="rounded-xl bg-surface-muted p-3">
                  <p className="text-xs text-foreground-muted">Skor Risiko</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {selected.risk.score}
                    <span className="text-xs text-foreground-muted">/100</span>
                  </p>
                </div>
                <div className="rounded-xl bg-surface-muted p-3">
                  <p className="text-xs text-foreground-muted">
                    Sinkron terakhir
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {formatWibTime(selected.device.lastSyncAt)}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <SectionHeader
                eyebrow="Kondisi air saat ini"
                title="Sensor utama"
                description="Pilih parameter untuk melihat riwayatnya."
              />
              <div className="grid gap-3 sm:grid-cols-3">
                {SENSOR_PARAMETERS.filter((item) =>
                  ["dissolvedOxygen", "ph", "temperature"].includes(item),
                ).map((item) => (
                  <SensorMetricCard
                    key={item}
                    parameter={item}
                    value={selected.reading[item]}
                    trend={calculateTrend(
                      selected.history.map((reading) => reading[item]),
                      6,
                    )}
                    selected={parameter === item}
                    onSelect={() => chooseParameter(item)}
                  />
                ))}
              </div>
              <details className="mt-5 rounded-xl border border-border p-4">
                <summary className="cursor-pointer text-sm font-semibold">
                  Hasil uji tambahan
                </summary>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {SENSOR_PARAMETERS.filter(
                    (item) =>
                      !["dissolvedOxygen", "ph", "temperature"].includes(item),
                  ).map((item) => (
                    <SensorMetricCard
                      key={item}
                      parameter={item}
                      value={selected.reading[item]}
                      trend={calculateTrend(
                        selected.history.map((r) => r[item]),
                        6,
                      )}
                      selected={parameter === item}
                      onSelect={() => chooseParameter(item)}
                    />
                  ))}
                </div>
                <Link
                  className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"
                  to="/app/modules/biofloc"
                >
                  Catat hasil uji air <ArrowRight size={16} />
                </Link>
              </details>
            </div>
          </div>
        </Card>
        <div className="grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
          <Card className="p-5 sm:p-6">
            <div>
              <Suspense fallback={<LoadingSkeleton rows={2} />}>
                <WaterQualityChart
                  history={selected.history}
                  parameter={parameter}
                  range={range}
                  onParameterChange={setParameter}
                  onRangeChange={setRange}
                />
              </Suspense>
            </div>
          </Card>
          <div className="space-y-4">
            <Card className="p-5 sm:p-6">
              <RiskSummary
                risk={selected.risk}
                compact
                title="Ringkasan PondBrain"
              />
              <dl className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-surface-muted p-3">
                  <dt className="text-xs text-foreground-muted">
                    Faktor utama
                  </dt>
                  <dd className="mt-1 text-sm font-semibold">
                    {topContributorLabel} · {topContributor?.contribution ?? 0}%
                  </dd>
                </div>
                <div className="rounded-xl bg-surface-muted p-3">
                  <dt className="text-xs text-foreground-muted">Tindakan</dt>
                  <dd className="mt-1 text-sm font-semibold">
                    {pendingRecommendations.length} direkomendasikan
                  </dd>
                </div>
              </dl>
              <Link
                className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"
                to={`/app/pondbrain?pond=${selected.pond.id}`}
              >
                Lihat Analisis <ArrowRight size={16} />
              </Link>
              <details className="mt-3 border-t border-border pt-3">
                <summary className="cursor-pointer py-2 text-xs font-semibold text-foreground-muted">
                  Ringkasan monitoring dan perangkat
                </summary>
                <div className="mt-3">
                  <MonitoringSummary item={selected} />
                  <p className="mt-3 inline-flex items-center gap-2 text-xs text-foreground-muted">
                    <RadioTower size={14} />
                    {selected.device.connectionStatus === "online"
                      ? "Sensor terhubung."
                      : "Periksa koneksi perangkat."}
                  </p>
                </div>
              </details>
            </Card>
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
          <Card className="p-5 sm:p-6">
            <SectionHeader
              eyebrow="Multi-kolam"
              title="Prioritas Kolam"
              description={`${farmSummary.critical} kritis, ${farmSummary.warning} waspada, ${farmSummary.safe} aman`}
            />
            <PondPriorityList ponds={data.ponds} />
          </Card>
          <Card className="p-5 sm:p-6">
            <SectionHeader
              eyebrow="Perlu diperhatikan"
              title="Peringatan Terbaru"
              action={
                <Link
                  to="/app/alerts"
                  className="text-xs font-semibold text-primary"
                >
                  Lihat Semua
                </Link>
              }
            />
            <div className="space-y-3">
              {activeAlerts.map((alert) => {
                const pond = data.ponds.find(
                  (item) => item.pond.id === alert.pondId,
                )?.pond;
                return (
                  <div
                    key={alert.id}
                    className="flex gap-3 rounded-xl bg-surface-muted p-3"
                  >
                    <AlertTriangle
                      className={
                        alert.severity === "critical"
                          ? "mt-0.5 shrink-0 text-risk-critical"
                          : "mt-0.5 shrink-0 text-risk-warning"
                      }
                      size={17}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{pond?.name}</p>
                        <span className="text-[10px] text-foreground-muted">
                          {formatWibTime(alert.timestamp)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-foreground-muted">
                        {alert.title}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            {activeAlerts.length === 0 && (
              <p className="text-sm text-foreground-muted">
                Tidak ada peringatan aktif.
              </p>
            )}
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-border p-3 text-xs leading-5 text-foreground-muted">
              <BrainCircuit className="mt-0.5 shrink-0" size={15} />
              Data simulasi untuk mencoba alur pemantauan dan tindak lanjut.
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
