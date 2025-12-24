/**
 * PhysisV2 Commercial Font Symbol Map
 * Maps keyboard characters to astrological symbols in the PhysisV2 font
 */

export interface SymbolMap {
  [key: string]: string;
}

// export const physisSymbolMap: SymbolMap = {
//   // Planets
//   r: "☉", // Sun
//   q: "☽", // Moon
//   w: "☿", // Mercury
//   e: "♀", // Venus
//   t: "♂", // Mars
//   y: "♃", // Jupiter
//   u: "♄", // Saturn
//   i: "♅", // Uranus
//   o: "♆", // Neptune
//   p: "♇", // Pluto

//   // Zodiac Signs
//   a: "♈", // Aries
//   s: "♉", // Taurus
//   d: "♊", // Gemini
//   f: "♋", // Cancer
//   g: "♌", // Leo
//   h: "♍", // Virgo
//   j: "♎", // Libra
//   k: "♏", // Scorpio
//   l: "♐", // Sagittarius
//   ";": "♑", // Capricorn
//   "'": "♒", // Aquarius
//   z: "♓", // Pisces

//   // Numbers for aspects
//   "0": "0",
//   "1": "1",
//   "2": "2",
//   "3": "3",
//   "4": "4",
//   "5": "5",
//   "6": "6",
//   "7": "7",
//   "8": "8",
//   "9": "9",

//   // Elements
//   "=": "🌊", // Water element
//   "+": "🌍", // Earth element
//   "`": "🔥", // Fire element
//   "~": "💨", // Air element

//   // Chart Points
//   "#": "DC", // Descendant
//   "@": "MC", // Midheaven
//   "!": "AC", // Ascendant
//   $: "IC", // Imum Coeli
//   "[": "SN", // South Node
//   "]": "NN", // North Node
// };

/**
 * Get all planet symbols with names
 */
export const getPlanetSymbols = (): { [key: string]: string } => {
  return {
    r: "☉", // Sun
    q: "☽", // Moon
    w: "☿", // Mercury
    e: "♀", // Venus
    t: "♂", // Mars
    y: "♃", // Jupiter
    u: "♄", // Saturn
    i: "♅", // Uranus
    o: "♆", // Neptune
    p: "♇", // Pluto
    T: "⚷", // Chiron
  };
};

/**
 * Get planet names for display
 */
export const getPlanetNames = (): { [key: string]: string } => {
  return {
    r: "Sun",
    q: "Moon",
    w: "Mercury",
    e: "Venus",
    t: "Mars",
    y: "Jupiter",
    u: "Saturn",
    i: "Uranus",
    o: "Neptune",
    p: "Pluto",
    T: "Chiron",
  };
};

/**
 * Get planet keys from names (reverse mapping)
 */
export const getPlanetKeysFromNames = (): { [key: string]: string } => {
  return {
    Sun: "r",
    Moon: "q",
    Mercury: "w",
    Venus: "e",
    Mars: "t",
    Jupiter: "y",
    Saturn: "u",
    Uranus: "i",
    Neptune: "o",
    Pluto: "p",
    Chiron: "T",
    "N. Node": "]",
    "North Node": "]",
    NorthNode: "]",
    SouthNode: "[",
    Ascendant: "!",
  };
};

/**
 * Get all zodiac symbols
 */
export const getZodiacSymbols = (): { [key: string]: string } => {
  return {
    a: "♈", // Aries
    s: "♉", // Taurus
    d: "♊", // Gemini
    f: "♋", // Cancer
    g: "♌", // Leo
    h: "♍", // Virgo
    j: "♎", // Libra
    k: "♏", // Scorpio
    l: "♐", // Sagittarius
    ";": "♑", // Capricorn
    "'": "♒", // Aquarius
    z: "♓", // Pisces
  };
};

/**
 * Get zodiac names for display
 */
export const getZodiacNames = (): { [key: string]: string } => {
  return {
    a: "Aries",
    s: "Taurus",
    d: "Gemini",
    f: "Cancer",
    g: "Leo",
    h: "Virgo",
    j: "Libra",
    k: "Scorpio",
    l: "Sagittarius",
    ";": "Capricorn",
    "'": "Aquarius",
    z: "Pisces",
  };
};

/**
 * Get zodiac keys from names (reverse mapping)
 */
export const getZodiacKeysFromNames = (): { [key: string]: string } => {
  return {
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
};

/**
 * Get all element symbols
 */
export const getElementSymbols = (): { [key: string]: string } => {
  return {
    "=": "🌊", // Water element
    "+": "🌍", // Earth element
    "`": "🔥", // Fire element
    "~": "💨", // Air element
  };
};

/**
 * Get element names for display
 */
export const getElementNames = (): { [key: string]: string } => {
  return {
    "=": "Water",
    "+": "Earth",
    "`": "Fire",
    "~": "Air",
  };
};

/**
 * Get all chart point symbols
 */
export const getChartPointSymbols = (): { [key: string]: string } => {
  return {
    "#": "DC", // Descendant
    "@": "MC", // Midheaven
    "!": "AC", // Ascendant
    $: "IC", // Imum Coeli
    "[": "SN", // South Node
    "]": "NN", // North Node
  };
};

/**
 * Get chart point names for display
 */
export const getChartPointNames = (): { [key: string]: string } => {
  return {
    "#": "Descendant",
    "@": "Midheaven",
    "!": "Ascendant",
    $: "Imum Coeli",
    "[": "South Node",
    "]": "North Node",
  };
};

/**
 * Get aspect symbols (Physis font keyboard characters)
 * The Physis font maps numbers to aspect symbols
 */
export const getAspectSymbols = (): { [key: string]: string } => {
  return {
    conjunct: "1", // 0° - Conjunction
    opposition: "2", // 180° - Opposition
    trine: "3", // 120° - Trine
    square: "4", // 90° - Square
    sextile: "5", // 60° - Sextile
  };
};

/**
 * Get aspect symbol from aspect name
 * @param aspectName The name of the aspect (e.g., "conjunct", "opposition", etc.)
 * @returns The Physis font keyboard character for the aspect, or empty string if not found
 */
export const getAspectSymbol = (aspectName: string): string => {
  const normalizedName = aspectName.toLowerCase().replace(/^whole sign /i, "");
  const aspectSymbols = getAspectSymbols();
  return aspectSymbols[normalizedName] || "";
};
