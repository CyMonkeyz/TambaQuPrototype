import { useState } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { PhotoAssistant, Chat } from "../pilot/PilotWorkspace";
import { type Entity } from "./model";
import { cloud } from "../pilot/client";
import { deviceTypes } from "./deviceContract";
type Remote = <T>(op: string, payload?: Record<string, unknown>) => Promise<T>;
function Field({
  label,
  name,
  type = "text",
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        name={name}
        type={type}
        className="pilot-input mt-2"
        required={required}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "any" : undefined}
        maxLength={type === "password" ? undefined : 5000}
      />
    </label>
  );
}
const money = (n: unknown) =>
  Number(n).toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });
const statusLabels: Record<string, string> = {
  offered: "Ditawarkan",
  accepted: "Disetujui",
  withdrawn: "Ditarik",
  pending: "Menunggu pembayaran",
  paid: "Lunas",
  expired: "Kedaluwarsa",
  cancelled: "Dibatalkan",
  refunded: "Dikembalikan",
  acknowledged: "Diterima perangkat",
  succeeded: "Keluaran terkonfirmasi",
  failed: "Gagal",
  requested: "Diminta",
};
export function PhotoPanel({
  remote,
  demo,
}: {
  remote: Remote;
  demo: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  return (
    <details className="rounded-2xl border border-border bg-white p-5">
      <summary className="cursor-pointer font-semibold">
        Bantuan tambahan · Foto dan chat
      </summary>
      <div className="mt-5 space-y-5">
        {demo ? (
          <>
            <h2 className="font-semibold">Contoh hasil pembacaan foto</h2>
            <p className="text-sm leading-6">
              Kolam B, hasil uji manual: TAN 0,08 mg/L; nitrit 0,03 mg/L.
              Konteks: catatan operator setelah pengukuran pagi. Contoh ini
              tidak berasal dari unggahanmu.
            </p>
          </>
        ) : (
          <>
            <PhotoAssistant
              busy={busy}
              setBusy={setBusy}
              remote={remote}
              save={async (data) => {
                try {
                  await remote("ops-extraction", { data });
                  setMessage("Teks dan konteks tersimpan.");
                } catch (e) {
                  setMessage(
                    e instanceof Error ? e.message : "Belum tersimpan.",
                  );
                }
              }}
            />
            <Chat remote={remote} />
          </>
        )}
        <p role="status" className="text-sm">
          {message}
        </p>
      </div>
    </details>
  );
}
export function DevicesPanel({
  remote,
  demo,
  pondId,
  owner,
  aeration,
}: {
  remote: Remote;
  demo: boolean;
  pondId: string;
  owner: boolean;
  aeration: boolean;
}) {
  const [items, setItems] = useState<Entity[]>([]),
    [commands, setCommands] = useState<Entity[]>([]),
    [token, setToken] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    if (demo) {
      setMessage(
        "Contoh konfigurasi: 1 PondHub dan 3 SensorNode. Hubungkan akun nyata untuk mendaftarkan perangkat.",
      );
      return;
    }
    setItems(await remote<Entity[]>("devices"));
    if (aeration) setCommands(await remote<Entity[]>("ops-commands"));
  }
  async function run(work: () => Promise<unknown>) {
    setBusy(true);
    setMessage("");
    try {
      await work();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Belum berhasil.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-xl font-semibold">
        {aeration ? "AeroPilot & PondGuard" : "Perangkat tambak"}
      </h2>
      <p className="my-3 max-w-xl text-sm leading-6 text-foreground-muted">
        {aeration
          ? "Pantau status pengaman dan uji perintah. Diterima perangkat belum berarti motor bekerja."
          : "Daftarkan perangkat sesuai jenisnya. Token hanya ditampilkan sekali."}
      </p>
      <Button
        variant="secondary"
        isLoading={busy}
        onClick={() => void run(load)}
      >
        Muat perangkat
      </Button>
      {owner && !aeration && (
        <details className="mt-5 border-t border-border pt-4">
          <summary className="min-h-11 cursor-pointer text-sm font-semibold">
            Daftarkan perangkat
          </summary>
          <form
            className="mt-3 grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              void run(async () => {
                const r = await remote<{ token: string }>(
                  "ops-register-device",
                  {
                    name: fd.get("name"),
                    deviceType: fd.get("type"),
                    pondId,
                    hubId: fd.get("hub") || undefined,
                    sampleInterval: Number(fd.get("interval")) || undefined,
                  },
                );
                setToken(r.token);
                await load();
              });
            }}
          >
            <Field name="name" label="Nama perangkat" />
            <label className="text-sm font-semibold">
              Jenis
              <select className="pilot-input mt-2" name="type">
                {Object.keys(deviceTypes).map((t) => (
                  <option key={t} value={t}>
                    {
                      (
                        {
                          pond_hub: "PondHub",
                          sensor_node: "SensorNode",
                          aqua_weather: "AquaWeather",
                          aero_pilot: "AeroPilot",
                          pond_guard: "PondGuard",
                        } as Record<string, string>
                      )[t]
                    }
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              PondHub · opsional
              <select name="hub" className="pilot-input mt-2">
                <option value="">Langsung ke server</option>
                {items
                  .filter((r) => r.device_type === "pond_hub" && r.enabled)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {String(r.name)}
                    </option>
                  ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              Interval sensor (detik)
              <input
                className="pilot-input mt-2"
                name="interval"
                type="number"
                min="1"
                max="86400"
                defaultValue="60"
              />
            </label>
            <div className="flex items-end">
              <Button type="submit" disabled={demo || !pondId} isLoading={busy}>
                Daftarkan
              </Button>
            </div>
          </form>
        </details>
      )}
      {token && (
        <div className="my-5 rounded-xl border border-primary/30 bg-surface-muted p-4">
          <h3 className="font-semibold">Simpan token di perangkat</h3>
          <code className="my-3 block break-all text-xs">{token}</code>
          <Button variant="secondary" onClick={() => setToken("")}>
            Sudah disimpan
          </Button>
        </div>
      )}
      <p role="status" className="my-4 text-sm">
        {message}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {items
          .filter(
            (d) =>
              !aeration ||
              ["aero_pilot", "pond_guard"].includes(String(d.device_type)),
          )
          .map((d) => (
            <div className="rounded-xl border border-border p-4" key={d.id}>
              <h3 className="font-semibold">{String(d.name)}</h3>
              <p className="mt-2 text-xs text-foreground-muted">
                {String(d.device_type)} ·{" "}
                {d.last_seen
                  ? new Date(String(d.last_seen)).toLocaleString("id-ID")
                  : "Belum mengirim data"}
              </p>
              <code className="my-3 block break-all text-xs">{d.id}</code>
              <dl className="space-y-1 text-xs">
                {Object.entries(
                  (d.status ?? {}) as Record<string, unknown>,
                ).map(([key, value]) => (
                  <div className="flex justify-between gap-3" key={key}>
                    <dt>
                      {(
                        {
                          manualOverride: "Kendali manual",
                          interlock: "Interlock",
                          motorTrip: "Motor trip",
                          outputState: "Status keluaran",
                          clockSynced: "Jam tersinkron",
                          bufferedMessages: "Data dalam buffer",
                        } as Record<string, string>
                      )[key] ?? key}
                    </dt>
                    <dd>
                      {value === true
                        ? "Aktif"
                        : value === false
                          ? "Tidak aktif"
                          : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
              {owner && (
                <Button
                  className="mt-4"
                  variant="secondary"
                  disabled={
                    busy ||
                    !d.enabled ||
                    Boolean(
                      aeration &&
                        !((d.capabilities ?? []) as string[]).includes(
                          "aerator",
                        ),
                    )
                  }
                  onClick={() => {
                    if (
                      !window.confirm(
                        aeration
                          ? "Kirim perintah ke simulator? Kendali fisik tetap terkunci."
                          : "Cabut akses perangkat ini?",
                      )
                    )
                      return;
                    void run(async () => {
                      await remote(
                        aeration ? "command" : "revoke-device",
                        aeration
                          ? {
                              deviceId: d.id,
                              kind: "aerator",
                              confirmed: true,
                              simulation: true,
                            }
                          : { deviceId: d.id },
                      );
                      await load();
                    });
                  }}
                >
                  {aeration ? "Kirim uji simulator" : "Cabut akses"}
                </Button>
              )}
            </div>
          ))}
      </div>
      {commands.length > 0 && (
        <div className="mt-5">
          <h3 className="font-semibold">Riwayat perintah</h3>
          {commands.map((c) => (
            <p
              className="mt-3 rounded-lg bg-surface-muted p-3 text-sm"
              key={c.id}
            >
              {statusLabels[String(c.status)] ?? String(c.status)} ·{" "}
              {new Date(c.created_at).toLocaleString("id-ID")}
            </p>
          ))}
        </div>
      )}
    </Card>
  );
}
export function CommercialPanel({
  remote,
  quotes,
  contracts,
  invoices,
  owner,
  demo,
  refresh,
}: {
  remote: Remote;
  quotes: Entity[];
  contracts: Entity[];
  invoices: Entity[];
  owner: boolean;
  demo: boolean;
  refresh: () => Promise<void>;
}) {
  const [accepted, setAccepted] = useState<Record<string, boolean>>({}),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function run(work: () => Promise<unknown>) {
    setBusy(true);
    setMessage("");
    try {
      await work();
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Belum berhasil.");
    } finally {
      setBusy(false);
    }
  }
  if (!owner)
    return (
      <Card className="p-6">Kontrak dan tagihan dikelola pemilik tambak.</Card>
    );
  return (
    <div className="space-y-5">
      <Card className="p-6">
        <div className="mb-4 inline-block rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
          {demo ? "Contoh layanan" : "Pembayaran sandbox"}
        </div>
        <h2 className="text-xl font-semibold">Penawaran sewa</h2>
        <p className="my-3 text-sm leading-6 text-foreground-muted">
          Perangkat disewa beserta layanan. Harga mengikuti survei dan penawaran
          tim.
        </p>
        {!quotes.length && (
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Core Monitoring",
              "Smart Oxygen",
              "BioflocCare",
              "Cluster Service",
            ].map((name) => (
              <div key={name} className="rounded-xl border border-border p-4">
                <h3 className="font-semibold">{name}</h3>
                <p className="mt-2 text-sm text-foreground-muted">
                  Harga ditetapkan setelah survei.
                </p>
              </div>
            ))}
          </div>
        )}
        {quotes.map((q) => (
          <div key={q.id} className="mt-4 rounded-xl border border-border p-5">
            <h3 className="font-semibold">{String(q.package)}</h3>
            <p className="my-2 text-lg">
              {money(q.amount)}{" "}
              <span className="text-sm">
                /{q.period_type === "cycle" ? "siklus" : "bulan"}
              </span>
            </p>
            <p className="text-xs text-foreground-muted">
              {String(q.starts_on)} – {String(q.ends_on)} ·{" "}
              {statusLabels[String(q.status)]}
            </p>
            <details className="my-4 text-sm">
              <summary className="cursor-pointer font-semibold">
                Ketentuan sewa
              </summary>
              <p className="mt-3 whitespace-pre-wrap leading-6">
                {String(q.terms)}
              </p>
            </details>
            {q.status === "offered" && (
              <>
                <label className="mb-4 flex min-h-11 items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={accepted[q.id] ?? false}
                    onChange={(e) =>
                      setAccepted({ ...accepted, [q.id]: e.target.checked })
                    }
                  />
                  Saya menyetujui harga, periode dan ketentuan penawaran ini.
                </label>
                <Button
                  disabled={!accepted[q.id] || busy || demo}
                  onClick={() =>
                    void run(() =>
                      remote("ops-accept", { quoteId: q.id, accepted: true }),
                    )
                  }
                >
                  Setujui penawaran
                </Button>
              </>
            )}
          </div>
        ))}
      </Card>
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Tagihan</h2>
        {!invoices.length && (
          <p className="mt-4 text-sm text-foreground-muted">
            Belum ada tagihan.
          </p>
        )}
        {invoices.map((i) => (
          <div
            className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border p-4"
            key={i.id}
          >
            <div>
              <p className="font-semibold">{money(i.amount)}</p>
              <p className="mt-1 text-sm">
                {statusLabels[String(i.status)]} · {String(i.period)}
              </p>
            </div>
            {i.status === "pending" && (
              <Button
                disabled={busy || demo}
                onClick={() =>
                  void run(async () => {
                    const r = await remote<{ url: string }>("checkout", {
                      invoiceId: i.id,
                      normalized: true,
                    });
                    const u = new URL(r.url);
                    if (
                      u.protocol !== "https:" ||
                      u.hostname !== "app.sandbox.midtrans.com"
                    )
                      throw new Error("Alamat pembayaran sandbox tidak valid.");
                    window.location.assign(u.href);
                  })
                }
              >
                Bayar sandbox
              </Button>
            )}
          </div>
        ))}
      </Card>
      {contracts.map((c) => (
        <Card key={c.id} className="p-5">
          <p className="text-sm">
            {c.cancel_at_end
              ? "Perpanjangan dihentikan setelah periode berjalan."
              : "Kontrak mengikuti periode penawaran yang disetujui."}
          </p>
          {!c.cancel_at_end && (
            <Button
              variant="secondary"
              className="mt-4"
              disabled={busy || demo}
              onClick={() => {
                if (
                  window.confirm(
                    "Hentikan perpanjangan setelah periode berjalan?",
                  )
                )
                  void run(() => remote("ops-cancel", { contractId: c.id }));
              }}
            >
              Hentikan perpanjangan
            </Button>
          )}
        </Card>
      ))}
      <p role="status" className="text-sm">
        {message}
      </p>
    </div>
  );
}
export function TeamPanel({
  remote,
  owner,
  demo,
}: {
  remote: Remote;
  owner: boolean;
  demo: boolean;
}) {
  const [members, setMembers] = useState<{ user_id: string; role: string }[]>(
      [],
    ),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function run(work: () => Promise<unknown>) {
    setBusy(true);
    try {
      await work();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Belum berhasil.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold">Tim dan akses</h2>
      <p className="my-3 text-sm text-foreground-muted">
        Operator mencatat kegiatan. Pondivator menangani penugasan lapangan.
      </p>
      {owner && (
        <>
          <Button
            variant="secondary"
            disabled={busy || demo}
            onClick={() =>
              void run(async () => setMembers(await remote("ops-members")))
            }
          >
            Lihat anggota
          </Button>
          <form
            className="mt-5 grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              void run(async () => {
                await remote("invite", {
                  email: fd.get("email"),
                  role: fd.get("role"),
                });
                setMessage(
                  "Undangan disiapkan. Pengguna dapat masuk dengan email tersebut.",
                );
              });
            }}
          >
            <Field name="email" type="email" label="Email anggota" />
            <label className="text-sm font-semibold">
              Peran
              <select name="role" className="pilot-input mt-2">
                <option value="operator">Operator</option>
                <option value="pondivator">Pondivator</option>
              </select>
            </label>
            <Button type="submit" disabled={busy || demo}>
              Undang anggota
            </Button>
          </form>
          {members.map((m) => (
            <div
              className="mt-4 rounded-xl border border-border p-4"
              key={m.user_id}
            >
              <p className="break-all text-xs">{m.user_id}</p>
              <p className="my-2 text-sm">
                {m.role === "owner"
                  ? "Pemilik"
                  : m.role === "operator"
                    ? "Operator"
                    : "Pondivator"}
              </p>
              {m.role !== "owner" && (
                <select
                  aria-label={`Akses ${m.user_id}`}
                  className="pilot-input"
                  value={m.role}
                  onChange={(e) => {
                    const role = e.target.value;
                    if (
                      role === "revoke" &&
                      !window.confirm("Cabut akses anggota ini?")
                    )
                      return;
                    void run(async () => {
                      await remote("ops-member", { userId: m.user_id, role });
                      setMembers(await remote("ops-members"));
                    });
                  }}
                >
                  <option value="operator">Operator</option>
                  <option value="pondivator">Pondivator</option>
                  <option value="revoke">Cabut akses</option>
                </select>
              )}
            </div>
          ))}
        </>
      )}
      {demo && (
        <p className="mt-4 text-sm text-foreground-muted">
          Undangan memakai akun nyata. Tidak ada email yang dikirim dari demo.
        </p>
      )}
      <p role="status" className="mt-4 text-sm">
        {message}
      </p>
    </Card>
  );
}
export function WeatherPanel({
  remote,
  measurements,
  demo,
}: {
  remote: Remote;
  measurements: Entity[];
  demo: boolean;
}) {
  const [result, setResult] = useState<any>(),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <div className="space-y-5">
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Prakiraan wilayah</h2>
        <p className="my-3 text-sm text-foreground-muted">
          Sumber BMKG · terpisah dari pengukuran cuaca di tambak.
        </p>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setMessage("");
            const fd = new FormData(e.currentTarget);
            try {
              if (demo)
                throw new Error(
                  "Prakiraan langsung tersedia melalui akun nyata.",
                );
              setResult(await remote("weather", { areaCode: fd.get("code") }));
            } catch (e) {
              setMessage(
                e instanceof Error ? e.message : "Prakiraan belum tersedia.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field name="code" label="Kode wilayah BMKG" />
          <Button isLoading={busy}>Lihat prakiraan</Button>
        </form>
        <p role="status" className="mt-4 text-sm">
          {message}
        </p>
        {result && (
          <>
            <p className="my-4 text-xs text-foreground-muted">
              {String(result.lokasi?.desa ?? "Wilayah terpilih")} · Diperoleh{" "}
              {new Date().toLocaleString("id-ID")}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {result.data?.[0]?.cuaca
                ?.flat()
                .slice(0, 8)
                .map((c: any) => (
                  <div
                    key={c.datetime}
                    className="rounded-xl bg-surface-muted p-4"
                  >
                    <p className="text-xs">{c.local_datetime}</p>
                    <p className="my-2 font-semibold">{c.weather_desc}</p>
                    <p className="text-sm">
                      {c.t} °C · {c.hu}%
                    </p>
                  </div>
                ))}
            </div>
          </>
        )}
      </Card>
      <Card className="p-6">
        <h2 className="font-semibold">Cuaca lokal · AquaWeather</h2>
        <p className="mt-3 text-sm text-foreground-muted">
          {measurements.some((r) =>
            ["airTemperature", "humidity", "rainfall", "windSpeed"].includes(
              String(r.parameter),
            ),
          )
            ? "Pengukuran lokal tercatat pada riwayat sensor."
            : "Belum ada pengukuran cuaca lokal. Prakiraan wilayah tidak menggantikannya."}
        </p>
      </Card>
    </div>
  );
}
export function AdminPanel({ remote }: { remote: Remote }) {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <div className="space-y-5">
      <Card className="p-6">
        <h2 className="text-xl font-semibold">Penawaran layanan</h2>
        <p className="my-3 text-sm text-foreground-muted">
          Gunakan biaya survei yang sudah disahkan. Semua pembayaran versi ini
          memakai sandbox.
        </p>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const fd = new FormData(e.currentTarget);
            try {
              await remote("ops-quote", {
                package: fd.get("package"),
                amount: Number(fd.get("amount")),
                periodType: fd.get("period"),
                startsOn: fd.get("start"),
                endsOn: fd.get("end"),
                terms: fd.get("terms"),
              });
              setMessage("Penawaran tersimpan.");
            } catch (e) {
              setMessage(e instanceof Error ? e.message : "Belum tersimpan.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="text-sm font-semibold">
            Paket
            <select className="pilot-input mt-2" name="package">
              {[
                "Core Monitoring",
                "Smart Oxygen",
                "BioflocCare",
                "Cluster Service",
              ].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Periode
            <select className="pilot-input mt-2" name="period">
              <option value="monthly">Bulanan</option>
              <option value="cycle">Per siklus</option>
            </select>
          </label>
          <Field name="amount" label="Harga yang disahkan (Rp)" type="number" />
          <Field name="start" label="Mulai" type="date" />
          <Field name="end" label="Selesai" type="date" />
          <label className="block text-sm font-semibold sm:col-span-2">
            Ketentuan
            <textarea
              name="terms"
              className="pilot-input mt-2 min-h-32"
              required
              maxLength={5000}
            />
          </label>
          <Button type="submit" isLoading={busy}>
            Buat penawaran
          </Button>
        </form>
        <p role="status" className="mt-4 text-sm">
          {message}
        </p>
      </Card>
      <AdminUtilities remote={remote} />
    </div>
  );
}
function AdminUtilities({ remote }: { remote: Remote }) {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [catalog, setCatalog] = useState<Entity[]>([]);
  async function run(work: () => Promise<unknown>) {
    setBusy(true);
    try {
      await work();
      setMessage("Perubahan tersimpan.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Belum berhasil.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Katalog layanan</h2>
        <Button
          className="my-4"
          variant="secondary"
          onClick={() =>
            void run(async () => setCatalog(await remote("ops-catalog-list")))
          }
        >
          Muat katalog
        </Button>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            void run(() =>
              remote("ops-catalog", {
                id: fd.get("id") || undefined,
                name: fd.get("name"),
                monthlyPrice: Number(fd.get("price")),
                enabled: fd.get("enabled") === "yes",
              }),
            );
          }}
        >
          <label className="text-sm font-semibold">
            Catatan katalog
            <select className="pilot-input mt-2" name="id">
              <option value="">Tambah versi katalog</option>
              {catalog.map((c) => (
                <option key={c.id} value={c.id}>
                  {String(c.name)} · {money(c.monthly_price)} ·{" "}
                  {c.enabled ? "Aktif" : "Nonaktif"}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Paket
            <select className="pilot-input mt-2" name="name">
              {[
                "Core Monitoring",
                "Smart Oxygen",
                "BioflocCare",
                "Cluster Service",
              ].map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
          <Field name="price" label="Harga acuan bulanan (Rp)" type="number" />
          <label className="text-sm font-semibold">
            Ketersediaan
            <select name="enabled" className="pilot-input mt-2">
              <option value="no">Nonaktif</option>
              <option value="yes">Aktif</option>
            </select>
          </label>
          <Button isLoading={busy}>Simpan katalog</Button>
        </form>
      </Card>
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Penugasan Pondivator</h2>
        <form
          className="mt-5 grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            void run(() =>
              remote("ops-assign", {
                id: fd.get("visit"),
                userId: fd.get("person"),
              }),
            );
          }}
        >
          <Field name="visit" label="Referensi kunjungan" />
          <Field name="person" label="ID Pondivator dari anggota tambak" />
          <Button isLoading={busy}>Tugaskan petugas</Button>
        </form>
      </Card>
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Klaster dan gateway bersama</h2>
        <p className="my-3 text-sm text-foreground-muted">
          Hak data dan proteksi tetap terpisah per tambak.
        </p>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const members = String(fd.get("members"))
              .split("\n")
              .filter((s) => s.trim())
              .map((line) => {
                const [farmId, costShare] = line
                  .split(",")
                  .map((s) => s.trim());
                return { farmId, costShare: Number(costShare) };
              });
            void run(() =>
              remote("ops-cluster", {
                name: fd.get("name"),
                hubId: fd.get("hub"),
                agreement: fd.get("agreement"),
                members,
              }),
            );
          }}
        >
          <Field name="name" label="Nama klaster" />
          <Field name="hub" label="ID PondHub" />
          <label className="block text-sm font-semibold sm:col-span-2">
            Anggota dan alokasi biaya
            <textarea
              name="members"
              className="pilot-input mt-2 min-h-24"
              required
              placeholder="ID tambak, alokasi biaya — satu tambak per baris"
            />
          </label>
          <label className="block text-sm font-semibold sm:col-span-2">
            Kesepakatan
            <textarea
              name="agreement"
              className="pilot-input mt-2 min-h-24"
              required
              maxLength={5000}
            />
          </label>
          <Button isLoading={busy}>Simpan klaster</Button>
        </form>
        <form
          className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            void run(() =>
              remote("ops-link-node", {
                hubId: fd.get("hub"),
                nodeId: fd.get("node"),
              }),
            );
          }}
        >
          <Field name="hub" label="ID PondHub" />
          <Field name="node" label="ID SensorNode anggota klaster" />
          <Button isLoading={busy} variant="secondary">
            Tautkan node
          </Button>
        </form>
      </Card>
      <Card className="p-5">
        <h2 className="font-semibold">Pemulihan akun admin</h2>
        <Button
          className="mt-4"
          variant="secondary"
          onClick={() =>
            void run(async () => {
              const s = await cloud?.auth.getSession();
              if (!s?.data.session?.user.email)
                throw new Error("Masuk kembali.");
              const r = await cloud!.auth.resetPasswordForEmail(
                s.data.session.user.email,
                { redirectTo: location.origin + "/login" },
              );
              if (r.error) throw r.error;
            })
          }
        >
          Kirim tautan pemulihan
        </Button>
      </Card>
      <p role="status" className="text-sm">
        {message}
      </p>
    </>
  );
}
