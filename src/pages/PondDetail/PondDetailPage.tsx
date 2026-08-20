import { ArrowLeft, Clock3, Droplets, Gauge, Thermometer, Waves } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { SectionHeader } from '../../components/common/SectionHeader'
import { DeviceStatus } from '../../components/domain/DeviceStatus'
import { RiskSummary } from '../../components/domain/RiskSummary'
import { SensorMetric } from '../../components/domain/SensorMetric'
import { Card } from '../../components/ui/Card'
import { EmptyState, ErrorState, LoadingSkeleton } from '../../components/ui/Feedback'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { repositories } from '../../data/repositories'
import { useRepositoryData } from '../../hooks/useRepositoryData'
import { formatDate, formatUpdatedAt } from '../../utils/formatters'

async function loadPondDetail(pondId: string) {
  const [pond, reading, risk, device, alerts, actions] = await Promise.all([repositories.pond.getById(pondId), repositories.sensor.getCurrentReading(pondId), repositories.risk.getCurrentByPondId(pondId), repositories.sensor.getDeviceByPondId(pondId), repositories.alert.getByPondId(pondId), repositories.action.getByPondId(pondId)])
  const recommendations = risk ? await repositories.risk.getRecommendations(risk.id) : []
  return { pond, reading, risk, device, alerts, actions, recommendations }
}

export function PondDetailPage() {
  const { pondId = '' } = useParams()
  const { data, isLoading, error } = useRepositoryData(() => loadPondDetail(pondId), pondId)
  if (isLoading) return <LoadingSkeleton rows={4}/>
  if (error) return <ErrorState/>
  if (!data?.pond || !data.reading || !data.risk || !data.device) return <EmptyState title="Kolam tidak ditemukan" description="Periksa kembali tautan atau pilih kolam dari halaman Ponds."/>
  const { pond, reading, risk, device, recommendations, actions } = data
  return <><Link to="/app/ponds" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-foreground-muted hover:text-primary"><ArrowLeft size={17}/>Kembali ke Ponds</Link><header className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold tracking-[-.035em] sm:text-3xl">{pond.name}</h1><StatusBadge status={pond.status}/></div><p className="mt-2 text-sm text-foreground-muted">{pond.code} · {pond.areaM2.toLocaleString('id-ID')} m² · DOC {pond.cultureDay} · Tebar {formatDate(pond.stockingDate)}</p></div><p className="text-xs text-foreground-muted">{formatUpdatedAt(reading.timestamp)}</p></header><div className="mt-8 grid gap-4 lg:grid-cols-[1.15fr_.85fr]"><Card className="p-5 sm:p-6"><SectionHeader eyebrow="Kualitas air" title="Pembacaan terbaru"/><div className="grid grid-cols-2 gap-3 sm:grid-cols-3"><SensorMetric parameter="dissolvedOxygen" value={reading.dissolvedOxygen} icon={Droplets}/><SensorMetric parameter="ph" value={reading.ph} icon={Gauge}/><SensorMetric parameter="temperature" value={reading.temperature} icon={Thermometer}/><SensorMetric parameter="salinity" value={reading.salinity} icon={Waves}/><SensorMetric parameter="ammonia" value={reading.ammonia}/><SensorMetric parameter="nitrite" value={reading.nitrite}/></div></Card><Card className="p-5 sm:p-6"><RiskSummary risk={risk}/></Card></div><div className="mt-4 grid gap-4 lg:grid-cols-2"><Card className="p-5 sm:p-6"><SectionHeader eyebrow="Recommended action" title="Tindakan berikutnya" description="Verifikasi kondisi lapangan sebelum bertindak."/>{recommendations.length ? <div className="space-y-3">{recommendations.map((item) => <div key={item.id} className="rounded-xl border border-border p-4"><div className="flex items-start justify-between gap-3"><p className="font-semibold">{item.title}</p><span className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-foreground-muted"><Clock3 size={14}/>{item.targetCompletionMinutes} menit</span></div><p className="mt-2 text-sm leading-6 text-foreground-muted">{item.description}</p></div>)}</div> : <EmptyState title="Tidak ada tindakan prioritas" description="Lanjutkan pemantauan rutin sesuai SOP tambak."/>}</Card><Card className="p-5 sm:p-6"><SectionHeader eyebrow="Perangkat" title="Status sensor"/><DeviceStatus device={device}/><div className="mt-6 border-t border-border pt-5"><p className="text-sm font-semibold">Riwayat tindakan</p>{actions.length ? actions.map((action) => <p key={action.id} className="mt-3 rounded-xl bg-surface-muted p-3 text-sm leading-6 text-foreground-muted">{action.notes}</p>) : <p className="mt-3 text-sm text-foreground-muted">Belum ada tindakan yang tercatat untuk kolam ini.</p>}</div></Card></div></>
}
