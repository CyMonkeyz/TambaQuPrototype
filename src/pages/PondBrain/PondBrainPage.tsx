import { BrainCircuit, ShieldCheck } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/common/PageHeader";
import { MonitoringSummary } from "../../components/domain/MonitoringSummary";
import { PondSelector } from "../../components/domain/PondSelector";
import { RiskSummary } from "../../components/domain/RiskSummary";
import { Card } from "../../components/ui/Card";
import { ErrorState, LoadingSkeleton } from "../../components/ui/Feedback";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useFarmMonitoring } from "../../hooks/useMonitoring";
import { useAppStore } from "../../store/app-store";
import { DEFAULT_DEMO_POND_ID } from "../../constants/demo";

export function PondBrainPage() {
  useDocumentTitle("PondBrain");
  const farmId = useAppStore((state) => state.activeFarm?.id ?? "");
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isLoading, error, retry } = useFarmMonitoring(farmId);

  if (isLoading) return <LoadingSkeleton rows={3} />;
  if (error || !data) return <ErrorState onRetry={retry} />;

  const requestedPondId = searchParams.get("pond") ?? DEFAULT_DEMO_POND_ID;
  const selected =
    data.ponds.find((item) => item.pond.id === requestedPondId) ??
    data.ponds[0];
  if (!selected) return <ErrorState onRetry={retry} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Decision support preview"
        title="PondBrain"
        description="Ringkasan awal tingkat risiko tambak. Explainability dan alur rekomendasi lengkap disiapkan untuk Phase 3."
      />
      <PondSelector
        ponds={data.ponds}
        selectedPondId={selected.pond.id}
        onChange={(pondId) =>
          setSearchParams({ pond: pondId }, { replace: true })
        }
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_.8fr]">
        <Card className="p-5 sm:p-6">
          <RiskSummary risk={selected.risk} title="PondBrain Insight" />
          <div className="mt-5">
            <MonitoringSummary item={selected} />
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <span className="grid size-11 place-items-center rounded-xl bg-[#dff3f0] text-primary">
            <BrainCircuit size={22} />
          </span>
          <h2 className="mt-4 text-lg font-semibold">
            Analisis lanjutan belum diaktifkan
          </h2>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">
            Phase 3 akan menambahkan kontributor risiko, recommended action,
            peringatan, dan pencatatan tindakan petambak dalam satu alur.
          </p>
          <div className="mt-5 flex items-start gap-2 rounded-xl bg-surface-muted p-3 text-xs leading-5 text-foreground-muted">
            <ShieldCheck className="mt-0.5 shrink-0" size={15} />
            Skor saat ini tetap synthetic dan bukan hasil diagnosis otomatis.
          </div>
          <Link
            className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-primary"
            to={`/app/ponds/${selected.pond.id}`}
          >
            Kembali ke monitoring {selected.pond.name}
          </Link>
        </Card>
      </div>
    </div>
  );
}
