/**
 * Local civil time helpers for election search (no extra tz library).
 * Prefer client-provided offset; fall back to longitude estimate.
 */

function offsetMinutesFromLongitude(longitude) {
  return Math.round(Number(longitude) / 15) * 60;
}

function resolveOffsetMinutes({ utcOffsetMinutes, longitude }) {
  if (Number.isFinite(utcOffsetMinutes)) return utcOffsetMinutes;
  if (Number.isFinite(longitude)) return offsetMinutesFromLongitude(longitude);
  return 0;
}

/** UTC ms for local civil Y-M-D H:M:S at given offset east of UTC. */
function localCivilToUtcMs(y, m, d, h, min, sec, offsetMinutes) {
  return Date.UTC(y, m - 1, d, h, min, sec) - offsetMinutes * 60 * 1000;
}

function utcMsToLocalParts(utcMs, offsetMinutes) {
  const shifted = new Date(utcMs + offsetMinutes * 60 * 1000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
  };
}

function localDayKey(utcMs, offsetMinutes) {
  const p = utcMsToLocalParts(utcMs, offsetMinutes);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

function resolveLocalCalendarMonthRange(year, month, offsetMinutes) {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const startUtcMs = localCivilToUtcMs(year, month, 1, 0, 0, 0, offsetMinutes);
  const endUtcMs = localCivilToUtcMs(
    year,
    month,
    lastDay,
    23,
    59,
    59,
    offsetMinutes,
  );
  const rangeDays = lastDay;
  const monthLabel = `${year}-${String(month).padStart(2, "0")}`;
  return { startUtcMs, endUtcMs, rangeDays, monthLabel };
}

module.exports = {
  offsetMinutesFromLongitude,
  resolveOffsetMinutes,
  localCivilToUtcMs,
  utcMsToLocalParts,
  localDayKey,
  resolveLocalCalendarMonthRange,
};
