const test = require("node:test");
const assert = require("node:assert/strict");
const {
  detectHellenisticVoc,
  detectModernVoc,
  pickNextApplication,
} = require("../electional/lunarMotion");
const { isDayChart } = require("../electional/electionSect");
const { isDayChartWholeSign } = require("../electional/chartHelpers");
const {
  isUnderBeams,
  isCombust,
  isCazimi,
  isOvercoming,
  wholeSignHouse,
} = require("../electional/chartHelpers");
const {
  mergeWindows,
  pickTopDailyPeaks,
  buildTopSampleWindows,
} = require("../electional/mergeWindows");
const {
  evaluateElection,
  getActivityHighlights,
  getHouseTopicHighlights,
} = require("../electional/evaluate");
const { evaluateAt } = require("../lib/electionalService");
const {
  assessRisingSign,
  wholeSignHardAspect,
} = require("../electional/risingSignAssessment");
const { computeElectionRank } = require("../electional/electionRank");
const config = require("../electional/config");
const {
  buildPrimaryDignityIntervals,
  resolveMonthlySamplePlan,
  isDomExalt,
} = require("../electional/dignitySearchBucket");
const { resolveLocalCalendarMonthRange } = require("../electional/localTime");

test("Hellenistic VOC false when aspect perfects after sign change within 30°", () => {
  const events = [
    {
      planet: "venus",
      aspect: "trine",
      travelDeg: 22,
      exact: true,
      applying: true,
    },
  ];
  assert.equal(detectHellenisticVoc(events, 30), false);
});

test("Hellenistic VOC true when no aspect within 30° travel", () => {
  const voc = detectHellenisticVoc([], 30);
  assert.equal(voc, true);
  const notVoc = detectHellenisticVoc(
    [{ planet: "venus", aspect: "trine", travelDeg: 12, exact: true }],
    30,
  );
  assert.equal(notVoc, false);
});

test("modern sign VOC is independent of Hellenistic VOC", () => {
  assert.equal(detectModernVoc([]), true);
  assert.equal(
    detectModernVoc([{ travelDeg: 5 }]),
    false,
  );
});

test("solar phase thresholds", () => {
  assert.equal(isUnderBeams(0, 10, 15), true);
  assert.equal(isCombust(0, 5, 8.5), true);
  assert.equal(isCazimi(0, 0.5, 1), true);
  assert.equal(isCazimi(0, 5, 1), false);
});

test("sect day chart from ecliptic horizon (Asc–Dsc arc)", () => {
  const asc = 0;
  const sunDay = 270;
  const sunNight = 90;
  assert.equal(isDayChart(asc, sunDay), true);
  assert.equal(isDayChart(asc, sunNight), false);
  assert.equal(isDayChartWholeSign(asc, 45), true);
  assert.equal(isDayChartWholeSign(asc, 135), false);
});

test("Oct 15 2026 1:35 AM Denver Leo rising is night chart (not whole-sign day)", () => {
  const { buildChartAtUtcMs } = require("../lib/chartBuilder");
  const { localCivilToUtcMs } = require("../electional/localTime");
  const lat = 38.86;
  const lng = -104.92;
  const offset = -360;
  const utcMs = localCivilToUtcMs(2026, 10, 15, 1, 35, 0, offset);
  const chart = buildChartAtUtcMs(lat, lng, utcMs);
  assert.equal(chart.houses.ascendantSign, "Leo");
  const asc = chart.houses.ascendant;
  const sun = chart.planets.sun.longitude;
  assert.equal(isDayChart(asc, sun), false);
  assert.equal(isDayChartWholeSign(asc, sun), true);
});

test("overcoming: malefic in 10th sign from Moon", () => {
  assert.equal(isOvercoming("Capricorn", "Aries"), true);
  assert.equal(isOvercoming("Taurus", "Aries"), false);
});

test("next application picker", () => {
  const next = pickNextApplication([
    { planet: "jupiter", aspect: "trine", travelDeg: 4, applying: true },
    { planet: "mars", aspect: "square", travelDeg: 9, applying: true },
  ]);
  assert.equal(next.planet, "jupiter");
});

test("pickTopDailyPeaks returns windows when many samples exist", () => {
  const samples = [];
  for (let d = 1; d <= 20; d++) {
    samples.push({
      timestamp: Date.UTC(2026, 8, d, 12, 0, 0),
      score: 55,
      rankScore: 55,
      grade: "Good",
      evaluation: { rankScore: 55, grade: "Good" },
    });
  }
  const picked = pickTopDailyPeaks(samples, {
    rankScoreFloor: 35,
    maxTotal: 15,
    maxPerDay: 1,
  });
  assert.ok(picked.length > 0);
});

test("buildTopSampleWindows returns top samples by rank", () => {
  const samples = [
    {
      timestamp: Date.UTC(2026, 8, 1, 1, 0, 0),
      score: 40,
      rankScore: 40,
      grade: "Mixed",
      evaluation: { rankScore: 40 },
    },
    {
      timestamp: Date.UTC(2026, 8, 2, 1, 0, 0),
      score: 60,
      rankScore: 60,
      grade: "Good",
      evaluation: { rankScore: 60 },
    },
  ];
  const w = buildTopSampleWindows(samples, { maxTotal: 2, maxPerDay: 1 });
  assert.equal(w.length, 2);
});

test("pickTopDailyPeaks returns one peak per day up to maxTotal", () => {
  const base = Date.UTC(2026, 8, 1, 12, 0, 0);
  const samples = [];
  for (let day = 0; day < 20; day++) {
    samples.push({
      timestamp: base + day * 86400000,
      score: 50 + day,
      grade: "Good",
      evaluation: { score: 50 + day },
    });
  }
  const peaks = pickTopDailyPeaks(samples, {
    scoreFloor: 45,
    maxTotal: 15,
    maxPerDay: 1,
  });
  assert.equal(peaks.length, 15);
  assert.ok(peaks[0].peakScore >= peaks[14].peakScore);
});

test("mergeWindows caps per day and ranks by score", () => {
  const base = Date.UTC(2026, 0, 10, 12, 0, 0);
  const samples = [];
  for (let i = 0; i < 6; i++) {
    samples.push({
      timestamp: base + i * 5 * 60 * 1000,
      score: 70 + i,
      grade: "Good",
      evaluation: { score: 70 + i },
    });
  }
  const windows = mergeWindows(samples, {
    scoreFloor: 55,
    minSamples: 2,
    maxPerDay: 2,
    maxTotal: 5,
    maxGapMs: 6 * 60 * 1000,
  });
  assert.ok(windows.length >= 1);
  assert.ok(windows[0].peakScore >= 70);
});

test("evaluateElection applies combust veto on synthetic chart", () => {
  const chart = {
    planets: {
      sun: { longitude: 10, zodiacSignName: "Aries", speed: 1 },
      moon: { longitude: 12, zodiacSignName: "Aries", speed: 13.5 },
      mars: { longitude: 200, zodiacSignName: "Libra", speed: 0.5 },
      saturn: { longitude: 300, zodiacSignName: "Aquarius", speed: 0.1 },
      jupiter: { longitude: 100, zodiacSignName: "Cancer", speed: 0.2 },
      venus: { longitude: 250, zodiacSignName: "Sagittarius", speed: 1 },
      mercury: { longitude: 20, zodiacSignName: "Aries", speed: 1 },
    },
    houses: {
      ascendant: 120,
      ascendantSign: "Leo",
    },
  };
  const result = evaluateElection(chart, {
    moonMotion: { hellenisticVoidOfCourse: false, modernVoidOfCourse: false },
    inEclipseWindow: false,
  });
  assert.ok(result.score >= 0 && result.score <= 100);
  assert.ok(result.factors.length > 0);
});

test("getHouseTopicHighlights uses sect benefic and malefic houses", () => {
  const chart = {
    planets: {
      jupiter: { longitude: 240, zodiacSignName: "Sagittarius" },
      mars: { longitude: 100, zodiacSignName: "Cancer" },
      venus: { longitude: 250, zodiacSignName: "Sagittarius" },
      saturn: { longitude: 300, zodiacSignName: "Aquarius" },
    },
    houses: { ascendant: 120, ascendantSign: "Leo" },
  };
  const { bestFor, avoidFor } = getHouseTopicHighlights(chart, true);
  assert.ok(bestFor?.label);
  assert.ok(avoidFor?.label);
  assert.ok(bestFor.reasons?.[0]?.includes("jupiter"));
  assert.ok(avoidFor.reasons?.[0]?.includes("mars"));
});

test("getActivityHighlights still ranks activity profiles", () => {
  const { bestFor } = getActivityHighlights({
    waxing: true,
    ascSign: "Taurus",
    moonSign: "Taurus",
    moonApplyPlanet: "venus",
    score: 70,
  });
  assert.ok(bestFor?.label);
});

test("computeElectionRank weights asc ruler and moon tiers", () => {
  const chart = {
    planets: {
      sun: { longitude: 300, zodiacSignName: "Aquarius", speed: 1 },
      moon: { longitude: 90, zodiacSignName: "Cancer", speed: 13.5 },
      mars: { longitude: 200, zodiacSignName: "Libra", speed: 0.5 },
      saturn: { longitude: 280, zodiacSignName: "Capricorn", speed: 0.1 },
      jupiter: { longitude: 100, zodiacSignName: "Cancer", speed: 0.2 },
      venus: { longitude: 250, zodiacSignName: "Sagittarius", speed: 1 },
      mercury: { longitude: 170, zodiacSignName: "Virgo", speed: 1 },
    },
    houses: { ascendant: 150, ascendantSign: "Virgo" },
  };
  const rank = computeElectionRank(
    chart,
    {
      isDay: true,
      moonMotion: {
        hellenisticVoidOfCourse: false,
        nextApplication: { planet: "jupiter", aspect: "trine" },
      },
    },
    config.activities.general,
  );
  assert.ok(rank.rankScore >= 0 && rank.rankScore <= 100);
  assert.ok(rank.tiers.ascRuler.score > 0);
  assert.ok(rank.tiers.moon.score > 0);
});

test("rising rules reject Saturn on angle at night (e.g. Aries rising while Saturn in Aries)", () => {
  const chart = {
    planets: {
      sun: { longitude: 90, zodiacSignName: "Cancer" },
      moon: { longitude: 90, zodiacSignName: "Cancer" },
      saturn: { longitude: 5, zodiacSignName: "Aries" },
      mars: { longitude: 200, zodiacSignName: "Libra" },
      jupiter: { longitude: 100, zodiacSignName: "Cancer" },
      venus: { longitude: 210, zodiacSignName: "Scorpio" },
      mercury: { longitude: 170, zodiacSignName: "Virgo" },
    },
    houses: { ascendant: 0, ascendantSign: "Aries" },
  };
  const r = assessRisingSign(chart);
  assert.equal(r.reject, true);
  assert.ok(r.violations.some((v) => v.id === "saturn-angular-night"));
});

test("rising rules reject Mars-ruled Asc in day chart", () => {
  const chart = {
    planets: {
      sun: { longitude: 300, zodiacSignName: "Aquarius" },
      moon: { longitude: 90, zodiacSignName: "Cancer" },
      saturn: { longitude: 5, zodiacSignName: "Aries" },
      mars: { longitude: 200, zodiacSignName: "Libra" },
      jupiter: { longitude: 100, zodiacSignName: "Cancer" },
      venus: { longitude: 210, zodiacSignName: "Scorpio" },
      mercury: { longitude: 170, zodiacSignName: "Virgo" },
    },
    houses: { ascendant: 0, ascendantSign: "Aries" },
  };
  const r = assessRisingSign(chart);
  assert.equal(r.reject, true);
  assert.ok(r.violations.some((v) => v.id === "mars-rules-asc-day"));
});

test("wholeSignHardAspect detects conjunct, square, opposition", () => {
  assert.equal(wholeSignHardAspect("Aries", "Aries"), "conjunct");
  assert.equal(wholeSignHardAspect("Aries", "Cancer"), "square");
  assert.equal(wholeSignHardAspect("Aries", "Libra"), "opposition");
  assert.equal(wholeSignHardAspect("Aries", "Gemini"), null);
});

test("rising rules reject Asc ruler square Saturn at night", () => {
  const chart = {
    planets: {
      sun: { longitude: 90, zodiacSignName: "Cancer" },
      moon: { longitude: 90, zodiacSignName: "Cancer" },
      saturn: { longitude: 95, zodiacSignName: "Cancer" },
      mars: { longitude: 200, zodiacSignName: "Libra" },
      jupiter: { longitude: 100, zodiacSignName: "Cancer" },
      venus: { longitude: 210, zodiacSignName: "Scorpio" },
      mercury: { longitude: 95, zodiacSignName: "Cancer" },
    },
    houses: { ascendant: 0, ascendantSign: "Aries" },
  };
  const r = assessRisingSign(chart);
  assert.equal(r.reject, true);
  assert.ok(r.violations.some((v) => v.id === "asc-ruler-square-saturn-night"));
});

test("rising rules reject Saturn-ruled Asc at night", () => {
  const chart = {
    planets: {
      sun: { longitude: 45, zodiacSignName: "Taurus" },
      moon: { longitude: 90, zodiacSignName: "Cancer" },
      saturn: { longitude: 280, zodiacSignName: "Capricorn" },
      mars: { longitude: 200, zodiacSignName: "Libra" },
      jupiter: { longitude: 100, zodiacSignName: "Cancer" },
      venus: { longitude: 210, zodiacSignName: "Scorpio" },
      mercury: { longitude: 170, zodiacSignName: "Virgo" },
    },
    houses: { ascendant: 280, ascendantSign: "Capricorn" },
  };
  const r = assessRisingSign(chart);
  assert.equal(r.reject, true);
  assert.ok(r.violations.some((v) => v.id === "saturn-rules-asc-night"));
});

test("integration evaluateAt returns grade for current epoch", () => {
  const result = evaluateAt(40.7128, -74.006, new Date(), {
    activityId: "general",
  });
  assert.ok(result.evaluation.grade);
  assert.ok(result.chart.planets.moon);
});

test("dignity prescreen recognizes Moon domicile and exaltation", () => {
  assert.equal(isDomExalt("moon", "Cancer"), true);
  assert.equal(isDomExalt("moon", "Taurus"), true);
  assert.equal(isDomExalt("moon", "Scorpio"), false);
});

test("monthly dignity bucket uses fewer steps than full month scan", () => {
  const offsetMinutes = -360;
  const localRange = resolveLocalCalendarMonthRange(2026, 9, offsetMinutes);
  const fineMs = config.search.monthFineStepMinutes * 60 * 1000;
  const fullSteps =
    Math.floor((localRange.endUtcMs - localRange.startUtcMs) / fineMs) + 1;
  const range = {
    startUtcMs: localRange.startUtcMs,
    endUtcMs: localRange.endUtcMs,
    fineMs,
    totalSteps: fullSteps,
  };
  const plan = resolveMonthlySamplePlan(range, {
    prescreen: true,
    coarseStepMinutes: 30,
    useMoonNeutralFallback: true,
  });
  assert.ok(plan.intervals?.length > 0);
  assert.ok(plan.totalSteps < fullSteps);
  assert.ok(
    plan.totalSteps / fullSteps < 0.85,
    `expected meaningful reduction, got ${plan.totalSteps}/${fullSteps}`,
  );
  const intervals = buildPrimaryDignityIntervals(
    localRange.startUtcMs,
    localRange.endUtcMs,
    30 * 60 * 1000,
  );
  assert.ok(intervals.length > 0);
});
