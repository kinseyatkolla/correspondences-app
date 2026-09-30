const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { buildChart } = require("../lib/chartBuilder");
const { computeHermeticLots } = require("../lib/hellenistic/lots");
const {
  generateChildPeriods,
  generateLevel1Periods,
  getActivePeriods,
} = require("../lib/hellenistic/zodiacalReleasing");
const { birthMsFromBody } = require("../lib/natalChartFromBody");

const fixture = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "fixtures/kansasCity1984.zr.fixture.json"),
    "utf8",
  ),
);

function formatLocal(ms, timeZone) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(ms));
}

function chartAndContext() {
  const b = fixture.birthUtc;
  const birthMs = birthMsFromBody(b);
  const chart = buildChart(b.latitude, b.longitude, b);
  const { lots } = computeHermeticLots(chart);
  const fortune = lots.fortune;
  return { birthMs, fortune, lots };
}

test("L1 Aquarius boundary matches reference", () => {
  const { birthMs, fortune } = chartAndContext();
  const tz = fixture.displayTimeZone;
  const l1 = generateLevel1Periods({
    birthMs,
    releasingSign: fortune.sign,
    maxEndMs: birthMs + 50 * 360 * 86400000,
    fortuneSign: fortune.sign,
  });
  assert.equal(l1[0].sign, "Aquarius");
  assert.equal(formatLocal(l1[0].startMs, tz), fixture.l1Boundaries[0].start);
  assert.equal(formatLocal(l1[0].endMs, tz), fixture.l1Boundaries[0].end);
  assert.equal(formatLocal(l1[1].startMs, tz), fixture.l1Boundaries[1].start);
});

test("L2 loosing of the bond Leo 2001-06-18", () => {
  const { birthMs, fortune } = chartAndContext();
  const tz = fixture.displayTimeZone;
  const l1 = generateLevel1Periods({
    birthMs,
    releasingSign: fortune.sign,
    maxEndMs: birthMs + 50 * 360 * 86400000,
    fortuneSign: fortune.sign,
  });
  const l2 = generateChildPeriods({
    parentStartMs: l1[0].startMs,
    parentEndMs: l1[0].endMs,
    parentSign: l1[0].sign,
    childLevel: 2,
    fortuneSign: fortune.sign,
    releasingLotSign: fortune.sign,
  });
  const lb = l2.find((p) => p.isLoosingOfBond && p.sign === "Leo");
  assert.ok(lb);
  assert.equal(formatLocal(lb.startMs, tz), "06/18/2001");
});

test("L3 under first Aquarius L2 matches golden starts", () => {
  const { birthMs, fortune } = chartAndContext();
  const tz = fixture.displayTimeZone;
  const l1 = generateLevel1Periods({
    birthMs,
    releasingSign: fortune.sign,
    maxEndMs: birthMs + 50 * 360 * 86400000,
    fortuneSign: fortune.sign,
  });
  const l2 = generateChildPeriods({
    parentStartMs: l1[0].startMs,
    parentEndMs: l1[0].endMs,
    parentSign: l1[0].sign,
    childLevel: 2,
    fortuneSign: fortune.sign,
    releasingLotSign: fortune.sign,
  });
  const l2Aqu = l2[0];
  const l3 = generateChildPeriods({
    parentStartMs: l2Aqu.startMs,
    parentEndMs: l2Aqu.endMs,
    parentSign: l2Aqu.sign,
    childLevel: 3,
    fortuneSign: fortune.sign,
    releasingLotSign: fortune.sign,
  });

  for (const expected of fixture.l3UnderFirstL2Aqu) {
    const match = l3.find(
      (p) =>
        p.sign === expected.sign &&
        formatLocal(p.startMs, tz) === expected.start,
    );
    assert.ok(match, `Missing L3 ${expected.sign} @ ${expected.start}`);
    if (expected.isLoosingOfBond) assert.equal(match.isLoosingOfBond, true);
    if (expected.isPreLoosingOfBond) assert.equal(match.isPreLoosingOfBond, true);
    if (expected.isCulminatingFromFortune) {
      assert.equal(match.isCulminatingFromFortune, true);
    }
  }
});

test("getActivePeriods returns four levels at a sample date", () => {
  const { birthMs, fortune } = chartAndContext();
  const atMs = Date.UTC(1990, 5, 15, 12, 0, 0);
  const active = getActivePeriods({
    birthMs,
    releasingLotSign: fortune.sign,
    fortuneSign: fortune.sign,
    atMs,
  });
  assert.ok(active.l1);
  assert.ok(active.l2);
  assert.ok(active.l3);
  assert.ok(active.l4);
});

test("L2 truncation ends last sub-period within parent", () => {
  const { birthMs, fortune } = chartAndContext();
  const l1 = generateLevel1Periods({
    birthMs,
    releasingSign: fortune.sign,
    maxEndMs: birthMs + 50 * 360 * 86400000,
    fortuneSign: fortune.sign,
  });
  const l2 = generateChildPeriods({
    parentStartMs: l1[0].startMs,
    parentEndMs: l1[0].endMs,
    parentSign: l1[0].sign,
    childLevel: 2,
    fortuneSign: fortune.sign,
    releasingLotSign: fortune.sign,
  });
  const last = l2[l2.length - 1];
  assert.equal(last.endMs, l1[0].endMs);
  assert.equal(last.truncated, true);
});

test("Eros L2 Culm. matches reference (10th from active L1)", () => {
  const { birthMs, lots } = chartAndContext();
  const tz = fixture.displayTimeZone;
  const fortuneSign = lots.fortune.sign;
  const erosSign = lots.eros.sign;
  assert.equal(erosSign, "Leo");

  const l1 = generateLevel1Periods({
    birthMs,
    releasingSign: erosSign,
    maxEndMs: birthMs + 150 * 360 * 86400000,
    fortuneSign,
  });

  const culmRows = [
    { l1: "Leo", l2: "Taurus", start: "02/09/1997" },
    { l1: "Virgo", l2: "Gemini", start: "12/07/2014" },
    { l1: "Scorpio", l2: "Leo", start: "12/05/2043" },
    { l1: "Capricorn", l2: "Libra", start: "07/11/2071" },
    { l1: "Capricorn", l2: "Libra", start: "08/28/2079" },
    { l1: "Aquarius", l2: "Scorpio", start: "07/29/2096" },
    { l1: "Aquarius", l2: "Scorpio", start: "11/15/2104" },
  ];

  for (const row of culmRows) {
    const l1p = l1.find((p) => p.sign === row.l1);
    assert.ok(l1p, row.l1);
    const l2 = generateChildPeriods({
      parentStartMs: l1p.startMs,
      parentEndMs: l1p.endMs,
      parentSign: l1p.sign,
      childLevel: 2,
      fortuneSign,
      releasingLotSign: erosSign,
    });
    const match = l2.find(
      (p) =>
        p.sign === row.l2 && formatLocal(p.startMs, tz) === row.start,
    );
    assert.ok(match, `${row.l1} ${row.l2} ${row.start}`);
    assert.equal(match.isCulminatingFromFortune, true);
  }
});
