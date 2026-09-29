/**
 * Mitigation helpers for electional chart filters (podcast-style MC/light/benefic configs).
 */

const { SIGN_RULER } = require("./constants");
const {
  angularDistance,
  normalizeLon,
  getPlanet,
  getDignity,
  wholeSignHouse,
  cadentHouse,
  sectBenefic,
  outOfSectMalefic,
} = require("./chartHelpers");

const MITIGATION_ORB_DEG = 3;
const HARD_MALEFIC_ANGLES = [0, 90, 180];
const MITIGATION_ASPECT_ANGLES = [0, 60, 90, 120, 180];

function orbToNearestAspect(lon1, lon2, aspectAngles) {
  const dist = angularDistance(lon1, lon2);
  let bestOrb = Infinity;
  let bestAngle = null;
  for (const angle of aspectAngles) {
    const orb = Math.abs(dist - angle);
    if (orb < bestOrb) {
      bestOrb = orb;
      bestAngle = angle;
    }
  }
  return { orb: bestOrb, angle: bestAngle };
}

function withinOrbToAnyAspect(lon1, lon2, aspectAngles, maxOrb) {
  return orbToNearestAspect(lon1, lon2, aspectAngles).orb <= maxOrb;
}

function isApplyingToAspect(lon1, speed1, lon2, speed2, aspectAngle) {
  const s1 = Number(speed1) || 0;
  const s2 = Number(speed2) || 0;
  const dt = 1 / 24;
  const nowOrb = Math.abs(angularDistance(lon1, lon2) - aspectAngle);
  const futureOrb = Math.abs(
    angularDistance(lon1 + s1 * dt, lon2 + s2 * dt) - aspectAngle,
  );
  return futureOrb < nowOrb - 1e-6;
}

function hasMutualReceptionBySign(planetSign, planetName, otherSign, otherName) {
  if (!planetSign || !otherSign || !planetName || !otherName) return false;
  return (
    SIGN_RULER[planetSign] === otherName &&
    SIGN_RULER[otherSign] === planetName
  );
}

function isSignDignified(planetName, signName) {
  const d = getDignity(planetName, signName);
  return d === "domicile" || d === "exaltation";
}

/** Moon between Venus and Jupiter on the ecliptic (both benefics). */
function enclosedByBenefics(moonLon, chart) {
  const venus = getPlanet(chart, "venus");
  const jupiter = getPlanet(chart, "jupiter");
  if (!venus || !jupiter) return false;
  const m = normalizeLon(moonLon);
  const a = normalizeLon(venus.longitude);
  const b = normalizeLon(jupiter.longitude);
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  if (max - min <= 180) {
    return m >= min && m <= max;
  }
  return m >= max || m <= min;
}

function mitigatedByLightsMcOrBenefics(planetLon, chart, excludePlanetName = null) {
  for (const name of ["sun", "mercury", "venus", "jupiter"]) {
    if (excludePlanetName && name === excludePlanetName) continue;
    const p = getPlanet(chart, name);
    if (!p || p.longitude == null) continue;
    if (
      withinOrbToAnyAspect(
        planetLon,
        p.longitude,
        MITIGATION_ASPECT_ANGLES,
        MITIGATION_ORB_DEG,
      )
    ) {
      return true;
    }
  }
  const mc = chart.houses?.mc;
  if (mc != null) {
    const ic = normalizeLon(mc + 180);
    if (
      withinOrbToAnyAspect(
        planetLon,
        mc,
        MITIGATION_ASPECT_ANGLES,
        MITIGATION_ORB_DEG,
      )
    ) {
      return true;
    }
    if (
      withinOrbToAnyAspect(
        planetLon,
        ic,
        MITIGATION_ASPECT_ANGLES,
        MITIGATION_ORB_DEG,
      )
    ) {
      return true;
    }
  }
  return false;
}

function applyingInSectBeneficAspect(planetLon, planetSpeed, chart, isDay) {
  const bName = sectBenefic(isDay);
  const b = getPlanet(chart, bName);
  if (!b || b.longitude == null) return false;
  for (const angle of MITIGATION_ASPECT_ANGLES) {
    const { orb } = orbToNearestAspect(planetLon, b.longitude, [angle]);
    if (orb <= MITIGATION_ORB_DEG) {
      if (
        isApplyingToAspect(
          planetLon,
          planetSpeed,
          b.longitude,
          b.speed,
          angle,
        )
      ) {
        return true;
      }
    }
  }
  return false;
}

function moonMitigatesBadHouse(moon, chart, isDay) {
  if (!moon) return false;
  if (
    isSignDignified("moon", moon.zodiacSignName) &&
    applyingInSectBeneficAspect(moon.longitude, moon.speed, chart, isDay)
  ) {
    return true;
  }
  if (enclosedByBenefics(moon.longitude, chart)) return true;
  if (mitigatedByLightsMcOrBenefics(moon.longitude, chart)) return true;
  return false;
}

function maleficHardAspectCarveOut(
  planetLon,
  planetSpeed,
  planetSign,
  planetName,
  chart,
  maleficName,
  ascLon,
  isDay,
) {
  const m = getPlanet(chart, maleficName);
  if (!m || m.longitude == null) return false;

  if (
    hasMutualReceptionBySign(
      planetSign,
      planetName,
      m.zodiacSignName,
      maleficName,
    )
  ) {
    return true;
  }

  if (applyingInSectBeneficAspect(planetLon, planetSpeed, chart, isDay)) {
    return true;
  }

  const mHouse = wholeSignHouse(m.longitude, ascLon);
  if (!cadentHouse(mHouse)) return false;

  for (const angle of HARD_MALEFIC_ANGLES) {
    const { orb } = orbToNearestAspect(planetLon, m.longitude, [angle]);
    if (orb <= MITIGATION_ORB_DEG) {
      if (
        !isApplyingToAspect(
          planetLon,
          planetSpeed,
          m.longitude,
          m.speed,
          angle,
        )
      ) {
        return true;
      }
    }
  }
  return false;
}

function hasVetoableHardMaleficAspect(
  planetLon,
  planetSpeed,
  planetSign,
  planetName,
  chart,
  ascLon,
  isDay,
) {
  const maleficName = outOfSectMalefic(isDay);
  const m = getPlanet(chart, maleficName);
  if (!m || m.longitude == null) return false;
  for (const angle of HARD_MALEFIC_ANGLES) {
    const { orb } = orbToNearestAspect(planetLon, m.longitude, [angle]);
    if (orb <= MITIGATION_ORB_DEG) {
      if (
        maleficHardAspectCarveOut(
          planetLon,
          planetSpeed,
          planetSign,
          planetName,
          chart,
          maleficName,
          ascLon,
          isDay,
        )
      ) {
        continue;
      }
      return true;
    }
  }
  return false;
}

/** For scoring: tight hard malefic aspect without a carve-out. */
function tightHardMaleficAspectPenalty(
  planetLon,
  planetSpeed,
  planetSign,
  planetName,
  chart,
  ascLon,
  isDay,
) {
  return hasVetoableHardMaleficAspect(
    planetLon,
    planetSpeed,
    planetSign,
    planetName,
    chart,
    ascLon,
    isDay,
  );
}

module.exports = {
  MITIGATION_ORB_DEG,
  HARD_MALEFIC_ANGLES,
  moonMitigatesBadHouse,
  hasVetoableHardMaleficAspect,
  tightHardMaleficAspectPenalty,
  mitigatedByLightsMcOrBenefics,
  enclosedByBenefics,
  withinOrbToAnyAspect,
  isApplyingToAspect,
};
