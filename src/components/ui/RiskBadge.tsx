import { AlertTriangle, Check, OctagonAlert } from 'lucide-react'
import type { RiskLevel } from '../../domain/risk'
import { Badge } from './Badge'

const riskConfig = {
  safe: { label: 'Aman', className: 'bg-[var(--risk-safe-bg)] text-risk-safe', icon: Check },
  warning: { label: 'Waspada', className: 'bg-[var(--risk-warning-bg)] text-risk-warning', icon: AlertTriangle },
  critical: { label: 'Kritis', className: 'bg-[var(--risk-critical-bg)] text-risk-critical', icon: OctagonAlert },
} satisfies Record<RiskLevel, { label: string; className: string; icon: typeof Check }>

export function RiskBadge({ level }: { level: RiskLevel }) {
  const config = riskConfig[level]
  const Icon = config.icon
  return <Badge className={config.className}><Icon size={13} strokeWidth={2.5} aria-hidden="true" />{config.label}</Badge>
}
