import { BatteryMedium, RadioTower, RefreshCw } from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { Card } from "../../components/ui/Card";
import { ErrorState, LoadingSkeleton } from "../../components/ui/Feedback";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { repositories } from "../../data/repositories";
import type { Pond } from "../../domain/pond";
import type { SensorDevice } from "../../domain/sensor";
import { useRepositoryData } from "../../hooks/useRepositoryData";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useAppStore } from "../../store/app-store";
import { formatRelativeDemoTime } from "../../utils/formatters";

async function loadDevices(
  farmId: string,
): Promise<Array<{ device: SensorDevice; pond: Pond }>> {
  const [devices, ponds] = await Promise.all([
    repositories.sensor.getDevicesByFarmId(farmId),
    repositories.pond.getByFarmId(farmId),
  ]);
  return devices.flatMap((device) => {
    const pond = ponds.find((item) => item.id === device.pondId);
    return pond ? [{ device, pond }] : [];
  });
}

export function DevicesPage() {
  useDocumentTitle("Perangkat");
  const farmId = useAppStore((state) => state.activeFarm?.id ?? "");
  const { data, isLoading, error } = useRepositoryData(
    () => loadDevices(farmId),
    farmId,
  );
  return (
    <>
      <PageHeader
        eyebrow="Sensor network"
        title="Devices"
        description="Pantau status koneksi, daya, firmware, dan waktu sinkronisasi sensor setiap kolam."
      />
      <div className="mt-8">
        {isLoading ? (
          <LoadingSkeleton rows={4} />
        ) : error || !data ? (
          <ErrorState />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.map(({ device, pond }) => (
              <Card key={device.id} className="p-5 shadow-none">
                <div className="flex items-start justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-surface-muted text-primary">
                    <RadioTower size={21} />
                  </span>
                  <StatusBadge status={device.connectionStatus} />
                </div>
                <h2 className="mt-4 font-semibold">{device.serialNumber}</h2>
                <p className="mt-1 text-sm text-foreground-muted">
                  {pond.name} · Firmware {device.firmwareVersion}
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-surface-muted p-3">
                    <span className="flex items-center gap-2 text-xs text-foreground-muted">
                      <BatteryMedium size={15} />
                      Baterai
                    </span>
                    <strong className="mt-2 block">
                      {device.batteryPercentage}%
                    </strong>
                  </div>
                  <div className="rounded-xl bg-surface-muted p-3">
                    <span className="flex items-center gap-2 text-xs text-foreground-muted">
                      <RefreshCw size={15} />
                      Sinkron
                    </span>
                    <strong className="mt-2 block text-xs">
                      {formatRelativeDemoTime(device.lastSyncAt)}
                    </strong>
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
