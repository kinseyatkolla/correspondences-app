import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
  Animated,
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
  route: any;
}

export default function PlanetaryHoursScreen({
  navigation,
  route,
}: PlanetaryHoursScreenProps) {
  const { currentChart } = useAstrology();
  const { fontLoaded } = usePhysisFont();
  const planetKeys = getPlanetKeysFromNames();

  // Get selected date from route params, default to today
  const selectedDate = route?.params?.selectedDate || new Date();

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
    calculatePlanetaryHoursForDate(selectedDate);
  }, [currentChart, selectedDate]);

  // Helper function to check if selected date is today
  const isToday = () => {
    const today = new Date();
    const selected = new Date(selectedDate);
    console.log("PlanetaryHoursScreen - Today:", today.toDateString());
    console.log("PlanetaryHoursScreen - Selected:", selected.toDateString());
    console.log(
      "PlanetaryHoursScreen - Is Today:",
      selected.getDate() === today.getDate() &&
        selected.getMonth() === today.getMonth() &&
        selected.getFullYear() === today.getFullYear()
    );
    return (
      selected.getDate() === today.getDate() &&
      selected.getMonth() === today.getMonth() &&
      selected.getFullYear() === today.getFullYear()
    );
  };

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

  // Function to determine time of day based on actual sunrise/sunset times
  const getTimeOfDayForDate = (date: Date, sunrise?: Date, sunset?: Date) => {
    // If we have planetary hours data with real sunrise/sunset times, use them
    if (sunrise && sunset) {
      const currentTime = date.getTime();
      const sunriseTime = sunrise.getTime();
      const sunsetTime = sunset.getTime();

      // Dawn: 30 minutes before sunrise to 30 minutes after sunrise
      const dawnStart = sunriseTime - 30 * 60 * 1000; // 30 minutes before
      const dawnEnd = sunriseTime + 30 * 60 * 1000; // 30 minutes after

      // Dusk: 30 minutes before sunset to 30 minutes after sunset
      const duskStart = sunsetTime - 30 * 60 * 1000; // 30 minutes before
      const duskEnd = sunsetTime + 30 * 60 * 1000; // 30 minutes after

      // Day: from end of dawn to start of dusk
      const dayStart = dawnEnd;
      const dayEnd = duskStart;

      if (currentTime >= dawnStart && currentTime <= dawnEnd) return "dawn";
      if (currentTime >= dayStart && currentTime <= dayEnd) return "day";
      if (currentTime >= duskStart && currentTime <= duskEnd) return "dusk";
      return "night"; // Everything else is night
    }

    // Fallback to original logic if no sunrise/sunset data
    const hour = date.getHours();
    if (hour >= 5 && hour < 8) return "dawn";
    if (hour >= 8 && hour < 17) return "day";
    if (hour >= 17 && hour < 20) return "dusk";
    return "night"; // 20:00 - 4:59
  };

  // Function to update gradient opacities based on time of day
  const updateGradientOpacities = (timeOfDay: string) => {
    const duration = 1000; // Smooth 1-second transition

    // Reset all opacities to their target values
    const opacityValues = {
      night: timeOfDay === "night" ? 1 : 0,
      day: timeOfDay === "day" ? 1 : 0,
      dusk: timeOfDay === "dusk" ? 1 : 0,
      dawn: timeOfDay === "dawn" ? 1 : 0,
    };

    // Animate all layers simultaneously
    Animated.parallel([
      Animated.timing(nightOpacity, {
        toValue: opacityValues.night,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(dayOpacity, {
        toValue: opacityValues.day,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(duskOpacity, {
        toValue: opacityValues.dusk,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(dawnOpacity, {
        toValue: opacityValues.dawn,
        duration,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // State for layered background transitions
  const [currentTimeOfDay, setCurrentTimeOfDay] = useState(() =>
    getTimeOfDayForDate(selectedDate)
  );

  // Opacity animations for each gradient layer
  const nightOpacity = useState(new Animated.Value(1))[0];
  const dayOpacity = useState(new Animated.Value(0))[0];
  const duskOpacity = useState(new Animated.Value(0))[0];
  const dawnOpacity = useState(new Animated.Value(0))[0];

  // ===== DYNAMIC BACKGROUND CALCULATION =====
  const backgroundImages = useMemo(
    () => ({
      dawn: require("../../assets/images/dawn-gradient.png"),
      day: require("../../assets/images/day-gradient.png"),
      dusk: require("../../assets/images/dusk-gradient.png"),
      night: require("../../assets/images/night-gradient.png"),
    }),
    []
  );

  // Initialize gradient opacities on mount
  useEffect(() => {
    updateGradientOpacities(currentTimeOfDay);
  }, []);

  // Handle background transitions when selectedDate changes
  useEffect(() => {
    const newTimeOfDay = getTimeOfDayForDate(
      selectedDate,
      planetaryHoursData?.sunrise,
      planetaryHoursData?.sunset
    );

    if (newTimeOfDay !== currentTimeOfDay) {
      console.log(
        `🌅 Background transition: ${currentTimeOfDay} → ${newTimeOfDay}`,
        {
          displayTime: selectedDate.toLocaleTimeString(),
          sunrise: planetaryHoursData?.sunrise?.toLocaleTimeString(),
          sunset: planetaryHoursData?.sunset?.toLocaleTimeString(),
        }
      );
      setCurrentTimeOfDay(newTimeOfDay);
      updateGradientOpacities(newTimeOfDay);
    }
  }, [selectedDate, currentTimeOfDay, planetaryHoursData]);

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        {/* Layered gradient backgrounds */}
        <Animated.View
          style={[
            styles.gradientLayer,
            styles.nightLayer,
            { opacity: nightOpacity },
          ]}
        >
          <ImageBackground
            source={backgroundImages.night}
            style={styles.container}
            resizeMode="cover"
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.gradientLayer,
            styles.dayLayer,
            { opacity: dayOpacity },
          ]}
        >
          <ImageBackground
            source={backgroundImages.day}
            style={styles.container}
            resizeMode="cover"
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.gradientLayer,
            styles.duskLayer,
            { opacity: duskOpacity },
          ]}
        >
          <ImageBackground
            source={backgroundImages.dusk}
            style={styles.container}
            resizeMode="cover"
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.gradientLayer,
            styles.dawnLayer,
            { opacity: dawnOpacity },
          ]}
        >
          <ImageBackground
            source={backgroundImages.dawn}
            style={styles.container}
            resizeMode="cover"
          />
        </Animated.View>
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#e6e6fa" />
          <Text style={styles.loadingText}>Loading planetary hours...</Text>
        </View>
      </View>
    );
  }

  // ===== MAIN TEMPLATE =====
  return (
    <View style={styles.container}>
      {/* Layered gradient backgrounds */}

      {/* Night gradient - always present as base layer */}
      <Animated.View
        style={[
          styles.gradientLayer,
          styles.nightLayer,
          { opacity: nightOpacity },
        ]}
      >
        <ImageBackground
          source={backgroundImages.night}
          style={styles.container}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Day gradient - overlay layer */}
      <Animated.View
        style={[styles.gradientLayer, styles.dayLayer, { opacity: dayOpacity }]}
      >
        <ImageBackground
          source={backgroundImages.day}
          style={styles.container}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Dusk gradient - overlay layer */}
      <Animated.View
        style={[
          styles.gradientLayer,
          styles.duskLayer,
          { opacity: duskOpacity },
        ]}
      >
        <ImageBackground
          source={backgroundImages.dusk}
          style={styles.container}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Dawn gradient - overlay layer */}
      <Animated.View
        style={[
          styles.gradientLayer,
          styles.dawnLayer,
          { opacity: dawnOpacity },
        ]}
      >
        <ImageBackground
          source={backgroundImages.dawn}
          style={styles.container}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Content layer */}
      <View style={styles.contentLayer}>
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
              The first hour of each day is ruled by the planet that governs
              that day of the week. The sequence continues through all 24 hours,
              creating a perfect cycle that aligns with the 7-day week.
            </Text>
          </View>

          {/* Day Hours */}
          {isToday() && planetaryHoursData?.dayHours && (
            <View style={styles.cardContainer}>
              <Text style={styles.cardTitle}>
                Day Hours (Sunrise to Sunset)
              </Text>
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
          {isToday() && planetaryHoursData?.nightHours && (
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#509ac9",
  },
  gradientLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  nightLayer: {
    zIndex: 1,
  },
  dayLayer: {
    zIndex: 2,
  },
  duskLayer: {
    zIndex: 3,
  },
  dawnLayer: {
    zIndex: 4,
  },
  contentLayer: {
    flex: 1,
    zIndex: 10,
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
    paddingBottom: 40, // Account for nav bar
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  loadingText: {
    color: "#e6e6fa",
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
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
