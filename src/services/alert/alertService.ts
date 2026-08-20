import type { Alert } from "../../domain/alert";

export function acknowledgeAlertRecord(
  alert: Alert,
  userId: string,
  timestamp: string,
): Alert {
  if (alert.status !== "new") return alert;
  return {
    ...alert,
    status: "acknowledged",
    acknowledgedAt: timestamp,
    acknowledgedBy: userId,
  };
}

export function resolveAlertRecord(
  alert: Alert,
  userId: string,
  timestamp: string,
): Alert {
  return {
    ...alert,
    status: "resolved",
    resolvedAt: timestamp,
    resolvedBy: userId,
  };
}
