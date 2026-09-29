/**
 * Local-day windows when a given sign is on the Ascendant (Whole Sign).
 */

const { buildChartAtUtcMs } = require("../lib/chartBuilder");
const { localCivilToUtcMs } = require("./localTime");

const DEFAULT_ASC_SCAN_STEP_MINUTES = 5;

function ascendantSignAt(latitude, longitude, utcMs) {
  const chart = buildChartAtUtcMs(latitude, longitude, utcMs);
  return chart.houses?.ascendantSign ?? null;
}

/**
 * @returns {Map<string, { startUtcMs: number, endUtcMs: number }[]>}
 */
function risingSignIntervalsForLocalDay(
  latitude,
  longitude,
  year,
  month,
  day,
  offsetMinutes,
  scanStepMinutes = DEFAULT_ASC_SCAN_STEP_MINUTES,
) {
  const stepMs = scanStepMinutes * 60 * 1000;
  const dayStart = localCivilToUtcMs(year, month, day, 0, 0, 0, offsetMinutes);
  const dayEnd = localCivilToUtcMs(year, month, day, 23, 59, 59, offsetMinutes);

  const bySign = new Map();
  let currentSign = null;
  let intervalStart = null;
  let lastSeenInSign = null;

  const closeInterval = () => {
    if (!currentSign || intervalStart == null || lastSeenInSign == null) return;
    const list = bySign.get(currentSign) || [];
    list.push({ startUtcMs: intervalStart, endUtcMs: lastSeenInSign });
    bySign.set(currentSign, list);
  };

  for (let t = dayStart; t <= dayEnd; t += stepMs) {
    const asc = ascendantSignAt(latitude, longitude, t);
    if (!asc) continue;
    if (asc !== currentSign) {
      closeInterval();
      currentSign = asc;
      intervalStart = t;
      lastSeenInSign = t;
    } else {
      lastSeenInSign = t;
    }
  }
  closeInterval();

  return bySign;
}

function addSamplesInRisingWindows(
  bucket,
  intervalsBySign,
  risingSign,
  sampleStepMinutes,
) {
  const windows = intervalsBySign.get(risingSign);
  if (!windows?.length) return 0;
  const stepMs = sampleStepMinutes * 60 * 1000;
  let added = 0;
  for (const { startUtcMs, endUtcMs } of windows) {
    for (let t = startUtcMs; t <= endUtcMs; t += stepMs) {
      bucket.add(t);
      added += 1;
    }
  }
  return added;
}

module.exports = {
  ascendantSignAt,
  risingSignIntervalsForLocalDay,
  addSamplesInRisingWindows,
  DEFAULT_ASC_SCAN_STEP_MINUTES,
};
