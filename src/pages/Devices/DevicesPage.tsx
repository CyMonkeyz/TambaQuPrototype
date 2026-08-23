import { BatteryMedium, CalendarClock, RadioTower, RefreshCw, Settings2 } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "../../components/common/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ErrorState, LoadingSkeleton } from "../../components/ui/Feedback";
import { Dialog } from "../../components/ui/Overlay";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { repositories } from "../../data/repositories";
import type { Pond } from "../../domain/pond";
import type { SensorDevice, SensorParameter } from "../../domain/sensor";
import { useDemoRepositoryRevision } from "../../hooks/useDemoRepositoryRevision";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useRepositoryData } from "../../hooks/useRepositoryData";
import {
  daysUntilCalibration,
  filterDevices,
  getDeviceHealthStatus,
  getSignalLabel,
  sortDevicesByAttention,
  type DeviceFilter,
} from "../../services/device/deviceService";
import { useAppStore } from "../../store/app-store";
import { formatDate, formatWibTime, getSensorMeta } from "../../utils/formatters";

interface DeviceRow { device: SensorDevice; pond: Pond }

async function loadDevices(farmId: string): Promise<DeviceRow[]> {
  const [devices, ponds] = await Promise.all([
    repositories.sensor.getDevicesByFarmId(farmId),
    repositories.pond.getByFarmId(farmId),
  ]);
  return sortDevicesByAttention(devices).flatMap((device) => {
    const pond = ponds.find((item) => item.id === device.pondId);
    return pond ? [{ device, pond }] : [];
  });
}

const healthLabels = {
  healthy: "Sehat",
  attention: "Perlu perhatian",
  offline: "Offline",
  maintenance: "Pemeliharaan",
};
const parameters: SensorParameter[] = [
  "dissolvedOxygen", "ph", "temperature", "salinity", "ammonia", "nitrite",
];

export function DevicesPage() {
  useDocumentTitle("Perangkat");
  const farmId = useAppStore((state) => state.activeFarm?.id ?? "");
  const revision = useDemoRepositoryRevision();
  const { data, isLoading, error, retry } = useRepositoryData(
    () => loadDevices(farmId),
    `${farmId}:${revision}`,
  );
  const [filter, setFilter] = useState<DeviceFilter>("all");
  const [selected, setSelected] = useState<DeviceRow | null>(null);
  const filtered = useMemo(
    () => data?.filter((row) => filterDevices([row.device], filter).length) ?? [],
    [data, filter],
  );
  const counts = (data ?? []).reduce(
    (acc, row) => {
      const status = getDeviceHealthStatus(row.device);
      acc[status] += 1;
      return acc;
    },
    { healthy: 0, attention: 0, offline: 0, maintenance: 0 },
  );

  return (
    <>
      <PageHeader
        eyebrow="Jaringan sensor"
        title="Manajemen Perangkat"
        description="Pantau kesehatan koneksi, daya, sinyal, firmware, dan jadwal kalibrasi seluruh perangkat."
      />
      <section className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Ringkasan perangkat">
        {(["healthy", "attention", "offline", "maintenance"] as const).map((status) => (
          <Card key={status} className="p-4 shadow-none">
            <p className="text-xs text-foreground-muted">{healthLabels[status]}</p>
            <p className="mt-2 text-2xl font-semibold">{counts[status]}</p>
          </Card>
        ))}
      </section>
      <div className="mt-5 flex flex-wrap gap-2" aria-label="Filter perangkat">
        {(["all", "attention", "offline", "maintenance"] as const).map((item) => (
          <Button
            key={item}
            variant={filter === item ? "primary" : "secondary"}
            className="min-h-9 px-3 py-1 text-xs"
            onClick={() => setFilter(item)}
          >
            {item === "all" ? "Semua" : healthLabels[item]}
          </Button>
        ))}
      </div>
      <div className="mt-5">
        {isLoading ? <LoadingSkeleton rows={4} /> : error || !data ? <ErrorState onRetry={retry} /> : (
          <>
            <div className="grid gap-4 lg:hidden">
              {filtered.map((row) => (
                <Card key={row.device.id} className="p-5 shadow-none">
                  <div className="flex items-start justify-between">
                    <span className="grid size-11 place-items-center rounded-xl bg-surface-muted text-primary"><RadioTower size={21} /></span>
                    <StatusBadge status={row.device.connectionStatus} />
                  </div>
                  <h2 className="mt-4 font-semibold">{row.device.serialNumber}</h2>
                  <p className="mt-1 text-sm text-foreground-muted">{row.pond.name} · {healthLabels[getDeviceHealthStatus(row.device)]}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl bg-surface-muted p-3"><BatteryMedium size={15} /><strong className="mt-2 block">{row.device.batteryPercentage}%</strong></div>
                    <div className="rounded-xl bg-surface-muted p-3"><RefreshCw size={15} /><strong className="mt-2 block">{formatWibTime(row.device.lastSyncAt)}</strong></div>
                  </div>
                  <Button className="mt-4 w-full" variant="secondary" onClick={() => setSelected(row)}>Detail perangkat</Button>
                </Card>
              ))}
            </div>
            <Card className="hidden overflow-hidden lg:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-muted text-xs text-foreground-muted">
                  <tr>{["Perangkat", "Kolam", "Kesehatan", "Koneksi", "Sinyal", "Baterai", "Firmware", "Kalibrasi", "Aksi"].map((label) => <th key={label} scope="col" className="px-4 py-3 font-semibold">{label}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((row) => (
                    <tr key={row.device.id}>
                      <td className="px-4 py-4 font-semibold">{row.device.serialNumber}</td>
                      <td className="px-4 py-4">{row.pond.name}</td>
                      <td className="px-4 py-4 text-xs font-semibold">{healthLabels[getDeviceHealthStatus(row.device)]}</td>
                      <td className="px-4 py-4"><StatusBadge status={row.device.connectionStatus} /></td>
                      <td className="px-4 py-4">{getSignalLabel(row.device)}</td>
                      <td className="px-4 py-4 tabular-nums">{row.device.batteryPercentage}%</td>
                      <td className="px-4 py-4">{row.device.firmwareVersion}</td>
                      <td className="px-4 py-4 text-xs">{formatDate(row.device.nextCalibrationAt)}</td>
                      <td className="px-4 py-4"><Button variant="ghost" className="min-h-9 px-3" onClick={() => setSelected(row)}>Detail</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </>
        )}
      </div>
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
        title={selected ? `${selected.device.serialNumber} · ${selected.pond.name}` : "Detail perangkat"}
        description="Informasi perangkat dan kesehatan sensor pada data demo."
      >
        {selected && (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-surface-muted p-3"><dt className="text-xs text-foreground-muted">Instalasi</dt><dd className="mt-1 font-semibold">{formatDate(selected.device.installationDate)}</dd></div>
              <div className="rounded-xl bg-surface-muted p-3"><dt className="text-xs text-foreground-muted">Kalibrasi berikutnya</dt><dd className="mt-1 font-semibold">{daysUntilCalibration(selected.device, selected.device.lastSyncAt)} hari</dd></div>
              <div className="rounded-xl bg-surface-muted p-3"><dt className="text-xs text-foreground-muted">Sinyal</dt><dd className="mt-1 font-semibold">{getSignalLabel(selected.device)}</dd></div>
              <div className="rounded-xl bg-surface-muted p-3"><dt className="text-xs text-foreground-muted">Sinkron terakhir</dt><dd className="mt-1 font-semibold">{formatWibTime(selected.device.lastSyncAt)}</dd></div>
            </dl>
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold"><Settings2 size={16} /> Kondisi sensor</h3>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {parameters.map((parameter, index) => (
                  <div key={parameter} className="flex items-center justify-between rounded-xl border border-border p-3 text-xs">
                    <span>{getSensorMeta(parameter).shortLabel}</span>
                    <span className={selected.device.pondId === "pond-b" && index === 4 ? "font-semibold text-risk-warning" : "font-semibold text-risk-safe"}>{selected.device.pondId === "pond-b" && index === 4 ? "Cek kalibrasi" : "Normal"}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="flex items-start gap-2 rounded-xl bg-surface-muted p-3 text-xs leading-5 text-foreground-muted"><CalendarClock className="mt-0.5 shrink-0" size={15} /> Status ini merupakan simulasi operasional, bukan diagnosis perangkat nyata.</p>
          </div>
        )}
      </Dialog>
    </>
  );
}
