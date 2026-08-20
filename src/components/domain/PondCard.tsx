import { ChevronRight, Droplets } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Pond } from '../../domain/pond'
import type { RiskAssessment } from '../../domain/risk'
import type { SensorDevice, SensorReading } from '../../domain/sensor'
import { formatSensorValue, formatUpdatedAt } from '../../utils/formatters'
import { Card } from '../ui/Card'
import { RiskBadge } from '../ui/RiskBadge'
import { StatusDot } from '../ui/StatusDot'

export function PondCard({ pond, reading, risk, device }: { pond: Pond; reading: SensorReading; risk: RiskAssessment; device: SensorDevice }) {
  const doValue = formatSensorValue('dissolvedOxygen', reading.dissolvedOxygen)
  return <Card className="group relative p-5 transition-transform hover:-translate-y-0.5"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-surface-muted text-primary"><Droplets size={19} aria-hidden="true"/></span><div><h3 className="font-semibold">{pond.name}</h3><p className="mt-0.5 text-xs text-foreground-muted">{pond.code} · DOC {pond.cultureDay}</p></div></div><RiskBadge level={risk.level}/></div><div className="mt-6 grid grid-cols-2 gap-4"><div><p className="text-xs font-medium text-foreground-muted">Risk score</p><p className="mt-1 text-3xl font-semibold tracking-[-.04em]">{risk.score}<span className="text-sm font-medium text-foreground-muted">/100</span></p></div><div><p className="text-xs font-medium text-foreground-muted">Oksigen terlarut</p><p className="mt-1 text-lg font-semibold">{doValue.value} <span className="text-xs font-medium text-foreground-muted">{doValue.unit}</span></p></div></div><div className="mt-5 flex items-center justify-between border-t border-border pt-4"><span className="inline-flex items-center gap-2 text-xs text-foreground-muted"><StatusDot status={device.connectionStatus}/>{formatUpdatedAt(reading.timestamp)}</span><ChevronRight className="text-foreground-muted transition-transform group-hover:translate-x-0.5" size={17} aria-hidden="true"/></div><Link className="absolute inset-0 rounded-2xl focus-visible:outline-offset-2" to={`/app/ponds/${pond.id}`} aria-label={`Lihat detail ${pond.name}`}/></Card>
}
