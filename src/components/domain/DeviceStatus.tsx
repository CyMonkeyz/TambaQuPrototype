import { BatteryMedium, RadioTower } from 'lucide-react'
import type { SensorDevice } from '../../domain/sensor'
import { formatRelativeDemoTime } from '../../utils/formatters'
import { StatusBadge } from '../ui/StatusBadge'

export function DeviceStatus({ device }: { device: SensorDevice }) {
  return <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-surface-muted text-primary"><RadioTower size={19} aria-hidden="true"/></span><div><p className="text-sm font-semibold">{device.serialNumber}</p><p className="mt-0.5 text-xs text-foreground-muted">Sinkron {formatRelativeDemoTime(device.lastSyncAt)}</p></div></div><div className="flex items-center gap-3"><span className="inline-flex items-center gap-1 text-xs text-foreground-muted"><BatteryMedium size={16} aria-hidden="true"/>{device.batteryPercentage}%</span><StatusBadge status={device.connectionStatus}/></div></div>
}
