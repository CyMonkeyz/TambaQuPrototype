import { PageHeader } from '../../components/common/PageHeader'
import { PondCard } from '../../components/domain/PondCard'
import { ErrorState, LoadingSkeleton } from '../../components/ui/Feedback'
import { repositories } from '../../data/repositories'
import type { Pond } from '../../domain/pond'
import type { RiskAssessment } from '../../domain/risk'
import type { SensorDevice, SensorReading } from '../../domain/sensor'
import { useRepositoryData } from '../../hooks/useRepositoryData'
import { useAppStore } from '../../store/app-store'

interface PondListItem { pond: Pond; reading: SensorReading; risk: RiskAssessment; device: SensorDevice }

async function loadPonds(farmId: string): Promise<PondListItem[]> {
  const ponds = await repositories.pond.getByFarmId(farmId)
  const items = await Promise.all(ponds.map(async (pond) => {
    const [reading, risk, device] = await Promise.all([repositories.sensor.getCurrentReading(pond.id), repositories.risk.getCurrentByPondId(pond.id), repositories.sensor.getDeviceByPondId(pond.id)])
    return reading && risk && device ? { pond, reading, risk, device } : null
  }))
  return items.filter((item): item is PondListItem => item !== null)
}

export function PondsPage() {
  const farm = useAppStore((state) => state.activeFarm)
  const { data, isLoading, error } = useRepositoryData(() => loadPonds(farm?.id ?? ''), farm?.id ?? '')
  return <><PageHeader eyebrow="Monitoring" title="Ponds" description="Bandingkan kondisi, tingkat risiko, dan konektivitas seluruh kolam dalam satu tampilan."/><div className="mt-8">{isLoading ? <LoadingSkeleton rows={4}/> : error || !data ? <ErrorState/> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{data.map((item) => <PondCard key={item.pond.id} {...item}/>)}</div>}</div></>
}
