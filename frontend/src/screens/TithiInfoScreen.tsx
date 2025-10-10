// ============================================================================
// IMPORTS
// ============================================================================
import React, { useEffect, useState } from "react";
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
  PanGestureHandler,
  State,
} from "react-native-gesture-handler";
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
interface TithiInfoScreenProps {
  navigation: any;
  route: any;
}

export default function TithiInfoScreen({
  navigation,
  route,
}: TithiInfoScreenProps) {
  const { currentChart, loading, error } = useAstrology();
  const { fontLoaded } = usePhysisFont();

  // Get selected date from route params, default to today
  const selectedDate = route?.params?.selectedDate || new Date();

  // State for the currently displayed date
  const [displayDate, setDisplayDate] = useState(selectedDate);

  // State for the selected date's chart data
  const [selectedDateChart, setSelectedDateChart] = useState<BirthChart | null>(
    null
  );

  // State for the date/time picker drawer
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Function to fetch chart data for a specific date
  const fetchChartForDate = async (date: Date) => {
    try {
      // Use the same location as the current chart
      const location = currentChart?.location || {
        latitude: 40.7128,
        longitude: -74.006,
      };

      const birthData: BirthData = {
        year: date.getFullYear(),
        month: date.getMonth() + 1, // JavaScript months are 0-based
        day: date.getDate(),
        hour: 12, // Use noon for the calculation
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
    fetchChartForDate(now);
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
        setDisplayDate(newDate);
        fetchChartForDate(newDate);
      } else if (translationX < -threshold) {
        // Swipe left to right - go to next day
        const newDate = new Date(displayDate);
        newDate.setDate(newDate.getDate() + 1);
        setDisplayDate(newDate);
        fetchChartForDate(newDate);
      }
    }
  };

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

  // Fetch chart data for the selected date when it changes
  useEffect(() => {
    if (currentChart && displayDate) {
      // Only fetch if we don't already have data for this date
      const today = new Date();
      const isToday = displayDate.toDateString() === today.toDateString();

      if (!isToday && !selectedDateChart) {
        fetchChartForDate(displayDate);
      }
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
      <PanGestureHandler onHandlerStateChange={onSwipe}>
        <View style={styles.container}>
          <ScrollView
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
              {activeChart ? (
                <>
                  {/* Tithi Information */}
                  {currentTithi && tithiInfo && (
                    <View style={styles.tithiContainer}>
                      <Text style={styles.tithiTitle}>Tithi (Lunar Day)</Text>
                      <Text style={styles.tithiNumber}>
                        {currentTithi} - {tithiInfo.name}
                      </Text>
                      {tithiPercentageRemaining !== null && (
                        <Text style={styles.tithiPercentage}>
                          {tithiPercentageRemaining.toFixed(2)}% remaining
                        </Text>
                      )}
                      <Text style={styles.tithiNumbers}>
                        Numbers: {tithiInfo.numbers[0]}, {tithiInfo.numbers[1]}
                      </Text>
                      <Text style={styles.pakshaText}>{paksha}</Text>

                      {/* Debug information for tithi calculation */}
                      {activeChart?.planets?.moon &&
                        activeChart?.planets?.sun && (
                          <View style={styles.debugContainer}>
                            <Text style={styles.debugTitle}>Debug Info:</Text>
                            <Text style={styles.debugText}>
                              Moon Longitude:{" "}
                              {activeChart.planets.moon.longitude.toFixed(2)}°
                            </Text>
                            <Text style={styles.debugText}>
                              Sun Longitude:{" "}
                              {activeChart.planets.sun.longitude.toFixed(2)}°
                            </Text>
                            <Text style={styles.debugText}>
                              Difference:{" "}
                              {(
                                (activeChart.planets.moon.longitude -
                                  activeChart.planets.sun.longitude +
                                  360) %
                                360
                              ).toFixed(2)}
                              °
                            </Text>
                            <Text style={styles.debugText}>
                              Tithi Calculation:{" "}
                              {(
                                ((activeChart.planets.moon.longitude -
                                  activeChart.planets.sun.longitude +
                                  360) %
                                  360) /
                                12
                              ).toFixed(2)}
                            </Text>
                            {tithiPercentageRemaining !== null && (
                              <Text style={styles.debugText}>
                                Percentage Remaining:{" "}
                                {tithiPercentageRemaining.toFixed(2)}%
                              </Text>
                            )}
                          </View>
                        )}

                      {/* Additional Tithi Information */}
                      <View style={styles.tithiDetails}>
                        <View style={styles.tithiDetailRow}>
                          <Text style={styles.tithiDetailLabel}>
                            Planet Ruler:
                          </Text>
                          <Text style={styles.tithiDetailValue}>
                            {tithiInfo.planetRuler}
                          </Text>
                        </View>
                        <View style={styles.tithiDetailRow}>
                          <Text style={styles.tithiDetailLabel}>Division:</Text>
                          <Text style={styles.tithiDetailValue}>
                            {tithiInfo.division}
                          </Text>
                        </View>
                        <View style={styles.tithiDetailRow}>
                          <Text style={styles.tithiDetailLabel}>Deity:</Text>
                          <Text style={styles.tithiDetailValue}>
                            {tithiInfo.deity}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.description}>
                    No chart data available
                  </Text>
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
  tithiContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 20,
    borderRadius: 12,
    marginTop: 90,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
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
  tithiTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 10,
    textAlign: "center",
    textShadowColor: "rgba(255, 255, 255, 0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  tithiNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffd700",
    marginBottom: 8,
    textAlign: "center",
  },
  tithiPercentage: {
    fontSize: 18,
    fontWeight: "600",
    color: "#87ceeb",
    marginBottom: 8,
    textAlign: "center",
    fontStyle: "italic",
  },
  tithiNumbers: {
    fontSize: 16,
    color: "#b8b8b8",
    textAlign: "center",
    marginBottom: 8,
    fontStyle: "italic",
  },
  pakshaText: {
    fontSize: 16,
    color: "#8a8a8a",
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 15,
  },
  tithiDetails: {
    width: "100%",
    minWidth: 300,
    marginTop: 15,
    backgroundColor: "#1a1a2e",
    padding: 10,
    borderRadius: 8,
  },
  tithiDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a3e",
  },
  tithiDetailLabel: {
    fontSize: 14,
    color: "#b8b8b8",
    fontWeight: "600",
    flex: 1,
  },
  tithiDetailValue: {
    fontSize: 14,
    color: "#e6e6fa",
    textAlign: "right",
    flex: 1,
  },
  debugContainer: {
    backgroundColor: "#2a2a3e",
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#444",
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffd700",
    marginBottom: 8,
    textAlign: "center",
  },
  debugText: {
    fontSize: 12,
    color: "#b8b8b8",
    marginBottom: 4,
    fontFamily: "monospace",
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
});
