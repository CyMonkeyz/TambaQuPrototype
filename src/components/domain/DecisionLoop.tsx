import { Activity, BrainCircuit, CheckCircle2, Lightbulb } from "lucide-react";

const steps = [
  { label: "Sense", icon: Activity },
  { label: "Analyze", icon: BrainCircuit },
  { label: "Recommend", icon: Lightbulb },
  { label: "Act & Learn", icon: CheckCircle2 },
];

export function DecisionLoop({ hasAction }: { hasAction: boolean }) {
  return (
    <div
      className="rounded-xl bg-surface-muted p-4"
      aria-label="Loop dukungan keputusan TambaQu"
    >
      <div className="grid grid-cols-4 gap-2">
        {steps.map((step, index) => (
          <div key={step.label} className="relative text-center">
            <span
              className={`mx-auto grid size-9 place-items-center rounded-full ${hasAction || index < 3 ? "bg-primary text-primary-foreground" : "bg-surface text-foreground-muted"}`}
            >
              <step.icon size={16} aria-hidden="true" />
            </span>
            <p className="mt-2 text-[10px] font-semibold text-foreground-muted sm:text-xs">
              {step.label}
            </p>
            {index < steps.length - 1 && (
              <span
                className="absolute left-[calc(50%+22px)] top-4 h-px w-[calc(100%-44px)] bg-border"
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
