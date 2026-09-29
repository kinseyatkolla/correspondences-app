/**
 * Cheap ephemeris pre-pass: find month intervals where the Moon or other
 * traditional planets are in domicile or exaltation before full chart search.
 */

const sweph = require("sweph");
const { signFromLon, getDignity } = require("./chartHelpers");
const { TRADITIONAL_PLANETS } = require("./constants");
const { calculateJulianDay } = require("../lib/chartBuilder");

const PLANET_ID = {
  sun: 0,
  moon: 1,
  mercury: 2,
  venus: 3,
  mars: 4,
  jupiter: 5,
  saturn: 6,
};

function isDomExalt(planetName, signName) {
  const d = getDignity(planetName, signName);
  return d === "domicile" || d === "exaltation";
}

function isMoonNeutralOrBetter(signName) {
  const d = getDignity("moon", signName);
  return d !== "detriment" && d !== "fall";
}

function utcMsToJd(t) {
  const d = new Date(t);
  return calculateJulianDay(
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds(),
  );
}

function signAtJd(jd, planetName) {
  const id = PLANET_ID[planetName];
  if (id == null) return null;
  const r = sweph.calc_ut(jd, id, 0);
  const lon = r.data?.[0];
  if (lon == null) return null;
  return signFromLon(lon);
}

function scanBucketFlags(startUtcMs, endUtcMs, coarseMs, predicate) {
  const hits = [];
  for (let t = startUtcMs; t <= endUtcMs; t += coarseMs) {
    const jd = utcMsToJd(t);
    const moonSign = signAtJd(jd, "moon");
    if (!moonSign) continue;
    if (predicate(jd, moonSign)) hits.push(t);
  }
  return hits;
}

function mergeHitsToIntervals(hits, coarseMs) {
  if (!hits.length) return [];
  const sorted = [...hits].sort((a, b) => a - b);
  const gap = coarseMs * 1.5;
  const intervals = [];
  let start = sorted[0];
  let last = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const t = sorted[i];
    if (t - last <= gap) {
      last = t;
    } else {
      intervals.push({
        startUtcMs: start,
        endUtcMs: last + coarseMs,
      });
      start = t;
      last = t;
    }
  }
  intervals.push({ startUtcMs: start, endUtcMs: last + coarseMs });
  return intervals;
}

function unionIntervals(intervals) {
  if (!intervals.length) return [];
  const sorted = [...intervals].sort((a, b) => a.startUtcMs - b.startUtcMs);
  const out = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    const top = out[out.length - 1];
    if (cur.startUtcMs <= top.endUtcMs) {
      top.endUtcMs = Math.max(top.endUtcMs, cur.endUtcMs);
    } else {
      out.push({ ...cur });
    }
  }
  return out;
}

/** Moon in domicile or exaltation at coarse steps. */
function buildMoonDignityIntervals(startUtcMs, endUtcMs, coarseMs) {
  const hits = scanBucketFlags(startUtcMs, endUtcMs, coarseMs, (_jd, moonSign) =>
    isDomExalt("moon", moonSign),
  );
  return mergeHitsToIntervals(hits, coarseMs);
}

/** Any non-Moon traditional planet in domicile or exaltation. */
function buildOtherPlanetDignityIntervals(startUtcMs, endUtcMs, coarseMs) {
  const hits = scanBucketFlags(startUtcMs, endUtcMs, coarseMs, (jd) => {
    for (const p of TRADITIONAL_PLANETS) {
      if (p === "moon") continue;
      const sign = signAtJd(jd, p);
      if (sign && isDomExalt(p, sign)) return true;
    }
    return false;
  });
  return mergeHitsToIntervals(hits, coarseMs);
}

/**
 * Primary bucket: times when Moon is dignified and/or another planet is dignified.
 */
function buildPrimaryDignityIntervals(startUtcMs, endUtcMs, coarseMs) {
  const moon = buildMoonDignityIntervals(startUtcMs, endUtcMs, coarseMs);
  const other = buildOtherPlanetDignityIntervals(startUtcMs, endUtcMs, coarseMs);
  return unionIntervals([...moon, ...other]);
}

/** Fallback when primary bucket is empty: Moon not in detriment or fall. */
function buildMoonNeutralIntervals(startUtcMs, endUtcMs, coarseMs) {
  const hits = scanBucketFlags(startUtcMs, endUtcMs, coarseMs, (_jd, moonSign) =>
    isMoonNeutralOrBetter(moonSign),
  );
  return mergeHitsToIntervals(hits, coarseMs);
}

function countFineStepsInIntervals(intervals, fineMs, endUtcMs) {
  let n = 0;
  for (const iv of intervals) {
    const end = Math.min(iv.endUtcMs, endUtcMs);
    for (let t = iv.startUtcMs; t <= end; t += fineMs) n += 1;
  }
  return n;
}

/**
 * @returns {{ mode: string, intervals: { startUtcMs: number, endUtcMs: number }[], totalSteps: number }}
 */
function resolveMonthlySamplePlan(range, options = {}) {
  const {
    startUtcMs,
    endUtcMs,
    fineMs,
    totalSteps: fullTotalSteps,
  } = range;
  const {
    prescreen = true,
    coarseStepMinutes = 30,
    useMoonNeutralFallback = true,
  } = options;

  if (!prescreen || fineMs <= 0) {
    return { mode: "full-month", intervals: null, totalSteps: fullTotalSteps };
  }

  const coarseMs = coarseStepMinutes * 60 * 1000;
  let intervals = buildPrimaryDignityIntervals(startUtcMs, endUtcMs, coarseMs);
  let mode = "dignity-bucket";

  if (intervals.length === 0 && useMoonNeutralFallback) {
    intervals = buildMoonNeutralIntervals(startUtcMs, endUtcMs, coarseMs);
    mode = "fallback-moon-neutral";
  }

  if (intervals.length === 0) {
    return { mode: "full-month", intervals: null, totalSteps: fullTotalSteps };
  }

  const totalSteps = countFineStepsInIntervals(intervals, fineMs, endUtcMs);
  return {
    mode,
    intervals,
    totalSteps: Math.max(1, totalSteps),
  };
}

module.exports = {
  isDomExalt,
  isMoonNeutralOrBetter,
  buildPrimaryDignityIntervals,
  buildMoonNeutralIntervals,
  mergeHitsToIntervals,
  unionIntervals,
  countFineStepsInIntervals,
  resolveMonthlySamplePlan,
};
