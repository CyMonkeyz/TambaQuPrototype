import type { DemoScenario } from "../domain/simulation";
import type { SimulationControlState } from "../domain/simulation";
import {
  advanceSimulationState,
  createSimulationState,
} from "../services/simulation/simulationEngine";
export interface DemoScene {
  id: string;
  label: string;
  title: string;
  description: string;
  action: string;
  oxygen: number;
  score: number;
  level: "safe" | "warning";
}
export const scenes: DemoScene[] = [
  {
    id: "observe",
    label: "Pantau",
    title: "Seluruh tambak, dalam satu pandangan.",
    description:
      "Contoh satu PondHub dengan tiga node. Pilih kolam dan lihat perubahan kualitas air.",
    action: "Coba kondisi berisiko",
    oxygen: 5.8,
    score: 22,
    level: "safe",
  },
  {
    id: "detect",
    label: "Kenali",
    title: "Perubahan kecil tidak lagi terlewat.",
    description:
      "Oksigen Kolam B turun. Peringatan muncul sebelum kondisi semakin berat.",
    action: "Lihat penjelasan",
    oxygen: 4.2,
    score: 67,
    level: "warning",
  },
  {
    id: "explain",
    label: "Pahami",
    title: "Pahami penyebab perubahan.",
    description:
      "PondBrain menghubungkan tren DO, pH, suhu, cuaca dan hasil uji manual dengan langkah pemeriksaan.",
    action: "Tinjau tindakan",
    oxygen: 4.2,
    score: 67,
    level: "warning",
  },
  {
    id: "act",
    label: "Tindak",
    title: "Langkah berikutnya, lebih jelas.",
    description:
      "Periksa aerasi bersama operator. Kendali terawasi tetap mengikuti pengaman lokal PondGuard.",
    action: "Catat tindakan",
    oxygen: 4.2,
    score: 67,
    level: "warning",
  },
  {
    id: "evaluate",
    label: "Evaluasi",
    title: "Lihat perubahan setelah tindak lanjut.",
    description:
      "Pada adegan pemulihan ini, oksigen kembali meningkat. Bandingkan tren dan catatan tim.",
    action: "Ulangi demo",
    oxygen: 5.4,
    score: 30,
    level: "safe",
  },
];
export const expoScenario: DemoScenario = {
  id: "expo-story",
  name: "Pantau hingga evaluasi",
  description: "Demo 90 detik",
  pondId: "b",
  steps: scenes.map((s) => ({
    durationMs: 18000,
    eventLabel: s.title,
    reading: {
      dissolvedOxygen: s.oxygen,
      temperature: s.level === "warning" ? 30.1 : 29,
      ph: 7.9,
      ammonia: s.level === "warning" ? 0.14 : 0.03,
    },
    riskScore: s.score,
    riskLevel: s.level,
    riskSummary: s.description,
  })),
};
export function goToScene(state: SimulationControlState, index: number) {
  return {
    ...state,
    currentStep: Math.max(0, Math.min(scenes.length - 1, index)),
    status:
      state.status === "running" ? ("running" as const) : ("paused" as const),
  };
}
export const initialExpoState = () => createSimulationState(expoScenario);
export const advanceExpo = (state: SimulationControlState) =>
  advanceSimulationState(state, expoScenario, true);
export interface PondVisual {
  id: string;
  name: string;
  oxygen: number | null;
  temperature: number | null;
  ph: number | null;
  status: "safe" | "warning" | "critical" | "unknown";
}
export function demoPonds(scene: number): PondVisual[] {
  return [
    {
      id: "a",
      name: "Kolam A",
      oxygen: 5.9,
      temperature: 28.7,
      ph: 7.8,
      status: "safe",
    },
    {
      id: "b",
      name: "Kolam B",
      oxygen: scenes[scene].oxygen,
      temperature: scene > 0 && scene < 4 ? 30.1 : 29,
      ph: 7.9,
      status: scenes[scene].level,
    },
    {
      id: "c",
      name: "Kolam C",
      oxygen: 5.6,
      temperature: 29.2,
      ph: 7.7,
      status: "safe",
    },
  ];
}
