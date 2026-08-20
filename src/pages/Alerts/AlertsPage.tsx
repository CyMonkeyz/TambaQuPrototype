import { AlertTriangle, CheckCheck, Clock3 } from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { Card } from "../../components/ui/Card";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "../../components/ui/Feedback";
import { RiskBadge } from "../../components/ui/RiskBadge";
import { repositories } from "../../data/repositories";
import type { Alert } from "../../domain/alert";
import type { Pond } from "../../domain/pond";
import { useRepositoryData } from "../../hooks/useRepositoryData";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useAppStore } from "../../store/app-store";
import { formatRelativeDemoTime } from "../../utils/formatters";

async function loadAlerts(
  farmId: string,
): Promise<Array<{ alert: Alert; pond: Pond }>> {
  const [alerts, ponds] = await Promise.all([
    repositories.alert.getByFarmId(farmId),
    repositories.pond.getByFarmId(farmId),
  ]);
  return alerts.flatMap((alert) => {
    const pond = ponds.find((item) => item.id === alert.pondId);
    return pond ? [{ alert, pond }] : [];
  });
}

export function AlertsPage() {
  useDocumentTitle("Peringatan");
  const farmId = useAppStore((state) => state.activeFarm?.id ?? "");
  const { data, isLoading, error } = useRepositoryData(
    () => loadAlerts(farmId),
    farmId,
  );
  return (
    <>
      <PageHeader
        eyebrow="Situational awareness"
        title="Alerts"
        description="Prioritaskan kondisi yang perlu diverifikasi dan tinjau status penanganannya."
      />
      <div className="mt-8">
        {isLoading ? (
          <LoadingSkeleton />
        ) : error || !data ? (
          <ErrorState />
        ) : data.length === 0 ? (
          <EmptyState
            title="Tidak ada alert"
            description="Alert aktif dan terselesaikan akan muncul di sini."
          />
        ) : (
          <div className="space-y-3">
            {data.map(({ alert, pond }) => (
              <Card key={alert.id} className="p-4 shadow-none sm:p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="flex gap-3">
                    <span
                      className={`grid size-10 shrink-0 place-items-center rounded-xl ${alert.severity === "critical" ? "bg-[var(--risk-critical-bg)] text-risk-critical" : "bg-[var(--risk-warning-bg)] text-risk-warning"}`}
                    >
                      <AlertTriangle size={19} />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{alert.title}</p>
                        <RiskBadge level={alert.severity} />
                      </div>
                      <p className="mt-1 text-sm text-foreground-muted">
                        {pond.name} · {pond.code}
                      </p>
                      <p className="mt-3 max-w-3xl text-sm leading-6 text-foreground-muted">
                        {alert.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-xs text-foreground-muted">
                    {alert.status === "resolved" ? (
                      <CheckCheck size={15} />
                    ) : (
                      <Clock3 size={15} />
                    )}
                    <span>
                      {alert.status === "new"
                        ? "Baru"
                        : alert.status === "acknowledged"
                          ? "Diketahui"
                          : "Selesai"}{" "}
                      · {formatRelativeDemoTime(alert.timestamp)}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
