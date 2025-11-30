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

// ============================================================================
// COMPONENT
// ============================================================================
export default function AstrologyScreen({ navigation }: any) {
  const {
    currentChart,
    loading: ephemerisLoading,
    refreshLoading,
    refreshError,
  } = useAstrology();
  const { fontLoaded } = usePhysisFont();

  // State for the currently displayed date
  const [displayDate, setDisplayDate] = useState(new Date());

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

      // Convert local time to UTC for the backend
      // This ensures consistency with how the backend handles current time
      const customDate = {
        year: date.getFullYear(),
        month: date.getMonth() + 1, // JavaScript months are 0-based
        day: date.getDate(),
        hour: date.getUTCHours(), // Use UTC time to match backend's current time handling
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

    const aspects: Array<{
      planetName: string;
      displayName: string;
      aspectName: string;
      orb?: string;
    }> = [];

    otherPlanets.forEach(([planetName, planet]: [string, any]) => {
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
                  {(() => {
                    const planetPairs = [
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

                              return (
                                <View
                                  key={planet.name}
                                  style={[
                                    styles.planetCard,
                                    { backgroundColor: zodiacColor },
                                  ]}
                                >
                                  <View style={styles.planetCardHeader}>
                                    <Text style={styles.planetCardHeaderText}>
                                      {planet.data.degreeFormatted}{" "}
                                      <Text
                                        style={[
                                          getPhysisSymbolStyle(
                                            fontLoaded,
                                            "medium"
                                          ),
                                          styles.planetCardHeaderText,
                                        ]}
                                      >
                                        {zodiacSymbol}
                                      </Text>{" "}
                                      {planet.displayName}
                                    </Text>
                                  </View>
                                  <View style={styles.planetCardContent}>
                                    {(() => {
                                      // Get planet data for aspect calculations
                                      let planetData: any;
                                      if (planet.name === "ascendant") {
                                        if (!activeChart.houses) {
                                          return (
                                            <Text
                                              style={
                                                styles.planetCardContentText
                                              }
                                            >
                                              No data
                                            </Text>
                                          );
                                        }
                                        planetData = {
                                          longitude:
                                            activeChart.houses.ascendant,
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
                                        planetData =
                                          activeChart.planets[planet.name];
                                      }

                                      if (!planetData) {
                                        return (
                                          <Text
                                            style={styles.planetCardContentText}
                                          >
                                            No data
                                          </Text>
                                        );
                                      }

                                      const aspects = getAspectsForCard(
                                        planet.name,
                                        planetData,
                                        activeChart
                                      );

                                      if (aspects.length === 0) {
                                        return (
                                          <Text
                                            style={styles.planetCardContentText}
                                          >
                                            No aspects
                                          </Text>
                                        );
                                      }

                                      return (
                                        <View
                                          style={styles.planetCardAspectsList}
                                        >
                                          {aspects.map((aspect, index) => (
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
                                          ))}
                                        </View>
                                      );
                                    })()}
                                  </View>
                                </View>
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

                        return (
                          <View key={config.name} style={styles.cardContainer}>
                            <Text style={styles.cardTitle}>
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
                              ! Ascendant Aspects
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
    minHeight: 100,
  },
  planetCardHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  planetCardHeaderText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
  },
  planetCardContent: {
    padding: 12,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  planetCardContentText: {
    fontSize: 12,
    color: "#ffffff",
    opacity: 0.8,
  },
  planetCardAspectsList: {
    width: "100%",
  },
  planetCardAspectText: {
    fontSize: 11,
    color: "#ffffff",
    marginBottom: 4,
    lineHeight: 16,
  },
  planetCardAspectOrb: {
    fontSize: 10,
    opacity: 0.7,
    fontFamily: "monospace",
  },
});
