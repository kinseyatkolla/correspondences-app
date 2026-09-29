/**
 * Out-of-sect malefic (Mars by day, Saturn by night) hard aspects to Asc / Asc ruler.
 */

const {
  angularDistance,
  getPlanet,
  getRuler,
  hasWholeSignHardAspect,
  hasWholeSignAspect,
  outOfSectMalefic,
} = require("./chartHelpers");

const HARD_DEGREE_ANGLES = [0, 90, 180];
const HARD_DEGREE_ORB = 3;

function withinHardDegreeAspectOrb(lon1, lon2, maxOrb = HARD_DEGREE_ORB) {
  if (lon1 == null || lon2 == null) return false;
  const dist = angularDistance(lon1, lon2);
  for (const angle of HARD_DEGREE_ANGLES) {
    if (Math.abs(dist - angle) <= maxOrb) return true;
  }
  return false;
}

/**
 * @returns {{ reject: boolean, reason?: string }}
 */
function vetoOutOfSectMaleficToAscendant(chart, isDay) {
  const ascLon = chart.houses?.ascendant;
  const ascSign = chart.houses?.ascendantSign;
  if (ascLon == null || !ascSign) {
    return { reject: false };
  }

  const maleficName = outOfSectMalefic(isDay);
  const malefic = getPlanet(chart, maleficName);
  if (!malefic || malefic.longitude == null) {
    return { reject: false };
  }

  const maleficSign = malefic.zodiacSignName;
  if (hasWholeSignHardAspect(ascSign, maleficSign)) {
    return {
      reject: true,
      reason: `ascendant sign hard aspect to out-of-sect ${maleficName} by sign`,
    };
  }

  if (withinHardDegreeAspectOrb(ascLon, malefic.longitude)) {
    return {
      reject: true,
      reason: `ascendant within 3° of hard aspect to out-of-sect ${maleficName}`,
    };
  }

  const ascRulerName = getRuler(ascSign);
  const ascRuler = ascRulerName ? getPlanet(chart, ascRulerName) : null;
  if (!ascRuler || ascRuler.longitude == null) {
    return { reject: false };
  }

  const rulerSign = ascRuler.zodiacSignName;
  const sameSignConjunction =
    maleficName === "mars" &&
    rulerSign === maleficSign &&
    hasWholeSignAspect(rulerSign, maleficSign);
  if (
    !sameSignConjunction &&
    hasWholeSignHardAspect(rulerSign, maleficSign)
  ) {
    return {
      reject: true,
      reason: `asc ruler hard aspect to out-of-sect ${maleficName} by sign`,
    };
  }

  if (withinHardDegreeAspectOrb(ascRuler.longitude, malefic.longitude)) {
    return {
      reject: true,
      reason: `asc ruler within 3° of hard aspect to out-of-sect ${maleficName}`,
    };
  }

  return { reject: false };
}

module.exports = {
  vetoOutOfSectMaleficToAscendant,
  withinHardDegreeAspectOrb,
  HARD_DEGREE_ORB,
};
