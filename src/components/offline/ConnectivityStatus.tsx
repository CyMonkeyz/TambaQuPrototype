import { AlertTriangle, CloudOff, RefreshCw, Wifi, WifiLow } from "lucide-react";
import { useState } from "react";
import { getEffectiveConnectivity, useConnectivityStore } from "../../store/connectivity-store";
import { getOutboxItems } from "../../services/sync/outboxRepository";
import { retryFailedSync, syncPendingMutations } from "../../services/sync/syncManager";
import { useDemoRepositoryRevision } from "../../hooks/useDemoRepositoryRevision";
import { useRepositoryData } from "../../hooks/useRepositoryData";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Overlay";

export function OfflineBanner() {
  const state = useConnectivityStore();
  const mode = getEffectiveConnectivity();
  if (mode === "online" && state.syncState === "idle" && state.storageAvailable) return null;
  const offline = mode === "offline";
  const syncing = state.syncState === "syncing";
  const error = state.syncState === "error";
  return (
    <div className={`no-print border-b px-5 py-2.5 text-xs lg:px-8 ${offline || error ? "border-[#efd69c] bg-[#fff7e4] text-[#7b5715]" : "border-[#bfe1dc] bg-[#e8f6f3] text-[#255b57]"}`} role="status" aria-live="polite">
      <div className="mx-auto flex max-w-[1600px] items-start gap-2">
        {offline ? <CloudOff className="mt-0.5 shrink-0" size={15} /> : error ? <AlertTriangle className="mt-0.5 shrink-0" size={15} /> : <RefreshCw className={`mt-0.5 shrink-0 ${syncing ? "animate-spin" : ""}`} size={15} />}
        <p><strong>{!state.storageAvailable ? "Penyimpanan offline tidak tersedia." : offline ? "Mode Offline." : error ? "Sinkronisasi tertunda." : "Menyinkronkan."}</strong>{" "}{!state.storageAvailable ? "TambaQu tetap dapat digunakan saat online, tetapi data tidak dapat disimpan untuk akses offline." : offline ? `Menampilkan data terakhir yang tersimpan.${state.pendingCount ? ` ${state.pendingCount} perubahan akan disinkronkan saat koneksi kembali.` : ""}` : state.lastSyncMessage ?? `${state.pendingCount} perubahan sedang diproses.`}</p>
      </div>
    </div>
  );
}

export function ConnectivityIndicator() {
  const [open, setOpen] = useState(false);
  const state = useConnectivityStore();
  const revision = useDemoRepositoryRevision();
  const mode = getEffectiveConnectivity();
  const outbox = useRepositoryData(getOutboxItems, `outbox:${revision}:${open}`);
  const Icon = state.syncState === "syncing" ? RefreshCw : mode === "offline" ? CloudOff : mode === "degraded" ? WifiLow : Wifi;
  const label = state.syncState === "syncing" ? "Menyinkronkan" : mode === "offline" ? "Offline" : mode === "degraded" ? "Koneksi terbatas" : "Online";
  return (
    <>
      <button className="no-print inline-flex min-h-10 items-center gap-2 rounded-xl px-2.5 text-xs font-semibold text-foreground-muted hover:bg-surface-muted" onClick={() => setOpen(true)} aria-label={`${label}. ${state.pendingCount} perubahan belum tersinkron.`}>
        <Icon className={state.syncState === "syncing" ? "animate-spin text-primary" : mode === "offline" ? "text-risk-warning" : "text-primary"} size={16} />
        <span className="hidden xl:inline">{label}</span>
        {state.pendingCount > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-[var(--risk-warning-bg)] px-1.5 py-0.5 text-[10px] text-risk-warning">{state.pendingCount}</span>}
      </button>
      <Dialog open={open} onOpenChange={setOpen} title="Status Sinkronisasi" description="Perubahan offline diproses berurutan dan disimpan sampai berhasil tersinkron.">
        <div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-surface-muted p-3"><p className="text-xs text-foreground-muted">Menunggu</p><p className="mt-1 text-xl font-semibold">{state.pendingCount}</p></div><div className="rounded-xl bg-surface-muted p-3"><p className="text-xs text-foreground-muted">Gagal</p><p className="mt-1 text-xl font-semibold">{state.failedCount}</p></div></div>
        <div className="mt-4 max-h-52 space-y-2 overflow-auto">{outbox.data?.map((item) => <div key={item.id} className="rounded-xl border border-border p-3"><div className="flex justify-between gap-2"><p className="text-sm font-semibold">{item.operation === "ACTION_LOG_CREATE" ? "Tindakan lapangan" : "Pembaruan alert"}</p><span className="text-xs capitalize text-foreground-muted">{item.status}</span></div><p className="mt-1 text-xs text-foreground-muted">{item.entityId} · Percobaan {item.attemptCount}</p>{item.lastError && <p className="mt-1 text-xs text-risk-warning">{item.lastError}</p>}</div>)}</div>
        {!outbox.data?.length && <p className="mt-4 rounded-xl bg-[var(--risk-safe-bg)] p-3 text-sm text-risk-safe">Semua perubahan sudah tersinkron.</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-2">{state.failedCount > 0 && <Button variant="secondary" onClick={() => void retryFailedSync()}>Coba Lagi</Button>}<Button disabled={mode === "offline" || state.pendingCount === 0} onClick={() => void syncPendingMutations()}>Sinkronkan Sekarang</Button></div>
      </Dialog>
    </>
  );
}

export function OfflineDataNotice({ timestamp }: { timestamp?: string }) {
  const mode = getEffectiveConnectivity();
  useConnectivityStore();
  if (mode !== "offline") return null;
  return <div className="rounded-xl border border-[#efd69c] bg-[#fff7e4] p-4 text-sm text-[#725116]"><p className="font-semibold">Data lokal terakhir</p><p className="mt-1 text-xs leading-5">Mode offline aktif. Data ini berasal dari cache IndexedDB{timestamp ? ` dengan waktu terakhir ${new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).format(new Date(timestamp)).replace(".", ":")} WIB` : ""} dan mungkin tidak mencerminkan kondisi terbaru.</p></div>;
}
