import type { ReactNode } from "react";
import { Card } from "./Card";

export function MetricCard({
  label,
  value,
  unit,
  icon,
  supportingText,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  supportingText?: string;
}) {
  return (
    <Card className="p-4 shadow-none">
      <div className="flex items-center justify-between text-sm text-foreground-muted">
        <span>{label}</span>
        {icon}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-[-.035em]">
        {value}{" "}
        {unit && (
          <span className="text-sm font-medium text-foreground-muted">
            {unit}
          </span>
        )}
      </p>
      {supportingText && (
        <p className="mt-1 text-xs text-foreground-muted">{supportingText}</p>
      )}
    </Card>
  );
}
