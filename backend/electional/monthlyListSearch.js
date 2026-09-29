/**
 * Month election list — steps 1–4 from electional-rules (source of truth doc).
 * Step 1: noon ephemeris finds dignified planets; eligible times = ~2h windows
 * when that planet's sign is rising (not fixed noon/6pm samples).
 */

const sweph = require("sweph");
const {
  buildChartAtUtcMs,
  calculateJulianDay,
} = require("../lib/chartBuilder");
const { getDignity, getPlanet } = require("./chartHelpers");
const { isDayChart } = require("./electionSect");
const { dedupeOneSlotPerDayAndRising } = require("./dedupeDailyRisingSlots");
const { enclosedByBenefics } = require("./electionMitigation");
const {
  isMutualReception,
  hasAnyMutualReception,
} = require("./mutualReception");
const { scoreElectionChart } = require("./scoreElectionTime");
const { passesElectionalChartFilters } = require("./electionalChartFilters");
const { serializeChartSnapshot } = require("./serializeChartSnapshot");
const {
  risingSignIntervalsForLocalDay,
  addSamplesInRisingWindows,
} = require("./risingSignWindows");
const {
  resolveOffsetMinutes,
  resolveLocalCalendarMonthRange,
  localCivilToUtcMs,
  utcMsToLocalParts,
  localDayKey,
} = require("./localTime");

const STEP1_PLANETS = ["sun", "mercury", "venus", "mars", "jupiter", "saturn"];
const PLANET_ID = {
  sun: 0,
  moon: 1,
  mercury: 2,
  venus: 3,
  mars: 4,
  jupiter: 5,
  saturn: 6,
};

const MIN_DAYS_BEFORE_RECEPTION = 5;
/** Samples every N minutes for the full rising-sign window (steps 1, 1.2, 1.5, 2). */
const RISING_WINDOW_SAMPLE_MINUTES = 5;
const MOON_SIGN_CHECK_HOURS = [0, 6, 12, 18];
/** Jupiter signs — include rising windows when chart is diurnal. */
const DAY_SECT_IN_BENEFIC_RISING = ["Sagittarius", "Pisces"];
/** Venus signs — include rising windows when chart is nocturnal. */
const NIGHT_SECT_IN_BENEFIC_RISING = ["Taurus", "Libra", "Pisces"];

function isDomExalt(planetName, signName) {
  const d = getDignity(planetName, signName);
  return d === "domicile" || d === "exaltation";
}

function signAtJd(jd, planetName) {
  const id = PLANET_ID[planetName];
  const r = sweph.calc_ut(jd, id, 0);
  const lon = r.data?.[0];
  if (lon == null) return null;
  const signs = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
  ];
  return signs[Math.floor((((lon % 360) + 360) % 360) / 30)];
}

function signsAtJd(jd, planetNames) {
  const out = {};
  for (const p of planetNames) {
    out[p] = signAtJd(jd, p);
  }
  return out;
}

function jdFromUtcMs(utcMs) {
  const d = new Date(utcMs);
  return calculateJulianDay(
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds(),
  );
}

function localNoonUtcMs(year, month, day, offsetMinutes) {
  return localCivilToUtcMs(year, month, day, 12, 0, 0, offsetMinutes);
}

/** Signs (at local noon) where a non-Moon planet is dignified. */
function dignifiedSignsAtNoon(year, month, day, offsetMinutes) {
  const jd = jdFromUtcMs(localNoonUtcMs(year, month, day, offsetMinutes));
  const signs = new Set();
  for (const planet of STEP1_PLANETS) {
    const sign = signAtJd(jd, planet);
    if (sign && isDomExalt(planet, sign)) {
      signs.add(sign);
    }
  }
  return signs;
}

function mutualReceptionSignsAtNoon(year, month, day, offsetMinutes) {
  const jd = jdFromUtcMs(localNoonUtcMs(year, month, day, offsetMinutes));
  const signByPlanet = signsAtJd(jd, STEP1_PLANETS);
  if (!hasAnyMutualReception(STEP1_PLANETS, signByPlanet)) {
    return new Set();
  }
  const out = new Set();
  for (let i = 0; i < STEP1_PLANETS.length; i++) {
    for (let j = i + 1; j < STEP1_PLANETS.length; j++) {
      const a = STEP1_PLANETS[i];
      const b = STEP1_PLANETS[j];
      if (isMutualReception(a, b, signByPlanet)) {
        if (signByPlanet[a]) out.add(signByPlanet[a]);
        if (signByPlanet[b]) out.add(signByPlanet[b]);
      }
    }
  }
  return out;
}

function moonDignifiedSignsOnDay(year, month, day, offsetMinutes) {
  const signs = new Set();
  for (const hour of MOON_SIGN_CHECK_HOURS) {
    const utcMs = localCivilToUtcMs(
      year,
      month,
      day,
      hour,
      0,
      0,
      offsetMinutes,
    );
    const moonSign = signAtJd(jdFromUtcMs(utcMs), "moon");
    if (moonSign && isDomExalt("moon", moonSign)) {
      signs.add(moonSign);
    }
  }
  return signs;
}

function addRisingWindowsForSigns(
  bucket,
  latitude,
  longitude,
  year,
  month,
  day,
  offsetMinutes,
  risingSigns,
  dayIntervalCache,
) {
  const dayKey = `${year}-${month}-${day}`;
  if (!dayIntervalCache.has(dayKey)) {
    dayIntervalCache.set(
      dayKey,
      risingSignIntervalsForLocalDay(
        latitude,
        longitude,
        year,
        month,
        day,
        offsetMinutes,
      ),
    );
  }
  const intervals = dayIntervalCache.get(dayKey);
  for (const sign of risingSigns) {
    addSamplesInRisingWindows(
      bucket,
      intervals,
      sign,
      RISING_WINDOW_SAMPLE_MINUTES,
    );
  }
}

function isDayChartAtUtcMs(latitude, longitude, utcMs) {
  const chart = buildChartAtUtcMs(latitude, longitude, utcMs);
  const asc = chart.houses?.ascendant;
  const sun = chart.planets?.sun?.longitude;
  if (asc == null || sun == null) return false;
  return isDayChart(asc, sun);
}

function addRisingWindowSamplesIfSect(
  bucket,
  intervalsBySign,
  risingSign,
  sampleStepMinutes,
  latitude,
  longitude,
  offsetMinutes,
  requireDayChart,
) {
  const windows = intervalsBySign.get(risingSign);
  if (!windows?.length) return;
  const stepMs = sampleStepMinutes * 60 * 1000;
  for (const { startUtcMs, endUtcMs } of windows) {
    for (let t = startUtcMs; t <= endUtcMs; t += stepMs) {
      const isDay = isDayChartAtUtcMs(latitude, longitude, t);
      if (requireDayChart ? isDay : !isDay) {
        bucket.add(t);
      }
    }
  }
}

/** In-sect benefic signs rising: Sag/Pis by day, Taurus/Libra by night (no dignity required). */
function step12InSectBeneficSignRisingWindows(
  latitude,
  longitude,
  year,
  month,
  lastDay,
  offsetMinutes,
  bucket,
  dayIntervalCache,
) {
  for (let day = 1; day <= lastDay; day++) {
    const dayKey = `${year}-${month}-${day}`;
    if (!dayIntervalCache.has(dayKey)) {
      dayIntervalCache.set(
        dayKey,
        risingSignIntervalsForLocalDay(
          latitude,
          longitude,
          year,
          month,
          day,
          offsetMinutes,
        ),
      );
    }
    const intervals = dayIntervalCache.get(dayKey);
    for (const sign of DAY_SECT_IN_BENEFIC_RISING) {
      addRisingWindowSamplesIfSect(
        bucket,
        intervals,
        sign,
        RISING_WINDOW_SAMPLE_MINUTES,
        latitude,
        longitude,
        offsetMinutes,
        true,
      );
    }
    for (const sign of NIGHT_SECT_IN_BENEFIC_RISING) {
      addRisingWindowSamplesIfSect(
        bucket,
        intervals,
        sign,
        RISING_WINDOW_SAMPLE_MINUTES,
        latitude,
        longitude,
        offsetMinutes,
        false,
      );
    }
  }
}

function step1PlanetDignityRisingWindows(
  latitude,
  longitude,
  year,
  month,
  lastDay,
  offsetMinutes,
  bucket,
  dayIntervalCache,
) {
  const daysWithDignity = new Set();
  for (let day = 1; day <= lastDay; day++) {
    const risingSigns = dignifiedSignsAtNoon(year, month, day, offsetMinutes);
    if (risingSigns.size === 0) continue;
    daysWithDignity.add(
      localDayKey(
        localNoonUtcMs(year, month, day, offsetMinutes),
        offsetMinutes,
      ),
    );
    addRisingWindowsForSigns(
      bucket,
      latitude,
      longitude,
      year,
      month,
      day,
      offsetMinutes,
      risingSigns,
      dayIntervalCache,
    );
  }
  return daysWithDignity;
}

function step15MutualReceptionRisingWindows(
  latitude,
  longitude,
  year,
  month,
  lastDay,
  offsetMinutes,
  bucket,
  dayIntervalCache,
) {
  for (let day = 1; day <= lastDay; day++) {
    const risingSigns = mutualReceptionSignsAtNoon(
      year,
      month,
      day,
      offsetMinutes,
    );
    if (risingSigns.size === 0) continue;
    addRisingWindowsForSigns(
      bucket,
      latitude,
      longitude,
      year,
      month,
      day,
      offsetMinutes,
      risingSigns,
      dayIntervalCache,
    );
  }
}

/** Gemini rising while Mercury is dignified in Virgo (Mercury rules Gemini). */
function step13GeminiWhenMercuryInVirgo(
  latitude,
  longitude,
  year,
  month,
  lastDay,
  offsetMinutes,
  bucket,
  dayIntervalCache,
) {
  for (let day = 1; day <= lastDay; day++) {
    const jd = jdFromUtcMs(localNoonUtcMs(year, month, day, offsetMinutes));
    const mercSign = signAtJd(jd, "mercury");
    if (mercSign !== "Virgo" || !isDomExalt("mercury", "Virgo")) continue;
    addRisingWindowsForSigns(
      bucket,
      latitude,
      longitude,
      year,
      month,
      day,
      offsetMinutes,
      new Set(["Gemini"]),
      dayIntervalCache,
    );
  }
}

/** Scorpio rising on days the Moon is enclosed by benefics at local noon. */
function step14ScorpioWhenMoonEnclosedAtNoon(
  latitude,
  longitude,
  year,
  month,
  lastDay,
  offsetMinutes,
  bucket,
  dayIntervalCache,
) {
  for (let day = 1; day <= lastDay; day++) {
    const utcMs = localNoonUtcMs(year, month, day, offsetMinutes);
    const chart = buildChartAtUtcMs(latitude, longitude, utcMs);
    const moon = getPlanet(chart, "moon");
    if (!moon || moon.longitude == null) continue;
    if (!enclosedByBenefics(moon.longitude, chart)) continue;
    addRisingWindowsForSigns(
      bucket,
      latitude,
      longitude,
      year,
      month,
      day,
      offsetMinutes,
      new Set(["Scorpio"]),
      dayIntervalCache,
    );
  }
}

function step2MoonDignityRisingWindows(
  latitude,
  longitude,
  year,
  month,
  lastDay,
  offsetMinutes,
  bucket,
  dayIntervalCache,
) {
  for (let day = 1; day <= lastDay; day++) {
    const risingSigns = moonDignifiedSignsOnDay(
      year,
      month,
      day,
      offsetMinutes,
    );
    if (risingSigns.size === 0) continue;
    addRisingWindowsForSigns(
      bucket,
      latitude,
      longitude,
      year,
      month,
      day,
      offsetMinutes,
      risingSigns,
      dayIntervalCache,
    );
  }
}

function formatLocalDateTime(utcMs, offsetMinutes) {
  const p = utcMsToLocalParts(utcMs, offsetMinutes);
  const h12 = p.hour % 12 || 12;
  const ampm = p.hour < 12 ? "AM" : "PM";
  const min = String(p.minute).padStart(2, "0");
  return {
    dateLabel: `${p.month}/${p.day}/${p.year}`,
    timeLabel: `${h12}:${min} ${ampm}`,
    ...p,
  };
}

function searchMonthlyElectionList(params) {
  const latitude = Number(params.latitude);
  const longitude = Number(params.longitude);
  const year = Number(params.year);
  const month = Number(params.month);
  const offsetMinutes = resolveOffsetMinutes({
    utcOffsetMinutes: params.utcOffsetMinutes,
    longitude,
  });

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error("latitude, longitude, year, and month (1–12) are required");
  }

  const { monthLabel } = resolveLocalCalendarMonthRange(
    year,
    month,
    offsetMinutes,
  );
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const notes = [];
  const bucket = new Set();
  const dayIntervalCache = new Map();

  const daysWithPlanetDignity = step1PlanetDignityRisingWindows(
    latitude,
    longitude,
    year,
    month,
    lastDay,
    offsetMinutes,
    bucket,
    dayIntervalCache,
  );

  step12InSectBeneficSignRisingWindows(
    latitude,
    longitude,
    year,
    month,
    lastDay,
    offsetMinutes,
    bucket,
    dayIntervalCache,
  );

  step13GeminiWhenMercuryInVirgo(
    latitude,
    longitude,
    year,
    month,
    lastDay,
    offsetMinutes,
    bucket,
    dayIntervalCache,
  );

  step14ScorpioWhenMoonEnclosedAtNoon(
    latitude,
    longitude,
    year,
    month,
    lastDay,
    offsetMinutes,
    bucket,
    dayIntervalCache,
  );

  if (daysWithPlanetDignity.size <= MIN_DAYS_BEFORE_RECEPTION) {
    step15MutualReceptionRisingWindows(
      latitude,
      longitude,
      year,
      month,
      lastDay,
      offsetMinutes,
      bucket,
      dayIntervalCache,
    );
  }

  if (bucket.size === 0) {
    notes.push(
      "No days this month had a traditional planet (besides the Moon) dignified by sign or in mutual reception at local noon. Moon dignity rising windows are still included below.",
    );
  }

  step2MoonDignityRisingWindows(
    latitude,
    longitude,
    year,
    month,
    lastDay,
    offsetMinutes,
    bucket,
    dayIntervalCache,
  );

  if (bucket.size === 0) {
    notes.push("No eligible times were found for this month.");
    return { monthLabel, year, month, times: [], notes };
  }

  const bucketSorted = [...bucket].sort((a, b) => a - b);

  const includeVetoes = params.includeVetoes === true;
  const scored = [];
  const vetoedTimes = [];
  let filteredOut = 0;
  for (const utcMs of bucketSorted) {
    const fmt = formatLocalDateTime(utcMs, offsetMinutes);
    const chart = buildChartAtUtcMs(latitude, longitude, utcMs);
    const filter = passesElectionalChartFilters(chart);
    if (!filter.pass) {
      filteredOut += 1;
      if (includeVetoes) {
        vetoedTimes.push({
          isoTime: new Date(utcMs).toISOString(),
          dateLabel: fmt.dateLabel,
          timeLabel: fmt.timeLabel,
          veto: filter.rejectReason ?? "veto",
        });
      }
      continue;
    }

    const result = scoreElectionChart(chart);
    scored.push({
      score: result.score,
      utcMs,
      isoTime: new Date(utcMs).toISOString(),
      dateLabel: fmt.dateLabel,
      timeLabel: fmt.timeLabel,
      risingSign: result.risingSign,
      isDayChart: filter.isDayChart,
      chartSect: filter.isDayChart ? "day" : "night",
      ascRulerPlanet: result.ascRulerPlanet,
      ascRulerSign: result.ascRulerSign,
      ascRulerHouse: result.ascRulerHouse,
      ascRulerDignity: result.ascRulerDignity,
      moonSign: result.moonSign,
      moonHouse: result.moonHouse,
      moonDignity: result.moonDignity,
      inSectBeneficPlanet: result.inSectBeneficPlanet,
      inSectBeneficSign: result.inSectBeneficSign,
      inSectBeneficHouse: result.inSectBeneficHouse,
      inSectBeneficDignity: result.inSectBeneficDignity,
      outOfSectMaleficPlanet: result.outOfSectMaleficPlanet,
      outOfSectMaleficSign: result.outOfSectMaleficSign,
      outOfSectMaleficHouse: result.outOfSectMaleficHouse,
      outOfSectMaleficDignity: result.outOfSectMaleficDignity,
      chart: serializeChartSnapshot(chart),
      breakdown: result.breakdown,
    });
  }

  scored.sort((a, b) => a.utcMs - b.utcMs);

  const deduped = dedupeOneSlotPerDayAndRising(scored);
  const times = deduped.map(({ utcMs, ...rest }) => rest);

  return {
    monthLabel,
    year,
    month,
    times,
    notes,
    vetoedTimes: includeVetoes ? vetoedTimes : undefined,
    bucketCount: bucket.size,
    passedFilterCount: scored.length,
    filteredOutCount: filteredOut,
    dedupedCount: deduped.length,
    returnedCount: times.length,
  };
}

module.exports = {
  searchMonthlyElectionList,
  STEP1_PLANETS,
  isDomExalt,
  dignifiedSignsAtNoon,
  DAY_SECT_IN_BENEFIC_RISING,
  NIGHT_SECT_IN_BENEFIC_RISING,
  step12InSectBeneficSignRisingWindows,
  step13GeminiWhenMercuryInVirgo,
  step14ScorpioWhenMoonEnclosedAtNoon,
};
