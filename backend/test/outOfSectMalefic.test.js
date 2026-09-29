const test = require("node:test");
const assert = require("node:assert/strict");
const { vetoOutOfSectMaleficToAscendant } = require("../electional/outOfSectMaleficAspects");
const { passesElectionalChartFilters } = require("../electional/electionalChartFilters");
const { buildChartAtUtcMs } = require("../lib/chartBuilder");
const { localCivilToUtcMs } = require("../electional/localTime");

test("veto when asc sign is in whole-sign opposition to out-of-sect Mars by day", () => {
  const chart = {
    planets: {
      sun: { longitude: 165, zodiacSignName: "Virgo" },
      moon: { longitude: 200, zodiacSignName: "Libra" },
      mercury: { longitude: 195, zodiacSignName: "Libra" },
      venus: { longitude: 210, zodiacSignName: "Scorpio" },
      mars: { longitude: 10, zodiacSignName: "Aries" },
      jupiter: { longitude: 135, zodiacSignName: "Leo" },
      saturn: { longitude: 280, zodiacSignName: "Capricorn" },
    },
    houses: { ascendant: 180, ascendantSign: "Libra", mc: 90 },
  };
  const r = vetoOutOfSectMaleficToAscendant(chart, true);
  assert.equal(r.reject, true);
});

test("Virgo morning can pass when Jupiter in 12th is mitigated via MC", () => {
  const lat = 38.86;
  const lon = -104.92;
  const offset = -360;
  const utcMs = localCivilToUtcMs(2026, 9, 4, 7, 10, 0, offset);
  const chart = buildChartAtUtcMs(lat, lon, utcMs);
  assert.equal(chart.houses.ascendantSign, "Virgo");
  const filter = passesElectionalChartFilters(chart);
  assert.equal(filter.pass, true, filter.rejectReason);
});
