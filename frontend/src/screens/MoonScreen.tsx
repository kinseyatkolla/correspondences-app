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
import {
  getPlanetSymbols,
  getZodiacSymbols,
  getPlanetNames,
  getZodiacNames,
  getZodiacKeysFromNames,
  getElementSymbols,
  getElementNames,
  getChartPointSymbols,
  getChartPointNames,
  getPlanetKeysFromNames,
} from "../utils/physisSymbolMap";

// Helper function to get zodiac symbol from zodiac sign name
const getZodiacSymbolFromName = (zodiacName: string): string => {
  const zodiacKeysFromNames = getZodiacKeysFromNames();
  const zodiacSymbols = getZodiacSymbols();

  // Get the key for the given zodiac name
  const zodiacKey = zodiacKeysFromNames[zodiacName];

  return zodiacKey ? zodiacSymbols[zodiacKey] : zodiacName;
};

// Tithi calculation function
const calculateTithi = (
  moonLongitude: number,
  sunLongitude: number
): number => {
  // Calculate the difference between Moon and Sun longitude
  const longitudeDifference = moonLongitude - sunLongitude;

  // Calculate tithi: (Moon - Sun) / 12
  let tithi = longitudeDifference / 12;

  // Use Math.floor to get the current tithi (round down)
  let finalTithi = Math.floor(tithi);

  // Normalize to 1-30 range
  finalTithi = ((finalTithi % 30) + 30) % 30;
  if (finalTithi === 0) finalTithi = 30;

  // Ensure it's between 1 and 30
  const normalizedTithi = ((finalTithi - 1) % 30) + 1;

  return normalizedTithi;
};

// Complete tithi data with all astrological information
interface TithiData {
  numbers: [number, number];
  name: string;
  planetRuler: string;
  division: string;
  deity: string;
}

const tithiData: TithiData[] = [
  // s1 is 1
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

// Paksha (fortnight) determination
const getPaksha = (tithi: number): string => {
  return tithi <= 15 ? "Shukla Paksha (Waxing)" : "Krishna Paksha (Waning)";
};

export default function MoonScreen() {
  const { currentChart, loading, error } = useAstrology();
  const [fontLoaded, setFontLoaded] = useState(false);

  // Load the PhysisV2 font
  useEffect(() => {
    const loadFont = async () => {
      try {
        await Font.loadAsync({
          Physis: require("../../assets/fonts/Physis.ttf"),
        });
        setFontLoaded(true);
      } catch (error) {
        console.log("Font loading error:", error);
        setFontLoaded(true); // Continue even if font fails to load
      }
    };
    loadFont();
  }, []);

  // Get font family based on loading state
  const getFontFamily = () => (fontLoaded ? "Physis" : "System");

  // Get physis symbol style with fallback
  const getPhysisSymbolStyle = () => [
    styles.physisSymbol,
    { fontFamily: getFontFamily() },
  ];

  // Calculate tithi if we have both Moon and Sun positions
  let currentTithi = null;
  let tithiInfo: TithiData | null = null;
  let paksha = "";

  if (
    currentChart?.planets?.moon &&
    currentChart?.planets?.sun &&
    !currentChart.planets.moon.error &&
    !currentChart.planets.sun.error
  ) {
    currentTithi = calculateTithi(
      currentChart.planets.moon.longitude,
      currentChart.planets.sun.longitude
    );
    tithiInfo = tithiData[currentTithi - 1];
    paksha = getPaksha(currentTithi);
  }

  // Use calculated tithi for moon phase, fallback to 15 if no tithi available
  const currentMoonPhase = currentTithi || 15;

  if (loading || !fontLoaded) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#e6e6fa" />
        <Text style={styles.loadingText}>
          {loading ? "Loading current positions..." : "Loading fonts..."}
        </Text>
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
          {/* Current Planetary Positions */}
          <View style={styles.positionsContainer}>
            <Text style={styles.positionsTitle}>Current Positions</Text>

            {currentChart.planets.sun && !currentChart.planets.sun.error && (
              <View style={styles.positionRow}>
                <Text style={styles.planetPosition}>
                  <Text style={getPhysisSymbolStyle()}>
                    {getPlanetKeysFromNames()["Sun"]}
                  </Text>{" "}
                  Sun
                </Text>
                <Text style={styles.planetPosition}>
                  {currentChart.planets.sun.degreeFormatted}{" "}
                  <Text style={getPhysisSymbolStyle()}>
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
                <Text style={styles.planetPosition}>
                  <Text style={getPhysisSymbolStyle()}>
                    {getPlanetKeysFromNames()["Moon"]}
                  </Text>{" "}
                  Moon
                </Text>
                <Text style={styles.planetPosition}>
                  {currentChart.planets.moon.degreeFormatted}{" "}
                  <Text style={getPhysisSymbolStyle()}>
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
              <Text style={styles.tithiNumbers}>
                Numbers: {tithiInfo.numbers[0]}, {tithiInfo.numbers[1]}
              </Text>
              <Text style={styles.pakshaText}>{paksha}</Text>

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
    marginVertical: 10,
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
  fontTest: {
    fontSize: 24,
    color: "#b8b8b8",
    minWidth: 30,
    textAlign: "center",
  },
  symbolMapContainer: {
    backgroundColor: "#0f0f23",
    padding: 15,
    borderRadius: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#2a2a3e",
    minWidth: 300,
    maxHeight: 300,
  },
  symbolMapScroll: {
    maxHeight: 250,
  },
  symbolMapTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffd700",
    marginBottom: 15,
    textAlign: "center",
  },
  symbolMapGroup: {
    marginBottom: 15,
  },
  symbolMapGroupTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#e6e6fa",
    marginBottom: 8,
    textAlign: "center",
  },
  symbolMapRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a3e",
  },
  symbolMapLabel: {
    fontSize: 12,
    color: "#b8b8b8",
    flex: 1,
    marginLeft: 8,
  },
  physisSymbol: {
    fontFamily: "Physis",
    fontSize: 36,
  },
});
