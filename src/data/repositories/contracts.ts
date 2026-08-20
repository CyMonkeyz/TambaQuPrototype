import type { ActionLog } from "../../domain/action";
import type { Alert } from "../../domain/alert";
import type { Farm } from "../../domain/farm";
import type { Pond } from "../../domain/pond";
import type { Recommendation, RiskAssessment } from "../../domain/risk";
import type { SensorDevice, SensorReading } from "../../domain/sensor";

export interface FarmRepository {
  getById(id: string): Promise<Farm | null>;
}

export interface PondRepository {
  getByFarmId(farmId: string): Promise<Pond[]>;
  getById(id: string): Promise<Pond | null>;
}

export interface SensorRepository {
  getDeviceByPondId(pondId: string): Promise<SensorDevice | null>;
  getDevicesByFarmId(farmId: string): Promise<SensorDevice[]>;
  getCurrentReading(pondId: string): Promise<SensorReading | null>;
  getHistory(pondId: string, hours: number): Promise<SensorReading[]>;
}

export interface RiskRepository {
  getCurrentByPondId(pondId: string): Promise<RiskAssessment | null>;
  getCurrentByFarmId(farmId: string): Promise<RiskAssessment[]>;
  getRecommendations(riskAssessmentId: string): Promise<Recommendation[]>;
}

export interface AlertRepository {
  getByFarmId(farmId: string): Promise<Alert[]>;
  getByPondId(pondId: string): Promise<Alert[]>;
  getById(id: string): Promise<Alert | null>;
  acknowledge(id: string, userId: string, timestamp: string): Promise<Alert>;
  resolve(id: string, userId: string, timestamp: string): Promise<Alert>;
}

export interface ActionRepository {
  getByFarmId(farmId: string): Promise<ActionLog[]>;
  getByPondId(pondId: string): Promise<ActionLog[]>;
  getByRecommendationId(recommendationId: string): Promise<ActionLog | null>;
  add(action: ActionLog): Promise<ActionLog>;
}
