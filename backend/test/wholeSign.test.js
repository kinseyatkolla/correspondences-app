const test = require("node:test");
const assert = require("node:assert/strict");
const astrologyRouter = require("../routes/astrology");
const sweph = require("sweph");

test("chart endpoints default to Whole Sign houses", () => {
  assert.equal(astrologyRouter.DEFAULT_HOUSE_SYSTEM, "W");
  assert.equal(astrologyRouter.resolveHouseSystem(), "W");
  assert.equal(astrologyRouter.resolveHouseSystem(""), "W");
});

test("an explicit supported house system remains available for compatibility", () => {
  assert.equal(astrologyRouter.resolveHouseSystem("P"), "P");
});

test("Swiss Ephemeris returns twelve Whole Sign cusps", () => {
  const julianDay = sweph.julday(2026, 7, 25, 12, 1);
  const houses = sweph.houses(julianDay, 40.7128, -74.006, "W");
  const cusps = houses?.data?.houses ?? houses?.houses ?? houses?.data?.cusps ?? houses?.cusps;
  assert.equal(Array.isArray(cusps), true);
  assert.equal(cusps.length, 12);
  for (let index = 1; index < cusps.length; index += 1) {
    const separation = ((cusps[index] - cusps[index - 1]) + 360) % 360;
    assert.ok(Math.abs(separation - 30) < 0.0001);
  }
});
