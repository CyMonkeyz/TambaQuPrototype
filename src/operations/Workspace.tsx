import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, NavLink, useParams } from "react-router-dom";
import {
  Activity,
  Bell,
  BrainCircuit,
  Droplets,
  FileChartColumn,
  LayoutDashboard,
  RadioTower,
  Settings,
  Users,
  ArrowRight,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import { WorkspaceSidebar } from "../components/layout/Sidebar";
import { AppLogo } from "../components/common/AppLogo";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Overlay";
import { LoadingSkeleton } from "../components/ui/Feedback";
import { api, cloud, farms } from "../pilot/client";
import type { FarmAccess } from "../pilot/types";
import { useCloudSession } from "../pilot/useCloudSession";
import { useAppStore } from "../store/app-store";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import {
  definitions,
  assessMeasurements,
  feedSummary,
  csv,
  type Entity,
  type EntityKind,
  type Definition,
  labelFor,
  financeSummary,
} from "./model";
import {
  OperationsCache,
  cachedRows,
  refreshKind,
  refreshSnapshot,
  listEntities,
  queueEntity,
  syncEntities,
  saveDemo,
  seedDemo,
  canWrite,
  type Rows,
  type Pending,
} from "./repository";
import { EntityPanel } from "./EntityPanel";
import { MeasurementView } from "./MeasurementView";
import { ReportQuality } from "./ReportQuality";
import { DemoPreview } from "./DemoPreview";
import { productScope } from "./productScope";
import {
  cultivationModules,
  serviceModules,
  bioflocParameters,
} from "./moduleCatalog";
import { repositories } from "../data/repositories";
import { BioflocSummary } from "./BioflocSummary";
import {
  DevicesPanel,
  CommercialPanel,
  TeamPanel,
  AdminPanel,
  WeatherPanel,
  PhotoPanel,
} from "./panels";
const mainNav = [
  ["home", "Beranda", LayoutDashboard],
  ["ponds", "Kolam", Droplets],
  ["brain", "PondBrain", BrainCircuit],
  ["activity", "Peringatan", Bell],
] as const;
const manageNav = [
  ["devices", "Perangkat", RadioTower],
  ["reports", "Laporan", FileChartColumn],
  ["services", "Tim & Layanan", Users],
  ["team", "Pengaturan", Settings],
] as const;
const modules = [...cultivationModules, ...serviceModules].map(
  (item) =>
    [item.id, item.name, `${item.brand} · ${item.description}`] as const,
);
const names: Record<string, string> = Object.fromEntries(
  [...mainNav, ...manageNav, ...modules].map(([id, name]) => [id, name]),
);
names.admin = "Admin layanan";
export function OperationsWorkspace({ demo = false }: { demo?: boolean }) {
  const { session, loading } = useCloudSession();
  const localAccountId = useAppStore(s => s.activeUser?.id);
  if (!demo && loading) return <LoadingSkeleton rows={4} />;
  if (!demo && !session) return <Navigate to="/login" replace />;
  return (
    <Workspace
      key={demo ? (localAccountId ?? "demo") : session!.user.id}
      demo={demo}
      accountId={demo ? (localAccountId ?? "demo") : session!.user.id}
    />
  );
}
function Workspace({ demo, accountId }: { demo: boolean; accountId: string }) {
  const { section = "home" } = useParams();
  const [collapsed, setCollapsed] = useState(false),
    [more, setMore] = useState(false);
  const demoFarm = useAppStore((s) => s.activeFarm);
  const demoPond = useAppStore((s) => s.selectedPondId);
  const [access, setAccess] = useState<FarmAccess[]>([]),
    [farmId, setFarmId] = useState(demo ? (demoFarm?.id ?? "demo-farm") : ""),
    [pondId, setPondId] = useState(demo ? demoPond || "pond-b" : ""),
    [cycleId, setCycleId] = useState("");
  const [storedRows, setRows] = useState<Rows>({}),
    [message, setMessage] = useState(""),
    [loading, setLoading] = useState(true),
    [ready, setReady] = useState(demo),
    [busy, setBusy] = useState(false),
    [online, setOnline] = useState(navigator.onLine),
    [pending, setPending] = useState<Pending[]>([]),
    [admin, setAdmin] = useState(false),
    [adminFarm, setAdminFarm] = useState("");
  const [serviceFarms, setServiceFarms] = useState<FarmAccess[]>([]);
  const [limitedKinds, setLimitedKinds] = useState<string[]>([]);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) setNow(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);
  const [conflictReview, setConflictReview] = useState<{
    item: Pending;
    server: Entity;
  } | null>(null);
  const cache = useMemo(() => new OperationsCache(accountId), [accountId]);
  const currentFarm = access.find((f) => f.id === farmId);
  const role = demo ? "owner" : admin ? "admin" : (currentFarm?.role ?? "");
  const [loadedScope, setLoadedScope] = useState("");
  const rows = loadedScope === `${farmId}:${role}` ? storedRows : {};
  const generation = useRef(0);
  const refreshing = useRef(0);
  const base = demo ? "/app/modules" : "/pilot";
  const title = names[section] ?? "Halaman tidak ditemukan";
  useDocumentTitle(title);
  const loadAccess = useCallback(async () => {
    if (demo) {
      setAccess([
        {
          id: farmId,
          name: demoFarm?.name ?? "Tambak contoh",
          location: "Data simulasi",
          role: "owner",
        },
      ]);
      setReady(true);
      return;
    }
    if (online) await api("ops-claim-invites");
    const data = online
      ? await farms()
      : (JSON.parse(
          sessionStorage.getItem(`tambaqu-access-${accountId}`) ?? "[]",
        ) as FarmAccess[]);
    if (online)
      sessionStorage.setItem(
        `tambaqu-access-${accountId}`,
        JSON.stringify(data),
      );
    const flags = online
      ? await api<{ enabled: boolean }>("ops-admin")
      : { enabled: false };
    setAdmin(flags.enabled);
    if (flags.enabled) setServiceFarms(await api<FarmAccess[]>("ops-farms"));
    setAccess(data);
    setFarmId((id) =>
      (flags.enabled && id) || data.some((f) => f.id === id)
        ? id
        : (data[0]?.id ?? ""),
    );
    setReady(true);
  }, [demo, farmId, demoFarm?.name, online, accountId]);
  useEffect(() => {
    void Promise.resolve()
      .then(loadAccess)
      .catch((e) => {
        setMessage(e.message);
        setLoading(false);
      });
  }, [loadAccess]);
  const refresh = useCallback(async () => {
    if (!farmId || !role) return;
    const request = ++refreshing.current;
    const turn = generation.current;
    try {
      if (demo) {
        const demoPonds = await repositories.pond.getByFarmId(farmId);
        if (demoPonds.length) {
          for (const item of demoPonds)
            await seedDemo(cache, farmId, item.id, item);
        } else await seedDemo(cache, farmId, demoPond || "pond-b");
      } else if (navigator.onLine) await syncEntities(cache);
      const kinds = Object.keys(definitions).filter(
        (k) =>
          !(definitions[k as EntityKind] as Definition).owner ||
          role === "owner" ||
          role === "admin",
      ) as EntityKind[];
      let next: Rows = {};
      if (!demo && navigator.onLine) {
        const snapshot = await refreshSnapshot(cache, farmId);
        next = snapshot.rows;
        setLimitedKinds(snapshot.more);
      } else
        for (const kind of kinds)
          next[kind] =
            demo || !navigator.onLine
              ? await cachedRows(cache, farmId, kind)
              : await refreshKind(cache, farmId, kind);
      if (demo || !navigator.onLine)
        for (const kind of [
          "alerts",
          ...(role === "owner" || role === "admin"
            ? ["quotes", "contracts", "invoices"]
            : []),
        ] as const)
          next[kind as keyof Rows] =
            demo || !navigator.onLine
              ? await cachedRows(cache, farmId, kind)
              : await refreshKind(cache, farmId, kind);
      if (turn === generation.current && request === refreshing.current) {
        setRows(next);
        setLoadedScope(`${farmId}:${role}`);
        setPending(
          await cache.pending.where("farmId").equals(farmId).toArray(),
        );
        setLoading(false);
      }
    } catch (e) {
      if (turn === generation.current && request === refreshing.current) {
        const m = e instanceof Error ? e.message : "Data belum termuat.";
        if (/Akses tambak|Silakan masuk/.test(m)) {
          setRows({});
          await cache.entities.where("farm_id").equals(farmId).delete();
        }
        setMessage(m);
        setLoading(false);
      }
    }
  }, [farmId, role, demo, cache, demoPond]);
  // Scope changes clear the old account/farm view before its next asynchronous load.
  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => {
    generation.current++;
    void Promise.resolve().then(() => {
      setRows({});
      setLoading(Boolean(farmId));
      setCycleId("");
      return refresh();
    });
  }, [farmId, role, refresh]);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  useEffect(() => {
    if (online) void Promise.resolve().then(refresh);
  }, [online, refresh]);
  useEffect(() => {
    if (!cloud || demo || !farmId) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const channel = cloud
      .channel(`ops:${accountId}:${farmId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "op_measurements",
          filter: `farm_id=eq.${farmId}`,
        },
        () => {
          clearTimeout(timer);
          timer = setTimeout(() => void refresh(), 500);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "op_actions",
          filter: `farm_id=eq.${farmId}`,
        },
        () => void refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "op_services",
          filter: `farm_id=eq.${farmId}`,
        },
        () => void refresh(),
      )
      .subscribe();
    const interval = setInterval(() => {
      if (!document.hidden && navigator.onLine) {
        void refresh();
        void loadAccess();
      }
    }, 60000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      void cloud!.removeChannel(channel);
    };
  }, [accountId, farmId, demo, refresh, loadAccess]);
  useEffect(() => () => cache.close({ disableAutoOpen: false }), [cache]);
  const ponds = rows.ponds ?? [];
  const selectedPond = ponds.some((p) => p.id === pondId)
    ? pondId
    : (ponds[0]?.id ?? "");
  const pond = ponds.find((p) => p.id === selectedPond);
  const selected = (kind: keyof Rows) =>
    (rows[kind] ?? []).filter(
      (r) =>
        (!r.pond_id || r.pond_id === selectedPond) &&
        (!cycleId ||
          r.cycle_id === cycleId ||
          kind === "thresholds" ||
          kind === "ponds" ||
          kind === "cycles"),
    );
  const measurements = selected("measurements"),
    rules = selected("thresholds"),
    assessment = assessMeasurements(measurements, rules);
  const href = (s: string) => `${base}/${s}`;
  const finance = financeSummary(
    selected("costs"),
    selected("revenues"),
    selected("harvests"),
    selected("feed"),
    (rows.cycles ?? []).find((c) => c.id === cycleId),
  );
  async function save(
    kind: EntityKind,
    data: Record<string, unknown>,
    edit?: Entity,
  ) {
    if (!canWrite(kind, role)) throw new Error("Hak akses tidak sesuai.");
    if (demo) await saveDemo(cache, farmId, kind, data, edit);
    else {
      await queueEntity(cache, farmId, kind, data, edit);
      if (navigator.onLine) await syncEntities(cache);
    }
    await refresh();
    setMessage(
      demo
        ? "Catatan demo tersimpan."
        : "Catatan tersimpan. Periksa status sinkronisasi.",
    );
  }
  async function run(work: () => Promise<unknown>, success = "Tersimpan.") {
    setBusy(true);
    setMessage("");
    try {
      await work();
      setMessage(success);
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Belum berhasil.");
    } finally {
      setBusy(false);
    }
  }
  async function remote<T>(
    operation: string,
    payload: Record<string, unknown> = {},
  ): Promise<T> {
    if (demo)
      throw new Error(
        "Gunakan akun nyata untuk layanan ini. Demo tetap terpisah.",
      );
    if (!online) throw new Error("Hubungkan internet untuk langkah ini.");
    return api<T>(operation, { ...payload, farmId });
  }
  const panel = (kind: EntityKind) => (
    <EntityPanel
      key={`${kind}:${selectedPond}:${cycleId}`}
      kind={kind}
      rows={
        kind === "ponds"
          ? ponds
          : section === "biofloc" && kind === "measurements"
            ? selected(kind).filter((row) =>
                bioflocParameters.some((key) => key === row.parameter),
              )
            : selected(kind)
      }
      parameterOptions={
        section === "biofloc" && kind === "measurements"
          ? bioflocParameters
          : undefined
      }
      pondId={selectedPond}
      cycleId={cycleId}
      allowed={canWrite(kind, role)}
      role={role}
      onSave={save}
    />
  );
  const moduleLinks = (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {modules
        .filter(
          ([id]) =>
            role === "owner" ||
            role === "admin" ||
            !["profit", "config", "billing", "team"].includes(id),
        )
        .map(([id, label, note]) => (
          <Link
            className="group rounded-2xl border border-border bg-white p-5 transition-shadow hover:shadow-md"
            key={id}
            to={href(id)}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">{label}</h2>
              <ArrowRight
                size={17}
                className="text-primary transition-transform group-hover:translate-x-1"
              />
            </div>
            <p className="mt-2 text-sm text-foreground-muted">{note}</p>
            {productScope[id] && (
              <span className="mt-3 inline-block rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-primary">
                {productScope[id].label}
              </span>
            )}
          </Link>
        ))}
    </div>
  );
  const content = (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
            {demo ? "Data simulasi" : (currentFarm?.name ?? "Tambakmu")}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#083F55]">
            {title}
          </h1>
          {modules.find(([id]) => id === section) && (
            <p className="mt-2 text-sm text-foreground-muted">
              {modules.find(([id]) => id === section)?.[2]}
            </p>
          )}
        </div>
        {farmId &&
          !(
            demo && ["weather", "aeration", "team", "billing"].includes(section)
          ) && (
            <Button
              variant="secondary"
              leadingIcon={<RefreshCw size={16} />}
              disabled={busy}
              onClick={() => void refresh()}
            >
              Perbarui
            </Button>
          )}
      </div>
      {demo && (
        <nav
          aria-label="Modul budidaya"
          className="mb-5 flex gap-2 overflow-x-auto pb-2"
        >
          {cultivationModules.map((item) => (
            <Link
              key={item.id}
              to={href(item.id)}
              aria-current={section === item.id ? "page" : undefined}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-semibold ${section === item.id ? "border-primary bg-primary text-white" : "border-border bg-white text-foreground"}`}
            >
              <item.icon size={17} />
              {item.name}
            </Link>
          ))}
        </nav>
      )}
      {productScope[section] && (
        <details className="mb-4 rounded-xl border border-border bg-surface-muted px-4 py-3">
          <summary className="cursor-pointer text-xs font-semibold text-primary">
            {productScope[section].label} · Tentang modul
          </summary>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground-muted">
            {productScope[section].note}
          </p>
        </details>
      )}
      {limitedKinds.length > 0 && (
        <p className="mb-4 rounded-xl border border-border bg-white p-4 text-sm">
          Grafik memakai 500 pengukuran terbaru, beserta hasil terakhir setiap
          probe. Ekspor lengkap memuat riwayat sebelumnya.
        </p>
      )}
      {message && (
        <p
          role="status"
          className="mb-5 rounded-xl border border-border bg-white p-4 text-sm"
        >
          {message}
        </p>
      )}
      {!online && (
        <p className="mb-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
          <WifiOff size={18} />
          Offline · Catatan baru disimpan di perangkat ini.
        </p>
      )}
      {!ready ? (
        <LoadingSkeleton rows={3} />
      ) : !farmId ? (
        <Card className="p-6">
          <h2 className="text-xl font-semibold">Mulai dari tambakmu</h2>
          <p className="my-3 text-sm text-foreground-muted">
            Tambahkan nama dan lokasi. Kolam bisa diisi setelahnya.
          </p>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              void run(async () => {
                await api("create-farm", {
                  name: String(fd.get("name")),
                  location: String(fd.get("location")),
                });
                await loadAccess();
              });
            }}
          >
            <label className="block text-sm font-semibold">
              Nama tambak
              <input
                name="name"
                className="pilot-input mt-2"
                required
                maxLength={120}
              />
            </label>
            <label className="block text-sm font-semibold">
              Lokasi
              <input
                name="location"
                className="pilot-input mt-2"
                required
                maxLength={300}
              />
            </label>
            <Button type="submit" disabled={!online} isLoading={busy}>
              Buat tambak
            </Button>
          </form>
        </Card>
      ) : (
        <>
          {ponds.length > 0 &&
            !["weather", "team", "billing"].includes(section) && (
              <div className="mb-6 grid gap-3 rounded-2xl border border-border bg-white p-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-foreground-muted">
                  Kolam aktif
                  <select
                    className="pilot-input mt-2"
                    value={selectedPond}
                    onChange={(e) => {
                      setPondId(e.target.value);
                      if (demo)
                        useAppStore.getState().selectPond(e.target.value);
                      setCycleId("");
                    }}
                  >
                    {ponds.map((p) => (
                      <option value={p.id} key={p.id}>
                        {String(p.name)}
                      </option>
                    ))}
                  </select>
                </label>
                {section !== "aeration" && (
                  <label className="text-xs font-semibold text-foreground-muted">
                    Siklus
                    <select
                      className="pilot-input mt-2"
                      value={cycleId}
                      onChange={(e) => setCycleId(e.target.value)}
                    >
                      <option value="">Semua siklus</option>
                      {(rows.cycles ?? [])
                        .filter((c) => c.pond_id === selectedPond)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {String(c.name)}
                          </option>
                        ))}
                    </select>
                  </label>
                )}
              </div>
            )}
          {loading ? (
            <LoadingSkeleton rows={4} />
          ) : (
            <div className="space-y-6">
              {section === "home" && (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      ["Kolam", String(ponds.length)],
                      ["Kondisi", assessment.title],
                      ["Belum tersinkron", String(pending.length)],
                    ].map(([label, value]) => (
                      <Card key={label} className="p-5">
                        <p className="text-xs text-foreground-muted">{label}</p>
                        <p className="mt-3 text-xl font-semibold">{value}</p>
                      </Card>
                    ))}
                  </div>
                  {!ponds.length ? (
                    <Card className="p-6">
                      <h2 className="text-lg font-semibold">
                        Tambahkan kolam pertama
                      </h2>
                      <Link
                        className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-primary"
                        to={href("ponds")}
                      >
                        Buka Kolam <ArrowRight size={16} />
                      </Link>
                    </Card>
                  ) : (
                    <MeasurementView
                      measurements={measurements}
                      rules={rules}
                      brainHref={href("brain")}
                    />
                  )}
                </>
              )}
              {section === "ponds" && (
                <>
                  {panel("ponds")}
                  {pond && (
                    <>
                      <div className="grid gap-4 lg:grid-cols-2">
                        {panel("cycles")}
                        {panel("measurements")}
                      </div>
                      <h2 className="text-xl font-semibold">
                        Kegiatan {String(pond.name)}
                      </h2>
                      {moduleLinks}
                    </>
                  )}
                </>
              )}
              {section === "services" && moduleLinks}
              {(section === "brain" || section === "activity") && (
                <>
                  <Card className="p-6">
                    <p className="text-xs font-semibold text-primary">
                      KONDISI DAN ALASAN
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold">
                      {assessment.title}
                    </h2>
                    <ul className="my-5 space-y-3 text-sm leading-6">
                      {assessment.reasons.map((reason) => (
                        <li key={reason} className="flex items-start gap-3">
                          <Activity
                            size={17}
                            className="mt-1 shrink-0 text-primary"
                          />
                          {reason}
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm text-foreground-muted">
                      Periksa sumber data, ukur ulang bila perlu, lalu catat
                      tindakan sesuai SOP.
                    </p>
                  </Card>
                  {panel("actions")}
                  <details className="rounded-2xl border border-border bg-white p-5">
                    <summary className="cursor-pointer font-semibold">
                      Acuan dan batas kolam
                    </summary>
                    <div className="mt-5">{panel("thresholds")}</div>
                  </details>
                  {section === "brain" && (
                    <PhotoPanel remote={remote} demo={demo} />
                  )}
                </>
              )}
              {section === "feed" && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {feedSummary(
                      (rows.feed ?? []).filter(
                        (r) => r.pond_id === selectedPond,
                      ),
                      cycleId,
                    ).map((s) => (
                      <Card key={s.product} className="p-5">
                        <h2 className="font-semibold">{s.product}</h2>
                        <p className="mt-3 text-2xl font-semibold">
                          {s.stock.toLocaleString("id-ID")}{" "}
                          <span className="text-sm font-normal">
                            kg tersisa
                          </span>
                        </p>
                        <p className="mt-3 text-sm text-foreground-muted">
                          Rencana {s.planned} kg · Realisasi {s.actual} kg ·
                          Selisih {s.difference} kg
                        </p>
                      </Card>
                    ))}
                  </div>
                  {panel("feed")}
                </>
              )}
              {section === "biofloc" && (
                <>
                  <BioflocSummary measurements={measurements} />
                  {pond?.system !== "biofloc" && (
                    <p className="rounded-xl border border-border bg-white p-4 text-sm">
                      Modul ini untuk pengamatan atau uji bioflok terawasi.
                    </p>
                  )}
                  {panel("measurements")}
                  {panel("biofloc")}
                  <Card className="p-5">
                    <h2 className="font-semibold">Pengingat uji</h2>
                    {!selected("schedules").length && (
                      <p className="mt-2 text-sm text-foreground-muted">
                        Jadwal uji belum diatur.
                      </p>
                    )}
                    {selected("schedules").map((schedule) => {
                      const latest = measurements
                        .filter(
                          (m) =>
                            m.parameter === schedule.parameter &&
                            m.quality === "valid",
                        )
                        .sort((a, b) =>
                          String(b.measured_at).localeCompare(
                            String(a.measured_at),
                          ),
                        )[0];
                      const due = latest
                        ? Date.parse(String(latest.measured_at)) +
                          Number(schedule.interval_hours) * 3600000
                        : null;
                      return (
                        <div
                          key={schedule.id}
                          className="mt-3 rounded-xl border border-border p-4"
                        >
                          <h3 className="text-sm font-semibold">
                            {labelFor(String(schedule.parameter))}
                          </h3>
                          <p className="mt-2 text-sm text-foreground-muted">
                            {!due
                              ? "Belum ada hasil uji valid"
                              : due < now
                                ? "Waktunya mengukur ulang"
                                : `Uji berikutnya ${new Date(due).toLocaleString("id-ID")}`}
                          </p>
                        </div>
                      );
                    })}
                  </Card>
                  <details className="rounded-xl border border-border bg-white p-4">
                    <summary className="cursor-pointer text-sm font-semibold">
                      Atur jadwal uji
                    </summary>
                    <div className="mt-4">{panel("schedules")}</div>
                  </details>
                </>
              )}
              {section === "profit" && (
                <>
                  {role !== "owner" && role !== "admin" ? (
                    <p>Akses keuangan dikelola pemilik.</p>
                  ) : (
                    <>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {[
                          [
                            "Biaya",
                            selected("costs").reduce(
                              (s, r) => s + Number(r.amount),
                              0,
                            ),
                          ],
                          [
                            "Pendapatan",
                            [
                              ...selected("harvests"),
                              ...selected("revenues"),
                            ].reduce((s, r) => s + Number(r.amount), 0),
                          ],
                          [
                            "Energi (kWh)",
                            selected("energy").reduce(
                              (s, r) => s + Number(r.kwh),
                              0,
                            ),
                          ],
                        ].map(([label, value]) => (
                          <Card className="p-5" key={label}>
                            <p className="text-sm text-foreground-muted">
                              {label}
                            </p>
                            <p className="mt-3 text-2xl font-semibold">
                              {Number(value).toLocaleString("id-ID")}
                            </p>
                          </Card>
                        ))}
                      </div>
                      <p className="text-sm text-foreground-muted">
                        Selisih tercatat:{" "}
                        {finance.difference.toLocaleString("id-ID", {
                          style: "currency",
                          currency: "IDR",
                        })}
                        .{" "}
                        {finance.fcr === null
                          ? "FCR belum dihitung. Pilih siklus selesai dengan biomassa awal dan catatan yang sudah diperiksa."
                          : `FCR tercatat ${finance.fcr.toLocaleString("id-ID", { maximumFractionDigits: 2 })}; margin tercatat ${finance.margin?.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%.`}
                      </p>
                      {panel("costs")}
                      {panel("revenues")}
                      {panel("harvests")}
                      {panel("energy")}
                    </>
                  )}
                </>
              )}
              {section === "config" && panel("configurations")}
              {section === "visits" && panel("services")}
              {demo &&
                ["weather", "aeration", "team", "billing"].includes(
                  section,
                ) && (
                  <DemoPreview
                    key={`${section}:${selectedPond}`}
                    farmId={farmId}
                    pondId={selectedPond}
                    pondName={String(pond?.name ?? "Kolam terpilih")}
                    kind={
                      section as "weather" | "aeration" | "team" | "billing"
                    }
                  />
                )}
              {!demo && section === "weather" && (
                <WeatherPanel
                  remote={remote}
                  measurements={measurements}
                  demo={demo}
                />
              )}
              {["devices", "aeration"].includes(section) &&
                !(demo && section === "aeration") && (
                  <>
                    <DevicesPanel
                      remote={remote}
                      demo={demo}
                      pondId={selectedPond}
                      owner={role === "owner" || role === "admin"}
                      aeration={section === "aeration"}
                    />
                    {section === "devices" && (
                      <>
                        {panel("probes")}
                        {panel("calibrations")}
                      </>
                    )}
                  </>
                )}
              {!demo && section === "billing" && (
                <CommercialPanel
                  remote={remote}
                  quotes={rows.quotes ?? []}
                  contracts={rows.contracts ?? []}
                  invoices={rows.invoices ?? []}
                  owner={role === "owner" || role === "admin"}
                  demo={demo}
                  refresh={refresh}
                />
              )}
              {!demo && section === "team" && (
                <TeamPanel
                  remote={remote}
                  owner={role === "owner" || role === "admin"}
                  demo={demo}
                />
              )}
              {section === "reports" && (
                <ReportQuality remote={remote} demo={demo} />
              )}
              {section === "reports" && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold">Laporan tambak</h2>
                  <p className="my-4 text-sm text-foreground-muted">
                    Ekspor mengikuti kolam dan siklus terpilih. Sumber, kualitas
                    dan waktu ukur ikut tersimpan.
                  </p>
                  <div className="mb-5 flex flex-wrap gap-3">
                    <Button
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          const source: Rows = {};
                          if (!demo && online) {
                            for (const kind of Object.keys(rows))
                              source[kind as keyof Rows] = await listEntities(
                                farmId,
                                kind,
                              );
                          } else Object.assign(source, rows);
                          const exported = Object.entries(source).flatMap(
                            ([kind]) =>
                              (source[kind as keyof Rows] ?? [])
                                .filter(
                                  (r) =>
                                    (!r.pond_id ||
                                      r.pond_id === selectedPond) &&
                                    (!cycleId ||
                                      r.cycle_id === cycleId ||
                                      kind === "thresholds" ||
                                      kind === "ponds" ||
                                      kind === "cycles"),
                                )
                                .map((r) => ({
                                  jenis: labelFor(kind),
                                  ...r,
                                })),
                          );
                          const url = URL.createObjectURL(
                            new Blob([csv(exported)], {
                              type: "text/csv;charset=utf-8",
                            }),
                          );
                          const link = document.createElement("a");
                          link.href = url;
                          link.download = "tambaqu-laporan.csv";
                          link.click();
                          URL.revokeObjectURL(url);
                        }, "Laporan diunduh.")
                      }
                    >
                      Unduh CSV
                    </Button>
                    <Button variant="secondary" onClick={() => window.print()}>
                      Cetak laporan
                    </Button>
                  </div>
                  <dl className="grid gap-3 sm:grid-cols-3">
                    {[
                      ["Pengukuran", measurements.length],
                      ["Tindakan", selected("actions").length],
                      ["Kalibrasi", selected("calibrations").length],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-xl bg-surface-muted p-4"
                      >
                        <dt className="text-sm">{label}</dt>
                        <dd className="mt-2 text-2xl font-semibold">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-5">{panel("actions")}</div>
                </Card>
              )}
              {admin && section === "admin" && <AdminPanel remote={remote} />}
              {pending.length > 0 && (
                <Card className="p-5">
                  <h2 className="font-semibold">Status sinkronisasi</h2>
                  {pending.map((item) => (
                    <div
                      className="mt-4 rounded-xl border border-border p-4"
                      key={item.id}
                    >
                      <p className="text-sm">
                        {definitions[item.kind].title} ·{" "}
                        {item.status === "pending"
                          ? "Menunggu koneksi"
                          : item.error}
                      </p>
                      {item.status !== "pending" && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            onClick={() =>
                              void run(async () => {
                                const server = await refreshKind(
                                  cache,
                                  farmId,
                                  item.kind,
                                );
                                const current = server.find(
                                  (r) => r.id === item.entityId,
                                );
                                if (item.status === "conflict") {
                                  if (!current)
                                    throw new Error(
                                      "Catatan asal tidak ditemukan.",
                                    );
                                  setConflictReview({ item, server: current });
                                  return;
                                }
                                await cache.pending.update(item.id, {
                                  status: "pending",
                                  error: undefined,
                                });
                                await syncEntities(cache);
                              })
                            }
                          >
                            Periksa lagi
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Batalkan perubahan lokal ini dan gunakan catatan server?",
                                )
                              )
                                void run(() => cache.pending.delete(item.id));
                            }}
                          >
                            Gunakan server
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </Card>
              )}
            </div>
          )}
        </>
      )}
      <Dialog
        open={Boolean(conflictReview)}
        onOpenChange={(v) => {
          if (!v) setConflictReview(null);
        }}
        title="Bandingkan perubahan"
        description="Catatan lokal belum menggantikan data server."
      >
        {conflictReview && (
          <>
            <div className="space-y-3">
              {definitions[conflictReview.item.kind].fields.map((field) => (
                <div
                  key={field.key}
                  className="rounded-lg border border-border p-3"
                >
                  <h3 className="text-xs font-semibold">{field.label}</h3>
                  <p className="mt-2 break-words text-sm">
                    Server:{" "}
                    {labelFor(String(conflictReview.server[field.key] ?? "—"))}
                  </p>
                  <p className="mt-1 break-words text-sm">
                    Perangkat ini:{" "}
                    {labelFor(
                      String(conflictReview.item.data[field.key] ?? "—"),
                    )}
                  </p>
                </div>
              ))}
            </div>
            <Button
              className="mt-5"
              disabled={!online || busy}
              onClick={() =>
                void run(async () => {
                  await cache.pending.update(conflictReview.item.id, {
                    version: conflictReview.server.version,
                    status: "pending",
                    error: undefined,
                  });
                  await syncEntities(cache);
                  setConflictReview(null);
                }, "Periksa kembali status sinkronisasi.")
              }
            >
              Simpan versi perangkat ini
            </Button>
          </>
        )}
      </Dialog>
      {admin && (
        <div className="mt-8 rounded-xl border border-border bg-white p-4">
          <Link
            className="text-sm font-semibold text-primary"
            to={href("admin")}
          >
            Ruang admin layanan
          </Link>
          <form
            className="mt-3 flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              generation.current++;
              setRows({});
              setFarmId(adminFarm);
            }}
          >
            <select
              aria-label="ID tambak layanan"
              className="pilot-input max-w-sm"
              value={adminFarm}
              onChange={(e) => setAdminFarm(e.target.value)}
            >
              <option value="">Pilih tambak layanan</option>
              {serviceFarms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <Button variant="secondary" type="submit">
              Buka tambak layanan
            </Button>
          </form>
        </div>
      )}
    </>
  );
  if (demo)
    return (
      <div className="operations-page mx-auto max-w-7xl">
        <Link
          className="mb-3 inline-flex min-h-8 items-center gap-2 text-sm font-semibold text-primary"
          to="/app/cultivation"
        >
          ← Semua fitur budidaya
        </Link>
        {content}
      </div>
    );
  return (
    <div className="workspace-shell min-h-screen lg:flex">
      <WorkspaceSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        groups={[
          {
            label: "Pantau",
            items: mainNav.map(([id, label, icon]) => ({
              label,
              href: href(id),
              icon,
            })),
          },
          {
            label: "Kelola",
            items: manageNav.map(([id, label, icon]) => ({
              label,
              href: href(id),
              icon,
            })),
          },
        ]}
        onLogout={() => {
          if (
            !pending.length ||
            window.confirm(
              "Catatan belum terkirim tetap tersimpan di akun ini. Keluar?",
            )
          )
            void cloud?.auth.signOut();
        }}
      />
      <div className="min-w-0 flex-1 pb-20 lg:pb-6">
        <header className="sticky top-0 z-20 flex min-h-18 items-center justify-between gap-4 border-b border-border bg-white/95 px-5 backdrop-blur lg:px-8">
          <div className="lg:hidden">
            <AppLogo compact />
          </div>
          <select
            aria-label="Tambak aktif"
            className="min-h-12 min-w-0 max-w-xs rounded-xl bg-white px-2 text-sm font-semibold"
            value={farmId}
            onChange={(e) => {
              generation.current++;
              setRows({});
              setPondId("");
              setFarmId(e.target.value);
            }}
          >
            {!access.length && <option value="">Tambak baru</option>}
            {access.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-foreground-muted">
            {online ? "Terhubung" : "Offline"}
          </span>
        </header>
        <main className="operations-page mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
          {content}
        </main>
      </div>
      <nav
        aria-label="Navigasi ponsel"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {mainNav.map(([id, label, Icon]) => (
          <NavLink
            key={id}
            className={({ isActive }) =>
              `flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${isActive ? "text-primary" : "text-foreground-muted"}`
            }
            to={href(id)}
          >
            <Icon size={19} />
            {label}
          </NavLink>
        ))}
        <button
          className="text-[11px] font-semibold"
          onClick={() => setMore(true)}
        >
          Lainnya
        </button>
      </nav>
      <Dialog
        open={more}
        onOpenChange={setMore}
        title="Lainnya"
        description="Kelola perangkat dan layanan."
      >
        <nav className="grid gap-2">
          {manageNav.map(([id, label, Icon]) => (
            <Link
              key={id}
              to={href(id)}
              onClick={() => setMore(false)}
              className="flex min-h-12 items-center gap-3 rounded-xl bg-surface-muted p-3 text-sm font-semibold"
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
      </Dialog>
    </div>
  );
}
