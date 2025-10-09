import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  PlanetaryHoursData,
  formatTime,
  getPlanetDisplay,
} from "../utils/planetaryHoursUtils";
import { usePhysisFont, getPhysisSymbolStyle } from "../utils/physisFont";
import { getPlanetKeysFromNames } from "../utils/physisSymbolMap";

interface PlanetaryHoursDisplayProps {
  planetaryHoursData: PlanetaryHoursData | null;
  location?: { latitude: number; longitude: number };
  loading?: boolean; // Loading state for API calls
  backgroundTimingInfo?: {
    sunrise: string;
    sunset: string;
    dawnWindow: string;
    duskWindow: string;
  } | null;
}

export default function PlanetaryHoursDisplay({
  planetaryHoursData,
  location,
  loading = false,
  backgroundTimingInfo,
}: PlanetaryHoursDisplayProps) {
  const { fontLoaded } = usePhysisFont();
  const planetKeys = getPlanetKeysFromNames();

  if (loading || !planetaryHoursData) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🕐 Planetary Hours</Text>
        <Text style={styles.loadingText}>
          {loading
            ? "Fetching sunrise/sunset data..."
            : "Loading planetary hours..."}
        </Text>
      </View>
    );
  }

  const { sunrise, sunset, dayHours, nightHours, currentHour } =
    planetaryHoursData;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🕐 Planetary Hours</Text>

      {/* Debug Information */}
      <View style={styles.debugSection}>
        <Text style={styles.debugTitle}>Debug Info</Text>
        <Text style={styles.debugText}>Sunrise: {formatTime(sunrise)}</Text>
        <Text style={styles.debugText}>Sunset: {formatTime(sunset)}</Text>
        <Text style={styles.debugText}>
          Day Length:{" "}
          {Math.round(
            (sunset.getTime() - sunrise.getTime()) / (1000 * 60 * 60 * 60 * 100)
          ) / 100}
          h
        </Text>
        <Text style={styles.debugText}>
          Night Length:{" "}
          {Math.round(
            (24 * 60 * 60 * 1000 - (sunset.getTime() - sunrise.getTime())) /
              (1000 * 60 * 60 * 60 * 100)
          ) / 100}
          h
        </Text>
        {location && (
          <Text style={styles.debugText}>
            Location: {location.latitude.toFixed(4)}°,{" "}
            {location.longitude.toFixed(4)}°
          </Text>
        )}
        {backgroundTimingInfo && (
          <>
            <Text style={styles.debugText}>
              🌅 Dawn Window: {backgroundTimingInfo.dawnWindow}
            </Text>
            <Text style={styles.debugText}>
              🌇 Dusk Window: {backgroundTimingInfo.duskWindow}
            </Text>
          </>
        )}
      </View>

      {/* Current Hour */}
      {currentHour && (
        <View style={styles.currentHourSection}>
          <Text style={styles.currentHourTitle}>Current Planetary Hour</Text>
          <View style={styles.currentHourRow}>
            <Text style={styles.planetSymbol}>
              <Text style={getPhysisSymbolStyle(fontLoaded, "medium")}>
                {planetKeys[currentHour.planet] || "?"}
              </Text>
            </Text>
            <Text style={styles.currentHourText}>
              {currentHour.planet} Hour (
              {currentHour.isDayHour ? "Day" : "Night"})
            </Text>
          </View>
          <Text style={styles.timeRange}>
            {formatTime(currentHour.startTime)} -{" "}
            {formatTime(currentHour.endTime)}
          </Text>
        </View>
      )}

      {/* Day Hours */}
      <View style={styles.hoursSection}>
        <Text style={styles.sectionTitle}>Day Hours (Sunrise to Sunset)</Text>
        {dayHours.map((hour, index) => (
          <View
            key={`day-${index}`}
            style={[
              styles.hourRow,
              currentHour?.hour === hour.hour &&
                currentHour?.isDayHour &&
                styles.currentHourRow,
            ]}
          >
            <Text style={styles.hourNumber}>{hour.hour}</Text>
            <Text style={styles.planetSymbol}>
              <Text style={getPhysisSymbolStyle(fontLoaded, "medium")}>
                {planetKeys[hour.planet] || "?"}
              </Text>
            </Text>
            <Text style={styles.planetName}>{hour.planet}</Text>
            <Text style={styles.timeRange}>
              {formatTime(hour.startTime)} - {formatTime(hour.endTime)}
            </Text>
          </View>
        ))}
      </View>

      {/* Night Hours */}
      <View style={styles.hoursSection}>
        <Text style={styles.sectionTitle}>Night Hours (Sunset to Sunrise)</Text>
        {nightHours.map((hour, index) => (
          <View
            key={`night-${index}`}
            style={[
              styles.hourRow,
              currentHour?.hour === hour.hour &&
                !currentHour?.isDayHour &&
                styles.currentHourRow,
            ]}
          >
            <Text style={styles.hourNumber}>{hour.hour}</Text>
            <Text style={styles.planetSymbol}>
              <Text style={getPhysisSymbolStyle(fontLoaded, "medium")}>
                {planetKeys[hour.planet] || "?"}
              </Text>
            </Text>
            <Text style={styles.planetName}>{hour.planet}</Text>
            <Text style={styles.timeRange}>
              {formatTime(hour.startTime)} - {formatTime(hour.endTime)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    marginBottom: 20,
    backgroundColor: "rgba(26, 26, 46, 0.8)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#444",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e6e6fa",
    marginBottom: 15,
    textAlign: "center",
  },
  debugSection: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#555",
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffd700",
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: "#ccc",
    marginBottom: 4,
    fontFamily: "monospace",
  },
  currentHourSection: {
    backgroundColor: "rgba(111, 119, 130, 0.3)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#6f7782",
  },
  currentHourTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#e6e6fa",
    marginBottom: 8,
    textAlign: "center",
  },
  currentHourRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  currentHourText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e6e6fa",
    marginLeft: 10,
  },
  timeRange: {
    fontSize: 12,
    color: "#8a8a8a",
    textAlign: "center",
  },
  hoursSection: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#e6e6fa",
    marginBottom: 10,
    textAlign: "center",
  },
  hourRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  hourNumber: {
    fontSize: 12,
    color: "#8a8a8a",
    width: 25,
    textAlign: "center",
  },
  planetSymbol: {
    fontSize: 16,
    color: "#e6e6fa",
    width: 30,
    textAlign: "center",
  },
  planetName: {
    fontSize: 12,
    color: "#e6e6fa",
    flex: 1,
    marginLeft: 10,
  },
  loadingText: {
    fontSize: 14,
    color: "#8a8a8a",
    textAlign: "center",
    fontStyle: "italic",
  },
});
