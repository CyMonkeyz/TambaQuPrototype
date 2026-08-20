import { BellRing, Database, UserRound } from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useAppStore } from "../../store/app-store";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

export function SettingsPage() {
  useDocumentTitle("Pengaturan");
  const user = useAppStore((state) => state.activeUser);
  const farm = useAppStore((state) => state.activeFarm);
  const sections = [
    {
      icon: UserRound,
      title: "Profil pengguna",
      description: `${user?.name} · Peran ${user?.role}`,
    },
    {
      icon: BellRing,
      title: "Preferensi alert",
      description:
        "Kanal dan ambang notifikasi akan dikonfigurasi pada fase mendatang.",
    },
    {
      icon: Database,
      title: "Data & sinkronisasi",
      description:
        "Fondasi untuk status offline dan antrean sinkronisasi telah disiapkan pada model domain.",
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Kelola profil, tambak aktif, dan preferensi aplikasi."
      />
      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_.65fr]">
        <div className="space-y-3">
          {sections.map((item) => (
            <Card
              key={item.title}
              className="flex items-start gap-4 p-5 shadow-none"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-muted text-primary">
                <item.icon size={19} />
              </span>
              <div>
                <h2 className="font-semibold">{item.title}</h2>
                <p className="mt-1 text-sm leading-6 text-foreground-muted">
                  {item.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
        <Card className="h-fit p-5 shadow-none">
          <p className="text-sm font-semibold text-primary">Tambak aktif</p>
          <h2 className="mt-2 text-lg font-semibold">{farm?.name}</h2>
          <p className="mt-1 text-sm text-foreground-muted">{farm?.location}</p>
          <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm text-foreground-muted">
              Lingkungan aplikasi
            </span>
            <StatusBadge status="active" />
          </div>
          <p className="mt-4 rounded-xl bg-surface-muted p-3 text-xs leading-5 text-foreground-muted">
            Mode demo menggunakan data synthetic dan penyimpanan sesi lokal pada
            perangkat ini.
          </p>
        </Card>
      </div>
    </>
  );
}
