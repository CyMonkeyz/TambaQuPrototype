import { ChevronRight, CirclePause, CirclePlay } from "lucide-react";
import { Link } from "react-router-dom";
import { getScenario } from "../../services/simulation/scenarioDefinitions";
import { useSimulationStore } from "../../store/simulation-store";

const statusLabels: Record<string, string> = {
  idle: "siap",
  running: "berjalan",
  paused: "dijeda",
  completed: "selesai",
};

export function DemoStatusBar() {
  const scenarioId = useSimulationStore((state) => state.scenarioId);
  const status = useSimulationStore((state) => state.status);
  const currentStep = useSimulationStore((state) => state.currentStep);
  const speed = useSimulationStore((state) => state.speed);
  const scenario = getScenario(scenarioId);
  const StepIcon = status === "running" ? CirclePlay : CirclePause;
  return (
    <div className="no-print border-b border-[#bfe1dc] bg-[#e8f6f3] px-5 py-2 text-xs text-[#255b57] lg:px-8">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <StepIcon size={14} className="shrink-0" aria-hidden="true" />
          <span className="font-semibold">Demo {statusLabels[status] ?? status}</span>
          <span className="hidden text-[#3e6561] sm:inline">· {scenario.name} · Langkah {currentStep + 1}/{scenario.steps.length} · {speed}×</span>
          <span className="truncate text-[#3e6561] sm:hidden">· {scenario.steps[currentStep]?.eventLabel}</span>
        </div>
        <Link to="/app/demo-control" className="inline-flex shrink-0 items-center gap-1 font-semibold text-primary">Kontrol <ChevronRight size={13} /></Link>
      </div>
    </div>
  );
}
