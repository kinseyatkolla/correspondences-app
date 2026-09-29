/** Shared tropical zodiac and traditional planet sets for electional logic. */

const SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

const MOVABLE_SIGNS = new Set(["Aries", "Cancer", "Libra", "Capricorn"]);
const FIXED_SIGNS = new Set(["Taurus", "Leo", "Scorpio", "Aquarius"]);
const DOUBLE_SIGNS = new Set(["Gemini", "Virgo", "Sagittarius", "Pisces"]);

const TRADITIONAL_PLANETS = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
];

const BENEFICS = new Set(["venus", "jupiter"]);
const MALEFICS = new Set(["mars", "saturn"]);

const ASPECT_ANGLES = {
  conjunct: 0,
  sextile: 60,
  square: 90,
  trine: 120,
  opposition: 180,
};

const SIGN_RULER = {
  Aries: "mars",
  Taurus: "venus",
  Gemini: "mercury",
  Cancer: "moon",
  Leo: "sun",
  Virgo: "mercury",
  Libra: "venus",
  Scorpio: "mars",
  Sagittarius: "jupiter",
  Capricorn: "saturn",
  Aquarius: "saturn",
  Pisces: "jupiter",
};

const EXALTATION_SIGN = {
  sun: "Aries",
  moon: "Taurus",
  mercury: "Virgo",
  venus: "Pisces",
  mars: "Capricorn",
  jupiter: "Cancer",
  saturn: "Libra",
};

const DETRIMENT_SIGN = {
  sun: "Aquarius",
  moon: "Capricorn",
  mercury: "Sagittarius",
  venus: "Aries",
  mars: "Libra",
  jupiter: "Capricorn",
  saturn: "Cancer",
};

const FALL_SIGN = {
  sun: "Libra",
  moon: "Scorpio",
  mercury: "Pisces",
  venus: "Virgo",
  mars: "Cancer",
  jupiter: "Capricorn",
  saturn: "Aries",
};

module.exports = {
  SIGNS,
  MOVABLE_SIGNS,
  FIXED_SIGNS,
  DOUBLE_SIGNS,
  TRADITIONAL_PLANETS,
  BENEFICS,
  MALEFICS,
  ASPECT_ANGLES,
  SIGN_RULER,
  EXALTATION_SIGN,
  DETRIMENT_SIGN,
  FALL_SIGN,
};
