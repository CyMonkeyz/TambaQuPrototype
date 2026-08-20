import { Activity, AlertTriangle, ChevronRight, RadioTower } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { SectionHeader } from '../../components/common/SectionHeader'
import { PondCard } from '../../components/domain/PondCard'
import { RiskSummary } from '../../components/domain/RiskSummary'
import { Card } from '../../components/ui/Card'
import { ErrorState, LoadingSkeleton } from '../../components/ui/Feedback'
import { repositories } from '../../data/repositories'
import type { Alert } from '../../domain/alert'
import type { Pond } from '../../domain/pond'
import type { RiskAssessment } from '../../domain/risk'
import type { SensorDevice, SensorReading } from '../../domain/sensor'
import { useRepositoryData } from '../../hooks/useRepositoryData'
import { useAppStore } from '../../store/app-store'
import { formatRelativeDemoTime } from '../../utils/formatters'

interface PondOverview { pond: Pond; reading: SensorReading; risk: RiskAssessment; device: SensorDevice }
interface DashboardData { ponds: PondOverview[]; alerts: Alert[] }

async function loadDashboard(farmId: string): Promise<DashboardData> {
  const [ponds, risks, alerts] = await Promise.all([repositories.pond.getByFarmId(farmId), repositories.risk.getCurrentByFarmId(farmId), repositories.alert.getByFarmId(farmId)])
  const overviews = await Promise.all(ponds.map(async (pond) => {
    const [reading, device] = await Promise.all([repositories.sensor.getCurrentReading(pond.id), repositories.sensor.getDeviceByPondId(pond.id)])
    const risk = risks.find((item) => item.pondId === pond.id)
    return reading && device && risk ? { pond, reading, risk, device } : null
  }))
  return { ponds: overviews.filter((item): item is PondOverview => item !== null), alerts }
}

export function DashboardPage() {
  const user = useAppStore((state) => state.activeUser)
  const farm = useAppStore((state) => state.activeFarm)
  const { data, isLoading, error } = useRepositoryData(() => loadDashboard(farm?.id ?? ''), farm?.id ?? '')
  if (isLoading) return <LoadingSkeleton rows={4}/>
  if (error || !data) return <ErrorState/>
  const topRisk = [...data.ponds].sort((a, b) => b.risk.score - a.risk.score)[0]
  const onlineDevices = data.ponds.filter((item) => item.device.connectionStatus === 'online').length
  const activeAlerts = data.alerts.filter((alert) => alert.status !== 'resolved')
  return <><PageHeader eyebrow="Kamis, 20 Agustus 2026" title={`Selamat pagi, ${user?.name.split(' ')[0] ?? 'Andi'}`} description={`Berikut kondisi terbaru ${farm?.name}.`} actions={<span className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--risk-safe-bg)] px-3 py-1.5 text-sm font-semibold text-risk-safe"><span className="size-2 rounded-full bg-[var(--status-online)]"/>{onlineDevices} dari {data.ponds.length} perangkat online</span>}/><section className="mt-8"><SectionHeader eyebrow="Ringkasan kolam" title="Prioritas hari ini" action={<Link className="hidden items-center gap-1 text-sm font-semibold text-primary sm:flex" to="/app/ponds">Lihat semua <ChevronRight size={16}/></Link>}/><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{data.ponds.map((item) => <PondCard key={item.pond.id} {...item}/>)}</div></section>{topRisk && <section className="mt-6 grid gap-4 xl:grid-cols-[1.35fr_.65fr]"><Card className="p-5 sm:p-6"><RiskSummary risk={topRisk.risk}/><Link className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary" to={`/app/ponds/${topRisk.pond.id}`}>Buka {topRisk.pond.name}<ChevronRight size={16}/></Link></Card><Card className="p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[var(--risk-warning-bg)] text-risk-warning"><Activity size={20}/></span><div><p className="font-semibold">{activeAlerts.length} alert aktif</p><p className="mt-1 text-sm text-foreground-muted">{activeAlerts.filter((item) => item.severity === 'critical').length} kritis · {activeAlerts.filter((item) => item.severity === 'warning').length} peringatan</p></div></div><div className="mt-5 space-y-3">{activeAlerts.slice(0, 2).map((alert) => <div key={alert.id} className="flex gap-3 rounded-xl bg-surface-muted p-3"><AlertTriangle className={alert.severity === 'critical' ? 'text-risk-critical' : 'text-risk-warning'} size={17}/><div><p className="text-sm font-semibold">{alert.title}</p><p className="mt-1 text-xs text-foreground-muted">{formatRelativeDemoTime(alert.timestamp)}</p></div></div>)}</div><Link className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary" to="/app/alerts">Lihat semua alert<ChevronRight size={16}/></Link></Card></section>}<div className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-surface-muted p-4 text-xs leading-5 text-foreground-muted"><RadioTower className="mt-0.5 shrink-0" size={16}/><p><strong className="text-foreground">Lingkungan demo.</strong> Seluruh pembacaan sensor dan tingkat risiko adalah synthetic serta tidak mewakili kondisi tambak nyata.</p></div></>
}
