import { useState } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { labelFor } from "./model";
interface Quality {
  start: string;
  end: string;
  probes: {
    probeId: string;
    serial: string;
    parameter: string;
    expected: number | null;
    valid: number | null;
  }[];
}
const local = (time: number) =>
  new Date(time - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
export function ReportQuality({
  remote,
  demo,
}: {
  remote: <T>(op: string, payload?: Record<string, unknown>) => Promise<T>;
  demo: boolean;
}) {
  const [result, setResult] = useState<Quality>(),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const [period] = useState(() => ({
    start: local(Date.now() - 86400000),
    end: local(Date.now()),
  }));
  const probes = result?.probes ?? [],
    expected = probes.reduce((s, r) => s + (r.expected ?? 0), 0),
    valid = probes.reduce((s, r) => s + (r.valid ?? 0), 0),
    complete =
      probes.length > 0 &&
      probes.every((p) => p.expected !== null) &&
      expected > 0;
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-lg font-semibold">Kelengkapan sensor tambak</h2>
      <p className="my-3 text-sm leading-6 text-foreground-muted">
        Hitung slot pengukuran valid berdasarkan interval setiap probe. Uji
        manual tidak dihitung sebagai data sensor.
      </p>
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setMessage("");
          const fd = new FormData(e.currentTarget);
          try {
            if (demo)
              throw new Error(
                "Laporan kelengkapan memakai data perangkat pada akun nyata.",
              );
            setResult(
              await remote("ops-quality", {
                start: new Date(String(fd.get("start"))).toISOString(),
                end: new Date(String(fd.get("end"))).toISOString(),
              }),
            );
          } catch (e) {
            setMessage(
              e instanceof Error ? e.message : "Laporan belum tersedia.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="text-sm font-semibold">
          Awal periode
          <input
            className="pilot-input mt-2"
            type="datetime-local"
            name="start"
            required
            defaultValue={period.start}
          />
        </label>
        <label className="text-sm font-semibold">
          Akhir periode
          <input
            className="pilot-input mt-2"
            type="datetime-local"
            name="end"
            required
            defaultValue={period.end}
          />
        </label>
        <Button isLoading={busy}>Hitung kelengkapan</Button>
      </form>
      <p role="status" className="mt-4 text-sm">
        {message}
      </p>
      {result && (
        <>
          <p className="mt-4 text-3xl font-semibold">
            {complete
              ? `${((valid / expected) * 100).toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`
              : "Belum dapat dihitung"}
          </p>
          <p className="mt-2 text-sm text-foreground-muted">
            Target pilot 85% · target ini bukan hasil yang dijamin.
          </p>
          <div className="mt-5 space-y-3">
            {!probes.length && (
              <p className="text-sm">Belum ada probe terdaftar.</p>
            )}
            {probes.map((p) => (
              <div
                key={p.probeId}
                className="rounded-xl border border-border p-4"
              >
                <h3 className="text-sm font-semibold">
                  {p.serial} · {labelFor(p.parameter)}
                </h3>
                <p className="mt-2 text-sm text-foreground-muted">
                  {p.expected === null
                    ? "Interval perangkat belum diatur"
                    : `${p.valid} slot valid dari ${p.expected} slot yang diharapkan`}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
