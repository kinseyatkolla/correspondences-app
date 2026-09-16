// Year-ephemeris aspect detector knobs.
// Moon at a 2-hour sample interval can move ~1.0–1.25° between samples, so a
// 0.5° in-orb gate plus "reject isolated samples" drops most true Moon aspects.
const ASPECT_DETECTOR_VERSION = 2;
const ASPECT_EXACT_ORB_DEGREES = 0.5;
const MOON_ASPECT_DETECTION_ORB_DEGREES = 1.5;

function involvesMoon(...planetNames) {
  return planetNames.some(
    (name) => String(name || "").toLowerCase() === "moon"
  );
}

function getAspectDetectionOrbDegrees(...planetNames) {
  return involvesMoon(...planetNames)
    ? MOON_ASPECT_DETECTION_ORB_DEGREES
    : ASPECT_EXACT_ORB_DEGREES;
}

function isBracketedAspectMinimum(
  prevDist,
  currentDist,
  nextDist,
  options = {}
) {
  const isLocalMinimum =
    currentDist < prevDist && (nextDist === 999 || currentDist <= nextDist);
  if (options.allowIsolatedSample) {
    return isLocalMinimum;
  }
  // Slow planets: reject a lone in-orb sample between coarse intervals.
  const isolatedSample = prevDist > 0.5 && nextDist > 0.5;
  return isLocalMinimum && !isolatedSample;
}

function isRefinedAspectExact(refinedOrb) {
  return Number.isFinite(refinedOrb) && refinedOrb <= ASPECT_EXACT_ORB_DEGREES;
}

module.exports = {
  ASPECT_DETECTOR_VERSION,
  ASPECT_EXACT_ORB_DEGREES,
  MOON_ASPECT_DETECTION_ORB_DEGREES,
  involvesMoon,
  getAspectDetectionOrbDegrees,
  isBracketedAspectMinimum,
  isRefinedAspectExact,
};
