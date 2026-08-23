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
        inverted && "rounded-2xl border border-white/20 bg-white px-3 py-2 shadow-sm",
      )}
      aria-label="TambaQu"
    >
      <img
        src="/brand/tambaqu-mark.png"
        alt=""
        width={512}
        height={512}
        className={cn(
          "size-9 shrink-0 object-contain",
          compact && "size-10",
        )}
      />
      {!compact && (
        <img
          src="/brand/tambaqu-wordmark.png"
          alt=""
          width={720}
          height={155}
          className="h-[25px] w-auto object-contain"
        />
      )}
    </div>
  );
}
