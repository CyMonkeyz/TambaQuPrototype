import {
  MockActionRepository,
  MockAlertRepository,
  MockFarmRepository,
  MockPondRepository,
  MockRiskRepository,
  MockSensorRepository,
} from "./mock";

export const remoteRepositories = {
  farm: new MockFarmRepository(),
  pond: new MockPondRepository(),
  sensor: new MockSensorRepository(),
  risk: new MockRiskRepository(),
  alert: new MockAlertRepository(),
  action: new MockActionRepository(),
};
