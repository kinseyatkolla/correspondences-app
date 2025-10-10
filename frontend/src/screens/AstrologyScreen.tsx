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
  PanGestureHandler,
  State,
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
  const onSwipe = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      const threshold = 50; // Minimum swipe distance

      if (translationX > threshold) {
        // Swipe right to left - go to previous day
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
        // Swipe left to right - go to next day
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
    }
  };

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

  // ===== MAIN TEMPLATE =====
  return (
    <GestureHandlerRootView style={styles.container}>
      <PanGestureHandler onHandlerStateChange={onSwipe}>
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
              <CurrentPlanetaryHour
                planetaryHoursData={planetaryHoursData}
                loading={planetaryHoursLoading}
                onPress={() =>
                  navigation.navigate("PlanetaryHours", {
                    selectedDate: displayDate,
                  })
                }
              />
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
      </PanGestureHandler>

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
    backgroundColor: "#0a0a1a", // Navy blue background to prevent flicker before gradients load
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
    padding: 5,
    paddingBottom: 50, // Account for calculator nav bar
  },
  header: {
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#e6e6fa",
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#e6e6fa",
    textAlign: "center",
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: "#e6e6fa",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: "#1a1a2e",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e6e6fa",
  },
  resetButtonText: {
    color: "#e6e6fa",
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    padding: 20,
    marginBottom: 20,
  },
  chartContainer: {
    alignItems: "center",
    marginTop: -30,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e6e6fa",
    marginBottom: 15,
  },
  planetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  planetName: {
    fontSize: 16,
    color: "#e6e6fa",
    fontWeight: "600",
    flex: 1,
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
  errorText: {
    fontSize: 14,
    color: "#ff6b6b",
    textAlign: "right",
    flex: 1,
  },
  retrogradeIndicator: {
    fontSize: 12,
    color: "#ff6b6b",
    fontWeight: "bold",
  },
  infoText: {
    fontSize: 14,
    color: "#e6e6fa",
    lineHeight: 20,
    marginBottom: 8,
  },
  currentPositionsSection: {
    padding: 15,
    marginTop: 30,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  infoSection: {
    padding: 15,
    marginTop: 10,
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
});
