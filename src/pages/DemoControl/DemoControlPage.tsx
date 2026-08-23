import { ChevronRight, CloudOff, MonitorUp, Pause, Play, RotateCcw, StepForward, Wifi, WifiLow } from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { demoScenarios, getScenario } from "../../services/simulation/scenarioDefinitions";
import { useSimulationStore } from "../../store/simulation-store";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { Dialog } from "../../components/ui/Overlay";
import { toast } from "../../components/ui/toast-api";
import { useConnectivityStore } from "../../store/connectivity-store";
import { syncPendingMutations } from "../../services/sync/syncManager";

const statusLabels: Record<string, string> = {
  idle: "Siap",
  running: "Berjalan",
  paused: "Dijeda",
  completed: "Selesai",
};

const riskLevelLabels: Record<string, string> = {
  safe: "Aman",
  warning: "Waspada",
  critical: "Kritis",
};

export function DemoControlPage() {
  useDocumentTitle("Kontrol Demo");
  const store = useSimulationStore();
  const [resetOpen, setResetOpen] = useState(false);
  const connectivity = useConnectivityStore();
  const scenario = getScenario(store.scenarioId);
  const progress = ((store.currentStep + 1) / scenario.steps.length) * 100;
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Simulator produk" title="Kontrol Demo" description="Pilih skenario lalu lihat perubahan yang sama mengalir ke beranda, peringatan, PondBrain, dan laporan." actions={<Button variant={store.presentationMode ? "primary" : "secondary"} leadingIcon={<MonitorUp size={17} />} onClick={store.togglePresentationMode}>{store.presentationMode ? "Keluar Mode Presentasi" : "Mode Presentasi"}</Button>} />
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="Pilih skenario demo">
        {demoScenarios.map((item) => <button key={item.id} onClick={() => store.selectScenario(item.id)} className={`rounded-2xl border bg-surface p-5 text-left transition ${store.scenarioId === item.id ? "border-primary ring-2 ring-[#c5ebe6]" : "border-border hover:border-[#9fcac5]"}`}><div className="flex items-center justify-between"><h2 className="font-semibold">{item.name}</h2><span className="text-xs font-semibold text-primary">{item.steps.length} langkah</span></div><p className="mt-2 text-sm leading-6 text-foreground-muted">{item.description}</p></button>)}
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-primary">{statusLabels[store.status] ?? store.status}</p><h2 className="mt-2 text-2xl font-semibold">{scenario.steps[store.currentStep]?.eventLabel}</h2><p className="mt-2 text-sm text-foreground-muted">Kolam B · Skor risiko {scenario.steps[store.currentStep]?.riskScore} · {riskLevelLabels[scenario.steps[store.currentStep]?.riskLevel] ?? scenario.steps[store.currentStep]?.riskLevel}</p></div><div className="rounded-xl bg-surface-muted px-4 py-3 text-center"><p className="text-xs text-foreground-muted">Kemajuan</p><p className="mt-1 text-lg font-semibold">{store.currentStep + 1}/{scenario.steps.length}</p></div></div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-muted"><div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} /></div>
          <div className="mt-6 flex flex-wrap gap-2">
            {store.status === "running" ? <Button leadingIcon={<Pause size={17} />} onClick={store.pause}>Jeda</Button> : <Button leadingIcon={<Play size={17} />} disabled={store.status === "completed"} onClick={store.start}>Mulai / Lanjutkan</Button>}
            <Button variant="secondary" leadingIcon={<StepForward size={17} />} disabled={store.status === "completed"} onClick={store.next}>Langkah Berikutnya</Button>
            <Button variant="ghost" leadingIcon={<RotateCcw size={17} />} onClick={() => setResetOpen(true)}>Atur Ulang</Button>
          </div>
          <div className="mt-5 flex items-center gap-2"><span className="text-xs font-semibold text-foreground-muted">Kecepatan</span>{([1, 2, 4] as const).map((speed) => <Button key={speed} className="min-h-9 px-3 py-1 text-xs" variant={store.speed === speed ? "primary" : "secondary"} onClick={() => store.setSpeed(speed)}>{speed}×</Button>)}</div>
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="font-semibold">Urutan Skenario</h2>
          <ol className="mt-4 space-y-1">{scenario.steps.map((step, index) => <li key={`${step.eventLabel}-${index}`} className={`flex gap-3 rounded-xl p-3 ${index === store.currentStep ? "bg-[#e8f6f3]" : ""}`}><span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${index <= store.currentStep ? "bg-primary text-white" : "bg-surface-muted text-foreground-muted"}`}>{index + 1}</span><div><p className="text-sm font-semibold">{step.eventLabel}</p><p className="mt-1 text-xs text-foreground-muted">Skor {step.riskScore} · DO {step.reading.dissolvedOxygen ?? "tetap"} · NH3 {step.reading.ammonia ?? "tetap"}</p></div>{index === store.currentStep && <ChevronRight className="ml-auto shrink-0 text-primary" size={16} />}</li>)}</ol>
        </Card>
      </section>
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div><h2 className="font-semibold">Simulasi Koneksi Aplikasi</h2><p className="mt-1 text-sm leading-6 text-foreground-muted">Mengontrol perilaku data dan sinkronisasi dalam demo. Ini tidak memutus koneksi browser atau sensor secara nyata.</p></div>
          <div className="flex flex-wrap gap-2">
            <Button variant={connectivity.demoOverride === "online" ? "primary" : "secondary"} leadingIcon={<Wifi size={16} />} onClick={() => { connectivity.setDemoOverride("online"); void syncPendingMutations(); }}>Online</Button>
            <Button variant={connectivity.demoOverride === "offline" ? "primary" : "secondary"} leadingIcon={<CloudOff size={16} />} onClick={() => connectivity.setDemoOverride("offline")}>Offline</Button>
            <Button variant={connectivity.demoOverride === "degraded" ? "primary" : "secondary"} leadingIcon={<WifiLow size={16} />} onClick={() => { connectivity.setDemoOverride("degraded"); void syncPendingMutations(); }}>Koneksi Terbatas</Button>
            <Button variant={connectivity.demoOverride === "auto" ? "primary" : "ghost"} onClick={() => { connectivity.setDemoOverride("auto"); if (connectivity.browserOnline) void syncPendingMutations(); }}>Ikuti Browser</Button>
          </div>
        </div>
      </Card>
      <p className="rounded-xl border border-border bg-surface p-4 text-xs leading-5 text-foreground-muted">Setiap langkah memperbarui data Kolam B secara konsisten di seluruh halaman. Atur ulang untuk kembali ke skor risiko 22 dan menghapus perubahan selama sesi demo.</p>
      <Dialog open={resetOpen} onOpenChange={setResetOpen} title="Reset seluruh data demo?" description={`${connectivity.pendingCount ? `Ada ${connectivity.pendingCount} perubahan yang belum tersinkron. ` : ""}Sensor, peringatan, rekomendasi, catatan tindakan, antrean sinkronisasi, dan status simulator akan dikembalikan ke kondisi awal.`}>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setResetOpen(false)}>Batal</Button>
          <Button variant="danger" onClick={() => { store.reset(); setResetOpen(false); toast.success("Data demo kembali ke kondisi awal."); }}>Ya, Reset Demo</Button>
        </div>
      </Dialog>
    </div>
  );
}
