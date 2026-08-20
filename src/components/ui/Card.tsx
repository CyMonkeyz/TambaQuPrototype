import type { HTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <article className={cn('rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]', className)} {...props} />
}
