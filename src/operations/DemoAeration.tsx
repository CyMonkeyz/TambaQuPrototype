import { useState } from "react";
import { useAppStore } from "../store/app-store";
import { Fan, ShieldCheck, RadioTower, AlertTriangle } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
type State = {
  running: boolean;
  interlock: boolean;
  history: { at: string; text: string }[];
};
const initial = (): State => ({
  running: false,
  interlock: false,
  history: [],
});
function read(key: string): State {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "null");
    if (
      value &&
      typeof value.running === "boolean" &&
      typeof value.interlock === "boolean" &&
      Array.isArray(value.history)
    )
      return {
        running: value.running && !value.interlock,
        interlock: value.interlock,
        history: value.history
          .filter(
            (h: State["history"][number]) =>
              h && typeof h.at === "string" && typeof h.text === "string",
          )
          .slice(0, 10),
      };
  } catch {
    /* Unavailable or invalid storage starts a safe, stopped session. */
  }
  return initial();
}
export function DemoAeration({
  farmId,
  pondId,
  pondName,
}: {
  farmId: string;
  pondId: string;
  pondName: string;
}) {
  const accountId = useAppStore(s => s.activeUser?.id ?? "demo");
  const key = `tambaqu:aeration:demo:${encodeURIComponent(accountId)}:${farmId}:${pondId}`;
  const [state, setState] = useState(() => read(key));
  const [message, setMessage] = useState("");
  function commit(next: State, text: string) {
    const value = {
      ...next,
      history: [{ at: new Date().toISOString(), text }, ...state.history].slice(
        0,
        10,
      ),
    };
    try {
      localStorage.setItem(key, JSON.stringify(value));
      setState(value);
      setMessage(text);
    } catch {
      setMessage("Penyimpanan browser tidak tersedia. Status belum diubah.");
    }
  }
  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-foreground-muted">
              Aerator contoh · {pondName}
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              {state.interlock
                ? "Dihentikan pengaman"
                : state.running
                  ? "Simulasi menyala"
                  : "Siap dicoba"}
            </h2>
          </div>
          <Fan
            size={40}
            className={`shrink-0 text-primary ${state.running ? "demo-fan-running" : ""}`}
          />
        </div>
        <p className="my-5 max-w-lg text-sm leading-6 text-foreground-muted">
          Coba kendali manual dan pengaman. Tombol ini tidak mengirim perintah
          ke motor.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            disabled={state.interlock}
            onClick={() =>
              commit(
                { ...state, running: !state.running },
                state.running
                  ? "Simulasi aerator dihentikan."
                  : "Simulasi aerator menyala. Kondisi air tidak diubah otomatis.",
              )
            }
          >
            {state.running ? "Hentikan simulasi" : "Coba nyalakan"}
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              commit(
                { ...state, interlock: !state.interlock, running: false },
                state.interlock
                  ? "Pengaman contoh dipulihkan. Aerator tetap berhenti sampai dinyalakan manual."
                  : "Gangguan contoh: pengaman menghentikan aerator dan memblokir start.",
              )
            }
          >
            {state.interlock
              ? "Pulihkan pengaman contoh"
              : "Coba gangguan pengaman"}
          </Button>
        </div>
        {state.interlock && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-risk-warning/10 p-3 text-sm">
            <AlertTriangle size={18} className="shrink-0" />
            Periksa gangguan sebelum memulai kembali. Pemulihan pengaman tidak
            menyalakan aerator otomatis.
          </p>
        )}
        <p role="status" className="mt-4 text-sm text-primary">
          {message}
        </p>
      </Card>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          [RadioTower, "Komunikasi", "Contoh PondHub terhubung"],
          [
            ShieldCheck,
            "Pengaman lokal",
            state.interlock ? "Interlock aktif" : "Siap diuji",
          ],
          [Fan, "Mode kendali", "Manual · simulasi"],
        ].map(([Icon, title, note]) => {
          const Symbol = Icon as typeof Fan;
          return (
            <Card key={String(title)} className="p-5">
              <Symbol className="mb-3 text-primary" size={21} />
              <h3 className="text-sm font-semibold">{String(title)}</h3>
              <p className="mt-2 text-xs text-foreground-muted">
                {String(note)}
              </p>
            </Card>
          );
        })}
      </div>
      <Card className="p-5 sm:p-6">
        <h2 className="font-semibold">Riwayat kendali demo</h2>
        {!state.history.length ? (
          <p className="mt-3 text-sm text-foreground-muted">
            Belum ada tindakan. Coba nyalakan aerator di atas.
          </p>
        ) : (
          <ol className="mt-3 divide-y divide-border">
            {state.history.map((item, index) => (
              <li key={`${item.at}:${index}`} className="py-3">
                <p className="text-sm leading-6">{item.text}</p>
                <time
                  className="mt-1 block text-xs text-foreground-muted"
                  dateTime={item.at}
                >
                  {new Date(item.at).toLocaleString("id-ID")}
                </time>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-4 text-xs leading-5 text-foreground-muted">
          Status dan riwayat tersimpan hanya untuk {pondName} pada browser ini.
          Penerimaan perintah nyata dan verifikasi motor memerlukan integrasi
          terpisah.
        </p>
      </Card>
    </div>
  );
}
