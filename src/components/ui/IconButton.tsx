import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
}

export function IconButton({
  label,
  children,
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-xl text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground",
        className,
      )}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  );
}
