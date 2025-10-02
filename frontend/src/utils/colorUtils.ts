// ============================================================================
// COLOR UTILITIES
// ============================================================================
// Utility functions for aspect and zodiac sign color mappings

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
export interface ColorStyle {
  color: string;
}

// ============================================================================
// COLOR CONSTANTS
// ============================================================================
export const COLORS = {
  // Aspect colors
  aspectRed: "#ff6b6b", // Red for challenging aspects
  aspectBlue: "#00bfff", // Robin cerulean blue for harmonious aspects
  aspectGreen: "#51cf66", // Green for opportunity aspects

  // Element colors
  fire: "#ff6b6b", // Red for fire signs
  water: "#00bfff", // Blue for water signs
  earth: "#51cf66", // Green for earth signs
  air: "#f9c74f", // Soft yellow for air signs

  // Default
  default: "#e6e6fa", // Default white text
} as const;

// ============================================================================
// ZODIAC SIGN MAPPINGS
// ============================================================================
const FIRE_SIGNS = ["Aries", "Leo", "Sagittarius"] as const;
const WATER_SIGNS = ["Cancer", "Scorpio", "Pisces"] as const;
const EARTH_SIGNS = ["Taurus", "Virgo", "Capricorn"] as const;
const AIR_SIGNS = ["Gemini", "Libra", "Aquarius"] as const;

const CHALLENGING_ASPECTS = ["opposition", "square", "conjunct"] as const;
const HARMONIOUS_ASPECTS = ["trine"] as const;
const OPPORTUNITY_ASPECTS = ["sextile"] as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the color style for an aspect name
 * @param aspectName The name of the aspect
 * @returns ColorStyle object with the appropriate color
 */
export const getAspectColorStyle = (aspectName: string): ColorStyle => {
  if (CHALLENGING_ASPECTS.includes(aspectName as any)) {
    return { color: COLORS.aspectRed };
  }
  if (HARMONIOUS_ASPECTS.includes(aspectName as any)) {
    return { color: COLORS.aspectBlue };
  }
  if (OPPORTUNITY_ASPECTS.includes(aspectName as any)) {
    return { color: COLORS.aspectGreen };
  }
  return { color: COLORS.default };
};

/**
 * Get the color style for a zodiac sign based on its element
 * @param signName The name of the zodiac sign
 * @returns ColorStyle object with the appropriate element color
 */
export const getZodiacColorStyle = (signName: string): ColorStyle => {
  if (FIRE_SIGNS.includes(signName as any)) {
    return { color: COLORS.fire };
  }
  if (WATER_SIGNS.includes(signName as any)) {
    return { color: COLORS.water };
  }
  if (EARTH_SIGNS.includes(signName as any)) {
    return { color: COLORS.earth };
  }
  if (AIR_SIGNS.includes(signName as any)) {
    return { color: COLORS.air };
  }
  return { color: COLORS.default };
};

/**
 * Get the element name for a zodiac sign
 * @param signName The name of the zodiac sign
 * @returns The element name (fire, water, earth, air) or null if unknown
 */
export const getZodiacElement = (signName: string): string | null => {
  if (FIRE_SIGNS.includes(signName as any)) return "fire";
  if (WATER_SIGNS.includes(signName as any)) return "water";
  if (EARTH_SIGNS.includes(signName as any)) return "earth";
  if (AIR_SIGNS.includes(signName as any)) return "air";
  return null;
};

/**
 * Get the aspect category for an aspect name
 * @param aspectName The name of the aspect
 * @returns The category (challenging, harmonious, opportunity) or null if unknown
 */
export const getAspectCategory = (aspectName: string): string | null => {
  if (CHALLENGING_ASPECTS.includes(aspectName as any)) return "challenging";
  if (HARMONIOUS_ASPECTS.includes(aspectName as any)) return "harmonious";
  if (OPPORTUNITY_ASPECTS.includes(aspectName as any)) return "opportunity";
  return null;
};

// ============================================================================
// STYLE OBJECTS FOR REACT NATIVE
// ============================================================================
export const aspectColorStyles = {
  aspectRed: { color: COLORS.aspectRed },
  aspectBlue: { color: COLORS.aspectBlue },
  aspectGreen: { color: COLORS.aspectGreen },
};

export const zodiacColorStyles = {
  fireSign: { color: COLORS.fire },
  waterSign: { color: COLORS.water },
  earthSign: { color: COLORS.earth },
  airSign: { color: COLORS.air },
};
