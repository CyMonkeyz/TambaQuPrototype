import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/common/PageHeader";
import { AlertCard } from "../../components/domain/AlertCard";
import {
  AlertDetail,
  type AlertDetailData,
} from "../../components/domain/AlertDetail";
import { AlertSummary } from "../../components/domain/AlertSummary";
import { Card } from "../../components/ui/Card";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "../../components/ui/Feedback";
import { Dialog } from "../../components/ui/Overlay";
import { toast } from "../../components/ui/toast-api";
import { repositories } from "../../data/repositories";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useRepositoryData } from "../../hooks/useRepositoryData";
import { useDemoRepositoryRevision } from "../../hooks/useDemoRepositoryRevision";
import { trackProductEvent } from "../../services/analytics";
import { filterAlerts, type AlertFilter } from "../../services/selectors";
import { useAppStore } from "../../store/app-store";

async function loadAlertCenter(farmId: string): Promise<AlertDetailData[]> {
  const [alerts, ponds] = await Promise.all([
    repositories.alert.getByFarmId(farmId),
    repositories.pond.getByFarmId(farmId),
  ]);
  const details = await Promise.all(
    alerts.map(async (alert) => {
      const pond = ponds.find((item) => item.id === alert.pondId);
      const [risk, reading, actions] = await Promise.all([
        repositories.risk.getCurrentByPondId(alert.pondId),
        repositories.sensor.getCurrentReading(alert.pondId),
        repositories.action.getByPondId(alert.pondId),
      ]);
      if (!pond || !risk || !reading) return null;
      const recommendations = await repositories.risk.getRecommendations(
        risk.id,
      );
      return { alert, pond, risk, reading, recommendations, actions };
    }),
  );
  return details.filter((item): item is AlertDetailData => item !== null);
}

const filterOptions: Array<{ value: AlertFilter; label: string }> = [
  { value: "all", label: "Semua" },
  { value: "active", label: "Aktif" },
  { value: "critical", label: "Kritis" },
  { value: "resolved", label: "Selesai" },
];

export function AlertsPage() {
  useDocumentTitle("Peringatan");
  const farmId = useAppStore((state) => state.activeFarm?.id ?? "");
  const user = useAppStore((state) => state.activeUser);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<AlertFilter>("all");
  const [isUpdating, setIsUpdating] = useState(false);
  const revision = useDemoRepositoryRevision();
  const { data, isLoading, error, retry } = useRepositoryData(
    () => loadAlertCenter(farmId),
    `${farmId}:${revision}`,
  );
  const selectedId = searchParams.get("alert");
  const selected = data?.find((item) => item.alert.id === selectedId) ?? null;
  const filtered = useMemo(() => {
    if (!data) return [];
    const alerts = filterAlerts(
      data.map((item) => item.alert),
      filter,
    );
    const ids = new Set(alerts.map((alert) => alert.id));
    return data
      .filter((item) => ids.has(item.alert.id))
      .sort((a, b) => {
        if (a.alert.status === "resolved" && b.alert.status !== "resolved")
          return 1;
        if (b.alert.status === "resolved" && a.alert.status !== "resolved")
          return -1;
        if (a.alert.severity !== b.alert.severity)
          return a.alert.severity === "critical" ? -1 : 1;
        return Date.parse(b.alert.timestamp) - Date.parse(a.alert.timestamp);
      });
  }, [data, filter]);

  const updateAlert = async (operation: "acknowledge" | "resolve") => {
    if (!selected || !user) return;
    setIsUpdating(true);
    try {
      const timestamp = selected.reading.timestamp;
      if (operation === "acknowledge") {
        await repositories.alert.acknowledge(
          selected.alert.id,
          user.id,
          timestamp,
        );
        toast.success("Peringatan ditandai sudah ditinjau.");
        trackProductEvent({
          name: "alert_acknowledged",
          properties: { alertId: selected.alert.id },
        });
      } else {
        await repositories.alert.resolve(selected.alert.id, user.id, timestamp);
        toast.success("Tindak lanjut berhasil dicatat pada peringatan.");
      }
      retry();
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Situational awareness"
        title="Peringatan"
        description="Tinjau kejadian yang membutuhkan perhatian tanpa menyamakannya dengan diagnosis atau kondisi biologis akhir."
      />
      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : error || !data ? (
        <ErrorState onRetry={retry} />
      ) : (
        <>
          <Card className="p-5 sm:p-6">
            <AlertSummary alerts={data.map((item) => item.alert)} />
          </Card>
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            aria-label="Filter peringatan"
          >
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`min-h-11 shrink-0 rounded-xl border px-4 text-sm font-semibold ${filter === option.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-foreground-muted"}`}
                aria-pressed={filter === option.value}
                onClick={() => setFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          {filtered.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {filtered.map((item) => (
                <AlertCard
                  key={item.alert.id}
                  alert={item.alert}
                  pond={item.pond}
                  onOpen={() => {
                    setSearchParams({ alert: item.alert.id });
                    trackProductEvent({
                      name: "alert_viewed",
                      properties: { alertId: item.alert.id },
                    });
                  }}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Tidak ada peringatan pada filter ini"
              description="Kondisi tambak tetap dalam pemantauan. Pilih filter lain untuk melihat riwayat."
            />
          )}
        </>
      )}
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSearchParams({})}
        title="Detail Peringatan"
        description="Konteks kejadian, data terkait, dan status tindak lanjut."
      >
        {selected && (
          <AlertDetail
            data={selected}
            isUpdating={isUpdating}
            onAcknowledge={() => updateAlert("acknowledge")}
            onResolve={() => updateAlert("resolve")}
          />
        )}
      </Dialog>
    </div>
  );
}
