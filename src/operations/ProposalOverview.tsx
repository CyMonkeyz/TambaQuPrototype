import { useState } from "react";
import { RadioTower, Waves, ShieldCheck, ArrowRight } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export function ProposalOverview() {
  const [shared, setShared] = useState(true);
  return (
    <div className="space-y-5">
      <Card className="overflow-hidden p-6 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Sewa modular · didampingi Pondivator
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          Mulai dari kebutuhan kolammu
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground-muted">
          Pilih modul setelah survei. Perangkat tetap milik penyedia layanan,
          dengan pemeliharaan selama masa sewa.
        </p>
        <ol
          className="mt-6 grid gap-3 sm:grid-cols-5"
          aria-label="Alur layanan TambaQu"
        >
          {[
            "Survei",
            "Penawaran sewa",
            "Pasang & uji",
            "Pantau & tindak",
            "Evaluasi siklus",
          ].map((step, index) => (
            <li
              key={step}
              className="flex items-center gap-3 rounded-xl bg-surface-muted p-3 text-sm font-medium"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-primary">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </Card>
      <Card className="p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-primary">
              Rancangan MVP · data contoh
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              Satu PondHub, tiga node
            </h2>
          </div>
          <RadioTower className="text-primary" size={28} />
        </div>
        <div
          className="mt-5 flex flex-wrap gap-2"
          role="group"
          aria-label="Contoh penempatan node"
        >
          <Button
            variant={shared ? "primary" : "secondary"}
            aria-pressed={shared}
            onClick={() => setShared(true)}
          >
            3 kolam berdekatan
          </Button>
          <Button
            variant={!shared ? "primary" : "secondary"}
            aria-pressed={!shared}
            onClick={() => setShared(false)}
          >
            1 kolam besar
          </Button>
        </div>
        <div className="mt-6 rounded-2xl border border-border bg-surface-muted p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-semibold text-primary">PondHub</span>
            <span className="text-xs text-foreground-muted">
              Komunikasi bersama · AquaWeather sesuai survei
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {["A", "B", "C"].map((node, index) => (
              <div
                key={node}
                className="rounded-xl border border-border bg-white p-4"
              >
                <Waves size={20} className="mb-3 text-primary" />
                <p className="text-sm font-semibold">
                  {shared ? `Kolam ${node}` : `Titik ${index + 1}`}
                </p>
                <p className="mt-1 text-xs text-foreground-muted">
                  SensorNode {index + 1}
                </p>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-4 flex items-start gap-2 text-sm leading-6">
          <ShieldCheck className="mt-1 shrink-0 text-primary" size={18} />
          {shared
            ? "Data, akses, dan pengaman setiap kolam tetap terpisah."
            : "Tiga titik membantu membaca kondisi dalam satu kolam besar."}
        </p>
        <details className="mt-4 border-t border-border pt-4">
          <summary className="cursor-pointer text-sm font-semibold text-primary">
            {shared
              ? "Bagaimana pembagian biaya?"
              : "Apa yang diperiksa saat survei?"}
          </summary>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground-muted">
            {shared
              ? "Berbagi infrastruktur bersifat sukarela. Pondivator membantu menyepakati biaya, tagihan tiap pemilik, lokasi perangkat, jadwal servis, dan hak keluar."
              : "Bentuk, luas, kedalaman, pola aerasi, listrik, jaringan, dan anggaran menentukan konfigurasi. Penempatan akhir mengikuti pemeriksaan lapangan."}
          </p>
        </details>
      </Card>
      <p className="flex items-center gap-2 text-xs text-foreground-muted">
        <ArrowRight size={14} />
        Contoh alur layanan. Belum ada kontrak atau permintaan yang dikirim.
      </p>
    </div>
  );
}
