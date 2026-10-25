import { Link } from "react-router-dom";
import {
  Users,
  Handshake,
  Settings2,
  Receipt,
  ArrowUpRight,
} from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { Card } from "../../components/ui/Card";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { ProposalOverview } from "../../operations/ProposalOverview";
export function ServicesPage() {
  useDocumentTitle("Tim & Layanan");
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Kelola tambak"
        title="Tim & Layanan"
        description="Jelajahi contoh pengelolaan tim, kebutuhan tambak, dan layanan dalam satu ruang kerja."
      />
      <div className="demo-disclaimer" role="note">
        <p className="font-semibold">Simulasi layanan · data sintetis</p>
        <p className="mt-1">Alur ini menggunakan contoh lokal. Tidak mengundang anggota, memesan perangkat, mengirim permintaan lapangan, atau melakukan pembayaran nyata. Pembacaan sensor dan saran PondBrain bukan hasil perangkat atau AI produksi.</p>
      </div>
      <ProposalOverview />
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          {
            title: "Anggota tim",
            text: "Contoh anggota, peran operator, dan pembagian akses tambak.",
            icon: Users,
            path: "team",
          },
          {
            title: "Pendampingan Pondivator",
            text: "Simulasikan jadwal kunjungan dan tindak lanjut lapangan.",
            icon: Handshake,
            path: "visits",
          },
          {
            title: "Konfigurasi layanan",
            text: "Tentukan kebutuhan modul untuk tambakmu.",
            icon: Settings2,
            path: "config",
          },
          {
            title: "Langganan & Tagihan",
            text: "Pilihan paket dan tagihan simulasi, tanpa transaksi nyata.",
            icon: Receipt,
            path: "billing",
          },
        ].map((item) => (
          <Card key={item.path} className="service-card flex min-w-0 flex-col p-5 sm:p-6">
            <item.icon className="mb-5 text-primary" size={24} />
            <h2 className="font-semibold">{item.title}</h2>
            <p className="mb-4 mt-2 text-sm leading-6 text-foreground-muted">
              {item.text}
            </p>
            <Link
              to={item.path === "billing" ? "/app/billing" : `/app/modules/${item.path}`}
              className="mt-auto inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-primary"
            >
              Buka {item.title} <ArrowUpRight size={16} />
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
