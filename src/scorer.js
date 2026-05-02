/**
 * Scoring algorithm: 0-100 based on weighted check results.
 *
 * Weights are defined per-check (1-5). Each failed check loses points proportional
 * to its weight and severity. Critical issues hurt more than warnings.
 */

const SEVERITY_PENALTY = {
  critical: 1.0,
  warning: 0.5,
  info: 0.2,
  error: 1.0,
  skip: 0,
};

export function computeScore(results) {
  // Total weight available across non-skipped checks.
  let totalWeight = 0;
  let lostWeight = 0;

  for (const r of results) {
    if (r.severity === 'skip') continue;
    totalWeight += r.weight;
    if (!r.passed) {
      const penalty = SEVERITY_PENALTY[r.severity] ?? 0.5;
      lostWeight += r.weight * penalty;
    }
  }

  if (totalWeight === 0) return { value: 0, grade: 'F', label: 'No checks ran' };

  const score = Math.max(0, Math.round(((totalWeight - lostWeight) / totalWeight) * 100));
  const { grade, label } = gradeFor(score);
  return { value: score, grade, label };
}

function gradeFor(s) {
  if (s >= 90) return { grade: 'A', label: 'Excellent' };
  if (s >= 80) return { grade: 'B', label: 'Good' };
  if (s >= 70) return { grade: 'C', label: 'Fair' };
  if (s >= 60) return { grade: 'D', label: 'Poor' };
  return { grade: 'F', label: 'Critical issues' };
}
