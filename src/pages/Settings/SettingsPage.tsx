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
  const sections = [
    {
      icon: UserRound,
      title: "Profil pengguna",
      description: `${user?.name} · Peran ${user?.role}`,
    },
    {
      icon: BellRing,
      title: "Preferensi peringatan",
      description:
        "Kanal dan ambang notifikasi akan dikonfigurasi pada fase mendatang.",
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Kelola profil, tambak aktif, dan preferensi aplikasi."
      />
      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_.65fr]">
        <div className="space-y-3">
          {sections.map((item) => (
            <Card
              key={item.title}
              className="flex items-start gap-4 p-5 shadow-none"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-muted text-primary">
                <item.icon size={19} />
              </span>
              <div>
                <h2 className="font-semibold">{item.title}</h2>
                <p className="mt-1 text-sm leading-6 text-foreground-muted">
                  {item.description}
                </p>
              </div>
            </Card>
          ))}
          <Card className="p-5 shadow-none">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-semibold">Reset Data Demo</h2>
                <p className="mt-1 text-sm leading-6 text-foreground-muted">
                  Kembalikan status peringatan, rekomendasi, dan riwayat tindakan ke
                  kondisi awal presentasi.
                </p>
              </div>
              <Button variant="secondary" onClick={() => setResetOpen(true)}>
                Reset Data Demo
              </Button>
            </div>
          </Card>
          <Card className="p-5 shadow-none">
            <div className="flex items-start gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-muted text-primary"><Download size={19} /></span>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">Instal TambaQu</h2>
                <p className="mt-1 text-sm leading-6 text-foreground-muted">{install.installed ? "TambaQu sudah terpasang di perangkat ini." : install.installable ? "Gunakan TambaQu seperti aplikasi langsung dari perangkat Anda." : install.isIos ? "Di Safari, gunakan Share lalu pilih Add to Home Screen." : "Opsi instal akan tersedia ketika browser memenuhi kriteria PWA."}</p>
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
                <div><h2 className="font-semibold">Mode Demo</h2><p className="mt-1 text-sm leading-6 text-foreground-muted">Pilih skenario, atur kecepatan, dan aktifkan presentation mode.</p></div>
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
            Mode demo menggunakan data sintetis dan penyimpanan sesi lokal pada
            perangkat ini.
          </p>
          <dl className="mt-4 space-y-3 border-t border-border pt-4 text-sm"><div className="flex justify-between gap-3"><dt className="text-foreground-muted">Aplikasi</dt><dd className="font-semibold">{install.installed ? "Terpasang" : "Browser"}</dd></div><div className="flex justify-between gap-3"><dt className="text-foreground-muted">Koneksi app</dt><dd className="font-semibold capitalize">{connectivityMode}</dd></div><div className="flex justify-between gap-3"><dt className="text-foreground-muted">Offline storage</dt><dd className="font-semibold">{connectivity.storageAvailable ? "Aktif" : "Tidak tersedia"}</dd></div><div className="flex justify-between gap-3"><dt className="text-foreground-muted">Versi</dt><dd className="font-semibold">{__APP_VERSION__}</dd></div></dl>
        </Card>
      </div>
      <Dialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset Data Demo?"
        description={`${connectivity.pendingCount ? `Ada ${connectivity.pendingCount} perubahan belum tersinkron yang akan dihapus. ` : ""}Tindakan yang dicatat dan perubahan status peringatan akan dikembalikan ke fixture awal.`}
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
            Ya, Reset Data Demo
          </Button>
        </div>
      </Dialog>
      <Dialog open={clearOpen} onOpenChange={setClearOpen} title="Hapus data offline?" description={`${connectivity.pendingCount ? `Ada ${connectivity.pendingCount} perubahan yang belum tersinkron. ` : ""}Snapshot tambak dan antrean perubahan lokal akan dihapus dari perangkat ini. Data demo sumber tidak ikut direset.`}>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={() => setClearOpen(false)}>Batal</Button><Button variant="danger" onClick={() => { void clearOfflineData().then(async () => { await refreshSyncCounts(); setClearOpen(false); toast.success("Data offline berhasil dihapus."); }); }}>{connectivity.pendingCount ? "Tetap Hapus" : "Hapus Data Offline"}</Button></div>
      </Dialog>
    </>
  );
}
