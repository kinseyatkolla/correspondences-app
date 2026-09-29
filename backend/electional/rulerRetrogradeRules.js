/**
 * Rising-sign rules when traditional rulers are retrograde.
 */

const { getPlanet } = require("./chartHelpers");

const MERCURY_RISING_SIGNS = new Set(["Gemini", "Virgo"]);
const VENUS_RISING_SIGNS = new Set(["Taurus", "Libra"]);
const MARS_RISING_SIGNS = new Set(["Aries", "Scorpio"]);

/** Hard veto: Mercury retrograde + Mercury-ruled rising sign. */
function mercuryRetrogradeRisingVeto(ascSign, chart) {
  if (!ascSign || !MERCURY_RISING_SIGNS.has(ascSign)) return null;
  const mercury = getPlanet(chart, "mercury");
  if (mercury?.isRetrograde) {
    return "Mercury retrograde with Gemini or Virgo rising";
  }
  return null;
}

/** Score penalty id/label when Venus retrograde + Venus-ruled rising. */
function venusRetrogradeRisingPenalty(ascSign, chart) {
  if (!ascSign || !VENUS_RISING_SIGNS.has(ascSign)) return null;
  const venus = getPlanet(chart, "venus");
  if (venus?.isRetrograde) {
    return {
      id: "venus-retro-rising",
      delta: -25,
      label: "Venus retrograde with Taurus or Libra rising",
    };
  }
  return null;
}

/** Score penalty when Mars retrograde + Mars-ruled rising. */
function marsRetrogradeRisingPenalty(ascSign, chart) {
  if (!ascSign || !MARS_RISING_SIGNS.has(ascSign)) return null;
  const mars = getPlanet(chart, "mars");
  if (mars?.isRetrograde) {
    return {
      id: "mars-retro-rising",
      delta: -25,
      label: "Mars retrograde with Aries or Scorpio rising",
    };
  }
  return null;
}

module.exports = {
  mercuryRetrogradeRisingVeto,
  venusRetrogradeRisingPenalty,
  marsRetrogradeRisingPenalty,
  MERCURY_RISING_SIGNS,
  VENUS_RISING_SIGNS,
  MARS_RISING_SIGNS,
};
