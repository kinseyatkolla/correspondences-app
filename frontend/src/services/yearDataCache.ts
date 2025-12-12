// ============================================================================
// YEAR DATA CACHE SERVICE
// ============================================================================
// This service manages fully processed year data that is ready for consumption
// by both LIST view and LINES view. Once calculated, this data never changes
// and should be cached permanently.
// ============================================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import { CalendarEvent, LunationEvent } from "../types/calendarTypes";

// ============================================================================
// TYPES
// ============================================================================

// Re-export calendar event types for convenience
export type { CalendarEvent, LunationEvent } from "../types/calendarTypes";

export interface ProcessedYearData {
  year: number;
  latitude: number;
  longitude: number;
  timestamp: number; // When this data was calculated
  version: number; // Cache version (increment when format changes)
  // LIST view ready data
  listEvents: CalendarEvent[];
  // LINES view ready data (ephemeris chart data)
  linesData: any;
  // MOONS view ready data (lunations for the year)
  lunationsData: LunationEvent[];
  // Metadata
  isComplete: boolean; // True if all events have exact timestamps
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_VERSION = 3; // Increment when cache format changes (v3: added lunationsData)
const MAX_CACHED_YEARS = 10; // Maximum number of years to cache (excluding current year)

// Cache key format: "year-data-{year}-{lat}-{lng}"
const getCacheKey = (
  year: number,
  latitude: number,
  longitude: number
): string => {
  return `year-data-${year}-${latitude}-${longitude}`;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Restores LunationEvent dates from cached JSON data
 */
function restoreLunationsFromCache(lunations: any[]): LunationEvent[] {
  return lunations.map((lunation) => ({
    ...lunation,
    date: new Date(lunation.date),
    utcDateTime: new Date(lunation.utcDateTime),
    localDateTime: new Date(lunation.localDateTime),
  }));
}

/**
 * Detects if cached data has incomplete timestamps (old format)
 * Checks for patterns like 5am/pm, 11am/pm which indicate sampled timestamps
 */
function hasIncompleteTimestamps(events: CalendarEvent[]): boolean {
  if (!events || events.length === 0) return false;

  // Check first 10 events for timestamp patterns
  const sampleSize = Math.min(10, events.length);
  let incompleteCount = 0;

  for (let i = 0; i < sampleSize; i++) {
    const event = events[i];
    if (!event.utcDateTime) continue;

    const date = new Date(event.utcDateTime);
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();

    // Check for common sampling patterns:
    // - 5:00, 11:00, 17:00, 23:00 (12-hour intervals)
    // - 5:30, 11:30, 17:30, 23:30 (if using 30-min offsets)
    // - Any time that's exactly on the hour or half-hour with minutes = 0 or 30
    const isSampledTime =
      (hours === 5 || hours === 11 || hours === 17 || hours === 23) &&
      (minutes === 0 || minutes === 30);

    if (isSampledTime) {
      incompleteCount++;
    }
  }

  // If more than 30% of sampled events have incomplete timestamps, consider it incomplete
  return incompleteCount / sampleSize > 0.3;
}

/**
 * Restores Date objects from cached JSON data
 */
function restoreDatesFromCache(data: any): ProcessedYearData | null {
  if (!data) return null;

  try {
    // Restore list events dates
    if (data.listEvents && Array.isArray(data.listEvents)) {
      data.listEvents = data.listEvents.map((event: any) => {
        const restored: any = { ...event };
        if (event.date) restored.date = new Date(event.date);
        if (event.utcDateTime)
          restored.utcDateTime = new Date(event.utcDateTime);
        if (event.localDateTime)
          restored.localDateTime = new Date(event.localDateTime);
        return restored;
      });
    }

    // Restore lunations dates
    if (data.lunationsData && Array.isArray(data.lunationsData)) {
      data.lunationsData = restoreLunationsFromCache(data.lunationsData);
    }

    // Restore lines data dates
    if (data.linesData) {
      if (data.linesData.dates && Array.isArray(data.linesData.dates)) {
        data.linesData.dates = data.linesData.dates.map((date: any) => {
          return typeof date === "string" ? new Date(date) : date;
        });
      }

      if (data.linesData.planets && Array.isArray(data.linesData.planets)) {
        data.linesData.planets = data.linesData.planets.map((planet: any) => {
          if (planet.data && Array.isArray(planet.data)) {
            planet.data = planet.data.map((point: any) => {
              if (point.date && typeof point.date === "string") {
                return { ...point, date: new Date(point.date) };
              }
              return point;
            });
          }
          return planet;
        });
      }
    }

    return data as ProcessedYearData;
  } catch (error) {
    console.error("Error restoring dates from cache:", error);
    return null;
  }
}

// ============================================================================
// CACHE OPERATIONS
// ============================================================================

/**
 * Load fully processed year data from cache
 * Returns null if not found or if data is incomplete
 */
export async function loadYearDataFromCache(
  year: number,
  latitude: number,
  longitude: number
): Promise<ProcessedYearData | null> {
  try {
    const cacheKey = getCacheKey(year, latitude, longitude);
    const cached = await AsyncStorage.getItem(cacheKey);

    if (!cached) {
      return null;
    }

    const parsed = JSON.parse(cached);
    const restored = restoreDatesFromCache(parsed);

    if (!restored) {
      return null;
    }

    // Check cache version
    if (restored.version !== CACHE_VERSION) {
      console.log(
        `⚠️ Cache version mismatch for year ${year}, recalculating...`
      );
      return null;
    }

    // Check if data is marked as incomplete
    if (restored.isComplete === false) {
      console.log(
        `⚠️ Cached data for year ${year} marked as incomplete, recalculating...`
      );
      return null;
    }

    // Check for incomplete timestamps (old format detection)
    if (hasIncompleteTimestamps(restored.listEvents)) {
      console.log(
        `⚠️ Cached data for year ${year} has incomplete timestamps, recalculating...`
      );
      return null;
    }

    console.log(`✅ Loaded complete year data from cache for year ${year}`);
    return restored;
  } catch (error) {
    console.error("Error loading year data from cache:", error);
    return null;
  }
}

/**
 * Save fully processed year data to cache
 */
export async function saveYearDataToCache(
  year: number,
  latitude: number,
  longitude: number,
  listEvents: CalendarEvent[],
  linesData: any,
  lunationsData: LunationEvent[]
): Promise<void> {
  try {
    const today = new Date();
    const currentYear = today.getFullYear();

    // Check cache size and evict if needed (but never evict current year)
    const allKeys = await AsyncStorage.getAllKeys();
    const prefix = "year-data-";
    const locationSuffix = `-${latitude}-${longitude}`;

    const cachedEntries: Array<{
      key: string;
      year: number;
      timestamp: number;
    }> = [];

    for (const key of allKeys) {
      if (key.startsWith(prefix) && key.endsWith(locationSuffix)) {
        try {
          const cached = await AsyncStorage.getItem(key);
          if (cached) {
            const parsed = JSON.parse(cached);
            // Extract year from key (format: year-data-YEAR-lat-lon)
            const yearMatch = key.match(/year-data-(\d+)-/);
            if (yearMatch && parsed.year && parsed.timestamp) {
              cachedEntries.push({
                key,
                year: parsed.year,
                timestamp: parsed.timestamp,
              });
            }
          }
        } catch (err) {
          console.warn(`Skipping invalid cache entry: ${key}`, err);
        }
      }
    }

    // Count unique years (excluding current year and the year we're about to save)
    const uniqueYears = new Set(
      cachedEntries
        .filter((entry) => entry.year !== currentYear && entry.year !== year)
        .map((entry) => entry.year)
    );

    // If we're at the limit and this is a new year, evict oldest
    const isNewYear = !cachedEntries.some((entry) => entry.year === year);
    if (
      uniqueYears.size >= MAX_CACHED_YEARS &&
      year !== currentYear &&
      isNewYear
    ) {
      // Evict oldest cached year
      const evictableEntries = cachedEntries
        .filter((entry) => entry.year !== currentYear && entry.year !== year)
        .sort((a, b) => a.timestamp - b.timestamp);

      if (evictableEntries.length > 0) {
        const oldestEntry = evictableEntries[0];
        await AsyncStorage.removeItem(oldestEntry.key);
        console.log(`🗑️ Evicted oldest cached year: ${oldestEntry.year}`);
      }
    }

    // Save the new data
    const cacheKey = getCacheKey(year, latitude, longitude);
    const cacheData: ProcessedYearData = {
      year,
      latitude,
      longitude,
      timestamp: Date.now(),
      version: CACHE_VERSION,
      listEvents,
      linesData,
      lunationsData,
      isComplete: true,
    };

    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log(`💾 Saved complete year data to cache for year ${year}`);
  } catch (error) {
    console.error("Error saving year data to cache:", error);
  }
}

/**
 * Clear cached data for a specific year
 */
export async function clearYearDataCache(
  year: number,
  latitude: number,
  longitude: number
): Promise<void> {
  try {
    const cacheKey = getCacheKey(year, latitude, longitude);
    await AsyncStorage.removeItem(cacheKey);
    console.log(`🗑️ Cleared year data cache for year ${year}`);
  } catch (error) {
    console.error("Error clearing year data cache:", error);
  }
}

/**
 * Get all cached year keys for a location
 */
export async function getCachedYearKeys(
  latitude: number,
  longitude: number
): Promise<number[]> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const prefix = "year-data-";
    const locationSuffix = `-${latitude}-${longitude}`;

    const years: number[] = [];

    for (const key of allKeys) {
      if (key.startsWith(prefix) && key.endsWith(locationSuffix)) {
        const yearMatch = key.match(/year-data-(\d+)-/);
        if (yearMatch) {
          const year = parseInt(yearMatch[1], 10);
          if (!isNaN(year)) {
            years.push(year);
          }
        }
      }
    }

    return years.sort((a, b) => a - b);
  } catch (error) {
    console.error("Error getting cached year keys:", error);
    return [];
  }
}
