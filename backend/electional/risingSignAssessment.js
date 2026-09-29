/**
 * Timeless katarchic rising-sign rules evaluated from each election chart.
 * Planet signs and houses are derived at the moment under review (not hard-coded by month).
 */

const { SIGN_RULER } = require("./constants");
const { isDayChart } = require("./electionSect");
const {
  wholeSignHouse,
  getPlanet,
  getRuler,
  signDistance,
} = require("./chartHelpers");

const REJECT_WEIGHT = -55;
const ANGULAR_HOUSES = [1, 4, 7, 10];

/** Whole-sign conjunction, square, or opposition (Hellenistic sign-based aspect). */
function wholeSignHardAspect(signA, signB) {
  if (!signA || !signB) return null;
  const d = signDistance(signA, signB);
  if (d === 0) return "conjunct";
  if (d === 3) return "square";
  if (d === 6) return "opposition";
  return null;
}

function buildChartContext(chart) {
  const asc = chart.houses?.ascendant;
  const ascSign = chart.houses?.ascendantSign;
  const sun = getPlanet(chart, "sun");
  if (asc == null || !ascSign || !sun) return null;

  const isDay = isDayChart(asc, sun.longitude);
  const houseOf = (planetName) => {
    const p = getPlanet(chart, planetName);
    if (!p) return null;
    return wholeSignHouse(p.longitude, asc);
  };
  const signOf = (planetName) => {
    const p = getPlanet(chart, planetName);
    return p?.zodiacSignName || null;
  };

  const ascRulerName = getRuler(ascSign) || SIGN_RULER[ascSign];
  const ascRulerSign = ascRulerName ? signOf(ascRulerName) : null;

  return {
    ascSign,
    isDay,
    houseOf,
    signOf,
    ascRulerName,
    ascRulerSign,
  };
}

/**
 * @returns {Array<{ id: string, label: string, explanation: string }>}
 */
function collectRisingSignViolations(ctx) {
  const violations = [];
  if (!ctx) return violations;

  const { isDay, houseOf, signOf, ascSign, ascRulerName, ascRulerSign } = ctx;
  const saturnHouse = houseOf("saturn");
  const marsSign = signOf("mars");
  const saturnSign = signOf("saturn");

  if (!isDay && saturnHouse != null && ANGULAR_HOUSES.includes(saturnHouse)) {
    violations.push({
      id: "saturn-angular-night",
      label: "Saturn on an angle at night",
      explanation: `Saturn is in the ${saturnHouse}${ordinalSuffix(saturnHouse)} whole-sign house in a night chart (avoid Saturn in 1st, 4th, 7th, or 10th at night).`,
    });
  }

  if (ascRulerName && ascRulerSign) {
    if (!isDay && saturnSign) {
      const aspect = wholeSignHardAspect(ascRulerSign, saturnSign);
      if (aspect) {
        violations.push({
          id: `asc-ruler-${aspect}-saturn-night`,
          label: `Ascendant ruler ${aspect} Saturn at night`,
          explanation: `${capitalize(ascRulerName)} (ruler of ${ascSign} rising) is in whole-sign ${aspect} to Saturn.`,
        });
      }
    }
    if (isDay && marsSign) {
      const aspect = wholeSignHardAspect(ascRulerSign, marsSign);
      if (aspect) {
        violations.push({
          id: `asc-ruler-${aspect}-mars-day`,
          label: `Ascendant ruler ${aspect} Mars by day`,
          explanation: `${capitalize(ascRulerName)} (ruler of ${ascSign} rising) is in whole-sign ${aspect} to Mars.`,
        });
      }
    }
  }

  if (isDay && ascRulerName === "mars") {
    violations.push({
      id: "mars-rules-asc-day",
      label: "Mars rules the Ascendant in a day chart",
      explanation: `${ascSign} rising is ruled by Mars; avoid Mars as oikodespotes in a day chart.`,
    });
  }

  if (!isDay && ascRulerName === "saturn") {
    violations.push({
      id: "saturn-rules-asc-night",
      label: "Saturn rules the Ascendant in a night chart",
      explanation: `${ascSign} rising is ruled by Saturn; avoid Saturn as oikodespotes in a night chart.`,
    });
  }

  return violations;
}

function ordinalSuffix(h) {
  if (h === 1) return "st";
  if (h === 2) return "nd";
  if (h === 3) return "rd";
  return "th";
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/**
 * Assess whether the chart's rising sign is acceptable at this moment.
 * @param {object} chart
 * @returns {object|null}
 */
function assessRisingSign(chart) {
  const ctx = buildChartContext(chart);
  if (!ctx) return null;

  const violations = collectRisingSignViolations(ctx);
  const reject = violations.length > 0;
  const primary = violations[0];

  return {
    ascendantSign: ctx.ascSign,
    isDayChart: ctx.isDay,
    reject,
    tier: reject ? "reject" : "ok",
    weight: reject ? REJECT_WEIGHT : 0,
    summary: reject
      ? primary.explanation
      : "Rising sign passes standard katarchic placement rules.",
    violations,
  };
}

/** Short copy for UI — not month-specific. */
const RISING_SIGN_RULES_BLURB =
  "Rising signs must pass katarchic rules: no Saturn on an angle (1/4/7/10) at night; no Asc ruler conjunct, square, or opposite Saturn at night (or Mars by day); no Mars-ruled Asc by day or Saturn-ruled Asc at night.";

module.exports = {
  assessRisingSign,
  buildChartContext,
  collectRisingSignViolations,
  wholeSignHardAspect,
  RISING_SIGN_RULES_BLURB,
  ANGULAR_HOUSES,
};
