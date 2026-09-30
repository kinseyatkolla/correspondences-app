import { getZodiacSymbols } from "./physisSymbolMap";

const NAME_TO_KEY: Record<string, string> = {
  Aries: "a",
  Taurus: "s",
  Gemini: "d",
  Cancer: "f",
  Leo: "g",
  Virgo: "h",
  Libra: "j",
  Scorpio: "k",
  Sagittarius: "l",
  Capricorn: ";",
  Aquarius: "'",
  Pisces: "z",
};

const symbols = getZodiacSymbols();

export function zodiacSignToUnicodeEmoji(signName: string): string {
  const key = NAME_TO_KEY[signName];
  if (!key) return "★";
  return symbols[key] || "★";
}
