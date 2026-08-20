import { ArrowDown, ArrowUp, BrainCircuit, Minus, ShieldCheck } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { RiskSummary } from '../../components/domain/RiskSummary'
import { Card } from '../../components/ui/Card'
import { ErrorState, LoadingSkeleton } from '../../components/ui/Feedback'
import { RiskBadge } from '../../components/ui/RiskBadge'
import { repositories } from '../../data/repositories'
import type { Pond } from '../../domain/pond'
import type { RiskAssessment } from '../../domain/risk'
import { useRepositoryData } from '../../hooks/useRepositoryData'
import { useAppStore } from '../../store/app-store'
import { getSensorMeta } from '../../utils/formatters'

async function loadRisks(farmId: string): Promise<Array<{ pond: Pond; risk: RiskAssessment }>> {
  const [ponds, risks] = await Promise.all([repositories.pond.getByFarmId(farmId), repositories.risk.getCurrentByFarmId(farmId)])
  return risks.flatMap((risk) => { const pond = ponds.find((item) => item.id === risk.pondId); return pond ? [{ pond, risk }] : [] }).sort((a, b) => b.risk.score - a.risk.score)
}

export function PondBrainPage() {
  const farmId = useAppStore((state) => state.activeFarm?.id ?? '')
  const { data, isLoading, error } = useRepositoryData(() => loadRisks(farmId), farmId)
  return <><PageHeader eyebrow="Decision support" title="PondBrain" description="Analisis tingkat risiko dan penjelasan faktor utama pada data simulasi tambak."/><div className="mt-5 flex items-start gap-3 rounded-xl border border-[#b8ddd8] bg-[#e8f6f4] p-4 text-sm leading-6 text-[#285d59]"><ShieldCheck className="mt-0.5 shrink-0" size={18}/><p><strong>Transparansi demo.</strong> Skor dihitung dengan logika synthetic deterministik untuk mendemonstrasikan alur produk, bukan model AI/ML tervalidasi atau diagnosis otomatis.</p></div><div className="mt-8">{isLoading ? <LoadingSkeleton rows={3}/> : error || !data ? <ErrorState/> : <div className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]"><div className="space-y-3">{data.map(({ pond, risk }) => <Card key={pond.id} className="p-4 shadow-none"><div className="flex items-center justify-between"><div><p className="font-semibold">{pond.name}</p><p className="mt-1 text-xs text-foreground-muted">{pond.code}</p></div><div className="text-right"><RiskBadge level={risk.level}/><p className="mt-2 text-lg font-semibold">{risk.score}<span className="text-xs text-foreground-muted">/100</span></p></div></div></Card>)}</div>{data[0] && <Card className="p-5 sm:p-6"><RiskSummary risk={data[0].risk}/><div className="mt-6 border-t border-border pt-5"><p className="font-semibold">Kontributor tingkat risiko</p><div className="mt-3 space-y-3">{data[0].risk.contributors.map((item) => { const label = item.parameter === 'weatherContext' ? 'Cuaca / konteks' : getSensorMeta(item.parameter).label; const DirectionIcon = item.direction === 'up' ? ArrowUp : item.direction === 'down' ? ArrowDown : Minus; return <div key={item.parameter} className="rounded-xl bg-surface-muted p-4"><div className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-2 text-sm font-semibold"><DirectionIcon size={16} className="text-risk-warning"/>{label}</span><span className="text-sm font-bold">{item.contribution}%</span></div><p className="mt-2 text-sm leading-6 text-foreground-muted">{item.explanation}</p></div>})}</div></div><div className="mt-5 flex items-center gap-2 text-xs text-foreground-muted"><BrainCircuit size={15}/>Visualisasi lanjutan PondBrain disiapkan untuk fase berikutnya.</div></Card>}</div>}</div></>
}
