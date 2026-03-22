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
} from "react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { sharedUI } from "../styles/sharedUI";

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
}

const SAVED_LOCATION_KEY = "savedLocation";

export default function AstrologySettingsDrawer({
  visible,
  onClose,
  onSave,
  currentLocation,
}: AstrologySettingsDrawerProps) {
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [locationName, setLocationName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [isCurrentLocation, setIsCurrentLocation] = useState(false);
  const drawerAnimation = useState(new Animated.Value(0))[0];
  const prevVisibleRef = useRef(visible);

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
      checkIfCurrentLocation();
    }
  }, [visible]);

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

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={sharedUI.drawerOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
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
              <View
                style={[sharedUI.drawerMutedPanel, { marginBottom: 20 }]}
              >
                <Text style={styles.locationNameLabel}>
                  📍 Current Location
                </Text>
                {locationName && (
                  <Text style={styles.locationName}>{locationName}</Text>
                )}
                {latitude && longitude && (
                  <Text style={styles.locationCoordinates}>
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
                  styles.button,
                  styles.saveButton,
                  (loading || isCurrentLocation) && styles.buttonDisabled,
                ]}
                onPress={handleUseCurrentLocation}
                disabled={loading || isCurrentLocation}
              >
                <Text
                  style={[
                    styles.buttonText,
                    styles.saveButtonText,
                    (loading || isCurrentLocation) && styles.buttonTextDisabled,
                  ]}
                >
                  {loading
                    ? "Getting Location..."
                    : isCurrentLocation
                      ? "📍 Current Location Already Saved"
                      : "Use Current Location"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#2a2a2a",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#444",
  },
  buttonText: {
    color: "#e6e6fa",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#4a2c7a",
    borderColor: "#6b4c9a",
  },
  saveButtonText: { color: "#fff" },
  buttonDisabled: {
    opacity: 0.5,
    backgroundColor: "#2a2a2a",
    borderColor: "#333",
  },
  buttonTextDisabled: { color: "#8a8a8a" },
  locationNameLabel: {
    fontSize: 12,
    color: "#8a8a8a",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  locationName: {
    fontSize: 16,
    color: "#e6e6fa",
    fontWeight: "600",
    marginBottom: 4,
  },
  locationCoordinates: {
    fontSize: 12,
    color: "#8a8a8a",
    fontFamily: "monospace",
  },
  geocodingContainer: { padding: 12, marginBottom: 20 },
  geocodingText: {
    fontSize: 14,
    color: "#8a8a8a",
    fontStyle: "italic",
  },
});
