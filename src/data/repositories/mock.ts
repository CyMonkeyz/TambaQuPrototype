import type { ActionLog } from '../../domain/action'
import { demoActions, demoAlerts, demoDevices, demoFarm, demoPonds, demoReadings, demoRecommendations, demoRisks } from '../mock/fixtures'
import type { ActionRepository, AlertRepository, FarmRepository, PondRepository, RiskRepository, SensorRepository } from './contracts'

export class MockFarmRepository implements FarmRepository {
  async getById(id: string) { return id === demoFarm.id ? demoFarm : null }
}

export class MockPondRepository implements PondRepository {
  async getByFarmId(farmId: string) { return demoPonds.filter((pond) => pond.farmId === farmId) }
  async getById(id: string) { return demoPonds.find((pond) => pond.id === id) ?? null }
}

export class MockSensorRepository implements SensorRepository {
  async getDeviceByPondId(pondId: string) { return demoDevices.find((device) => device.pondId === pondId) ?? null }
  async getDevicesByFarmId(farmId: string) {
    const pondIds = new Set(demoPonds.filter((pond) => pond.farmId === farmId).map((pond) => pond.id))
    return demoDevices.filter((device) => pondIds.has(device.pondId))
  }
  async getCurrentReading(pondId: string) { return demoReadings.filter((reading) => reading.pondId === pondId).at(-1) ?? null }
  async getHistory(pondId: string, hours: number) { return demoReadings.filter((reading) => reading.pondId === pondId).slice(-(hours + 1)) }
}

export class MockRiskRepository implements RiskRepository {
  async getCurrentByPondId(pondId: string) { return demoRisks.find((risk) => risk.pondId === pondId) ?? null }
  async getCurrentByFarmId(farmId: string) {
    const pondIds = new Set(demoPonds.filter((pond) => pond.farmId === farmId).map((pond) => pond.id))
    return demoRisks.filter((risk) => pondIds.has(risk.pondId))
  }
  async getRecommendations(riskAssessmentId: string) { return demoRecommendations.filter((item) => item.riskAssessmentId === riskAssessmentId) }
}

export class MockAlertRepository implements AlertRepository {
  async getByFarmId(farmId: string) {
    const pondIds = new Set(demoPonds.filter((pond) => pond.farmId === farmId).map((pond) => pond.id))
    return demoAlerts.filter((alert) => pondIds.has(alert.pondId))
  }
  async getByPondId(pondId: string) { return demoAlerts.filter((alert) => alert.pondId === pondId) }
}

export class MockActionRepository implements ActionRepository {
  private actions: ActionLog[] = [...demoActions]
  async getByFarmId(farmId: string) {
    const pondIds = new Set(demoPonds.filter((pond) => pond.farmId === farmId).map((pond) => pond.id))
    return this.actions.filter((action) => pondIds.has(action.pondId))
  }
  async getByPondId(pondId: string) { return this.actions.filter((action) => action.pondId === pondId) }
  async add(action: ActionLog) { this.actions = [action, ...this.actions]; return action }
}
