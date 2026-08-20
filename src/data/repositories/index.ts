import {
  MockActionRepository,
  MockAlertRepository,
  MockFarmRepository,
  MockPondRepository,
  MockRiskRepository,
  MockSensorRepository,
  resetMockDemoState,
} from "./mock";

export const repositories = {
  farm: new MockFarmRepository(),
  pond: new MockPondRepository(),
  sensor: new MockSensorRepository(),
  risk: new MockRiskRepository(),
  alert: new MockAlertRepository(),
  action: new MockActionRepository(),
};

export const resetDemoData = resetMockDemoState;

export type {
  ActionRepository,
  AlertRepository,
  FarmRepository,
  PondRepository,
  RiskRepository,
  SensorRepository,
} from "./contracts";
