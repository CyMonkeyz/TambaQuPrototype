import { ArrowRight, CheckCheck, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import type { ActionLog } from "../../domain/action";
import type { Alert } from "../../domain/alert";
import type { Pond } from "../../domain/pond";
import type { Recommendation, RiskAssessment } from "../../domain/risk";
import type { SensorReading } from "../../domain/sensor";
import {
  formatSensorValue,
  formatWibTime,
  getSensorMeta,
} from "../../utils/formatters";
import { Button } from "../ui/Button";
import { RiskBadge } from "../ui/RiskBadge";
import { AlertStatusBadge } from "./AlertStatusBadge";

export interface AlertDetailData {
  alert: Alert;
  pond: Pond;
  risk: RiskAssessment;
  reading: SensorReading;
  recommendations: Recommendation[];
  actions: ActionLog[];
}

export function AlertDetail({
  data,
  isUpdating,
  onAcknowledge,
  onResolve,
}: {
  data: AlertDetailData;
  isUpdating: boolean;
  onAcknowledge: () => void;
  onResolve: () => void;
}) {
  const { alert, pond, risk, reading, recommendations, actions } = data;
  const relatedAction = actions.some((action) =>
    recommendations.some((item) => item.id === action.recommendationId),
  );
  const parameterLabel =
    alert.parameter === "multiple"
      ? "Beberapa parameter"
      : getSensorMeta(alert.parameter).label;
  const currentValue =
    alert.parameter === "multiple"
      ? null
      : formatSensorValue(alert.parameter, reading[alert.parameter]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <RiskBadge level={alert.severity} />
        <AlertStatusBadge status={alert.status} />
      </div>
      <h3 className="mt-4 text-xl font-semibold">{pond.name}</h3>
      <p className="mt-1 text-xs text-foreground-muted">
        {pond.code} · {formatWibTime(alert.timestamp)}
      </p>
      <p className="mt-4 text-sm font-semibold">{alert.title}</p>
      <p className="mt-2 text-sm leading-6 text-foreground-muted">
        {alert.description}
      </p>
      <dl className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface-muted p-3">
          <dt className="text-xs text-foreground-muted">Parameter terkait</dt>
          <dd className="mt-1 text-sm font-semibold">{parameterLabel}</dd>
        </div>
        <div className="rounded-xl bg-surface-muted p-3">
          <dt className="text-xs text-foreground-muted">Nilai saat ini</dt>
          <dd className="mt-1 text-sm font-semibold">
            {currentValue
              ? `${currentValue.value} ${currentValue.unit}`
              : "Lihat analisis"}
          </dd>
        </div>
        <div className="rounded-xl bg-surface-muted p-3">
          <dt className="text-xs text-foreground-muted">Risk Score</dt>
          <dd className="mt-1 text-sm font-semibold">{risk.score} / 100</dd>
        </div>
        <div className="rounded-xl bg-surface-muted p-3">
          <dt className="text-xs text-foreground-muted">Assessment</dt>
          <dd className="mt-1 truncate text-sm font-semibold">{risk.id}</dd>
        </div>
      </dl>
      <div className="mt-5 rounded-xl border border-border p-4">
        <p className="text-xs font-semibold uppercase tracking-[.1em] text-primary">
          Tindakan direkomendasikan
        </p>
        <p className="mt-2 text-sm font-semibold">
          {recommendations[0]?.title ?? "Lanjutkan monitoring"}
        </p>
        <p className="mt-1 text-xs leading-5 text-foreground-muted">
          {recommendations[0]?.description}
        </p>
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {alert.status === "new" && (
          <Button
            isLoading={isUpdating}
            leadingIcon={<Eye size={17} />}
            onClick={onAcknowledge}
          >
            Tandai Sudah Dilihat
          </Button>
        )}
        {alert.status === "acknowledged" && relatedAction && (
          <Button
            isLoading={isUpdating}
            leadingIcon={<CheckCheck size={17} />}
            onClick={onResolve}
          >
            Tandai Tindak Lanjut Tercatat
          </Button>
        )}
        <Link
          to={`/app/pondbrain?pond=${pond.id}`}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-primary hover:bg-surface-muted"
        >
          Lihat Analisis PondBrain <ArrowRight size={16} />
        </Link>
      </div>
      {alert.status === "resolved" && (
        <p className="mt-4 rounded-xl bg-[var(--risk-safe-bg)] p-3 text-xs leading-5 text-foreground-muted">
          Tindak lanjut telah tercatat. Status ini tidak menyatakan kondisi
          biologis sudah kembali normal; monitoring tetap berlanjut.
        </p>
      )}
    </div>
  );
}
