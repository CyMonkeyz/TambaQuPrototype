import type { Alert } from "../alert";
import type { RiskLevel } from "../risk";
import type {
  DeviceConnectionStatus,
  DeviceHealthStatus,
  SensorReading,
  SignalStrength,
} from "../sensor";

export type SimulationStatus = "idle" | "running" | "paused" | "completed";
export type SimulationSpeed = 1 | 2 | 4;

export interface SimulationAlertTemplate {
  id: string;
  severity: Alert["severity"];
  title: string;
  description: string;
  parameter: Alert["parameter"];
}

export interface DemoScenarioStep {
  durationMs: number;
  eventLabel: string;
  reading: Partial<Omit<SensorReading, "id" | "pondId" | "timestamp">>;
  riskScore: number;
  riskLevel: RiskLevel;
  riskSummary: string;
  alert?: SimulationAlertTemplate;
  connectionStatus?: DeviceConnectionStatus;
  healthStatus?: DeviceHealthStatus;
  signalStrength?: SignalStrength;
}

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  pondId: string;
  steps: DemoScenarioStep[];
}

export interface SimulationControlState {
  scenarioId: string;
  status: SimulationStatus;
  currentStep: number;
  speed: SimulationSpeed;
  startedAt: string | null;
  selectedPondId: string;
}
