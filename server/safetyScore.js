export const SAFETY_COLORS = {
  safe: "#00C853",
  moderate: "#FFD600",
  danger: "#D50000"
};

export function classifySafetyScore(score) {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));

  if (normalizedScore >= 75) {
    return { score: normalizedScore, category: "safe" };
  }

  if (normalizedScore >= 40) {
    return { score: normalizedScore, category: "moderate" };
  }

  return { score: normalizedScore, category: "danger" };
}

export function calculateSafetyScore(incidents = []) {
  if (!incidents.length) {
    return classifySafetyScore(100);
  }

  const penalty = incidents.reduce((total, incident) => {
    const proximity = incident.minDistanceToRoute ?? incident.distanceKm ?? 0;
    const proximityFactor = Math.max(0.25, 1 - Math.min(1, proximity));
    return total + (incident.severity || 3) * 9 * proximityFactor;
  }, Math.min(20, incidents.length * 4));

  return classifySafetyScore(100 - penalty);
}
