import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import {
  cultivationModules,
  serviceModules,
} from "../../operations/moduleCatalog";
import { PageHeader } from "../../components/common/PageHeader";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

export function CultivationPage() {
  useDocumentTitle("Budidaya");
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Kegiatan tambak"
        title="Budidaya"
        description="Semua alat untuk merawat kolam, dalam satu tempat."
      />
      {[
        { title: "Kelola kolam", modules: cultivationModules },
        { title: "Perangkat & pendampingan", modules: serviceModules },
      ].map((group) => (
        <section key={group.title} aria-label={group.title}>
          <h2 className="mb-4 text-lg font-semibold">{group.title}</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {group.modules.map((item) => (
              <Link
                key={item.id}
                to={`/app/modules/${item.id}`}
                className="module-entry group rounded-2xl border border-border bg-white p-5"
              >
                <div className="flex items-start justify-between">
                  <span className="rounded-xl bg-surface-muted p-3 text-primary">
                    <item.icon size={24} />
                  </span>
                  <ArrowRight size={18} className="mt-2 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{item.name}</h3>
                <p className="mt-1 text-xs font-semibold text-primary">
                  {item.brand}
                </p>
                <p className="mt-3 text-sm leading-6 text-foreground-muted">
                  {item.description}
                </p>
                <span className="mt-4 inline-flex min-h-8 items-center text-sm font-semibold text-primary">
                  Buka {item.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
      <p className="text-xs leading-5 text-foreground-muted">
        Data demo disimpan di browser ini. Kendali aerator dan layanan tidak
        terhubung ke perangkat atau pihak lain.
      </p>
    </div>
  );
}
