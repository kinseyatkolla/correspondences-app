const config = require("./config");
const { isDayChart } = require("./electionSect");
const { assessRisingSign } = require("./risingSignAssessment");
const { HOUSE_TOPICS, houseOrdinal: houseTopicOrdinal } = require("./houseTopics");
const { computeElectionRank } = require("./electionRank");
const { scoreNatalTiebreak } = require("./natalTiebreak");
const {
  MOVABLE_SIGNS,
  FIXED_SIGNS,
  DOUBLE_SIGNS,
  TRADITIONAL_PLANETS,
  ASPECT_ANGLES,
} = require("./constants");
const {
  wholeSignHouse,
  getRuler,
  getDignity,
  angularHouse,
  succedentHouse,
  cadentHouse,
  isUnderBeams,
  isCombust,
  isCazimi,
  isWaxing,
  isNewMoonDay,
  isAversion,
  isOvercoming,
  getPlanet,
  signFromLon,
  sectBenefic,
  contrarySectMalefic,
  angularDistance,
  southNodeLon,
  signDistance,
  BENEFICS,
  MALEFICS,
} = require("./chartHelpers");

function houseOrdinal(h) {
  if (h === 1) return "1st";
  if (h === 2) return "2nd";
  if (h === 3) return "3rd";
  return `${h}th`;
}

function pushFactor(factors, factor) {
  factors.push({
    id: factor.id,
    label: factor.label,
    weight: factor.weight,
    effect: factor.effect,
    explanation: factor.explanation,
    source: factor.source || "Hellenistic electional",
  });
}

function gradeFromScore(score, capGrade) {
  const grades = config.grades;
  let label = "Avoid";
  for (const g of grades) {
    if (score >= g.min) {
      label = g.label;
      break;
    }
  }
  if (capGrade) {
    const capIdx = grades.findIndex((g) => g.label === capGrade);
    const curIdx = grades.findIndex((g) => g.label === label);
    if (capIdx >= 0 && curIdx >= 0 && curIdx > capIdx) {
      label = capGrade;
    }
  }
  return label;
}

function scoreActivityFit(evaluationInputs, activity) {
  let bonus = 0;
  const reasons = [];
  const { waxing, ascSign, moonSign, moonApplyPlanet } = evaluationInputs;

  if (activity.preferWaxing === true && waxing) {
    bonus += 5;
    reasons.push("waxing Moon");
  } else if (activity.preferWaxing === false && !waxing) {
    bonus += 5;
    reasons.push("waning Moon");
  } else if (activity.preferWaxing === true && !waxing) {
    bonus -= 5;
  } else if (activity.preferWaxing === false && waxing) {
    bonus -= 5;
  }

  if (activity.signModality === "movable") {
    if (MOVABLE_SIGNS.has(ascSign) || MOVABLE_SIGNS.has(moonSign)) bonus += 3;
  }
  if (activity.signModality === "fixed") {
    if (FIXED_SIGNS.has(ascSign) || FIXED_SIGNS.has(moonSign)) bonus += 3;
  }

  if (activity.moonApplyTo && moonApplyPlanet) {
    if (activity.moonApplyTo.includes(moonApplyPlanet)) {
      bonus += 8;
      reasons.push(`Moon applying to ${moonApplyPlanet}`);
    }
  }

  return { bonus, reasons };
}

/**
 * @param {object} chart - { planets, houses }
 * @param {object} ctx - motion, eclipses, planetary hour, natal, activityId, natalRooting
 */
function evaluateElection(chart, ctx = {}) {
  const activityId = ctx.activityId || config.defaultActivityId;
  const activity =
    config.activities[activityId] || config.activities[config.defaultActivityId];

  const factors = [];
  const warnings = [];
  let score = 50;
  let veto = null;

  const asc = chart.houses?.ascendant;
  const ascSign = chart.houses?.ascendantSign || signFromLon(asc);
  const moon = getPlanet(chart, "moon");
  const sun = getPlanet(chart, "sun");
  if (!moon || !sun || asc === undefined) {
    return {
      score: 0,
      grade: "Avoid",
      veto: { id: "missing-data", label: "Incomplete chart data" },
      factors: [],
      suitableFor: [],
      unsuitableFor: [],
      warnings: ["Chart missing Moon, Sun, or Ascendant."],
      activityId,
      moonApplication: null,
      conditionChanges: [],
    };
  }

  const isDay = isDayChart(asc, sun.longitude);
  const waxing = isWaxing(moon.longitude, sun.longitude);
  const sp = config.solarPhase;

  const motion = ctx.moonMotion || {};
  if (motion.hellenisticVoidOfCourse) {
    pushFactor(factors, {
      id: "moon-voc-hellenistic",
      label: "Moon void of course (Hellenistic)",
      weight: config.weights.moonHellVoc,
      effect: "negative",
      explanation:
        "The Moon will not perfect a major aspect with the Sun or any visible planet within the next 30° of her motion (kenodromia).",
      source: "Dorotheus V / Hephaistio",
    });
    score += config.weights.moonHellVoc;
    if (config.vetoes.hellenisticVoidOfCourse.enabled) {
      veto = {
        id: "moon-voc-hellenistic",
        label: "Moon void of course (Hellenistic definition)",
      };
    }
  }

  if (motion.modernVoidOfCourse) {
    pushFactor(factors, {
      id: "moon-voc-modern",
      label: "Moon void (modern, sign-based)",
      weight: 0,
      effect: "info",
      explanation:
        "Modern definition: the Moon makes no further major aspects in her current sign before ingress. Shown for comparison only.",
      source: "Modern traditional",
    });
  }

  if (
    isUnderBeams(moon.longitude, sun.longitude, sp.underBeamsDeg) &&
    !isCazimi(moon.longitude, sun.longitude, sp.cazimiDeg)
  ) {
    const combust = isCombust(moon.longitude, sun.longitude, sp.combustDeg);
    pushFactor(factors, {
      id: combust ? "moon-combust" : "moon-under-beams",
      label: combust ? "Moon combust" : "Moon under the Sun's beams",
      weight: combust ? config.weights.moonCombust : config.weights.moonUnderBeams,
      effect: "negative",
      explanation: combust
        ? "Moon within about 8.5° of the Sun — severely weakened for electional work."
        : "Moon within 15° of the Sun — hidden and unreliable as significator.",
      source: "Hellenistic solar phase",
    });
    score += combust ? config.weights.moonCombust : config.weights.moonUnderBeams;
    if (combust && config.vetoes.moonCombust.enabled) {
      veto = { id: "moon-combust", label: "Moon combust" };
    }
  }

  if (isNewMoonDay(moon.longitude, sun.longitude)) {
    pushFactor(factors, {
      id: "moon-new-moon",
      label: "New Moon day",
      weight: config.weights.moonNewMoonDay,
      effect: "negative",
      explanation: "The syzygy itself is traditionally poor for beginnings.",
      source: "Dorotheus V",
    });
    score += config.weights.moonNewMoonDay;
  }

  if (ctx.inEclipseWindow) {
    pushFactor(factors, {
      id: "moon-eclipse-window",
      label: "Near eclipse",
      weight: config.weights.moonEclipseWindow,
      effect: "negative",
      explanation: `Within ${config.eclipseWindowDays} days of a solar or lunar eclipse.`,
      source: "Katarchic caution",
    });
    score += config.weights.moonEclipseWindow;
    if (config.vetoes.moonEclipseWindow.enabled) {
      veto = { id: "moon-eclipse-window", label: "Moon in eclipse window" };
    }
  }

  const nn = getPlanet(chart, "northNode");
  if (nn) {
    const nodeDist = Math.min(
      angularDistance(moon.longitude, nn.longitude),
      angularDistance(moon.longitude, southNodeLon(nn.longitude)),
    );
    if (nodeDist <= config.moon.nodeProximityDeg) {
      pushFactor(factors, {
        id: "moon-near-node",
        label: "Moon near lunar node",
        weight: config.weights.moonNearNode,
        effect: "negative",
        explanation: "Moon within about 12° of the nodes — unstable, eclipse-related symbolism.",
        source: "Traditional",
      });
      score += config.weights.moonNearNode;
    }
  }

  const wantWaxing = activity.preferWaxing;
  if (wantWaxing === true && waxing) {
    pushFactor(factors, {
      id: "moon-phase-waxing",
      label: "Waxing Moon",
      weight: config.weights.moonPhaseMatch,
      effect: "positive",
      explanation: "Increasing light supports growth and visibility for this activity.",
      source: "Dorotheus V",
    });
    score += config.weights.moonPhaseMatch;
  } else if (wantWaxing === false && !waxing) {
    pushFactor(factors, {
      id: "moon-phase-waning",
      label: "Waning Moon",
      weight: config.weights.moonPhaseMatch,
      effect: "positive",
      explanation: "Decreasing light supports endings and release for this activity.",
      source: "Dorotheus V",
    });
    score += config.weights.moonPhaseMatch;
  } else if (wantWaxing === true && !waxing) {
    score += config.weights.moonPhaseMismatch;
  } else if (wantWaxing === false && waxing) {
    score += config.weights.moonPhaseMismatch;
  }

  if (moon.speed > config.moon.meanSpeedDegPerDay) {
    pushFactor(factors, {
      id: "moon-fast",
      label: "Swift Moon",
      weight: config.weights.moonFast,
      effect: "positive",
      explanation: "Moon faster than mean motion — quicker unfolding of the matter.",
      source: "Traditional",
    });
    score += config.weights.moonFast;
  } else if (moon.speed < config.moon.meanSpeedDegPerDay * 0.85) {
    pushFactor(factors, {
      id: "moon-slow",
      label: "Slow Moon",
      weight: config.weights.moonSlow,
      effect: "negative",
      explanation: "Moon slower than usual — delays and sluggish outcomes.",
      source: "Traditional",
    });
    score += config.weights.moonSlow;
  }

  const moonDig = getDignity("moon", moon.zodiacSignName);
  if (moonDig === "domicile" || moonDig === "exaltation") {
    pushFactor(factors, {
      id: "moon-dignity",
      label: "Moon dignified",
      weight: config.weights.moonDignityDomExalt,
      effect: "positive",
      explanation: `Moon in ${moon.zodiacSignName} (${moonDig}).`,
      source: "Essential dignity",
    });
    score += config.weights.moonDignityDomExalt;
  } else if (moonDig === "detriment" || moonDig === "fall") {
    pushFactor(factors, {
      id: "moon-debility",
      label: "Moon debilitated",
      weight: config.weights.moonDignityDetFall,
      effect: "negative",
      explanation: `Moon in ${moon.zodiacSignName} (${moonDig}).`,
      source: "Essential dignity",
    });
    score += config.weights.moonDignityDetFall;
  }

  let moonApplication = null;
  if (motion.nextApplication) {
    moonApplication = motion.nextApplication;
    const np = motion.nextApplication.planet;
    const asp = motion.nextApplication.aspect;
    const isBen = BENEFICS.has(np);
    const isMal = MALEFICS.has(np);
    if (isBen) {
      pushFactor(factors, {
        id: "moon-apply-benefic",
        label: `Moon applying ${asp} ${np}`,
        weight: config.weights.moonApplyBenefic,
        effect: "positive",
        explanation: "Next lunar perfection with a benefic supports a favorable outcome.",
        source: "Dorotheus V",
      });
      score += config.weights.moonApplyBenefic;
    } else if (isMal) {
      let w = config.weights.moonApplyMalefic;
      if (np === contrarySectMalefic(isDay)) w += config.weights.moonApplyMaleficContrarySect;
      pushFactor(factors, {
        id: "moon-apply-malefic",
        label: `Moon applying ${asp} ${np}`,
        weight: w,
        effect: "negative",
        explanation: "Next lunar perfection with a malefic tends toward difficulty or harm.",
        source: "Dorotheus V",
      });
      score += w;
    }
  }

  if (motion.lastSeparation) {
    pushFactor(factors, {
      id: "moon-separation",
      label: `Moon separating from ${motion.lastSeparation.planet}`,
      weight: 0,
      effect: "info",
      explanation: `Recent perfection with ${motion.lastSeparation.planet} (${motion.lastSeparation.aspect}) describes what is left behind.`,
      source: "Dorotheus V",
    });
  }

  for (const mal of ["mars", "saturn"]) {
    const m = getPlanet(chart, mal);
    if (!m) continue;
    const sameSign = m.zodiacSignName === moon.zodiacSignName;
    const sq = signDistance(moon.zodiacSignName, m.zodiacSignName);
    const maltreat =
      sameSign || sq === 3 || sq === 6 || isOvercoming(m.zodiacSignName, moon.zodiacSignName);
    if (maltreat) {
      pushFactor(factors, {
        id: `moon-maltreat-${mal}`,
        label: `Moon maltreated by ${mal}`,
        weight: config.weights.moonMaltreatment,
        effect: "negative",
        explanation: `Co-presence, hard aspect, or overcoming from ${mal}.`,
        source: "Antiochus / Rhetorius",
      });
      score += config.weights.moonMaltreatment;
      break;
    }
  }

  const ascRulerName = getRuler(ascSign);
  const ascRuler = ascRulerName ? getPlanet(chart, ascRulerName) : null;
  if (ascRuler && ascRulerName) {
    const h = wholeSignHouse(ascRuler.longitude, asc);
    if ([6, 8, 12].includes(h)) {
      pushFactor(factors, {
        id: "asc-ruler-bad-house",
        label: "Ascendant ruler in 6th, 8th, or 12th",
        weight: config.weights.ascRulerBadHouse,
        effect: "negative",
        explanation: "The initiator’s significator is cadent and hidden.",
        source: "Dorotheus V",
      });
      score += config.weights.ascRulerBadHouse;
    } else if (angularHouse(h) || succedentHouse(h)) {
      pushFactor(factors, {
        id: "asc-ruler-well-placed",
        label: "Ascendant ruler well placed",
        weight: config.weights.ascRulerWellPlaced,
        effect: "positive",
        explanation: `Ruler of the Ascendant in the ${houseOrdinal(h)} whole-sign house.`,
        source: "Dorotheus V",
      });
      score += config.weights.ascRulerWellPlaced;
    }
    if (
      isUnderBeams(ascRuler.longitude, sun.longitude, sp.underBeamsDeg) &&
      !isCazimi(ascRuler.longitude, sun.longitude, sp.cazimiDeg)
    ) {
      score += config.weights.ascRulerUnderBeams;
    }
    if (ascRuler.isRetrograde) score += config.weights.ascRulerRetrograde;
    if (isAversion(ascSign, ascRuler.zodiacSignName)) {
      pushFactor(factors, {
        id: "asc-aversion-ruler",
        label: "Ascendant averse to its ruler",
        weight: config.weights.ascAversionToRuler,
        effect: "negative",
        explanation: "The Ascendant cannot see its oikodespotes by whole-sign aspect.",
        source: "Hellenistic",
      });
      score += config.weights.ascAversionToRuler;
    }
  }

  for (const ben of BENEFICS) {
    const p = getPlanet(chart, ben);
    if (!p) continue;
    const h = wholeSignHouse(p.longitude, asc);
    if (h === 1 || h === 10) {
      pushFactor(factors, {
        id: `benefic-angle-${ben}`,
        label: `${ben} in ${houseOrdinal(h)} house`,
        weight: h === 1 ? config.weights.beneficInFirst : config.weights.beneficInTenth,
        effect: "positive",
        explanation: "Benefic angular support for the election.",
        source: "Dorotheus V",
      });
      score += h === 1 ? config.weights.beneficInFirst : config.weights.beneficInTenth;
    } else if (angularHouse(h)) {
      score += config.weights.beneficOnAngle;
    }
  }

  for (const mal of MALEFICS) {
    const p = getPlanet(chart, mal);
    if (!p) continue;
    const h = wholeSignHouse(p.longitude, asc);
    if (h === 1 || h === 10) {
      let w = h === 1 ? config.weights.maleficInFirst : config.weights.maleficInTenth;
      if (mal === contrarySectMalefic(isDay) && h === 1) {
        w += config.weights.maleficContraryFirstExtra;
        if (config.vetoes.contraryMaleficInFirst.enabled) {
          veto = {
            id: "contrary-malefic-first",
            label: `${mal} (contrary to sect) in the 1st house`,
          };
        }
      }
      pushFactor(factors, {
        id: `malefic-angle-${mal}`,
        label: `${mal} in ${houseOrdinal(h)} house`,
        weight: w,
        effect: "negative",
        explanation: "Malefic on a primary angle undermines the election.",
        source: "Dorotheus V",
      });
      score += w;
    } else if (cadentHouse(h) && isAversion(ascSign, p.zodiacSignName) && isAversion(moon.zodiacSignName, p.zodiacSignName)) {
      score += config.weights.maleficCadentAversion;
    }
  }

  const keyPlanets = activity.keyPlanets || ["moon"];
  for (const kp of keyPlanets) {
    applyGeneralCondition(chart, kp, sun, isDay, factors, (delta) => {
      score += delta;
    });
  }

  if (activity.signModality === "movable") {
    if (MOVABLE_SIGNS.has(ascSign) || MOVABLE_SIGNS.has(moon.zodiacSignName)) {
      score += config.weights.signModalityMatch;
    } else if (FIXED_SIGNS.has(ascSign)) {
      score += config.weights.signModalityMismatch;
    }
  }
  if (activity.signModality === "fixed") {
    if (FIXED_SIGNS.has(ascSign) || FIXED_SIGNS.has(moon.zodiacSignName)) {
      score += config.weights.signModalityMatch;
    } else if (MOVABLE_SIGNS.has(ascSign)) {
      score += config.weights.signModalityMismatch;
    }
  }

  if (activity.compareFirstSeventhRulers && ascRuler) {
    const seventhSign = SIGNS[(SIGNS.indexOf(ascSign) + 6) % 12];
    const seventhRuler = getRuler(seventhSign);
    const sr = seventhRuler ? getPlanet(chart, seventhRuler) : null;
    if (sr) {
      const ascScore = dignityScore(ascRuler, isDay);
      const sevScore = dignityScore(sr, isDay);
      if (ascScore > sevScore) {
        pushFactor(factors, {
          id: "legal-asc-stronger",
          label: "Ascendant ruler stronger than 7th ruler",
          weight: config.weights.legalAscVsSeventh,
          effect: "positive",
          explanation: "Favorable for contests and litigation from the initiator’s perspective.",
          source: "Dorotheus V / Maximus",
        });
        score += config.weights.legalAscVsSeventh;
      } else {
        score -= config.weights.legalAscVsSeventh;
      }
    }
  }

  if (ctx.planetaryHour) {
    const key = activity.keyPlanets?.[0];
    if (key && ctx.planetaryHour.hourRuler?.toLowerCase() === key) {
      score += config.weights.planetaryHourMatch;
    }
    if (key && ctx.planetaryHour.dayRuler?.toLowerCase() === key) {
      score += config.weights.planetaryDayMatch;
    }
  }

  const risingSignAssessment = assessRisingSign(chart);
  if (risingSignAssessment) {
    score += risingSignAssessment.weight;
    for (const v of risingSignAssessment.violations || []) {
      pushFactor(factors, {
        id: v.id,
        label: v.label,
        weight: 0,
        effect: "negative",
        explanation: v.explanation,
        source: "Hellenistic rising-sign rules",
      });
    }
    if (risingSignAssessment.reject) {
      pushFactor(factors, {
        id: "rising-sign-reject-score",
        label: "Unacceptable rising sign for this moment",
        weight: risingSignAssessment.weight,
        effect: "negative",
        explanation: risingSignAssessment.summary,
        source: "Hellenistic rising-sign rules",
      });
    }
    if (!risingSignAssessment.reject) {
      pushFactor(factors, {
        id: "rising-sign-ok",
        label: `Rising sign (${ascSign}): acceptable`,
        weight: 0,
        effect: "info",
        explanation: risingSignAssessment.summary,
        source: "Hellenistic rising-sign rules",
      });
    }
    if (risingSignAssessment.reject && !veto) {
      veto = {
        id: "rising-sign-reject",
        label: `${ascSign} rising not acceptable for this moment`,
      };
    }
  }

  const legacyScore = Math.max(0, Math.min(100, Math.round(score)));
  const electionRank = computeElectionRank(
    chart,
    { moonMotion: motion, isDay },
    activity,
  );

  for (const [key, tier] of Object.entries(electionRank.tiers)) {
    const label =
      key === "ascRuler"
        ? "Ascendant ruler tier"
        : key === "moon"
          ? "Moon tier"
          : key === "anglesSect"
            ? "Angles & sect tier"
            : "Topic tier";
    pushFactor(factors, {
      id: `tier-${key}`,
      label: `${label}: ${tier.score}/100`,
      weight: 0,
      effect: tier.score >= 60 ? "positive" : tier.score < 45 ? "negative" : "info",
      explanation: tier.notes?.join("; ") || "",
      source: "Election rank (tier)",
    });
  }

  const natalTiebreak =
    ctx.natalRooting && ctx.natal
      ? scoreNatalTiebreak(chart, ctx.natal)
      : { natalScore: null, factors: [] };
  for (const nf of natalTiebreak.factors || []) {
    pushFactor(factors, {
      id: nf.id,
      label: nf.label,
      weight: 0,
      effect: nf.effect,
      explanation: "Natal tiebreak (secondary sort when enabled).",
      source: "Natal transit tiebreak",
    });
  }

  let rankScore = electionRank.rankScore;
  if (veto) rankScore = Math.min(rankScore, 25);

  const rejectSearch =
    Boolean(risingSignAssessment?.reject) ||
    electionRank.rejectSearch ||
    Boolean(veto);

  score = rankScore;
  const grade = gradeFromScore(rankScore, veto ? "Avoid" : null);

  const activityInputs = {
    waxing,
    ascSign,
    moonSign: moon.zodiacSignName,
    moonApplyPlanet: motion.nextApplication?.planet,
    score,
  };
  const suitability = rankActivities(activityInputs);
  const activityRankings = rankAllActivityProfiles(activityInputs);
  const { bestFor, avoidFor } = getHouseTopicHighlights(chart, isDay);

  return {
    score,
    rankScore,
    legacyScore,
    grade,
    veto,
    rejectSearch,
    electionRank,
    natalScore: natalTiebreak.natalScore,
    factors,
    suitableFor: suitability.suitable,
    unsuitableFor: suitability.unsuitable,
    bestForTopic: bestFor,
    avoidForTopic: avoidFor,
    activityRankings,
    risingSignAssessment,
    warnings,
    activityId,
    moonApplication,
    conditionChanges: motion.conditionChanges || [],
    isDayChart: isDay,
    ascendantSign: ascSign,
    ascendantDegree: chart.houses?.ascendantDegree || null,
  };
}

const { SIGNS } = require("./constants");

function dignityScore(planet, isDay) {
  if (!planet) return 0;
  let s = 0;
  const d = getDignity(planet.name || "", planet.zodiacSignName);
  if (d === "domicile" || d === "exaltation") s += 2;
  if (d === "detriment" || d === "fall") s -= 2;
  if (planet.isRetrograde) s -= 1;
  return s;
}

function applyGeneralCondition(chart, planetName, sun, isDay, factors, addScore) {
  const p = getPlanet(chart, planetName);
  if (!p) return;
  const d = getDignity(planetName, p.zodiacSignName);
  if (d === "domicile" || d === "exaltation") addScore(config.weights.dignityDomExalt);
  if (d === "detriment" || d === "fall") addScore(config.weights.dignityDetFall);
  if (p.isRetrograde) addScore(config.weights.retrogradeKey);
  const sp = config.solarPhase;
  if (
    isUnderBeams(p.longitude, sun.longitude, sp.underBeamsDeg) &&
    !isCazimi(p.longitude, sun.longitude, sp.cazimiDeg)
  ) {
    addScore(config.weights.underBeamsKey);
  }
  if (planetName === sectBenefic(isDay)) addScore(config.weights.sectBeneficStrong);
  if (planetName === contrarySectMalefic(isDay)) addScore(config.weights.sectMaleficContrary);
}

function rankActivities(inputs) {
  const suitable = [];
  const unsuitable = [];
  for (const [id, act] of Object.entries(config.activities)) {
    const { bonus } = scoreActivityFit(inputs, act);
    const threshold = inputs.score >= 50 ? 3 : -3;
    if (bonus >= threshold) suitable.push(act.label);
    else if (bonus <= -3) unsuitable.push(act.label);
  }
  return {
    suitable: suitable.slice(0, 6),
    unsuitable: unsuitable.slice(0, 6),
  };
}

/** Rank every activity profile for a moment (topic fit, independent of selected activity). */
function rankAllActivityProfiles(inputs) {
  const ranked = [];
  for (const [id, act] of Object.entries(config.activities)) {
    const { bonus, reasons } = scoreActivityFit(inputs, act);
    ranked.push({
      id,
      label: act.label,
      fitScore: bonus,
      reasons,
    });
  }
  ranked.sort((a, b) => b.fitScore - a.fitScore);
  return ranked;
}

/**
 * Best / avoid life areas from sect benefic and sect malefic whole-sign houses.
 * Day: Jupiter = best house, Mars = trouble. Night: Venus = best, Saturn = trouble.
 */
function getHouseTopicHighlights(chart, isDay) {
  const asc = chart.houses?.ascendant;
  const beneficName = isDay ? "jupiter" : "venus";
  const maleficName = isDay ? "mars" : "saturn";
  const benefic = getPlanet(chart, beneficName);
  const malefic = getPlanet(chart, maleficName);
  const sectLabel = isDay ? "day" : "night";

  if (asc == null || !benefic || !malefic) {
    return { bestFor: null, avoidFor: null };
  }

  const bestHouse = wholeSignHouse(benefic.longitude, asc);
  const troubleHouse = wholeSignHouse(malefic.longitude, asc);
  const bestLabel = HOUSE_TOPICS[bestHouse] || `House ${bestHouse}`;
  const troubleLabel = HOUSE_TOPICS[troubleHouse] || `House ${troubleHouse}`;

  return {
    bestFor: {
      id: `house-${bestHouse}`,
      label: bestLabel,
      fitScore: 0,
      reasons: [
        `${beneficName} (${sectLabel} sect benefic) in the ${houseTopicOrdinal(bestHouse)} house`,
      ],
    },
    avoidFor: {
      id: `house-${troubleHouse}`,
      label: troubleLabel,
      fitScore: 0,
      reasons: [
        `${maleficName} (${sectLabel} sect malefic) in the ${houseTopicOrdinal(troubleHouse)} house`,
      ],
    },
  };
}

/** @deprecated Use getHouseTopicHighlights for display; kept for tests comparing activity fit. */
function getActivityHighlights(inputs) {
  const ranked = rankAllActivityProfiles(inputs);
  const topical = ranked.filter((r) => r.id !== "general");
  const pool = topical.length > 0 ? topical : ranked;
  const bestFor = pool[0];
  const worst = pool[pool.length - 1];
  const avoidFor =
    worst && worst.id !== bestFor?.id && worst.fitScore < 0 ? worst : null;
  return { ranked, bestFor, avoidFor };
}

function buildActivityInputsFromChart(chart, ctx, score) {
  const moon = getPlanet(chart, "moon");
  const sun = getPlanet(chart, "sun");
  const ascSign = chart.houses?.ascendantSign;
  if (!moon || !sun || !ascSign) {
    return null;
  }
  return {
    waxing: isWaxing(moon.longitude, sun.longitude),
    ascSign,
    moonSign: moon.zodiacSignName,
    moonApplyPlanet: ctx.moonMotion?.nextApplication?.planet,
    score,
  };
}

module.exports = {
  evaluateElection,
  gradeFromScore,
  scoreActivityFit,
  rankAllActivityProfiles,
  getHouseTopicHighlights,
  getActivityHighlights,
  buildActivityInputsFromChart,
};
