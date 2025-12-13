import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  apiService,
  PlanetPosition as ApiPlanetPosition,
} from "../services/api";

interface CurrentChart {
  planets: Record<string, ApiPlanetPosition>;
  currentTime: {
    timestamp: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  houses?: {
    cusps: number[];
    ascendant: number;
    ascendantSign: string;
    ascendantDegree: string;
    mc: number;
    mcSign: string;
    mcDegree: string;
    armc: number;
    vertex: number;
    equatorialAscendant: number;
    coAscendant: number;
    polarAscendant: number;
    houseSystem: string;
  };
}

interface AstrologyContextType {
  currentChart: CurrentChart | null;
  loading: boolean;
  error: string | null;
  refreshLoading: boolean;
  refreshError: string | null;
  refreshChart: () => Promise<void>;
}

const AstrologyContext = createContext<AstrologyContextType | undefined>(
  undefined
);

interface AstrologyProviderProps {
  children: ReactNode;
}

const SAVED_LOCATION_KEY = "savedLocation";

export function AstrologyProvider({ children }: AstrologyProviderProps) {
  const [currentChart, setCurrentChart] = useState<CurrentChart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  // Get location: saved location takes priority, otherwise use current GPS location
  // On first startup, automatically save the current GPS location
  const getLocation = async (): Promise<{
    latitude: number;
    longitude: number;
  }> => {
    try {
      // First check for saved location
      const saved = await AsyncStorage.getItem(SAVED_LOCATION_KEY);
      if (saved) {
        const location = JSON.parse(saved);
        console.log("Using saved location:", location);
        return location;
      }

      // If no saved location, get current GPS location and save it automatically
      const currentLocation = await getCurrentLocation();

      // Only save if we got a valid GPS location (not the fallback)
      // Check if it's not the default New York coordinates
      if (
        currentLocation.latitude !== 40.7128 ||
        currentLocation.longitude !== -74.006
      ) {
        try {
          // Try to get location name via reverse geocoding
          let locationName = "";
          try {
            const addresses = await Location.reverseGeocodeAsync({
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            });
            if (addresses && addresses.length > 0) {
              const address = addresses[0];
              const parts: string[] = [];
              if (address.city) parts.push(address.city);
              if (address.region) parts.push(address.region);
              if (address.country) parts.push(address.country);
              locationName = parts.length > 0 ? parts.join(", ") : "";
            }
          } catch (geocodeError) {
            console.error(
              "Error reverse geocoding on first startup:",
              geocodeError
            );
            // Continue without name - it can be added later
          }

          const locationToSave = {
            ...currentLocation,
            name: locationName,
          };
          await AsyncStorage.setItem(
            SAVED_LOCATION_KEY,
            JSON.stringify(locationToSave)
          );
          console.log(
            "Auto-saved current location on first startup:",
            locationToSave
          );
        } catch (saveError) {
          console.error("Error auto-saving location:", saveError);
          // Continue anyway - we'll use the location even if save fails
        }
      }

      return currentLocation;
    } catch (err) {
      console.error("Error getting location:", err);
      // Fallback to default location (New York)
      return {
        latitude: 40.7128,
        longitude: -74.006,
      };
    }
  };

  const getCurrentLocation = async (): Promise<{
    latitude: number;
    longitude: number;
  }> => {
    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Location permission denied");
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (err) {
      console.error("Error getting current location:", err);
      // Fallback to default location (New York)
      return {
        latitude: 40.7128,
        longitude: -74.006,
      };
    }
  };

  const fetchCurrentChart = async () => {
    try {
      setLoading(true);
      setError(null);

      const location = await getLocation();
      const response = await apiService.getCurrentChart(
        location.latitude,
        location.longitude
      );

      if (response.success) {
        setCurrentChart({
          planets: response.data.planets,
          currentTime: {
            timestamp: response.data.currentTime.timestamp,
          },
          location: {
            latitude: response.data.location.latitude,
            longitude: response.data.location.longitude,
          },
          houses: response.data.houses,
        });
      } else {
        setError("Failed to fetch current chart");
      }
    } catch (err) {
      console.error("Error fetching current chart:", err);
      setError("Failed to connect to astrology service");
    } finally {
      setLoading(false);
    }
  };

  const refreshChart = async () => {
    try {
      setRefreshLoading(true);
      setRefreshError(null);

      const location = await getLocation();
      const response = await apiService.getCurrentChart(
        location.latitude,
        location.longitude
      );

      if (response.success) {
        setCurrentChart({
          planets: response.data.planets,
          currentTime: {
            timestamp: response.data.currentTime.timestamp,
          },
          location: {
            latitude: response.data.location.latitude,
            longitude: response.data.location.longitude,
          },
          houses: response.data.houses,
        });
      } else {
        setRefreshError("Failed to refresh chart data");
      }
    } catch (err) {
      console.error("Error refreshing chart:", err);
      setRefreshError("Connection error - using previous data");
    } finally {
      setRefreshLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentChart();

    // Set up automatic refresh every 5 minutes
    const interval = setInterval(() => {
      fetchCurrentChart();
    }, 5 * 60 * 1000); // 5 minutes in milliseconds

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <AstrologyContext.Provider
      value={{
        currentChart,
        loading,
        error,
        refreshLoading,
        refreshError,
        refreshChart,
      }}
    >
      {children}
    </AstrologyContext.Provider>
  );
}

export function useAstrology() {
  const context = useContext(AstrologyContext);
  if (context === undefined) {
    throw new Error("useAstrology must be used within an AstrologyProvider");
  }
  return context;
}
