import { BrainCircuit } from 'lucide-react'
import type { RiskAssessment } from '../../domain/risk'
import { RiskBadge } from '../ui/RiskBadge'

export function RiskSummary({ risk, compact = false }: { risk: RiskAssessment; compact?: boolean }) {
  return <div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#dff3f0] text-primary"><BrainCircuit size={22} aria-hidden="true"/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-primary">PondBrain Insight</p><RiskBadge level={risk.level}/></div><div className="mt-2 flex items-baseline gap-2"><span className="text-3xl font-semibold tracking-[-.045em]">{risk.score}</span><span className="text-sm text-foreground-muted">/100 tingkat risiko</span></div><p className={`mt-2 text-sm leading-6 text-foreground-muted ${compact ? 'line-clamp-2' : ''}`}>{risk.summary}</p><p className="mt-2 text-xs text-foreground-muted">Simulasi deterministik · bukan diagnosis atau model ilmiah tervalidasi</p></div></div>
}
