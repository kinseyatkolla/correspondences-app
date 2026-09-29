/**
 * Additional electional vetoes (Jupiter–Mars, Moon–Mars).
 */

const { angularDistance, getPlanet } = require("./chartHelpers");
const {
  isApplyingToAspect,
  MITIGATION_ORB_DEG,
} = require("./electionMitigation");

const HARD_ANGLES = [0, 90, 180];

/**
 * Day charts: Jupiter within 3° of a hard aspect to Mars and applying.
 * Replaces broad “Asc ruler same sign as Mars” whole-sign veto.
 *
 * @returns {{ reject: boolean, reason?: string }}
 */
function vetoJupiterMarsApplyingHard(chart, isDay) {
  if (!isDay) return { reject: false };
  const jupiter = getPlanet(chart, "jupiter");
  const mars = getPlanet(chart, "mars");
  if (!jupiter?.longitude || !mars?.longitude) return { reject: false };

  for (const angle of HARD_ANGLES) {
    const dist = angularDistance(jupiter.longitude, mars.longitude);
    if (Math.abs(dist - angle) > MITIGATION_ORB_DEG) continue;
    if (
      isApplyingToAspect(
        jupiter.longitude,
        jupiter.speed,
        mars.longitude,
        mars.speed,
        angle,
      )
    ) {
      return {
        reject: true,
        reason: "jupiter applying within 3° of hard aspect to mars (day)",
      };
    }
  }
  return { reject: false };
}

/**
 * Moon applying within 3° to a hard aspect with Mars (any sect).
 *
 * @returns {{ reject: boolean, reason?: string }}
 */
function vetoMoonApplyingToMars(chart) {
  const moon = getPlanet(chart, "moon");
  const mars = getPlanet(chart, "mars");
  if (!moon?.longitude || !mars?.longitude) return { reject: false };

  for (const angle of HARD_ANGLES) {
    const dist = angularDistance(moon.longitude, mars.longitude);
    if (Math.abs(dist - angle) > MITIGATION_ORB_DEG) continue;
    if (
      isApplyingToAspect(
        moon.longitude,
        moon.speed,
        mars.longitude,
        mars.speed,
        angle,
      )
    ) {
      return {
        reject: true,
        reason: "moon applying within 3° of hard aspect to mars",
      };
    }
  }
  return { reject: false };
}

module.exports = {
  vetoJupiterMarsApplyingHard,
  vetoMoonApplyingToMars,
};
