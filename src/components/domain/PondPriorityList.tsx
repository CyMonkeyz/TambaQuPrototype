import { ArrowRight, FlaskConical, Waves } from "lucide-react";
import { Link } from "react-router-dom";
import type { PondMonitoringOverview } from "../../domain/monitoring";
import { sortPondMonitoring } from "../../services/monitoring";
import { formatSensorValue } from "../../utils/formatters";
import { RiskBadge } from "../ui/RiskBadge";

export function PondPriorityList({
  ponds,
  limit,
}: {
  ponds: PondMonitoringOverview[];
  limit?: number;
}) {
  const items = sortPondMonitoring(ponds, "risk").slice(0, limit);
  return (
    <div className="divide-y divide-border">
      {items.map((item) => {
        const doValue = formatSensorValue(
          "dissolvedOxygen",
          item.reading.dissolvedOxygen,
        );
        const ammonia = formatSensorValue("ammonia", item.reading.ammonia);
        return (
          <div
            key={item.pond.id}
            className="flex flex-col justify-between gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
          >
            <div className="flex items-center gap-3">
              <div>
                <p className="font-semibold">{item.pond.name}</p>
                <p className="mt-1 text-xs text-foreground-muted">
                  {item.pond.code} · Hari ke-{item.pond.cultureDay}
                </p>
              </div>
              <RiskBadge level={item.risk.level} />
            </div>
            <div className="flex items-center justify-between gap-5 sm:justify-end">
              <div className="flex gap-4 text-xs">
                <span className="inline-flex items-center gap-1.5 text-foreground-muted">
                  <Waves size={14} />
                  DO{" "}
                  <strong className="text-foreground">{doValue.value}</strong>
                </span>
                <span className="inline-flex items-center gap-1.5 text-foreground-muted">
                  <FlaskConical size={14} />
                  NH3{" "}
                  <strong className="text-foreground">{ammonia.value}</strong>
                </span>
                <span className="text-foreground-muted">
                  Risk{" "}
                  <strong className="text-foreground">{item.risk.score}</strong>
                </span>
              </div>
              <Link
                className="relative z-10 inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-primary"
                to={`/app/ponds/${item.pond.id}`}
              >
                Detail <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
