import type { DemoScenario, DemoScenarioStep } from "../../domain/simulation";

const stable: DemoScenarioStep = {
  durationMs: 4_000,
  eventLabel: "Kondisi awal stabil",
  reading: {
    dissolvedOxygen: 5.8,
    ph: 7.9,
    temperature: 29,
    salinity: 19,
    ammonia: 0.03,
    nitrite: 0.02,
  },
  riskScore: 22,
  riskLevel: "safe",
  riskSummary:
    "Parameter utama relatif stabil. Lanjutkan monitoring rutin.",
  connectionStatus: "online",
  healthStatus: "healthy",
  signalStrength: "good",
};

const early34: DemoScenarioStep = {
  durationMs: 4_000,
  eventLabel: "DO mulai menurun",
  reading: { dissolvedOxygen: 5.2, ammonia: 0.06 },
  riskScore: 34,
  riskLevel: "safe",
  riskSummary:
    "Perubahan awal terpantau. Belum ada tindakan korektif prioritas.",
};

const warning48: DemoScenarioStep = {
  durationMs: 4_000,
  eventLabel: "Ambang peringatan tercapai",
  reading: { dissolvedOxygen: 4.8, ammonia: 0.09, temperature: 29.6 },
  riskScore: 48,
  riskLevel: "warning",
  riskSummary:
    "DO menunjukkan tren menurun dan amonia meningkat pada data simulasi.",
  alert: {
    id: "sim-alert-b-warning",
    severity: "warning",
    title: "DO menunjukkan tren menurun",
    description:
      "Peningkatan indikator risiko perlu ditinjau bersama kondisi Kolam B.",
    parameter: "dissolvedOxygen",
  },
};

const warning58: DemoScenarioStep = {
  durationMs: 4_000,
  eventLabel: "Risiko operasional meningkat",
  reading: { dissolvedOxygen: 4.5, ammonia: 0.11, temperature: 29.9 },
  riskScore: 58,
  riskLevel: "warning",
  riskSummary:
    "Kombinasi perubahan DO dan amonia meningkatkan indikator risiko operasional.",
};

const warning67: DemoScenarioStep = {
  durationMs: 4_000,
  eventLabel: "Rekomendasi aerasi tersedia",
  reading: { dissolvedOxygen: 4.2, ammonia: 0.14, temperature: 30.1 },
  riskScore: 67,
  riskLevel: "warning",
  riskSummary:
    "Skor risiko meningkat. Perubahan terutama berkaitan dengan penurunan DO dan kenaikan amonia.",
};

const critical76: DemoScenarioStep = {
  durationMs: 4_000,
  eventLabel: "Risiko memasuki tingkat kritis",
  reading: { dissolvedOxygen: 3.6, ammonia: 0.17, temperature: 30.3 },
  riskScore: 76,
  riskLevel: "critical",
  riskSummary:
    "Indikator risiko tinggi membutuhkan pemeriksaan kondisi kolam secara langsung.",
};

const critical84: DemoScenarioStep = {
  durationMs: 4_000,
  eventLabel: "Peringatan kritis dibuat",
  reading: {
    dissolvedOxygen: 3,
    ammonia: 0.2,
    nitrite: 0.11,
    temperature: 30.5,
  },
  riskScore: 84,
  riskLevel: "critical",
  riskSummary:
    "Kombinasi DO rendah dan parameter limbah menunjukkan kondisi berisiko tinggi.",
  alert: {
    id: "sim-alert-b-critical",
    severity: "critical",
    title: "Risiko kualitas air meningkat signifikan",
    description:
      "Skor risiko Kolam B mencapai tingkat Kritis pada mode simulasi.",
    parameter: "multiple",
  },
};

export const demoScenarios: DemoScenario[] = [
  {
    id: "stable",
    name: "Kondisi Stabil",
    description: "Kondisi awal Kolam B aman dan parameter utama stabil.",
    pondId: "pond-b",
    steps: [stable],
  },
  {
    id: "early-warning",
    name: "Peringatan Awal",
    description: "DO mulai menurun hingga peringatan awal muncul.",
    pondId: "pond-b",
    steps: [stable, early34, warning48],
  },
  {
    id: "warning-escalation",
    name: "Risiko Meningkat",
    description: "Kondisi berubah bertahap dari Aman menuju Waspada.",
    pondId: "pond-b",
    steps: [stable, early34, warning48, warning58, warning67],
  },
  {
    id: "critical",
    name: "Kondisi Kritis",
    description: "Indikator risiko meningkat hingga Kritis 84.",
    pondId: "pond-b",
    steps: [warning67, critical76, critical84],
  },
  {
    id: "recovery",
    name: "Pemulihan",
    description: "Monitoring lanjutan menunjukkan indikator risiko menurun.",
    pondId: "pond-b",
    steps: [
      critical84,
      {
        ...critical76,
        eventLabel: "DO mulai membaik setelah tindak lanjut",
        riskSummary:
          "Tindakan tercatat. Monitoring lanjutan menunjukkan indikator risiko mulai menurun.",
      },
      {
        ...warning58,
        reading: { dissolvedOxygen: 4.3, ammonia: 0.12 },
        riskScore: 61,
        eventLabel: "Indikator risiko menurun",
        riskSummary:
          "Indikator risiko menurun; kondisi tetap perlu dipantau dan diverifikasi.",
      },
      {
        ...warning48,
        reading: { dissolvedOxygen: 4.8, ammonia: 0.09 },
        alert: undefined,
        eventLabel: "Monitoring berlanjut pada tingkat Waspada",
        riskSummary:
          "Indikator risiko menurun menjadi Waspada. Monitoring tetap berlanjut.",
      },
    ],
  },
  {
    id: "device-failure",
    name: "Gangguan Perangkat",
    description: "Koneksi sensor melemah, terputus, lalu pulih kembali.",
    pondId: "pond-b",
    steps: [
      stable,
      {
        ...stable,
        eventLabel: "Koneksi perangkat melemah",
        connectionStatus: "degraded",
        healthStatus: "attention",
        signalStrength: "poor",
      },
      {
        ...stable,
        eventLabel: "Koneksi sensor terputus",
        connectionStatus: "offline",
        healthStatus: "offline",
        signalStrength: "none",
      },
      {
        ...stable,
        eventLabel: "Koneksi sensor dipulihkan",
        connectionStatus: "online",
        healthStatus: "healthy",
        signalStrength: "good",
      },
    ],
  },
];

export const defaultScenarioId = "warning-escalation";

export function getScenario(id: string) {
  return demoScenarios.find((scenario) => scenario.id === id) ?? demoScenarios[0];
}

export function getStableStep() {
  return stable;
}
