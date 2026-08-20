import { ArrowRight, Bell, ShieldCheck } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/common/PageHeader";
import { SectionHeader } from "../../components/common/SectionHeader";
import { ActionConfirmationDialog } from "../../components/domain/ActionConfirmationDialog";
import { ActionTimeline } from "../../components/domain/ActionTimeline";
import { AlertStatusBadge } from "../../components/domain/AlertStatusBadge";
import { DecisionLoop } from "../../components/domain/DecisionLoop";
import { PondBrainInsightCard } from "../../components/domain/PondBrainInsightCard";
import { PondRiskScore } from "../../components/domain/PondRiskScore";
import { PondSelector } from "../../components/domain/PondSelector";
import { RecommendationCard } from "../../components/domain/RecommendationCard";
import { RiskContributorList } from "../../components/domain/RiskContributorList";
import { Card } from "../../components/ui/Card";
import { LoadingSkeleton } from "../../components/ui/Feedback";
import { toast } from "../../components/ui/toast-api";
import { DEFAULT_DEMO_POND_ID } from "../../constants/demo";
import { repositories } from "../../data/repositories";
import type { MonitoringRange } from "../../domain/monitoring";
import type { Recommendation } from "../../domain/risk";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useFarmMonitoring } from "../../hooks/useMonitoring";
import { usePondBrain } from "../../hooks/usePondBrain";
import { completeRecommendation } from "../../services/action/actionService";
import { trackProductEvent } from "../../services/analytics";
import { getDataFreshness } from "../../services/monitoring";
import {
  buildRiskTrend,
  calculateDataConfidence,
  describeRiskChange,
  sortRiskContributors,
} from "../../services/risk/riskEngine";
import { getCompletedRecommendationIds } from "../../services/selectors";
import { useAppStore } from "../../store/app-store";
import { formatRelativeDemoTime, formatWibTime } from "../../utils/formatters";

const RiskTrendChart = lazy(() =>
  import("../../components/domain/RiskTrendChart").then((module) => ({
    default: module.RiskTrendChart,
  })),
);

export function PondBrainPage() {
  useDocumentTitle("Analisis PondBrain");
  const farmId = useAppStore((state) => state.activeFarm?.id ?? "");
  const user = useAppStore((state) => state.activeUser);
  const globallySelectedPondId = useAppStore((state) => state.selectedPondId);
  const selectPond = useAppStore((state) => state.selectPond);
  const [searchParams, setSearchParams] = useSearchParams();
  const pondId =
    searchParams.get("pond") ?? globallySelectedPondId ?? DEFAULT_DEMO_POND_ID;
  const farmMonitoring = useFarmMonitoring(farmId);
  const { data, isLoading, error, retry } = usePondBrain(pondId);
  const [range, setRange] = useState<MonitoringRange>("24h");
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<Recommendation | null>(null);
  const [actionTimestamp, setActionTimestamp] = useState(
    new Date().toISOString(),
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    selectPond(pondId);
    trackProductEvent({
      name: "pondbrain_viewed",
      properties: { pondId },
    });
  }, [pondId, selectPond]);

  const trend = useMemo(
    () => (data ? buildRiskTrend(data.history, data.risk, range) : []),
    [data, range],
  );
  const shortTrend = useMemo(
    () => (data ? buildRiskTrend(data.history, data.risk, "6h") : []),
    [data],
  );

  if (isLoading || farmMonitoring.isLoading)
    return <LoadingSkeleton rows={4} />;
  if (error || !data || farmMonitoring.error || !farmMonitoring.data) {
    return (
      <Card className="p-6 text-center">
        <h1 className="text-xl font-semibold">
          Analisis PondBrain belum dapat dimuat
        </h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Data monitoring tetap tersedia dan dapat dibuka secara terpisah.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={retry}
            className="min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            Coba Lagi
          </button>
          <Link
            to={`/app/ponds/${pondId}`}
            className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold"
          >
            Lihat Data Kolam
          </Link>
        </div>
      </Card>
    );
  }

  const riskChange = describeRiskChange(shortTrend);
  const contributors = sortRiskContributors(data.risk.contributors);
  const completedIds = getCompletedRecommendationIds(data.actions);
  const completedRecommendationCount = data.recommendations.filter((item) =>
    completedIds.has(item.id),
  ).length;
  const freshness = getDataFreshness(
    data.device.lastSyncAt,
    data.reading.timestamp,
  );
  const confidence = calculateDataConfidence({
    reading: data.reading,
    device: data.device,
    contributors,
  });
  const openConfirmation = (recommendation: Recommendation) => {
    setActionTimestamp(new Date().toISOString());
    setSelectedRecommendation(recommendation);
    trackProductEvent({
      name: "recommendation_viewed",
      properties: { recommendationId: recommendation.id },
    });
  };
  const saveAction = async (notes: string) => {
    if (!selectedRecommendation || !user) return;
    setIsSaving(true);
    try {
      const result = await completeRecommendation({
        repository: repositories.action,
        pondId: data.pond.id,
        recommendation: selectedRecommendation,
        userId: user.id,
        notes,
        timestamp: actionTimestamp,
      });
      setSelectedRecommendation(null);
      if (result.created) {
        toast.success("Tindakan berhasil dicatat.");
        trackProductEvent({
          name: "recommendation_completed",
          properties: { recommendationId: result.action.recommendationId },
        });
      }
      retry();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Decision Support System"
        title="Analisis PondBrain"
        description={`${data.pond.name} · Hari ke-${data.pond.cultureDay}. Pahami risiko, alasan, dan tindakan yang dapat diverifikasi di lapangan.`}
        actions={
          <Link
            to={`/app/ponds/${data.pond.id}`}
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"
          >
            Lihat Data Kolam <ArrowRight size={16} />
          </Link>
        }
      />
      <PondSelector
        ponds={farmMonitoring.data.ponds}
        selectedPondId={data.pond.id}
        onChange={(nextPondId) => {
          selectPond(nextPondId);
          setSearchParams({ pond: nextPondId }, { replace: true });
        }}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="order-1 p-5 sm:p-6">
          <PondRiskScore
            risk={data.risk}
            change={riskChange.change}
            direction={riskChange.direction}
          />
        </Card>
        <Card className="order-4 min-w-0 p-5 sm:p-6 lg:order-2">
          <Suspense fallback={<LoadingSkeleton rows={1} />}>
            <RiskTrendChart
              points={trend}
              range={range}
              onRangeChange={setRange}
            />
          </Suspense>
        </Card>
        <Card className="order-5 p-5 sm:p-6 lg:order-3">
          <RiskContributorList contributors={contributors} />
        </Card>
        <Card className="order-2 p-5 sm:p-6 lg:order-4">
          <PondBrainInsightCard
            risk={data.risk}
            change={riskChange.change}
            freshness={freshness.state}
            confidence={confidence}
            lastSyncLabel={formatRelativeDemoTime(
              data.device.lastSyncAt,
              data.reading.timestamp,
            )}
          />
        </Card>
        <Card className="order-3 p-5 sm:p-6 lg:order-5 lg:col-span-2">
          <SectionHeader
            eyebrow="Apa yang sebaiknya dilakukan?"
            title="Tindakan Direkomendasikan"
            description="Urutan dibuat dari faktor risiko terbesar dan tingkat urgensi saat ini."
          />
          <div className="grid gap-3 lg:grid-cols-3">
            {data.recommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                action={data.actions.find(
                  (item) => item.recommendationId === recommendation.id,
                )}
                performerName={user?.name ?? "Operator tambak"}
                onComplete={openConfirmation}
              />
            ))}
          </div>
          {!data.recommendations.length && (
            <p className="text-sm text-foreground-muted">
              Tidak ada tindakan prioritas saat ini.
            </p>
          )}
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-surface-muted p-3 text-xs leading-5 text-foreground-muted">
            <ShieldCheck className="mt-0.5 shrink-0" size={16} />
            Rekomendasi PondBrain merupakan dukungan keputusan berdasarkan data
            monitoring dan tidak menggantikan pemeriksaan kondisi tambak secara
            langsung.
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <Card className="p-5 sm:p-6">
          <SectionHeader
            eyebrow="Farmer action"
            title="Riwayat Tindakan"
            description="Setiap catatan menyimpan siapa, apa, kapan, dan kolam terkait."
          />
          <ActionTimeline
            actions={data.actions}
            performerName={user?.name ?? "Operator tambak"}
          />
          <div className="mt-6">
            <DecisionLoop hasAction={data.actions.length > 0} />
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <SectionHeader eyebrow="Konteks terbaru" title="Peringatan Aktif" />
          <div className="space-y-3">
            {data.alerts
              .filter((alert) => alert.status !== "resolved")
              .map((alert) => (
                <Link
                  key={alert.id}
                  to={`/app/alerts?alert=${alert.id}`}
                  className="flex min-h-11 items-start gap-3 rounded-xl border border-border p-3 hover:bg-surface-muted"
                >
                  <Bell
                    className={
                      alert.severity === "critical"
                        ? "mt-0.5 shrink-0 text-risk-critical"
                        : "mt-0.5 shrink-0 text-risk-warning"
                    }
                    size={17}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{alert.title}</p>
                    <p className="mt-1 text-xs text-foreground-muted">
                      {formatWibTime(alert.timestamp)}
                    </p>
                  </div>
                  <AlertStatusBadge status={alert.status} />
                </Link>
              ))}
          </div>
          {!data.alerts.some((alert) => alert.status !== "resolved") && (
            <p className="text-sm text-foreground-muted">
              Tidak ada peringatan aktif. Kondisi tambak tetap dalam pemantauan.
            </p>
          )}
        </Card>
      </div>

      <ActionConfirmationDialog
        recommendation={selectedRecommendation}
        timestamp={actionTimestamp}
        isSaving={isSaving}
        onClose={() => setSelectedRecommendation(null)}
        onSave={saveAction}
      />
      <span className="sr-only" aria-live="polite">
        {completedRecommendationCount} rekomendasi telah diselesaikan.
      </span>
    </div>
  );
}
