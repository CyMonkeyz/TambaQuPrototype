import { useState } from "react";
import { CloudSun, Users, Waves } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { DemoAeration } from "./DemoAeration";

/** Local examples only: these controls never contact a device or service. */
export function DemoPreview({
  kind,
  farmId = "demo-farm",
  pondId = "pond-b",
  pondName = "Kolam B",
}: {
  kind: "weather" | "aeration" | "team" | "billing";
  farmId?: string;
  pondId?: string;
  pondName?: string;
}) {
  const [requested, setRequested] = useState(false);
  const [message, setMessage] = useState("");
  if (kind === "aeration")
    return (
      <DemoAeration
        key={`${farmId}:${pondId}`}
        farmId={farmId}
        pondId={pondId}
        pondName={pondName}
      />
    );
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-xs font-semibold text-primary">
        <Waves size={16} /> Contoh demo · tanpa koneksi eksternal
      </div>
      {kind === "weather" && (
        <>
          <Card className="overflow-hidden p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-foreground-muted">
                  Cuaca contoh di sekitar tambak
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  Berawan menuju sore
                </h2>
              </div>
              <CloudSun size={52} className="shrink-0 text-primary" />
            </div>
            <div className="my-7 flex items-end gap-3">
              <span className="text-5xl font-semibold tracking-tight text-[#083F55]">
                29°
              </span>
              <span className="pb-1 text-sm text-foreground-muted">
                C · angin 8 km/jam
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["09.00", "Cerah berawan", "28°"],
                ["12.00", "Berawan", "31°"],
                ["15.00", "Hujan ringan", "29°"],
                ["18.00", "Berawan", "27°"],
              ].map(([time, condition, temperature]) => (
                <div
                  key={time}
                  className="rounded-2xl border border-border bg-surface-muted p-4"
                >
                  <p className="text-xs text-foreground-muted">{time}</p>
                  <p className="my-3 text-2xl font-semibold">{temperature}</p>
                  <p className="text-sm">{condition}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="font-semibold">Periksa kolam setelah hujan</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-foreground-muted">
              Ukur kembali pH dan oksigen. Cocokkan dengan kondisi air sebelum
              menentukan tindakan.
            </p>
            <p className="mt-4 text-xs text-foreground-muted">
              Prakiraan ini contoh, bukan data BMKG atau pengukuran sensor
              lokal.
            </p>
          </Card>
        </>
      )}
      {kind === "team" && (
        <Card className="p-6">
          <Users className="mb-4 text-primary" size={28} />
          <h2 className="text-xl font-semibold">Tim tambak</h2>
          <div className="mt-5 divide-y divide-border">
            {[
              ["Andi", "Pemilik", "Mengelola tambak dan anggota"],
              ["Budi", "Operator", "Memantau dan mencatat kegiatan"],
              ["Sari", "Pondivator", "Mendampingi kunjungan lapangan"],
            ].map(([name, role, note]) => (
              <div
                key={name}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div>
                  <p className="font-semibold">{name}</p>
                  <p className="mt-1 text-sm text-foreground-muted">{note}</p>
                </div>
                <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-primary">
                  {role}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-foreground-muted">
            Anggota contoh. Undangan email ditunda sampai akun nyata diaktifkan.
          </p>
        </Card>
      )}
      {kind === "billing" && (
        <>
          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Pilih sesuai kebutuhan
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Perangkat dan pendampingan
            </h2>
            <p className="mt-3 text-sm text-foreground-muted">
              Sewa bulanan atau per siklus mengikuti penawaran setelah survei.
              Perangkat tetap milik penyedia layanan.
            </p>
          </Card>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Pemantauan kolam", "PondHub dan node sensor sesuai kebutuhan."],
              [
                "Aerasi terawasi",
                "AeroPilot dengan pengaman lokal PondGuard. Uji terkontrol.",
              ],
              [
                "Cuaca sekitar tambak",
                "AquaWeather: cuaca mikro dan prakiraan wilayah.",
              ],
              [
                "Infrastruktur bersama",
                "Pilihan sukarela berbagi PondHub, cuaca, koneksi, dan layanan.",
              ],
            ].map(([name, note]) => (
              <Card key={name} className="p-6">
                <h3 className="font-semibold">{name}</h3>
                <p className="mt-2 text-sm text-foreground-muted">{note}</p>
              </Card>
            ))}
          </div>
          <p className="text-xs leading-5 text-foreground-muted">
            Modul dipilih saat survei, bukan paket dengan harga tetap. FeedPilot
            merupakan pengembangan lanjutan.
          </p>
          <Card className="p-6">
            <h2 className="font-semibold">Mulai dari survei tambak</h2>
            <p className="mb-4 mt-2 text-sm text-foreground-muted">
              Tim mengecek kolam, listrik, dan koneksi sebelum menyiapkan
              penawaran.
            </p>
            <Button
              disabled={requested}
              onClick={() => {
                setRequested(true);
                setMessage(
                  "Contoh permintaan survei tercatat untuk sesi ini. Tim layanan belum dihubungi.",
                );
              }}
            >
              {requested ? "Contoh permintaan tercatat" : "Coba ajukan survei"}
            </Button>
          </Card>
        </>
      )}
      <p role="status" className="text-sm text-primary">
        {message}
      </p>
    </div>
  );
}
