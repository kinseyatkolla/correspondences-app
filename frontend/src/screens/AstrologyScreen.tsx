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
import {
  getPlanetKeysFromNames,
  getPlanetSymbols,
} from "../utils/physisSymbolMap";

export default function AstrologyScreen() {
  const { currentChart, loading: ephemerisLoading } = useAstrology();

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
        </Text>
        <Text style={styles.planetPosition}>
          {planet.degreeFormatted} {planet.zodiacSignName}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#e6e6fa" />
        <Text style={styles.loadingText}>Calculating your birth chart...</Text>
      </View>
    );
  }

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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⭐ Astrology</Text>
        <Text style={styles.subtitle}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </View>

      {/* Current Planetary Positions */}
      {currentChart && !ephemerisLoading && (
        <View style={styles.currentPositionsSection}>
          <Text style={styles.sectionTitle}>
            🌙 Current Planetary Positions
          </Text>
          {Object.entries(currentChart.planets).map(([planetName, planet]) => {
            const planetKeys = getPlanetKeysFromNames();
            const planetSymbols = getPlanetSymbols();
            const capitalizedName =
              planetName.charAt(0).toUpperCase() + planetName.slice(1);
            const physisKey = planetKeys[capitalizedName];
            const physisSymbol = physisKey
              ? planetSymbols[physisKey]
              : planet.symbol;

            return (
              <View key={planetName} style={styles.planetRow}>
                <Text style={styles.planetName}>
                  <Text style={styles.physisText}>{physisSymbol}</Text>{" "}
                  {capitalizedName}
                </Text>
                <Text style={styles.planetPosition}>
                  {planet.degreeFormatted} {planet.zodiacSignName}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.inputSection}>
        <Text style={styles.sectionTitle}>⭐ Birth Chart Calculator</Text>
        <Text style={styles.description}>
          Enter your birth information to calculate your natal chart
        </Text>

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

      <View style={styles.inputSection}>
        <Text style={styles.sectionTitle}>Birth Location</Text>

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

      <TouchableOpacity style={styles.calculateButton} onPress={calculateChart}>
        <Text style={styles.calculateButtonText}>Calculate Birth Chart</Text>
      </TouchableOpacity>

      <View style={styles.infoSection}>
        <Text style={styles.infoText}>
          💡 Tip: Use decimal degrees for coordinates. For example, New York
          City is approximately 40.7128°N, 74.0060°W
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f23",
    padding: 20,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
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
  loadingText: {
    fontSize: 16,
    color: "#e6e6fa",
    marginTop: 20,
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
  inputSection: {
    backgroundColor: "#1a1a2e",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2a2a3e",
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
  physisText: {
    fontFamily: "Physis",
    fontSize: 18,
  },
  planetPosition: {
    fontSize: 14,
    color: "#8a8a8a",
    textAlign: "right",
    flex: 1,
  },
  errorText: {
    fontSize: 14,
    color: "#ff6b6b",
    textAlign: "right",
    flex: 1,
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
  infoSection: {
    backgroundColor: "#1a1a2e",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a3e",
    marginTop: 10,
  },
});
