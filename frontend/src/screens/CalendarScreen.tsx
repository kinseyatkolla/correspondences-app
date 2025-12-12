// ============================================================================
// IMPORTS
// ============================================================================
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAstrology } from "../contexts/AstrologyContext";
import { useCalendar } from "../contexts/CalendarContext";
import { useYear } from "../contexts/YearContext";
import { apiService, BirthData } from "../services/api";
import {
  getZodiacColorStyle,
  getAspectColorStyle,
  getZodiacElement,
} from "../utils/colorUtils";
import { COLORS } from "../utils/colorUtils";
import { usePhysisFont, getPhysisSymbolStyle } from "../utils/physisFont";
import {
  getZodiacKeysFromNames,
  getPlanetKeysFromNames,
} from "../utils/physisSymbolMap";
import LinesChart from "../components/LinesChart";
import { processEphemerisData } from "../utils/ephemerisChartData";
import OnboardingOverlay from "../components/OnboardingOverlay";
import { Dimensions, Platform } from "react-native";
import {
  CalendarEvent,
  LunationEvent,
  CalendarEventType,
} from "../types/calendarTypes";
import { LunarPhase } from "../types/moonTypes";

// ============================================================================
// TYPES
// ============================================================================

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Extracts just the degree value from a formatted degree string
 * e.g., "15°30'45"" -> "15°"
 * The full degreeFormatted is preserved in the event data for future use
 */
function getDegreeOnly(degreeFormatted: string): string {
  // Extract everything up to and including the degree symbol
  const match = degreeFormatted.match(/^\d+°/);
  return match ? match[0] : degreeFormatted.split("°")[0] + "°";
}

/**
 * Formats planet name for display
 * Converts "northNode" to "N. Node", other planets get capitalized first letter
 */
function formatPlanetNameForDisplay(planetName: string): string {
  if (planetName.toLowerCase() === "northnode") {
    return "N. Node";
  }
  return planetName.charAt(0).toUpperCase() + planetName.slice(1);
}

/**
 * Zodiac Header Row Component - Fixed header showing zodiac signs
 */
function ZodiacHeaderRow() {
  const { fontLoaded } = usePhysisFont();
  const SCREEN_WIDTH = Dimensions.get("window").width;
  const HEADER_HEIGHT = 40;
  const CHART_PADDING_LEFT = 0;
  const CHART_PADDING_RIGHT = 0;
  const chartWidth = SCREEN_WIDTH;
  const signSectionWidth =
    (chartWidth - CHART_PADDING_LEFT - CHART_PADDING_RIGHT) / 12;

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

  const getZodiacSignColor = (signName: string): string => {
    const element = getZodiacElement(signName);
    switch (element) {
      case "fire":
        return COLORS.fire;
      case "water":
        return COLORS.water;
      case "earth":
        return COLORS.earth;
      case "air":
        return COLORS.air;
      default:
        return "#333";
    }
  };

  const zodiacHeaderItems = ZODIAC_SIGNS.map((sign, index) => {
    const signKey = getZodiacKeysFromNames()[sign];
    const signColor = getZodiacSignColor(sign);
    const leftPosition = CHART_PADDING_LEFT + index * signSectionWidth;

    return (
      <View
        key={`header-${sign}`}
        style={[
          styles.zodiacHeaderItem,
          {
            left: leftPosition,
            width: signSectionWidth,
            backgroundColor: signColor,
          },
        ]}
      >
        <Text
          style={[
            getPhysisSymbolStyle(fontLoaded, "small"),
            styles.zodiacSymbol,
          ]}
        >
          {signKey}
        </Text>
      </View>
    );
  });

  return (
    <View style={[styles.zodiacHeaderFixed, { width: chartWidth }]}>
      {zodiacHeaderItems}
    </View>
  );
}

/**
 * Filter Row Component - Fixed below navigation bar in LIST view
 * Displays all filter checkboxes in a single row, matching the position
 * and fixed-ness of the zodiac header in LINES view
 */
function FilterRow({
  filterStates,
  toggleFilter,
}: {
  filterStates: {
    lunation: boolean;
    aspect: boolean;
    ingress: boolean;
    station: boolean;
  };
  toggleFilter: (type: CalendarEventType) => void;
}) {
  return (
    <View style={styles.filterRowFixed}>
      <TouchableOpacity
        style={styles.filterCheckbox}
        onPress={() => toggleFilter("lunation")}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.checkbox,
            filterStates.lunation && styles.checkboxChecked,
          ]}
        >
          {filterStates.lunation && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.filterLabel}>Lunations</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.filterCheckbox}
        onPress={() => toggleFilter("aspect")}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.checkbox,
            filterStates.aspect && styles.checkboxChecked,
          ]}
        >
          {filterStates.aspect && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.filterLabel}>Aspects</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.filterCheckbox}
        onPress={() => toggleFilter("ingress")}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.checkbox,
            filterStates.ingress && styles.checkboxChecked,
          ]}
        >
          {filterStates.ingress && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.filterLabel}>Ingresses</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.filterCheckbox}
        onPress={() => toggleFilter("station")}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.checkbox,
            filterStates.station && styles.checkboxChecked,
          ]}
        >
          {filterStates.station && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.filterLabel}>Stations</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================
export default function CalendarScreen({ navigation }: any) {
  const { currentChart } = useAstrology();
  const { fontLoaded } = usePhysisFont();
  const { year: selectedYear, setYear: setSelectedYear } = useYear();
  const {
    events: calendarEvents,
    loading: calendarLoading,
    linesData: cachedLinesData,
    lunationsData: cachedLunationsData,
  } = useCalendar();

  const [viewMode, setViewMode] = useState<"LIST" | "LINES">("LIST");
  const [lunationEvents, setLunationEvents] = useState<LunationEvent[]>([]);
  const [lunationsLoading, setLunationsLoading] = useState(true);
  const [filterStates, setFilterStates] = useState({
    lunation: true,
    aspect: true,
    ingress: true,
    station: true,
  });
  const [isToggleDisabled, setIsToggleDisabled] = useState(false);

  // Lines view state - now uses cached data from context when available
  const [linesData, setLinesData] = useState<any>(null);
  const [linesLoading, setLinesLoading] = useState(false);
  const [linesError, setLinesError] = useState<string | null>(null);
  const linesDataYear = useRef<number | null>(null); // Track which year linesData is for

  const scrollViewRef = useRef<ScrollView>(null);
  const hasScrolledToToday = useRef(false);
  const todayItemRef = useRef<View>(null);
  const previousViewMode = useRef<"LIST" | "LINES">("LIST");
  const prefetchedYears = useRef<Set<number>>(new Set());

  // Use lunations from unified cache when available
  useEffect(() => {
    // If cached data is available, use it immediately (regardless of calendarLoading state)
    if (cachedLunationsData) {
      setLunationEvents(cachedLunationsData);
      setLunationsLoading(false);
    } else if (!calendarLoading) {
      // Only fetch if calendar is done loading and we don't have cached data
      // This prevents duplicate fetches while calendar is still loading
      fetchAllLunations();
    }
    // Reset scroll flag when year changes so we can auto-scroll to today if needed
    hasScrolledToToday.current = false;
  }, [selectedYear, cachedLunationsData, calendarLoading]);

  // Fetch lines data when in LINES view and year changes
  useEffect(() => {
    if (viewMode === "LINES") {
      // First check if we have cached data from context for this year
      if (cachedLinesData && !calendarLoading) {
        setLinesData(cachedLinesData);
        linesDataYear.current = selectedYear;
        setLinesLoading(false);
        return;
      }

      // Only fetch if we don't already have data for this year
      // Check if linesData exists and matches the selected year
      if (
        !linesData ||
        linesDataYear.current !== selectedYear ||
        (!linesLoading && linesDataYear.current !== selectedYear)
      ) {
        fetchLinesData();
      }
    }
  }, [selectedYear, viewMode, cachedLinesData, calendarLoading]);

  // Memoize allEvents to prevent recalculation on every render
  const allEvents: CalendarEvent[] = useMemo(() => {
    const events: CalendarEvent[] = [
      ...(lunationEvents || []),
      ...(calendarEvents || []),
    ];
    // Sort chronologically
    events.sort((a, b) => a.utcDateTime.getTime() - b.utcDateTime.getTime());
    return events;
  }, [lunationEvents, calendarEvents]);

  // Memoize filteredEvents to prevent recalculation on every render
  const filteredEvents = useMemo(() => {
    return (allEvents || []).filter((event) => filterStates[event.type]);
  }, [allEvents, filterStates]);

  // Maximum number of years to cache (excluding current year which is always kept)
  const MAX_CACHED_YEARS = 10;

  // Helper function to create cache key for ephemeris data
  const getEphemerisCacheKey = (
    year: number,
    latitude: number,
    longitude: number,
    sampleInterval: number
  ): string => {
    return `ephemeris-${year}-${latitude}-${longitude}-${sampleInterval}`;
  };

  // Helper function to create cache key for lunations data
  const getLunationsCacheKey = (
    year: number,
    latitude: number,
    longitude: number
  ): string => {
    return `lunations-${year}-${latitude}-${longitude}`;
  };

  // Get all cached ephemeris keys for the current location
  const getAllCachedEphemerisKeys = async (
    latitude: number,
    longitude: number,
    sampleInterval: number
  ): Promise<Array<{ key: string; year: number; timestamp: number }>> => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const prefix = `ephemeris-`;
      const locationSuffix = `-${latitude}-${longitude}-${sampleInterval}`;

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
              const parsedCache = JSON.parse(cached);
              // Extract year from key (format: ephemeris-YEAR-lat-lon-interval)
              const yearMatch = key.match(/ephemeris-(\d+)-/);
              if (yearMatch && parsedCache.year && parsedCache.timestamp) {
                cachedEntries.push({
                  key,
                  year: parsedCache.year,
                  timestamp: parsedCache.timestamp,
                });
              }
            }
          } catch (err) {
            // Skip invalid cache entries
            console.warn(`Skipping invalid cache entry: ${key}`, err);
          }
        }
      }

      return cachedEntries;
    } catch (err) {
      console.error("Error getting cached ephemeris keys:", err);
      return [];
    }
  };

  // Evict oldest cached year (excluding current year)
  const evictOldestCachedYear = async (
    currentYear: number,
    latitude: number,
    longitude: number,
    sampleInterval: number
  ) => {
    try {
      const cachedEntries = await getAllCachedEphemerisKeys(
        latitude,
        longitude,
        sampleInterval
      );

      // Filter out current year and sort by timestamp (oldest first)
      const evictableEntries = cachedEntries
        .filter((entry) => entry.year !== currentYear)
        .sort((a, b) => a.timestamp - b.timestamp);

      if (evictableEntries.length > 0) {
        const oldestEntry = evictableEntries[0];
        await AsyncStorage.removeItem(oldestEntry.key);
        console.log(`🗑️ Evicted oldest cached year: ${oldestEntry.year}`);
      }
    } catch (err) {
      console.error("Error evicting oldest cached year:", err);
    }
  };

  // Helper function to convert date strings back to Date objects
  const restoreDatesFromCache = (data: any): any => {
    if (!data) return data;

    // Convert dates array
    if (data.dates && Array.isArray(data.dates)) {
      data.dates = data.dates.map((date: any) => {
        if (typeof date === "string") {
          return new Date(date);
        }
        return date;
      });
    }

    // Convert dates in planet datasets
    if (data.planets && Array.isArray(data.planets)) {
      data.planets = data.planets.map((planet: any) => {
        if (planet.data && Array.isArray(planet.data)) {
          planet.data = planet.data.map((point: any) => {
            if (point.date && typeof point.date === "string") {
              return {
                ...point,
                date: new Date(point.date),
              };
            }
            return point;
          });
        }
        return planet;
      });
    }

    return data;
  };

  // Helper function to restore lunation events from cache (convert date strings to Date objects)
  const restoreLunationsFromCache = (lunations: any[]): LunationEvent[] => {
    return lunations.map((lunation) => ({
      ...lunation,
      date: new Date(lunation.date),
      utcDateTime: new Date(lunation.utcDateTime),
      localDateTime: new Date(lunation.localDateTime),
    }));
  };

  // Load lunations data from cache
  const loadLunationsFromCache = async (
    year: number,
    latitude: number,
    longitude: number
  ): Promise<LunationEvent[] | null> => {
    try {
      const cacheKey = getLunationsCacheKey(year, latitude, longitude);
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        // Lunations data never expires since it never changes for a given year
        console.log(`📦 Loading lunations data from cache for year ${year}`);
        const restoredLunations = restoreLunationsFromCache(parsedCache.data);
        return restoredLunations;
      }
    } catch (err) {
      console.error("Error loading lunations from cache:", err);
    }
    return null;
  };

  // Save lunations data to cache
  const saveLunationsToCache = async (
    year: number,
    latitude: number,
    longitude: number,
    lunations: LunationEvent[]
  ) => {
    try {
      const cacheKey = getLunationsCacheKey(year, latitude, longitude);
      const cacheData = {
        data: lunations,
        timestamp: Date.now(),
        year,
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`💾 Saved lunations data to cache for year ${year}`);
    } catch (err) {
      console.error("Error saving lunations to cache:", err);
    }
  };

  // Load ephemeris data from cache
  const loadEphemerisFromCache = async (
    year: number,
    latitude: number,
    longitude: number,
    sampleInterval: number
  ): Promise<any | null> => {
    try {
      const cacheKey = getEphemerisCacheKey(
        year,
        latitude,
        longitude,
        sampleInterval
      );
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        // For current year, cache is permanent (no expiration check)
        // For other years, also cache permanently since ephemeris data doesn't change
        console.log(`📦 Loading ephemeris data from cache for year ${year}`);
        // Convert date strings back to Date objects
        const restoredData = restoreDatesFromCache(parsedCache.data);
        return restoredData;
      }
    } catch (err) {
      console.error("Error loading ephemeris from cache:", err);
    }
    return null;
  };

  // Save ephemeris data to cache
  const saveEphemerisToCache = async (
    year: number,
    latitude: number,
    longitude: number,
    sampleInterval: number,
    data: any
  ) => {
    try {
      const today = new Date();
      const currentYear = today.getFullYear();

      // Check cache size and evict if needed (but never evict current year)
      const cachedEntries = await getAllCachedEphemerisKeys(
        latitude,
        longitude,
        sampleInterval
      );

      // Count unique years (excluding current year and the year we're about to save)
      const uniqueYears = new Set(
        cachedEntries
          .filter((entry) => entry.year !== currentYear && entry.year !== year)
          .map((entry) => entry.year)
      );

      // If we're at the limit and this is a new year (not current year and not already cached), evict oldest
      const isNewYear = !cachedEntries.some((entry) => entry.year === year);
      if (
        uniqueYears.size >= MAX_CACHED_YEARS &&
        year !== currentYear &&
        isNewYear
      ) {
        await evictOldestCachedYear(
          currentYear,
          latitude,
          longitude,
          sampleInterval
        );
      }

      const cacheKey = getEphemerisCacheKey(
        year,
        latitude,
        longitude,
        sampleInterval
      );
      const cacheData = {
        data,
        timestamp: Date.now(),
        year,
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`💾 Saved ephemeris data to cache for year ${year}`);
    } catch (err) {
      console.error("Error saving ephemeris to cache:", err);
    }
  };

  // Prefetch ephemeris data for a year (used for next year prefetching)
  const prefetchEphemerisData = async (
    year: number,
    latitude: number,
    longitude: number,
    sampleInterval: number
  ) => {
    // Check if already prefetched
    if (prefetchedYears.current.has(year)) {
      return;
    }

    // Check cache first
    const cached = await loadEphemerisFromCache(
      year,
      latitude,
      longitude,
      sampleInterval
    );
    if (cached) {
      prefetchedYears.current.add(year);
      return;
    }

    try {
      console.log(`🔮 Prefetching ephemeris data for year ${year}`);
      const response = await apiService.getYearEphemeris(
        year,
        latitude,
        longitude,
        sampleInterval
      );

      if (response.success && response.data?.samples) {
        // Process and cache the data
        const chartData = processEphemerisData(response.data.samples);
        await saveEphemerisToCache(
          year,
          latitude,
          longitude,
          sampleInterval,
          chartData
        );
        prefetchedYears.current.add(year);
        console.log(`✅ Prefetched and cached ephemeris data for year ${year}`);
      }
    } catch (error: any) {
      console.error(
        `Error prefetching ephemeris data for year ${year}:`,
        error
      );
    }
  };

  // Fetch lines ephemeris data (only if not available from context cache)
  const fetchLinesData = async () => {
    try {
      setLinesLoading(true);
      setLinesError(null);

      const location = currentChart?.location || {
        latitude: 40.7128,
        longitude: -74.006,
      };

      // First check if we have cached data from the unified cache
      const { loadYearDataFromCache } = await import(
        "../services/yearDataCache"
      );
      const cachedYearData = await loadYearDataFromCache(
        selectedYear,
        location.latitude,
        location.longitude
      );

      if (cachedYearData && cachedYearData.linesData) {
        setLinesData(cachedYearData.linesData);
        linesDataYear.current = selectedYear;
        setLinesLoading(false);
        return;
      }

      const sampleInterval = 24; // Daily samples

      // Check old cache format for backward compatibility
      const cachedData = await loadEphemerisFromCache(
        selectedYear,
        location.latitude,
        location.longitude,
        sampleInterval
      );

      if (cachedData) {
        setLinesData(cachedData);
        linesDataYear.current = selectedYear;
        setLinesLoading(false);
        return;
      }

      // Fetch year ephemeris with daily samples (24h interval) for smoother chart
      const response = await apiService.getYearEphemeris(
        selectedYear,
        location.latitude,
        location.longitude,
        sampleInterval
      );

      if (response.success && response.data?.samples) {
        // Process samples into chart-ready format
        const chartData = processEphemerisData(response.data.samples);
        setLinesData(chartData);
        linesDataYear.current = selectedYear;

        // Save to old cache format for backward compatibility
        await saveEphemerisToCache(
          selectedYear,
          location.latitude,
          location.longitude,
          sampleInterval,
          chartData
        );
      } else {
        setLinesError("Failed to fetch ephemeris data");
        setLinesData(null);
        linesDataYear.current = null;
      }
    } catch (error: any) {
      console.error("Error fetching lines data:", error);
      setLinesError(error.message || "Failed to fetch ephemeris data");
      setLinesData(null);
      linesDataYear.current = null;
    } finally {
      setLinesLoading(false);
    }
  };

  // Auto-scroll to today when year changes to current year and data loads
  useEffect(() => {
    const today = new Date();
    const todayYear = today.getFullYear();

    // Only auto-scroll if we just switched to the current year and data has loaded
    const currentLoading = lunationsLoading || calendarLoading;
    const currentAllEvents: CalendarEvent[] = [
      ...(lunationEvents || []),
      ...(calendarEvents || []),
    ];
    const currentFilteredEvents = currentAllEvents.filter(
      (event) => filterStates[event.type]
    );
    if (
      selectedYear === todayYear &&
      !currentLoading &&
      currentFilteredEvents &&
      currentFilteredEvents.length > 0 &&
      !hasScrolledToToday.current &&
      scrollViewRef.current
    ) {
      // Small delay to ensure layout is complete, then scroll
      const timeoutId = setTimeout(() => {
        if (!hasScrolledToToday.current) {
          // Call the scroll logic directly here to avoid dependency issues
          const safeAllEvents = currentAllEvents;
          const currentFilteredEvents = safeAllEvents.filter(
            (event) => filterStates[event.type]
          );
          if (currentFilteredEvents && currentFilteredEvents.length > 0) {
            const todayDate = today.getDate();
            const todayMonth = today.getMonth();

            let targetIndex = currentFilteredEvents.findIndex((event) => {
              const eventDate = new Date(event.localDateTime);
              const eventYear = eventDate.getFullYear();
              const eventMonth = eventDate.getMonth();
              const eventDay = eventDate.getDate();

              return (
                eventYear > todayYear ||
                (eventYear === todayYear && eventMonth > todayMonth) ||
                (eventYear === todayYear &&
                  eventMonth === todayMonth &&
                  eventDay >= todayDate)
              );
            });

            if (targetIndex < 0) {
              for (let i = currentFilteredEvents.length - 1; i >= 0; i--) {
                const eventDate = new Date(
                  currentFilteredEvents[i].localDateTime
                );
                if (
                  eventDate.getFullYear() < todayYear ||
                  (eventDate.getFullYear() === todayYear &&
                    eventDate.getMonth() < todayMonth) ||
                  (eventDate.getFullYear() === todayYear &&
                    eventDate.getMonth() === todayMonth &&
                    eventDate.getDate() < todayDate)
                ) {
                  targetIndex = i;
                  break;
                }
              }
              if (targetIndex < 0) targetIndex = 0;
            }

            const contentPadding = 20;
            const estimatedItemHeight = 85.5;
            const scrollY = contentPadding + targetIndex * estimatedItemHeight;

            scrollViewRef.current?.scrollTo({
              y: Math.max(0, scrollY - 10),
              animated: true,
            });
            hasScrolledToToday.current = true;
          }
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [
    selectedYear,
    lunationsLoading,
    calendarLoading,
    lunationEvents?.length,
    calendarEvents?.length,
    filterStates,
  ]);

  // Auto-scroll to today when switching from LINES back to LIST view
  useEffect(() => {
    // Check if we just switched from LINES to LIST
    const currentLoading = lunationsLoading || calendarLoading;
    const currentAllEvents: CalendarEvent[] = [
      ...(lunationEvents || []),
      ...(calendarEvents || []),
    ];
    const currentFilteredEvents = currentAllEvents.filter(
      (event) => filterStates[event.type]
    );
    if (
      previousViewMode.current === "LINES" &&
      viewMode === "LIST" &&
      !currentLoading &&
      currentFilteredEvents &&
      currentFilteredEvents.length > 0
    ) {
      const today = new Date();
      const todayYear = today.getFullYear();

      // Reset scroll flag and trigger scroll if viewing current year
      if (selectedYear === todayYear) {
        hasScrolledToToday.current = false;
        // Small delay to ensure layout is complete
        const timeoutId = setTimeout(() => {
          scrollToToday();
        }, 300);

        return () => clearTimeout(timeoutId);
      }
    }

    // Update previous view mode for next comparison
    previousViewMode.current = viewMode;
  }, [
    viewMode,
    lunationsLoading,
    calendarLoading,
    lunationEvents?.length,
    calendarEvents?.length,
    filterStates,
    selectedYear,
  ]);

  const fetchAllLunations = async () => {
    try {
      setLunationsLoading(true);
      const year = selectedYear;

      // Get location from context or use default
      const location = currentChart?.location || {
        latitude: 40.7128,
        longitude: -74.006,
      };

      // Check cache first
      const cachedLunations = await loadLunationsFromCache(
        year,
        location.latitude,
        location.longitude
      );

      if (cachedLunations) {
        setLunationEvents(cachedLunations);
        setLunationsLoading(false);
        return;
      }

      console.log(`🌐 Fetching lunations data for year ${year} (cache miss)`);
      const allPhases: LunarPhase[] = [];

      // Fetch all 12 months
      for (let month = 1; month <= 12; month++) {
        try {
          const monthData = await apiService.getLunarPhases(year, month);
          if (monthData?.response?.data) {
            const phases = monthData.response.data.map((phase) => ({
              moonPhase: phase.moonPhase,
              date: phase.date,
            }));
            allPhases.push(...phases);
          }
        } catch (error) {
          console.error(`Error fetching month ${month}:`, error);
        }
      }

      if (allPhases.length === 0) {
        console.warn("No lunar phases found");
        setLunationEvents([]);
        setLunationsLoading(false);
        return;
      }

      console.log(
        `✅ Found ${allPhases.length} lunar phases, now fetching eclipses...`
      );

      // Fetch eclipse data for the year
      console.log(`🔍 Starting eclipse fetch for year ${year}...`);
      let lunarEclipses: Array<{ date?: string; [key: string]: any }> = [];
      let solarEclipses: Array<{ date?: string; [key: string]: any }> = [];

      try {
        console.log(`🌑 Fetching lunar eclipses for ${year}...`);
        const lunarEclipseData = await apiService.getEclipses(year, "lunar");
        console.log("Lunar eclipse API response:", lunarEclipseData);
        if (lunarEclipseData?.response?.data) {
          lunarEclipses = lunarEclipseData.response.data;
          console.log(
            `🌑 Fetched ${lunarEclipses.length} lunar eclipses for ${year}`
          );
          if (lunarEclipses.length > 0) {
            console.log("Lunar eclipses data sample:", lunarEclipses[0]);
          } else {
            console.warn(`⚠️ No lunar eclipse data in response for ${year}`);
          }
        } else {
          console.warn(
            `⚠️ Lunar eclipse API response missing data field:`,
            lunarEclipseData
          );
        }
      } catch (error) {
        console.error("❌ Error fetching lunar eclipses:", error);
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        }
      }

      try {
        console.log(`☀️ Fetching solar eclipses for ${year}...`);
        const solarEclipseData = await apiService.getEclipses(year, "solar");
        console.log("Solar eclipse API response:", solarEclipseData);
        if (solarEclipseData?.response?.data) {
          solarEclipses = solarEclipseData.response.data;
          console.log(
            `☀️ Fetched ${solarEclipses.length} solar eclipses for ${year}`
          );
          if (solarEclipses.length > 0) {
            console.log("Solar eclipses data sample:", solarEclipses[0]);
          } else {
            console.warn(`⚠️ No solar eclipse data in response for ${year}`);
          }
        } else {
          console.warn(
            `⚠️ Solar eclipse API response missing data field:`,
            solarEclipseData
          );
        }
      } catch (error) {
        console.error("❌ Error fetching solar eclipses:", error);
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        }
      }

      console.log(
        `📊 Eclipse fetch complete: ${lunarEclipses.length} lunar, ${solarEclipses.length} solar`
      );

      // Create a map of eclipse dates for quick lookup
      // Eclipses occur at New Moon (solar) or Full Moon (lunar)
      // Use a more precise matching: store eclipse timestamps and match within 24 hours
      const eclipseMap = new Map<
        number,
        { type: "lunar" | "solar"; date: Date }
      >();

      // Process lunar eclipses (occur at Full Moon)
      let processedLunarEclipses = 0;
      lunarEclipses.forEach((eclipse) => {
        // OPALE API structure: date is in events.greatest.date or calendarDate
        // Try multiple possible date field names
        const dateValue =
          eclipse.events?.greatest?.date ||
          eclipse.events?.greatest?.Date ||
          eclipse.calendarDate ||
          eclipse.date ||
          eclipse.Date ||
          eclipse.datetime ||
          eclipse.Datetime ||
          eclipse.time ||
          eclipse.dateTime;
        if (!dateValue || typeof dateValue !== "string") {
          console.warn(
            "Lunar eclipse missing date field. Eclipse structure:",
            eclipse
          );
          return;
        }
        // Handle ISO 8601 format (may or may not have Z, may have milliseconds)
        // Format from API is typically "YYYY-MM-DDTHH:MM:SS" or "YYYY-MM-DDTHH:MM:SS.000"
        let eclipseDate = dateValue.trim();
        // Check if it already has a timezone indicator (Z, +, or - after the time part)
        const hasTimezone =
          /[Z+-]\d{2}:?\d{2}$/.test(eclipseDate) || eclipseDate.endsWith("Z");
        if (!hasTimezone) {
          // If no timezone indicator, assume UTC
          eclipseDate = `${eclipseDate}Z`;
        }
        const eclipseDateTime = new Date(eclipseDate);
        // Only add if date is valid
        if (!isNaN(eclipseDateTime.getTime())) {
          eclipseMap.set(eclipseDateTime.getTime(), {
            type: "lunar",
            date: eclipseDateTime,
          });
          processedLunarEclipses++;
        } else {
          console.warn("Invalid date for lunar eclipse:", dateValue);
        }
      });
      console.log(
        `🌑 Processed ${processedLunarEclipses} valid lunar eclipse dates`
      );

      // Process solar eclipses (occur at New Moon)
      let processedSolarEclipses = 0;
      solarEclipses.forEach((eclipse) => {
        // OPALE API structure: date is in events.greatest.date or calendarDate
        // Try multiple possible date field names
        const dateValue =
          eclipse.events?.greatest?.date ||
          eclipse.events?.greatest?.Date ||
          eclipse.calendarDate ||
          eclipse.date ||
          eclipse.Date ||
          eclipse.datetime ||
          eclipse.Datetime ||
          eclipse.time ||
          eclipse.dateTime;
        if (!dateValue || typeof dateValue !== "string") {
          console.warn(
            "Solar eclipse missing date field. Eclipse structure:",
            eclipse
          );
          return;
        }
        // Handle ISO 8601 format (may or may not have Z, may have milliseconds)
        // Format from API is typically "YYYY-MM-DDTHH:MM:SS" or "YYYY-MM-DDTHH:MM:SS.000"
        let eclipseDate = dateValue.trim();
        // Check if it already has a timezone indicator (Z, +, or - after the time part)
        const hasTimezone =
          /[Z+-]\d{2}:?\d{2}$/.test(eclipseDate) || eclipseDate.endsWith("Z");
        if (!hasTimezone) {
          // If no timezone indicator, assume UTC
          eclipseDate = `${eclipseDate}Z`;
        }
        const eclipseDateTime = new Date(eclipseDate);
        // Only add if date is valid
        if (!isNaN(eclipseDateTime.getTime())) {
          eclipseMap.set(eclipseDateTime.getTime(), {
            type: "solar",
            date: eclipseDateTime,
          });
          processedSolarEclipses++;
        } else {
          console.warn("Invalid date for solar eclipse:", dateValue);
        }
      });
      console.log(
        `☀️ Processed ${processedSolarEclipses} valid solar eclipse dates`
      );
      console.log(
        `📊 Total eclipse map size: ${eclipseMap.size} (${processedLunarEclipses} lunar + ${processedSolarEclipses} solar)`
      );

      // Parse UTC times - JavaScript Date objects handle timezone conversion automatically
      // A Date object stores time in UTC internally and displays in local time automatically
      const phasesWithTimes = allPhases.map((phase) => {
        // Ensure UTC string format (add 'Z' if not present)
        const utcString = phase.date.endsWith("Z")
          ? phase.date
          : `${phase.date}Z`;
        const utcDateTime = new Date(utcString);
        // localDateTime is the same Date object - it will display in local time when using locale methods
        const localDateTime = new Date(utcDateTime);

        return {
          ...phase,
          utcDateTime,
          localDateTime,
        };
      });

      // Fetch moon positions for each lunation
      const phasesWithMoonPositions = await Promise.all(
        phasesWithTimes.map(async (phase) => {
          if (!phase.utcDateTime) return phase;

          try {
            const birthData: BirthData = {
              year: phase.utcDateTime.getUTCFullYear(),
              month: phase.utcDateTime.getUTCMonth() + 1,
              day: phase.utcDateTime.getUTCDate(),
              hour: phase.utcDateTime.getUTCHours(),
              minute: phase.utcDateTime.getUTCMinutes(),
              latitude: location.latitude,
              longitude: location.longitude,
            };

            const chartResponse = await apiService.getBirthChart(birthData);

            if (chartResponse.success && chartResponse.data?.planets?.moon) {
              const moon = chartResponse.data.planets.moon;
              return {
                ...phase,
                moonPosition: {
                  degree: moon.degree,
                  degreeFormatted: moon.degreeFormatted,
                  zodiacSignName: moon.zodiacSignName,
                },
              };
            }
          } catch (error) {
            console.error(
              `Error fetching moon position for ${phase.date}:`,
              error
            );
          }

          return phase;
        })
      );

      // Convert to LunationEvent format and mark eclipses
      const lunations: LunationEvent[] = phasesWithMoonPositions
        .filter((phase) => phase.utcDateTime && phase.localDateTime)
        .map((phase, index) => {
          // Format the phase name (convert from camelCase to spaced words)
          const phaseName = phase.moonPhase.replace(/([A-Z])/g, " $1").trim();

          // Check if this lunation is an eclipse
          // Match eclipses within 24 hours of the lunation (eclipses occur at the exact phase)
          // Reduced from 48 hours to be more strict and avoid false matches
          const lunationTime = phase.utcDateTime!.getTime();
          let eclipseInfo: { type: "lunar" | "solar"; date: Date } | undefined;
          let closestTimeDiff = Infinity;

          // Verify phase type first to narrow down which eclipse types to consider
          const isNewMoon = phaseName === "New Moon";
          const isFullMoon = phaseName === "Full Moon";

          // Find closest eclipse within 24 hours, but only consider matching types
          // Solar eclipses occur at New Moon, Lunar eclipses at Full Moon
          for (const [eclipseTime, info] of eclipseMap.entries()) {
            // Only consider eclipses that match the phase type
            const typeMatches =
              (info.type === "solar" && isNewMoon) ||
              (info.type === "lunar" && isFullMoon);

            if (!typeMatches) continue;

            const timeDiff = Math.abs(lunationTime - eclipseTime);
            // Use 24-hour window (reduced from 48) to be more strict
            // Eclipses occur at the exact moment of New/Full Moon, so they should be very close
            if (timeDiff < 24 * 60 * 60 * 1000 && timeDiff < closestTimeDiff) {
              // Within 24 hours, type matches, and closer than previous match
              eclipseInfo = info;
              closestTimeDiff = timeDiff;
            }
          }

          // Debug: Log if we're close to an eclipse but not matching
          if (eclipseMap.size > 0 && !eclipseInfo) {
            // Check if we're very close (within 24 hours) but not matching phase
            for (const [eclipseTime, info] of eclipseMap.entries()) {
              const timeDiff = Math.abs(lunationTime - eclipseTime);
              if (timeDiff < 24 * 60 * 60 * 1000) {
                const hoursDiff = (timeDiff / (60 * 60 * 1000)).toFixed(1);
                const expectedType = isNewMoon
                  ? "solar"
                  : isFullMoon
                  ? "lunar"
                  : "none";
                console.log(
                  `⚠️ Lunation ${phaseName} at ${phase.utcDateTime!.toISOString()} is ${hoursDiff}h from ${
                    info.type
                  } eclipse at ${info.date.toISOString()} but expected ${expectedType}`
                );
              }
            }
          }

          // Mark as eclipse if we found a matching eclipse
          const isEclipse = eclipseInfo !== undefined;

          return {
            id: `lunation-${index}-${phase.date}`,
            type: "lunation" as const,
            date: phase.localDateTime!,
            utcDateTime: phase.utcDateTime!,
            localDateTime: phase.localDateTime!,
            title: phaseName,
            moonPosition: phase.moonPosition,
            isEclipse: isEclipse || false,
            eclipseType: isEclipse ? eclipseInfo!.type : undefined,
          };
        });

      // Sort chronologically
      lunations.sort(
        (a, b) => a.utcDateTime.getTime() - b.utcDateTime.getTime()
      );

      // Debug: Log eclipse information
      const eclipseCount = lunations.filter((l) => l.isEclipse).length;
      console.log(
        `🌑 Found ${eclipseCount} eclipses out of ${lunations.length} lunations`
      );
      if (eclipseCount > 0) {
        lunations
          .filter((l) => l.isEclipse)
          .forEach((eclipse) => {
            console.log(
              `  ${eclipse.title} (${
                eclipse.eclipseType
              }) at ${eclipse.utcDateTime.toISOString()}`
            );
          });
      } else if (eclipseMap.size > 0) {
        console.log(
          `⚠️ Warning: ${eclipseMap.size} eclipses in map but 0 matched to lunations`
        );
        console.log("Eclipse map entries:");
        eclipseMap.forEach((info, time) => {
          console.log(
            `  ${
              info.type
            } eclipse at ${info.date.toISOString()} (timestamp: ${time})`
          );
        });
        console.log("Sample lunation times:");
        lunations.slice(0, 5).forEach((lunation) => {
          console.log(
            `  ${
              lunation.title
            } at ${lunation.utcDateTime.toISOString()} (timestamp: ${lunation.utcDateTime.getTime()})`
          );
        });
      }

      // Save to cache for future use
      await saveLunationsToCache(
        year,
        location.latitude,
        location.longitude,
        lunations
      );

      setLunationEvents(lunations);
    } catch (error) {
      console.error("Error fetching lunations:", error);
      setLunationEvents([]);
    } finally {
      setLunationsLoading(false);
    }
  };

  // Get emoji for moon phase
  const getPhaseEmoji = (
    phaseName: string,
    isEclipse?: boolean,
    eclipseType?: "lunar" | "solar"
  ): string => {
    if (isEclipse) {
      return eclipseType === "solar" ? "🌑" : "🌕"; // Solar eclipse at New Moon, Lunar at Full Moon
    }
    switch (phaseName) {
      case "New Moon":
        return "🌑";
      case "First Quarter":
        return "🌓";
      case "Full Moon":
        return "🌕";
      case "Last Quarter":
        return "🌗";
      default:
        return "🌙";
    }
  };

  // Toggle filter - memoized to prevent recreation
  const toggleFilter = useCallback((type: CalendarEventType) => {
    setFilterStates((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  }, []);

  // Debug logging
  React.useEffect(() => {
    if (!allEvents || allEvents.length === 0) return;
    const eventCounts = allEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log("CalendarScreen - All events:", eventCounts);
    console.log("CalendarScreen - Filter states:", filterStates);
  }, [allEvents?.length, filterStates]);

  // Function to scroll to today's event (or nearest event)
  const scrollToToday = () => {
    const today = new Date();
    const todayYear = today.getFullYear();

    // If we're on a different year, switch to current year first
    if (selectedYear !== todayYear) {
      console.log(
        `🔍 scrollToToday - Switching from year ${selectedYear} to ${todayYear}`
      );
      setSelectedYear(todayYear);
      // Reset scroll flag so we can scroll after year change
      hasScrolledToToday.current = false;
      // The scroll will happen automatically when data loads via the auto-scroll on load logic
      return;
    }

    // Always use current filteredEvents - recalculate on each call
    const currentFilteredEvents = (allEvents || []).filter(
      (event) => filterStates[event.type]
    );

    if (
      !scrollViewRef.current ||
      !currentFilteredEvents ||
      currentFilteredEvents.length === 0
    ) {
      console.log("🔍 scrollToToday - No events or no scrollView ref");
      return;
    }

    // Reset the scroll flag so we can scroll again after filter changes
    hasScrolledToToday.current = false;

    const todayDate = today.getDate();
    const todayMonth = today.getMonth();

    console.log("🔍 scrollToToday - Today:", {
      fullDate: today.toISOString(),
      dateString: today.toDateString(),
      year: todayYear,
      month: todayMonth,
      date: todayDate,
    });
    console.log(
      "🔍 scrollToToday - Total events:",
      currentFilteredEvents.length
    );
    console.log("🔍 scrollToToday - Active filters:", filterStates);

    // Log first few events to see what we're comparing against
    console.log("🔍 scrollToToday - First 5 events:");
    currentFilteredEvents.slice(0, 5).forEach((event, idx) => {
      const eventDate = new Date(event.localDateTime);
      console.log(
        `  Event ${idx}: ${eventDate.toDateString()} (${event.type})`
      );
    });

    // Find the first event that is today or upcoming (using same logic as isToday)
    let targetIndex = currentFilteredEvents.findIndex((event) => {
      const eventDate = new Date(event.localDateTime);
      const eventYear = eventDate.getFullYear();
      const eventMonth = eventDate.getMonth();
      const eventDay = eventDate.getDate();

      const isTodayOrFuture =
        eventYear > todayYear ||
        (eventYear === todayYear && eventMonth > todayMonth) ||
        (eventYear === todayYear &&
          eventMonth === todayMonth &&
          eventDay >= todayDate);

      return isTodayOrFuture;
    });

    console.log("🔍 scrollToToday - Initial targetIndex:", targetIndex);

    // If no event for today or upcoming, find the last event before today
    if (targetIndex < 0) {
      // Find the last event before today
      for (let i = currentFilteredEvents.length - 1; i >= 0; i--) {
        const eventDate = new Date(currentFilteredEvents[i].localDateTime);
        if (
          eventDate.getFullYear() < todayYear ||
          (eventDate.getFullYear() === todayYear &&
            eventDate.getMonth() < todayMonth) ||
          (eventDate.getFullYear() === todayYear &&
            eventDate.getMonth() === todayMonth &&
            eventDate.getDate() < todayDate)
        ) {
          targetIndex = i;
          break;
        }
      }
      // If still no index found, use the first event
      if (targetIndex < 0) {
        targetIndex = 0;
      }
    }

    console.log("🔍 scrollToToday - Final targetIndex:", targetIndex);
    if (targetIndex >= 0 && targetIndex < currentFilteredEvents.length) {
      const targetEvent = currentFilteredEvents[targetIndex];
      console.log(
        "🔍 scrollToToday - Target event date:",
        new Date(targetEvent.localDateTime).toDateString(),
        "Type:",
        targetEvent.type
      );
    }

    // Calculate scroll position
    // Header and filters are OUTSIDE the ScrollView, so we only scroll within the content
    // ScrollView content has padding: 20px, and each item is approximately 80-85px tall
    setTimeout(() => {
      if (!scrollViewRef.current) return;

      const contentPadding = 20; // ScrollView contentContainerStyle padding
      const estimatedItemHeight = 85.5; // Fine-tuned estimate based on testing
      const scrollY = contentPadding + targetIndex * estimatedItemHeight;

      console.log("🔍 scrollToToday - Calculating scroll:", {
        targetIndex,
        totalEvents: currentFilteredEvents.length,
        estimatedItemHeight,
        contentPadding,
        calculatedScrollY: scrollY,
      });

      scrollViewRef.current.scrollTo({
        y: Math.max(0, scrollY - 10), // Small offset to show item at top
        animated: true,
      });
    }, 100);
  };

  // Function to handle scrolling to today's item when it's measured (for auto-scroll on load)
  const handleTodayItemLayout = (event: any) => {
    if (!hasScrolledToToday.current && scrollViewRef.current) {
      const { y } = event.nativeEvent.layout;
      // y is the top position of the item relative to ScrollView content
      // Scroll with tiny offset to ensure item is visible at top
      scrollViewRef.current.scrollTo({
        y: Math.max(0, y - 5), // Tiny offset to ensure item is visible at top
        animated: true,
      });
      hasScrolledToToday.current = true;
    }
  };

  const loading = lunationsLoading || calendarLoading;

  // Format date for display
  // Format date for display in device's local timezone
  // Backend returns UTC times, JavaScript Date automatically converts to local timezone
  const formatDate = (utcDate: Date): string => {
    return utcDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Format time for display in device's local timezone
  // Backend returns UTC times, JavaScript Date automatically converts to local timezone
  const formatTime = (utcDate: Date): string => {
    return utcDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Check if a date is today in device's local timezone
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Navigate to astrology screen with event date/time
  const handleEventPress = (event: CalendarEvent) => {
    if (navigation) {
      (navigation as any).navigate("Astrology", {
        screen: "AstrologyMain",
        params: { selectedDate: event.localDateTime.toISOString() },
      });
    }
  };

  // Memoize lunations array for LinesChart to prevent unnecessary re-renders
  const memoizedLunations = useMemo(() => {
    return lunationEvents
      .filter(
        (event) => event.title === "New Moon" || event.title === "Full Moon"
      )
      .map((event) => {
        if (!event.moonPosition) return null;

        // Convert zodiac sign + degree to 0-360 longitude
        const zodiacSigns = [
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
        const signIndex = zodiacSigns.indexOf(
          event.moonPosition.zodiacSignName
        );

        // Parse degree from degreeFormatted (e.g., "12°30'45"" -> 12.5125)
        // degreeFormatted format is like "12°30'45"" or "12°"
        // Extract degrees, minutes, and seconds if present
        const degreeStr = event.moonPosition.degreeFormatted;
        const degMatch = degreeStr.match(/^(\d+)°/);
        const minMatch = degreeStr.match(/(\d+)'/);
        const secMatch = degreeStr.match(/(\d+)"/);

        const degrees = degMatch ? parseFloat(degMatch[1]) : 0;
        const minutes = minMatch ? parseFloat(minMatch[1]) : 0;
        const seconds = secMatch ? parseFloat(secMatch[1]) : 0;

        // Convert to decimal degrees
        const degreesWithinSign = degrees + minutes / 60 + seconds / 3600;

        // Calculate full longitude: sign offset (30° per sign) + degree within sign
        const longitude =
          signIndex >= 0 ? signIndex * 30 + degreesWithinSign : 0;

        return {
          date: event.localDateTime,
          longitude,
          phase: event.title as "New Moon" | "Full Moon",
          isEclipse: event.isEclipse || false,
          eclipseType: event.eclipseType,
        };
      })
      .filter(
        (
          l
        ): l is {
          date: Date;
          longitude: number;
          phase: "New Moon" | "Full Moon";
          isEclipse: boolean;
          eclipseType: "lunar" | "solar" | undefined;
        } => l !== null && l.longitude >= 0 && l.longitude <= 360
      );
  }, [lunationEvents]);

  return (
    <View style={styles.container}>
      <OnboardingOverlay screenKey="BOOK" />
      {/* Year Navigation Header - Centered with toggle button on left and Today button on right */}
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.viewModeToggleButton}
            onPress={() => {
              if (isToggleDisabled) return;
              setIsToggleDisabled(true);
              setViewMode(viewMode === "LIST" ? "LINES" : "LIST");
              setTimeout(() => {
                setIsToggleDisabled(false);
              }, 500);
            }}
            activeOpacity={0.7}
            disabled={isToggleDisabled}
          >
            <Text style={styles.viewModeToggleButtonText}>
              {viewMode === "LIST" ? "LINES" : "LIST"}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerCenter}>
          <TouchableOpacity
            style={styles.yearNavButton}
            onPress={() => setSelectedYear(selectedYear - 1)}
            activeOpacity={0.7}
          >
            <Text style={styles.yearNavButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerText}>{selectedYear}</Text>
          <TouchableOpacity
            style={styles.yearNavButton}
            onPress={async () => {
              const nextYear = selectedYear + 1;
              setSelectedYear(nextYear);

              // Prefetch next year's data on first forward click
              if (!prefetchedYears.current.has(nextYear)) {
                const location = currentChart?.location || {
                  latitude: 40.7128,
                  longitude: -74.006,
                };
                // Prefetch in background (don't await, let it happen async)
                prefetchEphemerisData(
                  nextYear,
                  location.latitude,
                  location.longitude,
                  24
                );
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.yearNavButtonText}>›</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          {(viewMode !== "LINES" ||
            selectedYear !== new Date().getFullYear()) && (
            <TouchableOpacity
              style={styles.scrollToTodayButton}
              onPress={scrollToToday}
              activeOpacity={0.7}
            >
              <Text style={styles.scrollToTodayButtonText}>Today</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Row - Fixed below navigation, only shown in LIST view */}
      {viewMode === "LIST" && (
        <FilterRow filterStates={filterStates} toggleFilter={toggleFilter} />
      )}

      {/* Zodiac Header Row - Fixed below navigation, only shown in LINES view */}
      {viewMode === "LINES" && linesData && !linesLoading && !linesError && (
        <ZodiacHeaderRow />
      )}

      {/* Content based on view mode */}
      {viewMode === "LINES" ? (
        <View style={styles.linesContainer}>
          {linesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#e6e6fa" />
              <Text style={styles.loadingText}>Loading chart data...</Text>
            </View>
          ) : linesError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{linesError}</Text>
            </View>
          ) : linesData ? (
            <LinesChart
              data={linesData}
              showHeader={false}
              lunations={memoizedLunations}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No chart data available</Text>
            </View>
          )}
        </View>
      ) : (
        <>
          {/* Events List */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.eventsList}
            contentContainerStyle={styles.eventsListContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#e6e6fa" />
                <Text style={styles.loadingText}>Loading events...</Text>
              </View>
            ) : filteredEvents && filteredEvents.length > 0 ? (
              (() => {
                // Calculate target index once before mapping
                const today = new Date();
                const todayDate = today.getDate();
                const todayMonth = today.getMonth();
                const todayYear = today.getFullYear();

                // Find the first event that is today or upcoming
                let targetIndex = filteredEvents.findIndex((event) => {
                  const eventDate = new Date(event.localDateTime);
                  return (
                    eventDate.getFullYear() > todayYear ||
                    (eventDate.getFullYear() === todayYear &&
                      eventDate.getMonth() > todayMonth) ||
                    (eventDate.getFullYear() === todayYear &&
                      eventDate.getMonth() === todayMonth &&
                      eventDate.getDate() >= todayDate)
                  );
                });

                // If no event for today or upcoming, find the last event before today
                if (targetIndex < 0) {
                  for (let i = filteredEvents.length - 1; i >= 0; i--) {
                    const eventDate = new Date(filteredEvents[i].localDateTime);
                    if (
                      eventDate.getFullYear() < todayYear ||
                      (eventDate.getFullYear() === todayYear &&
                        eventDate.getMonth() < todayMonth) ||
                      (eventDate.getFullYear() === todayYear &&
                        eventDate.getMonth() === todayMonth &&
                        eventDate.getDate() < todayDate)
                    ) {
                      targetIndex = i;
                      break;
                    }
                  }
                  if (targetIndex < 0) targetIndex = 0;
                }

                return filteredEvents.map((event, index) => {
                  const isTargetEvent = index === targetIndex;

                  // Render lunation event
                  if (event.type === "lunation") {
                    const eventIsToday = isToday(event.localDateTime);
                    const eclipseLabel = event.isEclipse
                      ? ` (${
                          event.eclipseType === "solar" ? "Solar" : "Lunar"
                        } Eclipse)`
                      : "";
                    return (
                      <TouchableOpacity
                        key={event.id}
                        ref={isTargetEvent ? todayItemRef : undefined}
                        onLayout={
                          isTargetEvent && !hasScrolledToToday.current
                            ? handleTodayItemLayout
                            : undefined
                        }
                        style={[
                          styles.eventItem,
                          eventIsToday && styles.eventItemToday,
                        ]}
                        onPress={() => handleEventPress(event)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.eventLeftColumn}>
                          <Text style={styles.eventTitle}>
                            {getPhaseEmoji(
                              event.title,
                              event.isEclipse,
                              event.eclipseType
                            )}{" "}
                            {event.isEclipse && "🔴 "}
                            {event.title}
                            {eclipseLabel}
                          </Text>
                          <Text style={styles.eventDate}>
                            {formatDate(event.localDateTime)} at{" "}
                            {formatTime(event.localDateTime)}
                          </Text>
                        </View>
                        {event.moonPosition && (
                          <View style={styles.eventRightColumn}>
                            <Text
                              style={[
                                styles.eventMoonPosition,
                                getZodiacColorStyle(
                                  event.moonPosition.zodiacSignName
                                ),
                              ]}
                            >
                              <Text
                                style={[
                                  getPhysisSymbolStyle(fontLoaded, "medium"),
                                  getZodiacColorStyle(
                                    event.moonPosition.zodiacSignName
                                  ),
                                ]}
                              >
                                {
                                  getZodiacKeysFromNames()[
                                    event.moonPosition.zodiacSignName
                                  ]
                                }
                              </Text>{" "}
                              {getDegreeOnly(
                                event.moonPosition.degreeFormatted
                              )}{" "}
                              {event.moonPosition.zodiacSignName}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  }

                  // Render ingress event
                  if (event.type === "ingress") {
                    const planetSymbols: Record<string, string> = {
                      sun: "☉",
                      mercury: "☿",
                      venus: "♀",
                      mars: "♂",
                      jupiter: "♃",
                      saturn: "♄",
                      uranus: "♅",
                      neptune: "♆",
                      pluto: "♇",
                    };

                    const planetName = formatPlanetNameForDisplay(event.planet);

                    const eventIsToday = isToday(event.localDateTime);
                    return (
                      <TouchableOpacity
                        key={event.id}
                        style={[
                          styles.eventItem,
                          eventIsToday && styles.eventItemToday,
                        ]}
                        onPress={() => handleEventPress(event)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.eventLeftColumn}>
                          <Text style={styles.eventTitle}>
                            {planetName}
                            {event.isRetrograde ? " Rx" : ""} enters{" "}
                            {event.toSign}
                          </Text>
                          <Text style={styles.eventDate}>
                            {formatDate(event.localDateTime)} at{" "}
                            {formatTime(event.localDateTime)}
                          </Text>
                        </View>
                        <View style={styles.eventRightColumn}>
                          <Text
                            style={[
                              styles.eventMoonPosition,
                              getZodiacColorStyle(event.toSign),
                            ]}
                          >
                            <Text
                              style={[
                                getPhysisSymbolStyle(fontLoaded, "medium"),
                                getZodiacColorStyle(event.toSign),
                              ]}
                            >
                              {getPlanetKeysFromNames()[
                                event.planet.charAt(0).toUpperCase() +
                                  event.planet.slice(1)
                              ] || ""}
                            </Text>
                            {"  "}
                            <Text
                              style={[
                                getPhysisSymbolStyle(fontLoaded, "medium"),
                                getZodiacColorStyle(event.toSign),
                              ]}
                            >
                              {getZodiacKeysFromNames()[event.toSign]}
                            </Text>
                            {"  "}
                            {getDegreeOnly(event.degreeFormatted)}{" "}
                            {event.toSign}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }

                  // Render station event
                  if (event.type === "station") {
                    const planetSymbols: Record<string, string> = {
                      mercury: "☿",
                      venus: "♀",
                      mars: "♂",
                      jupiter: "♃",
                      saturn: "♄",
                      uranus: "♅",
                      neptune: "♆",
                      pluto: "♇",
                    };

                    const planetName = formatPlanetNameForDisplay(event.planet);
                    const stationLabel =
                      event.stationType === "retrograde"
                        ? "stations retrograde"
                        : "stations direct";

                    const eventIsToday = isToday(event.localDateTime);
                    return (
                      <TouchableOpacity
                        key={event.id}
                        ref={isTargetEvent ? todayItemRef : undefined}
                        onLayout={
                          isTargetEvent && !hasScrolledToToday.current
                            ? handleTodayItemLayout
                            : undefined
                        }
                        style={[
                          styles.eventItem,
                          eventIsToday && styles.eventItemToday,
                        ]}
                        onPress={() => handleEventPress(event)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.eventLeftColumn}>
                          <Text style={styles.eventTitle}>
                            {planetName} {stationLabel}
                          </Text>
                          <Text style={styles.eventDate}>
                            {formatDate(event.localDateTime)} at{" "}
                            {formatTime(event.localDateTime)}
                          </Text>
                        </View>
                        <View style={styles.eventRightColumn}>
                          <Text style={styles.eventMoonPosition}>
                            <Text
                              style={{
                                color:
                                  event.stationType === "retrograde"
                                    ? "#FF6B6B"
                                    : "#51CF66",
                              }}
                            >
                              {event.stationType === "retrograde" ? "R" : "D"}
                            </Text>{" "}
                            <Text
                              style={[
                                getPhysisSymbolStyle(fontLoaded, "medium"),
                                getZodiacColorStyle(event.zodiacSignName),
                              ]}
                            >
                              {getPlanetKeysFromNames()[
                                event.planet.charAt(0).toUpperCase() +
                                  event.planet.slice(1)
                              ] || ""}
                            </Text>
                            {"  "}
                            <Text
                              style={[
                                getPhysisSymbolStyle(fontLoaded, "medium"),
                                getZodiacColorStyle(event.zodiacSignName),
                              ]}
                            >
                              {getZodiacKeysFromNames()[event.zodiacSignName]}
                            </Text>
                            {"  "}
                            <Text
                              style={getZodiacColorStyle(event.zodiacSignName)}
                            >
                              {getDegreeOnly(event.degreeFormatted)}{" "}
                              {event.zodiacSignName}
                            </Text>
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }

                  // Render aspect event
                  if (event.type === "aspect") {
                    const planetSymbols: Record<string, string> = {
                      sun: "☉",
                      mercury: "☿",
                      venus: "♀",
                      mars: "♂",
                      jupiter: "♃",
                      saturn: "♄",
                      uranus: "♅",
                      neptune: "♆",
                      pluto: "♇",
                    };

                    const planet1Name = formatPlanetNameForDisplay(
                      event.planet1
                    );
                    const planet2Name = formatPlanetNameForDisplay(
                      event.planet2
                    );

                    // Format aspect name (capitalize first letter)
                    const aspectName =
                      event.aspectName.charAt(0).toUpperCase() +
                      event.aspectName.slice(1);

                    const eventIsToday = isToday(event.localDateTime);
                    return (
                      <TouchableOpacity
                        key={event.id}
                        ref={isTargetEvent ? todayItemRef : undefined}
                        onLayout={
                          isTargetEvent && !hasScrolledToToday.current
                            ? handleTodayItemLayout
                            : undefined
                        }
                        style={[
                          styles.eventItem,
                          eventIsToday && styles.eventItemToday,
                        ]}
                        onPress={() => handleEventPress(event)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.eventLeftColumn}>
                          <Text style={styles.eventTitle}>
                            {planet1Name} {aspectName} {planet2Name}
                          </Text>
                          <Text style={styles.eventDate}>
                            {formatDate(event.localDateTime)} at{" "}
                            {formatTime(event.localDateTime)}
                          </Text>
                        </View>
                        <View style={styles.eventRightColumn}>
                          {event.aspectName === "conjunct" ? (
                            // For conjunctions, show only one position since both planets are at the same place
                            <Text
                              style={[
                                styles.eventMoonPosition,
                                getZodiacColorStyle(
                                  event.planet1Position.zodiacSignName
                                ),
                              ]}
                            >
                              <Text
                                style={[
                                  getPhysisSymbolStyle(fontLoaded, "medium"),
                                  getZodiacColorStyle(
                                    event.planet1Position.zodiacSignName
                                  ),
                                ]}
                              >
                                {getPlanetKeysFromNames()[planet1Name] || ""}
                              </Text>
                              {"  "}
                              <Text
                                style={[
                                  getPhysisSymbolStyle(fontLoaded, "medium"),
                                  getZodiacColorStyle(
                                    event.planet1Position.zodiacSignName
                                  ),
                                ]}
                              >
                                {
                                  getZodiacKeysFromNames()[
                                    event.planet1Position.zodiacSignName
                                  ]
                                }
                              </Text>
                              {"  "}
                              {getDegreeOnly(
                                event.planet1Position.degreeFormatted
                              )}{" "}
                              {event.planet1Position.zodiacSignName}
                            </Text>
                          ) : (
                            // For other aspects, show both positions
                            <>
                              <Text
                                style={[
                                  styles.eventMoonPosition,
                                  getZodiacColorStyle(
                                    event.planet1Position.zodiacSignName
                                  ),
                                ]}
                              >
                                <Text
                                  style={[
                                    getPhysisSymbolStyle(fontLoaded, "medium"),
                                    getZodiacColorStyle(
                                      event.planet1Position.zodiacSignName
                                    ),
                                  ]}
                                >
                                  {getPlanetKeysFromNames()[planet1Name] || ""}
                                </Text>
                                {"  "}
                                <Text
                                  style={[
                                    getPhysisSymbolStyle(fontLoaded, "medium"),
                                    getZodiacColorStyle(
                                      event.planet1Position.zodiacSignName
                                    ),
                                  ]}
                                >
                                  {
                                    getZodiacKeysFromNames()[
                                      event.planet1Position.zodiacSignName
                                    ]
                                  }
                                </Text>
                                {"  "}
                                {getDegreeOnly(
                                  event.planet1Position.degreeFormatted
                                )}{" "}
                                {event.planet1Position.zodiacSignName}
                              </Text>
                              <Text
                                style={[
                                  styles.eventMoonPosition,
                                  getZodiacColorStyle(
                                    event.planet2Position.zodiacSignName
                                  ),
                                  { marginTop: 4 },
                                ]}
                              >
                                <Text
                                  style={[
                                    getPhysisSymbolStyle(fontLoaded, "medium"),
                                    getZodiacColorStyle(
                                      event.planet2Position.zodiacSignName
                                    ),
                                  ]}
                                >
                                  {getPlanetKeysFromNames()[planet2Name] || ""}
                                </Text>
                                {"  "}
                                <Text
                                  style={[
                                    getPhysisSymbolStyle(fontLoaded, "medium"),
                                    getZodiacColorStyle(
                                      event.planet2Position.zodiacSignName
                                    ),
                                  ]}
                                >
                                  {
                                    getZodiacKeysFromNames()[
                                      event.planet2Position.zodiacSignName
                                    ]
                                  }
                                </Text>
                                {"  "}
                                {getDegreeOnly(
                                  event.planet2Position.degreeFormatted
                                )}{" "}
                                {event.planet2Position.zodiacSignName}
                              </Text>
                            </>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  }

                  return null;
                });
              })()
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No events found</Text>
              </View>
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
  },
  linesContainer: {
    flex: 1,
    backgroundColor: "#111",
    width: "100%",
    paddingHorizontal: 0, // No horizontal padding
  },
  zodiacHeaderFixed: {
    height: 25,
    flexDirection: "row",
    position: "relative",
    backgroundColor: "#111",
    width: "100%",
    marginHorizontal: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  zodiacHeaderItem: {
    height: 25,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    paddingVertical: 0,
    paddingHorizontal: 0,
    margin: 0,
  },
  zodiacSymbol: {
    color: "#FFFFFF",
    fontSize: 32,
    margin: 0,
    padding: 0,
    lineHeight: 32,
  },
  filterRowFixed: {
    height: 35, // Match zodiac header height
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
    width: "100%",
    marginHorizontal: 0,
    paddingHorizontal: 15,
    paddingVertical: 0,
    gap: 16, // Space between filter checkboxes
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    height: Platform.OS === "ios" ? 44 : 56, // Match React Navigation header height
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  headerCenter: {
    flex: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  yearNavButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  yearNavButtonText: {
    color: "#e6e6fa",
    fontSize: 24,
    fontWeight: "bold",
  },
  headerText: {
    color: "#e6e6fa",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 2,
    minWidth: 60,
    textAlign: "center",
  },
  viewModeToggleButton: {
    backgroundColor: "#2a2a3a",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e6e6fa",
  },
  viewModeToggleButtonText: {
    color: "#e6e6fa",
    fontSize: 11,
    fontWeight: "600",
  },
  scrollToTodayButton: {
    backgroundColor: "#2a2a3a",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e6e6fa",
  },
  scrollToTodayButtonText: {
    color: "#e6e6fa",
    fontSize: 11,
    fontWeight: "600",
  },
  headerRight: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  filterCheckbox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: "#e6e6fa",
    borderRadius: 3,
    marginRight: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  checkboxChecked: {
    backgroundColor: "#e6e6fa",
  },
  checkboxDisabled: {
    borderColor: "#555",
    opacity: 0.5,
  },
  checkmark: {
    color: "#111",
    fontSize: 10,
    fontWeight: "bold",
  },
  filterLabel: {
    color: "#e6e6fa",
    fontSize: 12,
  },
  filterLabelDisabled: {
    color: "#555",
  },
  eventsList: {
    flex: 1,
  },
  eventsListContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    color: "#e6e6fa",
    marginTop: 15,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  errorText: {
    color: "#ff6b6b",
    marginTop: 15,
    fontSize: 14,
    textAlign: "center",
  },
  eventItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 10,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  eventItemToday: {
    borderColor: "#e6e6fa",
    borderWidth: 2,
    backgroundColor: "#222",
  },
  eventLeftColumn: {
    flex: 1,
    marginRight: 15,
  },
  eventTitle: {
    color: "#e6e6fa",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
  },
  eventDate: {
    color: "#8a8a8a",
    fontSize: 13,
  },
  eventRightColumn: {
    alignItems: "flex-end",
  },
  eventMoonPosition: {
    fontSize: 18,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "#8a8a8a",
    fontSize: 14,
  },
});
