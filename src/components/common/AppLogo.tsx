import { Waves } from "lucide-react";
import { cn } from "../../utils/cn";

export function AppLogo({
  compact = false,
  inverted = false,
}: {
  compact?: boolean;
  inverted?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5" aria-label="TambaQu">
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-xl",
          inverted
            ? "bg-white/12 text-white"
            : "bg-primary text-primary-foreground",
        )}
      >
        <Waves size={21} aria-hidden="true" />
      </span>
      {!compact && (
        <span
          className={cn(
            "text-xl font-bold tracking-[-.04em]",
            inverted && "text-white",
          )}
        >
          Tamba
          <span className={inverted ? "text-[#7ee0d5]" : "text-primary"}>
            Qu
          </span>
        </span>
      )}
    </div>
  );
}
