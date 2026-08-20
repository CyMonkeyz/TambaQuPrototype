import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BrainCircuit,
  MapPin,
} from "lucide-react";
import { lazy, Suspense, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SectionHeader } from "../../components/common/SectionHeader";
import { DeviceStatus } from "../../components/domain/DeviceStatus";
import { FreshnessIndicator } from "../../components/domain/FreshnessIndicator";
import { MonitoringSummary } from "../../components/domain/MonitoringSummary";
import { RiskSummary } from "../../components/domain/RiskSummary";
import { SensorMetricCard } from "../../components/domain/SensorMetricCard";
import { Card } from "../../components/ui/Card";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "../../components/ui/Feedback";
import { RiskBadge } from "../../components/ui/RiskBadge";
import { StatusBadge } from "../../components/ui/StatusBadge";
import type { MonitoringRange } from "../../domain/monitoring";
import { SENSOR_PARAMETERS } from "../../domain/monitoring";
import type { SensorParameter } from "../../domain/sensor";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { usePondMonitoring } from "../../hooks/useMonitoring";
import {
  calculateRiskScoreChange,
  calculateTrend,
  getDataFreshness,
} from "../../services/monitoring";
import {
  getPendingRecommendations,
  getTopRiskContributor,
} from "../../services/selectors";
import { useAppStore } from "../../store/app-store";
import { formatWibTime, getSensorMeta } from "../../utils/formatters";

const WaterQualityChart = lazy(
  () => import("../../components/domain/WaterQualityChart"),
);

export function PondDetailPage() {
  const { pondId = "" } = useParams();
  const farm = useAppStore((state) => state.activeFarm);
  const user = useAppStore((state) => state.activeUser);
  const { data, isLoading, error, retry } = usePondMonitoring(pondId);
  const [parameter, setParameter] =
    useState<SensorParameter>("dissolvedOxygen");
  const [range, setRange] = useState<MonitoringRange>("24h");
  const chartRef = useRef<HTMLDivElement>(null);
  useDocumentTitle(data?.pond.name ?? "Detail Kolam");

  if (isLoading) return <LoadingSkeleton rows={5} />;
  if (error) return <ErrorState onRetry={retry} />;
  if (!data)
    return (
      <EmptyState
        title="Kolam tidak ditemukan"
        description="Periksa kembali tautan atau pilih kolam dari halaman Kondisi Kolam."
      />
    );

  const freshness = getDataFreshness(
    data.device.lastSyncAt,
    data.reading.timestamp,
  );
  const scoreChange = calculateRiskScoreChange(data);
  const pendingRecommendations = getPendingRecommendations(
    data.recommendations,
    data.actions,
  );
  const latestAction = [...data.actions].sort(
    (a, b) => Date.parse(b.performedAt) - Date.parse(a.performedAt),
  )[0];
  const topContributor = getTopRiskContributor(data.risk.contributors);
  const topContributorLabel =
    topContributor?.parameter === "weatherContext"
      ? "Konteks Lingkungan"
      : topContributor
        ? getSensorMeta(topContributor.parameter).label
        : "Belum tersedia";
  const chooseParameter = (nextParameter: SensorParameter) => {
    setParameter(nextParameter);
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    chartRef.current?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "center",
    });
  };

  return (
    <div className="space-y-5">
      <nav aria-label="Breadcrumb">
        <Link
          to="/app/ponds"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-foreground-muted hover:text-primary"
        >
          <ArrowLeft size={17} />
          Kondisi Kolam{" "}
          <span className="hidden sm:inline">/ {data.pond.name}</span>
        </Link>
      </nav>
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-[-.035em] sm:text-3xl">
                {data.pond.name}
              </h1>
              <RiskBadge level={data.risk.level} />
              <StatusBadge status={data.device.connectionStatus} />
            </div>
            <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-foreground-muted">
              <span>{farm?.name}</span>
              <span className="inline-flex items-center gap-1">
                <MapPin size={14} />
                {farm?.location}
              </span>
            </p>
            <p className="mt-4 text-sm text-foreground-muted">
              Hari ke-
              <strong className="text-foreground">
                {data.pond.cultureDay}
              </strong>{" "}
              ·{" "}
              <strong className="text-foreground">
                {data.pond.areaM2.toLocaleString("id-ID")} m²
              </strong>{" "}
              · {data.pond.code}
            </p>
          </div>
          <FreshnessIndicator {...freshness} />
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-[.72fr_1.28fr]">
        <Card className="p-5 sm:p-6">
          <RiskSummary
            risk={data.risk}
            scoreChange={scoreChange}
            title="Risk Score"
          />
        </Card>
        <Card className="p-5 sm:p-6">
          <SectionHeader
            eyebrow="Kondisi air saat ini"
            title="Pembacaan Sensor"
            description={`Diperbarui ${formatWibTime(data.reading.timestamp)}`}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SENSOR_PARAMETERS.map((item) => (
              <SensorMetricCard
                key={item}
                parameter={item}
                value={data.reading[item]}
                trend={calculateTrend(
                  data.history.map((reading) => reading[item]),
                  6,
                )}
                selected={parameter === item}
                onSelect={() => chooseParameter(item)}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-foreground-muted">
            Status berdasarkan konfigurasi demo TambaQu. Klik kartu untuk
            mengubah grafik.
          </p>
        </Card>
      </div>
      <Card className="p-5 sm:p-6">
        <div ref={chartRef}>
          <Suspense fallback={<LoadingSkeleton rows={2} />}>
            <WaterQualityChart
              history={data.history}
              parameter={parameter}
              range={range}
              onParameterChange={setParameter}
              onRangeChange={setRange}
            />
          </Suspense>
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
        <Card className="p-5 sm:p-6">
          <MonitoringSummary item={data} />
          <div className="mt-5 border-t border-border pt-5">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#dff3f0] text-primary">
                <BrainCircuit size={20} />
              </span>
              <div>
                <p className="text-sm font-semibold text-primary">
                  PondBrain Insight
                </p>
                <p className="mt-1 font-semibold">
                  Risk {data.risk.score} ·{" "}
                  {data.risk.level === "critical"
                    ? "Kritis"
                    : data.risk.level === "warning"
                      ? "Waspada"
                      : "Aman"}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-surface-muted p-3">
                    <dt className="text-xs text-foreground-muted">
                      Faktor utama
                    </dt>
                    <dd className="mt-1 text-sm font-semibold">
                      {topContributorLabel} ·{" "}
                      {topContributor?.contribution ?? 0}%
                    </dd>
                  </div>
                  <div className="rounded-xl bg-surface-muted p-3">
                    <dt className="text-xs text-foreground-muted">
                      Tindakan tertunda
                    </dt>
                    <dd className="mt-1 text-sm font-semibold">
                      {pendingRecommendations.length}
                    </dd>
                  </div>
                </dl>
                <Link
                  className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"
                  to={`/app/pondbrain?pond=${data.pond.id}`}
                >
                  Lihat Analisis <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <SectionHeader eyebrow="Device health" title="Perangkat Sensor" />
          <DeviceStatus
            device={data.device}
            referenceTimestamp={data.reading.timestamp}
            detailed
          />
        </Card>
      </div>
      <Card className="p-5 sm:p-6">
        <SectionHeader
          eyebrow="Situational awareness"
          title="Aktivitas Terbaru"
          description="Preview peringatan terkait kolam ini."
        />
        {latestAction && (
          <div className="mb-4 rounded-xl bg-[var(--risk-safe-bg)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[.1em] text-risk-safe">
              Tindakan terakhir tercatat
            </p>
            <p className="mt-2 text-sm font-semibold">
              {latestAction.actionTitle}
            </p>
            <p className="mt-1 text-xs text-foreground-muted">
              {formatWibTime(latestAction.performedAt)} · {user?.name}
            </p>
            {latestAction.notes && (
              <p className="mt-2 text-sm leading-6 text-foreground-muted">
                {latestAction.notes}
              </p>
            )}
          </div>
        )}
        {data.alerts.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.alerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className="flex gap-3 rounded-xl bg-surface-muted p-4"
              >
                <Bell
                  className={
                    alert.severity === "critical"
                      ? "mt-0.5 shrink-0 text-risk-critical"
                      : "mt-0.5 shrink-0 text-risk-warning"
                  }
                  size={17}
                />
                <div>
                  <p className="text-sm font-semibold">{alert.title}</p>
                  <p className="mt-1 text-xs text-foreground-muted">
                    {formatWibTime(alert.timestamp)} ·{" "}
                    {alert.status === "new"
                      ? "Baru"
                      : alert.status === "acknowledged"
                        ? "Diketahui"
                        : "Selesai"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-foreground-muted">
            Belum ada aktivitas peringatan untuk kolam ini.
          </p>
        )}
      </Card>
    </div>
  );
}
