import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
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
import {
  usePhysisFont,
  getPhysisSymbolStyle,
  getPhysisSymbolStyleCustom,
} from "../utils/physisFont";
import { getPlanetKeysFromNames } from "../utils/physisSymbolMap";
import {
  calculatePlanetaryHours,
  PlanetaryHoursData,
  formatTime,
  getDayRuler,
} from "../utils/planetaryHoursUtils";
import { getPlanetColor } from "../utils/ephemerisChartData";
import DateTimePickerDrawer from "../components/DateTimePickerDrawer";

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
  // Convert from ISO string to Date object if it's a string
  const selectedDateParam = route?.params?.selectedDate;
  const initialSelectedDate = useMemo(() => {
    if (selectedDateParam instanceof Date) {
      return selectedDateParam;
    } else if (selectedDateParam) {
      return new Date(selectedDateParam);
    }
    return new Date();
  }, [selectedDateParam]);

  // State for the currently displayed date (can be changed via date picker)
  const [displayDate, setDisplayDate] = useState(initialSelectedDate);

  // Update displayDate when route params change
  useEffect(() => {
    setDisplayDate(initialSelectedDate);
  }, [initialSelectedDate]);

  // Use displayDate as the selectedDate for calculations
  const selectedDate = displayDate;

  // Create a stable string key for the date to use as dependency
  const selectedDateKey = useMemo(() => {
    return selectedDate.toISOString().split("T")[0]; // YYYY-MM-DD format
  }, [selectedDate]);

  // Create a key that includes both date and time for recalculation tracking
  const selectedDateTimeKey = useMemo(() => {
    return selectedDate.getTime().toString(); // Full timestamp including time
  }, [selectedDate]);

  // Extract location values in a stable way
  const locationLat = currentChart?.location?.latitude ?? 40.7128;
  const locationLng = currentChart?.location?.longitude ?? -74.006;

  // State for planetary hours data
  const [planetaryHoursData, setPlanetaryHoursData] =
    useState<PlanetaryHoursData | null>(null);
  const [loading, setLoading] = useState(false);

  // State for the date/time picker drawer
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Track last calculated date/location to prevent unnecessary recalculations
  const lastCalculationRef = useRef<{
    dateTimeKey: string;
    latitude: number;
    longitude: number;
  } | null>(null);

  // Calculate planetary hours on mount and when current chart or date changes
  useEffect(() => {
    // Only recalculate if date/time or location actually changed
    const shouldRecalculate =
      !lastCalculationRef.current ||
      lastCalculationRef.current.dateTimeKey !== selectedDateTimeKey ||
      lastCalculationRef.current.latitude !== locationLat ||
      lastCalculationRef.current.longitude !== locationLng;

    if (!shouldRecalculate) {
      return;
    }

    // Perform the calculation
    const calculatePlanetaryHoursForDate = async (date: Date) => {
      setLoading(true);
      try {
        // Pass the selected date as referenceTime so the "current" hour is based on the selected time
        const planetaryData = await calculatePlanetaryHours(
          date,
          locationLat,
          locationLng,
          date // Use the selected date/time as the reference time
        );

        setPlanetaryHoursData(planetaryData);
        lastCalculationRef.current = {
          dateTimeKey: selectedDateTimeKey,
          latitude: locationLat,
          longitude: locationLng,
        };
      } catch (error) {
        console.error("Error calculating planetary hours:", error);
        setPlanetaryHoursData(null);
      } finally {
        setLoading(false);
      }
    };

    calculatePlanetaryHoursForDate(selectedDate);
  }, [locationLat, locationLng, selectedDateTimeKey, selectedDate]);

  // Drawer functions
  const openDrawer = () => {
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  const applyDateChange = (date: Date) => {
    setDisplayDate(date);
  };

  const followCurrentTime = () => {
    setDisplayDate(new Date());
  };

  // Helper function to check if selected date is today
  const isToday = () => {
    const today = new Date();
    const selected = new Date(selectedDate);
    return (
      selected.getDate() === today.getDate() &&
      selected.getMonth() === today.getMonth() &&
      selected.getFullYear() === today.getFullYear()
    );
  };

  // Helper to convert color to rgba with opacity
  const colorToRgba = (color: string, opacity: number): string => {
    // If already rgba, extract rgb and apply new opacity
    if (color.startsWith("rgba")) {
      const rgb = color.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`;
      }
    }
    // If hex color
    if (color.startsWith("#")) {
      const hex = color.slice(1);
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    // For named colors, use a simple mapping (fallback to original color)
    const namedColors: Record<string, string> = {
      orange: `rgba(255, 165, 0, ${opacity})`,
      cornflowerblue: `rgba(100, 149, 237, ${opacity})`,
      forestgreen: `rgba(34, 139, 34, ${opacity})`,
      violet: `rgba(238, 130, 238, ${opacity})`,
      red: `rgba(255, 0, 0, ${opacity})`,
      gold: `rgba(255, 215, 0, ${opacity})`,
      steelblue: `rgba(70, 130, 180, ${opacity})`,
      indigo: `rgba(75, 0, 130, ${opacity})`,
      saddlebrown: `rgba(139, 69, 19, ${opacity})`,
    };
    return namedColors[color.toLowerCase()] || color;
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

  // State for layered background transitions
  const [currentTimeOfDay, setCurrentTimeOfDay] = useState(() =>
    getTimeOfDayForDate(selectedDate)
  );
  const previousTimeOfDayRef = useRef<string | null>(null);

  // Opacity animations for each gradient layer (must be declared before updateGradientOpacities)
  const nightOpacity = useState(new Animated.Value(1))[0];
  const dayOpacity = useState(new Animated.Value(0))[0];
  const duskOpacity = useState(new Animated.Value(0))[0];
  const dawnOpacity = useState(new Animated.Value(0))[0];

  // Function to update gradient opacities based on time of day
  // Memoize to prevent recreation on every render
  const updateGradientOpacities = useCallback(
    (timeOfDay: string) => {
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
    },
    [nightOpacity, dayOpacity, duskOpacity, dawnOpacity]
  );

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
  // Use specific sunrise/sunset values instead of the whole object to prevent loops
  const sunriseTime = useMemo(
    () => planetaryHoursData?.sunrise?.getTime(),
    [planetaryHoursData?.sunrise?.getTime()]
  );
  const sunsetTime = useMemo(
    () => planetaryHoursData?.sunset?.getTime(),
    [planetaryHoursData?.sunset?.getTime()]
  );
  const selectedDateTime = useMemo(
    () => selectedDate.getTime(),
    [selectedDateKey]
  );

  useEffect(() => {
    // Skip if we don't have sunrise/sunset data yet
    if (!planetaryHoursData?.sunrise || !planetaryHoursData?.sunset) {
      return;
    }

    const newTimeOfDay = getTimeOfDayForDate(
      selectedDate,
      planetaryHoursData.sunrise,
      planetaryHoursData.sunset
    );

    // Only update if time of day actually changed from the previous value
    if (newTimeOfDay !== previousTimeOfDayRef.current) {
      previousTimeOfDayRef.current = newTimeOfDay;
      setCurrentTimeOfDay(newTimeOfDay);
      updateGradientOpacities(newTimeOfDay);
    }
  }, [selectedDateTime, sunriseTime, sunsetTime, updateGradientOpacities]);

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
          {/* Day and Hour Cards Row */}
          {planetaryHoursData?.currentHour &&
            (() => {
              const dayOfWeek = selectedDate.getDay();
              const dayRuler = getDayRuler(dayOfWeek);
              const dayNames = [
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
              ];
              const dayName = dayNames[dayOfWeek];
              const currentHourPlanet = planetaryHoursData.currentHour.planet;

              // Get planet colors (convert to lowercase for color lookup)
              const dayRulerColor = getPlanetColor(dayRuler.toLowerCase());
              const hourPlanetColor = getPlanetColor(
                currentHourPlanet.toLowerCase()
              );

              // Use greyish-blue text color (#6b6b8a) when background is yellow/gold (Jupiter or Sun)
              // This matches the color used on the astrology chart's zodiac ring for yellow signs
              const isDayRulerJupiter = dayRuler.toLowerCase() === "jupiter";
              const isDayRulerSun = dayRuler.toLowerCase() === "sun";
              const isHourPlanetJupiter =
                currentHourPlanet.toLowerCase() === "jupiter";
              const isHourPlanetSun = currentHourPlanet.toLowerCase() === "sun";
              const dayTextColor =
                isDayRulerJupiter || isDayRulerSun ? "#6b6b8a" : "#e6e6fa";
              const hourTextColor =
                isHourPlanetJupiter || isHourPlanetSun ? "#6b6b8a" : "#e6e6fa";

              return (
                <View style={styles.dayHourCardsRow}>
                  {/* Day Card */}
                  <View
                    style={[
                      styles.dayHourCard,
                      { backgroundColor: dayRulerColor },
                    ]}
                  >
                    {/* Left Column - Symbol */}
                    <View style={styles.dayHourCardLeftCol}>
                      <Text
                        style={[
                          styles.dayHourCardSymbol,
                          { color: dayTextColor },
                        ]}
                      >
                        <Text
                          style={getPhysisSymbolStyleCustom(fontLoaded, 58)}
                        >
                          {planetKeys[dayRuler] || "?"}
                        </Text>
                      </Text>
                    </View>
                    {/* Right Column - Text */}
                    <View style={styles.dayHourCardRightCol}>
                      <Text
                        style={[
                          styles.dayHourCardText,
                          { color: dayTextColor },
                        ]}
                      >
                        {dayName} {dayRuler} Day
                      </Text>
                    </View>
                  </View>

                  {/* Hour Card */}
                  <View
                    style={[
                      styles.dayHourCard,
                      { backgroundColor: hourPlanetColor },
                    ]}
                  >
                    {/* Left Column - Symbol */}
                    <View style={styles.dayHourCardLeftCol}>
                      <Text
                        style={[
                          styles.dayHourCardSymbol,
                          { color: hourTextColor },
                        ]}
                      >
                        <Text
                          style={getPhysisSymbolStyleCustom(fontLoaded, 58)}
                        >
                          {planetKeys[currentHourPlanet] || "?"}
                        </Text>
                      </Text>
                    </View>
                    {/* Right Column - Text */}
                    <View style={styles.dayHourCardRightCol}>
                      <Text
                        style={[
                          styles.dayHourCardText,
                          { color: hourTextColor },
                        ]}
                      >
                        {currentHourPlanet} Hour
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })()}

          {/* Bar Chart */}
          {planetaryHoursData?.dayHours &&
            planetaryHoursData?.nightHours &&
            (() => {
              const dayOfWeek = selectedDate.getDay();
              const dayRuler = getDayRuler(dayOfWeek);
              const dayRulerColor = getPlanetColor(dayRuler.toLowerCase());
              const currentHourPlanet = planetaryHoursData.currentHour?.planet;
              const currentHourPlanetColor = currentHourPlanet
                ? getPlanetColor(currentHourPlanet.toLowerCase())
                : null;
              const currentHourNumber = planetaryHoursData.currentHour?.hour;
              const isCurrentHourDay =
                planetaryHoursData.currentHour?.isDayHour;

              // Pre-calculated smooth S-curve across all 24 hours (single continuous curve)
              // Pattern: 2→12→0.5 (hours 1-12) then -0.5→-12→-2 (hours 13-24)
              const smoothInterpolate = (t: number): number => {
                t = Math.max(0, Math.min(1, t));
                return t * t * t * (t * (t * 6 - 15) + 10);
              };

              // Create a single array of 24 values forming a smooth S-curve
              const all24PatternValues: number[] = [];

              // Day hours 1-12: 2 → 12 (peak at 6-7) → 0.5
              for (let i = 1; i <= 12; i++) {
                if (i <= 6) {
                  // Rising: hour 1 (2) → hour 6 (12)
                  const t = (i - 1) / 5;
                  const smoothT = smoothInterpolate(t);
                  all24PatternValues[i - 1] = 2 + smoothT * 10; // 2 to 12
                } else {
                  // Falling: hour 6 (12) → hour 12 (0.5)
                  const t = (i - 6) / 6;
                  const smoothT = smoothInterpolate(t);
                  all24PatternValues[i - 1] = 12 - smoothT * 11.5; // 12 to 0.5
                }
              }

              // Night hours 13-24: -0.5 → -12 (dip at 18-19) → -2
              for (let i = 13; i <= 24; i++) {
                const nightHour = i - 12; // Convert to 1-12 for night pattern
                if (nightHour <= 7) {
                  // Dipping: hour 13 (-0.5) → hour 19 (-12)
                  const t = (nightHour - 1) / 6;
                  const smoothT = smoothInterpolate(t);
                  all24PatternValues[i - 1] = -0.5 - smoothT * 11.5; // -0.5 to -12
                } else {
                  // Rising: hour 19 (-12) → hour 24 (-2)
                  const t = (nightHour - 7) / 5;
                  const smoothT = smoothInterpolate(t);
                  all24PatternValues[i - 1] = -12 + smoothT * 10; // -12 to -2
                }
              }

              // Simple lookup function - uses position (1-24) instead of hourNum and isDay
              const getHourHeight = (
                position: number, // 1-24 position in the sequence
                maxHeight: number,
                minHeight: number
              ) => {
                const patternValue = all24PatternValues[position - 1];

                if (patternValue >= 0) {
                  // Day hours: map 0.5-12 to minHeight-maxHeight
                  const normalized = (patternValue - 0.5) / 11.5;
                  return minHeight + (maxHeight - minHeight) * normalized;
                } else {
                  // Night hours: map -0.5 to -12 to minHeight-maxHeight (will be positioned downward)
                  const normalized = (-patternValue - 0.5) / 11.5;
                  return minHeight + (maxHeight - minHeight) * normalized;
                }
              };

              const maxBarHeight = 40;
              const minBarHeight = 8;
              const barWidth = 12;
              const barGap = 2;
              const axisY = 50; // Center of container (100px height / 2)

              // Combine all hours in sequence: day hours (1-12) then night hours (13-24)
              const allHours = [
                ...planetaryHoursData.dayHours.map((h, i) => ({
                  ...h,
                  position: i + 1,
                  isDay: true,
                })),
                ...planetaryHoursData.nightHours.map((h, i) => ({
                  ...h,
                  position: i + 13,
                  isDay: false,
                })),
              ];

              return (
                <View style={styles.barChartContainer}>
                  {/* X-axis line (invisible) */}
                  <View style={[styles.barChartAxis, { top: axisY }]} />

                  {/* All Bars in sequence - single row */}
                  <View style={styles.barChartRow}>
                    {allHours.map((hour, index) => {
                      const hourNum = hour.hour;
                      let height = getHourHeight(
                        hour.position, // Use position (1-24) for the smooth curve
                        maxBarHeight,
                        minBarHeight
                      );
                      const isDayRulerHour = hour.planet === dayRuler;
                      const isCurrentHour =
                        currentHourNumber === hourNum &&
                        ((hour.isDay && isCurrentHourDay) ||
                          (!hour.isDay && !isCurrentHourDay));

                      // Determine bar color
                      let barColor = hour.isDay ? "#ffffff" : "#000000"; // default white for day, black for night
                      if (isCurrentHour && currentHourPlanetColor) {
                        barColor = currentHourPlanetColor;
                      } else if (isDayRulerHour) {
                        barColor = dayRulerColor;
                      }

                      // Day hours: bottom edge at axis, extend upward
                      // Night hours: top edge at axis, extend downward
                      return (
                        <View
                          key={`bar-${hour.position}`}
                          style={[
                            {
                              width: barWidth,
                              height: 100,
                              marginRight: index < 23 ? barGap : 0,
                              position: "relative",
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.barChartBar,
                              {
                                width: barWidth,
                                height: height,
                                backgroundColor: barColor,
                                position: "absolute",
                                bottom: hour.isDay ? axisY : undefined,
                                top: hour.isDay ? undefined : axisY,
                              },
                            ]}
                          />
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })()}

          {/* Day Hours */}
          {planetaryHoursData?.dayHours &&
            (() => {
              const dayOfWeek = selectedDate.getDay();
              const dayRuler = getDayRuler(dayOfWeek);
              const dayRulerColor = getPlanetColor(dayRuler.toLowerCase());
              const currentHourPlanet = planetaryHoursData.currentHour?.planet;
              const currentHourPlanetColor = currentHourPlanet
                ? getPlanetColor(currentHourPlanet.toLowerCase())
                : null;

              return (
                <View
                  style={[
                    styles.cardContainer,
                    { backgroundColor: "rgba(255, 255, 255, 0.75)" },
                  ]}
                >
                  <Text style={[styles.cardTitle, { color: "#000000" }]}>
                    Day Hours (Sunrise to Sunset)
                  </Text>
                  {planetaryHoursData.dayHours.map((hour, index) => {
                    const isDayRulerHour = hour.planet === dayRuler;
                    const isCurrentHour =
                      planetaryHoursData.currentHour?.hour === hour.hour &&
                      planetaryHoursData.currentHour?.isDayHour;

                    // Determine background color: current hour uses planet color, day ruler uses day ruler color
                    let backgroundColorStyle = {};
                    if (isCurrentHour && currentHourPlanetColor) {
                      backgroundColorStyle = {
                        backgroundColor: currentHourPlanetColor,
                      };
                    } else if (isDayRulerHour) {
                      backgroundColorStyle = {
                        backgroundColor: colorToRgba(
                          dayRulerColor,
                          isCurrentHour ? 1.0 : 0.5
                        ),
                      };
                    }

                    // Use greyish-blue text color (#6b6b8a) when background is yellow/gold (Jupiter or Sun)
                    const isJupiterOrSunBackground =
                      (isCurrentHour &&
                        (currentHourPlanet?.toLowerCase() === "jupiter" ||
                          currentHourPlanet?.toLowerCase() === "sun")) ||
                      (isDayRulerHour &&
                        (dayRuler.toLowerCase() === "jupiter" ||
                          dayRuler.toLowerCase() === "sun"));
                    const textColor = isJupiterOrSunBackground
                      ? "#6b6b8a"
                      : "#ffffff";

                    return (
                      <View
                        key={`day-${index}`}
                        style={[
                          styles.hourRow,
                          isCurrentHour &&
                            !currentHourPlanetColor &&
                            styles.highlightedHourRow,
                          backgroundColorStyle,
                        ]}
                      >
                        <Text style={[styles.hourNumber, { color: textColor }]}>
                          {hour.hour}
                        </Text>
                        <Text
                          style={[styles.planetSymbol, { color: textColor }]}
                        >
                          <Text
                            style={getPhysisSymbolStyle(fontLoaded, "medium")}
                          >
                            {planetKeys[hour.planet] || "?"}
                          </Text>
                        </Text>
                        <Text style={[styles.planetName, { color: textColor }]}>
                          {hour.planet}
                        </Text>
                        <Text style={[styles.timeRange, { color: textColor }]}>
                          {formatTime(hour.startTime)} -{" "}
                          {formatTime(hour.endTime)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              );
            })()}

          {/* Night Hours */}
          {planetaryHoursData?.nightHours &&
            (() => {
              const dayOfWeek = selectedDate.getDay();
              const dayRuler = getDayRuler(dayOfWeek);
              const dayRulerColor = getPlanetColor(dayRuler.toLowerCase());
              const currentHourPlanet = planetaryHoursData.currentHour?.planet;
              const currentHourPlanetColor = currentHourPlanet
                ? getPlanetColor(currentHourPlanet.toLowerCase())
                : null;

              return (
                <View
                  style={[
                    styles.cardContainer,
                    { backgroundColor: "rgba(0, 0, 0, 0.75)" },
                  ]}
                >
                  <Text style={[styles.cardTitle, { color: "#ffffff" }]}>
                    Night Hours (Sunset to Sunrise)
                  </Text>
                  {planetaryHoursData.nightHours.map((hour, index) => {
                    const isDayRulerHour = hour.planet === dayRuler;
                    const isCurrentHour =
                      planetaryHoursData.currentHour?.hour === hour.hour &&
                      !planetaryHoursData.currentHour?.isDayHour;

                    // Determine background color: current hour uses planet color, day ruler uses day ruler color
                    let backgroundColorStyle = {};
                    if (isCurrentHour && currentHourPlanetColor) {
                      backgroundColorStyle = {
                        backgroundColor: currentHourPlanetColor,
                      };
                    } else if (isDayRulerHour) {
                      backgroundColorStyle = {
                        backgroundColor: colorToRgba(
                          dayRulerColor,
                          isCurrentHour ? 1.0 : 0.5
                        ),
                      };
                    }

                    // Use greyish-blue text color (#6b6b8a) when background is yellow/gold (Jupiter or Sun)
                    const isJupiterOrSunBackground =
                      (isCurrentHour &&
                        (currentHourPlanet?.toLowerCase() === "jupiter" ||
                          currentHourPlanet?.toLowerCase() === "sun")) ||
                      (isDayRulerHour &&
                        (dayRuler.toLowerCase() === "jupiter" ||
                          dayRuler.toLowerCase() === "sun"));
                    const textColor = isJupiterOrSunBackground
                      ? "#6b6b8a"
                      : "#ffffff";

                    return (
                      <View
                        key={`night-${index}`}
                        style={[
                          styles.hourRow,
                          isCurrentHour &&
                            !currentHourPlanetColor &&
                            styles.highlightedHourRow,
                          backgroundColorStyle,
                        ]}
                      >
                        <Text style={[styles.hourNumber, { color: textColor }]}>
                          {hour.hour}
                        </Text>
                        <Text
                          style={[styles.planetSymbol, { color: textColor }]}
                        >
                          <Text
                            style={getPhysisSymbolStyle(fontLoaded, "medium")}
                          >
                            {planetKeys[hour.planet] || "?"}
                          </Text>
                        </Text>
                        <Text style={[styles.planetName, { color: textColor }]}>
                          {hour.planet}
                        </Text>
                        <Text style={[styles.timeRange, { color: textColor }]}>
                          {formatTime(hour.startTime)} -{" "}
                          {formatTime(hour.endTime)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              );
            })()}

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
        </ScrollView>

        {/* Secondary Navigation Bar - Display Date */}
        <TouchableOpacity style={styles.secondaryNavBar} onPress={openDrawer}>
          <Text style={styles.secondaryNavText}>
            {(() => {
              const dateString = displayDate.toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              });
              const timeString = displayDate.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              });
              return `${dateString} ${timeString}`;
            })()}
          </Text>
          <Text style={styles.arrowIcon}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Date/Time Picker Drawer */}
      <DateTimePickerDrawer
        visible={drawerVisible}
        onClose={closeDrawer}
        onApply={applyDateChange}
        onFollowCurrentTime={followCurrentTime}
        initialDate={displayDate}
      />
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
    paddingBottom: 80, // Account for nav bar and date picker bar
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
    color: "#ffffff",
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
    color: "#ffffff",
    width: 25,
    textAlign: "center",
  },
  planetName: {
    fontSize: 14,
    color: "#ffffff",
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
  dayHourCardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 15,
  },
  dayHourCard: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 10,
    padding: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    flexDirection: "row",
    minHeight: 65,
  },
  dayHourCardLeftCol: {
    flex: 0,
    paddingLeft: 6,
    paddingRight: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  dayHourCardRightCol: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: 6,
  },
  dayHourCardSymbol: {
    color: "#e6e6fa",
    textAlign: "center",
  },
  dayHourCardText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e6e6fa",
    textAlign: "left",
  },
  barChartContainer: {
    marginBottom: 20,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    height: 100,
    position: "relative",
  },
  barChartAxis: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "transparent", // Invisible x-axis
    top: 50, // Center vertically
  },
  barChartRow: {
    flexDirection: "row",
    justifyContent: "center",
    position: "absolute",
    left: 0,
    right: 0,
    height: 100,
    top: 0,
    alignItems: "center",
  },
  barChartBar: {
    borderRadius: 1,
  },
  secondaryNavBar: {
    position: "absolute",
    bottom: 0, // Position directly above the tab bar
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
  secondaryNavText: {
    color: "#e6e6fa",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 4,
    textAlign: "left",
    textTransform: "uppercase",
    flex: 1,
  },
  arrowIcon: {
    color: "#e6e6fa",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
});
