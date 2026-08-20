import type { ActionLog } from "../../domain/action";
import type { Recommendation } from "../../domain/risk";
import type { ActionRepository } from "../../data/repositories";

export async function completeRecommendation({
  repository,
  pondId,
  recommendation,
  userId,
  notes,
  timestamp,
}: {
  repository: ActionRepository;
  pondId: string;
  recommendation: Recommendation;
  userId: string;
  notes: string;
  timestamp: string;
}) {
  const existing = await repository.getByRecommendationId(recommendation.id);
  if (existing) return { action: existing, created: false };

  const action: ActionLog = {
    id: `action-${recommendation.id}-${Date.parse(timestamp)}`,
    pondId,
    recommendationId: recommendation.id,
    actionTitle: recommendation.title,
    performedBy: userId,
    performedAt: timestamp,
    notes: notes.trim(),
    syncStatus: "synced",
  };
  return { action: await repository.add(action), created: true };
}
