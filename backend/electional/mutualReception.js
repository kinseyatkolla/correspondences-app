const { SIGN_RULER } = require("./constants");

/**
 * Planet A is in a sign ruled by B, and B is in a sign ruled by A.
 */
function isMutualReception(planetA, planetB, signByPlanet) {
  const signA = signByPlanet[planetA];
  const signB = signByPlanet[planetB];
  if (!signA || !signB) return false;
  if (SIGN_RULER[signA] !== planetB) return false;
  if (SIGN_RULER[signB] !== planetA) return false;
  return true;
}

/** Any pair among the given planets at this moment. */
function hasAnyMutualReception(planetNames, signByPlanet) {
  for (let i = 0; i < planetNames.length; i++) {
    for (let j = i + 1; j < planetNames.length; j++) {
      if (isMutualReception(planetNames[i], planetNames[j], signByPlanet)) {
        return true;
      }
    }
  }
  return false;
}

module.exports = {
  isMutualReception,
  hasAnyMutualReception,
};
