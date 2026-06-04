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

export function safetyFromSeverity(severity = 3) {
  return classifySafetyScore(100 - severity * 18);
}
