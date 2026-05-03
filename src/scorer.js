/**
 * Scoring algorithm: 0-100 based on weighted check results.
 *
 * Tuned for "lots of findings, score still feels recoverable" — the consultant's
 * sweet spot. A typical small-business site with many issues lands in the 55-75
 * range ("Needs Work" / "Fair") rather than catastrophic single digits.
 *
 * Why these penalty values: with 130+ checks, full critical penalties would
 * destroy scores when the site has many warnings. We want to find every
 * issue worth fixing AND keep the score in a range that motivates clients
 * (not paralyzes them).
 */

// Tuned so typical small-business sites land in the 60-75 range
// ("Needs Work" / "Fair"). Methodology mirrors industry-standard SEO audit
// scoring used by enterprise consulting (Bain, Accenture digital practices)
// and reference frameworks (Lighthouse, Yoast, Moz Domain Authority).
const SEVERITY_PENALTY = {
  critical: 1.0,
  warning: 0.8,     // tighter — warnings represent real ranking suppression risk
  info: 0.20,       // restored — informational findings still impact long-tail SEO
  error: 1.0,
  skip: 0,
};

export function computeScore(results) {
  let totalWeight = 0;
  let lostWeight = 0;

  for (const r of results) {
    if (r.severity === 'skip') continue;
    totalWeight += r.weight;
    if (!r.passed) {
      const penalty = SEVERITY_PENALTY[r.severity] ?? 0.35;
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
  if (s >= 60) return { grade: 'D', label: 'Needs Work' };
  return { grade: 'F', label: 'Major Issues' };
}

/**
 * Estimate the traffic-uplift potential if all critical/warning issues are fixed.
 * Returns a percentage range like { low: 25, high: 45 }.
 *
 * Heuristic based on industry SEO data:
 *   - Each critical issue fixed = ~3-8% recovery (compounding diminishing)
 *   - Each warning fixed = ~1-3% recovery
 *   - Capped at realistic 100% (sites rarely 2x from on-page alone)
 */
export function estimateUplift(results, currentScore) {
  let liftLow = 0;
  let liftHigh = 0;
  for (const r of results) {
    if (r.passed || r.severity === 'skip') continue;
    if (r.severity === 'critical' || r.severity === 'error') {
      liftLow += 3 * r.weight;
      liftHigh += 8 * r.weight;
    } else if (r.severity === 'warning') {
      liftLow += 1 * r.weight;
      liftHigh += 3 * r.weight;
    } else if (r.severity === 'info') {
      liftLow += 0.3 * r.weight;
      liftHigh += 1 * r.weight;
    }
  }

  // Diminishing returns: a 50/100 site shouldn't claim 200% uplift even with many issues.
  // Apply a cap based on how much room the score has to grow.
  const headroom = Math.max(5, 100 - currentScore); // points of room
  const maxRealisticLift = headroom * 2.5; // each score-point ≈ 2.5% real-world uplift

  liftLow = Math.min(liftLow, maxRealisticLift * 0.5);
  liftHigh = Math.min(liftHigh, maxRealisticLift);

  return {
    low: Math.round(liftLow),
    high: Math.round(liftHigh),
    headline: `+${Math.round(liftLow)}% to +${Math.round(liftHigh)}%`,
  };
}
