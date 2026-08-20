import type { ActionLog } from '../../domain/action'
import type { Alert } from '../../domain/alert'
import type { Farm } from '../../domain/farm'
import type { Pond } from '../../domain/pond'
import type { Recommendation, RiskAssessment, RiskContributor, RiskLevel } from '../../domain/risk'
import type { SensorDevice, SensorReading } from '../../domain/sensor'
import type { User } from '../../domain/user'

export const DEMO_NOW = '2026-08-20T14:42:00.000Z'

export const demoUser: User = {
  id: 'user-andi',
  name: 'Andi Setiawan',
  role: 'owner',
  farmIds: ['farm-mina-jaya'],
}

export const demoFarm: Farm = {
  id: 'farm-mina-jaya',
  name: 'Tambak Mina Jaya',
  location: 'Kebumen, Jawa Tengah',
  ownerId: demoUser.id,
  pondIds: ['pond-a', 'pond-b', 'pond-c', 'pond-d'],
}

export const demoPonds: Pond[] = [
  { id: 'pond-a', farmId: demoFarm.id, name: 'Kolam A', code: 'KLM-A', areaM2: 1800, cultureDay: 42, stockingDate: '2026-07-09', status: 'active', deviceId: 'device-a' },
  { id: 'pond-b', farmId: demoFarm.id, name: 'Kolam B', code: 'KLM-B', areaM2: 2100, cultureDay: 42, stockingDate: '2026-07-09', status: 'active', deviceId: 'device-b' },
  { id: 'pond-c', farmId: demoFarm.id, name: 'Kolam C', code: 'KLM-C', areaM2: 1950, cultureDay: 38, stockingDate: '2026-07-13', status: 'active', deviceId: 'device-c' },
  { id: 'pond-d', farmId: demoFarm.id, name: 'Kolam D', code: 'KLM-D', areaM2: 1650, cultureDay: 35, stockingDate: '2026-07-16', status: 'maintenance', deviceId: 'device-d' },
]

type ReadingProfile = Omit<SensorReading, 'id' | 'pondId' | 'timestamp'> & {
  doTrend: number
  ammoniaTrend: number
}

const readingProfiles: Record<string, ReadingProfile> = {
  'pond-a': { dissolvedOxygen: 6, ph: 7.9, temperature: 29.1, salinity: 19, ammonia: 0.03, nitrite: 0.02, doTrend: 0.08, ammoniaTrend: 0.002 },
  'pond-b': { dissolvedOxygen: 4.2, ph: 7.4, temperature: 30.1, salinity: 18, ammonia: 0.14, nitrite: 0.07, doTrend: 0.38, ammoniaTrend: -0.014 },
  'pond-c': { dissolvedOxygen: 3.1, ph: 7.3, temperature: 30.5, salinity: 20, ammonia: 0.22, nitrite: 0.11, doTrend: 0.52, ammoniaTrend: -0.028 },
  'pond-d': { dissolvedOxygen: 6.1, ph: 8, temperature: 28.8, salinity: 19, ammonia: 0.02, nitrite: 0.01, doTrend: -0.04, ammoniaTrend: 0.001 },
}

function wave(hourAgo: number, phase: number) {
  return Math.sin((hourAgo + phase) * Math.PI / 6)
}

function fixed(value: number, decimals = 2) {
  return Number(value.toFixed(decimals))
}

function generateReadings(pondId: string): SensorReading[] {
  const profile = readingProfiles[pondId]
  const now = new Date(DEMO_NOW).getTime()
  return Array.from({ length: 25 }, (_, index) => {
    const hourAgo = 24 - index
    const trendFactor = hourAgo / 24
    return {
      id: `${pondId}-reading-${index}`,
      pondId,
      timestamp: new Date(now - hourAgo * 3_600_000).toISOString(),
      dissolvedOxygen: fixed(profile.dissolvedOxygen + profile.doTrend * trendFactor + wave(hourAgo, 1) * 0.09, 1),
      ph: fixed(profile.ph + wave(hourAgo, 2) * 0.06, 1),
      temperature: fixed(profile.temperature + wave(hourAgo, 0) * 0.35, 1),
      salinity: fixed(profile.salinity + wave(hourAgo, 3) * 0.25, 1),
      ammonia: fixed(Math.max(0, profile.ammonia + profile.ammoniaTrend * trendFactor + wave(hourAgo, 4) * 0.003), 2),
      nitrite: fixed(Math.max(0, profile.nitrite + wave(hourAgo, 5) * 0.003), 2),
    }
  })
}

export const demoReadings = demoPonds.flatMap((pond) => generateReadings(pond.id))

export const demoDevices: SensorDevice[] = [
  { id: 'device-a', pondId: 'pond-a', serialNumber: 'TQ-KBM-2401', connectionStatus: 'online', batteryPercentage: 86, lastSyncAt: DEMO_NOW, firmwareVersion: '1.4.2' },
  { id: 'device-b', pondId: 'pond-b', serialNumber: 'TQ-KBM-2402', connectionStatus: 'degraded', batteryPercentage: 51, lastSyncAt: '2026-08-20T14:36:00.000Z', firmwareVersion: '1.4.2' },
  { id: 'device-c', pondId: 'pond-c', serialNumber: 'TQ-KBM-2403', connectionStatus: 'online', batteryPercentage: 73, lastSyncAt: '2026-08-20T14:41:00.000Z', firmwareVersion: '1.4.2' },
  { id: 'device-d', pondId: 'pond-d', serialNumber: 'TQ-KBM-2404', connectionStatus: 'offline', batteryPercentage: 18, lastSyncAt: '2026-08-20T12:14:00.000Z', firmwareVersion: '1.3.9' },
]

const contributors: Record<string, RiskContributor[]> = {
  'pond-a': [{ parameter: 'dissolvedOxygen', contribution: 45, direction: 'stable', explanation: 'Oksigen terlarut berada dalam rentang operasional demo.' }],
  'pond-b': [
    { parameter: 'dissolvedOxygen', contribution: 42, direction: 'down', explanation: 'DO menurun mendekati 4,2 mg/L.' },
    { parameter: 'ammonia', contribution: 27, direction: 'up', explanation: 'Amonia meningkat hingga sekitar 0,14 mg/L.' },
    { parameter: 'temperature', contribution: 18, direction: 'up', explanation: 'Suhu air berada di sekitar 30,1 °C.' },
    { parameter: 'weatherContext', contribution: 13, direction: 'stable', explanation: 'Konteks cuaca disimulasikan sebagai faktor pendukung.' },
  ],
  'pond-c': [
    { parameter: 'dissolvedOxygen', contribution: 51, direction: 'down', explanation: 'DO berada di sekitar 3,1 mg/L dan memerlukan perhatian.' },
    { parameter: 'ammonia', contribution: 31, direction: 'up', explanation: 'Amonia meningkat pada skenario demo.' },
    { parameter: 'nitrite', contribution: 18, direction: 'up', explanation: 'Nitrit ikut meningkatkan tingkat risiko operasional.' },
  ],
  'pond-d': [{ parameter: 'dissolvedOxygen', contribution: 48, direction: 'stable', explanation: 'Parameter utama stabil pada skenario demo.' }],
}

const riskSeed: Array<{ pondId: string; score: number; level: RiskLevel; confidence: number; summary: string }> = [
  { pondId: 'pond-a', score: 22, level: 'safe', confidence: 0.88, summary: 'Parameter utama stabil. Lanjutkan pemantauan rutin.' },
  { pondId: 'pond-b', score: 67, level: 'warning', confidence: 0.82, summary: 'Indikasi peningkatan risiko dipengaruhi DO yang menurun dan amonia.' },
  { pondId: 'pond-c', score: 84, level: 'critical', confidence: 0.86, summary: 'DO rendah dan amonia meningkat. Periksa aerasi dan kondisi kolam segera.' },
  { pondId: 'pond-d', score: 18, level: 'safe', confidence: 0.9, summary: 'Kondisi stabil dalam skenario simulasi.' },
]

export const demoRisks: RiskAssessment[] = riskSeed.map((risk) => ({
  id: `risk-${risk.pondId}`,
  pondId: risk.pondId,
  timestamp: DEMO_NOW,
  score: risk.score,
  level: risk.level,
  confidence: risk.confidence,
  contributors: contributors[risk.pondId],
  summary: risk.summary,
}))

export const demoAlerts: Alert[] = [
  { id: 'alert-c-do', pondId: 'pond-c', timestamp: '2026-08-20T14:39:00.000Z', severity: 'critical', title: 'DO berada di bawah rentang operasional', description: 'Oksigen terlarut terbaca 3,1 mg/L pada skenario Kolam C.', parameter: 'dissolvedOxygen', status: 'new', riskAssessmentId: 'risk-pond-c' },
  { id: 'alert-b-risk', pondId: 'pond-b', timestamp: '2026-08-20T14:25:00.000Z', severity: 'warning', title: 'Tingkat risiko meningkat', description: 'DO menurun dan amonia meningkat pada data simulasi.', parameter: 'multiple', status: 'acknowledged', riskAssessmentId: 'risk-pond-b' },
  { id: 'alert-d-device', pondId: 'pond-d', timestamp: '2026-08-20T12:14:00.000Z', severity: 'warning', title: 'Perangkat tidak tersambung', description: 'Perangkat Kolam D belum mengirim data terbaru.', parameter: 'multiple', status: 'resolved', riskAssessmentId: 'risk-pond-d' },
]

export const demoRecommendations: Recommendation[] = [
  { id: 'rec-c-aeration', riskAssessmentId: 'risk-pond-c', priority: 'urgent', title: 'Periksa dan tingkatkan aerasi', description: 'Verifikasi aerator aktif dan lakukan pengecekan DO manual sebelum tindakan lanjutan.', targetCompletionMinutes: 15 },
  { id: 'rec-c-water', riskAssessmentId: 'risk-pond-c', priority: 'high', title: 'Periksa sumber peningkatan amonia', description: 'Tinjau sisa pakan dan kondisi dasar kolam berdasarkan SOP lapangan.', targetCompletionMinutes: 45 },
  { id: 'rec-b-monitor', riskAssessmentId: 'risk-pond-b', priority: 'medium', title: 'Pantau DO lebih sering', description: 'Lakukan verifikasi lapangan dan pantau perubahan dalam 30 menit.', targetCompletionMinutes: 30 },
]

export const demoActions: ActionLog[] = [
  { id: 'action-b-1', pondId: 'pond-b', recommendationId: 'rec-b-monitor', performedBy: demoUser.id, performedAt: '2026-08-20T14:31:00.000Z', notes: 'Aerator tambahan dinyalakan dan pemeriksaan manual dijadwalkan.', syncStatus: 'synced' },
]
