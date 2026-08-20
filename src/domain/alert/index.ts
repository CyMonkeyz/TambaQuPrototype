import type { SensorParameter } from "../sensor";
import type { RiskLevel } from "../risk";

export type AlertStatus = "new" | "acknowledged" | "resolved";

export interface Alert {
  id: string;
  pondId: string;
  timestamp: string;
  severity: Exclude<RiskLevel, "safe">;
  title: string;
  description: string;
  parameter: SensorParameter | "multiple";
  status: AlertStatus;
  riskAssessmentId: string;
}
