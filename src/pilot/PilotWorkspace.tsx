import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link, Navigate, NavLink, useParams } from "react-router-dom";
import {
  Activity,
  Bell,
  Camera,
  ChevronRight,
  CloudSun,
  Droplets,
  FileText,
  LayoutDashboard,
  RadioTower,
  Settings,
  Sparkles,
  Sprout,
  Users,
  Wallet,
} from "lucide-react";
import { WorkspaceSidebar } from "../components/layout/Sidebar";
import { AppLogo } from "../components/common/AppLogo";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Dialog } from "../components/ui/Overlay";
import { api, cloud, farms, records } from "./client";
import { PilotCache, queueRecord, syncPilot } from "./offline";
import { assessWater, parseExtraction } from "./rules";
import { validateMeasurements } from "./validation";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useCloudSession } from "./useCloudSession";
import type { Extraction, FarmAccess, Module, PilotRecord } from "./types";
const nav = [
  ["home", "Beranda", LayoutDashboard],
  ["ponds", "Kolam", Droplets],
  ["activity", "Peringatan", Bell],
  ["brain", "PondBrain", Sparkles],
  ["weather", "Cuaca", CloudSun],
  ["devices", "Perangkat", RadioTower],
  ["aeration", "AeroPilot", Activity],
  ["feed", "FeedPilot", Sprout],
  ["profit", "ProfitLens", Wallet],
  ["config", "PondConfig", Settings],
  ["billing", "Sewa & tagihan", Wallet],
  ["visits", "Pondivator", Users],
  ["reports", "Laporan", FileText],
  ["team", "Tim & akun", Users],
] as const;
interface WorkspaceActions {
  farmId: string;
  busy: boolean;
  pondId: string;
  online: boolean;
  rows: PilotRecord[];
  perform: (work: () => Promise<unknown>, success?: string) => Promise<void>;
  save: (kind: Module, data: Record<string, unknown>) => Promise<void>;
}
const WorkspaceContext = createContext<WorkspaceActions | null>(null);
const money = (v: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v);
const date = (s: string) =>
  new Date(s).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="pilot-label">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}
function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-border px-6 py-10 text-center text-sm text-foreground-muted">
      {children}
    </p>
  );
}
function Summary({
  title,
  value,
  note,
}: {
  title: string;
  value: string | number;
  note: string;
}) {
  return (
    <Card className="p-6">
      <p className="text-sm text-foreground-muted">{title}</p>
      <p className="my-3 text-3xl font-semibold text-[#083F55]">{value}</p>
      <p className="text-xs text-foreground-muted">{note}</p>
    </Card>
  );
}
export function PilotWorkspace({ demo = false }: { demo?: boolean }) {
  const { session, loading } = useCloudSession();
  if (!demo && loading)
    return (
      <main className="p-10" role="status">
        Menyiapkan ruang kerja…
      </main>
    );
  if (!demo && !session) return <Navigate to="/login" replace />;
  return (
    <Workspace
      key={demo ? "preview" : session!.user.id}
      demo={demo}
      userId={demo ? "preview" : session!.user.id}
    />
  );
}
function Workspace({ demo, userId }: { demo: boolean; userId: string }) {
  const { section = "home" } = useParams();
  const base = demo ? "/pilot-demo" : "/pilot";
  const [access, setAccess] = useState<FarmAccess[]>(
    demo
      ? [
          {
            id: "preview-farm",
            name: "Tambak percobaan",
            location: "Ruang demo terpisah",
            role: "owner",
          },
        ]
      : [],
  );
  const [farmId, setFarmId] = useState(demo ? "preview-farm" : "");
  const farm = access.find((f) => f.id === farmId);
  const owner = farm?.role === "owner";
  const [rows, setRows] = useState<PilotRecord[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(0);
  const [more, setMore] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedPond, setSelectedPond] = useState("");
  const [online, setOnline] = useState(navigator.onLine);
  const cache = useMemo(() => new PilotCache(userId), [userId]);
  const ponds = rows.filter((r) => r.kind === "pond");
  const pondId = selectedPond || ponds[0]?.id || "";
  const readings = rows
    .filter((r) => r.kind === "reading" && r.data.pondId === pondId)
    .sort(
      (a, b) =>
        Date.parse(String(b.data.measuredAt)) -
        Date.parse(String(a.data.measuredAt)),
    );
  const assessment = assessWater(readings[0]?.data ?? {});
  const refresh = useCallback(
    async (id = farmId) => {
      if (!id) return;
      const cached = await cache.records.where("farm_id").equals(id).toArray();
      setRows(cached.sort((a, b) => b.created_at.localeCompare(a.created_at)));
      if (!demo && navigator.onLine) {
        await syncPilot(cache, userId);
        const latest = await records(id);
        await cache.transaction("rw", cache.records, async () => {
          await cache.records.where("farm_id").equals(id).delete();
          await cache.records.bulkPut(latest);
        });
        setRows(latest);
      }
      setPending(await cache.pending.count());
    },
    [farmId, cache, demo, userId],
  );
  useEffect(() => {
    let active = true;
    if (!demo)
      void (async () => {
        const items = navigator.onLine
          ? await farms()
          : await cache.access.toArray();
        if (navigator.onLine) {
          await cache.access.clear();
          await cache.access.bulkPut(items);
        }
        if (active) {
          setAccess(items);
          setFarmId(items[0]?.id ?? "");
        }
      })().catch((e) => setMessage(e.message));
    return () => {
      active = false;
    };
  }, [demo, cache]);
  // Refresh synchronizes IndexedDB/network state, including cold start and account changes.
  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => {
    void Promise.resolve()
      .then(() => refresh())
      .catch((e) => setMessage(e.message));
  }, [refresh]); // session-scoped cache
  useEffect(() => {
    const up = () => {
      setOnline(true);
      void Promise.resolve()
        .then(() => refresh())
        .catch((e) => setMessage(e.message));
    };
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, [refresh]);
  useEffect(() => () => cache.close({ disableAutoOpen: false }), [cache]);
  async function perform(work: () => Promise<unknown>, success = "Tersimpan.") {
    setBusy(true);
    setMessage("");
    try {
      await work();
      setMessage(success);
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Belum berhasil. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }
  async function save(kind: Module, data: Record<string, unknown>) {
    if (!farmId) throw new Error("Pilih tambak terlebih dahulu.");
    if (kind === "reading") validateMeasurements(data);
    if (
      ["cost", "feed", "harvest"].includes(kind) &&
      (!(Number(data.amount) > 0) || !Number.isFinite(Number(data.amount)))
    )
      throw new Error("Jumlah harus lebih dari nol.");
    if (demo) {
      await cache.records.add({
        id: crypto.randomUUID(),
        farm_id: farmId,
        kind,
        data,
        version: 1,
        created_at: new Date().toISOString(),
      });
      return;
    }
    await queueRecord(cache, { farmId, kind, data });
    setPending(await cache.pending.count());
    if (navigator.onLine) await syncPilot(cache, userId);
  }
  async function remote<T>(
    operation: string,
    payload: Record<string, unknown> = {},
  ): Promise<T> {
    if (demo)
      throw new Error(
        "Fitur ini memerlukan akun pilot dan layanan cloud. Data demo tidak dikirim ke layanan eksternal.",
      );
    return api<T>(operation, { ...payload, farmId });
  }
  async function logout() {
    if (
      pending &&
      !window.confirm(
        `${pending} catatan belum terkirim. Tetap keluar? Catatan tetap tersimpan untuk akun ini.`,
      )
    )
      return;
    await cloud?.auth.signOut();
    window.location.assign("/login");
  }
  const title =
    nav.find((n) => n[0] === section)?.[1] ?? "Halaman tidak ditemukan";
  useDocumentTitle(title);
  return (
    <WorkspaceContext.Provider
      value={{ farmId, busy, pondId, online, rows, perform, save }}
    >
      <div className="workspace-shell min-h-screen bg-background lg:flex">
        <WorkspaceSidebar
          groups={[
            {
              label: "Pantau",
              items: nav.slice(0, 4).map(([id, label, icon]) => ({
                label,
                href: `${base}/${id}`,
                icon,
              })),
            },
            {
              label: "Kelola",
              items: [
                nav.find((n) => n[0] === "devices")!,
                nav.find((n) => n[0] === "reports")!,
                ["services", "Tim & Layanan", Users] as const,
                ["team", "Pengaturan", Settings] as const,
              ].map(([id, label, icon]) => ({
                label,
                href: `${base}/${id}`,
                icon,
              })),
            },
          ]}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onLogout={() => void logout()}
        />
        <div className="min-w-0 flex-1 pb-24 lg:pb-8">
          <header className="sticky top-0 z-20 flex min-h-20 items-center justify-between gap-4 border-b border-border bg-white/95 px-5 backdrop-blur lg:px-9">
            <div className="lg:hidden">
              <AppLogo compact />
            </div>
            <label className="min-w-0 max-w-64 flex-1 text-sm">
              <span className="sr-only">Tambak aktif</span>
              <select
                className="w-full max-w-full truncate rounded-lg bg-transparent py-3 font-semibold"
                value={farmId}
                onChange={(e) => {
                  setRows([]);
                  setSelectedPond("");
                  setFarmId(e.target.value);
                }}
              >
                {!access.length && (
                  <option value="">Belum ada penugasan tambak</option>
                )}
                {access.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
            <span className="shrink-0 text-xs text-foreground-muted">
              {demo ? "Demo lokal" : online ? "Terhubung" : "Offline"}
              {pending ? ` · ${pending} tertunda` : ""}
            </span>
          </header>
          {demo && (
            <div className="border-b border-border bg-surface-muted px-5 py-3 text-sm lg:px-9">
              Pratinjau interaktif · Catatan tersimpan di perangkat ini.{" "}
              <Link to="/login" className="font-semibold text-primary">
                Masuk akun
              </Link>
            </div>
          )}
          <main
            className="pilot-page mx-auto max-w-7xl p-5 lg:p-9"
            key={section}
          >
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-2 text-sm text-primary">
                  {farm?.location ?? "Mulai dari tambakmu"}
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-[#083F55]">
                  {title}
                </h1>
              </div>
              {ponds.length > 0 && (
                <Field label="Kolam">
                  <select
                    className="pilot-input"
                    value={pondId}
                    onChange={(e) => setSelectedPond(e.target.value)}
                  >
                    {ponds.map((p) => (
                      <option value={p.id} key={p.id}>
                        {String(p.data.name)}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            </div>
            {message && (
              <p
                role="status"
                className="mb-6 rounded-xl border border-border bg-white p-4 text-sm"
              >
                {message}
              </p>
            )}
            {!farm && (
              <Empty>
                Akunmu belum ditugaskan ke tambak. Hubungi pemilik atau tim
                TambaQu.
              </Empty>
            )}
            {section === "services" && (
              <div className="grid gap-4 sm:grid-cols-2">
                {nav
                  .filter(([id]) =>
                    [
                      "visits",
                      "config",
                      "billing",
                      "feed",
                      "profit",
                      "weather",
                      "aeration",
                    ].includes(id),
                  )
                  .filter(
                    ([id]) =>
                      owner || !["billing", "config", "profit"].includes(id),
                  )
                  .map(([id, label, Icon]) => (
                    <Link
                      key={id}
                      to={`${base}/${id}`}
                      className="flex min-h-24 items-center gap-4 rounded-2xl border border-border bg-white p-6 text-sm font-semibold"
                    >
                      <Icon className="text-primary" size={22} />
                      {label}
                      <ChevronRight className="ml-auto" size={16} />
                    </Link>
                  ))}
              </div>
            )}
            {section === "home" && (
              <>
                <div className="pilot-grid">
                  <Summary
                    title="Kolam tercatat"
                    value={ponds.length}
                    note="Dalam tambak aktif"
                  />
                  <Summary
                    title="Kondisi kolam terpilih"
                    value={assessment.title}
                    note="Berdasarkan data terbaru dan kelengkapannya"
                  />
                  <Summary
                    title="Catatan belum terkirim"
                    value={pending}
                    note="Tersimpan khusus akun ini"
                  />
                </div>
                <Card className="mt-6 p-6">
                  <p className="text-sm font-semibold text-primary">
                    Langkah berikutnya
                  </p>
                  <h2 className="mt-3 text-xl font-semibold">
                    {!ponds.length
                      ? "Tambahkan kolam pertamamu"
                      : assessment.level === "unknown"
                        ? "Lengkapi pengukuran kolam"
                        : "Tinjau perubahan dan catat tindakan"}
                  </h2>
                  <p className="my-4 text-sm text-foreground-muted">
                    {assessment.reasons[0] ??
                      "Buka PondBrain untuk melihat konteks pengukuran."}
                  </p>
                  <Link
                    className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary"
                    to={`${base}/${!ponds.length ? "ponds" : "brain"}`}
                  >
                    Buka {ponds.length ? "PondBrain" : "Kolam"}
                    <ChevronRight size={18} />
                  </Link>
                </Card>
              </>
            )}
            {section === "ponds" && (
              <div className="pilot-grid">
                <div>
                  {owner && (
                    <RecordForm
                      kind="pond"
                      title="Tambah kolam"
                      fields={[
                        { key: "name", label: "Nama kolam" },
                        { key: "areaM2", label: "Luas (m²)", type: "number" },
                        {
                          key: "stockingDate",
                          label: "Tanggal mulai siklus",
                          type: "date",
                        },
                      ]}
                    />
                  )}
                  <div className="mt-5">
                    <History kind="pond" />
                  </div>
                </div>
                <div>
                  <RecordForm
                    kind="reading"
                    title="Catat kualitas air"
                    fields={[
                      {
                        key: "measuredAt",
                        label: "Waktu pengukuran",
                        type: "datetime-local",
                      },
                      {
                        key: "temperature",
                        label: "Suhu (°C)",
                        type: "number",
                        required: false,
                      },
                      {
                        key: "ph",
                        label: "pH",
                        type: "number",
                        required: false,
                      },
                      {
                        key: "dissolvedOxygen",
                        label: "Oksigen terlarut (mg/L)",
                        type: "number",
                        required: false,
                      },
                    ]}
                  />
                  <div className="mt-5">
                    <History kind="reading" />
                  </div>
                </div>
              </div>
            )}
            {(section === "alerts" || section === "activity") && (
              <div className="pilot-grid">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold">{assessment.title}</h2>
                  {assessment.reasons.map((r) => (
                    <p key={r} className="mt-4 text-sm">
                      {r}
                    </p>
                  ))}
                  <p className="mt-5 text-xs text-foreground-muted">
                    Acuan pilot awal. Kondisi biologis perlu penilaian lapangan.
                  </p>
                </Card>
                <div>
                  <RecordForm
                    kind="action"
                    title="Catat tindak lanjut"
                    fields={[
                      { key: "note", label: "Apa yang sudah dilakukan?" },
                    ]}
                  />
                  <div className="mt-5">
                    <History kind="action" />
                  </div>
                </div>
              </div>
            )}
            {section === "brain" && (
              <div className="space-y-6">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold">{assessment.title}</h2>
                  <p className="mt-3 text-sm text-foreground-muted">
                    Periksa sumber dan waktu ukur sebelum menentukan tindakan.
                  </p>
                  {assessment.reasons.map((r) => (
                    <p className="mt-3 text-sm" key={r}>
                      {r}
                    </p>
                  ))}
                </Card>
                <details className="rounded-2xl border border-border bg-white p-5">
                  <summary className="cursor-pointer py-2 text-sm font-semibold">
                    Bantuan tambahan · Foto dan asisten AI
                  </summary>
                  <div className="mt-5 space-y-5">
                    <PhotoAssistant
                      busy={busy}
                      setBusy={setBusy}
                      remote={remote}
                      save={async (data) => {
                        await perform(
                          () => save("extraction", data),
                          "Hasil foto tersimpan. Percakapan berikutnya memakai teks dan konteksnya.",
                        );
                      }}
                    />
                    <Chat remote={remote} />
                  </div>
                </details>
              </div>
            )}
            {section === "weather" && <Weather remote={remote} />}
            {["devices", "aeration"].includes(section) && (
              <Devices
                remote={remote}
                owner={owner}
                pondId={pondId}
                kind={section === "aeration" ? "aerator" : undefined}
              />
            )}
            {section === "feed" && (
              <div className="pilot-grid">
                <div>
                  <RecordForm
                    kind="feed"
                    title="Rencana atau realisasi pakan"
                    fields={[
                      {
                        key: "label",
                        label: "Keterangan, misalnya pakan pagi",
                      },
                      {
                        key: "amount",
                        label: "Berat pakan (kg)",
                        type: "number",
                      },
                      {
                        key: "note",
                        label: "Rencana atau realisasi dan jam pemberian",
                      },
                    ]}
                  />
                  <div className="mt-5">
                    <History kind="feed" />
                  </div>
                </div>
                <Devices
                  remote={remote}
                  owner={owner}
                  pondId={pondId}
                  kind="feeder"
                />
              </div>
            )}
            {section === "profit" && (
              <>
                <div className="pilot-grid">
                  <Summary
                    title="Biaya tercatat"
                    value={money(
                      rows
                        .filter((r) => r.kind === "cost")
                        .reduce((s, r) => s + Number(r.data.amount), 0),
                    )}
                    note="Belum termasuk biaya yang belum dicatat"
                  />
                  <Summary
                    title="Pendapatan panen"
                    value={money(
                      rows
                        .filter((r) => r.kind === "harvest")
                        .reduce((s, r) => s + Number(r.data.amount), 0),
                    )}
                    note="Nilai aktual yang dicatat pengguna"
                  />
                  <Summary
                    title="Selisih tercatat"
                    value={
                      owner
                        ? money(
                            rows.reduce(
                              (s, r) =>
                                s +
                                (r.kind === "harvest"
                                  ? Number(r.data.amount)
                                  : r.kind === "cost"
                                    ? -Number(r.data.amount)
                                    : 0),
                              0,
                            ),
                          )
                        : "Akses pemilik"
                    }
                    note="Bukan proyeksi laba atau jaminan hasil"
                  />
                </div>
                {owner && (
                  <div className="pilot-grid mt-6">
                    <RecordForm
                      kind="cost"
                      title="Catat biaya"
                      fields={[
                        { key: "label", label: "Kebutuhan" },
                        { key: "amount", label: "Biaya (Rp)", type: "number" },
                      ]}
                    />
                    <RecordForm
                      kind="harvest"
                      title="Catat penjualan panen"
                      fields={[
                        { key: "label", label: "Keterangan" },
                        {
                          key: "amount",
                          label: "Pendapatan (Rp)",
                          type: "number",
                        },
                      ]}
                    />
                    <History kind="cost" />
                  </div>
                )}
              </>
            )}
            {section === "config" && (
              <div className="pilot-grid">
                {owner && (
                  <RecordForm
                    kind="configuration"
                    title="Survei kebutuhan"
                    fields={[
                      { key: "name", label: "Nama konfigurasi" },
                      {
                        key: "note",
                        label: "Kondisi kolam, listrik, koneksi, dan aerasi",
                      },
                      { key: "modules", label: "Modul yang dibutuhkan" },
                      { key: "cluster", label: "Individual atau nama cluster" },
                      {
                        key: "sharing",
                        label: "Kesepakatan berbagi dan pembagian biaya",
                        required: false,
                      },
                    ]}
                  />
                )}
                <History kind="configuration" />
              </div>
            )}
            {section === "billing" && (
              <Billing
                remote={remote}
                farmId={farmId}
                owner={owner}
                demo={demo}
              />
            )}
            {section === "visits" && (
              <div className="pilot-grid">
                {(owner || farm?.role === "pondivator") && (
                  <RecordForm
                    kind="visit"
                    title="Jadwal dan hasil kunjungan"
                    fields={[
                      { key: "name", label: "Penanggung jawab" },
                      {
                        key: "scheduledAt",
                        label: "Jadwal",
                        type: "datetime-local",
                      },
                      {
                        key: "note",
                        label: "Tugas, hasil pemeriksaan, dan tindak lanjut",
                      },
                    ]}
                  />
                )}
                <History kind="visit" />
              </div>
            )}
            {section === "reports" && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold">Catatan operasional</h2>
                <p className="my-4 text-sm text-foreground-muted">
                  Unduh data tambak aktif untuk pemeriksaan dan pembukuan.
                </p>
                <Button
                  onClick={() => {
                    const content = JSON.stringify(
                      {
                        farm: farm?.name,
                        exportedAt: new Date().toISOString(),
                        records: rows,
                      },
                      null,
                      2,
                    );
                    const url = URL.createObjectURL(
                      new Blob([content], { type: "application/json" }),
                    );
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "tambaqu-catatan.json";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Unduh laporan JSON
                </Button>
                <div className="mt-6">
                  <History kind="action" />
                </div>
              </Card>
            )}
            {section === "team" && (
              <Team
                remote={remote}
                owner={owner}
                demo={demo}
                logout={logout}
                pending={pending}
                sync={() =>
                  perform(
                    () => syncPilot(cache, userId),
                    "Sinkronisasi selesai.",
                  )
                }
              />
            )}
          </main>
        </div>
        <nav
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
          aria-label="Navigasi ponsel"
        >
          {nav.slice(0, 4).map(([id, label, Icon]) => (
            <NavLink
              to={`${base}/${id}`}
              key={id}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs ${section === id ? "font-semibold text-primary" : "text-foreground-muted"}`}
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
          <button
            className="text-xs"
            onClick={() => setMore(!more)}
            aria-expanded={more}
          >
            Lainnya
          </button>
        </nav>
        <Dialog
          open={more}
          onOpenChange={setMore}
          title="Lainnya"
          description="Modul dan pengaturan tambak."
        >
          <nav className="grid gap-2">
            {[
              nav.find((n) => n[0] === "devices")!,
              nav.find((n) => n[0] === "reports")!,
              ["services", "Tim & Layanan", Users] as const,
              ["team", "Pengaturan", Settings] as const,
            ].map(([id, label, Icon]) => (
              <Link
                key={id}
                onClick={() => setMore(false)}
                to={`${base}/${id}`}
                className="flex min-h-12 items-center gap-3 rounded-xl bg-surface-muted p-3"
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </nav>
          <Button className="mt-6" onClick={() => void logout()}>
            Keluar
          </Button>
        </Dialog>
      </div>
    </WorkspaceContext.Provider>
  );
}
function RecordForm({
  kind,
  fields,
  title,
}: {
  kind: Module;
  fields: { key: string; label: string; type?: string; required?: boolean }[];
  title: string;
}) {
  const { farmId, busy, pondId, online, perform, save } =
    useContext(WorkspaceContext)!;
  const [defaultTime] = useState(() =>
    new Date(Date.now() - new Date().getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 16),
  );
  return (
    <Card className="p-6">
      <h2 className="mb-5 text-lg font-semibold">{title}</h2>
      <form
        className="space-y-4"
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          const data: Record<string, unknown> = {};
          for (const f of fields) {
            const v = String(fd.get(f.key) ?? "");
            if (v) data[f.key] = f.type === "number" ? Number(v) : v;
          }
          if (kind !== "pond" && pondId) data.pondId = pondId;
          if (kind === "reading") {
            data.measuredAt = new Date(String(data.measuredAt)).toISOString();
            data.quality = "valid";
            data.source = "manual";
          }
          void perform(
            async () => {
              await save(kind, data);
              form.reset();
            },
            online
              ? "Catatan tersimpan."
              : "Tersimpan di perangkat. Akan disinkronkan saat online.",
          );
        }}
      >
        {fields.map((f) => (
          <Field key={f.key} label={f.label}>
            <input
              className="pilot-input"
              name={f.key}
              type={f.type ?? "text"}
              required={f.required !== false}
              maxLength={500}
              step={f.type === "number" ? "any" : undefined}
              min={f.type === "number" ? 0 : undefined}
              defaultValue={
                f.type === "datetime-local" ? defaultTime : undefined
              }
            />
          </Field>
        ))}
        <Button
          type="submit"
          isLoading={busy}
          disabled={!farmId || (["reading", "feed"].includes(kind) && !pondId)}
        >
          Simpan
        </Button>
      </form>
    </Card>
  );
}
function History({ kind }: { kind: Module }) {
  const { rows } = useContext(WorkspaceContext)!;
  const items = rows.filter((r) => r.kind === kind);
  return items.length ? (
    <div className="space-y-3">
      {items.slice(0, 30).map((r) => (
        <Card key={r.id} className="p-5">
          <p className="font-semibold">
            {String(
              r.data.name ??
                r.data.note ??
                r.data.label ??
                r.data.context ??
                "Catatan",
            )}
          </p>
          <dl className="mt-3 space-y-1 text-sm text-foreground-muted">
            {Object.entries(r.data)
              .filter(
                ([k, v]) =>
                  !["pondId", "extraction"].includes(k) &&
                  typeof v !== "object",
              )
              .map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt>
                    {(
                      {
                        amount: "Jumlah",
                        measuredAt: "Waktu ukur",
                        temperature: "Suhu °C",
                        ph: "pH",
                        dissolvedOxygen: "Oksigen mg/L",
                        source: "Sumber",
                        quality: "Kualitas",
                        areaM2: "Luas m²",
                        stockingDate: "Mulai siklus",
                        note: "Catatan",
                        name: "Nama",
                        label: "Keterangan",
                        unit: "Satuan",
                      } as Record<string, string>
                    )[k] ?? k}
                  </dt>
                  <dd className="max-w-[65%] break-words text-right">
                    {String(v)}
                  </dd>
                </div>
              ))}
          </dl>
          <p className="mt-3 text-xs text-foreground-muted">
            {date(r.created_at)}
            {r.version === 0 ? " · Belum terkirim" : ""}
          </p>
        </Card>
      ))}
    </div>
  ) : (
    <Empty>Belum ada catatan. Tambahkan saat data tersedia.</Empty>
  );
}
type Remote = <T>(op: string, payload?: Record<string, unknown>) => Promise<T>;
export function PhotoAssistant({
  busy,
  setBusy,
  remote,
  save,
}: {
  busy: boolean;
  setBusy: (b: boolean) => void;
  remote: Remote;
  save: (data: Record<string, unknown>) => Promise<void>;
}) {
  const [image, setImage] = useState("");
  const [name, setName] = useState("");
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [error, setError] = useState("");
  const [reviewed, setReviewed] = useState(false);
  async function read(file?: File) {
    setError("");
    setExtraction(null);
    setReviewed(false);
    setImage("");
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 4 * 1024 * 1024
    ) {
      setError("Pilih JPG, PNG, atau WebP maksimal 4 MB.");
      return;
    }
    setName(file.name);
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.onerror = () => setError("Gambar belum dapat dibuka.");
    reader.readAsDataURL(file);
  }
  async function extract() {
    setBusy(true);
    setError("");
    try {
      const result = await remote<unknown>("extract", { image });
      setExtraction(parseExtraction(result));
      setImage("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pembacaan belum berhasil.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-3">
        <Camera className="text-primary" size={22} />
        <h2 className="text-lg font-semibold">Baca foto menjadi catatan</h2>
      </div>
      <p className="mb-5 text-sm leading-6 text-foreground-muted">
        Unggah foto catatan, hasil ukur, atau tabel. Periksa hasil bacanya
        sebelum disimpan. Foto dikirim ke DeepSeek saat dibaca; berkas asli
        tidak disimpan oleh TambaQu.
      </p>
      <label className="pilot-label">
        Foto
        <input
          className="peer sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => void read(e.target.files?.[0])}
        />
        <span className="pilot-input mt-2 cursor-pointer font-normal peer-focus-visible:outline-2 peer-focus-visible:outline-primary">
          {name || "Pilih foto · JPG, PNG, atau WebP"}
        </span>
      </label>
      {image && (
        <>
          <img
            className="my-4 max-h-72 rounded-xl object-contain"
            src={image}
            alt="Foto yang akan ditranskripsikan"
          />
          <Button isLoading={busy} onClick={() => void extract()}>
            Baca foto
          </Button>
        </>
      )}
      {error && (
        <p role="alert" className="my-4 text-sm text-risk-critical">
          {error}
        </p>
      )}
      {extraction && (
        <div className="mt-6 space-y-5">
          <Field label="Teks hasil pembacaan">
            <textarea
              className="pilot-input min-h-48"
              value={extraction.text}
              onChange={(e) => {
                setReviewed(false);
                setExtraction({ ...extraction, text: e.target.value });
              }}
            />
          </Field>
          <Field label="Konteks gambar">
            <textarea
              className="pilot-input min-h-28"
              value={extraction.context}
              onChange={(e) => {
                setReviewed(false);
                setExtraction({ ...extraction, context: e.target.value });
              }}
            />
          </Field>
          <details>
            <summary className="min-h-11 cursor-pointer text-sm font-semibold">
              Angka, tabel, dan ketidakpastian
            </summary>
            <textarea
              aria-label="Angka, tabel, dan ketidakpastian dalam JSON"
              className="pilot-input min-h-64 font-mono text-xs"
              defaultValue={JSON.stringify(
                {
                  observations: extraction.observations,
                  tables: extraction.tables,
                  uncertainties: extraction.uncertainties,
                },
                null,
                2,
              )}
              onChange={() => setReviewed(false)}
              onBlur={(e) => {
                try {
                  const details = JSON.parse(e.target.value);
                  setExtraction(parseExtraction({ ...extraction, ...details }));
                  setError("");
                } catch {
                  setError(
                    "Perbaiki format JSON angka dan tabel sebelum menyimpan.",
                  );
                }
              }}
            />
          </details>
          {extraction.uncertainties.length > 0 && (
            <p className="rounded-xl bg-risk-warning/10 p-4 text-sm">
              Perlu diperiksa: {extraction.uncertainties.join("; ")}
            </p>
          )}
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={(e) => setReviewed(e.target.checked)}
            />
            Saya sudah memeriksa teks, angka, tabel, dan konteks.
          </label>
          <Button
            disabled={!reviewed || Boolean(error)}
            isLoading={busy}
            onClick={() =>
              void save({
                name,
                context: extraction.context,
                extraction,
                reviewedAt: new Date().toISOString(),
                source: "image-transcription",
              })
            }
          >
            Simpan teks & konteks
          </Button>
        </div>
      )}
    </Card>
  );
}
export function Chat({ remote }: { remote: Remote }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Card className="p-6">
      <h2 className="mb-4 text-lg font-semibold">Tanya PondBrain</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            setAnswer(
              (await remote<{ answer: string }>("chat", { question })).answer,
            );
          } catch (error) {
            setAnswer(
              error instanceof Error ? error.message : "Belum berhasil.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label="Pertanyaan tentang tambakmu">
          <textarea
            className="pilot-input min-h-28"
            required
            maxLength={2000}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Apa yang perlu saya periksa dari pengukuran terakhir?"
          />
        </Field>
        <Button type="submit" isLoading={busy}>
          Tanyakan
        </Button>
      </form>
      <p className="mt-5 whitespace-pre-wrap text-sm leading-7" role="status">
        {answer}
      </p>
    </Card>
  );
}
function Weather({ remote }: { remote: Remote }) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  return (
    <Card className="p-6">
      <h2 className="mb-4 text-lg font-semibold">Prakiraan wilayah tambak</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          try {
            setResult(await remote("weather", { areaCode: code }));
          } catch (x) {
            setError(
              x instanceof Error ? x.message : "Prakiraan belum tersedia.",
            );
          }
        }}
      >
        <Field label="Kode desa/kelurahan BMKG">
          <input
            className="pilot-input"
            required
            pattern="[0-9]{2}\.[0-9]{2}\.[0-9]{2}\.[0-9]{4}"
            placeholder="00.00.00.0000"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </Field>
        <Button type="submit">Lihat prakiraan</Button>
      </form>
      <p className="my-4 text-sm text-foreground-muted">
        Prakiraan BMKG merupakan konteks wilayah, bukan pengukuran cuaca mikro
        kolam.
      </p>
      <p role="status">{error}</p>
      {result && (
        <div className="pilot-grid">
          {result.data?.[0]?.cuaca
            ?.flat()
            .slice(0, 8)
            .map((c: any) => (
              <div className="rounded-xl bg-surface-muted p-4" key={c.datetime}>
                <p className="text-xs">{c.local_datetime} WIB</p>
                <p className="my-2 font-semibold">{c.weather_desc}</p>
                <p className="text-sm">
                  {c.t} °C · Kelembapan {c.hu}%
                </p>
              </div>
            ))}
        </div>
      )}
    </Card>
  );
}
function Devices({
  remote,
  owner,
  pondId,
  kind,
}: {
  remote: Remote;
  owner: boolean;
  pondId: string;
  kind?: "aerator" | "feeder";
}) {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [secret, setSecret] = useState("");
  async function load() {
    try {
      setItems(await remote<any[]>("devices"));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Belum tersedia.");
    }
  }
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold">
        {kind ? "Uji kendali simulator" : "PondHub & node sensor"}
      </h2>
      <p className="my-4 text-sm text-foreground-muted">
        Perintah fisik belum diaktifkan. Konfirmasi simulator diperlukan sebelum
        hasil dianggap berhasil.
      </p>
      <Button variant="secondary" onClick={() => void load()}>
        Muat perangkat
      </Button>
      {owner && !kind && (
        <form
          className="mt-5 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const r = await remote<{ token: string }>("register-device", {
                name,
                pondId,
              });
              setSecret(r.token);
              await load();
            } catch (x) {
              setMessage(
                x instanceof Error ? x.message : "Pendaftaran belum berhasil.",
              );
            }
          }}
        >
          <Field label="Nama node">
            <input
              className="pilot-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
            />
          </Field>
          <Button type="submit" disabled={!pondId}>
            Daftarkan ke kolam
          </Button>
        </form>
      )}
      {secret && (
        <div className="my-5 rounded-xl bg-surface-muted p-4">
          <p className="text-sm font-semibold">
            Token perangkat hanya ditampilkan sekarang. Simpan pada perangkat,
            bukan di frontend.
          </p>
          <code className="mt-3 block break-all text-xs">{secret}</code>
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() => setSecret("")}
          >
            Sudah disimpan
          </Button>
        </div>
      )}
      <p className="my-4 text-sm" role="status">
        {message}
      </p>
      <div className="space-y-4">
        {items.map((d) => (
          <div className="rounded-xl border border-border p-4" key={d.id}>
            <h3 className="font-semibold">{d.name}</h3>
            <p className="mt-2 text-xs text-foreground-muted">
              {d.last_seen
                ? `Terakhir diterima: ${date(d.last_seen)}`
                : "Belum mengirim data"}{" "}
              · {d.enabled ? "Aktif" : "Dinonaktifkan"}
            </p>
            <code className="mt-2 block break-all text-xs">{d.id}</code>
            {owner && (
              <Button
                className="mt-4"
                variant="secondary"
                onClick={async () => {
                  if (
                    !window.confirm(
                      kind
                        ? "Kirim perintah uji ke simulator?"
                        : "Cabut akses perangkat ini?",
                    )
                  )
                    return;
                  try {
                    const result = await remote<any>(
                      kind ? "command" : "revoke-device",
                      kind
                        ? {
                            deviceId: d.id,
                            kind,
                            confirmed: true,
                            simulation: true,
                          }
                        : { deviceId: d.id },
                    );
                    setMessage(
                      kind
                        ? `Perintah ${result.id} terkirim. Tunggu konfirmasi perangkat.`
                        : "Akses dicabut.",
                    );
                    await load();
                  } catch (e) {
                    setMessage(
                      e instanceof Error ? e.message : "Belum berhasil.",
                    );
                  }
                }}
              >
                {kind ? "Kirim uji simulator" : "Cabut akses"}
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
function Billing({
  remote,
  farmId,
  owner,
  demo,
}: {
  remote: Remote;
  farmId: string;
  owner: boolean;
  demo: boolean;
}) {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [accepted, setAccepted] = useState(false);
  const load = useCallback(async () => {
    if (!cloud || demo) return;
    const results = await Promise.all([
      cloud.from("catalog").select("*"),
      cloud.from("invoices").select("*").eq("farm_id", farmId),
      cloud.from("subscriptions").select("*").eq("farm_id", farmId),
    ]);
    if (results.some((r) => r.error)) {
      setMessage("Tagihan belum dapat dimuat.");
      return;
    }
    setCatalog(results[0].data ?? []);
    setInvoices(results[1].data ?? []);
    setSubs(results[2].data ?? []);
  }, [farmId, demo]);
  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);
  if (!owner)
    return <Empty>Kontrak dan tagihan dikelola pemilik tambak.</Empty>;
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Paket sewa bulanan</h2>
        <p className="my-4 text-sm text-foreground-muted">
          Bayar setiap tagihan melalui checkout. Tidak ada penarikan otomatis.
          Pembatalan berlaku setelah periode berjalan.
        </p>
        {!catalog.length && (
          <Empty>
            Paket dan harga akan muncul setelah disiapkan tim TambaQu.
          </Empty>
        )}
        <label className="my-5 flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          Saya menyetujui paket, harga bulanan, dan ketentuan periode sewa.
        </label>
        {catalog.map((c) => (
          <div
            className="mb-3 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border p-4"
            key={c.id}
          >
            <div>
              <h3 className="font-semibold">{c.name}</h3>
              <p className="text-sm">{money(c.monthly_price)}/bulan</p>
            </div>
            <Button
              disabled={!accepted}
              onClick={async () => {
                try {
                  await remote("subscribe", { catalogId: c.id, accepted });
                  setMessage("Tagihan dibuat. Lanjutkan pembayaran.");
                  await load();
                } catch (x) {
                  setMessage(
                    x instanceof Error ? x.message : "Belum berhasil.",
                  );
                }
              }}
            >
              Pilih paket
            </Button>
          </div>
        ))}
      </Card>
      <Card className="p-6">
        <h2 className="mb-5 text-lg font-semibold">Tagihan</h2>
        {!invoices.length && <Empty>Belum ada tagihan.</Empty>}
        {invoices.map((i) => (
          <div
            className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4"
            key={i.id}
          >
            <div>
              <p className="font-semibold">{money(i.amount)}</p>
              <p className="text-sm">
                {i.period} ·{" "}
                {(
                  {
                    paid: "Lunas",
                    pending: "Menunggu pembayaran",
                    expired: "Kedaluwarsa",
                    cancelled: "Dibatalkan",
                  } as Record<string, string>
                )[i.status] ?? i.status}
              </p>
            </div>
            {i.status === "pending" && (
              <Button
                onClick={async () => {
                  try {
                    const r = await remote<{ url: string }>("checkout", {
                      invoiceId: i.id,
                    });
                    const url = new URL(r.url);
                    if (
                      ![
                        "app.midtrans.com",
                        "app.sandbox.midtrans.com",
                      ].includes(url.hostname) ||
                      url.protocol !== "https:"
                    )
                      throw new Error("Alamat checkout tidak valid.");
                    window.location.assign(url.href);
                  } catch (x) {
                    setMessage(
                      x instanceof Error
                        ? x.message
                        : "Checkout belum tersedia.",
                    );
                  }
                }}
              >
                Bayar
              </Button>
            )}
          </div>
        ))}
      </Card>
      {subs
        .filter((s) => s.status === "active")
        .map((s) => (
          <Card key={s.id} className="p-6">
            <p className="mb-4 text-sm">Periode berikutnya: {s.next_billing}</p>
            <Button
              variant="secondary"
              onClick={async () => {
                if (
                  !window.confirm(
                    "Hentikan perpanjangan setelah periode berjalan?",
                  )
                )
                  return;
                try {
                  await remote("cancel-subscription", { subscriptionId: s.id });
                  setMessage(
                    "Perpanjangan dihentikan setelah periode berjalan.",
                  );
                  await load();
                } catch (x) {
                  setMessage(
                    x instanceof Error ? x.message : "Belum berhasil.",
                  );
                }
              }}
            >
              Hentikan perpanjangan
            </Button>
          </Card>
        ))}
      <p role="status">{message}</p>
    </div>
  );
}
function Team({
  remote,
  owner,
  demo,
  logout,
  pending,
  sync,
}: {
  remote: Remote;
  owner: boolean;
  demo: boolean;
  logout: () => Promise<void>;
  pending: number;
  sync: () => Promise<void>;
}) {
  const [message, setMessage] = useState("");
  return (
    <div className="pilot-grid">
      {owner && (
        <Card className="p-6">
          <h2 className="mb-5 text-lg font-semibold">Undang anggota</h2>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              try {
                await remote("invite", {
                  email: fd.get("email"),
                  role: fd.get("role"),
                });
                setMessage("Undangan terkirim.");
              } catch (x) {
                setMessage(x instanceof Error ? x.message : "Belum terkirim.");
              }
            }}
          >
            <Field label="Email anggota">
              <input
                className="pilot-input"
                name="email"
                type="email"
                required
              />
            </Field>
            <Field label="Peran">
              <select name="role" className="pilot-input">
                <option value="operator">Operator</option>
                <option value="pondivator">Pondivator</option>
              </select>
            </Field>
            <Button type="submit">Kirim undangan</Button>
          </form>
          <p role="status" className="mt-4 text-sm">
            {message}
          </p>
        </Card>
      )}
      <Card className="p-6">
        <h2 className="mb-5 text-lg font-semibold">Akun dan penyimpanan</h2>
        {!demo && (
          <form
            className="mb-6 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const r = await cloud!.auth.updateUser({
                password: String(fd.get("password")),
              });
              setMessage(
                r.error
                  ? "Kata sandi belum diperbarui."
                  : "Kata sandi diperbarui.",
              );
            }}
          >
            <Field label="Kata sandi baru">
              <input
                className="pilot-input"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </Field>
            <Button type="submit">Simpan kata sandi</Button>
          </form>
        )}
        <p className="mb-4 text-sm">{pending} catatan menunggu sinkronisasi.</p>
        <Button
          variant="secondary"
          disabled={!pending || demo}
          onClick={() => void sync()}
        >
          Sinkronkan
        </Button>
        <Button
          className="ml-3"
          variant="secondary"
          onClick={() => void logout()}
        >
          Keluar
        </Button>
        <p role="status" className="mt-4 text-sm">
          {message}
        </p>
      </Card>
    </div>
  );
}
