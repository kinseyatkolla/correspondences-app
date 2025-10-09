// ============================================================================
// IMPORTS
// ============================================================================
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import { useAstrology } from "../contexts/AstrologyContext";
import { sharedUI } from "../styles/sharedUI";
import { usePhysisFont, getPhysisSymbolStyle } from "../utils/physisFont";
import {
  getPlanetKeysFromNames,
  getZodiacKeysFromNames,
} from "../utils/physisSymbolMap";
import AstrologyChart from "../components/AstrologyChart";
import { getCurrentTimeOfDay } from "../utils/timeOfDayUtils";

// ============================================================================
// COMPONENT
// ============================================================================
export default function AstrologyScreen({ navigation }: any) {
  const {
    currentChart,
    loading: ephemerisLoading,
    refreshLoading,
    refreshError,
    refreshChart,
  } = useAstrology();
  const { fontLoaded } = usePhysisFont();

  // ===== DYNAMIC BACKGROUND CALCULATION =====
  const backgroundImage = useMemo(() => {
    const timeOfDay = getCurrentTimeOfDay();

    // Import all background images
    const backgroundImages = {
      dawn: require("../../assets/images/dawn-gradient.png"),
      day: require("../../assets/images/day-gradient.png"),
      dusk: require("../../assets/images/dusk-gradient.png"),
      night: require("../../assets/images/night-gradient.png"),
    };

    return backgroundImages[timeOfDay];
  }, []);

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
    <ImageBackground
      source={backgroundImage}
      style={styles.container}
      resizeMode="cover"
    >
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Chart Display */}
        {currentChart && !ephemerisLoading && (
          <View style={styles.chartContainer}>
            <AstrologyChart
              planets={currentChart.planets}
              houses={currentChart.houses}
              loading={refreshLoading}
              error={refreshError}
            />
            {currentChart.currentTime && (
              <Text style={styles.lastUpdatedText}>
                Last updated:{" "}
                {
                  formatChartTimestamp(currentChart.currentTime.timestamp)
                    .dateString
                }{" "}
                at{" "}
                {
                  formatChartTimestamp(currentChart.currentTime.timestamp)
                    .timeString
                }
              </Text>
            )}
            <Text style={styles.movedDateTimeText}>
              {currentChart && currentChart.currentTime
                ? (() => {
                    const { dateString, timeString } = formatChartTimestamp(
                      currentChart.currentTime.timestamp
                    );
                    return `${dateString} at ${timeString}`;
                  })()
                : new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }) +
                  " at " +
                  new Date().toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
            </Text>
          </View>
        )}

        {/* Current Planetary Positions */}
        {currentChart && !ephemerisLoading && (
          <View style={styles.currentPositionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                🌙 Current Planetary Positions
              </Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={refreshChart}
              >
                <Text style={styles.refreshButtonText}>🔄</Text>
              </TouchableOpacity>
            </View>
            {/* Ascendant */}
            {currentChart.houses && (
              <View style={styles.planetRow}>
                <Text style={styles.zodiacSymbol}>
                  {/* ascendant symbol */}
                  <Text style={getPhysisSymbolStyle(fontLoaded, "medium")}>
                    !
                  </Text>{" "}
                  {/* zodiac symbol */}
                  <Text style={getPhysisSymbolStyle(fontLoaded, "medium")}>
                    {
                      getZodiacKeysFromNames()[
                        currentChart.houses.ascendantSign
                      ]
                    }
                  </Text>{" "}
                </Text>
                <Text style={styles.planetPosition}>
                  {currentChart.houses.ascendantSign} Ascendant
                </Text>
                <Text style={styles.planetPosition}>
                  {currentChart.houses.ascendantDegree}
                </Text>
              </View>
            )}
            {Object.entries(currentChart.planets).map(
              ([planetName, planet]) => {
                // Temporary test: force Pluto to be retrograde for testing
                const testPlanet =
                  planetName === "pluto"
                    ? { ...planet, isRetrograde: true }
                    : planet;
                const planetKeys = getPlanetKeysFromNames();
                const zodiacKeys = getZodiacKeysFromNames();
                const capitalizedName =
                  planetName.charAt(0).toUpperCase() + planetName.slice(1);
                // Special handling for north node
                const displayName =
                  planetName === "northNode" ? "N. Node" : capitalizedName;
                const physisKey =
                  planetKeys[
                    planetName === "northNode" ? "NorthNode" : capitalizedName
                  ];
                const physisSymbol = physisKey;
                const zodiacKey = zodiacKeys[testPlanet.zodiacSignName];
                const physisZodiacSymbol = zodiacKey;

                return (
                  <View key={planetName} style={styles.planetRow}>
                    <Text style={styles.zodiacSymbol}>
                      {/* planet symbol  */}
                      <Text style={getPhysisSymbolStyle(fontLoaded, "medium")}>
                        {physisSymbol}
                      </Text>{" "}
                      {/* zodiac symbol */}
                      <Text style={getPhysisSymbolStyle(fontLoaded, "medium")}>
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

      {/* Birth Chart Calculator Navigation Bar - Moved to bottom */}
      <TouchableOpacity
        style={styles.calculatorNavBar}
        onPress={() => navigation.navigate("BirthChartCalculator")}
        activeOpacity={0.8}
      >
        <Text style={styles.calculatorNavText}>BIRTH CHART CALCULATOR</Text>
        <Text style={styles.calculatorNavArrow}>›</Text>
      </TouchableOpacity>
    </ImageBackground>
  );
}

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
    paddingBottom: 40, // Account for calculator nav bar
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
    color: "#8a8a8a",
    textAlign: "center",
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: "#8a8a8a",
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
    marginTop: 20,
    marginBottom: 20,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: "#8a8a8a",
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  movedDateTimeText: {
    fontSize: 16,
    color: "#e6e6fa",
    textAlign: "center",
    marginTop: 16,
    fontWeight: "600",
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
    color: "#8a8a8a",
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
    color: "#8a8a8a",
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
  refreshButton: {
    backgroundColor: "#4a4a6e",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#6a6a8e",
  },
  refreshButtonText: {
    color: "#e6e6fa",
    fontSize: 16,
    fontWeight: "bold",
  },
  infoSection: {
    padding: 15,
    marginTop: 10,
  },
  // Calculator Navigation Bar Styles
  calculatorNavBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: "#000000",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 9999,
  },
  calculatorNavText: {
    color: "#e6e6fa",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 4,
  },
  calculatorNavArrow: {
    color: "#e6e6fa",
    fontSize: 18,
    fontWeight: "bold",
  },
});
