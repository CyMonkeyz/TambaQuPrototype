import { ChevronRight, Droplets } from "lucide-react";
import { Link } from "react-router-dom";
import type { Pond } from "../../domain/pond";
import type { RiskAssessment } from "../../domain/risk";
import type { SensorDevice, SensorReading } from "../../domain/sensor";
import { getDataFreshness } from "../../services/monitoring";
import { formatSensorValue, formatWibTime } from "../../utils/formatters";
import { Card } from "../ui/Card";
import { RiskBadge } from "../ui/RiskBadge";
import { StatusDot } from "../ui/StatusDot";

export function PondCard({
  pond,
  reading,
  risk,
  device,
}: {
  pond: Pond;
  reading: SensorReading;
  risk: RiskAssessment;
  device: SensorDevice;
}) {
  const doValue = formatSensorValue("dissolvedOxygen", reading.dissolvedOxygen);
  const phValue = formatSensorValue("ph", reading.ph);
  const tempValue = formatSensorValue("temperature", reading.temperature);
  const freshness = getDataFreshness(device.lastSyncAt, reading.timestamp);
  return (
    <Card className="group relative p-5 transition-transform hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-surface-muted text-primary">
            <Droplets size={19} aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-semibold">{pond.name}</h3>
            <p className="mt-0.5 text-xs text-foreground-muted">
              {pond.code} · Hari ke-{pond.cultureDay}
            </p>
          </div>
        </div>
        <RiskBadge level={risk.level} />
      </div>
      <div className="mt-5 flex items-end justify-between">
        <div>
          <p className="text-xs font-medium text-foreground-muted">
            Skor Risiko
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-[-.04em]">
            {risk.score}
            <span className="text-sm font-medium text-foreground-muted">
              /100
            </span>
          </p>
        </div>
        <StatusDot status={device.connectionStatus} />
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-surface-muted p-3">
        <div>
          <dt className="text-[10px] font-semibold text-foreground-muted">
            DO
          </dt>
          <dd className="mt-1 text-sm font-semibold">
            {doValue.value}{" "}
            <span className="text-[10px] text-foreground-muted">
              {doValue.unit}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold text-foreground-muted">
            pH
          </dt>
          <dd className="mt-1 text-sm font-semibold">{phValue.value}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold text-foreground-muted">
            Suhu
          </dt>
          <dd className="mt-1 text-sm font-semibold">{tempValue.value}°</dd>
        </div>
      </dl>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <span
          className={`inline-flex items-center gap-2 text-xs ${freshness.state === "old" ? "font-semibold text-risk-critical" : "text-foreground-muted"}`}
        >
          <StatusDot status={device.connectionStatus} />
          {device.connectionStatus === "degraded"
            ? "Koneksi lemah"
            : device.connectionStatus === "offline"
              ? "Offline"
              : "Online"}{" "}
          · {formatWibTime(device.lastSyncAt)}
        </span>
        <ChevronRight
          className="text-foreground-muted transition-transform group-hover:translate-x-0.5"
          size={17}
          aria-hidden="true"
        />
      </div>
      <Link
        className="absolute inset-0 rounded-2xl focus-visible:outline-offset-2"
        to={`/app/ponds/${pond.id}`}
        aria-label={`Lihat detail ${pond.name}`}
      />
    </Card>
  );
}
