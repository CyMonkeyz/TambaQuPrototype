import { ChevronDown } from "lucide-react";
import type { PondMonitoringOverview } from "../../domain/monitoring";
import { RiskBadge } from "../ui/RiskBadge";

export function PondSelector({
  ponds,
  selectedPondId,
  onChange,
}: {
  ponds: PondMonitoringOverview[];
  selectedPondId: string;
  onChange: (pondId: string) => void;
}) {
  return (
    <div>
      <label
        className="text-xs font-semibold uppercase tracking-[.08em] text-foreground-muted"
        htmlFor="active-pond"
      >
        Kolam aktif
      </label>
      <div className="relative mt-2 sm:hidden">
        <select
          id="active-pond"
          className="h-12 w-full appearance-none rounded-xl border border-border bg-surface px-4 pr-10 font-semibold outline-none focus:border-primary"
          value={selectedPondId}
          onChange={(event) => onChange(event.target.value)}
        >
          {ponds.map((item) => (
            <option key={item.pond.id} value={item.pond.id}>
              {item.pond.name} · Risk {item.risk.score}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-3.5 text-foreground-muted"
          size={18}
        />
      </div>
      <div
        className="mt-2 hidden flex-wrap gap-2 sm:flex"
        role="group"
        aria-label="Pilih kolam yang dipantau"
      >
        {ponds.map((item) => (
          <button
            key={item.pond.id}
            className={`min-h-11 rounded-xl border px-3 text-left transition-colors ${item.pond.id === selectedPondId ? "border-primary bg-[#e4f5f2] text-primary" : "border-border bg-surface hover:bg-surface-muted"}`}
            onClick={() => onChange(item.pond.id)}
          >
            <span className="mr-2 text-sm font-semibold">{item.pond.name}</span>
            <RiskBadge level={item.risk.level} />
          </button>
        ))}
      </div>
    </div>
  );
}
