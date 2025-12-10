/**
 * Planetary Hours Utilities
 * Calculates planetary hours based on sunrise/sunset times and Chaldean order
 */

export interface PlanetaryHour {
  hour: number;
  planet: string;
  planetSymbol: string;
  startTime: Date;
  endTime: Date;
  isDayHour: boolean;
}

export interface PlanetaryHoursData {
  date: Date;
  sunrise: Date;
  sunset: Date;
  dayHours: PlanetaryHour[];
  nightHours: PlanetaryHour[];
  currentHour?: PlanetaryHour;
}

// Planetary order in Chaldean sequence
const CHALDEAN_ORDER = [
  "Saturn", // ♄
  "Jupiter", // ♃
  "Mars", // ♂
  "Sun", // ☉
  "Venus", // ♀
  "Mercury", // ☿
  "Moon", // ☽
];

// Day of week to ruling planet mapping
const DAY_RULERS = {
  0: "Sun", // Sunday
  1: "Moon", // Monday
  2: "Mars", // Tuesday
  3: "Mercury", // Wednesday
  4: "Jupiter", // Thursday
  5: "Venus", // Friday
  6: "Saturn", // Saturday
};

// Planet symbols mapping
const PLANET_SYMBOLS = {
  Saturn: "♄",
  Jupiter: "♃",
  Mars: "♂",
  Sun: "☉",
  Venus: "♀",
  Mercury: "☿",
  Moon: "☽",
};

// Cache for sun times to prevent repeated API calls
const sunTimesCache = new Map<string, { sunrise: Date; sunset: Date }>();
const RATE_LIMIT_COOLDOWN = 60000; // 60 seconds cooldown after 429 error
let lastRateLimitError: number = 0;
let rateLimitActive: boolean = false;

/**
 * Get the ruling planet for a given day of the week
 */
export function getDayRuler(dayOfWeek: number): string {
  return DAY_RULERS[dayOfWeek as keyof typeof DAY_RULERS] || "Sun";
}

/**
 * Parse time string from API (format: "H:MM:SS AM/PM") to Date object
 */
function parseApiTime(timeString: string, date: Date): Date {
  const [time, period] = timeString.split(" ");
  const [hours, minutes, seconds] = time.split(":").map(Number);

  let hour24 = hours;
  if (period === "PM" && hours !== 12) {
    hour24 = hours + 12;
  } else if (period === "AM" && hours === 12) {
    hour24 = 0;
  }

  const result = new Date(date);
  result.setHours(hour24, minutes, seconds || 0, 0);
  return result;
}

/**
 * Fetch sunrise and sunset times from SunriseSunset.io API
 */
export async function fetchSunTimes(
  date: Date,
  latitude: number,
  longitude: number
): Promise<{ sunrise: Date; sunset: Date }> {
  // Create cache key
  const dateString = date.toISOString().split("T")[0]; // Format: YYYY-MM-DD
  const cacheKey = `${dateString}-${latitude}-${longitude}`;

  // Check cache first
  const cached = sunTimesCache.get(cacheKey);
  if (cached) {
    // Return new Date objects to avoid mutation issues
    return {
      sunrise: new Date(cached.sunrise),
      sunset: new Date(cached.sunset),
    };
  }

  // Check if we're in rate limit cooldown period
  const now = Date.now();
  if (rateLimitActive && now - lastRateLimitError < RATE_LIMIT_COOLDOWN) {
    // Use fallback during cooldown to avoid more 429 errors
    const fallback = calculateSunTimesFallback(date, latitude, longitude);
    // Cache the fallback result
    sunTimesCache.set(cacheKey, {
      sunrise: new Date(fallback.sunrise),
      sunset: new Date(fallback.sunset),
    });
    return fallback;
  }

  try {
    const url = `https://api.sunrisesunset.io/json?lat=${latitude}&lng=${longitude}&date=${dateString}&formatted=0`;

    const response = await fetch(url);
    if (!response.ok) {
      // Handle 429 rate limit errors specially
      if (response.status === 429) {
        rateLimitActive = true;
        lastRateLimitError = now;
        // Use fallback and don't log error (we'll use fallback during cooldown)
        const fallback = calculateSunTimesFallback(date, latitude, longitude);
        sunTimesCache.set(cacheKey, {
          sunrise: new Date(fallback.sunrise),
          sunset: new Date(fallback.sunset),
        });
        return fallback;
      }
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "OK") {
      throw new Error(`API returned error: ${data.status}`);
    }

    const sunrise = parseApiTime(data.results.sunrise, date);
    const sunset = parseApiTime(data.results.sunset, date);

    // Reset rate limit flag on successful request
    rateLimitActive = false;

    // Cache the result
    sunTimesCache.set(cacheKey, {
      sunrise: new Date(sunrise),
      sunset: new Date(sunset),
    });

    return { sunrise, sunset };
  } catch (error: any) {
    // Only log non-429 errors (429 errors are handled silently above)
    // Check both the error message and status code
    const is429Error =
      error.message?.includes("429") ||
      error.message?.includes("rate limit") ||
      (error.status && error.status === 429);

    if (!is429Error) {
      console.error("Error fetching sun times from API:", error);
    } else {
      // Set rate limit flag if we hit a 429
      rateLimitActive = true;
      lastRateLimitError = now;
    }
    // Fallback to calculated times if API fails
    const fallback = calculateSunTimesFallback(date, latitude, longitude);
    // Cache the fallback result
    sunTimesCache.set(cacheKey, {
      sunrise: new Date(fallback.sunrise),
      sunset: new Date(fallback.sunset),
    });
    return fallback;
  }
}

/**
 * Fallback calculation for sunrise/sunset times (used when API fails)
 */
export function calculateSunTimesFallback(
  date: Date,
  latitude: number,
  longitude: number
): { sunrise: Date; sunset: Date } {
  // Convert to radians
  const latRad = (latitude * Math.PI) / 180;

  // Get day of year (1-365)
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear =
    Math.floor(
      (date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

  // Solar declination in radians (more accurate formula)
  const declinationRad =
    0.4093 * Math.sin(((2 * Math.PI) / 365) * (dayOfYear - 81));

  // Hour angle for sunrise/sunset in radians
  const hourAngleRad = Math.acos(-Math.tan(latRad) * Math.tan(declinationRad));

  // Convert hour angle to minutes
  const hourAngleMinutes = ((hourAngleRad * 180) / Math.PI) * 4;

  // Calculate sunrise and sunset times (in minutes from midnight, local time)
  const sunriseMinutes = 720 - hourAngleMinutes;
  const sunsetMinutes = 720 + hourAngleMinutes;

  // Create sunrise and sunset Date objects (local time)
  const sunrise = new Date(date);
  sunrise.setHours(
    Math.floor(sunriseMinutes / 60),
    Math.floor(sunriseMinutes % 60),
    0,
    0
  );

  const sunset = new Date(date);
  sunset.setHours(
    Math.floor(sunsetMinutes / 60),
    Math.floor(sunsetMinutes % 60),
    0,
    0
  );

  return { sunrise, sunset };
}

/**
 * Calculate planetary hours for a given date and location
 */
export async function calculatePlanetaryHours(
  date: Date,
  latitude: number,
  longitude: number
): Promise<PlanetaryHoursData> {
  const { sunrise, sunset } = await fetchSunTimes(date, latitude, longitude);

  // Calculate hour lengths
  const dayLength = sunset.getTime() - sunrise.getTime();
  const nightLength = 24 * 60 * 60 * 1000 - dayLength;

  const dayHourLength = dayLength / 12;
  const nightHourLength = nightLength / 12;

  // Get the ruling planet for this day
  const dayRuler = getDayRuler(date.getDay());

  // Find starting position in Chaldean order
  const startIndex = CHALDEAN_ORDER.indexOf(dayRuler);

  // Generate day hours (12 hours from sunrise to sunset)
  const dayHours: PlanetaryHour[] = [];
  for (let i = 0; i < 12; i++) {
    const planetIndex = (startIndex + i) % 7;
    const planet = CHALDEAN_ORDER[planetIndex];
    const startTime = new Date(sunrise.getTime() + i * dayHourLength);
    const endTime = new Date(sunrise.getTime() + (i + 1) * dayHourLength);

    dayHours.push({
      hour: i + 1,
      planet,
      planetSymbol: PLANET_SYMBOLS[planet as keyof typeof PLANET_SYMBOLS],
      startTime,
      endTime,
      isDayHour: true,
    });
  }

  // Generate night hours (12 hours from sunset to sunrise next day)
  const nightHours: PlanetaryHour[] = [];
  for (let i = 0; i < 12; i++) {
    const planetIndex = (startIndex + 12 + i) % 7;
    const planet = CHALDEAN_ORDER[planetIndex];
    const startTime = new Date(sunset.getTime() + i * nightHourLength);
    const endTime = new Date(sunset.getTime() + (i + 1) * nightHourLength);

    nightHours.push({
      hour: i + 1,
      planet,
      planetSymbol: PLANET_SYMBOLS[planet as keyof typeof PLANET_SYMBOLS],
      startTime,
      endTime,
      isDayHour: false,
    });
  }

  // Find current planetary hour
  const currentTime = new Date();
  const allHours = [...dayHours, ...nightHours];
  const currentHour = allHours.find(
    (hour) => currentTime >= hour.startTime && currentTime < hour.endTime
  );

  return {
    date,
    sunrise,
    sunset,
    dayHours,
    nightHours,
    currentHour,
  };
}

/**
 * Format time for display
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Get planet name with symbol for display
 */
export function getPlanetDisplay(planet: string): {
  name: string;
  symbol: string;
} {
  const symbol = PLANET_SYMBOLS[planet as keyof typeof PLANET_SYMBOLS] || "?";
  return { name: planet, symbol };
}

/**
 * Test function to verify calculations against reference data
 * Manitou Springs, CO: 38.8578°N, 104.9170°W
 * Reference: Thursday, October 9, 2025 at 4:42 AM
 */
export async function testManitouSpringsCalculations(): Promise<void> {
  const testDate = new Date("2025-10-09T04:42:00");
  const latitude = 38.8578;
  const longitude = -104.917;

  console.log("Testing Manitou Springs calculations for October 9, 2025...");

  try {
    const planetaryData = await calculatePlanetaryHours(
      testDate,
      latitude,
      longitude
    );

    console.log("Sunrise:", formatTime(planetaryData.sunrise));
    console.log("Sunset:", formatTime(planetaryData.sunset));
    console.log("Day Ruler (Thursday):", getDayRuler(testDate.getDay()));

    // Expected from reference: Sunrise ~6:23 AM, Sunset ~5:35 PM
    // First day hour should be Jupiter (Thursday's ruler)
    if (planetaryData.dayHours.length > 0) {
      console.log(
        "First Day Hour:",
        planetaryData.dayHours[0].planet,
        formatTime(planetaryData.dayHours[0].startTime)
      );
    }

    // Find current hour (4:42 AM should be Mercury hour according to reference)
    if (planetaryData.currentHour) {
      console.log(
        "Current Hour (4:42 AM):",
        planetaryData.currentHour.planet,
        formatTime(planetaryData.currentHour.startTime),
        "-",
        formatTime(planetaryData.currentHour.endTime)
      );
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}
