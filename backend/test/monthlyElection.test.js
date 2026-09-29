const test = require("node:test");
const assert = require("node:assert/strict");
const {
  isMutualReception,
  hasAnyMutualReception,
} = require("../electional/mutualReception");
const { scoreElectionChart } = require("../electional/scoreElectionTime");
const {
  searchMonthlyElectionList,
  isDomExalt,
} = require("../electional/monthlyListSearch");
const {
  buildChart,
  buildChartAtUtcMs,
} = require("../lib/chartBuilder");
const { localCivilToUtcMs } = require("../electional/localTime");
const { passesElectionalChartFilters } = require("../electional/electionalChartFilters");

test("mutual reception: Venus in Leo and Sun in Taurus", () => {
  const signs = {
    sun: "Taurus",
    venus: "Leo",
    mercury: "Virgo",
    mars: "Aries",
    jupiter: "Cancer",
    saturn: "Libra",
  };
  assert.equal(isMutualReception("venus", "sun", signs), true);
  assert.equal(hasAnyMutualReception(["sun", "venus", "mercury"], signs), true);
});

test("mutual reception false when only one direction", () => {
  const signs = {
    sun: "Leo",
    venus: "Leo",
    mercury: "Virgo",
    mars: "Aries",
    jupiter: "Cancer",
    saturn: "Libra",
  };
  assert.equal(isMutualReception("venus", "sun", signs), false);
});

test("isDomExalt for Moon in Cancer and Taurus", () => {
  assert.equal(isDomExalt("moon", "Cancer"), true);
  assert.equal(isDomExalt("moon", "Taurus"), true);
  assert.equal(isDomExalt("moon", "Scorpio"), false);
});

test("score reflects moon bad-house mitigation (Sept 1 2026 3:10 PM Denver Sag rising)", () => {
  const lat = 38.86;
  const lng = -104.92;
  const offset = -360;
  const utcMs = localCivilToUtcMs(2026, 9, 1, 15, 10, 0, offset);
  const chart = buildChartAtUtcMs(lat, lng, utcMs);
  assert.equal(chart.houses.ascendantSign, "Sagittarius");
  const filter = passesElectionalChartFilters(chart);
  assert.equal(filter.pass, true, filter.rejectReason);
  const result = scoreElectionChart(chart);
  assert.ok(
    !result.breakdown.some((b) => b.id === "moon-house-bad"),
    "mitigated Moon in 6 should not penalize house placement",
  );
  assert.ok(
    !result.breakdown.some((b) => b.id === "moon-malefic-aspect"),
    "Moon sextile Mars should not count as hard malefic aspect",
  );
  assert.ok(result.score >= 80, `expected strong score, got ${result.score}`);
});

test("scoreElectionChart returns sect houses", () => {
  const chart = buildChart(38.86, -104.92, {
    year: 2026,
    month: 9,
    day: 15,
    hour: 12,
    minute: 0,
  });
  const r = scoreElectionChart(chart);
  assert.ok(Number.isFinite(r.score));
  assert.ok(r.risingSign);
  assert.ok(typeof r.isDayChart === "boolean");
  assert.ok(
    r.inSectBeneficPlanet === "jupiter" || r.inSectBeneficPlanet === "venus",
  );
  assert.ok(
    r.outOfSectMaleficPlanet === "mars" || r.outOfSectMaleficPlanet === "saturn",
  );
  assert.ok(r.ascRulerPlanet);
});

test("buildChartAtUtcMs matches local civil time at offset", () => {
  const lat = 38.86;
  const lon = -104.92;
  const offset = -360;
  const utcMs = localCivilToUtcMs(2026, 9, 1, 14, 10, 0, offset);
  const chart = buildChartAtUtcMs(lat, lon, utcMs);
  assert.equal(chart.houses.ascendantSign, "Sagittarius");
});

test("searchMonthlyElectionList returns ranked times for a month", () => {
  const out = searchMonthlyElectionList({
    latitude: 38.86,
    longitude: -104.92,
    year: 2026,
    month: 9,
    utcOffsetMinutes: -360,
  });
  assert.equal(out.monthLabel, "2026-09");
  assert.ok(out.times.length > 0);
  for (let i = 1; i < out.times.length; i++) {
    assert.ok(
      out.times[i].isoTime >= out.times[i - 1].isoTime,
      "times should be sorted chronologically",
    );
  }
  assert.ok(out.times[0].risingSign);
  assert.ok(
    out.times[0].inSectBeneficHouse != null &&
      out.times[0].inSectBeneficHouse >= 1 &&
      out.times[0].inSectBeneficHouse <= 12,
  );
  if (out.times.length > 0) {
    assert.ok("moonSign" in out.times[0]);
    assert.ok("moonHouse" in out.times[0]);
    assert.ok(out.times[0].chart?.planets?.sun);
    assert.ok(Array.isArray(out.times[0].breakdown));
  }
});

test("day chart filter rejects jupiter in 12th when not mitigated by MC", () => {
  const chart = {
    planets: {
      sun: { longitude: 330, zodiacSignName: "Pisces" },
      moon: { longitude: 200, zodiacSignName: "Libra" },
      mercury: { longitude: 170, zodiacSignName: "Virgo" },
      venus: { longitude: 210, zodiacSignName: "Scorpio" },
      mars: { longitude: 50, zodiacSignName: "Taurus" },
      jupiter: { longitude: 135, zodiacSignName: "Leo" },
      saturn: { longitude: 280, zodiacSignName: "Capricorn" },
    },
    houses: { ascendant: 150, ascendantSign: "Virgo", mc: 270 },
  };
  const r = passesElectionalChartFilters(chart);
  assert.equal(r.isDayChart, true);
  assert.equal(r.pass, false);
});

test("bucket includes Gemini rising when Mercury is dignified in Virgo at noon", () => {
  const { step13GeminiWhenMercuryInVirgo } = require("../electional/monthlyListSearch");
  const { buildChartAtUtcMs } = require("../lib/chartBuilder");
  const { localCivilToUtcMs } = require("../electional/localTime");
  const bucket = new Set();
  const cache = new Map();
  const lat = 38.86;
  const lng = -104.92;
  const offset = -360;
  step13GeminiWhenMercuryInVirgo(
    lat,
    lng,
    2026,
    9,
    30,
    offset,
    bucket,
    cache,
  );
  assert.ok(bucket.size > 0, "expected Gemini rising samples");
  const utcMs = localCivilToUtcMs(2026, 9, 4, 0, 20, 0, offset);
  assert.ok(bucket.has(utcMs), "expected sample near Sept 4 Gemini election time");
  const chart = buildChartAtUtcMs(lat, lng, utcMs);
  assert.equal(chart.houses.ascendantSign, "Gemini");
});

test("bucket includes Sagittarius rising on a day chart without planet dignity", () => {
  const {
    step12InSectBeneficSignRisingWindows,
  } = require("../electional/monthlyListSearch");
  const bucket = new Set();
  const cache = new Map();
  const lat = 38.86;
  const lng = -104.92;
  const year = 2026;
  const month = 9;
  const offset = -360;
  step12InSectBeneficSignRisingWindows(
    lat,
    lng,
    year,
    month,
    30,
    offset,
    bucket,
    cache,
  );
  assert.ok(bucket.size > 0, "expected sect-sign rising samples in bucket");
});

test("eligible times fall in rising-sign windows, not only on the hour", () => {
  const out = searchMonthlyElectionList({
    latitude: 38.86,
    longitude: -104.92,
    year: 2026,
    month: 9,
    utcOffsetMinutes: -360,
  });
  const hours = new Set(
    out.times.map((t) => {
      const match = t.timeLabel.match(/^(\d+):/);
      return match ? Number(match[1]) : -1;
    }),
  );
  assert.ok(hours.size > 2, "expected varied local times across rising windows");
  const onlyNoonAndSix =
    [...hours].every((h) => h === 12 || h === 6) && hours.size <= 2;
  assert.equal(onlyNoonAndSix, false);
});
