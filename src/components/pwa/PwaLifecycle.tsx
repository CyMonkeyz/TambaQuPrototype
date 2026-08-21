import { Download, RefreshCw, X } from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "../ui/Button";
import { useSimulationStore } from "../../store/simulation-store";
import { usePwaInstall } from "../../hooks/usePwaInstall";

export function PwaLifecycle() {
  const presentationMode = useSimulationStore((state) => state.presentationMode);
  const simulationStatus = useSimulationStore((state) => state.status);
  usePwaInstall();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error("PWA registration failed", error);
    },
  });

  if (!needRefresh || presentationMode || simulationStatus === "running") return null;
  return (
    <section className="no-print fixed bottom-5 right-5 z-50 w-[calc(100%-2.5rem)] max-w-sm rounded-2xl border border-border bg-surface p-4 shadow-2xl" aria-live="polite">
      <button className="absolute right-3 top-3 grid size-9 place-items-center rounded-xl text-foreground-muted hover:bg-surface-muted" aria-label="Tutup pemberitahuan pembaruan" onClick={() => setNeedRefresh(false)}><X size={17} /></button>
      <span className="grid size-10 place-items-center rounded-xl bg-[#dff3f0] text-primary"><Download size={19} /></span>
      <h2 className="mt-3 font-semibold">Versi Baru Tersedia</h2>
      <p className="mt-1 pr-6 text-sm leading-6 text-foreground-muted">Pembaruan TambaQu siap digunakan. Aplikasi tidak akan memuat ulang tanpa pilihan Anda.</p>
      <div className="mt-4 flex gap-2"><Button leadingIcon={<RefreshCw size={16} />} onClick={() => updateServiceWorker(true)}>Perbarui Sekarang</Button><Button variant="ghost" onClick={() => setNeedRefresh(false)}>Nanti</Button></div>
    </section>
  );
}
