/**
 * Uranus & Pluto hard aspects (whole-sign and 3° degree) to Asc, Asc ruler, Moon.
 */

const { getPlanet, getRuler } = require("./chartHelpers");
const { withinHardDegreeAspectOrb } = require("./outOfSectMaleficAspects");

const OUTER_PLANETS = ["uranus", "pluto"];

function vetoBodyToOuterPlanet(bodyLabel, bodyLon, chart) {
  if (bodyLon == null) return null;
  for (const planetName of OUTER_PLANETS) {
    const outer = getPlanet(chart, planetName);
    if (!outer || outer.longitude == null) continue;
    if (withinHardDegreeAspectOrb(bodyLon, outer.longitude)) {
      return `${bodyLabel} within 3° of hard aspect to ${planetName}`;
    }
  }
  return null;
}

/**
 * @returns {{ reject: boolean, reason?: string }}
 */
function vetoUranusPlutoHardAspects(chart) {
  const ascLon = chart.houses?.ascendant;
  const ascSign = chart.houses?.ascendantSign;
  if (ascLon == null || !ascSign) return { reject: false };

  let reason = vetoBodyToOuterPlanet("ascendant", ascLon, chart);
  if (reason) return { reject: true, reason };

  const ascRulerName = getRuler(ascSign);
  const ascRuler = ascRulerName ? getPlanet(chart, ascRulerName) : null;
  if (ascRuler?.longitude != null) {
    reason = vetoBodyToOuterPlanet("asc ruler", ascRuler.longitude, chart);
    if (reason) return { reject: true, reason };
  }

  const moon = getPlanet(chart, "moon");
  if (moon?.longitude != null) {
    reason = vetoBodyToOuterPlanet("moon", moon.longitude, chart);
    if (reason) return { reject: true, reason };
  }

  return { reject: false };
}

module.exports = {
  vetoUranusPlutoHardAspects,
  OUTER_PLANETS,
};
