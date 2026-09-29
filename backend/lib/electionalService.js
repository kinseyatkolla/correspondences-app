const sweph = require("sweph");
const { evaluateElection } = require("../electional/evaluate");
const {
  pickTopDailyPeaks,
  serializeElectionWindows,
} = require("../electional/mergeWindows");
const config = require("../electional/config");
const {
  detectHellenisticVoc,
  detectModernVoc,
  pickNextApplication,
  pickLastSeparation,
  VOC_TARGETS,
} = require("../electional/lunarMotion");
const { buildChart, calculateJulianDay } = require("./chartBuilder");
const {
  resolveOffsetMinutes,
  resolveLocalCalendarMonthRange,
  utcMsToLocalParts,
  localDayKey,
} = require("../electional/localTime");
const { resolveMonthlySamplePlan } = require("../electional/dignitySearchBucket");

const SEFLG_TOPOCTR = 0x00040000;
const ASPECTS = [
  { name: "conjunct", angle: 0 },
  { name: "sextile", angle: 60 },
  { name: "square", angle: 90 },
  { name: "trine", angle: 120 },
  { name: "opposition", angle: 180 },
];

const electionalSearchCache = new Map();

function getAngularDistance(lon1, lon2) {
  const diff = Math.abs(((lon1 % 360) + 360) % 360 - ((lon2 % 360) + 360) % 360);
  return Math.min(diff, 360 - diff);
}

function getAspectDistanceFromTarget(angle, target) {
  return Math.abs(angle - target);
}

function moonLonAt(jd) {
  const r = sweph.calc_ut(jd, 1, SEFLG_TOPOCTR);
  return r.data?.[0];
}

function planetLonAt(jd, planetId) {
  const r = sweph.calc_ut(jd, planetId, SEFLG_TOPOCTR);
  return r.data?.[0];
}

const PLANET_ID_MAP = {
  sun: 0,
  moon: 1,
  mercury: 2,
  venus: 3,
  mars: 4,
  jupiter: 5,
  saturn: 6,
};

function scanMoonAspectEvents(jd, latitude, longitude, maxTravelDeg) {
  sweph.set_topo(longitude, latitude, 0);
  const moonStart = moonLonAt(jd);
  if (moonStart === undefined) return [];
  const step = 1 / 48;
  const found = new Set();
  const events = [];
  let t = jd;
  while (t - jd < 3) {
    const ml = moonLonAt(t);
    if (ml === undefined) break;
    const travel = (ml - moonStart + 360) % 360;
    if (travel > maxTravelDeg) break;
    for (const target of VOC_TARGETS) {
      const targetId = PLANET_ID_MAP[target];
      for (const aspect of ASPECTS) {
        const key = `${target}-${aspect.name}`;
        if (found.has(key)) continue;
        const pl = planetLonAt(t, targetId);
        if (pl === undefined) continue;
        const dist = getAspectDistanceFromTarget(
          getAngularDistance(ml, pl),
          aspect.angle,
        );
        if (dist <= config.moon.aspectExactOrbDeg) {
          found.add(key);
          events.push({
            planet: target,
            aspect: aspect.name,
            travelDeg: travel,
            exact: true,
            applying: true,
            jd: t,
          });
        }
      }
    }
    t += step;
  }
  events.sort((a, b) => a.travelDeg - b.travelDeg);
  return events;
}

function scanMoonAspectEventsBackward(jd, latitude, longitude, maxTravelDeg) {
  sweph.set_topo(longitude, latitude, 0);
  const moonStart = moonLonAt(jd);
  if (moonStart === undefined) return [];
  const step = 1 / 48;
  const found = new Set();
  const events = [];
  let t = jd;
  while (jd - t < 3) {
    const ml = moonLonAt(t);
    if (ml === undefined) break;
    const travel = (moonStart - ml + 360) % 360;
    if (travel > maxTravelDeg) break;
    for (const target of VOC_TARGETS) {
      const targetId = PLANET_ID_MAP[target];
      for (const aspect of ASPECTS) {
        const key = `${target}-${aspect.name}`;
        if (found.has(key)) continue;
        const pl = planetLonAt(t, targetId);
        if (pl === undefined) continue;
        const dist = getAspectDistanceFromTarget(
          getAngularDistance(ml, pl),
          aspect.angle,
        );
        if (dist <= config.moon.aspectExactOrbDeg) {
          found.add(key);
          events.push({
            planet: target,
            aspect: aspect.name,
            travelDeg: -travel,
            exact: true,
            applying: false,
            jd: t,
          });
        }
      }
    }
    t -= step;
  }
  events.sort((a, b) => b.travelDeg - a.travelDeg);
  return events;
}

function buildMoonMotionContext(jd, latitude, longitude) {
  sweph.set_topo(longitude, latitude, 0);
  const moonStart = moonLonAt(jd);
  const moonSign = Math.floor((moonStart || 0) / 30);
  const maxTravel = config.moon.vocTravelDeg;
  const forwardEvents = scanMoonAspectEvents(jd, latitude, longitude, maxTravel);
  const backwardEvents = scanMoonAspectEventsBackward(
    jd,
    latitude,
    longitude,
    maxTravel,
  );
  const events = forwardEvents;

  const signEvents = events.filter((e) => {
    const ml = moonLonAt(e.jd);
    return ml !== undefined && Math.floor(ml / 30) === moonSign;
  });

  return {
    hellenisticVoidOfCourse: detectHellenisticVoc(events, maxTravel),
    modernVoidOfCourse: detectModernVoc(signEvents),
    nextApplication: pickNextApplication(events),
    lastSeparation: pickLastSeparation(backwardEvents),
    conditionChanges: buildConditionChanges(jd, moonStart, events),
  };
}

function buildConditionChanges(jd, moonStart, events) {
  const changes = [];
  const next = events[0];
  if (next) {
    const hours = ((next.jd - jd) * 24).toFixed(1);
    changes.push({
      label: `Moon perfects ${next.aspect} with ${next.planet}`,
      inHours: Number(hours),
    });
  }
  return changes;
}

function loadEclipsesBetween(startJd, endJd) {
  const eclipses = [];
  try {
    let jd = startJd;
    while (jd < endJd) {
      const solar = sweph.sol_eclipse_when_glob(jd, 0, 0, false);
      if (solar?.data?.[0]) {
        eclipses.push({ type: "solar", jd: solar.data[0] });
        jd = solar.data[0] + 0.1;
      } else break;
    }
  } catch (_) {
    /* optional */
  }
  try {
    let jd = startJd;
    while (jd < endJd) {
      const lunar = sweph.lun_eclipse_when(jd, 0, 0, false);
      if (lunar?.data?.[0]) {
        eclipses.push({ type: "lunar", jd: lunar.data[0] });
        jd = lunar.data[0] + 0.1;
      } else break;
    }
  } catch (_) {
    /* optional */
  }
  return eclipses;
}

function isInEclipseWindow(jd, eclipses, windowDays) {
  const day = windowDays;
  for (const e of eclipses) {
    if (Math.abs(jd - e.jd) <= day) return true;
  }
  return false;
}

function getPlanetaryHourContext(date, latitude, longitude) {
  const dayNames = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
  const dayRuler = dayNames[date.getDay()];
  return { dayRuler, hourRuler: null };
}

function evaluateAt(latitude, longitude, date, options = {}) {
  const chart = buildChart(latitude, longitude, {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: date.getUTCSeconds(),
  });

  const moonMotion = buildMoonMotionContext(
    chart.julianDay,
    latitude,
    longitude,
  );

  const rangeEclipses = loadEclipsesBetween(
    chart.julianDay - config.eclipseWindowDays,
    chart.julianDay + config.eclipseWindowDays + 1,
  );

  const ctx = {
    activityId: options.activityId || config.defaultActivityId,
    natalRooting: options.natalRooting === true,
    natal: options.natal || null,
    moonMotion,
    inEclipseWindow: isInEclipseWindow(
      chart.julianDay,
      rangeEclipses,
      config.eclipseWindowDays,
    ),
    planetaryHour: options.planetaryHour || getPlanetaryHourContext(date, latitude, longitude),
  };

  const evaluation = evaluateElection(chart, ctx);
  return { chart, evaluation, context: ctx };
}

function coarseLunarVeto(jd, latitude, longitude) {
  const motion = buildMoonMotionContext(jd, latitude, longitude);
  if (motion.hellenisticVoidOfCourse) return true;
  const chart = buildChart(latitude, longitude, { julianDay: jd });
  const moon = chart.planets.moon;
  const sun = chart.planets.sun;
  if (!moon || !sun) return true;
  const dist = getAngularDistance(moon.longitude, sun.longitude);
  if (dist <= config.solarPhase.combustDeg) return true;
  const eclipses = loadEclipsesBetween(
    jd - config.eclipseWindowDays,
    jd + config.eclipseWindowDays,
  );
  if (isInEclipseWindow(jd, eclipses, config.eclipseWindowDays)) return true;
  return false;
}

function resolveCalendarMonthRange(refDate = new Date()) {
  const y = refDate.getUTCFullYear();
  const m = refDate.getUTCMonth();
  const startDate = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const endDate = new Date(Date.UTC(y, m, lastDay, 23, 59, 59));
  const rangeDays =
    (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000) + 1;
  return { startDate, rangeDays, monthLabel: `${y}-${String(m + 1).padStart(2, "0")}` };
}

function yieldEventLoop() {
  return new Promise((resolve) => setImmediate(resolve));
}

function resolveSearchRange(params) {
  const {
    calendarMonth = true,
    utcOffsetMinutes,
    longitude,
    rangeDays: rangeDaysParam,
    startDate: startDateParam,
    startYear,
    startMonth,
  } = params;

  const offsetMinutes = resolveOffsetMinutes({
    utcOffsetMinutes,
    longitude,
  });

  let startUtcMs;
  let endUtcMs;
  let rangeDays = rangeDaysParam ?? 30;
  let monthLabel = null;

  if (calendarMonth) {
    const ref = startDateParam || new Date();
    const y = startYear ?? ref.getUTCFullYear();
    const m = startMonth ?? ref.getUTCMonth() + 1;
    const localRange = resolveLocalCalendarMonthRange(y, m, offsetMinutes);
    startUtcMs = localRange.startUtcMs;
    endUtcMs = localRange.endUtcMs;
    rangeDays = localRange.rangeDays;
    monthLabel = localRange.monthLabel;
  } else {
    const startDate = startDateParam || new Date();
    startUtcMs = startDate.getTime();
    endUtcMs = startUtcMs + rangeDays * 24 * 60 * 60 * 1000;
  }

  const fineMs =
    (config.search.monthFineStepMinutes || config.search.fineStepMinutes) *
    60 *
    1000;
  const totalSteps =
    fineMs > 0 ? Math.floor((endUtcMs - startUtcMs) / fineMs) + 1 : 0;

  return {
    offsetMinutes,
    startUtcMs,
    endUtcMs,
    rangeDays,
    monthLabel,
    fineMs,
    totalSteps,
  };
}

function buildMonthlySamplePlan(params, range) {
  if (params.calendarMonth === false) {
    return {
      mode: "full-month",
      intervals: null,
      totalSteps: range.totalSteps,
    };
  }
  return resolveMonthlySamplePlan(range, {
    prescreen: config.search.dignityPrescreen !== false,
    coarseStepMinutes: config.search.dignityCoarseStepMinutes ?? 30,
    useMoonNeutralFallback: config.search.dignityFallbackMoonNeutral !== false,
  });
}

function* iterateMonthlySampleTimes(plan, startUtcMs, endUtcMs, fineMs) {
  if (!plan.intervals) {
    for (let t = startUtcMs; t <= endUtcMs; t += fineMs) yield t;
    return;
  }
  for (const iv of plan.intervals) {
    const end = Math.min(iv.endUtcMs, endUtcMs);
    for (let t = iv.startUtcMs; t <= end; t += fineMs) yield t;
  }
}

function tryCollectSampleAt(
  t,
  {
    latitude,
    longitude,
    offsetMinutes,
    natalRooting,
    natal,
    timeFilter,
    planetaryHourByTimestamp,
    maxPerDay,
    perLocalDayCounts,
  },
) {
  const dayKey = localDayKey(t, offsetMinutes);
  const dayCount = perLocalDayCounts.get(dayKey) || 0;
  if (dayCount >= maxPerDay) return null;

  const local = utcMsToLocalParts(t, offsetMinutes);
  if (
    timeFilter &&
    (local.hour < timeFilter.startHour || local.hour >= timeFilter.endHour)
  ) {
    return null;
  }

  const d = new Date(t);
  const jd = calculateJulianDay(
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds(),
  );
  if (coarseLunarVeto(jd, latitude, longitude)) return null;

  const ph =
    planetaryHourByTimestamp?.[t] ||
    getPlanetaryHourContext(d, latitude, longitude);
  const { evaluation } = evaluateAt(latitude, longitude, d, {
    activityId: config.defaultActivityId,
    natalRooting,
    natal,
    planetaryHour: ph,
  });
  if (evaluation.rejectSearch) return null;

  perLocalDayCounts.set(dayKey, dayCount + 1);
  return {
    timestamp: t,
    score: evaluation.score,
    rankScore: evaluation.rankScore,
    natalScore: evaluation.natalScore,
    grade: evaluation.grade,
    evaluation,
  };
}

async function collectElectionSamples(params, hooks = {}) {
  const {
    latitude,
    longitude,
    natalRooting,
    natal,
    timeFilter,
    planetaryHourByTimestamp,
  } = params;

  const range = resolveSearchRange(params);
  const { offsetMinutes, startUtcMs, endUtcMs, fineMs } = range;
  const plan = buildMonthlySamplePlan(params, range);
  const totalSteps = plan.totalSteps;

  const maxPerDay = config.search.maxSamplesPerDay || 144;
  const perLocalDayCounts = new Map();
  const samples = [];
  const yieldEvery = hooks.yieldEvery ?? 12;

  let processed = 0;
  const ctx = {
    latitude,
    longitude,
    offsetMinutes,
    natalRooting,
    natal,
    timeFilter,
    planetaryHourByTimestamp,
    maxPerDay,
    perLocalDayCounts,
  };

  for (const t of iterateMonthlySampleTimes(
    plan,
    startUtcMs,
    endUtcMs,
    fineMs,
  )) {
    if (hooks.isCancelled?.()) {
      return { samples, range: { ...range, samplePlan: plan }, cancelled: true };
    }

    processed += 1;
    const sample = tryCollectSampleAt(t, ctx);
    if (sample) samples.push(sample);

    if (processed % yieldEvery === 0) {
      hooks.onProgress?.({
        processed,
        totalSteps,
        samplesFound: samples.length,
        samplePlanMode: plan.mode,
      });
      await yieldEventLoop();
    }
  }

  hooks.onProgress?.({
    processed: totalSteps,
    totalSteps,
    samplesFound: samples.length,
    samplePlanMode: plan.mode,
  });

  return {
    samples,
    range: { ...range, samplePlan: plan },
    cancelled: false,
  };
}

function searchElectionWindows(params) {
  const {
    latitude,
    longitude,
    natalRooting,
    natal,
    timeFilter,
    calendarMonth = true,
    utcOffsetMinutes,
  } = params;

  const offsetMinutes = resolveOffsetMinutes({
    utcOffsetMinutes,
    longitude,
  });

  const { monthLabel } = resolveSearchRange(params);

  const cacheKey = JSON.stringify({
    lat: Math.round(latitude * 100) / 100,
    lng: Math.round(longitude * 100) / 100,
    month: monthLabel || "custom",
    offset: offsetMinutes,
    natalRooting,
    timeFilter,
    mode: "monthly-highlights-v8-dignity-bucket",
  });
  if (electionalSearchCache.has(cacheKey)) {
    const cachedWindows = electionalSearchCache.get(cacheKey);
    if (cachedWindows?.length > 0) {
      return {
        windows: cachedWindows,
        cached: true,
        monthLabel,
        rangeDays: resolveSearchRange(params).rangeDays,
      };
    }
    electionalSearchCache.delete(cacheKey);
  }

  const { samples, range } = collectElectionSamplesSync(params);
  return finalizeSearchFromSamples(params, samples, range, cacheKey);
}

/** Sync path for tests — no event-loop yield. */
function collectElectionSamplesSync(params) {
  const {
    latitude,
    longitude,
    natalRooting,
    natal,
    timeFilter,
    planetaryHourByTimestamp,
  } = params;
  const range = resolveSearchRange(params);
  const { startUtcMs, endUtcMs, fineMs } = range;
  const plan = buildMonthlySamplePlan(params, range);
  const maxPerDay = config.search.maxSamplesPerDay || 144;
  const perLocalDayCounts = new Map();
  const samples = [];
  const ctx = {
    latitude,
    longitude,
    offsetMinutes: range.offsetMinutes,
    natalRooting,
    natal,
    timeFilter,
    planetaryHourByTimestamp,
    maxPerDay,
    perLocalDayCounts,
  };

  for (const t of iterateMonthlySampleTimes(
    plan,
    startUtcMs,
    endUtcMs,
    fineMs,
  )) {
    const sample = tryCollectSampleAt(t, ctx);
    if (sample) samples.push(sample);
  }
  return { samples, range: { ...range, samplePlan: plan } };
}

function finalizeSearchFromSamples(params, samples, range, cacheKey) {
  const { offsetMinutes, fineMs, monthLabel, rangeDays } = range;
  const localDayKeyFn = (ts) => localDayKey(ts, offsetMinutes);
  const windows = pickTopDailyPeaks(samples, {
    scoreFloor: config.search.scoreFloor,
    rankScoreFloor: config.search.rankScoreFloor,
    maxTotal: config.search.maxWindowsMonth,
    maxPerDay: config.search.maxWindowsPerDay,
    windowPaddingMs: fineMs,
    localDayKeyFn,
  });
  const serialized = serializeElectionWindows(windows);
  if (serialized.length > 0) {
    electionalSearchCache.set(cacheKey, serialized);
  }
  return {
    windows: serialized,
    cached: false,
    monthLabel,
    rangeDays,
    candidatesCount: samples.length,
    samplePlanMode: range.samplePlan?.mode ?? null,
  };
}

async function searchElectionWindowsAsync(params, hooks = {}) {
  const {
    latitude,
    longitude,
    natalRooting,
    timeFilter,
  } = params;

  const offsetMinutes = resolveOffsetMinutes({
    utcOffsetMinutes: params.utcOffsetMinutes,
    longitude,
  });
  const { monthLabel } = resolveSearchRange(params);

  const cacheKey = JSON.stringify({
    lat: Math.round(latitude * 100) / 100,
    lng: Math.round(longitude * 100) / 100,
    month: monthLabel || "custom",
    offset: offsetMinutes,
    natalRooting,
    timeFilter,
    mode: "monthly-highlights-v8-dignity-bucket",
  });

  if (electionalSearchCache.has(cacheKey)) {
    const cachedWindows = electionalSearchCache.get(cacheKey);
    if (cachedWindows?.length > 0) {
      return {
        windows: cachedWindows,
        cached: true,
        monthLabel,
        rangeDays: resolveSearchRange(params).rangeDays,
        candidatesCount: cachedWindows.length,
      };
    }
    electionalSearchCache.delete(cacheKey);
  }

  const { samples, range, cancelled } = await collectElectionSamples(
    params,
    hooks,
  );
  if (cancelled) {
    return {
      windows: [],
      cached: false,
      monthLabel,
      rangeDays: range.rangeDays,
      cancelled: true,
      candidatesCount: 0,
    };
  }
  return finalizeSearchFromSamples(params, samples, range, cacheKey);
}

module.exports = {
  evaluateAt,
  searchElectionWindows,
  searchElectionWindowsAsync,
  resolveCalendarMonthRange,
  buildMoonMotionContext,
  coarseLunarVeto,
};
