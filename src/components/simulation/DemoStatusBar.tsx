import { Pause, Play, RotateCcw, Settings2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import {
  demoScenarios,
  getScenario,
} from "../../services/simulation/scenarioDefinitions";
import { useSimulationStore } from "../../store/simulation-store";
import { Dialog } from "../ui/Overlay";
import { Button } from "../ui/Button";
export function DemoStatusBar() {
  const store = useSimulationStore();
  const scenario = getScenario(store.scenarioId);
  const [reset, setReset] = useState(false);
  return (
    <>
      <section
        className="no-print border-b border-border bg-[#edf8f6] px-4 py-3 sm:px-6 lg:px-8"
        aria-label="Kontrol demo ringkas"
      >
        <div className="mx-auto flex max-w-[1536px] flex-wrap items-center justify-between gap-x-5 gap-y-2">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <span className="rounded-md border border-primary/15 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
              Data demo
            </span>
            <label className="min-w-0">
              <span className="sr-only">Skenario demo</span>
              <select
                className="min-h-11 max-w-[180px] rounded-lg border border-border bg-white px-3 text-xs font-semibold text-foreground sm:max-w-[240px]"
                value={store.scenarioId}
                onChange={(e) => store.selectScenario(e.target.value)}
              >
                {demoScenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <span className="hidden text-[11px] text-foreground-muted xl:inline">
              {scenario.steps[store.currentStep]?.eventLabel}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-white disabled:opacity-50"
              disabled={store.status === "completed"}
              onClick={store.status === "running" ? store.pause : store.start}
            >
              {store.status === "running" ? (
                <Pause size={14} />
              ) : (
                <Play size={14} />
              )}{" "}
              {store.status === "running" ? "Jeda" : "Jalankan"}
            </button>
            <button
              className="grid size-11 place-items-center rounded-lg border border-border bg-white text-foreground-muted"
              aria-label="Ulangi skenario demo"
              onClick={() => setReset(true)}
            >
              <RotateCcw size={15} />
            </button>
            <Link
              to="/app/demo-control"
              className="grid size-11 place-items-center rounded-lg text-foreground-muted hover:bg-white"
              aria-label="Pengaturan demo"
            >
              <Settings2 size={17} />
            </Link>
          </div>
        </div>
      </section>
      <Dialog
        open={reset}
        onOpenChange={setReset}
        title="Ulangi data demo?"
        description="Catatan tindakan dan perubahan dalam demo akan dihapus. Data akun pilot tetap terpisah."
      >
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setReset(false)}>
            Batal
          </Button>
          <Button
            onClick={() => {
              store.reset();
              setReset(false);
            }}
          >
            Ulangi demo
          </Button>
        </div>
      </Dialog>
    </>
  );
}
