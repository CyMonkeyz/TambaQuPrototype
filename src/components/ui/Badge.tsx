import type { HTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-bold text-foreground-muted', className)} {...props} />
}
