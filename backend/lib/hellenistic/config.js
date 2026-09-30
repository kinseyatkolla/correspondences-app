/** Zodiacal releasing timing and sign → minor-year lengths (full cycle = 211). */

const { SIGNS } = require("../../electional/constants");

const ZR_YEAR_LENGTH_DAYS = 360;

const SIGN_MINOR_YEARS = {
  Aries: 15,
  Taurus: 8,
  Gemini: 20,
  Cancer: 25,
  Leo: 19,
  Virgo: 20,
  Libra: 8,
  Scorpio: 15,
  Sagittarius: 12,
  Capricorn: 27,
  Aquarius: 30,
  Pisces: 12,
};

const FULL_CYCLE_UNITS = Object.values(SIGN_MINOR_YEARS).reduce((a, b) => a + b, 0);

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

module.exports = {
  SIGNS,
  ZR_YEAR_LENGTH_DAYS,
  SIGN_MINOR_YEARS,
  FULL_CYCLE_UNITS,
  DAY_MS,
  HOUR_MS,
};
