const {
  getRuler,
  getDignity,
  wholeSignHouse,
  hasWholeSignAspect,
  hasWholeSignHardAspect,
  outOfSectMalefic,
  sectBenefic,
  getPlanet,
} = require("./chartHelpers");
const { isDayChart } = require("./electionSect");
const {
  tightHardMaleficAspectPenalty,
  moonMitigatesBadHouse,
} = require("./electionMitigation");
const {
  beneficExactToAscOrMc,
  BENEFIC_REPRESENTATIVE_BONUS,
} = require("./dedupeDailyRisingSlots");
const {
  venusRetrogradeRisingPenalty,
  marsRetrogradeRisingPenalty,
} = require("./rulerRetrogradeRules");

function dignityLabelForDisplay(planetName, signName) {
  const d = getDignity(planetName, signName);
  if (d === "domicile") return "rulership";
  if (d === "exaltation") return "exaltation";
  return null;
}

function planetPlacement(planet, planetName, ascLon) {
  if (!planet || ascLon == null) {
    return { sign: null, house: null, dignity: null };
  }
  const sign = planet.zodiacSignName ?? null;
  return {
    sign,
    house: wholeSignHouse(planet.longitude, ascLon),
    dignity: sign ? dignityLabelForDisplay(planetName, sign) : null,
  };
}

const WEIGHTS = {
  ascRulerSignDignity: 30,
  ascRulerGoodHouse: 20,
  ascRulerBadHouse: -20,
  moonSignDignity: 30,
  moonGoodHouse: 20,
  moonBadHouse: -20,
  ascRulerBeneficAspect: 15,
  ascRulerMaleficAspect: -15,
  moonBeneficAspect: 15,
  moonMaleficAspect: -15,
  tightMaleficDegreeAspect: -12,
  beneficExactAscOrMc: BENEFIC_REPRESENTATIVE_BONUS,
};

const GOOD_HOUSES = new Set([1, 4, 7, 10]);
const BAD_HOUSES = new Set([6, 8, 12]);
const BENEFIC_ASPECT_PLANETS = new Set(["venus", "jupiter"]);

function signDignity(planetName, signName) {
  const d = getDignity(planetName, signName);
  return d === "domicile" || d === "exaltation";
}

function houseScore(houseNum) {
  if (GOOD_HOUSES.has(houseNum)) return 1;
  if (BAD_HOUSES.has(houseNum)) return -1;
  return 0;
}

function hardAspectOutOfSectMalefic(targetSign, maleficPlanet, chart) {
  const m = getPlanet(chart, maleficPlanet);
  if (!m) return false;
  return hasWholeSignHardAspect(targetSign, m.zodiacSignName);
}

function aspectsBenefic(targetSign, chart) {
  for (const b of BENEFIC_ASPECT_PLANETS) {
    const p = getPlanet(chart, b);
    if (p && hasWholeSignAspect(targetSign, p.zodiacSignName)) return true;
  }
  return false;
}

/**
 * Score one chart instant (electional-rules: Asc ruler + Moon priority).
 */
function scoreElectionChart(chart) {
  const ascSign = chart.houses?.ascendantSign;
  const ascLon = chart.houses?.ascendant;
  if (!ascSign || ascLon == null) {
    return { score: 0, breakdown: [] };
  }

  const ascRulerName = getRuler(ascSign);
  const ascRuler = ascRulerName ? getPlanet(chart, ascRulerName) : null;
  const moon = getPlanet(chart, "moon");
  const isDay = isDayChart(ascLon, chart.planets?.sun?.longitude ?? 0);
  const malefic = outOfSectMalefic(isDay);

  let score = 0;
  const breakdown = [];

  const add = (id, delta, label) => {
    score += delta;
    if (delta !== 0) breakdown.push({ id, delta, label });
  };

  const venusRetroPenalty = venusRetrogradeRisingPenalty(ascSign, chart);
  if (venusRetroPenalty) {
    add(venusRetroPenalty.id, venusRetroPenalty.delta, venusRetroPenalty.label);
  }
  const marsRetroPenalty = marsRetrogradeRisingPenalty(ascSign, chart);
  if (marsRetroPenalty) {
    add(marsRetroPenalty.id, marsRetroPenalty.delta, marsRetroPenalty.label);
  }

  if (ascRuler) {
    if (signDignity(ascRulerName, ascRuler.zodiacSignName)) {
      add("asc-ruler-sign", WEIGHTS.ascRulerSignDignity, "Asc ruler dignified by sign");
    }
    const h = wholeSignHouse(ascRuler.longitude, ascLon);
    const hs = houseScore(h);
    if (hs > 0) add("asc-ruler-house-good", WEIGHTS.ascRulerGoodHouse, `Asc ruler in house ${h}`);
    if (hs < 0) add("asc-ruler-house-bad", WEIGHTS.ascRulerBadHouse, `Asc ruler in house ${h}`);
    if (aspectsBenefic(ascRuler.zodiacSignName, chart)) {
      add("asc-ruler-benefic-aspect", WEIGHTS.ascRulerBeneficAspect, "Asc ruler aspects Venus or Jupiter");
    }
    if (hardAspectOutOfSectMalefic(ascRuler.zodiacSignName, malefic, chart)) {
      add("asc-ruler-malefic-aspect", WEIGHTS.ascRulerMaleficAspect, `Asc ruler hard aspect to out-of-sect ${malefic}`);
    }
    if (
      tightHardMaleficAspectPenalty(
        ascRuler.longitude,
        ascRuler.speed,
        ascRuler.zodiacSignName,
        ascRulerName,
        chart,
        ascLon,
        isDay,
      )
    ) {
      add(
        "asc-ruler-tight-malefic",
        WEIGHTS.tightMaleficDegreeAspect,
        "Asc ruler within 3° of hard Mars/Saturn aspect",
      );
    }
  }

  if (moon) {
    if (signDignity("moon", moon.zodiacSignName)) {
      add("moon-sign", WEIGHTS.moonSignDignity, "Moon dignified by sign");
    }
    const mh = wholeSignHouse(moon.longitude, ascLon);
    const mhs = houseScore(mh);
    if (mhs > 0) add("moon-house-good", WEIGHTS.moonGoodHouse, `Moon in house ${mh}`);
    const moonBadHouseMitigated = mhs < 0 && moonMitigatesBadHouse(moon, chart, isDay);
    if (mhs < 0 && !moonBadHouseMitigated) {
      add("moon-house-bad", WEIGHTS.moonBadHouse, `Moon in house ${mh}`);
    }
    if (aspectsBenefic(moon.zodiacSignName, chart)) {
      add("moon-benefic-aspect", WEIGHTS.moonBeneficAspect, "Moon aspects Venus or Jupiter");
    }
    if (hardAspectOutOfSectMalefic(moon.zodiacSignName, malefic, chart)) {
      add("moon-malefic-aspect", WEIGHTS.moonMaleficAspect, `Moon hard aspect to out-of-sect ${malefic}`);
    }
    if (
      tightHardMaleficAspectPenalty(
        moon.longitude,
        moon.speed,
        moon.zodiacSignName,
        "moon",
        chart,
        ascLon,
        isDay,
      )
    ) {
      add(
        "moon-tight-malefic",
        WEIGHTS.tightMaleficDegreeAspect,
        "Moon within 3° of hard Mars/Saturn aspect",
      );
    }
  }

  const inSectBeneficName = sectBenefic(isDay);
  const inSectBenefic = getPlanet(chart, inSectBeneficName);
  const oosMalefic = getPlanet(chart, malefic);

  const ascRulerPlacement = planetPlacement(ascRuler, ascRulerName, ascLon);
  const moonPlacement = planetPlacement(moon, "moon", ascLon);
  const inSectBeneficPlacement = planetPlacement(
    inSectBenefic,
    inSectBeneficName,
    ascLon,
  );
  const oosMaleficPlacement = planetPlacement(oosMalefic, malefic, ascLon);

  const { hasExact: beneficOnAngle } = beneficExactToAscOrMc(chart);
  if (beneficOnAngle) {
    add(
      "benefic-exact-asc-mc",
      WEIGHTS.beneficExactAscOrMc,
      "Venus or Jupiter within 3° of aspect to Asc or MC",
    );
  }

  return {
    score,
    breakdown,
    isDayChart: isDay,
    risingSign: ascSign,
    ascRulerPlanet: ascRulerName,
    ascRulerSign: ascRulerPlacement.sign,
    ascRulerHouse: ascRulerPlacement.house,
    ascRulerDignity: ascRulerPlacement.dignity,
    moonSign: moonPlacement.sign,
    moonHouse: moonPlacement.house,
    moonDignity: moonPlacement.dignity,
    inSectBeneficPlanet: inSectBeneficName,
    inSectBeneficSign: inSectBeneficPlacement.sign,
    inSectBeneficHouse: inSectBeneficPlacement.house,
    inSectBeneficDignity: inSectBeneficPlacement.dignity,
    outOfSectMaleficPlanet: malefic,
    outOfSectMaleficSign: oosMaleficPlacement.sign,
    outOfSectMaleficHouse: oosMaleficPlacement.house,
    outOfSectMaleficDignity: oosMaleficPlacement.dignity,
  };
}

module.exports = {
  scoreElectionChart,
  WEIGHTS,
};
