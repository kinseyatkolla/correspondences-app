/**
 * Harmonize within-sign degrees on aspect events for calendar/list display.
 * Uses full ecliptic longitudes + aspect name; cusp conjunctions anchor to the slower planet.
 */

const ASPECT_ANGLES = {
  conjunct: 0,
  sextile: 60,
  square: 90,
  trine: 120,
  opposition: 180,
};

/** Higher rank = slower planet (wins cusp conjunction display). */
const PLANET_SLOWNESS_RANK = {
  northnode: 90,
  pluto: 85,
  neptune: 84,
  uranus: 83,
  saturn: 80,
  jupiter: 70,
  mars: 50,
  sun: 40,
  venus: 30,
  mercury: 20,
  moon: 10,
};

function normalizePlanetName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/\./g, "");
}

function slownessRank(planetName) {
  return PLANET_SLOWNESS_RANK[normalizePlanetName(planetName)] ?? 45;
}

function normalizeLongitude(longitude) {
  return ((longitude % 360) + 360) % 360;
}

function withinSignDecimal(longitude) {
  return normalizeLongitude(longitude) % 30;
}

function signIndex(longitude) {
  return Math.floor(normalizeLongitude(longitude) / 30);
}

function formatDisplayWholeDegree(withinSign) {
  const rounded = Math.min(29, Math.max(0, Math.round(withinSign)));
  return {
    degree: rounded,
    degreeFormatted: `${rounded}°`,
  };
}

function pickSlowerPlanetIndex(planet1, planet2) {
  const r1 = slownessRank(planet1);
  const r2 = slownessRank(planet2);
  if (r1 === r2) return 1;
  return r1 > r2 ? 1 : 2;
}

function applySharedDisplay(position, display, zodiacSignName) {
  return {
    ...position,
    ...display,
    zodiacSignName: zodiacSignName ?? position.zodiacSignName,
  };
}

/**
 * @param {object} event - year-ephemeris aspect event
 * @returns {object} event with harmonized planet1Position / planet2Position
 */
function harmonizeAspectEventForDisplay(event) {
  if (!event || event.type !== "aspect") {
    return event;
  }

  const aspectName = String(event.aspectName || "").toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(ASPECT_ANGLES, aspectName)) {
    return event;
  }

  const p1 = event.planet1Position;
  const p2 = event.planet2Position;
  const λ1 = p1?.eclipticLongitude;
  const λ2 = p2?.eclipticLongitude;
  if (!Number.isFinite(λ1) || !Number.isFinite(λ2)) {
    return event;
  }

  if (aspectName === "conjunct") {
    const differentSigns = signIndex(λ1) !== signIndex(λ2);
    if (differentSigns) {
      const slowerIsPlanet1 = pickSlowerPlanetIndex(event.planet1, event.planet2) === 1;
      const anchorPos = slowerIsPlanet1 ? p1 : p2;
      const anchorLong = slowerIsPlanet1 ? λ1 : λ2;
      const display = formatDisplayWholeDegree(withinSignDecimal(anchorLong));
      const signName = anchorPos.zodiacSignName;
      return {
        ...event,
        planet1Position: applySharedDisplay(p1, display, signName),
        planet2Position: applySharedDisplay(p2, display, signName),
      };
    }

    const sharedWithin =
      (withinSignDecimal(λ1) + withinSignDecimal(λ2)) / 2;
    const display = formatDisplayWholeDegree(sharedWithin);
    return {
      ...event,
      planet1Position: applySharedDisplay(p1, display),
      planet2Position: applySharedDisplay(p2, display),
    };
  }

  const sharedWithin = (withinSignDecimal(λ1) + withinSignDecimal(λ2)) / 2;
  const display = formatDisplayWholeDegree(sharedWithin);
  return {
    ...event,
    planet1Position: applySharedDisplay(p1, display),
    planet2Position: applySharedDisplay(p2, display),
  };
}

module.exports = {
  ASPECT_ANGLES,
  harmonizeAspectEventForDisplay,
  normalizePlanetName,
  slownessRank,
};
