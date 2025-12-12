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
const FLOWERS_DRAW_STATE_KEY = "flowers_draw_state";
const CACHE_EXPIRY_HOURS = 24; // Cache for 24 hours

// ============================================================================
// TYPES
// ============================================================================
export interface FlowerCardData {
  id: string;
  flower: FlowerEssence | null; // null means not assigned yet
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
  isFlipped: boolean;
  isDragging: boolean;
  cardBackIndex: number; // Index for random card back selection
  reversed: boolean; // Whether the card is drawn upside down
}

interface FlowersContextType {
  flowers: FlowerEssence[];
  loading: boolean;
  error: string | null;
  refreshFlowers: () => Promise<void>;
  lastUpdated: Date | null;
  isFromCache: boolean;
  // Flower draw state management
  drawState: FlowerCardData[];
  setDrawState: (cards: FlowerCardData[]) => void;
  saveDrawState: () => Promise<void>;
  loadDrawState: () => Promise<FlowerCardData[] | null>;
  clearDrawState: () => Promise<void>;
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
  const [drawState, setDrawState] = useState<FlowerCardData[]>([]);

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

  // ===== DRAW STATE MANAGEMENT =====
  const saveDrawState = async () => {
    try {
      await AsyncStorage.setItem(
        FLOWERS_DRAW_STATE_KEY,
        JSON.stringify(drawState)
      );
      console.log("Flower draw state saved");
    } catch (err) {
      console.error("Error saving draw state:", err);
    }
  };

  const loadDrawState = async (): Promise<FlowerCardData[] | null> => {
    try {
      const saved = await AsyncStorage.getItem(FLOWERS_DRAW_STATE_KEY);
      if (saved) {
        const parsedState: FlowerCardData[] = JSON.parse(saved);
        console.log("Loaded flower draw state:", parsedState.length, "cards");
        return parsedState;
      }
    } catch (err) {
      console.error("Error loading draw state:", err);
    }
    return null;
  };

  const clearDrawState = async () => {
    try {
      await AsyncStorage.removeItem(FLOWERS_DRAW_STATE_KEY);
      setDrawState([]);
      console.log("Flower draw state cleared");
    } catch (err) {
      console.error("Error clearing draw state:", err);
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
    } catch (err: any) {
      console.error("Error loading flowers:", err);
      const errorMessage =
        err?.message || err?.toString() || "Failed to load flowers";
      setError(errorMessage);
      // If it's a database error, log more details
      if (
        err?.status === 503 ||
        errorMessage.includes("Database") ||
        errorMessage.includes("MongoDB")
      ) {
        console.error("Database connection issue detected:", errorMessage);
      }
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
    drawState,
    setDrawState,
    saveDrawState,
    loadDrawState,
    clearDrawState,
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
