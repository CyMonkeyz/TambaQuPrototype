import { demoFarm, demoUser } from "../data/mock/fixtures";

export function getDemoSession() {
  return { user: demoUser, farm: demoFarm };
}
