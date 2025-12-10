// ============================================================================
// IMPORTS
// ============================================================================
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  ImageBackground,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import {
  GestureHandlerRootView,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import * as Font from "expo-font";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MoonSvgImporter from "../components/MoonSvgImporter";
import DateTimePickerDrawer from "../components/DateTimePickerDrawer";
import { useAstrology } from "../contexts/AstrologyContext";
import { apiService, BirthData, BirthChart } from "../services/api";
import { sharedUI } from "../styles/sharedUI";
import { usePhysisFont, getPhysisSymbolStyle } from "../utils/physisFont";
import {
  getZodiacKeysFromNames,
  getPlanetKeysFromNames,
} from "../utils/physisSymbolMap";
import {
  checkForConjunct,
  checkForOpposition,
  checkForSquare,
  checkForTrine,
  checkForSextile,
  checkForWholeSignConjunct,
  checkForWholeSignOpposition,
  checkForWholeSignSquare,
  checkForWholeSignTrine,
  checkForWholeSignSextile,
  getActiveAspects,
  getActiveWholeSignAspects,
  checkEssentialDignities,
} from "../utils/aspectUtils";
import {
  getAspectColorStyle,
  getZodiacColorStyle,
  aspectColorStyles,
  zodiacColorStyles,
} from "../utils/colorUtils";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
interface moon30 {
  number: number;
  name: string;
  color: string;
}

interface TithiData {
  numbers: [number, number];
  name: string;
  planetRuler: string;
  division: string;
  deity: string;
}

interface LunarPhase {
  moonPhase: string;
  date: string;
  utcDateTime?: Date;
  localDateTime?: Date;
  moonPosition?: {
    degree: number;
    degreeFormatted: string;
    zodiacSignName: string;
  };
}

interface LunationEvent {
  id: string;
  type: "lunation";
  date: Date;
  utcDateTime: Date;
  localDateTime: Date;
  title: string;
  moonPosition?: {
    degree: number;
    degreeFormatted: string;
    zodiacSignName: string;
  };
  isEclipse?: boolean;
  eclipseType?: "lunar" | "solar";
}

// ============================================================================
// DATA & CONSTANTS
// ============================================================================

const moonTithiMap: moon30[] = [
  { number: 1, name: "S1", color: "Blue" },
  { number: 2, name: "S2", color: "Green" },
  { number: 3, name: "S3", color: "Green" },
  { number: 4, name: "S4", color: "Red" },
  { number: 5, name: "S5", color: "Green" },
  { number: 6, name: "S6", color: "Green" },
  { number: 7, name: "S7", color: "Green" },
  { number: 8, name: "S8", color: "Red" },
  { number: 9, name: "S9", color: "Red" },
  { number: 10, name: "S10", color: "Green" },
  { number: 11, name: "S11", color: "Blue" },
  { number: 12, name: "S12", color: "Blue" },
  { number: 13, name: "S13", color: "Green" },
  { number: 14, name: "S14", color: "Red" },
  { number: 15, name: "S15", color: "Blue" },
  { number: 16, name: "K1", color: "Blue" },
  { number: 17, name: "K2", color: "Green" },
  { number: 18, name: "K3", color: "Green" },
  { number: 19, name: "K4", color: "Red" },
  { number: 20, name: "K5", color: "Green" },
  { number: 21, name: "K6", color: "Blue" },
  { number: 22, name: "K7", color: "Blue" },
  { number: 23, name: "K8", color: "Red" },
  { number: 24, name: "K9", color: "Red" },
  { number: 25, name: "K10", color: "Blue" },
  { number: 26, name: "K11", color: "Red" },
  { number: 27, name: "K12", color: "Red" },
  { number: 28, name: "K13", color: "Red" },
  { number: 29, name: "K14", color: "Red" },
  { number: 30, name: "K15", color: "Red" },
];

const tithiData: TithiData[] = [
  {
    numbers: [1, 16],
    name: "Pratipada",
    planetRuler: "Sun",
    division: "Nanda",
    deity: "Brahmā",
  },
  {
    numbers: [2, 17],
    name: "Dvītiyā",
    planetRuler: "Moon",
    division: "Bhadra",
    deity: "Vidhāțr (Hari)",
  },
  {
    numbers: [3, 18],
    name: "Trtīyā",
    planetRuler: "Mars",
    division: "Jāya",
    deity: "Vişņu",
  },
  {
    numbers: [4, 19],
    name: "Chaturthi",
    planetRuler: "Mercury",
    division: "Ṛkta",
    deity: "Yama",
  },
  {
    numbers: [5, 20],
    name: "Pañchami",
    planetRuler: "Jupiter",
    division: "Pūrņa",
    deity: "Chandra",
  },
  {
    numbers: [6, 21],
    name: "Şaşțī",
    planetRuler: "Venus",
    division: "Nanda",
    deity: "Agni (Subrahmanya)",
  },
  {
    numbers: [7, 22],
    name: "Saptamī",
    planetRuler: "Saturn",
    division: "Bhadra",
    deity: "Indra",
  },
  {
    numbers: [8, 23],
    name: "Aşțamī",
    planetRuler: "Rāhu",
    division: "Jāya",
    deity: "Vasus",
  },
  {
    numbers: [9, 24],
    name: "Navamī",
    planetRuler: "Sun",
    division: "Ṛkta",
    deity: "Naga",
  },
  {
    numbers: [10, 25],
    name: "Daśamī",
    planetRuler: "Moon",
    division: "Pūrņa",
    deity: "Dharma (Aryamā)",
  },
  {
    numbers: [11, 26],
    name: "Ekādaśī",
    planetRuler: "Mars",
    division: "Nanda",
    deity: "Rudra",
  },
  {
    numbers: [12, 27],
    name: "Dwadaśī",
    planetRuler: "Mercury",
    division: "Bhadra",
    deity: "Āditya (Savitr)",
  },
  {
    numbers: [13, 28],
    name: "Trayodaśī",
    planetRuler: "Jupiter",
    division: "Jāya",
    deity: "Manmatha (Bhaga)",
  },
  {
    numbers: [14, 29],
    name: "Chaturdaśī",
    planetRuler: "Venus",
    division: "Ṛkta",
    deity: "Kali",
  },
  {
    numbers: [15, 0],
    name: "Pūrņimā",
    planetRuler: "Saturn/Rāhu",
    division: "Pūrņa",
    deity: "Vishvadevas/Pitrs",
  },
  {
    numbers: [1, 16],
    name: "Pratipada",
    planetRuler: "Sun",
    division: "Nanda",
    deity: "Brahmā",
  },
  {
    numbers: [2, 17],
    name: "Dvītiyā",
    planetRuler: "Moon",
    division: "Bhadra",
    deity: "Vidhāțr (Hari)",
  },
  {
    numbers: [3, 18],
    name: "Trtīyā",
    planetRuler: "Mars",
    division: "Jāya",
    deity: "Vişņu",
  },
  {
    numbers: [4, 19],
    name: "Chaturthi",
    planetRuler: "Mercury",
    division: "Ṛkta",
    deity: "Yama",
  },
  {
    numbers: [5, 20],
    name: "Pañchami",
    planetRuler: "Jupiter",
    division: "Pūrņa",
    deity: "Chandra",
  },
  {
    numbers: [6, 21],
    name: "Şaşțī",
    planetRuler: "Venus",
    division: "Nanda",
    deity: "Agni (Subrahmanya)",
  },
  {
    numbers: [7, 22],
    name: "Saptamī",
    planetRuler: "Saturn",
    division: "Bhadra",
    deity: "Indra",
  },
  {
    numbers: [8, 23],
    name: "Aşțamī",
    planetRuler: "Rāhu",
    division: "Jāya",
    deity: "Vasus",
  },
  {
    numbers: [9, 24],
    name: "Navamī",
    planetRuler: "Sun",
    division: "Ṛkta",
    deity: "Naga",
  },
  {
    numbers: [10, 25],
    name: "Daśamī",
    planetRuler: "Moon",
    division: "Pūrņa",
    deity: "Dharma (Aryamā)",
  },
  {
    numbers: [11, 26],
    name: "Ekādaśī",
    planetRuler: "Mars",
    division: "Nanda",
    deity: "Rudra",
  },
  {
    numbers: [12, 27],
    name: "Dwadaśī",
    planetRuler: "Mercury",
    division: "Bhadra",
    deity: "Āditya (Savitr)",
  },
  {
    numbers: [13, 28],
    name: "Trayodaśī",
    planetRuler: "Jupiter",
    division: "Jāya",
    deity: "Manmatha (Bhaga)",
  },
  {
    numbers: [14, 29],
    name: "Chaturdaśī",
    planetRuler: "Venus",
    division: "Ṛkta",
    deity: "Kali",
  },
  {
    numbers: [15, 0],
    name: "Amāvāsya",
    planetRuler: "Saturn/Rāhu",
    division: "Pūrņa",
    deity: "Vishvadevas/Pitrs",
  },
];

// ============================================================================
// UTILITY FUNCTIONS & LOGIC
// ============================================================================
// Tithi calculation function
const calculateTithi = (
  moonLongitude: number,
  sunLongitude: number
): { tithi: number; percentageRemaining: number } => {
  // Calculate the difference between Moon and Sun longitude
  // Ensure we handle the 0-360° range correctly
  let longitudeDifference = moonLongitude - sunLongitude;

  // Normalize to 0-360 range
  longitudeDifference = ((longitudeDifference % 360) + 360) % 360;

  // Calculate tithi: (Moon - Sun) / 12
  let tithi = longitudeDifference / 12;

  // Calculate the percentage remaining in the current tithi
  const percentageRemaining = (1 - (tithi % 1)) * 100;

  // Add 1 to convert from 0-based to 1-based indexing
  // Use Math.floor to get the current tithi (round down)
  let finalTithi = Math.floor(tithi) + 1;

  // Ensure it's between 1 and 30
  if (finalTithi > 30) {
    finalTithi = finalTithi - 30;
  }
  if (finalTithi <= 0) {
    finalTithi = finalTithi + 30;
  }

  return {
    tithi: finalTithi,
    percentageRemaining: percentageRemaining,
  };
};

// Paksha (fortnight) determination
const getPaksha = (tithi: number): string => {
  return tithi <= 15 ? "Shukla Paksha (Waxing)" : "Krishna Paksha (Waning)";
};

// ============================================================================
// COMPONENT
// ============================================================================
export default function MoonScreen({ navigation, route }: any) {
  const { currentChart, loading, error } = useAstrology();
  const { fontLoaded } = usePhysisFont();

  // Debug flag to control aspect debugging display
  const DEBUG_ASPECTS = true;

  // Ref for the ScrollView to control scrolling
  const scrollViewRef = useRef<ScrollView>(null);

  // Get selected date from route params, default to today
  const selectedDate = route?.params?.selectedDate
    ? new Date(route.params.selectedDate)
    : new Date();

  // State for the currently displayed date
  const [displayDate, setDisplayDate] = useState(selectedDate);

  // State for the selected date's chart data
  const [selectedDateChart, setSelectedDateChart] = useState<BirthChart | null>(
    null
  );

  // State for the date/time picker drawer
  const [drawerVisible, setDrawerVisible] = useState(false);

  // State for lunar phases (now using LunationEvent type from cache)
  const [lunarPhases, setLunarPhases] = useState<LunationEvent[]>([]);
  const [lunarPhasesLoading, setLunarPhasesLoading] = useState(false);

  // State for current date eclipse info
  const [currentDateEclipse, setCurrentDateEclipse] = useState<{
    isEclipse: boolean;
    eclipseType?: "lunar" | "solar";
  } | null>(null);

  // Helper function to create cache key for lunations data
  const getLunationsCacheKey = (
    year: number,
    latitude: number,
    longitude: number
  ): string => {
    return `lunations-${year}-${latitude}-${longitude}`;
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

  // Function to fetch upcoming lunations from cache (current year and next year)
  // If cache is empty, fetches and caches the data
  const fetchLunarPhases = async (date: Date) => {
    try {
      setLunarPhasesLoading(true);
      const currentYear = date.getFullYear();
      const nextYear = currentYear + 1;

      const location = currentChart?.location || {
        latitude: 40.7128,
        longitude: -74.006,
      };

      // Load lunations for current year and next year from cache
      let currentYearLunations = await loadLunationsFromCache(
        currentYear,
        location.latitude,
        location.longitude
      );
      let nextYearLunations = await loadLunationsFromCache(
        nextYear,
        location.latitude,
        location.longitude
      );

      // If cache is empty, fetch the data (same logic as CalendarScreen)
      if (!currentYearLunations) {
        console.log(
          `🌐 Cache miss for year ${currentYear}, fetching lunations data...`
        );
        currentYearLunations = await fetchAndCacheLunationsForYear(
          currentYear,
          location.latitude,
          location.longitude
        );
      }

      if (!nextYearLunations) {
        console.log(
          `🌐 Cache miss for year ${nextYear}, fetching lunations data...`
        );
        nextYearLunations = await fetchAndCacheLunationsForYear(
          nextYear,
          location.latitude,
          location.longitude
        );
      }

      // Combine both years
      const allLunations: LunationEvent[] = [
        ...(currentYearLunations || []),
        ...(nextYearLunations || []),
      ];

      // Filter for upcoming lunations (from the selected date onwards, not today)
      const selectedDate = new Date(date);
      selectedDate.setHours(0, 0, 0, 0); // Set to start of day for comparison

      const upcomingLunations = allLunations.filter((lunation) => {
        const lunationDate = new Date(lunation.localDateTime);
        lunationDate.setHours(0, 0, 0, 0);
        return lunationDate >= selectedDate;
      });

      // Sort chronologically
      upcomingLunations.sort(
        (a, b) => a.localDateTime.getTime() - b.localDateTime.getTime()
      );

      // Limit to next 12 lunations (approximately 1 year)
      setLunarPhases(upcomingLunations.slice(0, 12));

      // Check if current displayDate is an eclipse day
      checkEclipseForDate(date);
    } catch (error) {
      console.error("Error fetching lunar phases from cache:", error);
      setLunarPhases([]);
    } finally {
      setLunarPhasesLoading(false);
    }
  };

  // Check if a specific date is an eclipse day
  const checkEclipseForDate = async (date: Date) => {
    try {
      const year = date.getFullYear();
      const location = currentChart?.location || {
        latitude: 40.7128,
        longitude: -74.006,
      };

      // Load all lunations for the year to check for eclipse
      const allLunations = await loadLunationsFromCache(
        year,
        location.latitude,
        location.longitude
      );

      if (!allLunations || allLunations.length === 0) {
        setCurrentDateEclipse(null);
        return;
      }

      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);

      // Find lunation events that fall on this date
      const eclipseOnDate = allLunations.find((lunation) => {
        const lunationDate = new Date(lunation.localDateTime);
        return (
          lunationDate >= dateStart &&
          lunationDate <= dateEnd &&
          lunation.isEclipse &&
          (lunation.title === "New Moon" || lunation.title === "Full Moon")
        );
      });

      if (eclipseOnDate) {
        setCurrentDateEclipse({
          isEclipse: true,
          eclipseType: eclipseOnDate.eclipseType,
        });
      } else {
        setCurrentDateEclipse(null);
      }
    } catch (error) {
      console.error("Error checking eclipse for date:", error);
      setCurrentDateEclipse(null);
    }
  };

  // Fetch and cache lunations for a specific year (same logic as CalendarScreen)
  const fetchAndCacheLunationsForYear = async (
    year: number,
    latitude: number,
    longitude: number
  ): Promise<LunationEvent[] | null> => {
    try {
      const allPhases: Array<{ moonPhase: string; date: string }> = [];

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
        console.warn(`No lunar phases found for year ${year}`);
        return null;
      }

      // Fetch eclipse data for the year
      let lunarEclipses: Array<{ date?: string; [key: string]: any }> = [];
      let solarEclipses: Array<{ date?: string; [key: string]: any }> = [];

      try {
        const lunarEclipseData = await apiService.getEclipses(year, "lunar");
        if (lunarEclipseData?.response?.data) {
          lunarEclipses = lunarEclipseData.response.data;
        }
      } catch (error) {
        console.error("Error fetching lunar eclipses:", error);
      }

      try {
        const solarEclipseData = await apiService.getEclipses(year, "solar");
        if (solarEclipseData?.response?.data) {
          solarEclipses = solarEclipseData.response.data;
        }
      } catch (error) {
        console.error("Error fetching solar eclipses:", error);
      }

      // Create eclipse map (same logic as CalendarScreen)
      const eclipseMap = new Map<
        number,
        { type: "lunar" | "solar"; date: Date }
      >();

      // Process lunar eclipses
      lunarEclipses.forEach((eclipse) => {
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
        if (dateValue && typeof dateValue === "string") {
          let eclipseDate = dateValue.trim();
          const hasTimezone =
            /[Z+-]\d{2}:?\d{2}$/.test(eclipseDate) || eclipseDate.endsWith("Z");
          if (!hasTimezone) {
            eclipseDate = `${eclipseDate}Z`;
          }
          const eclipseDateTime = new Date(eclipseDate);
          if (!isNaN(eclipseDateTime.getTime())) {
            eclipseMap.set(eclipseDateTime.getTime(), {
              type: "lunar",
              date: eclipseDateTime,
            });
          }
        }
      });

      // Process solar eclipses
      solarEclipses.forEach((eclipse) => {
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
        if (dateValue && typeof dateValue === "string") {
          let eclipseDate = dateValue.trim();
          const hasTimezone =
            /[Z+-]\d{2}:?\d{2}$/.test(eclipseDate) || eclipseDate.endsWith("Z");
          if (!hasTimezone) {
            eclipseDate = `${eclipseDate}Z`;
          }
          const eclipseDateTime = new Date(eclipseDate);
          if (!isNaN(eclipseDateTime.getTime())) {
            eclipseMap.set(eclipseDateTime.getTime(), {
              type: "solar",
              date: eclipseDateTime,
            });
          }
        }
      });

      // Parse UTC times
      const phasesWithTimes = allPhases.map((phase) => {
        const utcString = phase.date.endsWith("Z")
          ? phase.date
          : `${phase.date}Z`;
        const utcDateTime = new Date(utcString);
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
              latitude: latitude,
              longitude: longitude,
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

      // Convert to LunationEvent format and mark eclipses (same logic as CalendarScreen)
      const lunations: LunationEvent[] = phasesWithMoonPositions
        .filter((phase) => phase.utcDateTime && phase.localDateTime)
        .map((phase, index) => {
          const phaseName = phase.moonPhase.replace(/([A-Z])/g, " $1").trim();
          const lunationTime = phase.utcDateTime!.getTime();
          let eclipseInfo: { type: "lunar" | "solar"; date: Date } | undefined;
          let closestTimeDiff = Infinity;

          const isNewMoon = phaseName === "New Moon";
          const isFullMoon = phaseName === "Full Moon";

          // Find closest eclipse within 24 hours, matching type
          for (const [eclipseTime, info] of eclipseMap.entries()) {
            const typeMatches =
              (info.type === "solar" && isNewMoon) ||
              (info.type === "lunar" && isFullMoon);

            if (!typeMatches) continue;

            const timeDiff = Math.abs(lunationTime - eclipseTime);
            if (timeDiff < 24 * 60 * 60 * 1000 && timeDiff < closestTimeDiff) {
              eclipseInfo = info;
              closestTimeDiff = timeDiff;
            }
          }

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

      // Save to cache
      const cacheKey = getLunationsCacheKey(year, latitude, longitude);
      const cacheData = {
        data: lunations,
        timestamp: Date.now(),
        year,
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`💾 Saved lunations data to cache for year ${year}`);

      return lunations;
    } catch (error) {
      console.error(`Error fetching lunations for year ${year}:`, error);
      return null;
    }
  };

  // Function to fetch chart data for a specific date
  const fetchChartForDate = async (date: Date, useUTC: boolean = false) => {
    try {
      // Use the same location as the current chart
      const location = currentChart?.location || {
        latitude: 40.7128,
        longitude: -74.006,
      };

      const birthData: BirthData = useUTC
        ? {
            // Use UTC components for exact ephemeris queries (e.g., lunations)
            year: date.getUTCFullYear(),
            month: date.getUTCMonth() + 1,
            day: date.getUTCDate(),
            hour: date.getUTCHours(),
            minute: date.getUTCMinutes(),
            latitude: location.latitude,
            longitude: location.longitude,
          }
        : {
            // Use local components for user-selected dates
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            hour: date.getHours(),
            minute: date.getMinutes(),
            latitude: location.latitude,
            longitude: location.longitude,
          };

      const response = await apiService.getBirthChart(birthData);

      if (response.success) {
        setSelectedDateChart(response.data);
      } else {
        console.error("Failed to fetch chart for selected date");
      }
    } catch (error) {
      console.error("Error fetching chart for selected date:", error);
    }
  };

  // Function to update the display date
  const updateDisplayDate = (days: number) => {
    const newDate = new Date(displayDate);
    newDate.setDate(newDate.getDate() + days);
    setDisplayDate(newDate);
    fetchChartForDate(newDate);
  };

  // Drawer functions
  const openDrawer = () => {
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  const applyDateChange = (date: Date) => {
    setDisplayDate(date);
    fetchChartForDate(date);
  };

  const followCurrentTime = () => {
    const now = new Date();
    setDisplayDate(now);
    // Clear selectedDateChart so we fall back to currentChart from context
    // This ensures we get the same current time handling as the initial load
    setSelectedDateChart(null);
  };

  // Handle route params for selectedDate (from astrology screen navigation)
  useEffect(() => {
    if (route?.params?.selectedDate) {
      const dateFromRoute = new Date(route.params.selectedDate);
      // Check if we need to update displayDate
      const dateMatches = dateFromRoute.getTime() === displayDate.getTime();
      if (!dateMatches) {
        console.log(
          "📅 [MoonScreen] Setting date from route params:",
          dateFromRoute.toISOString()
        );
        setDisplayDate(dateFromRoute);
      }
    }
  }, [route?.params?.selectedDate]);

  // Fetch chart when route params change and currentChart is available
  useEffect(() => {
    if (route?.params?.selectedDate && currentChart) {
      const dateFromRoute = new Date(route.params.selectedDate);
      console.log(
        "📅 [MoonScreen] Fetching chart for date from route params:",
        dateFromRoute.toISOString()
      );
      // Use UTC to ensure consistency with AstrologyScreen
      fetchChartForDate(dateFromRoute, true);
    }
  }, [route?.params?.selectedDate, currentChart]);

  // Handler for clicking on a lunation item
  const handleLunationClick = (utcDate: Date, localDate: Date) => {
    // Use local date for display, but fetch chart based on exact UTC time
    setDisplayDate(localDate);
    fetchChartForDate(utcDate, true); // true = use UTC components
    // Scroll to top
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  // Handle swipe gestures
  const panGesture = Gesture.Pan()
    .onEnd((event) => {
      try {
        const translationX = event.translationX || 0;
        const threshold = 50; // Minimum swipe distance

        if (translationX > threshold) {
          // Swipe right - go to previous day
          const newDate = new Date(displayDate);
          newDate.setDate(newDate.getDate() - 1);
          setDisplayDate(newDate);
          fetchChartForDate(newDate);
        } else if (translationX < -threshold) {
          // Swipe left - go to next day
          const newDate = new Date(displayDate);
          newDate.setDate(newDate.getDate() + 1);
          setDisplayDate(newDate);
          fetchChartForDate(newDate);
        }
      } catch (error) {
        console.error("Error handling swipe gesture:", error);
      }
    })
    .activeOffsetX([-10, 10]) // Only activate when horizontal movement is detected
    .failOffsetY([-20, 20]) // Fail if vertical movement is too much
    .runOnJS(true); // Ensure gesture runs on JS thread for state updates

  // Use selected date chart if available, otherwise fall back to current chart
  const activeChart = selectedDateChart || currentChart;

  // Calculate tithi if we have both Moon and Sun positions
  let currentTithi = null;
  let tithiPercentageRemaining = null;
  let tithiInfo: TithiData | null = null;
  let paksha = "";

  if (
    activeChart?.planets?.moon &&
    activeChart?.planets?.sun &&
    !activeChart.planets.moon.error &&
    !activeChart.planets.sun.error
  ) {
    const tithiResult = calculateTithi(
      activeChart.planets.moon.longitude,
      activeChart.planets.sun.longitude
    );
    currentTithi = tithiResult.tithi;
    tithiPercentageRemaining = tithiResult.percentageRemaining;
    tithiInfo = tithiData[currentTithi - 1];
    paksha = getPaksha(currentTithi);
  }

  // Use calculated tithi for moon phase, fallback to 15 if no tithi available
  const currentMoonPhase = currentTithi || 15;

  // Fetch chart data for the selected date when it changes
  useEffect(() => {
    if (currentChart && displayDate) {
      // Only fetch if we don't already have data for this date
      const today = new Date();
      const isToday = displayDate.toDateString() === today.toDateString();

      if (!isToday && !selectedDateChart) {
        fetchChartForDate(displayDate);
      }

      // Fetch lunar phases (this will also check for eclipse)
      fetchLunarPhases(displayDate);
    }
  }, [displayDate, currentChart]);

  // Check for eclipse when displayDate changes
  useEffect(() => {
    if (displayDate && currentChart) {
      checkEclipseForDate(displayDate);
    }
  }, [displayDate, currentChart]);

  if (loading || !fontLoaded) {
    return (
      <View style={[styles.container, sharedUI.centered]}>
        <ActivityIndicator size="large" color="#e6e6fa" />
        <Text style={sharedUI.loadingText}>
          {loading ? "Loading current positions..." : "Loading fonts..."}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, sharedUI.centered]}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={sharedUI.description}>
          Problem loading current moon phase
        </Text>
      </View>
    );
  }

  // ============================================================================
  // TEMPLATE (JSX)
  // ============================================================================
  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <View style={styles.container}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Background image that scrolls with content */}
            <ImageBackground
              source={require("../../assets/images/moon-gradient.png")}
              style={styles.backgroundImage}
              resizeMode="cover"
            >
              {/* Moon Degree/Zodiac Sign - Top Right */}
              {activeChart?.planets?.moon &&
                !activeChart.planets.moon.error && (
                  <View style={styles.scrollingMoonDegree}>
                    <Text
                      style={[
                        styles.stickySubtitle,
                        getZodiacColorStyle(
                          activeChart.planets.moon.zodiacSignName
                        ),
                      ]}
                    >
                      {activeChart.planets.moon.degreeFormatted}{" "}
                      <Text
                        style={[
                          getPhysisSymbolStyle(fontLoaded, "large"),
                          getZodiacColorStyle(
                            activeChart.planets.moon.zodiacSignName
                          ),
                        ]}
                      >
                        {
                          getZodiacKeysFromNames()[
                            activeChart.planets.moon.zodiacSignName
                          ]
                        }
                      </Text>
                    </Text>
                  </View>
                )}

              <View style={styles.moonSvgContainer}>
                <MoonSvgImporter
                  svgName={currentMoonPhase.toString()}
                  width={240}
                  height={240}
                  style={styles.moonPhaseSvg}
                />
                {currentDateEclipse?.isEclipse && (
                  <View style={styles.eclipseOverlay} />
                )}
              </View>

              {activeChart && (
                <>
                  <Text style={styles.title}>
                    {(() => {
                      const moonTithi = moonTithiMap.find(
                        (tithi) => tithi.number === currentTithi
                      );
                      return moonTithi ? (
                        <TouchableOpacity
                          onPress={() =>
                            navigation.navigate("TithiInfo", {
                              selectedDate: displayDate,
                            })
                          }
                          style={styles.tithiNameButton}
                        >
                          <Text
                            style={[
                              styles.tithiNameText,
                              { color: moonTithi.color.toLowerCase() },
                            ]}
                          >
                            {moonTithi.name}{" "}
                          </Text>
                        </TouchableOpacity>
                      ) : null;
                    })()}
                    {activeChart.planets.moon?.zodiacSignName} Moon
                  </Text>

                  {/* Eclipse label */}
                  {currentDateEclipse?.isEclipse && (
                    <Text style={styles.eclipseLabel}>
                      🔴 (
                      {currentDateEclipse.eclipseType === "solar"
                        ? "Solar"
                        : "Lunar"}{" "}
                      Eclipse)
                    </Text>
                  )}

                  {/* Moon degree and zodiac sign */}
                  {currentTithi && (
                    <Text style={styles.subtitle}>
                      {currentTithi <= 15 ? "Waxing Moon" : "Waning Moon"}
                    </Text>
                  )}

                  {/* Essential Dignities */}
                  {activeChart.planets.moon &&
                    !activeChart.planets.moon.error && (
                      <View style={styles.dignityContainer}>
                        {(() => {
                          const moonDignities = checkEssentialDignities(
                            activeChart.planets.moon,
                            "moon"
                          );

                          if (!moonDignities.hasDignity) {
                            return null;
                          }

                          return moonDignities.dignities.map(
                            (dignity, index) => (
                              <Text
                                key={index}
                                style={[
                                  styles.dignityText,
                                  dignity.type === "domicile"
                                    ? styles.domicileColor
                                    : dignity.type === "exaltation"
                                    ? styles.exaltationColor
                                    : dignity.type === "detriment"
                                    ? styles.detrimentColor
                                    : dignity.type === "fall"
                                    ? styles.fallColor
                                    : styles.dignityText,
                                ]}
                              >
                                Moon in {dignity.type} ({dignity.sign})
                              </Text>
                            )
                          );
                        })()}
                      </View>
                    )}

                  {/* Aspects between Sun and Moon */}
                  {activeChart?.planets?.sun &&
                    activeChart?.planets?.moon &&
                    !activeChart.planets.sun.error &&
                    !activeChart.planets.moon.error && (
                      <View style={styles.aspectsContainer}>
                        <Text style={styles.aspectsTitle}>Aspects</Text>

                        {(() => {
                          const moonPlanet = activeChart.planets.moon;

                          // Define consistent planet order (excluding moon)
                          const planetOrder = [
                            "sun",
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

                          // Get all planets except moon for comparison, sorted by planet order
                          const otherPlanets = Object.entries(
                            activeChart.planets
                          )
                            .filter(
                              ([name, planet]) =>
                                name !== "moon" && planet && !planet.error
                            )
                            .sort(([nameA], [nameB]) => {
                              const indexA = planetOrder.indexOf(nameA);
                              const indexB = planetOrder.indexOf(nameB);
                              // If planet not in order list, put it at the end
                              const sortA = indexA === -1 ? 999 : indexA;
                              const sortB = indexB === -1 ? 999 : indexB;
                              return sortA - sortB;
                            });

                          return (
                            <View style={styles.aspectsList}>
                              {/* Data rows */}
                              {otherPlanets
                                .filter(([planetName, planet]) => {
                                  const allActiveAspects = getActiveAspects(
                                    moonPlanet,
                                    planet
                                  );
                                  return allActiveAspects.length > 0;
                                })
                                .map(([planetName, planet]) => {
                                  const allActiveAspects = getActiveAspects(
                                    moonPlanet,
                                    planet
                                  );

                                  const activeAspects = allActiveAspects.filter(
                                    (aspect) =>
                                      !aspect.startsWith("whole sign ")
                                  );
                                  const activeWholeSignAspects =
                                    allActiveAspects.filter((aspect) =>
                                      aspect.startsWith("whole sign ")
                                    );

                                  const wholeSignAspects =
                                    activeWholeSignAspects.length > 0
                                      ? activeWholeSignAspects.map((aspect) => {
                                          const aspectName = aspect.replace(
                                            "whole sign ",
                                            ""
                                          );
                                          const otherPlanetSign =
                                            planet.zodiacSignName;
                                          const zodiacSymbol =
                                            getZodiacKeysFromNames()[
                                              otherPlanetSign
                                            ];
                                          return {
                                            aspectName,
                                            otherPlanetSign,
                                            zodiacSymbol,
                                            degree: planet.degree,
                                            degreeFormatted:
                                              planet.degreeFormatted,
                                          };
                                        })
                                      : [];

                                  // Format 3-degree aspects with full UI and orb information
                                  const degreeAspects =
                                    activeAspects.length > 0
                                      ? activeAspects.map((aspectName) => {
                                          const otherPlanetSign =
                                            planet.zodiacSignName;
                                          const zodiacSymbol =
                                            getZodiacKeysFromNames()[
                                              otherPlanetSign
                                            ];

                                          // Get orb information for this aspect
                                          let orb = 0;
                                          switch (aspectName) {
                                            case "conjunct":
                                              const conjunctResult =
                                                checkForConjunct(
                                                  moonPlanet,
                                                  planet
                                                );
                                              orb = conjunctResult.orb || 0;
                                              break;
                                            case "opposition":
                                              const oppositionResult =
                                                checkForOpposition(
                                                  moonPlanet,
                                                  planet
                                                );
                                              orb = oppositionResult.orb || 0;
                                              break;
                                            case "square":
                                              const squareResult =
                                                checkForSquare(
                                                  moonPlanet,
                                                  planet
                                                );
                                              orb = squareResult.orb || 0;
                                              break;
                                            case "trine":
                                              const trineResult = checkForTrine(
                                                moonPlanet,
                                                planet
                                              );
                                              orb = trineResult.orb || 0;
                                              break;
                                            case "sextile":
                                              const sextileResult =
                                                checkForSextile(
                                                  moonPlanet,
                                                  planet
                                                );
                                              orb = sextileResult.orb || 0;
                                              break;
                                          }

                                          return {
                                            aspectName,
                                            otherPlanetSign,
                                            zodiacSymbol,
                                            orb: orb.toFixed(1),
                                            degree: planet.degree,
                                            degreeFormatted:
                                              planet.degreeFormatted,
                                          };
                                        })
                                      : [];

                                  // Combine and deduplicate aspects
                                  const allAspects = [
                                    ...wholeSignAspects,
                                    ...degreeAspects,
                                  ];
                                  const uniqueAspects = allAspects.filter(
                                    (aspect, index, array) => {
                                      return (
                                        array.findIndex(
                                          (a) =>
                                            a.aspectName === aspect.aspectName
                                        ) === index
                                      );
                                    }
                                  );

                                  return (
                                    <View
                                      key={planetName}
                                      style={styles.aspectTableRow}
                                    >
                                      <View style={styles.aspectLeftColumn}>
                                        {/* Display deduplicated aspects */}
                                        {uniqueAspects.map(
                                          (aspectInfo, index) => (
                                            <Text
                                              key={index}
                                              style={styles.aspectLabelText}
                                            >
                                              <Text
                                                style={[
                                                  getPhysisSymbolStyle(
                                                    fontLoaded,
                                                    "large"
                                                  ),
                                                  getZodiacColorStyle(
                                                    moonPlanet.zodiacSignName
                                                  ),
                                                ]}
                                              >
                                                {
                                                  getZodiacKeysFromNames()[
                                                    moonPlanet.zodiacSignName
                                                  ]
                                                }
                                              </Text>{" "}
                                              Moon{" "}
                                              <Text
                                                style={[
                                                  getAspectColorStyle(
                                                    aspectInfo.aspectName
                                                  ),
                                                ]}
                                              >
                                                {aspectInfo.aspectName}
                                              </Text>{" "}
                                              {planetName
                                                .charAt(0)
                                                .toUpperCase() +
                                                planetName.slice(1)}
                                              {/* Show orb information for degree aspects */}
                                              {(aspectInfo as any).orb && (
                                                <Text
                                                  style={styles.orbLabelText}
                                                >
                                                  {" "}
                                                  ({(aspectInfo as any).orb}°
                                                  orb)
                                                </Text>
                                              )}
                                            </Text>
                                          )
                                        )}
                                      </View>
                                      <View style={styles.aspectRightColumn}>
                                        {uniqueAspects.map(
                                          (aspectInfo, index) => (
                                            <Text
                                              key={index}
                                              style={[
                                                styles.aspectPlanetPosition,
                                                getZodiacColorStyle(
                                                  aspectInfo.otherPlanetSign
                                                ),
                                              ]}
                                            >
                                              <Text
                                                style={[
                                                  getPhysisSymbolStyle(
                                                    fontLoaded,
                                                    "medium"
                                                  ),
                                                  getZodiacColorStyle(
                                                    aspectInfo.otherPlanetSign
                                                  ),
                                                ]}
                                              >
                                                {aspectInfo.zodiacSymbol}
                                              </Text>{" "}
                                              {
                                                (aspectInfo as any)
                                                  .degreeFormatted
                                              }{" "}
                                              {aspectInfo.otherPlanetSign}
                                            </Text>
                                          )
                                        )}
                                      </View>
                                    </View>
                                  );
                                })}
                            </View>
                          );
                        })()}
                      </View>
                    )}

                  {/* Upcoming Lunar Phases Section */}
                  <View style={styles.lunarPhasesContainer}>
                    <Text style={styles.lunarPhasesTitle}>
                      Upcoming Lunations
                    </Text>
                    {lunarPhasesLoading ? (
                      <ActivityIndicator size="small" color="#111111" />
                    ) : lunarPhases.length > 0 ? (
                      <View style={styles.lunarPhasesList}>
                        {lunarPhases.map((lunation, index) => {
                          if (!lunation.localDateTime) return null;

                          // Get emoji for moon phase (same logic as CalendarScreen)
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

                          const phaseName = lunation.title;
                          const emoji = getPhaseEmoji(
                            phaseName,
                            lunation.isEclipse,
                            lunation.eclipseType
                          );
                          const eclipseLabel = lunation.isEclipse
                            ? ` 🔴 (${
                                lunation.eclipseType === "solar"
                                  ? "Solar"
                                  : "Lunar"
                              } Eclipse)`
                            : "";

                          // Format the date and time
                          const dateString =
                            lunation.localDateTime.toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            });

                          const timeString =
                            lunation.localDateTime.toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            });

                          return (
                            <TouchableOpacity
                              key={lunation.id || index}
                              style={styles.lunarPhaseRow}
                              onPress={() =>
                                lunation.utcDateTime &&
                                lunation.localDateTime &&
                                handleLunationClick(
                                  lunation.utcDateTime,
                                  lunation.localDateTime
                                )
                              }
                              activeOpacity={0.7}
                            >
                              <View style={styles.lunarPhaseLeftColumn}>
                                <Text style={styles.lunarPhaseNameText}>
                                  {emoji} {phaseName}
                                  {eclipseLabel}
                                </Text>
                                <Text style={styles.lunarPhaseDateText}>
                                  {dateString} at {timeString}
                                </Text>
                              </View>
                              {lunation.moonPosition && (
                                <View style={styles.lunarPhaseRightColumn}>
                                  <Text
                                    style={[
                                      styles.lunarPhaseMoonPosition,
                                      getZodiacColorStyle(
                                        lunation.moonPosition.zodiacSignName
                                      ),
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        getPhysisSymbolStyle(
                                          fontLoaded,
                                          "medium"
                                        ),
                                        getZodiacColorStyle(
                                          lunation.moonPosition.zodiacSignName
                                        ),
                                      ]}
                                    >
                                      {
                                        getZodiacKeysFromNames()[
                                          lunation.moonPosition.zodiacSignName
                                        ]
                                      }
                                    </Text>{" "}
                                    {lunation.moonPosition.degreeFormatted}{" "}
                                    {lunation.moonPosition.zodiacSignName}
                                  </Text>
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ) : (
                      <Text style={styles.lunarPhaseEmptyText}>
                        No upcoming lunar phases found
                      </Text>
                    )}
                  </View>
                </>
              )}
            </ImageBackground>
          </ScrollView>

          {/* Secondary Navigation Bar - Display Date */}
          <TouchableOpacity style={styles.secondaryNavBar} onPress={openDrawer}>
            <Text style={styles.secondaryNavText}>
              {(() => {
                const dateString = displayDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
                const timeString = displayDate.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                });
                return `${dateString} ${timeString}`;
              })()}
            </Text>
            <Text style={styles.arrowIcon}>▼</Text>
          </TouchableOpacity>
        </View>
      </GestureDetector>

      {/* Date/Time Picker Drawer */}
      <DateTimePickerDrawer
        visible={drawerVisible}
        onClose={closeDrawer}
        onApply={applyDateChange}
        onFollowCurrentTime={followCurrentTime}
        initialDate={displayDate}
      />
    </GestureHandlerRootView>
  );
}

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#c3c1c6", // Solid gray background
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  backgroundImage: {
    width: Dimensions.get("window").width, // Full screen width
    alignItems: "center",
    padding: 20,
    paddingBottom: 40,
  },
  moonSvgContainer: {
    position: "relative",
    marginTop: 115,
    marginBottom: 20,
  },
  moonPhaseSvg: {
    // SVG styles handled by component
  },
  eclipseOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 4,
    borderColor: "#FF6B6B",
    backgroundColor: "transparent",
    pointerEvents: "none",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#ffffff",
  },
  tithiNameButton: {
    // Align with the title text
    alignSelf: "flex-start",
    marginTop: 14, // Slight adjustment to align with title text
  },
  tithiNameText: {
    fontSize: 32,
    fontWeight: "bold",
    // Color will be set dynamically based on tithi color
  },
  eclipseLabel: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#FF6B6B",
    textAlign: "center",
    textShadowColor: "rgba(255, 107, 107, 0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 0,
    color: "#f8f9fa",
    textAlign: "center",
    fontStyle: "italic",
    textShadowColor: "rgba(255, 255, 255, 0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  description: {
    fontSize: 16,
    color: "#e9ecef",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 8,
    textShadowColor: "rgba(255, 255, 255, 0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  errorText: {
    fontSize: 16,
    color: "#ff6b6b",
    textAlign: "center",
    marginBottom: 10,
  },
  // Aspects styles
  aspectsContainer: {
    backgroundColor: "rgba(255, 255, 255, 0)",
    padding: 24,
    borderRadius: 12,
    marginTop: 30,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0)",
    minWidth: 300,
    alignItems: "center",
    shadowColor: "#ffffff",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  aspectsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111111",
    marginBottom: 20,
    textAlign: "center",
    letterSpacing: 0.5,
    // textShadowColor: "rgba(255, 255, 255, 0.8)",
    // textShadowOffset: { width: 0, height: 0 },
    // textShadowRadius: 8,
  },
  aspectsList: {
    width: "100%",
    minWidth: 300,
  },
  // Table-style layout for aspects
  aspectTableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#dadada",
    alignItems: "center",
    justifyContent: "space-between",
  },
  aspectLeftColumn: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
  },
  aspectRightColumn: {
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "center",
    marginLeft: 12,
  },
  aspectLabelText: {
    fontSize: 14,
    color: "#111111",
    fontWeight: "600",
  },
  aspectPlanetPosition: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },
  orbLabelText: {
    fontSize: 12,
    color: "#666",
    fontFamily: "monospace",
  },
  // Color styles moved to colorUtils.ts for DRY principle
  // Essential dignities styles
  dignityContainer: {
    marginVertical: 10,
    alignItems: "center",
  },
  dignityText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  // Essential dignity colors
  domicileColor: {
    color: "#4ecdc4", // Teal for domicile (strong)
  },
  exaltationColor: {
    color: "#51cf66", // Green for exaltation (very strong)
  },
  detrimentColor: {
    color: "#ff8c42", // Orange for detriment (weak)
  },
  fallColor: {
    color: "#ff6b6b", // Red for fall (very weak)
  },
  // Secondary Navigation Bar
  secondaryNavBar: {
    position: "absolute",
    bottom: 0, // Position directly above the tab bar
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: "#000000",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 9999,
  },
  secondaryNavText: {
    color: "#e6e6fa",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 4,
    textAlign: "left",
    textTransform: "uppercase",
    flex: 1,
  },
  arrowIcon: {
    color: "#e6e6fa",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  // Scrolling moon degree/zodiac sign styles
  scrollingMoonDegree: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1000,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderColor: "transparent",
  },
  stickySubtitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  // Lunar phases section styles
  lunarPhasesContainer: {
    backgroundColor: "rgba(255, 255, 255, 0)",
    padding: 24,
    borderRadius: 12,
    marginTop: 30,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0)",
    minWidth: 300,
    alignItems: "center",
    shadowColor: "#ffffff",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  lunarPhasesTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111111",
    marginBottom: 20,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  lunarPhasesList: {
    width: "100%",
    minWidth: 300,
  },
  lunarPhaseRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#dadada",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lunarPhaseLeftColumn: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
  },
  lunarPhaseRightColumn: {
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "center",
    marginLeft: 12,
  },
  lunarPhaseNameText: {
    fontSize: 16,
    color: "#111111",
    fontWeight: "700",
    marginBottom: 4,
  },
  lunarPhaseDateText: {
    fontSize: 14,
    color: "#444444",
    fontWeight: "500",
  },
  lunarPhaseMoonPosition: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },
  lunarPhaseEmptyText: {
    fontSize: 14,
    color: "#666666",
    fontStyle: "italic",
    textAlign: "center",
  },
});
