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
        <Text style={styles.planetSymbol}>
          <Text style={getPhysisSymbolStyle(fontLoaded, "large")}>?</Text>
        </Text>
      </TouchableOpacity>
    );
  }

  if (!planetaryHoursData?.currentHour) {
    return null; // Hide the component entirely when no data
  }

  const { currentHour } = planetaryHoursData;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Text style={styles.planetSymbol}>
        <Text style={getPhysisSymbolStyle(fontLoaded, "large")}>
          {planetKeys[currentHour.planet] || "?"}
        </Text>
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    alignSelf: "flex-end", // This positions it to the right
    marginBottom: 20,
  },
  planetSymbol: {
    fontSize: 28,
    color: "#e6e6fa",
    textAlign: "center",
  },
});
