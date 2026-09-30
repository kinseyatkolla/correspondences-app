const { isDayChart } = require("../../electional/electionSect");
const { normalizeLon } = require("../../electional/chartHelpers");

/** Degrees along the ecliptic from Sun to the nearer horizon point (Asc or Dsc). */
function sunDistanceToHorizonDeg(ascLon, sunLon) {
  const asc = normalizeLon(ascLon);
  const sun = normalizeLon(sunLon);
  const dsc = normalizeLon(asc + 180);
  const toAsc = Math.min((sun - asc + 360) % 360, (asc - sun + 360) % 360);
  const toDsc = Math.min((sun - dsc + 360) % 360, (dsc - sun + 360) % 360);
  return Math.min(toAsc, toDsc);
}

/**
 * @param {number} ascLon
 * @param {number} sunLon
 * @param {number} [boundaryThresholdDeg=1]
 */
function getSectInfo(ascLon, sunLon, boundaryThresholdDeg = 1) {
  const isDay = isDayChart(ascLon, sunLon);
  const distanceToHorizonDeg = sunDistanceToHorizonDeg(ascLon, sunLon);
  return {
    isDayChart: isDay,
    chartSect: isDay ? "day" : "night",
    sunDistanceToHorizonDeg: distanceToHorizonDeg,
    nearSectBoundary: distanceToHorizonDeg <= boundaryThresholdDeg,
  };
}

module.exports = {
  isDayChart,
  sunDistanceToHorizonDeg,
  getSectInfo,
};
