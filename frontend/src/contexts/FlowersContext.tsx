// ============================================================================
// IMPORTS
// ============================================================================
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiService, FlowerEssence } from "../services/api";

// ============================================================================
// CONSTANTS
// ============================================================================
const FLOWERS_CACHE_KEY = "flowers_cache";
const CACHE_EXPIRY_HOURS = 24; // Cache for 24 hours

// ============================================================================
// TYPES
// ============================================================================
interface FlowersContextType {
  flowers: FlowerEssence[];
  loading: boolean;
  error: string | null;
  refreshFlowers: () => Promise<void>;
  lastUpdated: Date | null;
  isFromCache: boolean;
}

interface CachedFlowers {
  data: FlowerEssence[];
  timestamp: number;
}

// ============================================================================
// CONTEXT
// ============================================================================
const FlowersContext = createContext<FlowersContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================
interface FlowersProviderProps {
  children: ReactNode;
}

export function FlowersProvider({ children }: FlowersProviderProps) {
  const [flowers, setFlowers] = useState<FlowerEssence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  const isCacheValid = (timestamp: number): boolean => {
    const now = Date.now();
    const cacheAge = now - timestamp;
    const maxAge = CACHE_EXPIRY_HOURS * 60 * 60 * 1000; // Convert hours to milliseconds
    return cacheAge < maxAge;
  };

  const loadFlowersFromCache = async (): Promise<FlowerEssence[] | null> => {
    try {
      const cached = await AsyncStorage.getItem(FLOWERS_CACHE_KEY);
      if (cached) {
        const parsedCache: CachedFlowers = JSON.parse(cached);
        if (isCacheValid(parsedCache.timestamp)) {
          console.log("Loading flowers from cache");
          return parsedCache.data;
        } else {
          console.log("Cache expired, will fetch fresh data");
        }
      }
    } catch (err) {
      console.error("Error loading from cache:", err);
    }
    return null;
  };

  const saveFlowersToCache = async (data: FlowerEssence[]) => {
    try {
      const cacheData: CachedFlowers = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(FLOWERS_CACHE_KEY, JSON.stringify(cacheData));
      console.log("Flowers saved to cache");
    } catch (err) {
      console.error("Error saving to cache:", err);
    }
  };

  const loadFlowers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to load from cache first
      const cachedFlowers = await loadFlowersFromCache();
      if (cachedFlowers) {
        setFlowers(cachedFlowers);
        setLastUpdated(new Date());
        setIsFromCache(true);
        setLoading(false);
        return;
      }

      // If no valid cache, fetch from API
      console.log("Fetching flowers from API");
      const response = await apiService.getFlowerEssences("", 1, 200);
      setFlowers(response.data);
      setLastUpdated(new Date());
      setIsFromCache(false);

      // Save to cache
      await saveFlowersToCache(response.data);
    } catch (err) {
      console.error("Error loading flowers:", err);
      setError("Failed to load flowers");
    } finally {
      setLoading(false);
    }
  };

  const refreshFlowers = async () => {
    // Force refresh by clearing cache and loading fresh data
    try {
      await AsyncStorage.removeItem(FLOWERS_CACHE_KEY);
    } catch (err) {
      console.error("Error clearing cache:", err);
    }
    await loadFlowers();
  };

  // Load flowers immediately on mount (preload)
  useEffect(() => {
    loadFlowers();
  }, []);

  const value: FlowersContextType = {
    flowers,
    loading,
    error,
    refreshFlowers,
    lastUpdated,
    isFromCache,
  };

  return (
    <FlowersContext.Provider value={value}>{children}</FlowersContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================
export function useFlowers() {
  const context = useContext(FlowersContext);
  if (context === undefined) {
    throw new Error("useFlowers must be used within a FlowersProvider");
  }
  return context;
}
