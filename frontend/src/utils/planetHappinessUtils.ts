// ============================================================================
// PLANET HAPPINESS UTILITIES
// ============================================================================
// Utility functions for determining how "astrologically happy" each planet is
// based on various positive and negative factors

import { BirthChart, PlanetPosition } from "../services/api";
import { checkAllAspects } from "./aspectUtils";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

// Generic chart type that works with both BirthChart and CurrentChart
interface GenericChart {
  planets: Record<string, PlanetPosition>;
  houses?: {
    ascendant?: number;
    ascendantSign?: string;
    ascendantDegree?: string;
    [key: string]: any;
  };
}

export type HappinessCheck = (
  chart: GenericChart,
  focusPlanet: PlanetPosition,
  focusPlanetName: string
) => boolean;

// ============================================================================
// PLANET RULERSHIPS
// ============================================================================

const PLANET_RULERSHIPS: Record<string, string[]> = {
  sun: ["Leo"],
  moon: ["Cancer"],
  mercury: ["Gemini", "Virgo"],
  venus: ["Taurus", "Libra"],
  mars: ["Aries", "Scorpio"],
  jupiter: ["Sagittarius", "Pisces"],
  saturn: ["Capricorn", "Aquarius"],
  uranus: ["Aquarius"],
  neptune: ["Pisces"],
  pluto: ["Scorpio"],
};

/**
 * Get the traditional ruler of a zodiac sign (ignoring outer planets)
 * Returns the planet name (e.g., "sun", "moon") or null if no ruler found
 */
export function getSignRuler(signName: string): string | null {
  // Ignore uranus, neptune, and pluto for traditional rulerships
  const traditionalRulers = [
    "sun",
    "moon",
    "mercury",
    "venus",
    "mars",
    "jupiter",
    "saturn",
  ];

  for (const planet of traditionalRulers) {
    const ruledSigns = PLANET_RULERSHIPS[planet];
    if (ruledSigns && ruledSigns.includes(signName)) {
      return planet;
    }
  }

  return null;
}

// ============================================================================
// PLANET EXALTATIONS
// ============================================================================

const PLANET_EXALTATIONS: Record<string, string[]> = {
  sun: ["Aries"],
  moon: ["Taurus"],
  mercury: ["Virgo"],
  venus: ["Pisces"],
  mars: ["Capricorn"],
  jupiter: ["Cancer"],
  saturn: ["Libra"],
};

// ============================================================================
// PLANET FALLS
// ============================================================================

const PLANET_FALLS: Record<string, string[]> = {
  sun: ["Libra"],
  moon: ["Scorpio"],
  mercury: ["Pisces"],
  venus: ["Virgo"],
  mars: ["Cancer"],
  jupiter: ["Capricorn"],
  saturn: ["Aries"],
};

// ============================================================================
// NEGATIVE CHECKS (CONS)
// ============================================================================

/**
 * Check Planetary EXALTATIONS
 */
export const isPlanetaryFall: HappinessCheck = (
  chart,
  focusPlanet,
  focusPlanetName
) => {
  // Doesn't apply to outer planets (Uranus, Neptune, Pluto) or North Node
  if (["uranus", "neptune", "pluto", "northNode"].includes(focusPlanetName))
    return false;

  // Check if the focus planet is in one of its own ruled signs
  const fallsSigns = PLANET_FALLS[focusPlanetName];
  if (!fallsSigns) return false;

  const focusPlanetSign = focusPlanet.zodiacSignName;
  return fallsSigns.includes(focusPlanetSign);
};

/**
 * Check if planet is in hard aspect (conjunct, opposition, or square) with Mars
 * Returns false for Mars itself (a planet can't aspect itself)
 */
export const hasHardAspectWithMars: HappinessCheck = (
  chart,
  focusPlanet,
  focusPlanetName
) => {
  // Doesn't apply to Mars itself
  if (focusPlanetName === "mars") return false;

  const mars = chart.planets.mars;
  if (!mars || mars.error) return false;

  const aspects = checkAllAspects(focusPlanet, mars, 7);
  return (
    aspects.conjunct?.hasAspect ||
    aspects.opposition?.hasAspect ||
    aspects.square?.hasAspect
  );
};

/**
 * Check if planet is in hard aspect (conjunct, opposition, or square) with Saturn
 * Returns false for Saturn itself (a planet can't aspect itself)
 */
export const hasHardAspectWithSaturn: HappinessCheck = (
  chart,
  focusPlanet,
  focusPlanetName
) => {
  // Doesn't apply to Saturn itself
  if (focusPlanetName === "saturn") return false;

  const saturn = chart.planets.saturn;
  if (!saturn || saturn.error) return false;

  const aspects = checkAllAspects(focusPlanet, saturn, 7);
  return (
    aspects.conjunct?.hasAspect ||
    aspects.opposition?.hasAspect ||
    aspects.square?.hasAspect
  );
};

// ============================================================================
// POSITIVE CHECKS (PROS)
// ============================================================================

/**
 * Check Planetary Rulership
 */
export const isPlanetaryRuler: HappinessCheck = (
  chart,
  focusPlanet,
  focusPlanetName
) => {
  // Doesn't apply to outer planets (Uranus, Neptune, Pluto) or North Node
  if (["uranus", "neptune", "pluto", "northNode"].includes(focusPlanetName))
    return false;

  // Check if the focus planet is in one of its own ruled signs
  const ruledSigns = PLANET_RULERSHIPS[focusPlanetName];
  if (!ruledSigns) return false;

  const focusPlanetSign = focusPlanet.zodiacSignName;
  return ruledSigns.includes(focusPlanetSign);
};
/**
 * Check Planetary EXALTATIONS
 */
export const isPlanetaryExaltation: HappinessCheck = (
  chart,
  focusPlanet,
  focusPlanetName
) => {
  // Doesn't apply to outer planets (Uranus, Neptune, Pluto) or North Node
  if (["uranus", "neptune", "pluto", "northNode"].includes(focusPlanetName))
    return false;

  // Check if the focus planet is in one of its own ruled signs
  const exaultedSigns = PLANET_EXALTATIONS[focusPlanetName];
  if (!exaultedSigns) return false;

  const focusPlanetSign = focusPlanet.zodiacSignName;
  return exaultedSigns.includes(focusPlanetSign);
};

/**
 * Check if planet is in any aspect with Jupiter
 * Returns false for Jupiter itself (a planet can't aspect itself)
 */
export const hasAspectWithJupiter: HappinessCheck = (
  chart,
  focusPlanet,
  focusPlanetName
) => {
  // Doesn't apply to Jupiter itself
  if (focusPlanetName === "jupiter") return false;

  const jupiter = chart.planets.jupiter;
  if (!jupiter || jupiter.error) return false;

  const aspects = checkAllAspects(focusPlanet, jupiter, 7);
  return Object.values(aspects).some((aspect) => aspect.hasAspect);
};

/**
 * Check if planet is in any aspect with Venus
 * Returns false for Venus itself (a planet can't aspect itself)
 */
export const hasAspectWithVenus: HappinessCheck = (
  chart,
  focusPlanet,
  focusPlanetName
) => {
  // Doesn't apply to Venus itself
  if (focusPlanetName === "venus") return false;

  const venus = chart.planets.venus;
  if (!venus || venus.error) return false;

  const aspects = checkAllAspects(focusPlanet, venus, 7);
  return Object.values(aspects).some((aspect) => aspect.hasAspect);
};

// ============================================================================
// CHECK LISTS
// ============================================================================

// Group all negative checks (cons)
const CONS: HappinessCheck[] = [
  isPlanetaryFall,
  hasHardAspectWithMars,
  hasHardAspectWithSaturn,
];

// Group all positive checks (pros)
const PROS: HappinessCheck[] = [
  isPlanetaryRuler,
  isPlanetaryExaltation,
  hasAspectWithJupiter,
  hasAspectWithVenus,
];

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Calculate planet happiness based on pros and cons
 * Returns an emoji representing the planet's astrological happiness level
 */
export function getPlanetHappinessEmoji(
  chart: GenericChart,
  focusPlanet: PlanetPosition | null,
  focusPlanetName: string
): string {
  if (!focusPlanet || focusPlanet.error) {
    return "😐"; // Neutral for missing/invalid data
  }

  // Count pros and cons
  let proCount = 0;
  let conCount = 0;

  // Check all pros
  for (const proCheck of PROS) {
    try {
      if (proCheck(chart, focusPlanet, focusPlanetName)) {
        proCount++;
      }
    } catch (error) {
      console.error(`Error in pro check for ${focusPlanetName}:`, error);
    }
  }

  // Check all cons
  for (const conCheck of CONS) {
    try {
      if (conCheck(chart, focusPlanet, focusPlanetName)) {
        conCount++;
      }
    } catch (error) {
      console.error(`Error in con check for ${focusPlanetName}:`, error);
    }
  }

  // Determine emoji based on pro/con balance
  // Pros balance out negatives, but only negatives make a planet unhappy
  // A planet with no pros and no negatives is neutral

  if (conCount === 0) {
    // No negatives - pros determine happiness level
    if (proCount >= 3) return "🤩"; // Elated - many pros, no cons
    if (proCount >= 1) return "😊"; // Happy - some pros, no cons
    return "😐"; // Neutral - no pros, no cons
  } else {
    // Has negatives - pros balance them out
    const netHappiness = proCount - conCount;

    if (netHappiness >= 1) return "😊"; // Happy - pros outweigh cons
    if (netHappiness === 0) return "😐"; // Neutral - pros balance cons
    if (netHappiness === -1) return "😔"; // Sad - one more con than pro
    return "😰"; // Anguished - significantly more cons than pros
  }
}
