import { Link } from "react-router-dom";
import { Grid2X2 } from "lucide-react";
import { cultivationModules } from "../../operations/moduleCatalog";
export function CultivationShortcuts() {
  return (
    <nav
      aria-label="Kegiatan budidaya"
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6"
    >
      {cultivationModules.map((item) => (
        <Link
          key={item.id}
          to={`/app/modules/${item.id}`}
          className="module-entry flex min-h-14 items-center gap-3 rounded-xl border border-border bg-white px-4 text-sm font-semibold"
        >
          <item.icon size={19} className="shrink-0 text-primary" />
          {item.name}
        </Link>
      ))}
      <Link
        to="/app/cultivation"
        className="module-entry flex min-h-14 items-center gap-3 rounded-xl border border-border bg-surface-muted px-4 text-sm font-semibold text-primary"
      >
        <Grid2X2 size={19} />
        Semua fitur
      </Link>
    </nav>
  );
}
