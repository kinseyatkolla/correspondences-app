const test = require("node:test");
const assert = require("node:assert/strict");
const {
  harmonizeAspectEventForDisplay,
  slownessRank,
} = require("../lib/aspectDisplayDegrees");

function aspectEvent(overrides) {
  return {
    type: "aspect",
    planet1: "mars",
    planet2: "saturn",
    aspectName: "conjunct",
    planet1Position: {
      eclipticLongitude: 29.59,
      degree: 29.59,
      degreeFormatted: "29°35'24\"",
      zodiacSignName: "Aries",
    },
    planet2Position: {
      eclipticLongitude: 30.01,
      degree: 0.01,
      degreeFormatted: "0°0'36\"",
      zodiacSignName: "Taurus",
    },
    ...overrides,
  };
}

test("cusp conjunction uses slower planet sign and degree on both rows", () => {
  assert.ok(slownessRank("saturn") > slownessRank("mars"));
  const out = harmonizeAspectEventForDisplay(aspectEvent());
  assert.equal(out.planet1Position.zodiacSignName, "Taurus");
  assert.equal(out.planet2Position.zodiacSignName, "Taurus");
  assert.equal(out.planet1Position.degreeFormatted, "0°");
  assert.equal(out.planet2Position.degreeFormatted, "0°");
});

test("same-sign conjunction harmonizes to one rounded degree", () => {
  const out = harmonizeAspectEventForDisplay(
    aspectEvent({
      planet1: "venus",
      planet2: "mars",
      planet1Position: {
        eclipticLongitude: 75.4,
        degree: 15.4,
        degreeFormatted: "15°24'0\"",
        zodiacSignName: "Gemini",
      },
      planet2Position: {
        eclipticLongitude: 75.3,
        degree: 15.3,
        degreeFormatted: "15°18'0\"",
        zodiacSignName: "Gemini",
      },
    }),
  );
  assert.equal(out.planet1Position.degreeFormatted, "15°");
  assert.equal(out.planet2Position.degreeFormatted, "15°");
  assert.equal(out.planet1Position.zodiacSignName, "Gemini");
  assert.equal(out.planet2Position.zodiacSignName, "Gemini");
});

test("square keeps separate signs with shared degree number", () => {
  const out = harmonizeAspectEventForDisplay(
    aspectEvent({
      aspectName: "square",
      planet1: "sun",
      planet2: "moon",
      planet1Position: {
        eclipticLongitude: 75.48,
        degree: 15.48,
        degreeFormatted: "15°28'48\"",
        zodiacSignName: "Gemini",
      },
      planet2Position: {
        eclipticLongitude: 165.52,
        degree: 15.52,
        degreeFormatted: "15°31'12\"",
        zodiacSignName: "Virgo",
      },
    }),
  );
  assert.equal(out.planet1Position.degreeFormatted, "16°");
  assert.equal(out.planet2Position.degreeFormatted, "16°");
  assert.equal(out.planet1Position.zodiacSignName, "Gemini");
  assert.equal(out.planet2Position.zodiacSignName, "Virgo");
});
