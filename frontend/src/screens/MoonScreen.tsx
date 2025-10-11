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
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import * as Font from "expo-font";
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
export default function MoonScreen({ navigation }: any) {
  const { currentChart, loading, error } = useAstrology();
  const { fontLoaded } = usePhysisFont();

  // Debug flag to control aspect debugging display
  const DEBUG_ASPECTS = true;

  // State for the currently displayed date
  const [displayDate, setDisplayDate] = useState(new Date());

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
              <MoonSvgImporter
                svgName={currentMoonPhase.toString()}
                width={240}
                height={240}
                style={styles.moonPhaseSvg}
              />

              {activeChart ? (
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

                  {/* Moon degree and zodiac sign */}
                  {currentTithi && (
                    <Text style={styles.subtitle}>
                      {currentTithi <= 15 ? "Waxing Moon" : "Waning Moon"}
                    </Text>
                  )}
                  {activeChart.planets.moon &&
                    !activeChart.planets.moon.error && (
                      <Text style={styles.subtitle}>
                        {activeChart.planets.moon.degreeFormatted}{" "}
                        <Text style={getPhysisSymbolStyle(fontLoaded, "large")}>
                          {
                            getZodiacKeysFromNames()[
                              activeChart.planets.moon.zodiacSignName
                            ]
                          }
                        </Text>
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
                                      <Text style={styles.aspectLabelText}>
                                        {/* Display deduplicated aspects */}
                                        {uniqueAspects.map(
                                          (aspectInfo, index) => (
                                            <Text key={index}>
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
                                                planetName.slice(1)}{" "}
                                              <Text
                                                style={[
                                                  getZodiacColorStyle(
                                                    aspectInfo.otherPlanetSign
                                                  ),
                                                ]}
                                              >
                                                {aspectInfo.otherPlanetSign}
                                              </Text>{" "}
                                              <Text
                                                style={[
                                                  getPhysisSymbolStyle(
                                                    fontLoaded,
                                                    "large"
                                                  ),
                                                  getZodiacColorStyle(
                                                    aspectInfo.otherPlanetSign
                                                  ),
                                                ]}
                                              >
                                                {aspectInfo.zodiacSymbol}
                                              </Text>
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
                                              {index <
                                                uniqueAspects.length - 1 &&
                                                ", "}
                                            </Text>
                                          )
                                        )}
                                      </Text>
                                    </View>
                                  );
                                })}
                            </View>
                          );
                        })()}
                      </View>
                    )}
                </>
              ) : (
                <>
                  <Text style={styles.title}>Capricorn Moon</Text>
                  <Text style={styles.description}>Waxing Gibbous</Text>
                </>
              )}

              <Text style={styles.description}>Moon month calendar</Text>
              <Text style={styles.description}>Moon in literature</Text>
              <Text style={styles.description}>Moon in pop culture</Text>
              <Text style={styles.description}>Moon in myth</Text>
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
  moonPhaseSvg: {
    marginTop: 115,
    marginBottom: 20,
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
    alignItems: "flex-start",
  },
  aspectLabelText: {
    fontSize: 14,
    color: "#111111",
    fontWeight: "600",
    flex: 1,
    flexGrow: 1,
  },
  orbLabelText: {
    fontSize: 12,
    color: "#666",
    flex: 1,
    fontFamily: "monospace",
    textAlign: "left",
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
});
