/** Traditional essential dignities and debilities by sign (tropical). */

const SIGN_ESSENTIAL_DIGNITIES: Record<
  string,
  {
    ruledBy: string;
    detriment: string;
    exaltation: string | null;
    fall: string | null;
  }
> = {
  Aries: {
    ruledBy: "Mars",
    detriment: "Venus",
    exaltation: "Sun",
    fall: "Saturn",
  },
  Taurus: {
    ruledBy: "Venus",
    detriment: "Mars",
    exaltation: "Moon",
    fall: null,
  },
  Gemini: {
    ruledBy: "Mercury",
    detriment: "Jupiter",
    exaltation: null,
    fall: null,
  },
  Cancer: {
    ruledBy: "Moon",
    detriment: "Saturn",
    exaltation: "Jupiter",
    fall: "Mars",
  },
  Leo: {
    ruledBy: "Sun",
    detriment: "Saturn",
    exaltation: null,
    fall: null,
  },
  Virgo: {
    ruledBy: "Mercury",
    detriment: "Jupiter",
    exaltation: "Mercury",
    fall: "Venus",
  },
  Libra: {
    ruledBy: "Venus",
    detriment: "Mars",
    exaltation: "Saturn",
    fall: "Sun",
  },
  Scorpio: {
    ruledBy: "Mars",
    detriment: "Venus",
    exaltation: null,
    fall: "Moon",
  },
  Sagittarius: {
    ruledBy: "Jupiter",
    detriment: "Mercury",
    exaltation: null,
    fall: null,
  },
  Capricorn: {
    ruledBy: "Saturn",
    detriment: "Moon",
    exaltation: "Mars",
    fall: "Jupiter",
  },
  Aquarius: {
    ruledBy: "Saturn",
    detriment: "Sun",
    exaltation: null,
    fall: null,
  },
  Pisces: {
    ruledBy: "Jupiter",
    detriment: "Mercury",
    exaltation: "Venus",
    fall: "Mercury",
  },
};

const DIGNITY_PRIORITY = [
  "ruledBy",
  "exaltation",
  "detriment",
  "fall",
] as const;

const DIGNITY_LABELS = {
  ruledBy: "RULERSHIP",
  exaltation: "EXALTATION",
  detriment: "DETRIMENT",
  fall: "FALL",
} as const;

/** Hellenistic maximum exaltation degrees (tropical, within sign). */
const HELLENISTIC_EXALTATION_MAX: Record<
  string,
  { sign: string; degree: number }
> = {
  Sun: { sign: "Aries", degree: 19 },
  Moon: { sign: "Taurus", degree: 3 },
  Mercury: { sign: "Virgo", degree: 15 },
  Venus: { sign: "Pisces", degree: 27 },
  Mars: { sign: "Capricorn", degree: 28 },
  Jupiter: { sign: "Cancer", degree: 15 },
  Saturn: { sign: "Libra", degree: 21 },
};

const HELLENISTIC_MAX_EXALTATION_ORB_DEG = 1;

function titleCasePlanetName(planetName: string): string {
  const trimmed = String(planetName || "").trim();
  if (!trimmed) return "";
  if (trimmed.toLowerCase() === "northnode") return "N. Node";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * @param planetName e.g. "Mars", "moon"
 * @param signName e.g. "Aries"
 * @returns ALL CAPS dignity label, or "" if none applies
 */
export function planetEssentialDignityLabel(
  planetName: string,
  signName: string,
): string {
  const planet = titleCasePlanetName(planetName);
  const sign = String(signName || "").trim();
  if (!planet || !sign) {
    return "";
  }

  const dignities = SIGN_ESSENTIAL_DIGNITIES[sign];
  if (!dignities) {
    return "";
  }

  for (const key of DIGNITY_PRIORITY) {
    if (dignities[key] === planet) {
      return DIGNITY_LABELS[key];
    }
  }

  return "";
}

/**
 * Like planetEssentialDignityLabel, but upgrades EXALTATION to
 * "EXALTATION (MAX 19°)" when within ±1° of the Hellenistic exaltation degree.
 */
export function planetEssentialDignityLabelWithHellenisticMaxExaltation(
  planetName: string,
  signName: string,
  degreeInSign: number | null | undefined,
): string {
  const base = planetEssentialDignityLabel(planetName, signName);
  if (base !== DIGNITY_LABELS.exaltation) {
    return base;
  }

  const planet = titleCasePlanetName(planetName);
  const sign = String(signName || "").trim();
  const degree = Number(degreeInSign);
  if (!planet || !sign || !Number.isFinite(degree)) {
    return base;
  }

  const maxExalt = HELLENISTIC_EXALTATION_MAX[planet];
  if (!maxExalt || maxExalt.sign !== sign) {
    return base;
  }

  if (Math.abs(degree - maxExalt.degree) <= HELLENISTIC_MAX_EXALTATION_ORB_DEG) {
    return `EXALTATION (MAX ${maxExalt.degree}°)`;
  }

  return base;
}
