// ============================================================================
// EPHEMERIS CHART DATA UTILITIES
// ============================================================================
// Transform year ephemeris API response into chart-ready format for lines view

// ============================================================================
// TYPES
// ============================================================================

export interface EphemerisSample {
  timestamp: string | Date; // Can be string or Date (API service converts it)
  date?: Date; // API service also adds this
  planets: {
    [planet: string]: {
      longitude: number; // 0-360 degrees
      zodiacSign: number; // 0-11
      zodiacSignName: string;
      degree: number; // 0-30
      degreeFormatted: string;
      isRetrograde: boolean;
    };
  };
}

export interface ChartDataPoint {
  date: Date;
  longitude: number; // 0-360 degrees
}

export interface PlanetDataset {
  planet: string;
  color: string;
  data: ChartDataPoint[];
}

export interface LinesChartData {
  dates: Date[]; // X-axis labels (one per sample)
  planets: PlanetDataset[]; // Multiple planet lines
}

// Planet colors matching the Vue app
const PLANET_COLORS: Record<string, string> = {
  sun: "orange",
  moon: "cornflowerblue",
  mercury: "forestgreen",
  venus: "violet",
  mars: "red",
  jupiter: "gold",
  saturn: "#666666", // Dark grey instead of black for better visibility
  uranus: "steelblue",
  neptune: "indigo",
  pluto: "saddlebrown",
  northNode: "#444444", // Darker grey for north node
};

// Planets to display in chart (exclude moon as it moves too fast, or include if desired)
const PLANETS_TO_CHART = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
  "northNode",
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Transform ephemeris samples from API into chart-ready format
 * @param samples Array of ephemeris samples with planet positions
 * @returns Chart data structure with dates and planet datasets
 */
export function processEphemerisData(
  samples: EphemerisSample[]
): LinesChartData {
  if (!samples || samples.length === 0) {
    return {
      dates: [],
      planets: [],
    };
  }

  // Extract dates for X-axis (handle both timestamp string and Date object)
  const dates = samples.map(
    (sample) => sample.date || new Date(sample.timestamp)
  );

  // Get all unique planets from first sample (or use predefined list)
  const firstSample = samples[0];
  const availablePlanets = PLANETS_TO_CHART.filter(
    (planet) => firstSample.planets[planet] !== undefined
  );

  // Create dataset for each planet
  const planets: PlanetDataset[] = availablePlanets.map((planet) => {
    const planetData: ChartDataPoint[] = samples.map((sample) => {
      const planetInfo = sample.planets[planet];
      return {
        date: sample.date || new Date(sample.timestamp),
        longitude: planetInfo?.longitude ?? 0,
      };
    });

    return {
      planet,
      color: PLANET_COLORS[planet] || "#e6e6fa",
      data: planetData,
    };
  });

  return {
    dates,
    planets,
  };
}

/**
 * Get planet color by name
 */
export function getPlanetColor(planet: string): string {
  return PLANET_COLORS[planet] || "#e6e6fa";
}
