import type { RiskContributor } from "../../domain/risk";
import { getSensorMeta } from "../../utils/formatters";

function getContributorLabel(item: RiskContributor) {
  return item.parameter === "weatherContext"
    ? "Konteks Lingkungan"
    : item.parameter === "dissolvedOxygen"
      ? "Dissolved Oxygen (DO)"
      : getSensorMeta(item.parameter).label;
}

export function RiskContributorList({
  contributors,
}: {
  contributors: RiskContributor[];
}) {
  return (
    <section aria-labelledby="contributors-title">
      <p className="text-xs font-semibold uppercase tracking-[.12em] text-primary">
        Mengapa?
      </p>
      <h2 id="contributors-title" className="mt-1 text-lg font-semibold">
        Kontribusi Risiko
      </h2>
      <div className="mt-5 space-y-5">
        {contributors.map((item, index) => (
          <article key={`${item.parameter}-${index}`}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <h3 className="font-semibold">{getContributorLabel(item)}</h3>
              <strong>{item.contribution}%</strong>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted"
              role="progressbar"
              aria-label={`${getContributorLabel(item)} menyumbang ${item.contribution} persen pada skor risiko`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={item.contribution}
            >
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${item.contribution}%` }}
              />
            </div>
            <p className="mt-2 text-sm leading-6 text-foreground-muted">
              {item.explanation}
            </p>
            <p className="mt-1 text-xs font-medium text-foreground-muted">
              {index === 0
                ? "Faktor paling berpengaruh pada skor saat ini."
                : "Faktor ini ikut memengaruhi skor saat ini."}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
