const { normalizeLon, signFromLon, wholeSignHouse, getRuler } = require("../../electional/chartHelpers");
const { getSectInfo } = require("./sect");

/**
 * @param {number} asc
 * @param {number} a
 * @param {number} b
 * @param {boolean} isDayChart
 * @param {boolean} [reverseAtNight=true]
 */
function calculateLot(asc, a, b, isDayChart, reverseAtNight = true) {
  let A = Number(a);
  let B = Number(b);
  if (reverseAtNight && !isDayChart) {
    [A, B] = [B, A];
  }
  return normalizeLon(Number(asc) + A - B);
}

function degreeWithinSign(lon) {
  return normalizeLon(lon) % 30;
}

function formatFormula(dayFormula, isDayChart) {
  if (isDayChart) return dayFormula;
  const m = dayFormula.match(/^ASC \+ (.+) − (.+)$/);
  if (m) return `ASC + ${m[2]} − ${m[1]}`;
  return `${dayFormula} (night: operands reversed)`;
}

/** Resolve operand: planet name, "Spirit", "Fortune", or numeric longitude. */
function resolveOperand(name, ctx) {
  if (typeof name === "number") return name;
  const key = String(name).toLowerCase();
  if (key === "asc") return ctx.asc;
  if (key === "spirit") return ctx.spiritLon;
  if (key === "fortune") return ctx.fortuneLon;
  const planet = ctx.planets[key];
  if (planet?.longitude != null) return planet.longitude;
  throw new Error(`Unknown lot operand: ${name}`);
}

/**
 * Paulus Hermetic lots + optional named variants.
 * variants: { id, source, dayA, dayB } — same shape as dayFormula operands
 */
const LOT_DEFINITIONS = [
  {
    id: "fortune",
    name: "Lot of Fortune",
    dayFormula: "ASC + Moon − Sun",
    dayA: "moon",
    dayB: "sun",
    variants: [],
  },
  {
    id: "spirit",
    name: "Lot of Spirit",
    dayFormula: "ASC + Sun − Moon",
    dayA: "sun",
    dayB: "moon",
    variants: [],
  },
  {
    id: "eros",
    name: "Lot of Eros",
    dayFormula: "ASC + Venus − Spirit",
    dayA: "venus",
    dayB: "Spirit",
    dependsOn: ["spirit"],
    variants: [
      {
        id: "valens",
        source: "Vettius Valens",
        dayA: "venus",
        dayB: "fortune",
        dayFormula: "ASC + Venus − Fortune",
      },
    ],
  },
  {
    id: "necessity",
    name: "Lot of Necessity",
    dayFormula: "ASC + Fortune − Mercury",
    dayA: "fortune",
    dayB: "mercury",
    dependsOn: ["fortune"],
    variants: [
      {
        id: "valens",
        source: "Vettius Valens",
        dayA: "fortune",
        dayB: "mercury",
        dayFormula: "ASC + Mercury − Fortune",
      },
    ],
  },
  {
    id: "courage",
    name: "Lot of Courage",
    dayFormula: "ASC + Fortune − Mars",
    dayA: "fortune",
    dayB: "mars",
    dependsOn: ["fortune"],
    variants: [],
  },
  {
    id: "victory",
    name: "Lot of Victory",
    dayFormula: "ASC + Jupiter − Spirit",
    dayA: "jupiter",
    dayB: "Spirit",
    dependsOn: ["spirit"],
    variants: [],
  },
  {
    id: "nemesis",
    name: "Lot of Nemesis",
    dayFormula: "ASC + Fortune − Saturn",
    dayA: "fortune",
    dayB: "saturn",
    dependsOn: ["fortune"],
    variants: [],
  },
];

function enrichLot(lon, formulaUsed, isDayChart) {
  const sign = signFromLon(lon);
  return {
    longitude: lon,
    sign,
    degreeWithinSign: degreeWithinSign(lon),
    formulaUsed,
    isDayChart,
  };
}

/**
 * @param {object} chart — buildChart output (planets, houses)
 * @param {object} [options]
 * @param {string} [options.variantByLotId]
 */
function computeHermeticLots(chart, options = {}) {
  const asc = chart.houses?.ascendant;
  const sunLon = chart.planets?.sun?.longitude;
  const moonLon = chart.planets?.moon?.longitude;
  if (asc == null || sunLon == null || moonLon == null) {
    throw new Error("Chart missing ascendant or luminaries");
  }

  const sect = getSectInfo(asc, sunLon);
  const ctx = {
    asc,
    planets: chart.planets,
    spiritLon: null,
    fortuneLon: null,
  };

  const results = {};
  const variantPick = options.variantByLotId || {};

  for (const def of LOT_DEFINITIONS) {
    if (def.dependsOn?.includes("spirit") && ctx.spiritLon == null) {
      const a = resolveOperand("sun", ctx);
      const b = resolveOperand("moon", ctx);
      ctx.spiritLon = calculateLot(asc, a, b, sect.isDayChart);
    }
    if (def.dependsOn?.includes("fortune") && ctx.fortuneLon == null) {
      const a = resolveOperand("moon", ctx);
      const b = resolveOperand("sun", ctx);
      ctx.fortuneLon = calculateLot(asc, a, b, sect.isDayChart);
    }

    const variantId = variantPick[def.id];
    const variant =
      variantId && def.variants?.find((v) => v.id === variantId) || null;
    const dayA = variant ? variant.dayA : def.dayA;
    const dayB = variant ? variant.dayB : def.dayB;
    const dayFormula = variant ? variant.dayFormula : def.dayFormula;

    const aLon = resolveOperand(dayA, ctx);
    const bLon = resolveOperand(dayB, ctx);
    const lon = calculateLot(asc, aLon, bLon, sect.isDayChart);

    if (def.id === "fortune") ctx.fortuneLon = lon;
    if (def.id === "spirit") ctx.spiritLon = lon;

    const base = enrichLot(lon, formatFormula(dayFormula, sect.isDayChart), sect.isDayChart);
    const house = wholeSignHouse(lon, asc);
    results[def.id] = {
      ...base,
      id: def.id,
      name: def.name,
      wholeSignHouse: house,
      signRuler: getRuler(base.sign),
      variantId: variant?.id ?? null,
      variantSource: variant?.source ?? null,
    };
  }

  return { lots: results, sect };
}

function getLotById(lotsResult, lotId) {
  const lot = lotsResult.lots[lotId];
  if (!lot) throw new Error(`Unknown lot: ${lotId}`);
  return lot;
}

module.exports = {
  calculateLot,
  LOT_DEFINITIONS,
  computeHermeticLots,
  getLotById,
  degreeWithinSign,
};
