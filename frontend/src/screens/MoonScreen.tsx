import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import DynamicSvgImporter from "../components/DynamicSvgImporter";
import { useAstrology } from "../contexts/AstrologyContext";

export default function MoonScreen() {
  const { currentChart, loading, error } = useAstrology();
  // For now, using phase 13 as an example
  // In a real app, you'd calculate this based on current date/time
  const currentMoonPhase = 10;

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#e6e6fa" />
        <Text style={styles.loadingText}>Loading current positions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={styles.description}>Using default moon phase</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <DynamicSvgImporter
        svgName={currentMoonPhase.toString()}
        width={140}
        height={140}
        style={styles.emoji}
      />

      {currentChart ? (
        <>
          <Text style={styles.title}>
            {currentChart.planets.moon?.zodiacSignName || "Moon"} Moon
          </Text>
          <Text style={styles.description}>Waxing Gibbous</Text>

          {/* Current Planetary Positions */}
          <View style={styles.positionsContainer}>
            <Text style={styles.positionsTitle}>Current Positions</Text>

            {currentChart.planets.sun && !currentChart.planets.sun.error && (
              <View style={styles.positionRow}>
                <Text style={styles.planetName}>
                  {currentChart.planets.sun.symbol} Sun
                </Text>
                <Text style={styles.planetPosition}>
                  {currentChart.planets.sun.degreeFormatted}{" "}
                  {currentChart.planets.sun.zodiacSignName}
                </Text>
              </View>
            )}

            {currentChart.planets.moon && !currentChart.planets.moon.error && (
              <View style={styles.positionRow}>
                <Text style={styles.planetName}>
                  {currentChart.planets.moon.symbol} Moon
                </Text>
                <Text style={styles.planetPosition}>
                  {currentChart.planets.moon.degreeFormatted}{" "}
                  {currentChart.planets.moon.zodiacSignName}
                </Text>
              </View>
            )}
          </View>
        </>
      ) : (
        <>
          <Text style={styles.title}>Capricorn Moon</Text>
          <Text style={styles.description}>Waxing Gibbous</Text>
        </>
      )}

      <Text style={styles.description}>Tithi</Text>
      <Text style={styles.description}>nakshatra</Text>
      <Text style={styles.description}>Moon phase</Text>
      <Text style={styles.description}>moon sign</Text>
      <Text style={styles.description}>moon month calendar?</Text>
      <Text style={styles.description}>Moon in literature</Text>
      <Text style={styles.description}>moon in pop culture</Text>
      <Text style={styles.description}>moon in myth</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  emoji: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#e6e6fa",
  },
  description: {
    fontSize: 16,
    color: "#8a8a8a",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 16,
    color: "#e6e6fa",
    marginTop: 20,
  },
  positionsContainer: {
    backgroundColor: "#0f0f23",
    padding: 20,
    borderRadius: 12,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: "#2a2a3e",
    minWidth: 300,
  },
  positionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e6e6fa",
    marginBottom: 15,
    textAlign: "center",
  },
  positionRow: {
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
  planetPosition: {
    fontSize: 14,
    color: "#8a8a8a",
    textAlign: "right",
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    color: "#ff6b6b",
    textAlign: "center",
    marginBottom: 10,
  },
});
