const test = require("node:test");
const assert = require("node:assert/strict");
const { passesElectionalChartFilters } = require("../electional/electionalChartFilters");
const { vetoOutOfSectMaleficToAscendant } = require("../electional/outOfSectMaleficAspects");

test("Sag rising: Jupiter and Mars same sign does not veto by asc ruler sign alone", () => {
  const chart = {
    planets: {
      sun: { longitude: 45, zodiacSignName: "Taurus", speed: 1 },
      moon: { longitude: 200, zodiacSignName: "Libra", speed: 13 },
      mercury: { longitude: 50, zodiacSignName: "Taurus", speed: 1 },
      venus: { longitude: 60, zodiacSignName: "Gemini", speed: 1 },
      mars: { longitude: 130, zodiacSignName: "Leo", speed: 0.5 },
      jupiter: { longitude: 140, zodiacSignName: "Leo", speed: 0.2 },
      saturn: { longitude: 300, zodiacSignName: "Aquarius", speed: 0.1 },
    },
    houses: { ascendant: 240, ascendantSign: "Sagittarius", mc: 150 },
  };
  const oos = vetoOutOfSectMaleficToAscendant(chart, true);
  assert.equal(oos.reject, false);
});

test("day chart vetoes Jupiter applying within 3° conjunction to Mars", () => {
  const chart = {
    planets: {
      sun: { longitude: 200, zodiacSignName: "Libra", speed: 1 },
      moon: { longitude: 200, zodiacSignName: "Libra", speed: 13 },
      mercury: { longitude: 250, zodiacSignName: "Sagittarius", speed: 1 },
      venus: { longitude: 60, zodiacSignName: "Gemini", speed: 1 },
      mars: { longitude: 130, zodiacSignName: "Leo", speed: 0.5 },
      jupiter: { longitude: 127, zodiacSignName: "Leo", speed: 0.8 },
      saturn: { longitude: 300, zodiacSignName: "Aquarius", speed: 0.1 },
    },
    houses: { ascendant: 240, ascendantSign: "Sagittarius", mc: 150 },
  };
  const r = passesElectionalChartFilters(chart);
  assert.equal(r.pass, false);
  assert.match(r.rejectReason, /jupiter applying/i);
});

test("moon applying square to mars within 3° is vetoed", () => {
  const chart = {
    planets: {
      sun: { longitude: 90, zodiacSignName: "Cancer", speed: 1 },
      moon: { longitude: 217, zodiacSignName: "Scorpio", speed: 13 },
      mercury: { longitude: 195, zodiacSignName: "Libra", speed: 1 },
      venus: { longitude: 210, zodiacSignName: "Scorpio", speed: 1 },
      mars: { longitude: 308, zodiacSignName: "Aquarius", speed: 0.5 },
      jupiter: { longitude: 280, zodiacSignName: "Capricorn", speed: 0.2 },
      saturn: { longitude: 50, zodiacSignName: "Taurus", speed: 0.1 },
    },
    houses: { ascendant: 180, ascendantSign: "Libra", mc: 90 },
  };
  const { angularDistance } = require("../electional/chartHelpers");
  const dist = angularDistance(217, 308);
  assert.ok(Math.abs(dist - 90) <= 3, `moon-mars square orb ${Math.abs(dist - 90)}`);
  const r = passesElectionalChartFilters(chart);
  assert.equal(r.pass, false);
  assert.match(r.rejectReason, /moon applying/i);
});
