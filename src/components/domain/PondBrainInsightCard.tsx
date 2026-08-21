import { BrainCircuit, DatabaseZap } from "lucide-react";
import type { DataFreshness } from "../../domain/monitoring";
import type { RiskAssessment } from "../../domain/risk";

export function PondBrainInsightCard({
  risk,
  change,
  freshness,
  confidence,
  lastSyncLabel,
  cached = false,
}: {
  risk: RiskAssessment;
  change: number;
  freshness: DataFreshness;
  confidence: number;
  lastSyncLabel: string;
  cached?: boolean;
}) {
  const insight =
    risk.level === "critical"
      ? "Kombinasi DO rendah dan peningkatan parameter limbah menunjukkan kondisi berisiko tinggi. Prioritaskan pemeriksaan kondisi kolam dan tindakan operasional."
      : risk.level === "warning"
        ? `Risk Score meningkat ${change} poin dalam 6 jam terakhir. Perubahan terutama berkaitan dengan penurunan DO dan kenaikan amonia.`
        : "Parameter utama relatif stabil. Tidak ada peningkatan risiko signifikan pada periode monitoring terakhir.";
  return (
    <section aria-labelledby="pondbrain-insight-title">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#dff3f0] text-primary">
          <BrainCircuit size={22} aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.12em] text-primary">
            Apa yang berubah?
          </p>
          <h2
            id="pondbrain-insight-title"
            className="mt-1 text-lg font-semibold"
          >
            Insight PondBrain
          </h2>
        </div>
      </div>
      <p className="mt-4 text-sm leading-7 text-foreground-muted">{insight}</p>
      {(freshness !== "fresh" || cached) && (
        <div className="mt-4 flex gap-3 rounded-xl bg-[var(--risk-warning-bg)] p-4 text-sm">
          <DatabaseZap
            className="mt-0.5 shrink-0 text-risk-warning"
            size={18}
          />
          <div>
            <p className="font-semibold">Data Terbatas</p>
            <p className="mt-1 leading-6 text-foreground-muted">
              Analisis menggunakan data terakhir yang tersedia. Terakhir sinkron{" "}
              {lastSyncLabel}. Perlu verifikasi data terbaru.
            </p>
          </div>
        </div>
      )}
      <div className="mt-4 rounded-xl bg-surface-muted p-4">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="font-semibold">Kepercayaan Data</span>
          <strong>{cached ? "Terbatas" : `${confidence}%`}</strong>
        </div>
        <p className="mt-1 text-xs leading-5 text-foreground-muted">
          Berdasarkan kelengkapan data, kebaruan sensor, dan jumlah faktor yang
          tersedia—bukan probabilitas diagnosis.
        </p>
      </div>
    </section>
  );
}
