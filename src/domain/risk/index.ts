import type { SensorParameter } from '../sensor'

export type RiskLevel = 'safe' | 'warning' | 'critical'
export type RiskDirection = 'up' | 'down' | 'stable'
export type RecommendationPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface RiskContributor {
  parameter: SensorParameter | 'weatherContext'
  contribution: number
  direction: RiskDirection
  explanation: string
}

export interface RiskAssessment {
  id: string
  pondId: string
  timestamp: string
  score: number
  level: RiskLevel
  confidence: number
  contributors: RiskContributor[]
  summary: string
}

export interface Recommendation {
  id: string
  riskAssessmentId: string
  priority: RecommendationPriority
  title: string
  description: string
  targetCompletionMinutes: number
}
