const { signDistance, hasWholeSignAspect } = require("./chartHelpers");

function wholeSignHardAspect(signA, signB) {
  if (!signA || !signB) return null;
  const d = signDistance(signA, signB);
  if (d === 0) return "conjunct";
  if (d === 3) return "square";
  if (d === 6) return "opposition";
  return null;
}

function wholeSignSoftAspect(signA, signB) {
  if (!signA || !signB) return null;
  const d = signDistance(signA, signB);
  if (d === 2) return "sextile";
  if (d === 4) return "trine";
  return null;
}

function hasMutualReception(planetAName, signA, planetBName, signB, signRulerMap) {
  if (!signA || !signB || !planetAName || !planetBName) return false;
  const rulerA = signRulerMap[signA];
  const rulerB = signRulerMap[signB];
  return (
    rulerA === planetBName.toLowerCase() &&
    rulerB === planetAName.toLowerCase()
  );
}

module.exports = {
  wholeSignHardAspect,
  wholeSignSoftAspect,
  hasWholeSignAspect,
  hasMutualReception,
};
