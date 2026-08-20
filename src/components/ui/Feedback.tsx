import { AlertCircle, Inbox } from 'lucide-react'
import { Button } from './Button'

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return <div className="grid gap-4" aria-label="Memuat data">{Array.from({ length: rows }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl border border-border bg-surface-muted" />)}</div>
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center"><Inbox className="mx-auto text-foreground-muted" aria-hidden="true"/><h2 className="mt-4 font-semibold">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-foreground-muted">{description}</p></div>
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return <div className="rounded-2xl border border-[color-mix(in_srgb,var(--risk-critical)_25%,var(--border))] bg-[var(--risk-critical-bg)] px-6 py-10 text-center"><AlertCircle className="mx-auto text-risk-critical" aria-hidden="true"/><h2 className="mt-4 font-semibold">Data belum dapat dimuat</h2><p className="mt-2 text-sm text-foreground-muted">Periksa koneksi lalu coba kembali.</p>{onRetry && <Button className="mt-5" variant="secondary" onClick={onRetry}>Coba lagi</Button>}</div>
}
