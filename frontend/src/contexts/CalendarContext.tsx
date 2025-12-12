import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAstrology } from "./AstrologyContext";
import { apiService, PlanetPosition } from "../services/api";
import {
  checkForConjunct,
  checkForOpposition,
  checkForSquare,
  checkForTrine,
  checkForSextile,
} from "../utils/aspectUtils";
import {
  loadYearDataFromCache,
  saveYearDataToCache,
} from "../services/yearDataCache";
import { processEphemerisData } from "../utils/ephemerisChartData";
import {
  CalendarEvent,
  IngressEvent,
  StationEvent,
  AspectEvent,
  LunationEvent,
} from "../types/calendarTypes";
import { fetchLunationsForYear } from "../utils/lunationsUtils";

interface CalendarContextType {
  year: number;
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  refreshCalendar: () => Promise<void>;
  linesData: any | null; // Cached lines data for the current year
  lunationsData: LunationEvent[] | null; // Cached lunations data for the current year
}

const CalendarContext = createContext<CalendarContextType | undefined>(
  undefined
);

interface CalendarProviderProps {
  children: ReactNode;
  year: number;
}

// ============================================================================
// PROVIDER
// ============================================================================
// Cache for year-ephemeris data
// Key format: "year-latitude-longitude"
interface EphemerisCacheEntry {
  events: CalendarEvent[];
  timestamp: number; // When the data was cached
  year: number;
}

// In-memory cache for quick access
const ephemerisCache = new Map<string, EphemerisCacheEntry>();

// Helper function to create cache key
const getCacheKey = (
  year: number,
  latitude: number,
  longitude: number
): string => {
  return `calendar-events-${year}-${latitude}-${longitude}`;
};

// Helper function to restore dates from cache (convert date strings to Date objects)
const restoreEventDatesFromCache = (events: any[]): CalendarEvent[] => {
  return events.map((event: any) => {
    const restored: any = { ...event };
    if (event.date) restored.date = new Date(event.date);
    if (event.utcDateTime) restored.utcDateTime = new Date(event.utcDateTime);
    if (event.localDateTime)
      restored.localDateTime = new Date(event.localDateTime);
    return restored as CalendarEvent;
  });
};

export function CalendarProvider({ children, year }: CalendarProviderProps) {
  const { currentChart } = useAstrology();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [linesData, setLinesData] = useState<any | null>(null);
  const [lunationsData, setLunationsData] = useState<LunationEvent[] | null>(
    null
  );
  const [loading, setLoading] = useState(true); // Start as true to check cache first
  const [error, setError] = useState<string | null>(null);

  // Track current cache key to detect changes
  const currentCacheKeyRef = useRef<string | null>(null);

  // Load calendar events from AsyncStorage cache
  const loadEventsFromCache = async (
    year: number,
    latitude: number,
    longitude: number
  ): Promise<CalendarEvent[] | null> => {
    try {
      const cacheKey = getCacheKey(year, latitude, longitude);

      // Check in-memory cache first
      const memoryCache = ephemerisCache.get(cacheKey);
      if (memoryCache) {
        console.log(`📦 Using in-memory cached calendar events for ${year}`);
        return memoryCache.events;
      }

      // Check AsyncStorage cache
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const parsedCache: EphemerisCacheEntry = JSON.parse(cached);
        // Calendar events never expire since they never change for a given year
        console.log(
          `📦 Loading calendar events from AsyncStorage cache for year ${year}`
        );
        const restoredEvents = restoreEventDatesFromCache(parsedCache.events);

        // Also store in memory cache for faster access
        ephemerisCache.set(cacheKey, {
          events: restoredEvents,
          timestamp: parsedCache.timestamp,
          year: parsedCache.year,
        });

        return restoredEvents;
      }
    } catch (err) {
      console.error("Error loading calendar events from cache:", err);
    }
    return null;
  };

  // Save calendar events to AsyncStorage cache
  const saveEventsToCache = async (
    year: number,
    latitude: number,
    longitude: number,
    events: CalendarEvent[]
  ) => {
    try {
      const cacheKey = getCacheKey(year, latitude, longitude);
      const cacheData: EphemerisCacheEntry = {
        events,
        timestamp: Date.now(),
        year,
      };

      // Save to AsyncStorage
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));

      // Also store in memory cache
      ephemerisCache.set(cacheKey, cacheData);

      console.log(`💾 Saved calendar events to cache for year ${year}`);
    } catch (err) {
      console.error("Error saving calendar events to cache:", err);
    }
  };

  // Fetch and process year ephemeris data
  const fetchYearEphemeris = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const location = currentChart?.location || {
        latitude: 40.7128,
        longitude: -74.006,
      };

      // Check new unified cache first
      const cachedYearData = await loadYearDataFromCache(
        year,
        location.latitude,
        location.longitude
      );

      if (cachedYearData) {
        console.log(
          `✅ Using cached year data for ${year} (${
            cachedYearData.listEvents.length
          } events, ${cachedYearData.lunationsData?.length || 0} lunations)`
        );
        setEvents(cachedYearData.listEvents);
        setLinesData(cachedYearData.linesData);
        setLunationsData(cachedYearData.lunationsData || null);
        setLoading(false);
        return;
      }

      console.log(`🌐 Fetching year-ephemeris data for ${year} (cache miss)`);

      // Fetch year ephemeris - backend now returns events with exact timestamps
      // Use highest sample rate for best accuracy
      const sampleInterval = 6; // Sample every 6 hours for better detection
      const response = await apiService.getYearEphemeris(
        year,
        location.latitude,
        location.longitude,
        sampleInterval
      );

      if (response.success && response.data?.events) {
        // Backend now provides events with exact timestamps
        const events = response.data.events
          .map((event: any) => {
            // Parse UTC datetime - ensure it's treated as UTC
            // If the string doesn't have 'Z' at the end, add it
            const utcString = event.utcDateTime.endsWith("Z")
              ? event.utcDateTime
              : event.utcDateTime + "Z";
            const utcDateTime = new Date(utcString);

            // For display, we want the local time representation
            // JavaScript Date objects store time in UTC internally
            // When we create a Date from a UTC string, it's already correctly stored
            // The localDateTime is the same Date object - it will display in local time automatically
            // But we'll create it explicitly to be clear about the intent
            const localDateTime = new Date(utcDateTime);

            if (event.type === "ingress") {
              return {
                id: `ingress-${event.planet}-${event.utcDateTime}`,
                type: "ingress" as const,
                planet: event.planet,
                fromSign: event.fromSign,
                toSign: event.toSign,
                date: localDateTime,
                utcDateTime,
                localDateTime,
                degree: event.degree,
                degreeFormatted: event.degreeFormatted,
                isRetrograde: event.isRetrograde,
              } as IngressEvent;
            } else if (event.type === "station") {
              return {
                id: `station-${event.planet}-${event.utcDateTime}`,
                type: "station" as const,
                planet: event.planet,
                stationType: event.stationType,
                date: localDateTime,
                utcDateTime,
                localDateTime,
                degree: event.degree,
                degreeFormatted: event.degreeFormatted,
                zodiacSignName: event.zodiacSignName,
              } as StationEvent;
            } else if (event.type === "aspect") {
              return {
                id: `aspect-${event.planet1}-${event.planet2}-${event.aspectName}-${event.utcDateTime}`,
                type: "aspect" as const,
                planet1: event.planet1,
                planet2: event.planet2,
                aspectName: event.aspectName,
                date: localDateTime,
                utcDateTime,
                localDateTime,
                orb: event.orb,
                planet1Position: event.planet1Position,
                planet2Position: event.planet2Position,
              } as AspectEvent;
            }
            return null;
          })
          .filter((event): event is CalendarEvent => event !== null);

        const eventCounts = events.reduce((acc, event) => {
          acc[event.type] = (acc[event.type] || 0) + 1;
          if (event.type === "station") {
            acc[`station-${event.stationType}`] =
              (acc[`station-${event.stationType}`] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);
        console.log(
          `Calendar events received: ${events.length} total`,
          eventCounts
        );

        // Process ephemeris samples for LINES view
        // IMPORTANT: Always fetch daily samples (24h interval) for lines chart
        // The lines chart needs exactly 365 data points (one per day), not the
        // high-frequency samples used for event detection (6h interval)
        let processedLinesData = null;
        const linesResponse = await apiService.getYearEphemeris(
          year,
          location.latitude,
          location.longitude,
          24 // Daily samples for lines view (one sample per day = 365 points)
        );
        if (linesResponse.success && linesResponse.data?.samples) {
          processedLinesData = processEphemerisData(linesResponse.data.samples);
          console.log(
            `📊 Processed lines data: ${processedLinesData.dates.length} daily samples`
          );
        }

        // Fetch lunations for the year (MOONS view data)
        console.log(`🌙 Fetching lunations for year ${year}...`);
        const lunationsData = await fetchLunationsForYear(
          year,
          location.latitude,
          location.longitude
        );

        // Save to new unified cache (LIST, LINES, and MOONS data)
        await saveYearDataToCache(
          year,
          location.latitude,
          location.longitude,
          events,
          processedLinesData,
          lunationsData
        );

        setEvents(events);
        setLinesData(processedLinesData);
        setLunationsData(lunationsData);
      } else {
        setError("Failed to fetch ephemeris data");
        setEvents([]);
        setLinesData(null);
        setLunationsData(null);
      }
    } catch (err: any) {
      console.error("Error fetching year ephemeris:", err);
      setError(err.message || "Failed to fetch ephemeris data");
      setEvents([]);
      setLinesData(null);
      setLunationsData(null);
    } finally {
      setLoading(false);
    }
  }, [year, currentChart]);

  // Refresh calendar data (bypasses cache)
  const refreshCalendar = useCallback(async () => {
    const location = currentChart?.location || {
      latitude: 40.7128,
      longitude: -74.006,
    };

    // Clear new unified cache
    try {
      const { clearYearDataCache } = await import("../services/yearDataCache");
      await clearYearDataCache(year, location.latitude, location.longitude);
    } catch (err) {
      console.error("Error clearing calendar cache:", err);
    }

    // Also clear old cache for backward compatibility
    const cacheKey = getCacheKey(year, location.latitude, location.longitude);
    ephemerisCache.delete(cacheKey);
    try {
      await AsyncStorage.removeItem(cacheKey);
    } catch (err) {
      console.error("Error clearing old calendar cache:", err);
    }

    await fetchYearEphemeris();
  }, [fetchYearEphemeris, year, currentChart]);

  // Fetch data on mount and when year or location changes
  useEffect(() => {
    fetchYearEphemeris();
  }, [fetchYearEphemeris]);

  return (
    <CalendarContext.Provider
      value={{
        year,
        events,
        loading,
        error,
        refreshCalendar,
        linesData,
        lunationsData,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================
export function useCalendar() {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error("useCalendar must be used within a CalendarProvider");
  }
  return context;
}
