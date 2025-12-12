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
import { apiService, TarotCard } from "../services/api";

// ============================================================================
// CONSTANTS
// ============================================================================
const TAROT_CACHE_KEY = "tarot_cache";
const TAROT_DRAW_STATE_KEY = "tarot_draw_state";
const CACHE_EXPIRY_HOURS = 24; // Cache for 24 hours

// ============================================================================
// TYPES
// ============================================================================
export interface CardData {
  id: string;
  tarotCard: TarotCard | null; // null means not assigned yet
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
  isFlipped: boolean;
  isDragging: boolean;
}

interface TarotContextType {
  tarotCards: TarotCard[];
  loading: boolean;
  error: string | null;
  refreshTarotCards: () => Promise<void>;
  lastUpdated: Date | null;
  isFromCache: boolean;
  // Tarot draw state management
  drawState: CardData[];
  setDrawState: (cards: CardData[]) => void;
  saveDrawState: () => Promise<void>;
  loadDrawState: () => Promise<CardData[] | null>;
  clearDrawState: () => Promise<void>;
}

interface CachedTarotCards {
  data: TarotCard[];
  timestamp: number;
}

// ============================================================================
// CONTEXT
// ============================================================================
const TarotContext = createContext<TarotContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================
interface TarotProviderProps {
  children: ReactNode;
}

export function TarotProvider({ children }: TarotProviderProps) {
  const [tarotCards, setTarotCards] = useState<TarotCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [drawState, setDrawState] = useState<CardData[]>([]);

  const isCacheValid = (timestamp: number): boolean => {
    const now = Date.now();
    const cacheAge = now - timestamp;
    const maxAge = CACHE_EXPIRY_HOURS * 60 * 60 * 1000; // Convert hours to milliseconds
    return cacheAge < maxAge;
  };

  const loadTarotCardsFromCache = async (): Promise<TarotCard[] | null> => {
    try {
      const cached = await AsyncStorage.getItem(TAROT_CACHE_KEY);
      if (cached) {
        const parsedCache: CachedTarotCards = JSON.parse(cached);
        console.log(
          "TarotContext - Cache found with",
          parsedCache.data.length,
          "cards"
        );
        if (
          isCacheValid(parsedCache.timestamp) &&
          parsedCache.data.length > 0
        ) {
          console.log("Loading tarot cards from cache");
          return parsedCache.data;
        } else if (parsedCache.data.length === 0) {
          console.log("Cache contains empty data, will fetch fresh data");
        } else {
          console.log("Cache expired, will fetch fresh data");
        }
      } else {
        console.log("TarotContext - No cache found");
      }
    } catch (err) {
      console.error("Error loading from cache:", err);
    }
    return null;
  };

  const saveTarotCardsToCache = async (data: TarotCard[]) => {
    try {
      const cacheData: CachedTarotCards = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(TAROT_CACHE_KEY, JSON.stringify(cacheData));
      console.log("Tarot cards saved to cache");
    } catch (err) {
      console.error("Error saving to cache:", err);
    }
  };

  // ===== DRAW STATE MANAGEMENT =====
  const saveDrawState = async () => {
    try {
      await AsyncStorage.setItem(
        TAROT_DRAW_STATE_KEY,
        JSON.stringify(drawState)
      );
      console.log("Tarot draw state saved");
    } catch (err) {
      console.error("Error saving draw state:", err);
    }
  };

  const loadDrawState = async (): Promise<CardData[] | null> => {
    try {
      const saved = await AsyncStorage.getItem(TAROT_DRAW_STATE_KEY);
      if (saved) {
        const parsedState: CardData[] = JSON.parse(saved);
        console.log("Loaded tarot draw state:", parsedState.length, "cards");
        return parsedState;
      }
    } catch (err) {
      console.error("Error loading draw state:", err);
    }
    return null;
  };

  const clearDrawState = async () => {
    try {
      await AsyncStorage.removeItem(TAROT_DRAW_STATE_KEY);
      setDrawState([]);
      console.log("Tarot draw state cleared");
    } catch (err) {
      console.error("Error clearing draw state:", err);
    }
  };

  const loadTarotCards = async () => {
    try {
      console.log("TarotContext - Starting to load tarot cards");
      setLoading(true);
      setError(null);

      // Try to load from cache first
      const cachedTarotCards = await loadTarotCardsFromCache();
      if (cachedTarotCards) {
        console.log(
          "TarotContext - Loaded from cache:",
          cachedTarotCards.length,
          "cards"
        );
        setTarotCards(cachedTarotCards);
        setLastUpdated(new Date());
        setIsFromCache(true);
        setLoading(false);
        return;
      }

      // If no valid cache, fetch from API
      console.log("TarotContext - Fetching tarot cards from API");
      const response = await apiService.getTarotCards("", "", 1, 200);
      console.log(
        "TarotContext - API response:",
        response.data.length,
        "cards"
      );
      console.log("TarotContext - Full response:", response);
      setTarotCards(response.data);
      setLastUpdated(new Date());
      setIsFromCache(false);

      // Save to cache
      await saveTarotCardsToCache(response.data);
      console.log("TarotContext - Saved to cache");
    } catch (err: any) {
      console.error("TarotContext - Error loading tarot cards:", err);
      console.error("TarotContext - Error details:", JSON.stringify(err));
      const errorMessage =
        err?.message || err?.toString() || "Failed to load tarot cards";
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
      console.log("TarotContext - Loading complete, final state:", {
        loading: false,
        cardsLength: tarotCards.length,
      });
    }
  };

  const refreshTarotCards = async () => {
    // Force refresh by clearing cache and loading fresh data
    console.log("TarotContext - Force refreshing tarot cards");
    try {
      await AsyncStorage.removeItem(TAROT_CACHE_KEY);
      console.log("TarotContext - Cache cleared");
    } catch (err) {
      console.error("Error clearing cache:", err);
    }
    // Reset state before loading
    setTarotCards([]);
    setLoading(true);
    setError(null);
    await loadTarotCards();
  };

  // Load tarot cards immediately on mount (preload)
  useEffect(() => {
    // Clear any corrupted cache with empty data on startup
    const clearCorruptedCache = async () => {
      try {
        const cached = await AsyncStorage.getItem(TAROT_CACHE_KEY);
        if (cached) {
          const parsedCache: CachedTarotCards = JSON.parse(cached);
          if (parsedCache.data.length === 0) {
            console.log("TarotContext - Clearing corrupted empty cache");
            await AsyncStorage.removeItem(TAROT_CACHE_KEY);
          }
        }
      } catch (err) {
        console.error("Error checking/clearing corrupted cache:", err);
      }
    };

    clearCorruptedCache().then(() => {
      loadTarotCards();
    });
  }, []);

  const value: TarotContextType = {
    tarotCards,
    loading,
    error,
    refreshTarotCards,
    lastUpdated,
    isFromCache,
    drawState,
    setDrawState,
    saveDrawState,
    loadDrawState,
    clearDrawState,
  };

  return (
    <TarotContext.Provider value={value}>{children}</TarotContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================
export function useTarot() {
  const context = useContext(TarotContext);
  if (context === undefined) {
    throw new Error("useTarot must be used within a TarotProvider");
  }
  return context;
}
