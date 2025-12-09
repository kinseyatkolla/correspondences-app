// ============================================================================
// IMPORTS
// ============================================================================
import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ImageBackground,
  Animated,
} from "react-native";
import {
  GestureHandlerRootView,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import DateTimePickerDrawer from "../components/DateTimePickerDrawer";
import { useAstrology } from "../contexts/AstrologyContext";
import { apiService, BirthData, BirthChart } from "../services/api";
import { sharedUI } from "../styles/sharedUI";
import { usePhysisFont, getPhysisSymbolStyle } from "../utils/physisFont";
import {
  getPlanetKeysFromNames,
  getZodiacKeysFromNames,
} from "../utils/physisSymbolMap";
import AstrologyChart from "../components/AstrologyChart";
import CurrentPlanetaryHour from "../components/CurrentPlanetaryHour";
import { getCurrentTimeOfDay } from "../utils/timeOfDayUtils";
import {
  calculatePlanetaryHours,
  PlanetaryHoursData,
} from "../utils/planetaryHoursUtils";
import {
  checkAllAspects,
  checkAllWholeSignAspects,
  getActiveAspects,
} from "../utils/aspectUtils";
import { getAspectColorStyle, getZodiacColorStyle } from "../utils/colorUtils";
import {
  getPlanetHappinessEmoji,
  isPlanetaryRuler,
  isPlanetaryExaltation,
  hasAspectWithJupiter,
  hasAspectWithVenus,
  isPlanetaryFall,
  hasHardAspectWithSaturn,
  hasHardAspectWithMars,
  getSignRuler,
} from "../utils/planetHappinessUtils";

// ============================================================================
// COMPONENT
// ============================================================================
export default function AstrologyScreen({ navigation, route }: any) {
  const {
    currentChart,
    loading: ephemerisLoading,
    refreshLoading,
    refreshError,
  } = useAstrology();
  const { fontLoaded } = usePhysisFont();

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

  // State for loading selected date chart
  const [selectedDateLoading, setSelectedDateLoading] = useState(false);

  // State for planetary hours data
  const [planetaryHoursData, setPlanetaryHoursData] =
    useState<PlanetaryHoursData | null>(null);
  const [planetaryHoursLoading, setPlanetaryHoursLoading] = useState(false);

  // State for planet cards expansion
  const [planetCardsExpanded, setPlanetCardsExpanded] = useState(false);

  // Function to calculate planetary hours for current date and location
  const calculatePlanetaryHoursForDate = async (date: Date) => {
    setPlanetaryHoursLoading(true);
    try {
      // Use current chart location or default location
      const location = activeChart?.location || {
        latitude: 40.7128,
        longitude: -74.006,
      };

      const planetaryData = await calculatePlanetaryHours(
        date,
        location.latitude,
        location.longitude
      );

      setPlanetaryHoursData(planetaryData);
    } catch (error) {
      console.error("Error calculating planetary hours:", error);
      setPlanetaryHoursData(null);
    } finally {
      setPlanetaryHoursLoading(false);
    }
  };

  // Function to determine time of day based on actual sunrise/sunset times
  const getTimeOfDayForDate = (date: Date, sunrise?: Date, sunset?: Date) => {
    // If we have planetary hours data with real sunrise/sunset times, use them
    if (sunrise && sunset) {
      const currentTime = date.getTime();
      const sunriseTime = sunrise.getTime();
      const sunsetTime = sunset.getTime();

      // Dawn: 30 minutes before sunrise to 30 minutes after sunrise
      const dawnStart = sunriseTime - 30 * 60 * 1000; // 30 minutes before
      const dawnEnd = sunriseTime + 30 * 60 * 1000; // 30 minutes after

      // Dusk: 30 minutes before sunset to 30 minutes after sunset
      const duskStart = sunsetTime - 30 * 60 * 1000; // 30 minutes before
      const duskEnd = sunsetTime + 30 * 60 * 1000; // 30 minutes after

      // Day: from end of dawn to start of dusk
      const dayStart = dawnEnd;
      const dayEnd = duskStart;

      if (currentTime >= dawnStart && currentTime <= dawnEnd) return "dawn";
      if (currentTime >= dayStart && currentTime <= dayEnd) return "day";
      if (currentTime >= duskStart && currentTime <= duskEnd) return "dusk";
      return "night"; // Everything else is night
    }

    // Fallback to original logic if no sunrise/sunset data
    const hour = date.getHours();
    if (hour >= 5 && hour < 8) return "dawn";
    if (hour >= 8 && hour < 17) return "day";
    if (hour >= 17 && hour < 20) return "dusk";
    return "night"; // 20:00 - 4:59
  };

  // Function to update gradient opacities based on time of day
  const updateGradientOpacities = (timeOfDay: string) => {
    const duration = 1000; // Smooth 1-second transition

    // Reset all opacities to their target values
    const opacityValues = {
      night: timeOfDay === "night" ? 1 : 0,
      day: timeOfDay === "day" ? 1 : 0,
      dusk: timeOfDay === "dusk" ? 1 : 0,
      dawn: timeOfDay === "dawn" ? 1 : 0,
    };

    // Animate all layers simultaneously
    Animated.parallel([
      Animated.timing(nightOpacity, {
        toValue: opacityValues.night,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(dayOpacity, {
        toValue: opacityValues.day,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(duskOpacity, {
        toValue: opacityValues.dusk,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(dawnOpacity, {
        toValue: opacityValues.dawn,
        duration,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // State for layered background transitions
  const [currentTimeOfDay, setCurrentTimeOfDay] = useState(() =>
    getTimeOfDayForDate(new Date())
  );

  // Opacity animations for each gradient layer
  const nightOpacity = useState(new Animated.Value(1))[0];
  const dayOpacity = useState(new Animated.Value(0))[0];
  const duskOpacity = useState(new Animated.Value(0))[0];
  const dawnOpacity = useState(new Animated.Value(0))[0];

  // State for the date/time picker drawer
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Function to fetch chart data for a specific date
  const fetchChartForDate = async (date: Date) => {
    console.log("🚀 fetchChartForDate called for:", date.toISOString());
    setSelectedDateLoading(true);
    // Clear previous chart data to prevent stale data display
    setSelectedDateChart(null);
    console.log("🧹 Cleared selectedDateChart");
    try {
      // Wait for currentChart to be available if it's not yet loaded
      if (!currentChart) {
        console.log("⚠️ No currentChart available, waiting...");
        setSelectedDateLoading(false);
        return;
      }

      // Use the same location as the current chart
      const location = currentChart?.location || {
        latitude: 40.7128,
        longitude: -74.006,
      };

      // Extract UTC components from the Date object for the backend
      // Date objects store time internally as UTC, so we use UTC methods
      const customDate = {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1, // JavaScript months are 0-based
        day: date.getUTCDate(),
        hour: date.getUTCHours(),
        minute: date.getUTCMinutes(),
      };

      // Use the current-chart endpoint with custom date
      const response = await apiService.getCurrentChart(
        location.latitude,
        location.longitude,
        customDate
      );

      if (response.success) {
        // Convert current-chart response to BirthChart format
        const chartData: BirthChart = {
          julianDay: response.data.julianDay,
          inputDate: {
            year: response.data.currentTime.year,
            month: response.data.currentTime.month,
            day: response.data.currentTime.day,
            hour: response.data.currentTime.hour,
          },
          location: response.data.location,
          planets: response.data.planets,
          houses: response.data.houses,
        };
        setSelectedDateChart(chartData);
        console.log(
          "✅ Set selectedDateChart with data:",
          !!response.data.houses
        );
      } else {
        console.error("❌ Failed to fetch chart for selected date");
      }
    } catch (error) {
      console.error("❌ Error fetching chart for selected date:", error);
    } finally {
      setSelectedDateLoading(false);
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
    console.log("📅 applyDateChange called with date:", date.toISOString());
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
          console.log(
            "🔄 Swiping to previous day:",
            newDate,
            "currentChart available:",
            !!currentChart
          );
          setDisplayDate(newDate);
          fetchChartForDate(newDate);
        } else if (translationX < -threshold) {
          // Swipe left - go to next day
          const newDate = new Date(displayDate);
          newDate.setDate(newDate.getDate() + 1);
          console.log(
            "🔄 Swiping to next day:",
            newDate,
            "currentChart available:",
            !!currentChart
          );
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

  // Handle route params for selectedDate (from calendar screen navigation)
  useEffect(() => {
    if (route?.params?.selectedDate) {
      const dateFromRoute = new Date(route.params.selectedDate);
      // Check if we need to update displayDate
      const dateMatches = dateFromRoute.getTime() === displayDate.getTime();
      if (!dateMatches) {
        console.log(
          "📅 Setting date from route params:",
          dateFromRoute.toISOString()
        );
        setDisplayDate(dateFromRoute);
      }
    }
  }, [route?.params?.selectedDate]);

  // Fetch chart when currentChart is available and we have selectedDate from route
  useEffect(() => {
    if (route?.params?.selectedDate && currentChart) {
      const dateFromRoute = new Date(route.params.selectedDate);
      console.log(
        "📅 Fetching chart for date from route params:",
        dateFromRoute.toISOString()
      );
      fetchChartForDate(dateFromRoute);
    }
  }, [route?.params?.selectedDate, currentChart]);

  // Debug logging for activeChart
  useEffect(() => {
    console.log("🔄 ActiveChart updated:", {
      hasSelectedDateChart: !!selectedDateChart,
      hasCurrentChart: !!currentChart,
      activeChartSource: selectedDateChart
        ? "selectedDateChart"
        : "currentChart",
      activeChartHouses: activeChart?.houses
        ? {
            ascendant: activeChart.houses.ascendant,
            ascendantSign: activeChart.houses.ascendantSign,
            ascendantDegree: activeChart.houses.ascendantDegree,
          }
        : null,
      timestamp: new Date().toISOString(),
    });
  }, [activeChart, selectedDateChart, currentChart]);

  // Note: Removed useEffect that was causing race conditions
  // Chart fetching is now handled directly by swipe handlers and date picker

  // ===== DYNAMIC BACKGROUND CALCULATION =====
  const backgroundImages = useMemo(
    () => ({
      dawn: require("../../assets/images/dawn-gradient.png"),
      day: require("../../assets/images/day-gradient.png"),
      dusk: require("../../assets/images/dusk-gradient.png"),
      night: require("../../assets/images/night-gradient.png"),
    }),
    []
  );

  // Initialize gradient opacities on mount
  useEffect(() => {
    updateGradientOpacities(currentTimeOfDay);
  }, []);

  // Handle background transitions when displayDate changes
  useEffect(() => {
    const newTimeOfDay = getTimeOfDayForDate(
      displayDate,
      planetaryHoursData?.sunrise,
      planetaryHoursData?.sunset
    );

    if (newTimeOfDay !== currentTimeOfDay) {
      console.log(
        `🌅 Background transition: ${currentTimeOfDay} → ${newTimeOfDay}`,
        {
          displayTime: displayDate.toLocaleTimeString(),
          sunrise: planetaryHoursData?.sunrise?.toLocaleTimeString(),
          sunset: planetaryHoursData?.sunset?.toLocaleTimeString(),
        }
      );
      setCurrentTimeOfDay(newTimeOfDay);
      updateGradientOpacities(newTimeOfDay);
    }
  }, [displayDate, currentTimeOfDay, planetaryHoursData]);

  // Calculate planetary hours when display date changes
  useEffect(() => {
    const fetchPlanetaryHours = async () => {
      await calculatePlanetaryHoursForDate(displayDate);
    };
    fetchPlanetaryHours();
  }, [displayDate, activeChart]);

  // ===== UTILITY FUNCTIONS =====
  const formatChartTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      dateString: date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      timeString: date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  // Helper function to get aspects for a planet/point (for compact display in cards)
  const getAspectsForCard = (
    sourceName: string,
    sourcePlanet: any,
    chart: BirthChart | any
  ) => {
    // Return empty array if sourcePlanet or chart is invalid
    if (
      !sourcePlanet ||
      typeof sourcePlanet.longitude !== "number" ||
      sourcePlanet.error
    ) {
      return [];
    }
    if (!chart || !chart.planets) {
      return [];
    }

    // Define consistent planet order
    const planetOrder = [
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

    // Get all planets except the source planet for comparison
    const otherPlanets = Object.entries(chart.planets)
      .filter(
        ([name, planet]: [string, any]) =>
          name !== sourceName &&
          planet &&
          !planet.error &&
          typeof planet.longitude === "number"
      )
      .sort(([nameA], [nameB]) => {
        const indexA = planetOrder.indexOf(nameA);
        const indexB = planetOrder.indexOf(nameB);
        const sortA = indexA === -1 ? 999 : indexA;
        const sortB = indexB === -1 ? 999 : indexB;
        return sortA - sortB;
      });

    // Add ascendant to other planets if source is not ascendant
    if (sourceName !== "ascendant" && chart.houses) {
      const ascendantPosition: any = {
        longitude: chart.houses.ascendant,
        zodiacSignName: chart.houses.ascendantSign,
        degree: parseFloat(chart.houses.ascendantDegree) || 0,
        degreeFormatted: chart.houses.ascendantDegree,
      };
      otherPlanets.push(["ascendant", ascendantPosition]);
    }

    const aspects: Array<{
      planetName: string;
      displayName: string;
      aspectName: string;
      orb?: string;
    }> = [];

    otherPlanets.forEach(([planetName, planet]: [string, any]) => {
      // Skip if planet doesn't have required fields
      if (!planet || typeof planet.longitude !== "number") {
        return;
      }

      // Check aspects with 3-degree orb (using utility functions)
      // Only show aspects with 3-degree orb or less (no whole sign aspects)
      const aspectResults = checkAllAspects(sourcePlanet, planet, 3);

      // Format planet display name
      const capitalizedPlanetName =
        planetName.charAt(0).toUpperCase() + planetName.slice(1);
      const displayPlanetName =
        planetName === "northNode"
          ? "N. Node"
          : planetName === "ascendant"
          ? "Ascendant"
          : capitalizedPlanetName;

      // Check degree-based aspects (3-degree orb or less)
      // Since we're using orb=3, hasAspect will only be true if orb <= 3
      Object.entries(aspectResults).forEach(([aspectName, result]) => {
        if (result.hasAspect) {
          aspects.push({
            planetName: displayPlanetName,
            displayName: displayPlanetName,
            aspectName,
            orb: result.orb ? result.orb.toFixed(1) : undefined,
          });
        }
      });
    });

    return aspects;
  };

  // Helper function to get whole sign aspects that aren't already in the main aspects list
  const getWholeSignAspectsForCard = (
    sourceName: string,
    sourcePlanet: any,
    chart: BirthChart | any,
    mainAspects: Array<{ planetName: string; aspectName: string }>
  ) => {
    // Return empty array if sourcePlanet or chart is invalid
    if (
      !sourcePlanet ||
      sourcePlanet.zodiacSignName === undefined ||
      sourcePlanet.error
    ) {
      return [];
    }
    if (!chart || !chart.planets) {
      return [];
    }

    // Define consistent planet order
    const planetOrder = [
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

    // Get all planets except the source planet for comparison
    const otherPlanets = Object.entries(chart.planets)
      .filter(
        ([name, planet]: [string, any]) =>
          name !== sourceName &&
          planet &&
          !planet.error &&
          planet.zodiacSignName
      )
      .sort(([nameA], [nameB]) => {
        const indexA = planetOrder.indexOf(nameA);
        const indexB = planetOrder.indexOf(nameB);
        const sortA = indexA === -1 ? 999 : indexA;
        const sortB = indexB === -1 ? 999 : indexB;
        return sortA - sortB;
      });

    // Add ascendant to other planets if source is not ascendant
    if (sourceName !== "ascendant" && chart.houses) {
      const ascendantPosition: any = {
        longitude: chart.houses.ascendant,
        zodiacSignName: chart.houses.ascendantSign,
        degree: parseFloat(chart.houses.ascendantDegree) || 0,
        degreeFormatted: chart.houses.ascendantDegree,
      };
      otherPlanets.push(["ascendant", ascendantPosition]);
    }

    const wholeSignAspects: Array<{
      planetName: string;
      displayName: string;
      aspectName: string;
    }> = [];

    // Create a set of aspect keys from main aspects for quick lookup
    // Check both the aspect name and "whole sign" prefixed version
    const mainAspectKeys = new Set(
      mainAspects.map((a) => {
        const planetKey = a.planetName.toLowerCase();
        const aspectKey = a.aspectName.toLowerCase();
        // Remove "whole sign " prefix if present for comparison
        const baseAspectKey = aspectKey.replace(/^whole sign /, "");
        return `${planetKey}_${baseAspectKey}`;
      })
    );

    otherPlanets.forEach(([planetName, planet]: [string, any]) => {
      // Skip if planet doesn't have required fields
      if (!planet || !planet.zodiacSignName) {
        return;
      }

      // Use existing utility to check whole sign aspects
      const wholeSignAspectResults = checkAllWholeSignAspects(
        sourcePlanet,
        planet
      );

      // Format planet display name
      const capitalizedPlanetName =
        planetName.charAt(0).toUpperCase() + planetName.slice(1);
      const displayPlanetName =
        planetName === "northNode"
          ? "N. Node"
          : planetName === "ascendant"
          ? "Ascendant"
          : capitalizedPlanetName;

      // Check each whole sign aspect - show all that aren't already in main list
      Object.entries(wholeSignAspectResults).forEach(([aspectName, result]) => {
        if (result.hasAspect) {
          // Check if this aspect is already in the main list
          // Check both the base aspect name (without "whole sign" prefix)
          const aspectKey = `${displayPlanetName.toLowerCase()}_${aspectName.toLowerCase()}`;
          const isAlreadyInMain = mainAspectKeys.has(aspectKey);

          // Only include if not already in main list
          if (!isAlreadyInMain) {
            wholeSignAspects.push({
              planetName: displayPlanetName,
              displayName: displayPlanetName,
              aspectName: `whole sign ${aspectName}`,
            });
          }
        }
      });
    });

    return wholeSignAspects;
  };

  // Helper function to render aspects for a planet or point
  const renderAspectsSection = (
    sourceName: string,
    sourcePlanet: any,
    emoji: string,
    displayName: string,
    chart: BirthChart | any
  ) => {
    // Define consistent planet order
    const planetOrder = [
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

    // Get all planets except the source planet for comparison, sorted by planet order
    const otherPlanets = Object.entries(chart.planets)
      .filter(
        ([name, planet]: [string, any]) =>
          name !== sourceName && planet && !planet.error
      )
      .sort(([nameA], [nameB]) => {
        const indexA = planetOrder.indexOf(nameA);
        const indexB = planetOrder.indexOf(nameB);
        const sortA = indexA === -1 ? 999 : indexA;
        const sortB = indexB === -1 ? 999 : indexB;
        return sortA - sortB;
      });

    // Add ascendant to other planets if source is not ascendant
    if (sourceName !== "ascendant" && chart.houses) {
      const ascendantPosition: any = {
        longitude: chart.houses.ascendant,
        zodiacSignName: chart.houses.ascendantSign,
        degree: parseFloat(chart.houses.ascendantDegree) || 0,
        degreeFormatted: chart.houses.ascendantDegree,
      };
      otherPlanets.push(["ascendant", ascendantPosition]);
    }

    const planetsWithAspects = otherPlanets.filter(
      ([planetName, planet]: [string, any]) => {
        const allActiveAspects = getActiveAspects(sourcePlanet, planet);
        return allActiveAspects.length > 0;
      }
    );

    if (planetsWithAspects.length === 0) {
      return <Text style={styles.noAspectsText}>No active aspects</Text>;
    }

    return (
      <View style={styles.aspectsList}>
        {planetsWithAspects.map(([planetName, planet]: [string, any]) => {
          // Get all aspect results with orb information
          const allAspectResults = checkAllAspects(sourcePlanet, planet);
          const allWholeSignAspectResults = checkAllWholeSignAspects(
            sourcePlanet,
            planet
          );

          const otherPlanetSign = planet.zodiacSignName;
          const zodiacSymbol = getZodiacKeysFromNames()[otherPlanetSign];

          // Format degree-based aspects with orb information
          const degreeAspects = Object.entries(allAspectResults)
            .filter(([aspectName, result]) => result.hasAspect)
            .map(([aspectName, result]) => ({
              aspectName,
              otherPlanetSign,
              zodiacSymbol,
              orb: result.orb ? result.orb.toFixed(1) : undefined,
              degree: planet.degree,
              degreeFormatted: planet.degreeFormatted,
            }));

          // Format whole sign aspects
          const wholeSignAspects = Object.entries(allWholeSignAspectResults)
            .filter(([aspectName, result]) => result.hasAspect)
            .map(([aspectName, result]) => ({
              aspectName,
              otherPlanetSign,
              zodiacSymbol,
              degree: planet.degree,
              degreeFormatted: planet.degreeFormatted,
            }));

          // Combine and deduplicate aspects
          const allAspects = [...wholeSignAspects, ...degreeAspects];
          const uniqueAspects = allAspects.filter((aspect, index, array) => {
            return (
              array.findIndex((a) => a.aspectName === aspect.aspectName) ===
              index
            );
          });

          const capitalizedPlanetName =
            planetName.charAt(0).toUpperCase() + planetName.slice(1);
          const displayPlanetName =
            planetName === "northNode"
              ? "N. Node"
              : planetName === "ascendant"
              ? "Ascendant"
              : capitalizedPlanetName;

          return (
            <View key={planetName} style={styles.aspectTableRow}>
              <View style={styles.aspectLeftColumn}>
                {uniqueAspects.map((aspectInfo, index) => (
                  <Text key={index} style={styles.aspectLabelText}>
                    <Text
                      style={[
                        getPhysisSymbolStyle(fontLoaded, "large"),
                        getZodiacColorStyle(sourcePlanet.zodiacSignName),
                      ]}
                    >
                      {getZodiacKeysFromNames()[sourcePlanet.zodiacSignName]}
                    </Text>{" "}
                    {displayName}{" "}
                    <Text style={[getAspectColorStyle(aspectInfo.aspectName)]}>
                      {aspectInfo.aspectName}
                    </Text>{" "}
                    {displayPlanetName}
                    {/* Show orb information for degree aspects */}
                    {(aspectInfo as any).orb && (
                      <Text style={styles.orbLabelText}>
                        {" "}
                        ({(aspectInfo as any).orb}° orb)
                      </Text>
                    )}
                  </Text>
                ))}
              </View>
              <View style={styles.aspectRightColumn}>
                {uniqueAspects.map((aspectInfo, index) => (
                  <Text
                    key={index}
                    style={[
                      styles.aspectPlanetPosition,
                      getZodiacColorStyle(aspectInfo.otherPlanetSign),
                    ]}
                  >
                    <Text
                      style={[
                        getPhysisSymbolStyle(fontLoaded, "medium"),
                        getZodiacColorStyle(aspectInfo.otherPlanetSign),
                      ]}
                    >
                      {aspectInfo.zodiacSymbol}
                    </Text>{" "}
                    {(aspectInfo as any).degreeFormatted}{" "}
                    {aspectInfo.otherPlanetSign}
                  </Text>
                ))}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // ===== MAIN TEMPLATE =====
  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <View style={styles.container}>
          {/* Layered gradient backgrounds */}

          {/* Night gradient - always present as base layer */}
          <Animated.View
            style={[
              styles.gradientLayer,
              styles.nightLayer,
              { opacity: nightOpacity },
            ]}
          >
            <ImageBackground
              source={backgroundImages.night}
              style={styles.container}
              resizeMode="cover"
            />
          </Animated.View>

          {/* Day gradient - overlay layer */}
          <Animated.View
            style={[
              styles.gradientLayer,
              styles.dayLayer,
              { opacity: dayOpacity },
            ]}
          >
            <ImageBackground
              source={backgroundImages.day}
              style={styles.container}
              resizeMode="cover"
            />
          </Animated.View>

          {/* Dusk gradient - overlay layer */}
          <Animated.View
            style={[
              styles.gradientLayer,
              styles.duskLayer,
              { opacity: duskOpacity },
            ]}
          >
            <ImageBackground
              source={backgroundImages.dusk}
              style={styles.container}
              resizeMode="cover"
            />
          </Animated.View>

          {/* Dawn gradient - overlay layer */}
          <Animated.View
            style={[
              styles.gradientLayer,
              styles.dawnLayer,
              { opacity: dawnOpacity },
            ]}
          >
            <ImageBackground
              source={backgroundImages.dawn}
              style={styles.container}
              resizeMode="cover"
            />
          </Animated.View>

          {/* Content layer */}
          <View style={styles.contentLayer}>
            <ScrollView
              style={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Current Planetary Hour */}
              <View style={styles.stickyPlanetaryHour}>
                <CurrentPlanetaryHour
                  planetaryHoursData={planetaryHoursData}
                  loading={planetaryHoursLoading}
                  onPress={() =>
                    navigation.navigate("PlanetaryHours", {
                      selectedDate: displayDate,
                    })
                  }
                />
              </View>
              {/* Current Chart Display */}
              {activeChart && !ephemerisLoading && (
                <View style={styles.chartContainer}>
                  {(() => {
                    console.log("🎨 Rendering AstrologyChart with data:", {
                      planetsCount: activeChart.planets
                        ? Object.keys(activeChart.planets).length
                        : 0,
                      housesData: activeChart.houses
                        ? {
                            ascendant: activeChart.houses.ascendant,
                            ascendantSign: activeChart.houses.ascendantSign,
                            ascendantDegree: activeChart.houses.ascendantDegree,
                          }
                        : null,
                      timestamp: new Date().toISOString(),
                    });
                    return null;
                  })()}
                  <AstrologyChart
                    planets={activeChart.planets}
                    houses={activeChart.houses}
                    loading={refreshLoading}
                    error={refreshError}
                  />
                </View>
              )}

              {/* Loading indicator for selected date */}
              {selectedDateLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#e6e6fa" />
                  <Text style={styles.loadingText}>
                    Loading chart for selected date...
                  </Text>
                </View>
              )}

              {/* Planet Cards Grid */}
              {activeChart && !ephemerisLoading && !selectedDateLoading && (
                <View style={styles.planetCardsContainer}>
                  {/* Minimize/Expand Buttons */}
                  <View style={styles.planetCardsControls}>
                    <TouchableOpacity
                      style={[
                        styles.planetCardsControlButton,
                        !planetCardsExpanded &&
                          styles.planetCardsControlButtonActive,
                      ]}
                      onPress={() => setPlanetCardsExpanded(false)}
                      activeOpacity={0.7}
                    >
                      {/* Collapse: 3 short rectangles */}
                      <View style={styles.collapseIcon}>
                        <View style={styles.collapseRectangle} />
                        <View style={styles.collapseRectangle} />
                        <View style={styles.collapseRectangle} />
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.planetCardsControlButton,
                        planetCardsExpanded &&
                          styles.planetCardsControlButtonActive,
                      ]}
                      onPress={() => setPlanetCardsExpanded(true)}
                      activeOpacity={0.7}
                    >
                      {/* Expand: 1 tall rectangle */}
                      <View style={styles.expandRectangle} />
                    </TouchableOpacity>
                  </View>
                  {(() => {
                    // Build the base planet pairs in their original order
                    const basePlanetPairs = [
                      [
                        {
                          name: "ascendant",
                          displayName: "Ascendant",
                          data: activeChart.houses
                            ? {
                                degreeFormatted:
                                  activeChart.houses.ascendantDegree,
                                zodiacSignName:
                                  activeChart.houses.ascendantSign,
                                symbol: "!",
                              }
                            : null,
                        },
                        {
                          name: "sun",
                          displayName: "Sun",
                          data: activeChart.planets?.sun
                            ? {
                                degreeFormatted:
                                  activeChart.planets.sun.degreeFormatted,
                                zodiacSignName:
                                  activeChart.planets.sun.zodiacSignName,
                                symbol: getPlanetKeysFromNames()["Sun"],
                              }
                            : null,
                        },
                      ],
                      [
                        {
                          name: "moon",
                          displayName: "Moon",
                          data: activeChart.planets?.moon
                            ? {
                                degreeFormatted:
                                  activeChart.planets.moon.degreeFormatted,
                                zodiacSignName:
                                  activeChart.planets.moon.zodiacSignName,
                                symbol: getPlanetKeysFromNames()["Moon"],
                              }
                            : null,
                        },
                        {
                          name: "mercury",
                          displayName: "Mercury",
                          data: activeChart.planets?.mercury
                            ? {
                                degreeFormatted:
                                  activeChart.planets.mercury.degreeFormatted,
                                zodiacSignName:
                                  activeChart.planets.mercury.zodiacSignName,
                                symbol: getPlanetKeysFromNames()["Mercury"],
                              }
                            : null,
                        },
                      ],
                      [
                        {
                          name: "venus",
                          displayName: "Venus",
                          data: activeChart.planets?.venus
                            ? {
                                degreeFormatted:
                                  activeChart.planets.venus.degreeFormatted,
                                zodiacSignName:
                                  activeChart.planets.venus.zodiacSignName,
                                symbol: getPlanetKeysFromNames()["Venus"],
                              }
                            : null,
                        },
                        {
                          name: "mars",
                          displayName: "Mars",
                          data: activeChart.planets?.mars
                            ? {
                                degreeFormatted:
                                  activeChart.planets.mars.degreeFormatted,
                                zodiacSignName:
                                  activeChart.planets.mars.zodiacSignName,
                                symbol: getPlanetKeysFromNames()["Mars"],
                              }
                            : null,
                        },
                      ],
                      [
                        {
                          name: "jupiter",
                          displayName: "Jupiter",
                          data: activeChart.planets?.jupiter
                            ? {
                                degreeFormatted:
                                  activeChart.planets.jupiter.degreeFormatted,
                                zodiacSignName:
                                  activeChart.planets.jupiter.zodiacSignName,
                                symbol: getPlanetKeysFromNames()["Jupiter"],
                              }
                            : null,
                        },
                        {
                          name: "saturn",
                          displayName: "Saturn",
                          data: activeChart.planets?.saturn
                            ? {
                                degreeFormatted:
                                  activeChart.planets.saturn.degreeFormatted,
                                zodiacSignName:
                                  activeChart.planets.saturn.zodiacSignName,
                                symbol: getPlanetKeysFromNames()["Saturn"],
                              }
                            : null,
                        },
                      ],
                      [
                        {
                          name: "uranus",
                          displayName: "Uranus",
                          data: activeChart.planets?.uranus
                            ? {
                                degreeFormatted:
                                  activeChart.planets.uranus.degreeFormatted,
                                zodiacSignName:
                                  activeChart.planets.uranus.zodiacSignName,
                                symbol: getPlanetKeysFromNames()["Uranus"],
                              }
                            : null,
                        },
                        {
                          name: "neptune",
                          displayName: "Neptune",
                          data: activeChart.planets?.neptune
                            ? {
                                degreeFormatted:
                                  activeChart.planets.neptune.degreeFormatted,
                                zodiacSignName:
                                  activeChart.planets.neptune.zodiacSignName,
                                symbol: getPlanetKeysFromNames()["Neptune"],
                              }
                            : null,
                        },
                      ],
                      [
                        {
                          name: "pluto",
                          displayName: "Pluto",
                          data: activeChart.planets?.pluto
                            ? {
                                degreeFormatted:
                                  activeChart.planets.pluto.degreeFormatted,
                                zodiacSignName:
                                  activeChart.planets.pluto.zodiacSignName,
                                symbol: getPlanetKeysFromNames()["Pluto"],
                              }
                            : null,
                        },
                        {
                          name: "northNode",
                          displayName: "N. Node",
                          data: activeChart.planets?.northNode
                            ? {
                                degreeFormatted:
                                  activeChart.planets.northNode.degreeFormatted,
                                zodiacSignName:
                                  activeChart.planets.northNode.zodiacSignName,
                                symbol: getPlanetKeysFromNames()["NorthNode"],
                              }
                            : null,
                        },
                      ],
                    ];

                    // Flatten the pairs to get all planets in order
                    const allPlanets = basePlanetPairs.flat();

                    // Get the ascendant ruler
                    const ascendantSign = activeChart.houses?.ascendantSign;
                    const ascendantRuler = ascendantSign
                      ? getSignRuler(ascendantSign)
                      : null;

                    // Reorder planets: ascendant first, ruler second, then all others in existing order
                    let reorderedPlanets: typeof allPlanets = [];

                    if (ascendantRuler) {
                      // Find ascendant and ruler planets
                      const ascendantPlanet = allPlanets.find(
                        (p) => p.name === "ascendant"
                      );
                      const rulerPlanet = allPlanets.find(
                        (p) => p.name === ascendantRuler
                      );
                      const otherPlanets = allPlanets.filter(
                        (p) =>
                          p.name !== "ascendant" && p.name !== ascendantRuler
                      );

                      // Build reordered array: ascendant, ruler, then all others
                      if (ascendantPlanet) {
                        reorderedPlanets.push(ascendantPlanet);
                      }
                      if (rulerPlanet) {
                        reorderedPlanets.push(rulerPlanet);
                      }
                      reorderedPlanets.push(...otherPlanets);
                    } else {
                      // No ruler found, keep original order
                      reorderedPlanets = allPlanets;
                    }

                    // Re-pair the planets into pairs of 2
                    const planetPairs: typeof basePlanetPairs = [];
                    for (let i = 0; i < reorderedPlanets.length; i += 2) {
                      const pair = reorderedPlanets.slice(i, i + 2);
                      if (pair.length > 0) {
                        planetPairs.push(pair as any);
                      }
                    }

                    return (
                      <View style={styles.planetCardsGrid}>
                        {planetPairs.map((pair, rowIndex) => (
                          <View key={rowIndex} style={styles.planetCardsRow}>
                            {pair.map((planet, colIndex) => {
                              if (!planet.data) return null;

                              const zodiacColor = getZodiacColorStyle(
                                planet.data.zodiacSignName
                              ).color;
                              const zodiacSymbol =
                                getZodiacKeysFromNames()[
                                  planet.data.zodiacSignName
                                ];

                              // Get planet data for happiness calculation
                              let planetDataForHappiness: any;
                              if (planet.name === "ascendant") {
                                if (activeChart.houses) {
                                  planetDataForHappiness = {
                                    longitude: activeChart.houses.ascendant,
                                    zodiacSignName:
                                      activeChart.houses.ascendantSign,
                                    degree:
                                      parseFloat(
                                        activeChart.houses.ascendantDegree
                                      ) || 0,
                                    degreeFormatted:
                                      activeChart.houses.ascendantDegree,
                                  };
                                } else {
                                  planetDataForHappiness = null;
                                }
                              } else {
                                planetDataForHappiness =
                                  activeChart.planets[planet.name];
                              }

                              // Get happiness emoji for header
                              const happinessEmojiForHeader =
                                getPlanetHappinessEmoji(
                                  activeChart,
                                  planetDataForHappiness,
                                  planet.name
                                );

                              // Check if planet is retrograde - access directly from activeChart
                              const planetForRetrogradeCheck =
                                activeChart.planets[planet.name];
                              // Match the chart component's test behavior for Pluto
                              let isRetrograde =
                                planet.name === "ascendant"
                                  ? false // Ascendant doesn't go retrograde
                                  : !!planetForRetrogradeCheck?.isRetrograde;

                              // Temporary test: force Pluto to be retrograde for testing (matching chart component)
                              if (planet.name === "pluto") {
                                isRetrograde = true;
                              }

                              // Handle navigation for moon card
                              const handleMoonCardPress = () => {
                                if (planet.name === "moon" && navigation) {
                                  (navigation as any).navigate("Moon", {
                                    screen: "MoonMain",
                                    params: {
                                      selectedDate: displayDate.toISOString(),
                                    },
                                  });
                                }
                              };

                              const CardWrapper =
                                planet.name === "moon"
                                  ? TouchableOpacity
                                  : View;
                              const cardWrapperProps =
                                planet.name === "moon"
                                  ? {
                                      onPress: handleMoonCardPress,
                                      activeOpacity: 0.8,
                                    }
                                  : {};

                              return (
                                <CardWrapper
                                  key={planet.name}
                                  {...cardWrapperProps}
                                  style={[
                                    styles.planetCard,
                                    { backgroundColor: zodiacColor },
                                  ]}
                                >
                                  <View style={styles.planetCardTopHeader}>
                                    <View
                                      style={styles.planetCardTopHeaderLeft}
                                    >
                                      <Text
                                        style={[
                                          getPhysisSymbolStyle(
                                            fontLoaded,
                                            "large"
                                          ),
                                          styles.planetCardTopHeaderSymbol,
                                        ]}
                                      >
                                        {planet.data.symbol}
                                      </Text>
                                      {isRetrograde && (
                                        <Text
                                          style={[
                                            styles.planetCardTopHeaderRetrograde,
                                            { marginLeft: 4 },
                                          ]}
                                        >
                                          Rx
                                        </Text>
                                      )}
                                    </View>
                                    <Text
                                      style={styles.planetCardTopHeaderEmoji}
                                    >
                                      {happinessEmojiForHeader}
                                    </Text>
                                  </View>
                                  <View
                                    style={[
                                      styles.planetCardHeader,
                                      !planetCardsExpanded && {
                                        borderBottomWidth: 0,
                                        paddingBottom: 4,
                                      },
                                    ]}
                                  >
                                    <Text style={styles.planetCardHeaderText}>
                                      {planet.displayName}
                                    </Text>
                                    <Text style={styles.planetCardHeaderText}>
                                      {planet.data.degreeFormatted}{" "}
                                      <Text
                                        style={[
                                          getPhysisSymbolStyle(
                                            fontLoaded,
                                            "medium"
                                          ),
                                          { color: "#ffffff" },
                                        ]}
                                      >
                                        {zodiacSymbol}
                                      </Text>
                                    </Text>
                                  </View>
                                  {planetCardsExpanded && (
                                    <View style={styles.planetCardContent}>
                                      {(() => {
                                        // Get planet data for aspect calculations
                                        let planetData: any;
                                        if (planet.name === "ascendant") {
                                          if (!activeChart.houses) {
                                            const ascendantHappinessEmoji =
                                              getPlanetHappinessEmoji(
                                                activeChart,
                                                null,
                                                "ascendant"
                                              );
                                            return (
                                              <View
                                                style={
                                                  styles.planetCardContentRow
                                                }
                                              >
                                                <View
                                                  style={
                                                    styles.planetCardEmojiContainer
                                                  }
                                                >
                                                  <Text
                                                    style={[
                                                      styles.planetCardTestText,
                                                      { display: "none" },
                                                    ]}
                                                  >
                                                    rshp: N/A
                                                  </Text>
                                                  <Text
                                                    style={[
                                                      styles.planetCardTestText,
                                                      { display: "none" },
                                                    ]}
                                                  >
                                                    xlt: N/A
                                                  </Text>
                                                  <Text
                                                    style={[
                                                      styles.planetCardTestText,
                                                      { display: "none" },
                                                    ]}
                                                  >
                                                    jptr: false
                                                  </Text>
                                                  <Text
                                                    style={[
                                                      styles.planetCardTestText,
                                                      { display: "none" },
                                                    ]}
                                                  >
                                                    vns: false
                                                  </Text>
                                                  <Text
                                                    style={[
                                                      styles.planetCardTestTextCons,
                                                      { display: "none" },
                                                    ]}
                                                  >
                                                    fall: false
                                                  </Text>
                                                  <Text
                                                    style={[
                                                      styles.planetCardTestTextCons,
                                                      { display: "none" },
                                                    ]}
                                                  >
                                                    stn: false
                                                  </Text>
                                                  <Text
                                                    style={[
                                                      styles.planetCardTestTextCons,
                                                      { display: "none" },
                                                    ]}
                                                  >
                                                    mars: false
                                                  </Text>
                                                </View>
                                                <Text
                                                  style={
                                                    styles.planetCardContentText
                                                  }
                                                >
                                                  No data
                                                </Text>
                                              </View>
                                            );
                                          }
                                          planetData = {
                                            longitude:
                                              activeChart.houses.ascendant,
                                            zodiacSignName:
                                              activeChart.houses.ascendantSign,
                                            degree:
                                              parseFloat(
                                                activeChart.houses
                                                  .ascendantDegree
                                              ) || 0,
                                            degreeFormatted:
                                              activeChart.houses
                                                .ascendantDegree,
                                          };
                                        } else {
                                          planetData =
                                            activeChart.planets[planet.name];
                                        }

                                        // Get happiness emoji
                                        const happinessEmoji =
                                          getPlanetHappinessEmoji(
                                            activeChart,
                                            planetData,
                                            planet.name
                                          );

                                        // Get isPlanetaryRuler test result (null for ascendant and outer planets)
                                        const isRulerResult =
                                          planet.name === "ascendant" ||
                                          [
                                            "uranus",
                                            "neptune",
                                            "pluto",
                                            "northNode",
                                          ].includes(planet.name)
                                            ? null
                                            : planetData && !planetData.error
                                            ? isPlanetaryRuler(
                                                activeChart,
                                                planetData,
                                                planet.name
                                              )
                                            : false;

                                        // Get isPlanetaryExaltation test result (null for ascendant and outer planets)
                                        const isExaltationResult =
                                          planet.name === "ascendant" ||
                                          [
                                            "uranus",
                                            "neptune",
                                            "pluto",
                                            "northNode",
                                          ].includes(planet.name)
                                            ? null
                                            : planetData && !planetData.error
                                            ? isPlanetaryExaltation(
                                                activeChart,
                                                planetData,
                                                planet.name
                                              )
                                            : false;

                                        // Get hasAspectWithJupiter test result (null for jupiter itself)
                                        const hasJupiterAspectResult =
                                          planet.name === "jupiter"
                                            ? null
                                            : planetData && !planetData.error
                                            ? hasAspectWithJupiter(
                                                activeChart,
                                                planetData,
                                                planet.name
                                              )
                                            : false;

                                        // Get hasAspectWithVenus test result (null for venus itself)
                                        const hasVenusAspectResult =
                                          planet.name === "venus"
                                            ? null
                                            : planetData && !planetData.error
                                            ? hasAspectWithVenus(
                                                activeChart,
                                                planetData,
                                                planet.name
                                              )
                                            : false;

                                        // Get isPlanetaryFall test result (null for ascendant and outer planets)
                                        const isFallResult =
                                          planet.name === "ascendant" ||
                                          [
                                            "uranus",
                                            "neptune",
                                            "pluto",
                                            "northNode",
                                          ].includes(planet.name)
                                            ? null
                                            : planetData && !planetData.error
                                            ? isPlanetaryFall(
                                                activeChart,
                                                planetData,
                                                planet.name
                                              )
                                            : false;

                                        // Get hasHardAspectWithSaturn test result (null for saturn itself)
                                        const hasSaturnAspectResult =
                                          planet.name === "saturn"
                                            ? null
                                            : planetData && !planetData.error
                                            ? hasHardAspectWithSaturn(
                                                activeChart,
                                                planetData,
                                                planet.name
                                              )
                                            : false;

                                        // Get hasHardAspectWithMars test result (null for mars itself)
                                        const hasMarsAspectResult =
                                          planet.name === "mars"
                                            ? null
                                            : planetData && !planetData.error
                                            ? hasHardAspectWithMars(
                                                activeChart,
                                                planetData,
                                                planet.name
                                              )
                                            : false;

                                        if (!planetData) {
                                          return (
                                            <View
                                              style={
                                                styles.planetCardContentRow
                                              }
                                            >
                                              <View
                                                style={
                                                  styles.planetCardEmojiContainer
                                                }
                                              >
                                                <Text
                                                  style={[
                                                    styles.planetCardTestText,
                                                    {
                                                      display:
                                                        isRulerResult === true
                                                          ? "flex"
                                                          : "none",
                                                    },
                                                  ]}
                                                >
                                                  rshp:{" "}
                                                  {isRulerResult === null
                                                    ? "N/A"
                                                    : isRulerResult
                                                    ? "true"
                                                    : "false"}
                                                </Text>
                                                <Text
                                                  style={[
                                                    styles.planetCardTestText,
                                                    {
                                                      display:
                                                        isExaltationResult ===
                                                        true
                                                          ? "flex"
                                                          : "none",
                                                    },
                                                  ]}
                                                >
                                                  xlt:{" "}
                                                  {isExaltationResult === null
                                                    ? "N/A"
                                                    : isExaltationResult
                                                    ? "true"
                                                    : "false"}
                                                </Text>
                                                <Text
                                                  style={[
                                                    styles.planetCardTestText,
                                                    {
                                                      display:
                                                        hasJupiterAspectResult ===
                                                        true
                                                          ? "flex"
                                                          : "none",
                                                    },
                                                  ]}
                                                >
                                                  jptr:{" "}
                                                  {hasJupiterAspectResult ===
                                                  null
                                                    ? "N/A"
                                                    : hasJupiterAspectResult
                                                    ? "true"
                                                    : "false"}
                                                </Text>
                                                <Text
                                                  style={[
                                                    styles.planetCardTestText,
                                                    {
                                                      display:
                                                        hasVenusAspectResult ===
                                                        true
                                                          ? "flex"
                                                          : "none",
                                                    },
                                                  ]}
                                                >
                                                  vns:{" "}
                                                  {hasVenusAspectResult === null
                                                    ? "N/A"
                                                    : hasVenusAspectResult
                                                    ? "true"
                                                    : "false"}
                                                </Text>
                                                <Text
                                                  style={[
                                                    styles.planetCardTestTextCons,
                                                    {
                                                      display:
                                                        isFallResult === true
                                                          ? "flex"
                                                          : "none",
                                                    },
                                                  ]}
                                                >
                                                  fall:{" "}
                                                  {isFallResult === null
                                                    ? "N/A"
                                                    : isFallResult
                                                    ? "true"
                                                    : "false"}
                                                </Text>
                                                <Text
                                                  style={[
                                                    styles.planetCardTestTextCons,
                                                    {
                                                      display:
                                                        hasSaturnAspectResult ===
                                                        true
                                                          ? "flex"
                                                          : "none",
                                                    },
                                                  ]}
                                                >
                                                  stn:{" "}
                                                  {hasSaturnAspectResult ===
                                                  null
                                                    ? "N/A"
                                                    : hasSaturnAspectResult
                                                    ? "true"
                                                    : "false"}
                                                </Text>
                                                <Text
                                                  style={[
                                                    styles.planetCardTestTextCons,
                                                    {
                                                      display:
                                                        hasMarsAspectResult ===
                                                        true
                                                          ? "flex"
                                                          : "none",
                                                    },
                                                  ]}
                                                >
                                                  mars:{" "}
                                                  {hasMarsAspectResult === null
                                                    ? "N/A"
                                                    : hasMarsAspectResult
                                                    ? "true"
                                                    : "false"}
                                                </Text>
                                              </View>
                                              <Text
                                                style={
                                                  styles.planetCardContentText
                                                }
                                              >
                                                No data
                                              </Text>
                                            </View>
                                          );
                                        }

                                        const aspects = getAspectsForCard(
                                          planet.name,
                                          planetData,
                                          activeChart
                                        );

                                        // Get whole sign aspects regardless of whether there are degree-based aspects
                                        const wholeSignAspects =
                                          getWholeSignAspectsForCard(
                                            planet.name,
                                            planetData,
                                            activeChart,
                                            aspects
                                          );

                                        if (aspects.length === 0) {
                                          return (
                                            <>
                                              <View
                                                style={
                                                  styles.planetCardContentRow
                                                }
                                              >
                                                <View
                                                  style={
                                                    styles.planetCardEmojiContainer
                                                  }
                                                >
                                                  <Text
                                                    style={[
                                                      styles.planetCardTestText,
                                                      {
                                                        display:
                                                          isRulerResult === true
                                                            ? "flex"
                                                            : "none",
                                                      },
                                                    ]}
                                                  >
                                                    rshp:{" "}
                                                    {isRulerResult === null
                                                      ? "N/A"
                                                      : isRulerResult
                                                      ? "true"
                                                      : "false"}
                                                  </Text>
                                                  <Text
                                                    style={[
                                                      styles.planetCardTestText,
                                                      {
                                                        display:
                                                          isExaltationResult ===
                                                          true
                                                            ? "flex"
                                                            : "none",
                                                      },
                                                    ]}
                                                  >
                                                    xlt:{" "}
                                                    {isExaltationResult === null
                                                      ? "N/A"
                                                      : isExaltationResult
                                                      ? "true"
                                                      : "false"}
                                                  </Text>
                                                  <Text
                                                    style={[
                                                      styles.planetCardTestText,
                                                      {
                                                        display:
                                                          hasJupiterAspectResult ===
                                                          true
                                                            ? "flex"
                                                            : "none",
                                                      },
                                                    ]}
                                                  >
                                                    jptr:{" "}
                                                    {hasJupiterAspectResult ===
                                                    null
                                                      ? "N/A"
                                                      : hasJupiterAspectResult
                                                      ? "true"
                                                      : "false"}
                                                  </Text>
                                                  <Text
                                                    style={[
                                                      styles.planetCardTestText,
                                                      {
                                                        display:
                                                          hasVenusAspectResult ===
                                                          true
                                                            ? "flex"
                                                            : "none",
                                                      },
                                                    ]}
                                                  >
                                                    vns:{" "}
                                                    {hasVenusAspectResult ===
                                                    null
                                                      ? "N/A"
                                                      : hasVenusAspectResult
                                                      ? "true"
                                                      : "false"}
                                                  </Text>
                                                  <Text
                                                    style={[
                                                      styles.planetCardTestTextCons,
                                                      {
                                                        display:
                                                          isFallResult === true
                                                            ? "flex"
                                                            : "none",
                                                      },
                                                    ]}
                                                  >
                                                    fall:{" "}
                                                    {isFallResult === null
                                                      ? "N/A"
                                                      : isFallResult
                                                      ? "true"
                                                      : "false"}
                                                  </Text>
                                                  <Text
                                                    style={[
                                                      styles.planetCardTestTextCons,
                                                      {
                                                        display:
                                                          hasSaturnAspectResult ===
                                                          true
                                                            ? "flex"
                                                            : "none",
                                                      },
                                                    ]}
                                                  >
                                                    stn:{" "}
                                                    {hasSaturnAspectResult ===
                                                    null
                                                      ? "N/A"
                                                      : hasSaturnAspectResult
                                                      ? "true"
                                                      : "false"}
                                                  </Text>
                                                  <Text
                                                    style={[
                                                      styles.planetCardTestTextCons,
                                                      {
                                                        display:
                                                          hasMarsAspectResult ===
                                                          true
                                                            ? "flex"
                                                            : "none",
                                                      },
                                                    ]}
                                                  >
                                                    mars:{" "}
                                                    {hasMarsAspectResult ===
                                                    null
                                                      ? "N/A"
                                                      : hasMarsAspectResult
                                                      ? "true"
                                                      : "false"}
                                                  </Text>
                                                </View>
                                                <Text
                                                  style={
                                                    styles.planetCardContentText
                                                  }
                                                >
                                                  No aspects
                                                </Text>
                                              </View>
                                              {/* Footer section with whole sign aspects */}
                                              {wholeSignAspects.length > 0 && (
                                                <>
                                                  <View
                                                    style={
                                                      styles.planetCardFooterDivider
                                                    }
                                                  />
                                                  <View
                                                    style={
                                                      styles.planetCardFooter
                                                    }
                                                  >
                                                    <Text
                                                      style={
                                                        styles.planetCardFooterAspectText
                                                      }
                                                    >
                                                      WHOLE SIGN ASPECTS
                                                    </Text>
                                                    <Text
                                                      style={
                                                        styles.planetCardFooterAspectText
                                                      }
                                                    >
                                                      {wholeSignAspects
                                                        .map((aspect) => {
                                                          const aspectType =
                                                            aspect.aspectName
                                                              .replace(
                                                                /^whole sign /i,
                                                                ""
                                                              )
                                                              .toLowerCase();
                                                          return `${aspectType} ${aspect.displayName}`;
                                                        })
                                                        .join(", ")}
                                                    </Text>
                                                  </View>
                                                </>
                                              )}
                                            </>
                                          );
                                        }

                                        return (
                                          <>
                                            <View
                                              style={
                                                styles.planetCardContentRow
                                              }
                                            >
                                              <View
                                                style={
                                                  styles.planetCardEmojiContainer
                                                }
                                              >
                                                <Text
                                                  style={[
                                                    styles.planetCardTestText,
                                                    {
                                                      display:
                                                        isRulerResult === true
                                                          ? "flex"
                                                          : "none",
                                                    },
                                                  ]}
                                                >
                                                  rshp:{" "}
                                                  {isRulerResult === null
                                                    ? "N/A"
                                                    : isRulerResult
                                                    ? "true"
                                                    : "false"}
                                                </Text>
                                                <Text
                                                  style={[
                                                    styles.planetCardTestText,
                                                    {
                                                      display:
                                                        isExaltationResult ===
                                                        true
                                                          ? "flex"
                                                          : "none",
                                                    },
                                                  ]}
                                                >
                                                  xlt:{" "}
                                                  {isExaltationResult === null
                                                    ? "N/A"
                                                    : isExaltationResult
                                                    ? "true"
                                                    : "false"}
                                                </Text>
                                                <Text
                                                  style={[
                                                    styles.planetCardTestText,
                                                    {
                                                      display:
                                                        hasJupiterAspectResult ===
                                                        true
                                                          ? "flex"
                                                          : "none",
                                                    },
                                                  ]}
                                                >
                                                  jptr:{" "}
                                                  {hasJupiterAspectResult ===
                                                  null
                                                    ? "N/A"
                                                    : hasJupiterAspectResult
                                                    ? "true"
                                                    : "false"}
                                                </Text>
                                                <Text
                                                  style={[
                                                    styles.planetCardTestText,
                                                    {
                                                      display:
                                                        hasVenusAspectResult ===
                                                        true
                                                          ? "flex"
                                                          : "none",
                                                    },
                                                  ]}
                                                >
                                                  vns:{" "}
                                                  {hasVenusAspectResult === null
                                                    ? "N/A"
                                                    : hasVenusAspectResult
                                                    ? "true"
                                                    : "false"}
                                                </Text>
                                                <Text
                                                  style={[
                                                    styles.planetCardTestTextCons,
                                                    {
                                                      display:
                                                        isFallResult === true
                                                          ? "flex"
                                                          : "none",
                                                    },
                                                  ]}
                                                >
                                                  fall:{" "}
                                                  {isFallResult === null
                                                    ? "N/A"
                                                    : isFallResult
                                                    ? "true"
                                                    : "false"}
                                                </Text>
                                                <Text
                                                  style={[
                                                    styles.planetCardTestTextCons,
                                                    {
                                                      display:
                                                        hasSaturnAspectResult ===
                                                        true
                                                          ? "flex"
                                                          : "none",
                                                    },
                                                  ]}
                                                >
                                                  stn:{" "}
                                                  {hasSaturnAspectResult ===
                                                  null
                                                    ? "N/A"
                                                    : hasSaturnAspectResult
                                                    ? "true"
                                                    : "false"}
                                                </Text>
                                                <Text
                                                  style={[
                                                    styles.planetCardTestTextCons,
                                                    {
                                                      display:
                                                        hasMarsAspectResult ===
                                                        true
                                                          ? "flex"
                                                          : "none",
                                                    },
                                                  ]}
                                                >
                                                  mars:{" "}
                                                  {hasMarsAspectResult === null
                                                    ? "N/A"
                                                    : hasMarsAspectResult
                                                    ? "true"
                                                    : "false"}
                                                </Text>
                                              </View>
                                              <View
                                                style={
                                                  styles.planetCardAspectsList
                                                }
                                              >
                                                {aspects.map(
                                                  (aspect, index) => (
                                                    <Text
                                                      key={index}
                                                      style={
                                                        styles.planetCardAspectText
                                                      }
                                                    >
                                                      {aspect.aspectName}{" "}
                                                      {aspect.displayName}
                                                      {aspect.orb && (
                                                        <Text
                                                          style={
                                                            styles.planetCardAspectOrb
                                                          }
                                                        >
                                                          {" "}
                                                          ({aspect.orb}°)
                                                        </Text>
                                                      )}
                                                    </Text>
                                                  )
                                                )}
                                              </View>
                                            </View>
                                            {/* Footer section with whole sign aspects */}
                                            {wholeSignAspects.length > 0 && (
                                              <>
                                                <View
                                                  style={
                                                    styles.planetCardFooterDivider
                                                  }
                                                />
                                                <View
                                                  style={
                                                    styles.planetCardFooter
                                                  }
                                                >
                                                  <Text
                                                    style={
                                                      styles.planetCardFooterAspectText
                                                    }
                                                  >
                                                    WHOLE SIGN ASPECTS
                                                  </Text>
                                                  <Text
                                                    style={
                                                      styles.planetCardFooterAspectText
                                                    }
                                                  >
                                                    {wholeSignAspects
                                                      .map((aspect) => {
                                                        const aspectType =
                                                          aspect.aspectName
                                                            .replace(
                                                              /^whole sign /i,
                                                              ""
                                                            )
                                                            .toLowerCase();
                                                        return `${aspectType} ${aspect.displayName}`;
                                                      })
                                                      .join(", ")}
                                                  </Text>
                                                </View>
                                              </>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </View>
                                  )}
                                </CardWrapper>
                              );
                            })}
                          </View>
                        ))}
                      </View>
                    );
                  })()}
                </View>
              )}

              {/* Planet Aspects Sections */}
              {activeChart &&
                !ephemerisLoading &&
                !selectedDateLoading &&
                (() => {
                  const planetConfigs = [
                    { name: "sun", emoji: "☀️", displayName: "Sun" },
                    { name: "moon", emoji: "🌙", displayName: "Moon" },
                    { name: "mercury", emoji: "☿", displayName: "Mercury" },
                    { name: "venus", emoji: "♀", displayName: "Venus" },
                    { name: "mars", emoji: "♂", displayName: "Mars" },
                    { name: "jupiter", emoji: "♃", displayName: "Jupiter" },
                    { name: "saturn", emoji: "♄", displayName: "Saturn" },
                    { name: "uranus", emoji: "♅", displayName: "Uranus" },
                    { name: "neptune", emoji: "♆", displayName: "Neptune" },
                    { name: "pluto", emoji: "♇", displayName: "Pluto" },
                    { name: "northNode", emoji: "☊", displayName: "N. Node" },
                  ];

                  return (
                    <>
                      {/* Planet Aspects */}
                      {planetConfigs.map((config) => {
                        const planet = activeChart.planets[config.name];
                        if (!planet || planet.error) return null;

                        const zodiacSymbol = planet.zodiacSignName
                          ? getZodiacKeysFromNames()[planet.zodiacSignName]
                          : null;

                        return (
                          <View key={config.name} style={styles.cardContainer}>
                            <Text style={styles.cardTitle}>
                              {zodiacSymbol && planet.zodiacSignName && (
                                <Text
                                  style={[
                                    getPhysisSymbolStyle(fontLoaded, "medium"),
                                    getZodiacColorStyle(planet.zodiacSignName),
                                  ]}
                                >
                                  {zodiacSymbol}
                                </Text>
                              )}{" "}
                              {planet.degreeFormatted && planet.zodiacSignName && (
                                <Text
                                  style={getZodiacColorStyle(planet.zodiacSignName)}
                                >
                                  {planet.degreeFormatted}{" "}
                                </Text>
                              )}
                              {config.emoji} {config.displayName} Aspects
                            </Text>
                            {renderAspectsSection(
                              config.name,
                              planet,
                              config.emoji,
                              config.displayName,
                              activeChart
                            )}
                          </View>
                        );
                      })}

                      {/* Ascendant Aspects */}
                      {activeChart.houses &&
                        activeChart.houses.ascendant &&
                        activeChart.houses.ascendantSign && (
                          <View style={styles.cardContainer}>
                            <Text style={styles.cardTitle}>
                              <Text
                                style={getPhysisSymbolStyle(fontLoaded, "medium")}
                              >
                                !
                              </Text>{" "}
                              {activeChart.houses.ascendantSign && (
                                <>
                                  <Text
                                    style={[
                                      getPhysisSymbolStyle(fontLoaded, "medium"),
                                      getZodiacColorStyle(
                                        activeChart.houses.ascendantSign
                                      ),
                                    ]}
                                  >
                                    {getZodiacKeysFromNames()[
                                      activeChart.houses.ascendantSign
                                    ]}
                                  </Text>{" "}
                                  {activeChart.houses.ascendantDegree && (
                                    <Text
                                      style={getZodiacColorStyle(
                                        activeChart.houses.ascendantSign
                                      )}
                                    >
                                      {activeChart.houses.ascendantDegree}{" "}
                                    </Text>
                                  )}
                                </>
                              )}
                              Ascendant Aspects
                            </Text>
                            {renderAspectsSection(
                              "ascendant",
                              {
                                longitude: activeChart.houses.ascendant,
                                zodiacSignName:
                                  activeChart.houses.ascendantSign,
                                degree:
                                  parseFloat(
                                    activeChart.houses.ascendantDegree
                                  ) || 0,
                                degreeFormatted:
                                  activeChart.houses.ascendantDegree,
                              },
                              "!",
                              "Ascendant",
                              activeChart
                            )}
                          </View>
                        )}
                    </>
                  );
                })()}

              {/* Current Planetary Positions */}
              {activeChart && !ephemerisLoading && !selectedDateLoading && (
                <View style={styles.cardContainer}>
                  <Text style={styles.cardTitle}>
                    🌙 Current Planetary Positions
                  </Text>
                  {/* Ascendant */}
                  {activeChart.houses && (
                    <View style={styles.planetRow}>
                      <Text style={styles.zodiacSymbol}>
                        {/* ascendant symbol */}
                        <Text
                          style={getPhysisSymbolStyle(fontLoaded, "medium")}
                        >
                          !
                        </Text>{" "}
                        {/* zodiac symbol */}
                        <Text
                          style={getPhysisSymbolStyle(fontLoaded, "medium")}
                        >
                          {
                            getZodiacKeysFromNames()[
                              activeChart.houses.ascendantSign
                            ]
                          }
                        </Text>{" "}
                      </Text>
                      <Text style={styles.planetPosition}>
                        {activeChart.houses.ascendantSign} Ascendant
                      </Text>
                      <Text style={styles.planetPosition}>
                        {activeChart.houses.ascendantDegree &&
                        !isNaN(
                          parseFloat(
                            activeChart.houses.ascendantDegree.toString()
                          )
                        )
                          ? activeChart.houses.ascendantDegree
                          : "Calculating..."}
                      </Text>
                    </View>
                  )}
                  {Object.entries(activeChart.planets).map(
                    ([planetName, planet]) => {
                      // Temporary test: force Pluto to be retrograde for testing
                      const testPlanet =
                        planetName === "pluto"
                          ? { ...planet, isRetrograde: true }
                          : planet;
                      const planetKeys = getPlanetKeysFromNames();
                      const zodiacKeys = getZodiacKeysFromNames();
                      const capitalizedName =
                        planetName.charAt(0).toUpperCase() +
                        planetName.slice(1);
                      // Special handling for north node
                      const displayName =
                        planetName === "northNode"
                          ? "N. Node"
                          : capitalizedName;
                      const physisKey =
                        planetKeys[
                          planetName === "northNode"
                            ? "NorthNode"
                            : capitalizedName
                        ];
                      const physisSymbol = physisKey;
                      const zodiacKey = zodiacKeys[testPlanet.zodiacSignName];
                      const physisZodiacSymbol = zodiacKey;

                      return (
                        <View key={planetName} style={styles.planetRow}>
                          <Text style={styles.zodiacSymbol}>
                            {/* planet symbol  */}
                            <Text
                              style={getPhysisSymbolStyle(fontLoaded, "medium")}
                            >
                              {physisSymbol}
                            </Text>{" "}
                            {/* zodiac symbol */}
                            <Text
                              style={getPhysisSymbolStyle(fontLoaded, "medium")}
                            >
                              {physisZodiacSymbol}
                            </Text>{" "}
                          </Text>
                          <Text style={styles.planetPosition}>
                            {testPlanet.zodiacSignName} {displayName}
                            {testPlanet.isRetrograde && (
                              <Text style={styles.retrogradeIndicator}> R</Text>
                            )}
                          </Text>
                          <Text style={styles.planetPosition}>
                            {testPlanet.degreeFormatted}
                          </Text>
                        </View>
                      );
                    }
                  )}
                </View>
              )}
            </ScrollView>
          </View>

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
    backgroundColor: "#509ac9",
  },
  gradientLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  nightLayer: {
    zIndex: 1,
  },
  dayLayer: {
    zIndex: 2,
  },
  duskLayer: {
    zIndex: 3,
  },
  dawnLayer: {
    zIndex: 4,
  },
  contentLayer: {
    flex: 1,
    zIndex: 10,
  },
  scrollContainer: {
    flex: 1,
    padding: 0,
    paddingBottom: 50, // Account for calculator nav bar
  },
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    marginBottom: 60,
    minHeight: 400, // Ensure minimum height for proper centering
  },
  planetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  zodiacSymbol: {
    fontSize: 20,
    color: "#e6e6fa",
    textAlign: "left",
    flex: 1,
  },
  planetPosition: {
    fontSize: 14,
    color: "#e6e6fa",
    textAlign: "left",
    flex: 1,
  },
  retrogradeIndicator: {
    fontSize: 12,
    color: "#ff6b6b",
    fontWeight: "bold",
  },
  // Secondary Navigation Bar Styles
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
  // Loading styles
  loadingContainer: {
    alignItems: "center",
    padding: 20,
    marginTop: 20,
  },
  loadingText: {
    color: "#e6e6fa",
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
  },
  stickyPlanetaryHour: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1000,
  },
  // Card styles from PlanetaryHoursScreen
  cardContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 10,
    padding: 15,
    marginLeft: 15,
    marginRight: 15,
    marginBottom: 60,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e6e6fa",
    marginBottom: 10,
    textAlign: "center",
  },
  // Aspect styles
  aspectsList: {
    width: "100%",
  },
  aspectTableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
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
    color: "#e6e6fa",
    fontWeight: "600",
  },
  aspectPlanetPosition: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },
  orbLabelText: {
    fontSize: 12,
    color: "#b0b0b0",
    fontFamily: "monospace",
  },
  noAspectsText: {
    fontSize: 14,
    color: "#b0b0b0",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 10,
  },
  // Planet Cards Grid styles
  planetCardsContainer: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  planetCardsControls: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginBottom: 10,
  },
  planetCardsControlButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.5,
  },
  planetCardsControlButtonActive: {
    opacity: 1.0,
  },
  collapseIcon: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    width: 20,
    height: 20,
  },
  collapseRectangle: {
    width: 20,
    height: 4,
    backgroundColor: "#ffffff",
  },
  expandRectangle: {
    width: 19,
    height: 23,
    backgroundColor: "#ffffff",
  },
  planetCardsGrid: {
    width: "100%",
  },
  planetCardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    gap: 15,
  },
  planetCard: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
    minHeight: 20,
  },
  planetCardAscendantRuler: {
    borderColor: "#e6e6fa",
    borderWidth: 2,
  },
  planetCardTopHeader: {
    paddingTop: 3,
    paddingBottom: 0,
    paddingHorizontal: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planetCardTopHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  planetCardTopHeaderSymbol: {
    fontSize: 42,
    color: "#ffffff",
  },
  planetCardTopHeaderRetrograde: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "bold",
  },
  planetCardTopHeaderEmoji: {
    fontSize: 43,
  },
  planetCardHeader: {
    paddingTop: 2,
    paddingBottom: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "hsla(0, 0.00%, 100.00%, 0.20)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planetCardHeaderText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ffffff",
  },
  planetCardContent: {
    padding: 12,
    flex: 1,
  },
  planetCardContentRow: {
    flexDirection: "row",
    flex: 1,
    gap: 12,
  },
  planetCardEmojiContainer: {
    alignItems: "center",
  },
  planetCardEmoji: {
    fontSize: 24,
  },
  planetCardTestText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 4,
  },
  planetCardTestTextCons: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000000", // Black color for cons
    marginTop: 4,
  },
  planetCardContentText: {
    fontSize: 12,
    color: "#ffffff",
    opacity: 0.8,
    flex: 1,
  },
  planetCardAspectsList: {
    flex: 1,
  },
  planetCardAspectText: {
    fontSize: 13,
    color: "#ffffff",
    marginBottom: 4,
    lineHeight: 18,
  },
  planetCardAspectOrb: {
    fontSize: 10,
    opacity: 0.7,
    fontFamily: "monospace",
  },
  planetCardFooterDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginTop: 8,
    marginBottom: 8,
    marginHorizontal: 12,
  },
  planetCardFooter: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  planetCardFooterAspectText: {
    fontSize: 12,
    color: "#ffffff",
    marginBottom: 3,
    lineHeight: 16,
    opacity: 0.9,
  },
  planetCardFooterAspectOrb: {
    fontSize: 10,
    opacity: 0.7,
    fontFamily: "monospace",
  },
});
