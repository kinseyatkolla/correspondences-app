// ============================================================================
// ASPECT UTILITIES
// ============================================================================
// Utility functions for calculating astrological aspects between planets

import { PlanetPosition } from "../services/api";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
export interface AspectResult {
  hasAspect: boolean;
  orb?: number; // Only for degree-based aspects
  exactDegrees?: number; // Exact degrees between planets
}

// ============================================================================
// CONSTANTS
// ============================================================================
const DEFAULT_ORB = 3; // Default orb of 3 degrees for aspects

// Zodiac sign order for calculations
const ZODIAC_SIGNS = [
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate the shortest angular distance between two degrees on a circle
 * @param degree1 First degree (0-360)
 * @param degree2 Second degree (0-360)
 * @returns The shortest distance between the two degrees
 */
const getAngularDistance = (degree1: number, degree2: number): number => {
  const diff = Math.abs(degree1 - degree2);
  return Math.min(diff, 360 - diff);
};

/**
 * Calculate the exact degrees between two planets
 * @param planet1 First planet position
 * @param planet2 Second planet position
 * @returns The exact degrees between the planets
 */
const getExactDegreesBetween = (
  planet1: PlanetPosition,
  planet2: PlanetPosition
): number => {
  return getAngularDistance(planet1.longitude, planet2.longitude);
};

/**
 * Check if two planets are within a specified orb
 * @param planet1 First planet position
 * @param planet2 Second planet position
 * @param targetDegrees Target aspect degrees (0, 60, 90, 120, 180)
 * @param orb Orb in degrees (default 3)
 * @returns AspectResult with aspect information
 */
const checkAspectWithOrb = (
  planet1: PlanetPosition,
  planet2: PlanetPosition,
  targetDegrees: number,
  orb: number = DEFAULT_ORB
): AspectResult => {
  const exactDegrees = getExactDegreesBetween(planet1, planet2);
  const orbFromTarget = Math.abs(exactDegrees - targetDegrees);

  return {
    hasAspect: orbFromTarget <= orb,
    orb: orbFromTarget,
    exactDegrees,
  };
};

/**
 * Get the zodiac sign index (0-11) for a given sign name
 * @param signName Name of the zodiac sign
 * @returns Index of the sign (0-11) or -1 if not found
 */
const getZodiacSignIndex = (signName: string): number => {
  return ZODIAC_SIGNS.indexOf(signName);
};

/**
 * Calculate the sign distance between two zodiac signs
 * @param sign1 First zodiac sign name
 * @param sign2 Second zodiac sign name
 * @returns The shortest distance between signs (0-6)
 */
const getSignDistance = (sign1: string, sign2: string): number => {
  const index1 = getZodiacSignIndex(sign1);
  const index2 = getZodiacSignIndex(sign2);

  if (index1 === -1 || index2 === -1) {
    return -1; // Invalid sign names
  }

  const diff = Math.abs(index1 - index2);
  return Math.min(diff, 12 - diff);
};

// ============================================================================
// DEGREE-BASED ASPECT FUNCTIONS (3-degree orb)
// ============================================================================

/**
 * Check if two planets are in conjunction (0° ± 3°)
 * @param planet1 First planet position
 * @param planet2 Second planet position
 * @param orb Orb in degrees (default 3)
 * @returns AspectResult with conjunction information
 */
export const checkForConjunct = (
  planet1: PlanetPosition,
  planet2: PlanetPosition,
  orb: number = DEFAULT_ORB
): AspectResult => {
  return checkAspectWithOrb(planet1, planet2, 0, orb);
};

/**
 * Check if two planets are in opposition (180° ± 3°)
 * @param planet1 First planet position
 * @param planet2 Second planet position
 * @param orb Orb in degrees (default 3)
 * @returns AspectResult with opposition information
 */
export const checkForOpposition = (
  planet1: PlanetPosition,
  planet2: PlanetPosition,
  orb: number = DEFAULT_ORB
): AspectResult => {
  return checkAspectWithOrb(planet1, planet2, 180, orb);
};

/**
 * Check if two planets are in square (90° ± 3°)
 * @param planet1 First planet position
 * @param planet2 Second planet position
 * @param orb Orb in degrees (default 3)
 * @returns AspectResult with square information
 */
export const checkForSquare = (
  planet1: PlanetPosition,
  planet2: PlanetPosition,
  orb: number = DEFAULT_ORB
): AspectResult => {
  return checkAspectWithOrb(planet1, planet2, 90, orb);
};

/**
 * Check if two planets are in trine (120° ± 3°)
 * @param planet1 First planet position
 * @param planet2 Second planet position
 * @param orb Orb in degrees (default 3)
 * @returns AspectResult with trine information
 */
export const checkForTrine = (
  planet1: PlanetPosition,
  planet2: PlanetPosition,
  orb: number = DEFAULT_ORB
): AspectResult => {
  return checkAspectWithOrb(planet1, planet2, 120, orb);
};

/**
 * Check if two planets are in sextile (60° ± 3°)
 * @param planet1 First planet position
 * @param planet2 Second planet position
 * @param orb Orb in degrees (default 3)
 * @returns AspectResult with sextile information
 */
export const checkForSextile = (
  planet1: PlanetPosition,
  planet2: PlanetPosition,
  orb: number = DEFAULT_ORB
): AspectResult => {
  return checkAspectWithOrb(planet1, planet2, 60, orb);
};

// ============================================================================
// WHOLE SIGN ASPECT FUNCTIONS
// ============================================================================

/**
 * Check if two planets are in the same zodiac sign (whole sign conjunction)
 * @param planet1 First planet position
 * @param planet2 Second planet position
 * @returns AspectResult with whole sign conjunction information
 */
export const checkForWholeSignConjunct = (
  planet1: PlanetPosition,
  planet2: PlanetPosition
): AspectResult => {
  const hasAspect = planet1.zodiacSignName === planet2.zodiacSignName;
  const exactDegrees = hasAspect
    ? getExactDegreesBetween(planet1, planet2)
    : undefined;

  return {
    hasAspect,
    exactDegrees,
  };
};

/**
 * Check if two planets are in opposite zodiac signs (whole sign opposition)
 * @param planet1 First planet position
 * @param planet2 Second planet position
 * @returns AspectResult with whole sign opposition information
 */
export const checkForWholeSignOpposition = (
  planet1: PlanetPosition,
  planet2: PlanetPosition
): AspectResult => {
  const signDistance = getSignDistance(
    planet1.zodiacSignName,
    planet2.zodiacSignName
  );
  const hasAspect = signDistance === 6;
  const exactDegrees = hasAspect
    ? getExactDegreesBetween(planet1, planet2)
    : undefined;

  return {
    hasAspect,
    exactDegrees,
  };
};

/**
 * Check if two planets are in square zodiac signs (whole sign square)
 * @param planet1 First planet position
 * @param planet2 Second planet position
 * @returns AspectResult with whole sign square information
 */
export const checkForWholeSignSquare = (
  planet1: PlanetPosition,
  planet2: PlanetPosition
): AspectResult => {
  const signDistance = getSignDistance(
    planet1.zodiacSignName,
    planet2.zodiacSignName
  );
  const hasAspect = signDistance === 3;
  const exactDegrees = hasAspect
    ? getExactDegreesBetween(planet1, planet2)
    : undefined;

  return {
    hasAspect,
    exactDegrees,
  };
};

/**
 * Check if two planets are in trine zodiac signs (whole sign trine)
 * @param planet1 First planet position
 * @param planet2 Second planet position
 * @returns AspectResult with whole sign trine information
 */
export const checkForWholeSignTrine = (
  planet1: PlanetPosition,
  planet2: PlanetPosition
): AspectResult => {
  const signDistance = getSignDistance(
    planet1.zodiacSignName,
    planet2.zodiacSignName
  );
  const hasAspect = signDistance === 4;
  const exactDegrees = hasAspect
    ? getExactDegreesBetween(planet1, planet2)
    : undefined;

  return {
    hasAspect,
    exactDegrees,
  };
};

/**
 * Check if two planets are in sextile zodiac signs (whole sign sextile)
 * @param planet1 First planet position
 * @param planet2 Second planet position
 * @returns AspectResult with whole sign sextile information
 */
export const checkForWholeSignSextile = (
  planet1: PlanetPosition,
  planet2: PlanetPosition
): AspectResult => {
  const signDistance = getSignDistance(
    planet1.zodiacSignName,
    planet2.zodiacSignName
  );
  const hasAspect = signDistance === 2;
  const exactDegrees = hasAspect
    ? getExactDegreesBetween(planet1, planet2)
    : undefined;

  return {
    hasAspect,
    exactDegrees,
  };
};

// ============================================================================
// UTILITY FUNCTIONS FOR MULTIPLE ASPECTS
// ============================================================================

/**
 * Check all degree-based aspects between two planets
 * @param planet1 First planet position
 * @param planet2 Second planet position
 * @param orb Orb in degrees (default 3)
 * @returns Object with all aspect results
 */
export const checkAllAspects = (
  planet1: PlanetPosition,
  planet2: PlanetPosition,
  orb: number = DEFAULT_ORB
) => {
  return {
    conjunct: checkForConjunct(planet1, planet2, orb),
    opposition: checkForOpposition(planet1, planet2, orb),
    square: checkForSquare(planet1, planet2, orb),
    trine: checkForTrine(planet1, planet2, orb),
    sextile: checkForSextile(planet1, planet2, orb),
  };
};

/**
 * Check all whole sign aspects between two planets
 * @param planet1 First planet position
 * @param planet2 Second planet position
 * @returns Object with all whole sign aspect results
 */
export const checkAllWholeSignAspects = (
  planet1: PlanetPosition,
  planet2: PlanetPosition
) => {
  return {
    conjunct: checkForWholeSignConjunct(planet1, planet2),
    opposition: checkForWholeSignOpposition(planet1, planet2),
    square: checkForWholeSignSquare(planet1, planet2),
    trine: checkForWholeSignTrine(planet1, planet2),
    sextile: checkForWholeSignSextile(planet1, planet2),
  };
};

/**
 * Get a list of all active aspects between two planets
 * @param planet1 First planet position
 * @param planet2 Second planet position
 * @param orb Orb in degrees (default 3)
 * @returns Array of aspect names that are active
 */
export const getActiveAspects = (
  planet1: PlanetPosition,
  planet2: PlanetPosition,
  orb: number = DEFAULT_ORB
): string[] => {
  const aspects = checkAllAspects(planet1, planet2, orb);
  const wholeSignAspects = checkAllWholeSignAspects(planet1, planet2);
  const activeAspects: string[] = [];

  Object.entries(aspects).forEach(([aspectName, result]) => {
    if (result.hasAspect) {
      activeAspects.push(aspectName);
    }
  });

  // If orb is 3 degrees or less, also include whole sign aspects
  if (orb <= 3) {
    Object.entries(wholeSignAspects).forEach(([aspectName, result]) => {
      if (result.hasAspect) {
        const wholeSignAspectName = `whole sign ${aspectName}`;
        // Only add if not already in the list
        if (!activeAspects.includes(wholeSignAspectName)) {
          activeAspects.push(wholeSignAspectName);
        }
      }
    });
  }

  return activeAspects;
};

/**
 * Get a list of all active whole sign aspects between two planets
 * @param planet1 First planet position
 * @param planet2 Second planet position
 * @returns Array of whole sign aspect names that are active
 */
export const getActiveWholeSignAspects = (
  planet1: PlanetPosition,
  planet2: PlanetPosition
): string[] => {
  const aspects = checkAllWholeSignAspects(planet1, planet2);
  const activeAspects: string[] = [];

  Object.entries(aspects).forEach(([aspectName, result]) => {
    if (result.hasAspect) {
      activeAspects.push(`whole sign ${aspectName}`);
    }
  });

  return activeAspects;
};

// ============================================================================
// ESSENTIAL DIGNITIES
// ============================================================================

export interface EssentialDignity {
  type: "domicile" | "exaltation" | "detriment" | "fall";
  planet: string;
  sign: string;
}

export interface DignityResult {
  hasDignity: boolean;
  dignities: EssentialDignity[];
}

// Essential dignities mapping
const ESSENTIAL_DIGNITIES: EssentialDignity[] = [
  // Domiciles (Rulerships)
  { type: "domicile", planet: "sun", sign: "Leo" },
  { type: "domicile", planet: "moon", sign: "Cancer" },
  { type: "domicile", planet: "mercury", sign: "Gemini" },
  { type: "domicile", planet: "mercury", sign: "Virgo" },
  { type: "domicile", planet: "venus", sign: "Taurus" },
  { type: "domicile", planet: "venus", sign: "Libra" },
  { type: "domicile", planet: "mars", sign: "Aries" },
  { type: "domicile", planet: "mars", sign: "Scorpio" },
  { type: "domicile", planet: "jupiter", sign: "Sagittarius" },
  { type: "domicile", planet: "jupiter", sign: "Pisces" },
  { type: "domicile", planet: "saturn", sign: "Capricorn" },
  { type: "domicile", planet: "saturn", sign: "Aquarius" },

  // Exaltations
  { type: "exaltation", planet: "sun", sign: "Aries" },
  { type: "exaltation", planet: "moon", sign: "Taurus" },
  { type: "exaltation", planet: "mercury", sign: "Virgo" },
  { type: "exaltation", planet: "venus", sign: "Pisces" },
  { type: "exaltation", planet: "mars", sign: "Capricorn" },
  { type: "exaltation", planet: "jupiter", sign: "Cancer" },
  { type: "exaltation", planet: "saturn", sign: "Libra" },

  // Detriments (opposite of domicile)
  { type: "detriment", planet: "sun", sign: "Aquarius" },
  { type: "detriment", planet: "moon", sign: "Capricorn" },
  { type: "detriment", planet: "mercury", sign: "Sagittarius" },
  { type: "detriment", planet: "mercury", sign: "Pisces" },
  { type: "detriment", planet: "venus", sign: "Scorpio" },
  { type: "detriment", planet: "venus", sign: "Aries" },
  { type: "detriment", planet: "mars", sign: "Libra" },
  { type: "detriment", planet: "mars", sign: "Taurus" },
  { type: "detriment", planet: "jupiter", sign: "Gemini" },
  { type: "detriment", planet: "jupiter", sign: "Virgo" },
  { type: "detriment", planet: "saturn", sign: "Cancer" },
  { type: "detriment", planet: "saturn", sign: "Leo" },

  // Falls (opposite of exaltation)
  { type: "fall", planet: "sun", sign: "Libra" },
  { type: "fall", planet: "moon", sign: "Scorpio" },
  { type: "fall", planet: "mercury", sign: "Pisces" },
  { type: "fall", planet: "venus", sign: "Virgo" },
  { type: "fall", planet: "mars", sign: "Cancer" },
  { type: "fall", planet: "jupiter", sign: "Capricorn" },
  { type: "fall", planet: "saturn", sign: "Aries" },
];

/**
 * Check essential dignities for a planet
 * @param planet Planet position object
 * @param planetName Name of the planet (sun, moon, mercury, etc.)
 * @returns DignityResult with dignity information
 */
export const checkEssentialDignities = (
  planet: PlanetPosition,
  planetName: string
): DignityResult => {
  const planetKey = planetName.toLowerCase();
  const currentSign = planet.zodiacSignName;

  const activeDignities = ESSENTIAL_DIGNITIES.filter(
    (dignity) => dignity.planet === planetKey && dignity.sign === currentSign
  );

  return {
    hasDignity: activeDignities.length > 0,
    dignities: activeDignities,
  };
};
