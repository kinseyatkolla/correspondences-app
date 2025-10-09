import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useAstrology } from "../contexts/AstrologyContext";
import { sharedUI } from "../styles/sharedUI";
import { usePhysisFont, getPhysisSymbolStyle } from "../utils/physisFont";
import { getPlanetKeysFromNames } from "../utils/physisSymbolMap";
import {
  calculatePlanetaryHours,
  PlanetaryHoursData,
  formatTime,
} from "../utils/planetaryHoursUtils";

interface PlanetaryHoursScreenProps {
  navigation: any;
}

export default function PlanetaryHoursScreen({
  navigation,
}: PlanetaryHoursScreenProps) {
  const { currentChart } = useAstrology();
  const { fontLoaded } = usePhysisFont();
  const planetKeys = getPlanetKeysFromNames();

  // State for planetary hours data
  const [planetaryHoursData, setPlanetaryHoursData] =
    useState<PlanetaryHoursData | null>(null);
  const [loading, setLoading] = useState(false);

  // Function to calculate planetary hours for current date and location
  const calculatePlanetaryHoursForDate = async (date: Date) => {
    setLoading(true);
    try {
      // Use current chart location or default location
      const location = currentChart?.location || {
        latitude: 40.7128,
        longitude: -74.006,
      };

      const planetaryData = await calculatePlanetaryHours(
        date,
        location.latitude,
        location.longitude
      );

      setPlanetaryHoursData(planetaryData);
    } catch (error) {
      console.error("Error calculating planetary hours:", error);
      setPlanetaryHoursData(null);
    } finally {
      setLoading(false);
    }
  };

  // Calculate planetary hours on mount and when current chart changes
  useEffect(() => {
    calculatePlanetaryHoursForDate(new Date());
  }, [currentChart]);

  // Get background timing info
  const getBackgroundTimingInfo = () => {
    if (!planetaryHoursData?.sunrise || !planetaryHoursData?.sunset) {
      return null;
    }

    const sunrise = planetaryHoursData.sunrise;
    const sunset = planetaryHoursData.sunset;

    const dawnStart = new Date(sunrise.getTime() - 30 * 60 * 1000);
    const dawnEnd = new Date(sunrise.getTime() + 30 * 60 * 1000);
    const duskStart = new Date(sunset.getTime() - 30 * 60 * 1000);
    const duskEnd = new Date(sunset.getTime() + 30 * 60 * 1000);

    return {
      sunrise: sunrise.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
      sunset: sunset.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
      dawnWindow: `${dawnStart.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })} - ${dawnEnd.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`,
      duskWindow: `${duskStart.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })} - ${duskEnd.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`,
    };
  };

  const backgroundTimingInfo = getBackgroundTimingInfo();

  // Loading state
  if (loading) {
    return (
      <View style={[sharedUI.loadingContainer, { backgroundColor: "#0e2515" }]}>
        <ActivityIndicator size="large" color="#b19cd9" />
        <Text style={sharedUI.loadingText}>Loading planetary hours...</Text>
      </View>
    );
  }

  // ===== MAIN TEMPLATE =====
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={sharedUI.pageTitle}>🕐 Planetary Hours</Text>
        <Text style={sharedUI.pageSubtitle}>
          Discover the planetary rulers of time
        </Text>

        {/* Current Hour */}
        {planetaryHoursData?.currentHour && (
          <View style={styles.cardContainer}>
            <Text style={styles.cardTitle}>Current Planetary Hour</Text>
            <View style={styles.currentHourDisplay}>
              <Text style={styles.planetSymbol}>
                <Text style={getPhysisSymbolStyle(fontLoaded, "large")}>
                  {planetKeys[planetaryHoursData.currentHour.planet] || "?"}
                </Text>
              </Text>
              <View style={styles.currentHourInfo}>
                <Text style={styles.currentPlanetName}>
                  {planetaryHoursData.currentHour.planet} Hour
                </Text>
                <Text style={styles.hourType}>
                  {planetaryHoursData.currentHour.isDayHour ? "Day" : "Night"}
                </Text>
                <Text style={styles.timeRange}>
                  {formatTime(planetaryHoursData.currentHour.startTime)} -{" "}
                  {formatTime(planetaryHoursData.currentHour.endTime)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Debug Information */}
        {planetaryHoursData && (
          <View style={styles.cardContainer}>
            <Text style={styles.cardTitle}>Location & Timing Info</Text>
            <Text style={styles.infoText}>
              🌅 Sunrise: {formatTime(planetaryHoursData.sunrise)}
            </Text>
            <Text style={styles.infoText}>
              🌇 Sunset: {formatTime(planetaryHoursData.sunset)}
            </Text>
            <Text style={styles.infoText}>
              ☀️ Day Length:{" "}
              {Math.round(
                (planetaryHoursData.sunset.getTime() -
                  planetaryHoursData.sunrise.getTime()) /
                  (1000 * 60 * 60 * 60 * 100)
              ) / 100}
              h
            </Text>
            <Text style={styles.infoText}>
              🌙 Night Length:{" "}
              {Math.round(
                (24 * 60 * 60 * 1000 -
                  (planetaryHoursData.sunset.getTime() -
                    planetaryHoursData.sunrise.getTime())) /
                  (1000 * 60 * 60 * 60 * 100)
              ) / 100}
              h
            </Text>
            {currentChart?.location && (
              <Text style={styles.infoText}>
                📍 Location: {currentChart.location.latitude.toFixed(4)}°,{" "}
                {currentChart.location.longitude.toFixed(4)}°
              </Text>
            )}
            {backgroundTimingInfo && (
              <>
                <Text style={styles.infoText}>
                  🌅 Dawn Window: {backgroundTimingInfo.dawnWindow}
                </Text>
                <Text style={styles.infoText}>
                  🌇 Dusk Window: {backgroundTimingInfo.duskWindow}
                </Text>
              </>
            )}
          </View>
        )}

        {/* Explanation */}
        <View style={styles.cardContainer}>
          <Text style={styles.cardTitle}>About Planetary Hours</Text>
          <Text style={styles.infoText}>
            Planetary hours divide daylight and nighttime into 12 equal parts
            each. Each hour is ruled by one of the seven classical planets in
            the Chaldean order: Saturn, Jupiter, Mars, Sun, Venus, Mercury,
            Moon.
          </Text>
          <Text style={styles.infoText}>
            The first hour of each day is ruled by the planet that governs that
            day of the week. The sequence continues through all 24 hours,
            creating a perfect cycle that aligns with the 7-day week.
          </Text>
        </View>

        {/* Day Hours */}
        {planetaryHoursData && (
          <View style={styles.cardContainer}>
            <Text style={styles.cardTitle}>Day Hours (Sunrise to Sunset)</Text>
            {planetaryHoursData.dayHours.map((hour, index) => (
              <View
                key={`day-${index}`}
                style={[
                  styles.hourRow,
                  planetaryHoursData.currentHour?.hour === hour.hour &&
                    planetaryHoursData.currentHour?.isDayHour &&
                    styles.highlightedHourRow,
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
        )}

        {/* Night Hours */}
        {planetaryHoursData && (
          <View style={styles.cardContainer}>
            <Text style={styles.cardTitle}>
              Night Hours (Sunset to Sunrise)
            </Text>
            {planetaryHoursData.nightHours.map((hour, index) => (
              <View
                key={`night-${index}`}
                style={[
                  styles.hourRow,
                  planetaryHoursData.currentHour?.hour === hour.hour &&
                    !planetaryHoursData.currentHour?.isDayHour &&
                    styles.highlightedHourRow,
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
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0e2515",
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
    paddingBottom: 40, // Account for nav bar
  },
  navBar: {
    position: "absolute",
    bottom: 0,
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
  navText: {
    color: "#e6e6fa",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 4,
  },
  currentHourDisplay: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  planetSymbol: {
    fontSize: 24,
    color: "#e6e6fa",
    marginRight: 15,
  },
  currentHourInfo: {
    flex: 1,
  },
  currentPlanetName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e6e6fa",
    marginBottom: 4,
  },
  hourType: {
    fontSize: 12,
    color: "#8a8a8a",
    marginBottom: 4,
  },
  timeRange: {
    fontSize: 12,
    color: "#6f7782",
  },
  infoText: {
    fontSize: 14,
    color: "#e6e6fa",
    marginBottom: 8,
    lineHeight: 20,
  },
  hourRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(26, 26, 46, 0.6)",
    marginBottom: 2,
    borderRadius: 6,
  },
  hourNumber: {
    fontSize: 12,
    color: "#8a8a8a",
    width: 25,
    textAlign: "center",
  },
  planetName: {
    fontSize: 14,
    color: "#e6e6fa",
    flex: 1,
    marginLeft: 10,
  },
  highlightedHourRow: {
    backgroundColor: "rgba(111, 119, 130, 0.4)",
    borderWidth: 1,
    borderColor: "#6f7782",
  },
  cardContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e6e6fa",
    marginBottom: 10,
    textAlign: "center",
  },
});
