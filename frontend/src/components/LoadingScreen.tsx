// ============================================================================
// IMPORTS
// ============================================================================
import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useAstrology } from "../contexts/AstrologyContext";
import { useTarot } from "../contexts/TarotContext";
import { useFlowers } from "../contexts/FlowersContext";
import { useYear } from "../contexts/YearContext";
import {
  loadYearDataFromCache,
  saveYearDataToCache,
} from "../services/yearDataCache";
import { fetchLunationsForYear } from "../utils/lunationsUtils";
import { apiService } from "../services/api";
import { processEphemerisData } from "../utils/ephemerisChartData";
import { CalendarEvent } from "../types/calendarTypes";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================
export default function LoadingScreen({
  onLoadingComplete,
}: LoadingScreenProps) {
  // ===== HOOKS & STATE =====
  const [loadingText, setLoadingText] = useState("Initializing...");
  const { currentChart, loading: astrologyLoading } = useAstrology();
  const { loading: tarotLoading } = useTarot();
  const { loading: flowersLoading } = useFlowers();
  const { year } = useYear();

  // Create animated values for each letter (15 letters total)
  const letterAnimations = useRef(
    Array.from({ length: 15 }, () => new Animated.Value(0.3))
  ).current;

  // Track what we've loaded
  const loadingStateRef = useRef({
    astrologyLoaded: false,
    tarotLoaded: false,
    flowersLoaded: false,
    calendarLoaded: false,
    lunationsLoaded: false,
    completed: false, // Prevent multiple calls to onLoadingComplete
  });

  // Preload calendar data for current year
  const preloadCalendarData = useCallback(async () => {
    try {
      const location = currentChart?.location || {
        latitude: 40.7128,
        longitude: -74.006,
      };

      // Check cache first
      const cachedYearData = await loadYearDataFromCache(
        year,
        location.latitude,
        location.longitude
      );

      if (cachedYearData) {
        console.log(`✅ Preloaded calendar data from cache for year ${year}`);
        loadingStateRef.current.calendarLoaded = true;
        loadingStateRef.current.lunationsLoaded = true; // Lunations are included in year data
        // Trigger a check for completion
        setTimeout(() => {
          const state = loadingStateRef.current;
          if (
            !state.completed &&
            state.astrologyLoaded &&
            state.tarotLoaded &&
            state.flowersLoaded &&
            state.calendarLoaded &&
            state.lunationsLoaded
          ) {
            state.completed = true;
            onLoadingComplete();
          }
        }, 100);
        return;
      }

      // If not in cache, fetch it
      console.log(`🌐 Preloading calendar data for year ${year}...`);

      // Fetch year ephemeris
      const sampleInterval = 6; // Sample every 6 hours for better detection
      const response = await apiService.getYearEphemeris(
        year,
        location.latitude,
        location.longitude,
        sampleInterval
      );

      if (response.success && response.data?.events) {
        // Process events (same logic as CalendarContext)
        const events: CalendarEvent[] = response.data.events.map(
          (event: any) => {
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

            return {
              ...event,
              date: localDateTime,
              utcDateTime,
              localDateTime,
            };
          }
        );

        // Process ephemeris samples for LINES view
        let processedLinesData = null;
        const linesResponse = await apiService.getYearEphemeris(
          year,
          location.latitude,
          location.longitude,
          24 // Daily samples for lines view
        );
        if (linesResponse.success && linesResponse.data?.samples) {
          processedLinesData = processEphemerisData(linesResponse.data.samples);
        }

        // Fetch lunations for the year
        const lunationsData = await fetchLunationsForYear(
          year,
          location.latitude,
          location.longitude
        );

        // Save to cache
        await saveYearDataToCache(
          year,
          location.latitude,
          location.longitude,
          events,
          processedLinesData,
          lunationsData
        );

        console.log(
          `✅ Preloaded calendar data for year ${year} (${events.length} events, ${lunationsData.length} lunations)`
        );
        loadingStateRef.current.calendarLoaded = true;
        loadingStateRef.current.lunationsLoaded = true;
        // Trigger a check for completion
        setTimeout(() => {
          const state = loadingStateRef.current;
          if (
            !state.completed &&
            state.astrologyLoaded &&
            state.tarotLoaded &&
            state.flowersLoaded &&
            state.calendarLoaded &&
            state.lunationsLoaded
          ) {
            state.completed = true;
            onLoadingComplete();
          }
        }, 100);
      }
    } catch (error) {
      console.error("Error preloading calendar data:", error);
      // Continue anyway - data will load when screen is accessed
      loadingStateRef.current.calendarLoaded = true;
      loadingStateRef.current.lunationsLoaded = true;
      // Trigger a check for completion even on error
      setTimeout(() => {
        const state = loadingStateRef.current;
        if (
          !state.completed &&
          state.astrologyLoaded &&
          state.tarotLoaded &&
          state.flowersLoaded &&
          state.calendarLoaded &&
          state.lunationsLoaded
        ) {
          state.completed = true;
          onLoadingComplete();
        }
      }, 100);
    }
  }, [currentChart, year, onLoadingComplete]);

  // Original loading text animation effect
  useEffect(() => {
    // Simulate loading process with original steps
    const loadingSteps = [
      // "Initializing...",
      // "Connecting to server...",
      // "Loading your data...",
      // "Almost ready...",
      // "Preparing mystical energies...", // 😄
      "Aligning cosmic forces...",
      "Final preparations...",
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < loadingSteps.length) {
        setLoadingText(loadingSteps[currentStep]);
        currentStep++;
      } else {
        clearInterval(interval);
      }
    }, 800);

    return () => clearInterval(interval);
  }, []);

  // Main loading effect
  useEffect(() => {
    const checkLoadingComplete = () => {
      const state = loadingStateRef.current;
      if (
        !state.completed &&
        state.astrologyLoaded &&
        state.tarotLoaded &&
        state.flowersLoaded &&
        state.calendarLoaded &&
        state.lunationsLoaded
      ) {
        // All critical data loaded, complete loading
        state.completed = true;
        // Wait a bit to ensure the final text is shown
        setTimeout(() => {
          onLoadingComplete();
        }, 500);
      }
    };

    // Check astrology chart
    if (!astrologyLoading && currentChart) {
      if (!loadingStateRef.current.astrologyLoaded) {
        loadingStateRef.current.astrologyLoaded = true;
        // Start preloading calendar data once we have location
        preloadCalendarData();
      }
    }

    // Check tarot cards
    if (!tarotLoading) {
      if (!loadingStateRef.current.tarotLoaded) {
        loadingStateRef.current.tarotLoaded = true;
        checkLoadingComplete();
      }
    }

    // Check flower essences
    if (!flowersLoading) {
      if (!loadingStateRef.current.flowersLoaded) {
        loadingStateRef.current.flowersLoaded = true;
        checkLoadingComplete();
      }
    }

    checkLoadingComplete();
  }, [
    astrologyLoading,
    currentChart,
    tarotLoading,
    flowersLoading,
    year,
    onLoadingComplete,
    preloadCalendarData,
  ]);

  // ===== LIFECYCLE =====
  // Firefly glow animation
  useEffect(() => {
    const createFireflyAnimation = (index: number) => {
      const duration = 3000 + Math.random() * 4000; // 3-7 seconds (slower)
      const delay = Math.random() * 2000; // 0-2 second delay

      const animate = () => {
        Animated.sequence([
          Animated.timing(letterAnimations[index], {
            toValue: 1,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(letterAnimations[index], {
            toValue: 0.3,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Random delay before next animation (longer)
          setTimeout(animate, Math.random() * 4000);
        });
      };

      setTimeout(animate, delay);
    };

    // Start firefly animation for each letter
    letterAnimations.forEach((_, index) => {
      createFireflyAnimation(index);
    });
  }, []);

  // ===== DATA & CONSTANTS =====
  // Define the triangular layout of letters
  const triangularLayout = ["C", "O R", "R E S", "P O N D", "E N C E S"];

  // ===== TEMPLATE (JSX) =====
  return (
    <View style={styles.container}>
      {/* Loading text at top */}
      <Text style={styles.loadingText}>{loadingText}</Text>

      {/* Triangular CORRESPONDENCES centered */}
      <View style={styles.triangleContainer}>
        {triangularLayout.map((line, lineIndex) => (
          <View key={lineIndex} style={styles.triangleLine}>
            {line.split("").map((letter, letterIndex) => {
              // Calculate the global letter index
              let globalIndex = 0;
              for (let i = 0; i < lineIndex; i++) {
                globalIndex += triangularLayout[i].replace(/\s/g, "").length;
              }
              globalIndex += letterIndex;

              // Ensure we don't go out of bounds
              const safeIndex = Math.min(
                globalIndex,
                letterAnimations.length - 1
              );
              const animation = letterAnimations[safeIndex];

              return (
                <Animated.Text
                  key={`${lineIndex}-${letterIndex}`}
                  style={[
                    styles.letter,
                    {
                      opacity: animation,
                      textShadowColor: "#ffffff",
                      textShadowOffset: { width: 0, height: 0 },
                    },
                  ]}
                >
                  {letter}
                </Animated.Text>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  triangleContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  triangleLine: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 22, // Perfect equilateral triangle spacing
  },
  letter: {
    fontSize: 18, // Smaller font size to match header
    fontWeight: "bold",
    color: "#ffffff",
    marginHorizontal: 4, // Keep same spacing
    fontFamily: "monospace",
    letterSpacing: 8, // Match the header letterSpacing
  },
  loadingText: {
    fontSize: 16,
    color: "#cccccc",
    marginTop: 60, // Position at top
    fontFamily: "monospace",
    letterSpacing: 1,
    textAlign: "center",
  },
});
