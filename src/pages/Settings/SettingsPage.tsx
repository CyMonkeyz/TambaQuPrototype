import { BellRing, Download, HardDrive, PlayCircle, RefreshCw, UserRound } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/common/PageHeader";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Overlay";
import { toast } from "../../components/ui/toast-api";
import { useAppStore } from "../../store/app-store";
import { useSimulationStore } from "../../store/simulation-store";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { usePwaInstall } from "../../hooks/usePwaInstall";
import { getEffectiveConnectivity, useConnectivityStore } from "../../store/connectivity-store";
import { clearOfflineData } from "../../services/offline/persistenceService";
import { refreshSyncCounts } from "../../services/sync/outboxRepository";
import { syncPendingMutations } from "../../services/sync/syncManager";

const notificationOptions = [
  {
    id: "criticalAlerts",
    label: "Peringatan kritis",
    description: "Tampilkan pemberitahuan saat kolam masuk tingkat Kritis.",
  },
  {
    id: "calibrationReminders",
    label: "Pengingat kalibrasi",
    description: "Ingatkan saat jadwal kalibrasi sensor sudah dekat.",
  },
  {
    id: "dailySummary",
    label: "Ringkasan harian",
    description: "Siapkan ringkasan kondisi tambak untuk tinjauan harian.",
  },
] as const;

type NotificationPreference = (typeof notificationOptions)[number]["id"];
type NotificationPreferences = Record<NotificationPreference, boolean>;

const defaultNotificationPreferences: NotificationPreferences = {
  criticalAlerts: true,
  calibrationReminders: true,
  dailySummary: false,
};

function loadNotificationPreferences(): NotificationPreferences {
  try {
    const saved = window.localStorage.getItem("tambaqu:notification-preferences");
    return saved
      ? { ...defaultNotificationPreferences, ...JSON.parse(saved) }
      : defaultNotificationPreferences;
  } catch {
    return defaultNotificationPreferences;
  }
}

export function SettingsPage() {
  useDocumentTitle("Pengaturan");
  const user = useAppStore((state) => state.activeUser);
  const farm = useAppStore((state) => state.activeFarm);
  const [resetOpen, setResetOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const resetSimulation = useSimulationStore((state) => state.reset);
  const connectivity = useConnectivityStore();
  const install = usePwaInstall();
  const connectivityMode = getEffectiveConnectivity();
  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferences>(loadNotificationPreferences);

  const updateNotificationPreference = (
    key: NotificationPreference,
    enabled: boolean,
  ) => {
    const next = { ...notificationPreferences, [key]: enabled };
    setNotificationPreferences(next);
    window.localStorage.setItem(
      "tambaqu:notification-preferences",
      JSON.stringify(next),
    );
  };
  return (
    <>
      <PageHeader
        eyebrow="Ruang kerja"
        title="Pengaturan"
        description="Atur pemberitahuan, penyimpanan, dan perilaku TambaQu di perangkat ini."
      />
      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_.65fr]">
        <div className="space-y-3">
          <Card className="flex items-start gap-4 p-5 shadow-none">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-muted text-primary">
              <UserRound size={19} />
            </span>
            <div>
              <h2 className="font-semibold">Profil pengguna</h2>
              <p className="mt-1 text-sm leading-6 text-foreground-muted">
                {user?.name} · {user?.role}
              </p>
            </div>
          </Card>
          <Card className="p-5 shadow-none">
            <div className="flex items-start gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-muted text-primary">
                <BellRing size={19} />
              </span>
              <div>
                <h2 className="font-semibold">Pemberitahuan</h2>
                <p className="mt-1 text-sm leading-6 text-foreground-muted">
                  Pilihan tersimpan di perangkat ini dan tetap ada saat halaman
                  dibuka kembali.
                </p>
              </div>
            </div>
            <div className="mt-5 divide-y divide-border border-t border-border">
              {notificationOptions.map((option) => {
                const enabled = notificationPreferences[option.id];
                return (
                  <div
                    key={option.id}
                    className="flex items-center justify-between gap-5 py-4"
                  >
                    <div>
                      <p className="text-sm font-semibold">{option.label}</p>
                      <p className="mt-1 text-xs leading-5 text-foreground-muted">
                        {option.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      aria-label={`${option.label}: ${enabled ? "aktif" : "nonaktif"}`}
                      className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors ${enabled ? "border-primary bg-primary" : "border-border bg-[#dce7e5]"}`}
                      onClick={() =>
                        updateNotificationPreference(option.id, !enabled)
                      }
                    >
                      <span
                        className={`absolute top-1 size-[18px] rounded-full bg-white shadow-sm transition-[left] ${enabled ? "left-[25px]" : "left-1"}`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="p-5 shadow-none">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-semibold">Atur ulang data demo</h2>
                <p className="mt-1 text-sm leading-6 text-foreground-muted">
                  Kembalikan status peringatan, rekomendasi, dan riwayat tindakan ke
                  kondisi awal presentasi.
                </p>
              </div>
              <Button variant="secondary" onClick={() => setResetOpen(true)}>
                Atur Ulang
              </Button>
            </div>
          </Card>
          <Card className="p-5 shadow-none">
            <div className="flex items-start gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-muted text-primary"><Download size={19} /></span>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">Instal TambaQu</h2>
                <p className="mt-1 text-sm leading-6 text-foreground-muted">{install.installed ? "TambaQu sudah terpasang di perangkat ini." : install.installable ? "Gunakan TambaQu seperti aplikasi langsung dari perangkat Anda." : install.isIos ? "Di Safari, buka menu Bagikan lalu pilih Tambahkan ke Layar Utama." : "Pilihan instal akan muncul saat browser mendukung pemasangan aplikasi."}</p>
                {install.installable && !install.installed && <Button className="mt-3" onClick={() => void install.install()}>Instal Aplikasi</Button>}
              </div>
            </div>
          </Card>
          <Card className="p-5 shadow-none">
            <div className="flex items-start gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-muted text-primary"><HardDrive size={19} /></span>
              <div className="min-w-0 flex-1"><h2 className="font-semibold">Penyimpanan Offline</h2><p className="mt-1 text-sm leading-6 text-foreground-muted">{connectivity.storageAvailable ? "Penyimpanan lokal aktif untuk snapshot tambak, riwayat sensor, dan antrean sinkronisasi." : "Penyimpanan offline tidak tersedia pada browser ini."}</p><Button className="mt-3" variant="secondary" disabled={!connectivity.storageAvailable} onClick={() => setClearOpen(true)}>Hapus Data Offline</Button></div>
            </div>
          </Card>
          <Card className="p-5 shadow-none">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-muted text-primary"><RefreshCw size={19} /></span><div><h2 className="font-semibold">Sinkronisasi</h2><p className="mt-1 text-sm leading-6 text-foreground-muted">{connectivity.pendingCount ? `${connectivity.pendingCount} perubahan menunggu sinkronisasi.` : "Semua perubahan sudah tersinkron."}</p></div></div><Button variant="secondary" disabled={connectivityMode === "offline" || connectivity.pendingCount === 0} onClick={() => void syncPendingMutations()}>Sinkronkan Sekarang</Button></div>
          </Card>
          <Card className="p-5 shadow-none">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-muted text-primary"><PlayCircle size={19} /></span>
                <div><h2 className="font-semibold">Mode demo</h2><p className="mt-1 text-sm leading-6 text-foreground-muted">Pilih skenario, atur kecepatan, dan gunakan tampilan presentasi.</p></div>
              </div>
              <Link className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white" to="/app/demo-control">Buka Kontrol Demo</Link>
            </div>
          </Card>
        </div>
        <Card className="h-fit p-5 shadow-none">
          <p className="text-sm font-semibold text-primary">Tambak aktif</p>
          <h2 className="mt-2 text-lg font-semibold">{farm?.name}</h2>
          <p className="mt-1 text-sm text-foreground-muted">{farm?.location}</p>
          <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm text-foreground-muted">
              Lingkungan aplikasi
            </span>
            <StatusBadge status="active" />
          </div>
          <p className="mt-4 rounded-xl bg-surface-muted p-3 text-xs leading-5 text-foreground-muted">
            Mode demo menggunakan data contoh dan penyimpanan sesi lokal pada
            perangkat ini.
          </p>
          <dl className="mt-4 space-y-3 border-t border-border pt-4 text-sm"><div className="flex justify-between gap-3"><dt className="text-foreground-muted">Aplikasi</dt><dd className="font-semibold">{install.installed ? "Terpasang" : "Browser"}</dd></div><div className="flex justify-between gap-3"><dt className="text-foreground-muted">Koneksi aplikasi</dt><dd className="font-semibold capitalize">{connectivityMode}</dd></div><div className="flex justify-between gap-3"><dt className="text-foreground-muted">Penyimpanan offline</dt><dd className="font-semibold">{connectivity.storageAvailable ? "Aktif" : "Tidak tersedia"}</dd></div><div className="flex justify-between gap-3"><dt className="text-foreground-muted">Versi</dt><dd className="font-semibold">{__APP_VERSION__}</dd></div></dl>
        </Card>
      </div>
      <Dialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Atur ulang seluruh data demo?"
        description={`${connectivity.pendingCount ? `Ada ${connectivity.pendingCount} perubahan belum tersinkron yang akan dihapus. ` : ""}Tindakan yang dicatat dan perubahan status peringatan akan dikembalikan ke kondisi awal.`}
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setResetOpen(false)}>
            Batal
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              resetSimulation();
              setResetOpen(false);
              toast.success("Data demo berhasil direset.");
            }}
          >
            Ya, Atur Ulang
          </Button>
        </div>
      </Dialog>
      <Dialog open={clearOpen} onOpenChange={setClearOpen} title="Hapus data offline?" description={`${connectivity.pendingCount ? `Ada ${connectivity.pendingCount} perubahan yang belum tersinkron. ` : ""}Snapshot tambak dan antrean perubahan lokal akan dihapus dari perangkat ini. Data demo sumber tidak ikut direset.`}>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={() => setClearOpen(false)}>Batal</Button><Button variant="danger" onClick={() => { void clearOfflineData().then(async () => { await refreshSyncCounts(); setClearOpen(false); toast.success("Data offline berhasil dihapus."); }); }}>{connectivity.pendingCount ? "Tetap Hapus" : "Hapus Data Offline"}</Button></div>
      </Dialog>
    </>
  );
}
