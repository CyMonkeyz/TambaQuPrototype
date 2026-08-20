import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "../../utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  leadingIcon?: ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-[var(--primary-hover)] border-transparent",
  secondary: "bg-surface text-foreground border-border hover:bg-surface-muted",
  ghost:
    "bg-transparent text-foreground-muted border-transparent hover:bg-surface-muted hover:text-foreground",
  danger: "bg-risk-critical text-white border-risk-critical hover:opacity-90",
};

export function Button({
  className,
  variant = "primary",
  isLoading,
  leadingIcon,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55",
        variants[variant],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <LoaderCircle className="animate-spin" size={17} aria-hidden="true" />
      ) : (
        leadingIcon
      )}
      {children}
    </button>
  );
}
