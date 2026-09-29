/**
 * Tier-based election ranking (Asc ruler + Moon primary, angles/sect, topic).
 */

const config = require("./config");
const { SIGN_RULER, SIGNS } = require("./constants");
const {
  wholeSignHouse,
  getRuler,
  getDignity,
  getPlanet,
  angularHouse,
  succedentHouse,
  cadentHouse,
  isAversion,
  isOvercoming,
  signDistance,
  sectBenefic,
  contrarySectMalefic,
  isUnderBeams,
  isCazimi,
  BENEFICS,
  MALEFICS,
} = require("./chartHelpers");
const {
  wholeSignHardAspect,
  wholeSignSoftAspect,
  hasMutualReception,
} = require("./planetAspects");

const BAD_HOUSES = [6, 8, 12];
const MOON_GOOD_HOUSES = [1, 3, 5, 10, 11];

function clampScore(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function scoreAscRulerTier(chart, ctx) {
  const asc = chart.houses?.ascendant;
  const ascSign = chart.houses?.ascendantSign;
  const sun = getPlanet(chart, "sun");
  if (asc == null || !ascSign || !sun) return { score: 0, reject: true, notes: [] };

  const isDay = ctx.isDay;
  const ascRulerName = getRuler(ascSign);
  const ascRuler = ascRulerName ? getPlanet(chart, ascRulerName) : null;
  const notes = [];
  let score = 50;
  let reject = false;

  if (!ascRuler || !ascRulerName) {
    return { score: 0, reject: true, notes: ["Missing Ascendant ruler"] };
  }

  const h = wholeSignHouse(ascRuler.longitude, asc);
  const dig = getDignity(ascRulerName, ascRuler.zodiacSignName);

  if (dig === "domicile" || dig === "exaltation") {
    score += 18;
    notes.push("Asc ruler dignified");
  } else if (dig === "detriment" || dig === "fall") {
    score -= 18;
    notes.push("Asc ruler debilitated");
  }

  if (BAD_HOUSES.includes(h)) {
    score -= 25;
    reject = true;
    notes.push(`Asc ruler in ${h}th (cadent/hidden)`);
  } else if (angularHouse(h)) {
    score += 16;
    notes.push("Asc ruler angular");
  } else if (succedentHouse(h)) {
    score += 8;
    notes.push("Asc ruler succedent");
  }

  if (isAversion(ascSign, ascRuler.zodiacSignName)) {
    score -= 12;
    notes.push("Asc averse to its ruler");
  }

  if (ascRuler.isRetrograde) {
    score -= 10;
    notes.push("Asc ruler retrograde");
  }

  const sp = config.solarPhase;
  if (
    isUnderBeams(ascRuler.longitude, sun.longitude, sp.underBeamsDeg) &&
    !isCazimi(ascRuler.longitude, sun.longitude, sp.cazimiDeg)
  ) {
    score -= 14;
    notes.push("Asc ruler under beams");
  }

  for (const ben of BENEFICS) {
    const p = getPlanet(chart, ben);
    if (!p) continue;
    const soft = wholeSignSoftAspect(ascRuler.zodiacSignName, p.zodiacSignName);
    const hard = wholeSignHardAspect(ascRuler.zodiacSignName, p.zodiacSignName);
    if (soft || hard === "conjunct") {
      score += soft ? 10 : 12;
      notes.push(`Asc ruler ${soft || "conjunct"} ${ben}`);
      break;
    }
  }

  const contrary = contrarySectMalefic(isDay);
  for (const mal of MALEFICS) {
    const p = getPlanet(chart, mal);
    if (!p) continue;
    const hard = wholeSignHardAspect(ascRuler.zodiacSignName, p.zodiacSignName);
    if (hard) {
      const penalty = mal === contrary ? 22 : 14;
      score -= penalty;
      notes.push(`Asc ruler ${hard} ${mal}`);
      if (mal === contrary) reject = true;
    }
  }

  for (const ben of BENEFICS) {
    const p = getPlanet(chart, ben);
    if (
      p &&
      hasMutualReception(
        ascRulerName,
        ascRuler.zodiacSignName,
        ben,
        p.zodiacSignName,
        SIGN_RULER,
      )
    ) {
      score += 10;
      notes.push(`Mutual reception: Asc ruler & ${ben}`);
      break;
    }
  }

  return { score: clampScore(score), reject, notes };
}

function scoreMoonTier(chart, ctx) {
  const asc = chart.houses?.ascendant;
  const moon = getPlanet(chart, "moon");
  const sun = getPlanet(chart, "sun");
  const motion = ctx.moonMotion || {};
  if (!moon || !sun || asc == null) return { score: 0, reject: true, notes: [] };

  const isDay = ctx.isDay;
  let score = 50;
  const notes = [];
  let reject = false;

  if (motion.hellenisticVoidOfCourse) {
    return { score: 0, reject: true, notes: ["Moon void of course"] };
  }

  const moonHouse = wholeSignHouse(moon.longitude, asc);
  if (BAD_HOUSES.includes(moonHouse)) {
    score -= 20;
    notes.push(`Moon in ${moonHouse}th`);
  } else if (MOON_GOOD_HOUSES.includes(moonHouse)) {
    score += 12;
    notes.push("Moon in supportive house");
  }

  const moonDig = getDignity("moon", moon.zodiacSignName);
  if (moonDig === "domicile" || moonDig === "exaltation") score += 12;
  else if (moonDig === "detriment" || moonDig === "fall") score -= 12;

  const moonRulerName = getRuler(moon.zodiacSignName);
  const moonRuler = moonRulerName ? getPlanet(chart, moonRulerName) : null;
  if (moonRuler) {
    const mrHouse = wholeSignHouse(moonRuler.longitude, asc);
    if (BAD_HOUSES.includes(mrHouse)) {
      score -= 14;
      notes.push("Moon dispositor in 6/8/12");
    } else if (angularHouse(mrHouse) || succedentHouse(mrHouse)) {
      score += 10;
      notes.push("Moon dispositor well placed");
    }
  }

  if (motion.nextApplication) {
    const np = motion.nextApplication.planet;
    if (BENEFICS.has(np)) {
      score += 14;
      notes.push(`Moon applying to ${np}`);
    } else if (MALEFICS.has(np)) {
      score -= 18;
      notes.push(`Moon applying to ${np}`);
      if (np === contrarySectMalefic(isDay)) reject = true;
    }
  }

  for (const mal of ["mars", "saturn"]) {
    const m = getPlanet(chart, mal);
    if (!m) continue;
    const sameSign = m.zodiacSignName === moon.zodiacSignName;
    const sq = signDistance(moon.zodiacSignName, m.zodiacSignName);
    const maltreat =
      sameSign ||
      sq === 3 ||
      sq === 6 ||
      isOvercoming(m.zodiacSignName, moon.zodiacSignName);
    if (maltreat) {
      score -= 12;
      notes.push(`Moon maltreated by ${mal}`);
      break;
    }
  }

  return { score: clampScore(score), reject, notes };
}

function scoreAnglesSectTier(chart, ctx) {
  const asc = chart.houses?.ascendant;
  if (asc == null) return { score: 50, notes: [] };

  const isDay = ctx.isDay;
  const sectBen = sectBenefic(isDay);
  const sectMal = contrarySectMalefic(isDay);
  let score = 50;
  const notes = [];

  for (const ben of BENEFICS) {
    const p = getPlanet(chart, ben);
    if (!p) continue;
    const h = wholeSignHouse(p.longitude, asc);
    if (angularHouse(h)) {
      const bonus = ben === sectBen ? 18 : 10;
      score += bonus;
      notes.push(`${ben} angular (${ben === sectBen ? "sect benefic" : "benefic"})`);
    } else if (succedentHouse(h)) {
      score += ben === sectBen ? 6 : 3;
    }
  }

  for (const mal of MALEFICS) {
    const p = getPlanet(chart, mal);
    if (!p) continue;
    const h = wholeSignHouse(p.longitude, asc);
    if (angularHouse(h)) {
      const penalty = mal === sectMal ? 20 : 12;
      score -= penalty;
      notes.push(`${mal} angular (${mal === sectMal ? "contrary sect" : "malefic"})`);
    } else if (
      cadentHouse(h) &&
      chart.houses?.ascendantSign &&
      isAversion(chart.houses.ascendantSign, p.zodiacSignName)
    ) {
      score += 4;
    }
  }

  return { score: clampScore(score), notes };
}

function scoreTopicTier(chart, ctx, activity) {
  const asc = chart.houses?.ascendant;
  if (asc == null || !activity) return { score: 50, notes: [] };

  let score = 50;
  const notes = [];
  const sun = getPlanet(chart, "sun");
  const isDay = ctx.isDay;

  for (const kp of activity.keyPlanets || ["moon"]) {
    const p = getPlanet(chart, kp);
    if (!p) continue;
    const d = getDignity(kp, p.zodiacSignName);
    if (d === "domicile" || d === "exaltation") score += 8;
    if (d === "detriment" || d === "fall") score -= 8;
    if (kp === sectBenefic(isDay)) score += 6;
    if (kp === contrarySectMalefic(isDay)) score -= 6;
  }

  for (const houseNum of activity.houses || []) {
    const cuspSignIndex = (Math.floor(asc / 30) + houseNum - 1) % 12;
    for (const [name, pl] of Object.entries(chart.planets || {})) {
      if (!pl?.zodiacSignName) continue;
      const idx = SIGNS.indexOf(pl.zodiacSignName);
      if (idx === cuspSignIndex && BENEFICS.has(name)) {
        score += 6;
        notes.push(`Benefic in topic house ${houseNum}`);
      }
    }
  }

  return { score: clampScore(score), notes };
}

function computeElectionRank(chart, ctx, activity) {
  const asc = chart.houses?.ascendant;
  const sun = getPlanet(chart, "sun");
  const isDay =
    ctx.isDay != null
      ? ctx.isDay
      : sun && asc != null
        ? require("./electionSect").isDayChart(asc, sun.longitude)
        : true;

  const rankCtx = { ...ctx, isDay };
  const ascTier = scoreAscRulerTier(chart, rankCtx);
  const moonTier = scoreMoonTier(chart, rankCtx);
  const anglesTier = scoreAnglesSectTier(chart, rankCtx);
  const topicTier = scoreTopicTier(chart, rankCtx, activity);

  const w = config.rankWeights;
  const rankScore = clampScore(
    ascTier.score * w.ascRuler +
      moonTier.score * w.moon +
      anglesTier.score * w.anglesSect +
      topicTier.score * w.topic,
  );

  const rejectSearch =
    ascTier.reject ||
    moonTier.reject ||
    ascTier.score < config.rankGates.minAscRulerScore ||
    moonTier.score < config.rankGates.minMoonScore;

  return {
    rankScore,
    tiers: {
      ascRuler: ascTier,
      moon: moonTier,
      anglesSect: anglesTier,
      topic: topicTier,
    },
    rejectSearch,
  };
}

module.exports = {
  computeElectionRank,
  scoreAscRulerTier,
  scoreMoonTier,
  scoreAnglesSectTier,
  scoreTopicTier,
};
