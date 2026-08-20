import { CalendarRange, Download, FileChartColumn, ListChecks } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { toast } from '../../components/ui/toast-api'

export function ReportsPage() {
  return <><PageHeader eyebrow="Operational review" title="Reports" description="Ruang untuk merangkum tren kualitas air, alert, dan tindakan per periode." actions={<Button variant="secondary" leadingIcon={<Download size={17}/>} onClick={() => toast.info('Ekspor laporan akan tersedia pada fase berikutnya.')}>Ekspor laporan</Button>}/><div className="mt-8 grid gap-4 md:grid-cols-2"><Card className="p-5 sm:p-6"><span className="grid size-11 place-items-center rounded-xl bg-[#dff3f0] text-primary"><CalendarRange size={21}/></span><h2 className="mt-4 font-semibold">Ringkasan periode</h2><p className="mt-2 text-sm leading-6 text-foreground-muted">Filter periode dan perbandingan antar-kolam akan menjadi fondasi laporan operasional.</p><div className="mt-5 h-24 rounded-xl border border-dashed border-border bg-surface-muted" aria-label="Area ringkasan periode yang akan dikembangkan"/></Card><Card className="p-5 sm:p-6"><span className="grid size-11 place-items-center rounded-xl bg-[#dff3f0] text-primary"><ListChecks size={21}/></span><h2 className="mt-4 font-semibold">Rekap tindakan</h2><p className="mt-2 text-sm leading-6 text-foreground-muted">Catatan tindakan petambak akan dapat ditinjau bersama alert pemicunya.</p><div className="mt-5 flex items-center gap-3 rounded-xl bg-surface-muted p-4 text-sm text-foreground-muted"><FileChartColumn size={18}/>Struktur data siap untuk fase pelaporan.</div></Card></div></>
}
