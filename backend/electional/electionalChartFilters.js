/**
 * Day / night chart vetoes (electional-rules + user filter spec).
 * Sect from Sun vs Ascendant on the ecliptic horizon (electionSect).
 * Moon / Asc ruler: mitigation-aware (see electionMitigation.js).
 */

const {
  getRuler,
  getDignity,
  wholeSignHouse,
  getPlanet,
} = require("./chartHelpers");
const { isDayChart } = require("./electionSect");
const {
  moonMitigatesBadHouse,
  hasVetoableHardMaleficAspect,
  mitigatedByLightsMcOrBenefics,
} = require("./electionMitigation");
const { vetoOutOfSectMaleficToAscendant } = require("./outOfSectMaleficAspects");
const { vetoUranusPlutoHardAspects } = require("./outerPlanetHardAspectVetoes");
const { mercuryRetrogradeRisingVeto } = require("./rulerRetrogradeRules");
const {
  vetoJupiterMarsApplyingHard,
  vetoMoonApplyingToMars,
} = require("./specialChartVetoes");

const BAD_HOUSES = new Set([6, 8, 12]);
const ANGULAR_HOUSES = new Set([1, 4, 7, 10]);

function houseOfPlanet(planet, ascLon) {
  if (planet?.longitude == null) return null;
  return wholeSignHouse(planet.longitude, ascLon);
}

function inBadHouse(houseNum) {
  return houseNum != null && BAD_HOUSES.has(houseNum);
}

function inAngularHouse(houseNum) {
  return houseNum != null && ANGULAR_HOUSES.has(houseNum);
}

function moonBadHouseShouldVeto(moon, moonHouse, chart, isDay) {
  if (!inBadHouse(moonHouse)) return false;
  if (moonMitigatesBadHouse(moon, chart, isDay)) return false;
  if (
    moon &&
    hasVetoableHardMaleficAspect(
      moon.longitude,
      moon.speed,
      moon.zodiacSignName,
      "moon",
      chart,
      chart.houses?.ascendant,
      isDay,
    )
  ) {
    return true;
  }
  return false;
}

/**
 * @returns {{ pass: boolean, isDayChart: boolean, rejectReason?: string }}
 */
function passesElectionalChartFilters(chart) {
  const ascLon = chart.houses?.ascendant;
  const ascSign = chart.houses?.ascendantSign;
  const sun = getPlanet(chart, "sun");
  if (ascLon == null || !ascSign || !sun) {
    return { pass: false, isDayChart: false, rejectReason: "incomplete chart" };
  }

  const isDay = isDayChart(ascLon, sun.longitude);
  const moon = getPlanet(chart, "moon");
  const ascRulerName = getRuler(ascSign);
  const ascRuler = ascRulerName ? getPlanet(chart, ascRulerName) : null;

  const jupMarsVeto = vetoJupiterMarsApplyingHard(chart, isDay);
  if (jupMarsVeto.reject) {
    return {
      pass: false,
      isDayChart: isDay,
      rejectReason: jupMarsVeto.reason,
    };
  }

  const moonMarsVeto = vetoMoonApplyingToMars(chart);
  if (moonMarsVeto.reject) {
    return {
      pass: false,
      isDayChart: isDay,
      rejectReason: moonMarsVeto.reason,
    };
  }

  const oosMaleficVeto = vetoOutOfSectMaleficToAscendant(chart, isDay);
  if (oosMaleficVeto.reject) {
    return {
      pass: false,
      isDayChart: isDay,
      rejectReason: oosMaleficVeto.reason,
    };
  }

  const outerVeto = vetoUranusPlutoHardAspects(chart);
  if (outerVeto.reject) {
    return {
      pass: false,
      isDayChart: isDay,
      rejectReason: outerVeto.reason,
    };
  }

  const mercuryRetroVeto = mercuryRetrogradeRisingVeto(ascSign, chart);
  if (mercuryRetroVeto) {
    return {
      pass: false,
      isDayChart: isDay,
      rejectReason: mercuryRetroVeto,
    };
  }

  const moonHouse = moon ? houseOfPlanet(moon, ascLon) : null;
  if (moonBadHouseShouldVeto(moon, moonHouse, chart, isDay)) {
    return {
      pass: false,
      isDayChart: isDay,
      rejectReason: "moon in bad house (unmitigated)",
    };
  }

  const ascRulerHouse = ascRuler ? houseOfPlanet(ascRuler, ascLon) : null;
  if (inBadHouse(ascRulerHouse)) {
    if (
      ascRuler &&
      hasVetoableHardMaleficAspect(
        ascRuler.longitude,
        ascRuler.speed,
        ascRuler.zodiacSignName,
        ascRulerName,
        chart,
        ascLon,
        isDay,
      )
    ) {
      return {
        pass: false,
        isDayChart: isDay,
        rejectReason: "asc ruler in bad house with hard malefic aspect",
      };
    }
  }

  if (
    ascRuler &&
    hasVetoableHardMaleficAspect(
      ascRuler.longitude,
      ascRuler.speed,
      ascRuler.zodiacSignName,
      ascRulerName,
      chart,
      ascLon,
      isDay,
    )
  ) {
    return {
      pass: false,
      isDayChart: isDay,
      rejectReason: "asc ruler within 3° of hard Mars or Saturn aspect",
    };
  }

  if (
    moon &&
    hasVetoableHardMaleficAspect(
      moon.longitude,
      moon.speed,
      moon.zodiacSignName,
      "moon",
      chart,
      ascLon,
      isDay,
    )
  ) {
    return {
      pass: false,
      isDayChart: isDay,
      rejectReason: "moon within 3° of hard Mars or Saturn aspect",
    };
  }

  if (isDay) {
    const jupiter = getPlanet(chart, "jupiter");
    const jupHouse = jupiter ? houseOfPlanet(jupiter, ascLon) : null;
    if (
      inBadHouse(jupHouse) &&
      !(
        jupiter?.longitude != null &&
        mitigatedByLightsMcOrBenefics(jupiter.longitude, chart, "jupiter")
      )
    ) {
      return { pass: false, isDayChart: true, rejectReason: "jupiter in bad house (day)" };
    }
    const mars = getPlanet(chart, "mars");
    const marsHouse = mars ? houseOfPlanet(mars, ascLon) : null;
    if (inAngularHouse(marsHouse)) {
      return { pass: false, isDayChart: true, rejectReason: "mars angular (day)" };
    }
  } else {
    const venus = getPlanet(chart, "venus");
    const venusSign = venus?.zodiacSignName;
    const venusDignity = venusSign ? getDignity("venus", venusSign) : null;
    if (venusDignity === "fall" || venusDignity === "detriment") {
      return {
        pass: false,
        isDayChart: false,
        rejectReason: "venus in fall or detriment (night chart)",
      };
    }
    const venusHouse = venus ? houseOfPlanet(venus, ascLon) : null;
    if (inBadHouse(venusHouse)) {
      return { pass: false, isDayChart: false, rejectReason: "venus in bad house (night)" };
    }
    const saturn = getPlanet(chart, "saturn");
    const saturnHouse = saturn ? houseOfPlanet(saturn, ascLon) : null;
    if (inAngularHouse(saturnHouse)) {
      return { pass: false, isDayChart: false, rejectReason: "saturn angular (night)" };
    }
  }

  return { pass: true, isDayChart: isDay };
}

module.exports = {
  passesElectionalChartFilters,
};
