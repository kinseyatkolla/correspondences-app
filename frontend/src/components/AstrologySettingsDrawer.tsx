// ============================================================================
// Astrology settings drawer — location for Moon, Calendar, Astrology screens.
// ============================================================================
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ScrollView,
  Animated,
  TextInput,
} from "react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { sharedUI } from "../styles/sharedUI";
import { apiService } from "../services/api";

interface AstrologySettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSave: (location: {
    latitude: number;
    longitude: number;
    name?: string;
  }) => void;
  currentLocation: {
    latitude: number;
    longitude: number;
    name?: string;
  } | null;
  focusSection?: "location" | "natal";
}

const SAVED_LOCATION_KEY = "savedLocation";
const SAVED_NATAL_CHART_KEY = "savedNatalChart";

export default function AstrologySettingsDrawer({
  visible,
  onClose,
  onSave,
  currentLocation,
  focusSection = "location",
}: AstrologySettingsDrawerProps) {
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [locationName, setLocationName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [isCurrentLocation, setIsCurrentLocation] = useState(false);
  const [natalYear, setNatalYear] = useState("");
  const [natalMonth, setNatalMonth] = useState("");
  const [natalDay, setNatalDay] = useState("");
  const [natalHour12, setNatalHour12] = useState("");
  const [natalMinute, setNatalMinute] = useState("");
  const [natalSecond, setNatalSecond] = useState("0");
  const [natalAmPm, setNatalAmPm] = useState<"AM" | "PM">("AM");
  const [natalPlaceQuery, setNatalPlaceQuery] = useState("");
  const [natalPlaceName, setNatalPlaceName] = useState("");
  const [natalTimeZone, setNatalTimeZone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  );
  const [natalUtcPreview, setNatalUtcPreview] = useState<string>("");
  const [natalLatitude, setNatalLatitude] = useState("");
  const [natalLongitude, setNatalLongitude] = useState("");
  const [searchingNatalPlace, setSearchingNatalPlace] = useState(false);
  const [natalPlacementsLoading, setNatalPlacementsLoading] = useState(false);
  const [natalPlacementsSummary, setNatalPlacementsSummary] = useState<
    Array<{ key: string; label: string; value: string }>
  >([]);
  const drawerAnimation = useState(new Animated.Value(0))[0];
  const prevVisibleRef = useRef(visible);
  const drawerScrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      Animated.spring(drawerAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else if (!visible && prevVisibleRef.current) {
      Animated.timing(drawerAnimation, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
    prevVisibleRef.current = visible;
  }, [visible, drawerAnimation]);

  useEffect(() => {
    if (visible) {
      loadSavedLocation();
      loadSavedNatalChart();
      checkIfCurrentLocation();
      if (focusSection === "natal") {
        setTimeout(() => {
          drawerScrollRef.current?.scrollTo({ y: 520, animated: true });
        }, 250);
      }
    }
  }, [visible, focusSection]);

  const loadSavedNatalChart = async () => {
    try {
      const savedNatalChart = await AsyncStorage.getItem(SAVED_NATAL_CHART_KEY);
      if (!savedNatalChart) return;
      const natal = JSON.parse(savedNatalChart);
      setNatalYear(natal.year?.toString() || "");
      setNatalMonth(natal.month?.toString() || "");
      setNatalDay(natal.day?.toString() || "");
      const savedHour24 = Number(natal.hour);
      if (Number.isFinite(savedHour24)) {
        const isPm = savedHour24 >= 12;
        const hour12 = savedHour24 % 12 === 0 ? 12 : savedHour24 % 12;
        setNatalHour12(hour12.toString());
        setNatalAmPm(isPm ? "PM" : "AM");
      } else {
        setNatalHour12("");
        setNatalAmPm("AM");
      }
      setNatalMinute(natal.minute?.toString() || "");
      setNatalSecond(natal.second?.toString() || "0");
      setNatalLatitude(natal.latitude?.toString() || "");
      setNatalLongitude(natal.longitude?.toString() || "");
      setNatalPlaceName(natal.placeName || "");
      setNatalPlaceQuery(natal.placeName || "");
      setNatalTimeZone(
        natal.timeZone ||
          Intl.DateTimeFormat().resolvedOptions().timeZone ||
          "UTC",
      );
      if (
        natal?.utcYear !== undefined &&
        natal?.utcMonth !== undefined &&
        natal?.utcDay !== undefined &&
        natal?.utcHour !== undefined &&
        natal?.utcMinute !== undefined &&
        natal?.latitude !== undefined &&
        natal?.longitude !== undefined
      ) {
        await fetchNatalPlacements({
          year: Number(natal.utcYear),
          month: Number(natal.utcMonth),
          day: Number(natal.utcDay),
          hour: Number(natal.utcHour),
          minute: Number(natal.utcMinute),
          second: Number(natal.utcSecond || 0),
          latitude: Number(natal.latitude),
          longitude: Number(natal.longitude),
        });
      } else {
        setNatalPlacementsSummary([]);
      }
    } catch (error) {
      console.error("Error loading natal chart settings:", error);
    }
  };

  const getTimeZoneOffsetMs = (date: Date, timeZone: string): number => {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const parts = formatter.formatToParts(date);
    const getPart = (type: string) =>
      Number(parts.find((p) => p.type === type)?.value || 0);
    const asUtc = Date.UTC(
      getPart("year"),
      getPart("month") - 1,
      getPart("day"),
      getPart("hour"),
      getPart("minute"),
      getPart("second"),
    );
    return asUtc - date.getTime();
  };

  const convertZonedLocalToUtc = (
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number,
    timeZone: string,
  ): Date => {
    const localAsIfUtc = Date.UTC(year, month - 1, day, hour, minute, second);
    let guess = localAsIfUtc;
    for (let i = 0; i < 3; i++) {
      const offset = getTimeZoneOffsetMs(new Date(guess), timeZone);
      guess = localAsIfUtc - offset;
    }
    return new Date(guess);
  };

  const parseNatalInputsToUtc = () => {
    const year = Number(natalYear);
    const month = Number(natalMonth);
    const day = Number(natalDay);
    const hour12 = Number(natalHour12);
    const minute = Number(natalMinute);
    const second = natalSecond.trim() === "" ? 0 : Number(natalSecond);
    const latitude = Number(natalLatitude);
    const longitude = Number(natalLongitude);

    if (
      !Number.isFinite(year) ||
      !Number.isFinite(month) ||
      !Number.isFinite(day) ||
      !Number.isFinite(hour12) ||
      !Number.isFinite(minute) ||
      !Number.isFinite(second) ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return null;
    }

    if (
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31 ||
      hour12 < 1 ||
      hour12 > 12 ||
      minute < 0 ||
      minute > 59 ||
      second < 0 ||
      second > 59 ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return null;
    }

    const hour24 =
      natalAmPm === "AM"
        ? hour12 === 12
          ? 0
          : hour12
        : hour12 === 12
          ? 12
          : hour12 + 12;

    const utcDate = convertZonedLocalToUtc(
      year,
      month,
      day,
      hour24,
      minute,
      second,
      natalTimeZone || "UTC",
    );

    return {
      year,
      month,
      day,
      hour12,
      minute,
      second,
      hour24,
      latitude,
      longitude,
      utcDate,
    };
  };

  const fetchNatalPlacements = async (payload: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
    latitude: number;
    longitude: number;
  }) => {
    try {
      setNatalPlacementsLoading(true);
      const response = await apiService.getBirthChart({
        year: payload.year,
        month: payload.month,
        day: payload.day,
        hour: payload.hour,
        minute: payload.minute,
        second: payload.second,
        latitude: payload.latitude,
        longitude: payload.longitude,
      });
      if (response.success && response.data?.planets) {
        const planetOrder = [
          "sun",
          "moon",
          "mercury",
          "venus",
          "mars",
          "jupiter",
          "saturn",
          "uranus",
          "neptune",
          "pluto",
        ];
        const planetRows = planetOrder
          .filter((key) => response.data.planets[key])
          .map((key) => {
            const p = response.data.planets[key];
            return {
              key,
              label: key.charAt(0).toUpperCase() + key.slice(1),
              value: `${p.degreeFormatted} ${p.zodiacSignName}`,
            };
          });
        const angleRows = response.data.houses
          ? [
              {
                key: "asc",
                label: "Ascendant",
                value: `${response.data.houses.ascendantDegree} ${response.data.houses.ascendantSign}`,
              },
              {
                key: "mc",
                label: "Midheaven",
                value: `${response.data.houses.mcDegree} ${response.data.houses.mcSign}`,
              },
            ]
          : [];
        setNatalPlacementsSummary([...planetRows, ...angleRows]);
      } else {
        setNatalPlacementsSummary([]);
      }
    } catch (error) {
      console.error("Error previewing natal placements:", error);
      setNatalPlacementsSummary([]);
    } finally {
      setNatalPlacementsLoading(false);
    }
  };

  const updateNatalPlacementsPreview = async () => {
    const parsed = parseNatalInputsToUtc();
    if (!parsed) {
      setNatalPlacementsSummary([]);
      setNatalUtcPreview("");
      return;
    }
    setNatalUtcPreview(parsed.utcDate.toISOString());
    await fetchNatalPlacements({
      year: parsed.utcDate.getUTCFullYear(),
      month: parsed.utcDate.getUTCMonth() + 1,
      day: parsed.utcDate.getUTCDate(),
      hour: parsed.utcDate.getUTCHours(),
      minute: parsed.utcDate.getUTCMinutes(),
      second: parsed.utcDate.getUTCSeconds(),
      latitude: parsed.latitude,
      longitude: parsed.longitude,
    });
  };

  const handleSearchNatalPlace = async () => {
    const query = natalPlaceQuery.trim();
    if (!query) {
      Alert.alert("Enter a location", "Try city, state, country.");
      return;
    }
    try {
      setSearchingNatalPlace(true);
      const results = await Location.geocodeAsync(query);
      if (!results || results.length === 0) {
        Alert.alert("No match found", "Try a more specific location.");
        return;
      }
      const best = results[0];
      setNatalLatitude(best.latitude.toString());
      setNatalLongitude(best.longitude.toString());
      setNatalPlaceName(query);
      try {
        const tzResponse = await fetch(
          `https://timeapi.io/api/TimeZone/coordinate?latitude=${best.latitude}&longitude=${best.longitude}`,
        );
        if (tzResponse.ok) {
          const tzData = await tzResponse.json();
          if (tzData?.timeZone) {
            setNatalTimeZone(tzData.timeZone);
          }
        }
      } catch (tzError) {
        console.error("Could not auto-detect timezone from coordinates:", tzError);
      }
      Alert.alert("Location found", `${query} saved for natal chart.`);
    } catch (error) {
      console.error("Error searching natal place:", error);
      Alert.alert("Search failed", "Could not resolve that location.");
    } finally {
      setSearchingNatalPlace(false);
    }
  };

  const handleClearNatalPlace = () => {
    setNatalPlaceName("");
    setNatalPlaceQuery("");
    setNatalLatitude("");
    setNatalLongitude("");
    setNatalPlacementsSummary([]);
    setNatalUtcPreview("");
  };

  const handleSaveNatalChart = async () => {
    try {
      const parsed = {
        year: Number(natalYear),
        month: Number(natalMonth),
        day: Number(natalDay),
        hour: Number(natalHour12),
        minute: Number(natalMinute),
        second: natalSecond.trim() === "" ? 0 : Number(natalSecond),
        latitude: Number(natalLatitude),
        longitude: Number(natalLongitude),
        placeName: natalPlaceName || natalPlaceQuery.trim(),
        timeZone: natalTimeZone || "UTC",
      };

      const parsedWithUtc = parseNatalInputsToUtc();
      if (!parsedWithUtc) {
        Alert.alert(
          "Invalid Natal Chart",
          "Please enter valid date/time/location values."
        );
        return;
      }

      parsed.hour = parsedWithUtc.hour24;
      parsed.utcYear = parsedWithUtc.utcDate.getUTCFullYear();
      parsed.utcMonth = parsedWithUtc.utcDate.getUTCMonth() + 1;
      parsed.utcDay = parsedWithUtc.utcDate.getUTCDate();
      parsed.utcHour = parsedWithUtc.utcDate.getUTCHours();
      parsed.utcMinute = parsedWithUtc.utcDate.getUTCMinutes();
      parsed.utcSecond = parsedWithUtc.utcDate.getUTCSeconds();

      if (
        !Number.isFinite(parsed.year) ||
        !Number.isFinite(parsed.month) ||
        !Number.isFinite(parsed.day) ||
        !Number.isFinite(parsed.hour) ||
        !Number.isFinite(parsed.minute) ||
        !Number.isFinite(parsed.second) ||
        !Number.isFinite(parsed.latitude) ||
        !Number.isFinite(parsed.longitude)
      ) {
        Alert.alert(
          "Invalid Natal Chart",
          "Please enter valid numbers for natal date, time, and location."
        );
        return;
      }

      if (
        parsed.month < 1 ||
        parsed.month > 12 ||
        parsed.day < 1 ||
        parsed.day > 31 ||
        parsed.hour < 0 ||
        parsed.hour > 23 ||
        parsed.minute < 0 ||
        parsed.minute > 59 ||
        parsed.second < 0 ||
        parsed.second > 59 ||
        parsed.latitude < -90 ||
        parsed.latitude > 90 ||
        parsed.longitude < -180 ||
        parsed.longitude > 180
      ) {
        Alert.alert(
          "Invalid Natal Chart",
          "Please check ranges for date/time and latitude/longitude."
        );
        return;
      }

      await AsyncStorage.setItem(SAVED_NATAL_CHART_KEY, JSON.stringify(parsed));
      await updateNatalPlacementsPreview();
      Alert.alert("Saved", "Natal chart defaults saved with timezone.");
    } catch (error) {
      console.error("Error saving natal chart settings:", error);
      Alert.alert("Error", "Could not save natal chart settings.");
    }
  };

  const checkIfCurrentLocation = async () => {
    try {
      const saved = await AsyncStorage.getItem(SAVED_LOCATION_KEY);
      if (!saved) {
        setIsCurrentLocation(false);
        return;
      }
      const savedLocation = JSON.parse(saved);
      if (!savedLocation.latitude || !savedLocation.longitude) {
        setIsCurrentLocation(false);
        return;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setIsCurrentLocation(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const currentLat = pos.coords.latitude;
      const currentLng = pos.coords.longitude;
      const tolerance = 0.0001;
      setIsCurrentLocation(
        Math.abs(savedLocation.latitude - currentLat) < tolerance &&
          Math.abs(savedLocation.longitude - currentLng) < tolerance,
      );
    } catch (error) {
      console.error("Error checking current location:", error);
      setIsCurrentLocation(false);
    }
  };

  const loadSavedLocation = async () => {
    try {
      const saved = await AsyncStorage.getItem(SAVED_LOCATION_KEY);
      if (saved) {
        const location = JSON.parse(saved);
        setLatitude(location.latitude.toString());
        setLongitude(location.longitude.toString());
        setLocationName(location.name || "");
        if (!location.name && location.latitude && location.longitude) {
          const name = await reverseGeocode(
            location.latitude,
            location.longitude,
          );
          if (name) {
            try {
              await AsyncStorage.setItem(
                SAVED_LOCATION_KEY,
                JSON.stringify({ ...location, name }),
              );
            } catch (saveError) {
              console.error("Error saving location name:", saveError);
            }
          }
        }
      } else if (currentLocation) {
        setLatitude(currentLocation.latitude.toString());
        setLongitude(currentLocation.longitude.toString());
        setLocationName(currentLocation.name || "");
        if (
          !currentLocation.name &&
          currentLocation.latitude &&
          currentLocation.longitude
        ) {
          await reverseGeocode(
            currentLocation.latitude,
            currentLocation.longitude,
          );
        }
      }
    } catch (error) {
      console.error("Error loading saved location:", error);
      if (currentLocation) {
        setLatitude(currentLocation.latitude.toString());
        setLongitude(currentLocation.longitude.toString());
        setLocationName(currentLocation.name || "");
        if (
          !currentLocation.name &&
          currentLocation.latitude &&
          currentLocation.longitude
        ) {
          await reverseGeocode(
            currentLocation.latitude,
            currentLocation.longitude,
          );
        }
      }
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      setGeocoding(true);
      const addresses = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });
      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        const parts: string[] = [];
        if (address.city) parts.push(address.city);
        if (address.region) parts.push(address.region);
        if (address.country) parts.push(address.country);
        const name = parts.length > 0 ? parts.join(", ") : `${lat}, ${lng}`;
        setLocationName(name);
        return name;
      }
      return "";
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      return "";
    } finally {
      setGeocoding(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to use your current location.",
        );
        setLoading(false);
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const lat = location.coords.latitude;
      const lng = location.coords.longitude;
      setLatitude(lat.toString());
      setLongitude(lng.toString());
      const name = await reverseGeocode(lat, lng);
      const locationToSave = {
        latitude: lat,
        longitude: lng,
        name: name || "",
      };
      onSave(locationToSave);
      Alert.alert("Success", "Location saved successfully!");
      onClose();
    } catch (error) {
      console.error("Error getting current location:", error);
      Alert.alert("Error", "Failed to get your current location");
    } finally {
      setLoading(false);
    }
  };

  const handleClearSavedLocation = () => {
    Alert.alert(
      "Clear Saved Location?",
      "This will remove your saved default location. The app will use your current GPS location next time it refreshes astrology data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(SAVED_LOCATION_KEY);
              setLatitude("");
              setLongitude("");
              setLocationName("");
              setIsCurrentLocation(false);
              Alert.alert("Saved Location Cleared");
            } catch (error) {
              console.error("Error clearing saved location:", error);
              Alert.alert("Error", "Could not clear saved location.");
            }
          },
        },
      ]
    );
  };

  const handleClearSavedNatalChart = () => {
    Alert.alert(
      "Clear Saved Natal Chart?",
      "This will remove natal defaults used for natal transit calculations.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(SAVED_NATAL_CHART_KEY);
              setNatalYear("");
              setNatalMonth("");
              setNatalDay("");
              setNatalHour12("");
              setNatalMinute("");
              setNatalSecond("0");
              setNatalAmPm("AM");
              setNatalPlaceQuery("");
              setNatalPlaceName("");
              setNatalTimeZone(
                Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
              );
              setNatalUtcPreview("");
              setNatalLatitude("");
              setNatalLongitude("");
              setNatalPlacementsSummary([]);
              Alert.alert("Saved Natal Chart Cleared");
            } catch (error) {
              console.error("Error clearing saved natal chart:", error);
              Alert.alert("Error", "Could not clear saved natal chart.");
            }
          },
        },
      ]
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={sharedUI.drawerOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            sharedUI.drawerContainer,
            { maxHeight: "90%" },
            {
              transform: [
                {
                  translateY: drawerAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [800, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={sharedUI.drawerHeader}>
            <Text style={sharedUI.drawerTitle}>Astrology Settings</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={sharedUI.drawerCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            ref={(ref) => {
              drawerScrollRef.current = ref;
            }}
            style={sharedUI.drawerContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={sharedUI.drawerSection}>
              <Text style={sharedUI.sectionTitle}>Set Default Location</Text>
              <Text style={sharedUI.drawerSectionText}>
                Set a fixed location to use for all astrological calculations.
              </Text>
            </View>
            {(locationName || (latitude && longitude)) && (
              <View style={[sharedUI.drawerMutedPanel, { marginBottom: 20 }]}>
                <Text style={sharedUI.drawerNameLabel}>📍 Current Location</Text>
                {locationName && (
                  <Text style={sharedUI.drawerName}>{locationName}</Text>
                )}
                {latitude && longitude && (
                  <Text style={sharedUI.drawerSmallTitle}>
                    {parseFloat(latitude).toFixed(4)},{" "}
                    {parseFloat(longitude).toFixed(4)}
                  </Text>
                )}
              </View>
            )}
            {geocoding && (
              <View style={styles.geocodingContainer}>
                <Text style={styles.geocodingText}>
                  Looking up location name...
                </Text>
              </View>
            )}
            <View style={sharedUI.drawerSection}>
              <TouchableOpacity
                style={[
                  sharedUI.drawerButton,
                  sharedUI.drawerPrimaryButton,
                  (loading || isCurrentLocation) && sharedUI.drawerButtonDisabled,
                ]}
                onPress={handleUseCurrentLocation}
                disabled={loading || isCurrentLocation}
              >
                <Text
                  style={[
                    sharedUI.drawerButtonText,
                    sharedUI.drawerPrimaryButtonText,
                    (loading || isCurrentLocation) &&
                      sharedUI.drawerButtonTextDisabled,
                  ]}
                >
                  {loading
                    ? "Getting Location..."
                    : isCurrentLocation
                      ? "📍 Current Location Already Saved"
                      : "Use Current Location"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[sharedUI.drawerButton, styles.clearDangerButton]}
                onPress={handleClearSavedLocation}
              >
                <Text style={[sharedUI.drawerButtonText, styles.clearDangerText]}>
                  Clear Saved Location
                </Text>
              </TouchableOpacity>
            </View>
            <View style={sharedUI.drawerSection}>
              <Text style={sharedUI.sectionTitle}>Natal Chart Defaults</Text>
              <Text style={sharedUI.drawerSectionText}>
                Used by Calendar natal transit generation.
              </Text>
              {natalPlacementsLoading ? (
                <Text style={styles.helpText}>Calculating natal placements...</Text>
              ) : null}
              {natalPlacementsSummary.length > 0 ? (
                <View style={[sharedUI.drawerMutedPanel, { marginTop: 10 }]}>
                  <Text style={sharedUI.drawerNameLabel}>
                    Natal placements used in calculations
                  </Text>
                  {natalPlacementsSummary.map((item) => (
                    <Text key={item.key} style={styles.placementRow}>
                      {item.label}: {item.value}
                    </Text>
                  ))}
                </View>
              ) : null}
              <View style={styles.row}>
                <TextInput
                  style={styles.input}
                  placeholder="Year"
                  placeholderTextColor="#777"
                  keyboardType="number-pad"
                  value={natalYear}
                  onChangeText={setNatalYear}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Month"
                  placeholderTextColor="#777"
                  keyboardType="number-pad"
                  value={natalMonth}
                  onChangeText={setNatalMonth}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Day"
                  placeholderTextColor="#777"
                  keyboardType="number-pad"
                  value={natalDay}
                  onChangeText={setNatalDay}
                />
              </View>
              <View style={styles.row}>
                <TextInput
                  style={styles.input}
                  placeholder="Hour (1-12)"
                  placeholderTextColor="#777"
                  keyboardType="number-pad"
                  value={natalHour12}
                  onChangeText={setNatalHour12}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Minute"
                  placeholderTextColor="#777"
                  keyboardType="number-pad"
                  value={natalMinute}
                  onChangeText={setNatalMinute}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Second"
                  placeholderTextColor="#777"
                  keyboardType="number-pad"
                  value={natalSecond}
                  onChangeText={setNatalSecond}
                />
              </View>
              <View style={styles.row}>
                <TextInput
                  style={styles.input}
                  placeholder="Timezone (IANA, e.g. America/Chicago)"
                  placeholderTextColor="#777"
                  value={natalTimeZone}
                  onChangeText={setNatalTimeZone}
                  autoCapitalize="none"
                />
              </View>
              <Text style={styles.helpText}>
                Timezone used for conversion: {natalTimeZone || "UTC"}
              </Text>
              {natalUtcPreview ? (
                <Text style={styles.helpText}>Converted UTC birth time: {natalUtcPreview}</Text>
              ) : null}
              <View style={styles.row}>
                <View style={styles.amPmWrap}>
                  <TouchableOpacity
                    style={[
                      styles.amPmButton,
                      natalAmPm === "AM" && styles.amPmButtonActive,
                    ]}
                    onPress={() => setNatalAmPm("AM")}
                  >
                    <Text style={styles.amPmText}>AM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.amPmButton,
                      natalAmPm === "PM" && styles.amPmButtonActive,
                    ]}
                    onPress={() => setNatalAmPm("PM")}
                  >
                    <Text style={styles.amPmText}>PM</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {!natalPlaceName ? (
                <>
                  <View style={styles.row}>
                    <TextInput
                      style={styles.input}
                      placeholder="Search city, state, country"
                      placeholderTextColor="#777"
                      value={natalPlaceQuery}
                      onChangeText={setNatalPlaceQuery}
                      autoCapitalize="words"
                    />
                  </View>
                  <TouchableOpacity
                    style={[
                      sharedUI.drawerButton,
                      sharedUI.drawerPrimaryButton,
                      searchingNatalPlace && sharedUI.drawerButtonDisabled,
                    ]}
                    onPress={handleSearchNatalPlace}
                    disabled={searchingNatalPlace}
                  >
                    <Text
                      style={[
                        sharedUI.drawerButtonText,
                        sharedUI.drawerPrimaryButtonText,
                        searchingNatalPlace && sharedUI.drawerButtonTextDisabled,
                      ]}
                    >
                      {searchingNatalPlace ? "Searching..." : "Find Natal Location"}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={[sharedUI.drawerMutedPanel, { marginTop: 10 }]}>
                  {natalPlaceName ? (
                    <Text style={sharedUI.drawerName}>{natalPlaceName}</Text>
                  ) : null}
                  {natalLatitude && natalLongitude ? (
                    <Text style={sharedUI.drawerSmallTitle}>
                      {parseFloat(natalLatitude).toFixed(4)},{" "}
                      {parseFloat(natalLongitude).toFixed(4)}
                    </Text>
                  ) : null}
                  <TouchableOpacity
                    style={[sharedUI.drawerButton, { marginTop: 10, marginBottom: 0 }]}
                    onPress={handleClearNatalPlace}
                  >
                    <Text style={sharedUI.drawerButtonText}>Search a Different Location</Text>
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity
                style={[sharedUI.drawerButton, sharedUI.drawerPrimaryButton]}
                onPress={handleSaveNatalChart}
              >
                <Text
                  style={[
                    sharedUI.drawerButtonText,
                    sharedUI.drawerPrimaryButtonText,
                  ]}
                >
                  Save Natal Chart Defaults
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[sharedUI.drawerButton, styles.clearDangerButton]}
                onPress={handleClearSavedNatalChart}
              >
                <Text style={[sharedUI.drawerButtonText, styles.clearDangerText]}>
                  Clear Saved Natal Chart
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  geocodingContainer: { padding: 12, marginBottom: 20 },
  geocodingText: {
    fontSize: 14,
    color: "#8a8a8a",
    fontStyle: "italic",
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#1f1f1f",
    color: "#fff",
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  helpText: {
    color: "#9fa0c2",
    fontSize: 12,
    marginBottom: 6,
  },
  placementRow: {
    color: "#e6e6fa",
    fontSize: 13,
    marginTop: 2,
  },
  amPmWrap: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },
  amPmButton: {
    flex: 1,
    backgroundColor: "#1f1f1f",
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  amPmButtonActive: {
    backgroundColor: "#2f2f2f",
    borderColor: "#e6e6fa",
  },
  amPmText: {
    color: "#e6e6fa",
    fontSize: 14,
    fontWeight: "600",
  },
  clearDangerButton: {
    backgroundColor: "rgba(140, 35, 45, 0.08)",
    borderColor: "rgba(220, 90, 105, 0.45)",
  },
  clearDangerText: {
    color: "rgba(230, 150, 160, 0.9)",
  },
});
