import Dexie, { type EntityTable } from "dexie";
import type { ActionLog } from "../../domain/action";
import type { Alert } from "../../domain/alert";
import type { Farm } from "../../domain/farm";
import type { OutboxItem, SyncMetaRecord } from "../../domain/offline";
import type { Pond } from "../../domain/pond";
import type { Recommendation, RiskAssessment } from "../../domain/risk";
import type { SensorDevice, SensorReading } from "../../domain/sensor";

export class TambaQuDatabase extends Dexie {
  farms!: EntityTable<Farm, "id">;
  ponds!: EntityTable<Pond, "id">;
  sensorReadings!: EntityTable<SensorReading, "id">;
  riskAssessments!: EntityTable<RiskAssessment, "id">;
  alerts!: EntityTable<Alert, "id">;
  recommendations!: EntityTable<Recommendation, "id">;
  actionLogs!: EntityTable<ActionLog, "id">;
  devices!: EntityTable<SensorDevice, "id">;
  outbox!: EntityTable<OutboxItem, "id">;
  syncMeta!: EntityTable<SyncMetaRecord, "key">;

  constructor(name = "TambaQuDB") {
    super(name);
    this.version(1).stores({
      farms: "id",
      ponds: "id,farmId",
      sensorReadings: "id,pondId,timestamp,[pondId+timestamp]",
      riskAssessments: "id,pondId,timestamp",
      alerts: "id,pondId,status,timestamp",
      recommendations: "id,riskAssessmentId",
      actionLogs: "id,pondId,performedAt,syncStatus",
      devices: "id,pondId,connectionStatus,healthStatus",
      outbox: "id,&clientMutationId,entityType,entityId,operation,status,createdAt",
      syncMeta: "key",
    });
  }
}

export const offlineDb = new TambaQuDatabase();
