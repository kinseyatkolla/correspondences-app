/**
 * Diurnal / nocturnal sect from the ecliptic horizon (Asc–Dsc axis).
 * Sun above the horizon (day arc) vs below (night arc), using longitudes only.
 *
 * Night: Sun on the arc from Asc to Dsc through the IC — forward from Asc to Sun
 * is under 180° and the backward arc is at least 180°.
 * Day: otherwise (from sunrise at Asc through setting at Dsc).
 */

const { normalizeLon } = require("./chartHelpers");

function isDayChart(ascLon, sunLon) {
  if (ascLon == null || sunLon == null) return false;
  const asc = normalizeLon(ascLon);
  const sun = normalizeLon(sunLon);
  const forward = (sun - asc + 360) % 360;
  const backward = (asc - sun + 360) % 360;
  return !(forward < 180 && backward >= 180);
}

module.exports = {
  isDayChart,
};
