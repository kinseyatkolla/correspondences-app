const { signIndex, signDistance } = require("../../electional/chartHelpers");
const { SIGNS } = require("./config");

/** Whole-sign house number of `sign` counted from `anchorSign` (1 = conjunction). */
function wholeSignHouseFromSign(sign, anchorSign) {
  const a = signIndex(anchorSign);
  const s = signIndex(sign);
  return ((s - a + 12) % 12) + 1;
}

function angularityFromAnchor(sign, anchorSign) {
  const house = wholeSignHouseFromSign(sign, anchorSign);
  const isAngular = house === 1 || house === 4 || house === 7 || house === 10;
  const isCulminating = house === 10;
  let classification = "cadent";
  if (isAngular) classification = "angular";
  else if ([2, 5, 8, 11].includes(house)) classification = "succedent";
  return {
    wholeSignHouseFromAnchor: house,
    isAngularFromAnchor: isAngular,
    isCulminatingFromAnchor: isCulminating,
    angularityClassFromAnchor: classification,
  };
}

function isCulminatingFromAnchor(periodSign, anchorSign) {
  return wholeSignHouseFromSign(periodSign, anchorSign) === 10;
}

function periodAngularityMetadata(periodSign, fortuneSign, releasingLotSign) {
  const fromFortune = angularityFromAnchor(periodSign, fortuneSign);
  const fromLot = angularityFromAnchor(periodSign, releasingLotSign);
  return {
    fromFortune,
    fromReleasingLot: fromLot,
    isCulminatingFromFortune: fromFortune.isCulminatingFromAnchor,
    isAngularFromReleasingLot: fromLot.isAngularFromAnchor,
  };
}

/** Peak (10th whole-sign house) relative to the parent period sign — used for L2+ Culm. labels. */
function culminatingFlagForChildPeriod(periodSign, parentSign) {
  return isCulminatingFromAnchor(periodSign, parentSign);
}

module.exports = {
  wholeSignHouseFromSign,
  angularityFromAnchor,
  isCulminatingFromAnchor,
  culminatingFlagForChildPeriod,
  periodAngularityMetadata,
  signDistance,
  SIGNS,
};
