// ============================================================================
// IMPORTS
// ============================================================================
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { apiService, BirthData, BirthChart } from "../services/api";
import { useAstrology } from "../contexts/AstrologyContext";
import { sharedUI } from "../styles/sharedUI";
import { usePhysisFont, getPhysisSymbolStyle } from "../utils/physisFont";
import {
  getPlanetKeysFromNames,
  getPlanetSymbols,
  getZodiacKeysFromNames,
} from "../utils/physisSymbolMap";
import AstrologyChart from "../components/AstrologyChart";

// ============================================================================
// COMPONENT
// ============================================================================
export default function AstrologyScreen() {
  const {
    currentChart,
    loading: ephemerisLoading,
    refreshLoading,
    refreshError,
    refreshChart,
  } = useAstrology();
  const { fontLoaded } = usePhysisFont();

  const [birthData, setBirthData] = useState<BirthData>({
    year: 1990,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
    latitude: 40.7128, // New York default
    longitude: -74.006,
  });
  const [chart, setChart] = useState<BirthChart | null>(null);
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);

  // ===== HOOKS & STATE =====
  const calculateChart = async () => {
    setLoading(true);
    try {
      const response = await apiService.getBirthChart(birthData);
      if (response.success) {
        setChart(response.data);
        setShowInput(false);
      } else {
        Alert.alert("Error", "Failed to calculate birth chart");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to connect to astrology service");
      console.error("Chart calculation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetChart = () => {
    setChart(null);
    setShowInput(true);
  };

  // ===== UTILITY FUNCTIONS =====
  const formatDate = (date: {
    year: number;
    month: number;
    day: number;
    hour: number;
  }) => {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const hour = Math.floor(date.hour);
    const minute = Math.floor((date.hour - hour) * 60);
    return `${monthNames[date.month - 1]} ${date.day}, ${date.year} at ${hour
      .toString()
      .padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  };

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

  // ===== RENDER HELPERS =====
  const renderPlanet = (name: string, planet: any) => {
    if (planet.error) {
      return (
        <View key={name} style={styles.planetRow}>
          <Text style={styles.planetName}>
            {name.charAt(0).toUpperCase() + name.slice(1)}
          </Text>
          <Text style={styles.errorText}>Error: {planet.error}</Text>
        </View>
      );
    }

    return (
      <View key={name} style={styles.planetRow}>
        <Text style={styles.planetName}>
          {planet.symbol} {name} {name.charAt(0).toUpperCase() + name.slice(1)}
          {planet.isRetrograde && (
            <Text style={styles.retrogradeIndicator}> R</Text>
          )}
        </Text>
        <Text style={styles.planetPosition}>
          {planet.degreeFormatted} {planet.zodiacSignName}
        </Text>
      </View>
    );
  };

  // ===== LOADING STATES =====
  if (loading) {
    return (
      <View style={[styles.container, sharedUI.centered]}>
        <ActivityIndicator size="large" color="#e6e6fa" />
        <Text style={sharedUI.loadingText}>
          Calculating your birth chart...
        </Text>
      </View>
    );
  }

  // ===== BIRTH CHART DISPLAY =====
  if (chart && !showInput) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>⭐ Birth Chart</Text>
          <TouchableOpacity style={styles.resetButton} onPress={resetChart}>
            <Text style={styles.resetButtonText}>New Chart</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Birth Information</Text>
          <Text style={styles.infoText}>{formatDate(chart.inputDate)}</Text>
          {chart.location && (
            <Text style={styles.infoText}>
              Location: {chart.location.latitude.toFixed(4)}°N,{" "}
              {Math.abs(chart.location.longitude).toFixed(4)}°W
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ascendant & Midheaven</Text>
          <View style={styles.planetRow}>
            <Text style={styles.planetName}>🌅 Ascendant</Text>
            <Text style={styles.planetPosition}>
              {chart.houses.ascendantDegree} {chart.houses.ascendantSign}
            </Text>
          </View>
          <View style={styles.planetRow}>
            <Text style={styles.planetName}>🏔️ Midheaven (MC)</Text>
            <Text style={styles.planetPosition}>
              {chart.houses.mcDegree} {chart.houses.mcSign}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Planetary Positions</Text>
          {Object.entries(chart.planets).map(([name, planet]) =>
            renderPlanet(name, planet)
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>House System</Text>
          <Text style={styles.infoText}>
            {chart.houses.houseSystem === "P"
              ? "Placidus"
              : chart.houses.houseSystem}
          </Text>
        </View>
      </ScrollView>
    );
  }

  // ===== MAIN TEMPLATE =====
  return (
    <ScrollView style={styles.container}>
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
                  {getZodiacKeysFromNames()[currentChart.houses.ascendantSign]}
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
          {Object.entries(currentChart.planets).map(([planetName, planet]) => {
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
          })}
        </View>
      )}

      <View style={styles.birthChartSection}>
        <Text style={styles.sectionTitle}>⭐ Birth Chart Calculator</Text>
        <Text style={styles.description}>
          Enter your birth information to calculate your natal chart
        </Text>

        <View style={styles.inputSubsection}>
          <Text style={styles.subsectionTitle}>Birth Date & Time</Text>
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Year</Text>
              <TextInput
                style={styles.input}
                value={birthData.year.toString()}
                onChangeText={(text) =>
                  setBirthData({ ...birthData, year: parseInt(text) || 1990 })
                }
                keyboardType="numeric"
                placeholder="1990"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Month</Text>
              <TextInput
                style={styles.input}
                value={birthData.month.toString()}
                onChangeText={(text) =>
                  setBirthData({ ...birthData, month: parseInt(text) || 1 })
                }
                keyboardType="numeric"
                placeholder="1"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Day</Text>
              <TextInput
                style={styles.input}
                value={birthData.day.toString()}
                onChangeText={(text) =>
                  setBirthData({ ...birthData, day: parseInt(text) || 1 })
                }
                keyboardType="numeric"
                placeholder="1"
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Hour (24h)</Text>
              <TextInput
                style={styles.input}
                value={birthData.hour?.toString() || "12"}
                onChangeText={(text) =>
                  setBirthData({ ...birthData, hour: parseInt(text) || 12 })
                }
                keyboardType="numeric"
                placeholder="12"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Minute</Text>
              <TextInput
                style={styles.input}
                value={birthData.minute?.toString() || "0"}
                onChangeText={(text) =>
                  setBirthData({ ...birthData, minute: parseInt(text) || 0 })
                }
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>
        </View>

        <View style={styles.inputSubsection}>
          <Text style={styles.subsectionTitle}>Birth Location</Text>
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Latitude</Text>
              <TextInput
                style={styles.input}
                value={birthData.latitude?.toString() || "40.7128"}
                onChangeText={(text) =>
                  setBirthData({
                    ...birthData,
                    latitude: parseFloat(text) || 40.7128,
                  })
                }
                keyboardType="numeric"
                placeholder="40.7128"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Longitude</Text>
              <TextInput
                style={styles.input}
                value={birthData.longitude?.toString() || "-74.0060"}
                onChangeText={(text) =>
                  setBirthData({
                    ...birthData,
                    longitude: parseFloat(text) || -74.006,
                  })
                }
                keyboardType="numeric"
                placeholder="-74.0060"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.calculateButton}
          onPress={calculateChart}
        >
          <Text style={styles.calculateButtonText}>Calculate Birth Chart</Text>
        </TouchableOpacity>

        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            💡 Tip: Use decimal degrees for coordinates. For example, New York
            City is approximately 40.7128°N, 74.0060°W
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f23",
    padding: 20,
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
    backgroundColor: "#1a1a2e",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2a2a3e",
  },
  birthChartSection: {
    backgroundColor: "#1a1a2e",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2a2a3e",
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
  inputSubsection: {
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    color: "#e6e6fa",
    fontWeight: "600",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e6e6fa",
    marginBottom: 15,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: 5,
  },
  inputLabel: {
    fontSize: 14,
    color: "#8a8a8a",
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#0f0f23",
    borderWidth: 1,
    borderColor: "#2a2a3e",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#e6e6fa",
    fontSize: 16,
    textAlign: "center",
  },
  calculateButton: {
    backgroundColor: "#4a4a6e",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#6a6a8e",
  },
  calculateButtonText: {
    color: "#e6e6fa",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  planetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a3e",
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
    backgroundColor: "#1a1a2e",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2a2a3e",
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
    backgroundColor: "#1a1a2e",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a3e",
    marginTop: 10,
  },
});
