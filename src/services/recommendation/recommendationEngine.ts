import type {
  Recommendation,
  RecommendationPriority,
  RiskAssessment,
} from "../../domain/risk";

const priorityRank: Record<RecommendationPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function sortRecommendations(items: Recommendation[]) {
  return [...items].sort(
    (a, b) => priorityRank[b.priority] - priorityRank[a.priority],
  );
}

export function generateRecommendations(
  assessment: RiskAssessment,
): Recommendation[] {
  if (assessment.level === "safe") {
    return [
      {
        id: `rec-${assessment.pondId.replace("pond-", "")}-routine`,
        riskAssessmentId: assessment.id,
        priority: "low",
        title: "Lanjutkan monitoring rutin",
        description:
          "Parameter utama tidak menunjukkan perubahan signifikan pada periode monitoring terakhir.",
        targetCompletionMinutes: 60,
      },
    ];
  }

  const recommendations: Recommendation[] = [];
  const hasDecliningDo = assessment.contributors.some(
    (item) => item.parameter === "dissolvedOxygen" && item.direction === "down",
  );
  const hasRisingAmmonia = assessment.contributors.some(
    (item) => item.parameter === "ammonia" && item.direction === "up",
  );

  if (assessment.level === "critical") {
    recommendations.push({
      id: `rec-${assessment.pondId.replace("pond-", "")}-inspection`,
      riskAssessmentId: assessment.id,
      priority: "urgent",
      title: "Periksa kondisi kolam segera",
      description:
        "Verifikasi kondisi aktual udang dan optimalkan aerasi sesuai SOP budidaya sebelum mengambil keputusan lanjutan.",
      targetCompletionMinutes: 15,
    });
  } else if (hasDecliningDo) {
    recommendations.push({
      id: `rec-${assessment.pondId.replace("pond-", "")}-aeration`,
      riskAssessmentId: assessment.id,
      priority: "high",
      title: "Periksa dan optimalkan aerasi",
      description:
        "Dissolved Oxygen (DO) menunjukkan tren menurun dan perlu diverifikasi di lapangan.",
      targetCompletionMinutes: 30,
    });
  }

  if (hasRisingAmmonia) {
    recommendations.push({
      id: `rec-${assessment.pondId.replace("pond-", "")}-feed`,
      riskAssessmentId: assessment.id,
      priority: assessment.level === "critical" ? "high" : "medium",
      title: "Evaluasi pemberian pakan berikutnya",
      description:
        "Amonia menunjukkan tren meningkat pada periode monitoring yang sama.",
      targetCompletionMinutes: 60,
    });
  }

  recommendations.push({
    id: `rec-${assessment.pondId.replace("pond-", "")}-monitor`,
    riskAssessmentId: assessment.id,
    priority: "low",
    title: "Periksa kembali parameter dalam 1 jam",
    description:
      "Lanjutkan pemantauan untuk melihat respons parameter setelah pemeriksaan lapangan.",
    targetCompletionMinutes: 60,
  });

  return sortRecommendations(recommendations);
}
