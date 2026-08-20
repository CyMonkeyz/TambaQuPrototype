import type { ReactNode } from "react";

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-sm font-semibold text-primary">{eyebrow}</p>
        )}
        <h2 className="mt-1 text-lg font-semibold tracking-[-.02em] sm:text-xl">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-foreground-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
