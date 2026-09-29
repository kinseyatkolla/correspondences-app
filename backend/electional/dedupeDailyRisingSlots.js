/**
 * One representative election slot per local calendar day + rising sign.
 * Tie-break: higher score (+ benefic at Asc/MC), tighter benefic orb, earlier time.
 */

const { getPlanet, angularDistance } = require("./chartHelpers");
const { MITIGATION_ORB_DEG } = require("./electionMitigation");

const BENEFIC_ASPECT_ANGLES = [0, 60, 90, 120, 180];
const BENEFIC_REPRESENTATIVE_BONUS = 25;

function orbToNearestAspect(lon1, lon2, aspectAngles) {
  const dist = angularDistance(lon1, lon2);
  let bestOrb = Infinity;
  for (const angle of aspectAngles) {
    const orb = Math.abs(dist - angle);
    if (orb < bestOrb) bestOrb = orb;
  }
  return { orb: bestOrb };
}

function beneficExactToAscOrMc(chart) {
  const asc = chart.houses?.ascendant;
  const mc = chart.houses?.mc;
  let bestOrb = Infinity;
  for (const name of ["venus", "jupiter"]) {
    const p = getPlanet(chart, name);
    if (!p?.longitude) continue;
    if (asc != null) {
      const { orb } = orbToNearestAspect(
        p.longitude,
        asc,
        BENEFIC_ASPECT_ANGLES,
      );
      if (orb < bestOrb) bestOrb = orb;
    }
    if (mc != null) {
      const { orb } = orbToNearestAspect(
        p.longitude,
        mc,
        BENEFIC_ASPECT_ANGLES,
      );
      if (orb < bestOrb) bestOrb = orb;
    }
  }
  const hasExact = bestOrb <= MITIGATION_ORB_DEG;
  return { hasExact, bestOrb };
}

function representativeRank(entry) {
  const chart = entry.chart;
  const { hasExact, bestOrb } = chart
    ? beneficExactToAscOrMc(chart)
    : { hasExact: false, bestOrb: Infinity };
  const beneficBonus = hasExact ? BENEFIC_REPRESENTATIVE_BONUS : 0;
  return {
    total: (entry.score ?? 0) + beneficBonus,
    hasExactBeneficAngle: hasExact,
    beneficOrb: bestOrb,
    utcMs: entry.utcMs ?? 0,
  };
}

/** Negative when `a` is preferred over `b`. */
function compareRepresentatives(a, b) {
  const ra = representativeRank(a);
  const rb = representativeRank(b);
  if (ra.total !== rb.total) return rb.total - ra.total;
  if (ra.hasExactBeneficAngle !== rb.hasExactBeneficAngle) {
    return ra.hasExactBeneficAngle ? -1 : 1;
  }
  if (ra.beneficOrb !== rb.beneficOrb) return ra.beneficOrb - rb.beneficOrb;
  return ra.utcMs - rb.utcMs;
}

/**
 * @param {Array<object>} scored entries with dateLabel, risingSign, score, utcMs, chart
 */
function dedupeOneSlotPerDayAndRising(scored) {
  const groups = new Map();
  for (const entry of scored) {
    const dayKey = entry.dateLabel ?? entry.isoTime?.slice(0, 10);
    const rising = entry.risingSign ?? "";
    const key = `${dayKey}|${rising}`;
    const prev = groups.get(key);
    if (!prev || compareRepresentatives(entry, prev) < 0) {
      groups.set(key, entry);
    }
  }
  return [...groups.values()].sort((a, b) => (a.utcMs ?? 0) - (b.utcMs ?? 0));
}

module.exports = {
  dedupeOneSlotPerDayAndRising,
  beneficExactToAscOrMc,
  BENEFIC_REPRESENTATIVE_BONUS,
  representativeRank,
};
