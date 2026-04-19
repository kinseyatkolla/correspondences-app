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
// CACHE vs LOCAL STORAGE:
// - ephemerisCache (Map): In-memory cache - fast but cleared on app restart
// - AsyncStorage: Persistent local storage - survives app restarts, slower to read/write
// - yearDataCache service: Uses AsyncStorage for permanent storage of year data
//   Since year data never changes once calculated, it's stored permanently in AsyncStorage
//
// Cache for year-ephemeris data
// Key format: "year-latitude-longitude"
interface EphemerisCacheEntry {
  events: CalendarEvent[];
  timestamp: number; // When the data was cached
  year: number;
}

interface NatalTransitCacheEntry {
  events: CalendarEvent[];
  timestamp: number;
  year: number;
}

// In-memory cache for quick access (fast but cleared on app restart)
const ephemerisCache = new Map<string, EphemerisCacheEntry>();
const natalTransitCache = new Map<string, NatalTransitCacheEntry>();
const SAVED_NATAL_CHART_KEY = "savedNatalChart";

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

  const getTimeZoneOffsetMs = (date: Date, timeZone: string): number => {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const parts = formatter.formatToParts(date);
    const getPart = (type: string) =>
      Number(parts.find((p) => p.type === type)?.value || 0);
    const asUtc = Date.UTC(
      getPart("year"),
      getPart("month") - 1,
      getPart("day"),
      getPart("hour"),
      getPart("minute"),
      getPart("second")
    );
    return asUtc - date.getTime();
  };

  const convertZonedLocalToUtc = (
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number,
    timeZone: string
  ): Date => {
    const localAsIfUtc = Date.UTC(year, month - 1, day, hour, minute, second);
    let guess = localAsIfUtc;
    for (let i = 0; i < 3; i++) {
      const offset = getTimeZoneOffsetMs(new Date(guess), timeZone);
      guess = localAsIfUtc - offset;
    }
    return new Date(guess);
  };

  const loadSavedNatalChart = useCallback(async () => {
    try {
      const savedNatalChart = await AsyncStorage.getItem(SAVED_NATAL_CHART_KEY);
      if (!savedNatalChart) return null;
      const natal = JSON.parse(savedNatalChart);
      if (
        natal?.year === undefined ||
        natal?.month === undefined ||
        natal?.day === undefined ||
        natal?.hour === undefined ||
        natal?.minute === undefined ||
        natal?.latitude === undefined ||
        natal?.longitude === undefined
      ) {
        return null;
      }

      let utcYear = natal.utcYear;
      let utcMonth = natal.utcMonth;
      let utcDay = natal.utcDay;
      let utcHour = natal.utcHour;
      let utcMinute = natal.utcMinute;
      let utcSecond = natal.utcSecond;

      // Backward compatibility for older saved natal data that stored local time
      // but did not persist explicit UTC components yet.
      if (
        utcYear === undefined ||
        utcMonth === undefined ||
        utcDay === undefined ||
        utcHour === undefined ||
        utcMinute === undefined
      ) {
        const tz =
          natal.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
        const converted = convertZonedLocalToUtc(
          Number(natal.year),
          Number(natal.month),
          Number(natal.day),
          Number(natal.hour),
          Number(natal.minute),
          Number(natal.second || 0),
          tz
        );
        utcYear = converted.getUTCFullYear();
        utcMonth = converted.getUTCMonth() + 1;
        utcDay = converted.getUTCDate();
        utcHour = converted.getUTCHours();
        utcMinute = converted.getUTCMinutes();
        utcSecond = converted.getUTCSeconds();
      }

      return {
        year: Number(utcYear),
        month: Number(utcMonth),
        day: Number(utcDay),
        hour: Number(utcHour),
        minute: Number(utcMinute),
        second: Number(utcSecond !== undefined ? utcSecond : 0),
        latitude: Number(natal.latitude),
        longitude: Number(natal.longitude),
      };
    } catch (error) {
      console.error("Error loading saved natal chart:", error);
      return null;
    }
  }, []);

  // Track current cache key to detect changes
  const currentCacheKeyRef = useRef<string | null>(null);

  // Track the last loaded year/location to prevent unnecessary refetches
  const lastLoadedRef = useRef<{
    year: number;
    latitude: number;
    longitude: number;
    natalCacheKey: string;
  } | null>(null);

  const getNatalTransitCacheKey = (
    year: number,
    latitude: number,
    longitude: number,
    natalCacheKey: string
  ): string => {
    return `natal-transits-${year}-${latitude}-${longitude}-${natalCacheKey}`;
  };

  const loadNatalTransitEventsFromCache = async (
    year: number,
    latitude: number,
    longitude: number,
    natalCacheKey: string
  ): Promise<CalendarEvent[] | null> => {
    try {
      const cacheKey = getNatalTransitCacheKey(
        year,
        latitude,
        longitude,
        natalCacheKey
      );
      const memoryCache = natalTransitCache.get(cacheKey);
      if (memoryCache) {
        return memoryCache.events;
      }
      const cached = await AsyncStorage.getItem(cacheKey);
      if (!cached) return null;
      const parsed: NatalTransitCacheEntry = JSON.parse(cached);
      const restored = restoreEventDatesFromCache(parsed.events);
      natalTransitCache.set(cacheKey, {
        events: restored,
        timestamp: parsed.timestamp,
        year: parsed.year,
      });
      return restored;
    } catch (error) {
      console.error("Error loading natal transit cache:", error);
      return null;
    }
  };

  const saveNatalTransitEventsToCache = async (
    year: number,
    latitude: number,
    longitude: number,
    natalCacheKey: string,
    events: CalendarEvent[]
  ) => {
    try {
      const cacheKey = getNatalTransitCacheKey(
        year,
        latitude,
        longitude,
        natalCacheKey
      );
      const entry: NatalTransitCacheEntry = {
        events,
        timestamp: Date.now(),
        year,
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
      natalTransitCache.set(cacheKey, entry);
    } catch (error) {
      console.error("Error saving natal transit cache:", error);
    }
  };

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
      const location = currentChart?.location || {
        latitude: 40.7128,
        longitude: -74.006,
      };
      const natalChart = await loadSavedNatalChart();
      const natalCacheKey = natalChart
        ? `${natalChart.year}-${natalChart.month}-${natalChart.day}-${natalChart.hour}-${natalChart.minute}-${natalChart.second}-${natalChart.latitude}-${natalChart.longitude}`
        : "no-natal";

      // Check if we've already loaded this exact year/location combination
      const lastLoaded = lastLoadedRef.current;
      if (
        lastLoaded &&
        lastLoaded.year === year &&
        lastLoaded.latitude === location.latitude &&
        lastLoaded.longitude === location.longitude &&
        lastLoaded.natalCacheKey === natalCacheKey
      ) {
        // Already loaded this exact data, skip refetch
        console.log(
          `⏭️ Skipping refetch - data already loaded for year ${year} at ${location.latitude}, ${location.longitude}`
        );
        return;
      }

      // Check AsyncStorage cache FIRST before clearing state or setting loading
      // This ensures instant display of cached data when switching back to a year
      const cachedYearData = await loadYearDataFromCache(
        year,
        location.latitude,
        location.longitude,
        "no-natal"
      );
      const cachedNatalEvents = await loadNatalTransitEventsFromCache(
        year,
        location.latitude,
        location.longitude,
        natalCacheKey
      );

      if (cachedYearData) {
        console.log(
          `✅ Using cached year data for ${year} (${
            cachedYearData.listEvents.length
          } events, ${cachedYearData.lunationsData?.length || 0} lunations)`
        );
        // Update state directly without showing loading state
        const mundaneEvents = (cachedYearData.listEvents || []).filter(
          (event) => !(event.type === "aspect" && event.isNatalTransit)
        );
        const mergedEvents = [
          ...mundaneEvents,
          ...(cachedNatalEvents || []),
        ].sort((a, b) => a.utcDateTime.getTime() - b.utcDateTime.getTime());
        setEvents(mergedEvents);
        setLinesData(cachedYearData.linesData);
        setLunationsData(cachedYearData.lunationsData || null);
        setLoading(false);
        // Update last loaded ref
        lastLoadedRef.current = {
          year,
          latitude: location.latitude,
          longitude: location.longitude,
          natalCacheKey,
        };
        if (natalChart && !cachedNatalEvents) {
          // Natal profile changed or cache miss - refresh just natal transits.
        } else {
          return;
        }
      }

      // Only clear state and show loading if cache miss (need to fetch)
      if (lastLoaded && lastLoaded.year !== year) {
        setEvents([]);
        setLinesData(null);
        setLunationsData(null);
      }
      setLoading(true);
      setError(null);

      console.log(`🌐 Fetching year-ephemeris data for ${year} (cache miss)`);

      // Fetch year ephemeris - backend now returns events with exact timestamps
      // Use highest sample rate for best accuracy
      const sampleInterval = 6; // Sample every 6 hours for better detection
      let mundaneEvents: CalendarEvent[] = [];
      let processedLinesData = null;
      if (!cachedYearData) {
        const response = await apiService.getYearEphemeris(
          year,
          location.latitude,
          location.longitude,
          sampleInterval,
          undefined
        );

        if (!(response.success && response.data?.events)) {
          setError("Failed to fetch ephemeris data");
          setEvents([]);
          setLinesData(null);
          setLunationsData(null);
          return;
        }

        mundaneEvents = response.data.events
          .map((event: any) => {
            let utcString: string;
            if (event.utcDateTime instanceof Date) {
              utcString = event.utcDateTime.toISOString();
            } else {
              utcString =
                typeof event.utcDateTime === "string" &&
                event.utcDateTime.endsWith("Z")
                  ? event.utcDateTime
                  : event.utcDateTime + "Z";
            }
            const utcDateTime = new Date(utcString);
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
            } else if (event.type === "aspect" && !event.isNatalTransit) {
              const aspectScope = "mundane";
              return {
                id: `aspect-${aspectScope}-${event.planet1}-${event.planet2}-${event.aspectName}-${event.utcDateTime}`,
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
                isNatalTransit: false,
              } as AspectEvent;
            }
            return null;
          })
          .filter((event): event is CalendarEvent => event !== null);

        // Process ephemeris samples for LINES view
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
      } else {
        mundaneEvents = (cachedYearData.listEvents || []).filter(
          (event) => !(event.type === "aspect" && event.isNatalTransit)
        );
        processedLinesData = cachedYearData.linesData;
      }

      let natalTransitEvents: CalendarEvent[] = cachedNatalEvents || [];
      if (natalChart && !cachedNatalEvents) {
        const natalResponse = await apiService.getYearEphemeris(
        year,
        location.latitude,
        location.longitude,
        sampleInterval,
        natalChart
        );
        if (natalResponse.success && natalResponse.data?.events) {
          natalTransitEvents = natalResponse.data.events
          .map((event: any) => {
            let utcString: string;
            if (event.utcDateTime instanceof Date) {
              utcString = event.utcDateTime.toISOString();
            } else {
              utcString =
                typeof event.utcDateTime === "string" &&
                event.utcDateTime.endsWith("Z")
                  ? event.utcDateTime
                  : event.utcDateTime + "Z";
            }
            const utcDateTime = new Date(utcString);
            const localDateTime = new Date(utcDateTime);
            if (event.type === "aspect" && event.isNatalTransit) {
              const aspectScope = event.isNatalTransit
                ? `natal-${event.natalTargetType || "point"}-${
                    event.natalTargetName || event.planet2
                  }`
                : "mundane";
              return {
                id: `aspect-${aspectScope}-${event.planet1}-${event.planet2}-${event.aspectName}-${event.utcDateTime}`,
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
                isNatalTransit: event.isNatalTransit || false,
                natalTargetType: event.natalTargetType,
                natalTargetName: event.natalTargetName,
                refinedByFailsafe: event.refinedByFailsafe,
              } as AspectEvent;
            }
            return null;
          })
          .filter((event): event is CalendarEvent => event !== null);
          await saveNatalTransitEventsToCache(
            year,
            location.latitude,
            location.longitude,
            natalCacheKey,
            natalTransitEvents
          );
        }
      }

      const events = [...mundaneEvents, ...natalTransitEvents].sort(
        (a, b) => a.utcDateTime.getTime() - b.utcDateTime.getTime()
      );

        // Fetch lunations for the year (MOONS view data)
        console.log(`🌙 Fetching lunations for year ${year}...`);
      const lunationsData =
        cachedYearData?.lunationsData ||
        (await fetchLunationsForYear(
          year,
          location.latitude,
          location.longitude
        ));

      if (!cachedYearData) {
        await saveYearDataToCache(
          year,
          location.latitude,
          location.longitude,
          mundaneEvents,
          processedLinesData,
          lunationsData,
          "no-natal"
        );
      }

      setEvents(events);
      setLinesData(processedLinesData);
      setLunationsData(lunationsData);

      // Update last loaded ref after successful fetch
      lastLoadedRef.current = {
        year,
        latitude: location.latitude,
        longitude: location.longitude,
        natalCacheKey,
      };
    } catch (err: any) {
      console.error("Error fetching year ephemeris:", err);
      setError(err.message || "Failed to fetch ephemeris data");
      setEvents([]);
      setLinesData(null);
      setLunationsData(null);
    } finally {
      setLoading(false);
    }
  }, [
    year,
    currentChart?.location?.latitude,
    currentChart?.location?.longitude,
  ]);

  // Refresh calendar data (bypasses cache)
  const refreshCalendar = useCallback(async () => {
    const location = currentChart?.location || {
      latitude: 40.7128,
      longitude: -74.006,
    };
    const natalChart = await loadSavedNatalChart();
    const natalCacheKey = natalChart
      ? `${natalChart.year}-${natalChart.month}-${natalChart.day}-${natalChart.hour}-${natalChart.minute}-${natalChart.second}-${natalChart.latitude}-${natalChart.longitude}`
      : "no-natal";

    // Clear new unified cache
    try {
      const { clearYearDataCache } = await import("../services/yearDataCache");
      await clearYearDataCache(
        year,
        location.latitude,
        location.longitude,
        "no-natal"
      );
      const natalSpecificKey = getNatalTransitCacheKey(
        year,
        location.latitude,
        location.longitude,
        natalCacheKey
      );
      natalTransitCache.delete(natalSpecificKey);
      await AsyncStorage.removeItem(natalSpecificKey);
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

    // Reset last loaded ref to force refetch
    lastLoadedRef.current = null;

    await fetchYearEphemeris();
  }, [
    fetchYearEphemeris,
    year,
    currentChart?.location?.latitude,
    currentChart?.location?.longitude,
    loadSavedNatalChart,
  ]);

  // Fetch data on mount and when year or location changes
  useEffect(() => {
    const location = currentChart?.location || {
      latitude: 40.7128,
      longitude: -74.006,
    };

    // Only fetch if year or location actually changed
    const lastLoaded = lastLoadedRef.current;
    if (
      !lastLoaded ||
      lastLoaded.year !== year ||
      lastLoaded.latitude !== location.latitude ||
      lastLoaded.longitude !== location.longitude
    ) {
      fetchYearEphemeris();
    }
  }, [
    year,
    currentChart?.location?.latitude,
    currentChart?.location?.longitude,
    fetchYearEphemeris,
  ]);

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
