const test = require("node:test");
const assert = require("node:assert/strict");
const { buildChart } = require("../lib/chartBuilder");
const { calculateLot, computeHermeticLots } = require("../lib/hellenistic/lots");
const { isDayChart } = require("../lib/hellenistic/sect");

test("calculateLot sect reversal at night", () => {
  const asc = 350;
  const moon = 20;
  const sun = 30;
  const day = calculateLot(asc, moon, sun, true);
  const night = calculateLot(asc, moon, sun, false);
  assert.equal(day, calculateLot(asc, sun, moon, false));
  assert.notEqual(day, night);
  assert.equal(day, ((350 + 20 - 30) % 360 + 360) % 360);
});

test("Fortune and Spirit are symmetric around Asc", () => {
  const asc = 100;
  const moon = 200;
  const sun = 50;
  const fortune = calculateLot(asc, moon, sun, true);
  const spirit = calculateLot(asc, sun, moon, true);
  const sum = (fortune + spirit - 2 * asc + 720) % 360;
  assert.equal(sum, 0);
});

test("Kansas City 1984 Hermetic lots include Fortune in Aquarius", () => {
  const chart = buildChart(39.1, -94.583, {
    year: 1984,
    month: 2,
    day: 18,
    hour: 19,
    minute: 54,
    second: 0,
  });
  const { lots, sect } = computeHermeticLots(chart);
  assert.equal(lots.fortune.sign, "Aquarius");
  assert.equal(typeof lots.spirit.longitude, "number");
  assert.equal(typeof lots.eros.longitude, "number");
  assert.equal(typeof lots.necessity.longitude, "number");
  assert.ok(isDayChart(chart.houses.ascendant, chart.planets.sun.longitude));
  assert.equal(sect.chartSect, "day");
});
