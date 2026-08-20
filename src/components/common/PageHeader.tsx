import type { ReactNode } from 'react'

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description: string; actions?: ReactNode }) {
  return <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div>{eyebrow && <p className="text-sm font-semibold text-primary">{eyebrow}</p>}<h1 className="mt-1 text-2xl font-semibold tracking-[-.035em] sm:text-3xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-muted sm:text-base">{description}</p></div>{actions}</header>
}
