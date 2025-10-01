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
} from "react-native";
import * as Font from "expo-font";
import DynamicSvgImporter from "../components/DynamicSvgImporter";
import { useAstrology } from "../contexts/AstrologyContext";
import { sharedUI } from "../styles/sharedUI";
import { usePhysisFont, getPhysisSymbolStyle } from "../utils/physisFont";
import {
  getZodiacKeysFromNames,
  getPlanetKeysFromNames,
} from "../utils/physisSymbolMap";

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
export default function MoonScreen() {
  const { currentChart, loading, error } = useAstrology();
  const { fontLoaded } = usePhysisFont();

  // Calculate tithi if we have both Moon and Sun positions
  let currentTithi = null;
  let tithiPercentageRemaining = null;
  let tithiInfo: TithiData | null = null;
  let paksha = "";

  if (
    currentChart?.planets?.moon &&
    currentChart?.planets?.sun &&
    !currentChart.planets.moon.error &&
    !currentChart.planets.sun.error
  ) {
    const tithiResult = calculateTithi(
      currentChart.planets.moon.longitude,
      currentChart.planets.sun.longitude
    );
    currentTithi = tithiResult.tithi;
    tithiPercentageRemaining = tithiResult.percentageRemaining;
    tithiInfo = tithiData[currentTithi - 1];
    paksha = getPaksha(currentTithi);
  }

  // Use calculated tithi for moon phase, fallback to 15 if no tithi available
  const currentMoonPhase = currentTithi || 15;

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
            {(() => {
              const moonTithi = moonTithiMap.find(
                (tithi) => tithi.number === currentTithi
              );
              return moonTithi ? (
                <Text style={{ color: moonTithi.color.toLowerCase() }}>
                  {moonTithi.name}{" "}
                </Text>
              ) : null;
            })()}
            {currentChart.planets.moon?.zodiacSignName} Moon
          </Text>
          {currentTithi && (
            <Text style={styles.subtitle}>
              {currentTithi <= 15 ? "Waxing Moon" : "Waning Moon"}
            </Text>
          )}
          {/* Current Planetary Positions */}
          <View style={styles.positionsContainer}>
            <Text style={styles.positionsTitle}>Current Positions</Text>

            {currentChart.planets.sun && !currentChart.planets.sun.error && (
              <View style={styles.positionRow}>
                <Text style={styles.planetName}>
                  <Text style={getPhysisSymbolStyle(fontLoaded, "large")}>
                    {getPlanetKeysFromNames()["Sun"]}
                  </Text>{" "}
                  Sun
                </Text>
                <Text style={styles.planetPosition}>
                  {currentChart.planets.sun.degreeFormatted}{" "}
                  <Text style={getPhysisSymbolStyle(fontLoaded, "medium")}>
                    {
                      getZodiacKeysFromNames()[
                        currentChart.planets.sun.zodiacSignName
                      ]
                    }
                  </Text>
                </Text>
              </View>
            )}

            {currentChart.planets.moon && !currentChart.planets.moon.error && (
              <View style={styles.positionRow}>
                <Text style={styles.planetName}>
                  <Text style={getPhysisSymbolStyle(fontLoaded, "large")}>
                    {getPlanetKeysFromNames()["Moon"]}
                  </Text>{" "}
                  Moon
                </Text>
                <Text style={styles.planetPosition}>
                  {currentChart.planets.moon.degreeFormatted}{" "}
                  <Text style={getPhysisSymbolStyle(fontLoaded, "medium")}>
                    {
                      getZodiacKeysFromNames()[
                        currentChart.planets.moon.zodiacSignName
                      ]
                    }
                  </Text>
                </Text>
              </View>
            )}
          </View>

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
              {currentChart?.planets?.moon && currentChart?.planets?.sun && (
                <View style={styles.debugContainer}>
                  <Text style={styles.debugTitle}>Debug Info:</Text>
                  <Text style={styles.debugText}>
                    Moon Longitude:{" "}
                    {currentChart.planets.moon.longitude.toFixed(2)}°
                  </Text>
                  <Text style={styles.debugText}>
                    Sun Longitude:{" "}
                    {currentChart.planets.sun.longitude.toFixed(2)}°
                  </Text>
                  <Text style={styles.debugText}>
                    Difference:{" "}
                    {(
                      (currentChart.planets.moon.longitude -
                        currentChart.planets.sun.longitude +
                        360) %
                      360
                    ).toFixed(2)}
                    °
                  </Text>
                  <Text style={styles.debugText}>
                    Tithi Calculation:{" "}
                    {(
                      ((currentChart.planets.moon.longitude -
                        currentChart.planets.sun.longitude +
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
                  <Text style={styles.tithiDetailLabel}>Planet Ruler:</Text>
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
                  <Text style={styles.tithiDetailValue}>{tithiInfo.deity}</Text>
                </View>
              </View>
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
    </ScrollView>
  );
}

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
    paddingBottom: 40,
  },
  emoji: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#e6e6fa",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    color: "#b8b8b8",
    textAlign: "center",
    fontStyle: "italic",
  },
  description: {
    fontSize: 16,
    color: "#8a8a8a",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 8,
  },
  positionsContainer: {
    backgroundColor: "#0f0f23",
    padding: 24,
    borderRadius: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#2a2a3e",
    minWidth: 300,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  positionsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#e6e6fa",
    marginBottom: 20,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  positionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a3e",
    marginBottom: 4,
  },
  planetName: {
    fontSize: 16,
    color: "#e6e6fa",
    fontWeight: "600",
    flex: 1,
  },
  planetPosition: {
    fontSize: 16,
    color: "#b8b8b8",
    textAlign: "right",
    flex: 1,
    fontWeight: "500",
  },
  errorText: {
    fontSize: 16,
    color: "#ff6b6b",
    textAlign: "center",
    marginBottom: 10,
  },
  tithiContainer: {
    backgroundColor: "#0f0f23",
    padding: 20,
    borderRadius: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#2a2a3e",
    minWidth: 300,
    alignItems: "center",
  },
  tithiTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e6e6fa",
    marginBottom: 10,
    textAlign: "center",
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
});
