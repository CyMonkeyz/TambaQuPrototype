import { cn } from "../../utils/cn";

export function AppLogo({
  compact = false,
  inverted = false,
}: {
  compact?: boolean;
  inverted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex w-fit items-center gap-2.5",
        inverted &&
          "rounded-2xl border border-white/20 bg-white px-3 py-2 shadow-sm",
      )}
      aria-label="TambaQu"
    >
      <img
        src={
          compact
            ? "/brand/tambaqu-current-mark.png"
            : "/brand/tambaqu-current-lockup.png"
        }
        alt=""
        width={compact ? 390 : 1070}
        height={compact ? 440 : 294}
        className={cn(
          "shrink-0 object-contain",
          compact ? "size-10" : "h-11 w-[164px] max-w-full",
        )}
      />
    </div>
  );
}
