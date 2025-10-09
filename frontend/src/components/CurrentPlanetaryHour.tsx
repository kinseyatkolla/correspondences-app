import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { PlanetaryHoursData } from "../utils/planetaryHoursUtils";
import { usePhysisFont, getPhysisSymbolStyle } from "../utils/physisFont";
import { getPlanetKeysFromNames } from "../utils/physisSymbolMap";
import { formatTime } from "../utils/planetaryHoursUtils";

interface CurrentPlanetaryHourProps {
  planetaryHoursData: PlanetaryHoursData | null;
  onPress: () => void;
  loading?: boolean;
}

export default function CurrentPlanetaryHour({
  planetaryHoursData,
  onPress,
  loading = false,
}: CurrentPlanetaryHourProps) {
  const { fontLoaded } = usePhysisFont();
  const planetKeys = getPlanetKeysFromNames();

  if (loading) {
    return (
      <TouchableOpacity style={styles.container} onPress={onPress}>
        <Text style={styles.title}>🕐 Planetary Hours</Text>
        <Text style={styles.loadingText}>Loading...</Text>
      </TouchableOpacity>
    );
  }

  if (!planetaryHoursData?.currentHour) {
    return (
      <TouchableOpacity style={styles.container} onPress={onPress}>
        <Text style={styles.title}>🕐 Planetary Hours</Text>
        <Text style={styles.errorText}>No data available</Text>
      </TouchableOpacity>
    );
  }

  const { currentHour } = planetaryHoursData;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Text style={styles.title}>🕐 Current Planetary Hour</Text>

      <View style={styles.hourInfo}>
        <Text style={styles.planetSymbol}>
          <Text style={getPhysisSymbolStyle(fontLoaded, "large")}>
            {planetKeys[currentHour.planet] || "?"}
          </Text>
        </Text>

        <View style={styles.hourDetails}>
          <Text style={styles.planetName}>{currentHour.planet} Hour</Text>
          <Text style={styles.hourType}>
            {currentHour.isDayHour ? "Day" : "Night"}
          </Text>
          <Text style={styles.timeRange}>
            {formatTime(currentHour.startTime)} -{" "}
            {formatTime(currentHour.endTime)}
          </Text>
        </View>
      </View>

      <Text style={styles.tapHint}>Tap for full planetary hours →</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(26, 26, 46, 0.8)",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#444",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#e6e6fa",
    marginBottom: 10,
    textAlign: "center",
  },
  hourInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  planetSymbol: {
    fontSize: 24,
    color: "#e6e6fa",
    marginRight: 15,
  },
  hourDetails: {
    flex: 1,
  },
  planetName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e6e6fa",
    marginBottom: 2,
  },
  hourType: {
    fontSize: 12,
    color: "#8a8a8a",
    marginBottom: 2,
  },
  timeRange: {
    fontSize: 12,
    color: "#6f7782",
  },
  loadingText: {
    fontSize: 12,
    color: "#8a8a8a",
    textAlign: "center",
    fontStyle: "italic",
  },
  errorText: {
    fontSize: 12,
    color: "#ff6b6b",
    textAlign: "center",
  },
  tapHint: {
    fontSize: 10,
    color: "#555",
    textAlign: "center",
    marginTop: 5,
    fontStyle: "italic",
  },
});
