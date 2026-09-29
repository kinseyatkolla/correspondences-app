const test = require("node:test");
const assert = require("node:assert/strict");
const { buildChartAtUtcMs } = require("../lib/chartBuilder");
const { passesElectionalChartFilters } = require("../electional/electionalChartFilters");
const { scoreElectionChart } = require("../electional/scoreElectionTime");
const { vetoUranusPlutoHardAspects } = require("../electional/outerPlanetHardAspectVetoes");
const { mercuryRetrogradeRisingVeto } = require("../electional/rulerRetrogradeRules");

test("chart includes uranus and pluto", () => {
  const chart = buildChartAtUtcMs(38.86, -104.92, Date.UTC(2026, 6, 4, 12, 0, 0));
  assert.ok(chart.planets.uranus?.longitude != null);
  assert.ok(chart.planets.pluto?.longitude != null);
});

test("Mercury retrograde vetoes Virgo rising", () => {
  const chart = {
    planets: {
      mercury: {
        longitude: 170,
        zodiacSignName: "Virgo",
        isRetrograde: true,
      },
    },
  };
  assert.match(
    mercuryRetrogradeRisingVeto("Virgo", chart),
    /Mercury retrograde/,
  );
  assert.equal(mercuryRetrogradeRisingVeto("Leo", chart), null);
});

test("night chart veto when Venus in fall", () => {
  const chart = {
    planets: {
      sun: { longitude: 125, zodiacSignName: "Leo" },
      moon: { longitude: 100, zodiacSignName: "Cancer", speed: 13 },
      mercury: { longitude: 100, zodiacSignName: "Cancer" },
      venus: { longitude: 165, zodiacSignName: "Virgo", isRetrograde: false },
      mars: { longitude: 50, zodiacSignName: "Taurus", speed: 0.5 },
      jupiter: { longitude: 135, zodiacSignName: "Leo" },
      saturn: { longitude: 10, zodiacSignName: "Aries" },
      uranus: { longitude: 240, zodiacSignName: "Sagittarius" },
      pluto: { longitude: 300, zodiacSignName: "Aquarius" },
    },
    houses: { ascendant: 35, ascendantSign: "Taurus", mc: 270 },
  };
  const r = passesElectionalChartFilters(chart);
  assert.equal(r.isDayChart, false);
  assert.equal(r.pass, false);
  assert.match(r.rejectReason, /venus in fall or detriment/);
});

test("Venus retrograde penalizes Taurus rising in score", () => {
  const chart = {
    planets: {
      sun: { longitude: 95, zodiacSignName: "Cancer" },
      moon: { longitude: 40, zodiacSignName: "Taurus" },
      mercury: { longitude: 80, zodiacSignName: "Gemini" },
      venus: { longitude: 40, zodiacSignName: "Taurus", isRetrograde: true },
      mars: { longitude: 50, zodiacSignName: "Taurus" },
      jupiter: { longitude: 135, zodiacSignName: "Leo" },
      saturn: { longitude: 280, zodiacSignName: "Capricorn" },
      uranus: { longitude: 60, zodiacSignName: "Gemini" },
      pluto: { longitude: 300, zodiacSignName: "Aquarius" },
    },
    houses: { ascendant: 30, ascendantSign: "Taurus", mc: 270 },
  };
  const scored = scoreElectionChart(chart);
  assert.ok(
    scored.breakdown.some((b) => b.id === "venus-retro-rising"),
    "expected venus retro rising penalty",
  );
});

test("uranus/pluto hard aspect to moon triggers veto", () => {
  const chart = {
    planets: {
      sun: { longitude: 165, zodiacSignName: "Virgo" },
      moon: { longitude: 10, zodiacSignName: "Aries" },
      mercury: { longitude: 170, zodiacSignName: "Virgo" },
      venus: { longitude: 210, zodiacSignName: "Scorpio" },
      mars: { longitude: 50, zodiacSignName: "Taurus" },
      jupiter: { longitude: 135, zodiacSignName: "Leo" },
      saturn: { longitude: 280, zodiacSignName: "Capricorn" },
      uranus: { longitude: 12, zodiacSignName: "Aries" },
      pluto: { longitude: 300, zodiacSignName: "Aquarius" },
    },
    houses: { ascendant: 150, ascendantSign: "Virgo", mc: 270 },
  };
  const v = vetoUranusPlutoHardAspects(chart);
  assert.equal(v.reject, true);
});
