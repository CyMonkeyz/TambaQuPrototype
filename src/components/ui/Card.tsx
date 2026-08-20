import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export const Card = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  function Card({ className, ...props }, ref) {
    return (
      <article
        ref={ref}
        className={cn(
          "min-w-0 rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]",
          className,
        )}
        {...props}
      />
    );
  },
);
