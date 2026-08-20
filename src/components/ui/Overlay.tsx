import * as DialogPrimitive from '@radix-ui/react-dialog'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return <TooltipPrimitive.Provider delayDuration={350}><TooltipPrimitive.Root><TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger><TooltipPrimitive.Portal><TooltipPrimitive.Content className="z-50 rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-white shadow-lg" sideOffset={6}>{label}<TooltipPrimitive.Arrow className="fill-foreground"/></TooltipPrimitive.Content></TooltipPrimitive.Portal></TooltipPrimitive.Root></TooltipPrimitive.Provider>
}

export function Dialog({ open, onOpenChange, title, description, children }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; children: ReactNode }) {
  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}><DialogPrimitive.Portal><DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-[#0b2729]/45 backdrop-blur-[2px]"/><DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-2xl border border-border bg-surface p-5 shadow-2xl sm:p-6"><div className="pr-10"><DialogPrimitive.Title className="text-lg font-semibold">{title}</DialogPrimitive.Title>{description && <DialogPrimitive.Description className="mt-2 text-sm leading-6 text-foreground-muted">{description}</DialogPrimitive.Description>}</div><DialogPrimitive.Close className="absolute right-4 top-4 grid size-10 place-items-center rounded-xl text-foreground-muted hover:bg-surface-muted" aria-label="Tutup dialog"><X size={19}/></DialogPrimitive.Close><div className="mt-5">{children}</div></DialogPrimitive.Content></DialogPrimitive.Portal></DialogPrimitive.Root>
}
