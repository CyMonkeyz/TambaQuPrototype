import {
  Waves,
  Fan,
  Wheat,
  CloudSun,
  Wallet,
  Settings2,
  Handshake,
  Receipt,
  Users,
} from "lucide-react";
export const bioflocParameters = [
  "ammonia",
  "nitrite",
  "alkalinity",
  "sv30",
  "tss",
  "turbidity",
] as const;
export const cultivationModules = [
  {
    id: "biofloc",
    name: "Bioflok",
    brand: "BioflocCare",
    description: "Hasil uji air, volume flok, dan perawatan.",
    icon: Waves,
  },
  {
    id: "aeration",
    name: "Aerator",
    brand: "AeroPilot & PondGuard",
    description: "Status aerator, pengaman, dan riwayat kendali demo.",
    icon: Fan,
  },
  {
    id: "feed",
    name: "Pakan",
    brand: "FeedPilot",
    description: "Stok, jadwal, dan realisasi pemberian pakan.",
    icon: Wheat,
  },
  {
    id: "weather",
    name: "Cuaca",
    brand: "AquaWeather",
    description: "Cuaca sekitar tambak dan pengingat pemeriksaan.",
    icon: CloudSun,
  },
  {
    id: "profit",
    name: "Biaya & hasil",
    brand: "ProfitLens",
    description: "Pengeluaran, energi, panen, dan hasil per siklus.",
    icon: Wallet,
  },
] as const;
export const serviceModules = [
  {
    id: "config",
    name: "Kebutuhan tambak",
    brand: "PondConfig",
    description: "Survei dan rancangan instalasi sesuai kolam.",
    icon: Settings2,
  },
  {
    id: "visits",
    name: "Pendampingan",
    brand: "Pondivator",
    description: "Kunjungan, kalibrasi, dan penanganan gangguan.",
    icon: Handshake,
  },
  {
    id: "billing",
    name: "Sewa & tagihan",
    brand: "Layanan modular",
    description: "Pilihan modul dan contoh permintaan survei.",
    icon: Receipt,
  },
  {
    id: "team",
    name: "Tim tambak",
    brand: "Anggota & akses",
    description: "Pemilik, operator, dan pendamping lapangan.",
    icon: Users,
  },
] as const;
