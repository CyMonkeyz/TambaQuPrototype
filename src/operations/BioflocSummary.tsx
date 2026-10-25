import { Card } from "../components/ui/Card";
import { parameters, labelFor, type Entity } from "./model";
import { bioflocParameters } from "./moduleCatalog";
export function BioflocSummary({ measurements }: { measurements: Entity[] }) {
  return (
    <section aria-label="Ringkasan bioflok" className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Hasil uji air & flok</h2>
        <p className="mt-1 text-sm leading-6 text-foreground-muted">
          Periksa hasil terbaru, lalu catat uji ulang atau perawatan di bawah.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        {bioflocParameters.map((key) => {
          const meta = parameters[key];
          const point = measurements
            .filter((r) => r.parameter === key)
            .sort(
              (a, b) =>
                Date.parse(String(b.measured_at)) -
                Date.parse(String(a.measured_at)),
            )[0];
          return (
            <Card key={key} className="min-w-0 p-4 sm:p-5">
              <h3 className="text-sm font-medium text-foreground-muted">
                {meta.label}
              </h3>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                {point ? Number(point.value).toLocaleString("id-ID") : "—"}
              </p>
              <p className="mt-1 text-xs text-foreground-muted">
                {point ? meta.unit : "Belum diukur"}
              </p>
              {point && (
                <>
                  <p className="mt-3 text-xs font-semibold text-primary">
                    {labelFor(String(point.source))} ·{" "}
                    {labelFor(String(point.quality))}
                  </p>
                  <time
                    className="mt-1 block text-xs leading-5 text-foreground-muted"
                    dateTime={String(point.measured_at)}
                  >
                    {new Date(String(point.measured_at)).toLocaleString(
                      "id-ID",
                    )}
                  </time>
                </>
              )}
            </Card>
          );
        })}
      </div>
      <details className="rounded-xl border border-border bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold text-primary">
          Cara membaca hasil
        </summary>
        <p className="mt-3 text-sm leading-6 text-foreground-muted">
          SV30 menunjukkan volume flok yang mengendap. TSS dan kekeruhan memakai
          metode serta satuan berbeda; nilainya tidak saling menggantikan.
          Bandingkan hasil dengan SOP kolam dan riwayat pengukuran.
        </p>
      </details>
    </section>
  );
}
