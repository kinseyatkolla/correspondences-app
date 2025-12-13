// ============================================================================
// IMPORTS
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

// ============================================================================
// TYPES
// ============================================================================
interface LocationSettingsModalProps {
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

// ============================================================================
// CONSTANTS
// ============================================================================
const SAVED_LOCATION_KEY = "savedLocation";

// ============================================================================
// COMPONENT
// ============================================================================
export default function LocationSettingsModal({
  visible,
  onClose,
  onSave,
  currentLocation,
}: LocationSettingsModalProps) {
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [locationName, setLocationName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [isCurrentLocation, setIsCurrentLocation] = useState(false);
  const drawerAnimation = useState(new Animated.Value(0))[0];
  const prevVisibleRef = useRef(visible);

  // Animate drawer in/out
  useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      // Opening: animate from bottom
      Animated.spring(drawerAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else if (!visible && prevVisibleRef.current) {
      // Closing: animate to bottom
      Animated.timing(drawerAnimation, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
    prevVisibleRef.current = visible;
  }, [visible, drawerAnimation]);

  // Load saved location when modal opens
  useEffect(() => {
    if (visible) {
      loadSavedLocation();
      checkIfCurrentLocation();
    }
  }, [visible]);

  // Check if saved location matches current GPS location
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

      // Get current GPS location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setIsCurrentLocation(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const currentLat = currentLocation.coords.latitude;
      const currentLng = currentLocation.coords.longitude;

      // Compare with saved location (with small tolerance for floating point comparison)
      const latDiff = Math.abs(savedLocation.latitude - currentLat);
      const lngDiff = Math.abs(savedLocation.longitude - currentLng);
      const tolerance = 0.0001; // Very small tolerance (~11 meters)

      setIsCurrentLocation(latDiff < tolerance && lngDiff < tolerance);
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

        // If saved location doesn't have a name, try to get it via reverse geocoding
        if (!location.name && location.latitude && location.longitude) {
          const name = await reverseGeocode(
            location.latitude,
            location.longitude
          );
          // If we got a name, update the saved location with it
          if (name) {
            try {
              await AsyncStorage.setItem(
                SAVED_LOCATION_KEY,
                JSON.stringify({ ...location, name })
              );
            } catch (saveError) {
              console.error("Error saving location name:", saveError);
            }
          }
        }
      } else if (currentLocation) {
        // If no saved location, use current location as default
        setLatitude(currentLocation.latitude.toString());
        setLongitude(currentLocation.longitude.toString());
        setLocationName(currentLocation.name || "");

        // If current location doesn't have a name, try to get it
        if (
          !currentLocation.name &&
          currentLocation.latitude &&
          currentLocation.longitude
        ) {
          await reverseGeocode(
            currentLocation.latitude,
            currentLocation.longitude
          );
        }
      }
    } catch (error) {
      console.error("Error loading saved location:", error);
      if (currentLocation) {
        setLatitude(currentLocation.latitude.toString());
        setLongitude(currentLocation.longitude.toString());
        setLocationName(currentLocation.name || "");

        // Try to get name if missing
        if (
          !currentLocation.name &&
          currentLocation.latitude &&
          currentLocation.longitude
        ) {
          await reverseGeocode(
            currentLocation.latitude,
            currentLocation.longitude
          );
        }
      }
    }
  };

  // Reverse geocode coordinates to get location name
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      setGeocoding(true);
      const addresses = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        // Build a friendly location name
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
          "Location permission is required to use your current location."
        );
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const lat = location.coords.latitude;
      const lng = location.coords.longitude;
      setLatitude(lat.toString());
      setLongitude(lng.toString());

      // Get location name
      const name = await reverseGeocode(lat, lng);

      // Automatically save the location
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

  const handleClose = () => {
    onClose();
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.drawerOverlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <Animated.View
          style={[
            styles.drawerContainer,
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
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Location Settings</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.drawerContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Set Default Location</Text>
              <Text style={styles.sectionText}>
                Set a fixed location to use for all astrological calculations.
              </Text>
            </View>

            {/* Display current location name and coordinates */}
            {(locationName || (latitude && longitude)) && (
              <View style={styles.locationNameContainer}>
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

            <View style={styles.section}>
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
                    : "📍 Use Current Location"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  drawerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  drawerContainer: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  drawerTitle: {
    color: "#e6e6fa",
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    color: "#e6e6fa",
    fontSize: 24,
    fontWeight: "bold",
  },
  drawerContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#b19cd9",
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 14,
    color: "#8a8a8a",
    lineHeight: 20,
  },
  listItem: {
    fontSize: 14,
    color: "#e6e6fa",
    marginBottom: 8,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#b19cd9",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 8,
    padding: 12,
    color: "#e6e6fa",
    fontSize: 16,
  },
  inputHint: {
    fontSize: 12,
    color: "#8a8a8a",
    marginTop: 4,
    fontStyle: "italic",
  },
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
  saveButtonText: {
    color: "#fff",
  },
  clearButton: {
    backgroundColor: "#2a1a1a",
    borderColor: "#4a1a1a",
  },
  clearButtonText: {
    color: "#ff6b6b",
  },
  buttonDisabled: {
    opacity: 0.5,
    backgroundColor: "#2a2a2a",
    borderColor: "#333",
  },
  buttonTextDisabled: {
    color: "#8a8a8a",
  },
  locationNameContainer: {
    backgroundColor: "#2a2a2a",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#444",
  },
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
  geocodingContainer: {
    padding: 12,
    marginBottom: 20,
  },
  geocodingText: {
    fontSize: 14,
    color: "#8a8a8a",
    fontStyle: "italic",
  },
});
