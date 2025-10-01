import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import * as Location from "expo-location";
import { apiService, PlanetPosition } from "../services/api";

interface CurrentChart {
  planets: {
    sun: PlanetPosition;
    moon: PlanetPosition;
  };
  currentTime: {
    timestamp: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface AstrologyContextType {
  currentChart: CurrentChart | null;
  loading: boolean;
  error: string | null;
  refreshChart: () => Promise<void>;
}

const AstrologyContext = createContext<AstrologyContextType | undefined>(
  undefined
);

interface AstrologyProviderProps {
  children: ReactNode;
}

export function AstrologyProvider({ children }: AstrologyProviderProps) {
  const [currentChart, setCurrentChart] = useState<CurrentChart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      console.error("Error getting location:", err);
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

      const location = await getCurrentLocation();
      const response = await apiService.getCurrentChart(
        location.latitude,
        location.longitude
      );

      if (response.success) {
        setCurrentChart({
          planets: {
            sun: response.data.planets.sun,
            moon: response.data.planets.moon,
          },
          currentTime: {
            timestamp: response.data.currentTime.timestamp,
          },
          location: {
            latitude: response.data.location.latitude,
            longitude: response.data.location.longitude,
          },
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
    await fetchCurrentChart();
  };

  useEffect(() => {
    fetchCurrentChart();
  }, []);

  return (
    <AstrologyContext.Provider
      value={{
        currentChart,
        loading,
        error,
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
