import { cn } from '../../utils/cn'

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  return <span className={cn('grid size-10 shrink-0 place-items-center rounded-full bg-surface-muted text-sm font-bold text-primary', className)} aria-label={name}>{initials}</span>
}
