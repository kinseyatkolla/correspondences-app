const {
  SIGNS,
  SIGN_RULER,
  EXALTATION_SIGN,
  DETRIMENT_SIGN,
  FALL_SIGN,
  BENEFICS,
  MALEFICS,
} = require("./constants");

function normalizeLon(lon) {
  return ((Number(lon) % 360) + 360) % 360;
}

function signIndex(signName) {
  const i = SIGNS.indexOf(signName);
  return i >= 0 ? i : 0;
}

function signFromLon(lon) {
  return SIGNS[Math.floor(normalizeLon(lon) / 30)];
}

function wholeSignHouse(lon, ascLon) {
  const diff =
    (Math.floor(normalizeLon(lon) / 30) -
      Math.floor(normalizeLon(ascLon) / 30) +
      12) %
    12;
  return diff + 1;
}

function signDistance(signA, signB) {
  const a = signIndex(signA);
  const b = signIndex(signB);
  const d = Math.abs(a - b);
  return Math.min(d, 12 - d);
}

function hasWholeSignAspect(signA, signB) {
  const d = signDistance(signA, signB);
  return d === 0 || d === 2 || d === 3 || d === 4 || d === 6;
}

/** Whole-sign conjunction, square, or opposition. */
function hasWholeSignHardAspect(signA, signB) {
  if (!signA || !signB) return false;
  const d = signDistance(signA, signB);
  return d === 0 || d === 3 || d === 6;
}

function isAversion(signA, signB) {
  return !hasWholeSignAspect(signA, signB);
}

/** @deprecated Use electionSect.isDayChart (ecliptic horizon). Kept for tests comparing whole-sign sect. */
function isDayChartWholeSign(ascLon, sunLon) {
  const h = wholeSignHouse(sunLon, ascLon);
  return h >= 10 || h <= 3;
}

function getRuler(signName) {
  return SIGN_RULER[signName] || null;
}

function getDignity(planetName, signName) {
  const p = planetName.toLowerCase();
  if (EXALTATION_SIGN[p] === signName) return "exaltation";
  if (FALL_SIGN[p] === signName) return "fall";
  if (DETRIMENT_SIGN[p] === signName) return "detriment";
  if (SIGN_RULER[signName] === p) return "domicile";
  return "neutral";
}

function angularHouse(houseNum) {
  return houseNum === 1 || houseNum === 4 || houseNum === 7 || houseNum === 10;
}

function succedentHouse(houseNum) {
  return houseNum === 2 || houseNum === 5 || houseNum === 8 || houseNum === 11;
}

function cadentHouse(houseNum) {
  return houseNum === 3 || houseNum === 6 || houseNum === 9 || houseNum === 12;
}

function isUnderBeams(planetLon, sunLon, underDeg) {
  const dist = angularDistance(planetLon, sunLon);
  return dist <= underDeg;
}

function isCombust(planetLon, sunLon, combustDeg) {
  return angularDistance(planetLon, sunLon) <= combustDeg;
}

function isCazimi(planetLon, sunLon, cazimiDeg) {
  return angularDistance(planetLon, sunLon) <= cazimiDeg;
}

function angularDistance(lon1, lon2) {
  const diff = Math.abs(normalizeLon(lon1) - normalizeLon(lon2));
  return Math.min(diff, 360 - diff);
}

function elongation(moonLon, sunLon) {
  return angularDistance(moonLon, sunLon);
}

function isWaxing(moonLon, sunLon) {
  const diff = normalizeLon(moonLon - sunLon);
  return diff > 0 && diff < 180;
}

function isNewMoonDay(moonLon, sunLon, orb = 8) {
  return angularDistance(moonLon, sunLon) <= orb;
}

function tenthSignFrom(signName) {
  const idx = (signIndex(signName) + 9) % 12;
  return SIGNS[idx];
}

function isOvercoming(maleficSign, targetSign) {
  return maleficSign === tenthSignFrom(targetSign);
}

function getPlanet(chart, name) {
  const p = chart.planets?.[name];
  if (!p || p.error) return null;
  return p;
}

function chartPoint(planet) {
  return {
    longitude: planet.longitude,
    zodiacSignName: planet.zodiacSignName || signFromLon(planet.longitude),
  };
}

/** In-sect benefic: Jupiter by day, Venus by night. */
function sectBenefic(isDay) {
  return isDay ? "jupiter" : "venus";
}

/** In-sect malefic: Mars by night; by day Mars is out of sect (see outOfSectMalefic). */
function sectMalefic(isDay) {
  return isDay ? "saturn" : "mars";
}

/** Out-of-sect benefic: Venus by day, Jupiter by night. */
function outOfSectBenefic(isDay) {
  return isDay ? "venus" : "jupiter";
}

/** Out-of-sect malefic: Mars by day, Saturn by night. */
function outOfSectMalefic(isDay) {
  return isDay ? "mars" : "saturn";
}

/** @deprecated Use outOfSectMalefic — kept for older electional modules. */
function contrarySectMalefic(isDay) {
  return outOfSectMalefic(isDay);
}

function southNodeLon(northNodeLon) {
  return normalizeLon(northNodeLon + 180);
}

module.exports = {
  normalizeLon,
  signFromLon,
  wholeSignHouse,
  signDistance,
  hasWholeSignAspect,
  hasWholeSignHardAspect,
  isAversion,
  isDayChartWholeSign,
  getRuler,
  getDignity,
  angularHouse,
  succedentHouse,
  cadentHouse,
  isUnderBeams,
  isCombust,
  isCazimi,
  angularDistance,
  elongation,
  isWaxing,
  isNewMoonDay,
  isOvercoming,
  getPlanet,
  chartPoint,
  sectBenefic,
  sectMalefic,
  outOfSectBenefic,
  outOfSectMalefic,
  contrarySectMalefic,
  southNodeLon,
  BENEFICS,
  MALEFICS,
};
