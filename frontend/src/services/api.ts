// API configuration
import { API_BASE_URL } from "./apiConfig";

const API_REQUEST_TIMEOUT_MS = 30000;
const YEAR_EPHEMERIS_TIMEOUT_MS = 5 * 60 * 1000;
if (__DEV__) {
  console.log(`🌐 API Base URL: ${API_BASE_URL}`);
}

// Types for our API responses
export interface Correspondence {
  id: string;
  title: string;
  date: string;
  content?: string;
  sender?: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface FlowerEssence {
  _id: string;
  commonName: string;
  latinName: string;
  positiveQualities: string[];
  patternsOfImbalance: string[];
  crossReferences: string[];
  description: string;
  imageName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TarotCard {
  _id: string;
  name: string;
  number: number;
  suit: string;
  keywords: string[];
  keywords2?: string[];
  dotsQuotes?: string;
  description1?: string;
  description2?: string;
  /** Thoth-style or traditional esoteric title */
  esotericTitle?: string;
  /** Decan / minor arcana keyword line */
  decanKeyword?: string;
  description: string;
  astrologicalCorrespondence?: string;
  element?: string;
  /** Seasonal or zodiac date range as free text */
  dates?: string;
  /** Decan label (e.g. first third of a sign) */
  decan?: string;
  imageName?: string;
  isMajorArcana: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BirthData {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
  latitude?: number;
  longitude?: number;
  houseSystem?: string;
}

export interface PlanetPosition {
  longitude: number;
  latitude: number;
  distance: number;
  speed: number;
  zodiacSign: number;
  zodiacSignName: string;
  degree: number;
  degreeFormatted: string;
  symbol: string;
  isRetrograde?: boolean;
  error?: string;
}

export interface HouseData {
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
}

export interface BirthChart {
  julianDay: number;
  inputDate: {
    year: number;
    month: number;
    day: number;
    hour: number;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  planets: Record<string, PlanetPosition>;
  houses: HouseData;
}

export interface ZrPeriod {
  level: number;
  sign: string;
  ruler: string;
  startMs: number;
  endMs: number;
  truncated?: boolean;
  isLoosingOfBond?: boolean;
  isPreLoosingOfBond?: boolean;
  isCulminatingFromFortune?: boolean;
}

export interface EphemerisInfo {
  status: string;
  ephemerisType: string;
  note: string;
  testCalculation: {
    date: string;
    sunLongitude: number;
    fullResult: any;
  };
  planetConstants: Record<string, number>;
}

// API service class
class ApiService {
  private baseUrl: string;
  private yearEphemerisInFlight = new Map<string, Promise<any>>();

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Generic fetch method with error handling
  private async fetchData<T>(
    endpoint: string,
    options: RequestInit & { timeoutMs?: number } = {},
  ): Promise<T> {
    const { timeoutMs = API_REQUEST_TIMEOUT_MS, ...fetchOptions } = options;
    const url = `${this.baseUrl}${endpoint}`;
    try {
      if (__DEV__) {
        console.log(`📡 API Request: ${fetchOptions.method || "GET"} ${url}`);
      }

      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);
      const userSignal = fetchOptions.signal;
      let signal: AbortSignal = timeoutController.signal;
      let combinedAbortCleanup: (() => void) | undefined;
      if (userSignal) {
        if (typeof AbortSignal !== "undefined" && "any" in AbortSignal) {
          signal = (
            AbortSignal as typeof AbortSignal & {
              any: (...s: AbortSignal[]) => AbortSignal;
            }
          ).any([userSignal, timeoutController.signal]);
        } else if (userSignal.aborted) {
          clearTimeout(timeoutId);
          const err = new Error("Election search cancelled");
          err.name = "AbortError";
          throw err;
        } else {
          const combined = new AbortController();
          const onAbort = () => combined.abort();
          userSignal.addEventListener("abort", onAbort);
          timeoutController.signal.addEventListener("abort", onAbort);
          signal = combined.signal;
          combinedAbortCleanup = () => {
            userSignal.removeEventListener("abort", onAbort);
            timeoutController.signal.removeEventListener("abort", onAbort);
          };
        }
      }

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...fetchOptions.headers,
        },
        ...fetchOptions,
        signal,
      }).finally(() => {
        clearTimeout(timeoutId);
        if (combinedAbortCleanup) combinedAbortCleanup();
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If response isn't JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).response = response;
        throw error;
      }

      return await response.json();
    } catch (error) {
      const isAbort =
        (error instanceof Error && error.name === "AbortError") ||
        (typeof error === "object" &&
          error != null &&
          (error as { name?: string }).name === "AbortError");
      if (isAbort) {
        if (fetchOptions.signal?.aborted) {
          const cancelled = new Error("Election search cancelled");
          cancelled.name = "AbortError";
          throw cancelled;
        }
        throw new Error(`Request timed out after ${timeoutMs / 1000}s`);
      }
      console.error(`❌ API Error for ${url}:`, error);
      if (
        error instanceof TypeError &&
        error.message === "Network request failed"
      ) {
        console.error(
          `💡 Network request failed. Make sure:\n` +
            `   1. Your backend server is running on port 3000\n` +
            `   2. Your device is on the same WiFi network as your computer\n` +
            `   3. The API URL is correct: ${this.baseUrl}\n` +
            `   4. Your firewall allows connections on port 3000`,
        );
      }
      throw error;
    }
  }

  // Health check
  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    return this.fetchData("/health");
  }

  // Correspondences API
  async getCorrespondences(): Promise<{
    message: string;
    data: Correspondence[];
  }> {
    return this.fetchData("/correspondences");
  }

  async createCorrespondence(
    correspondence: Omit<Correspondence, "id">,
  ): Promise<{ message: string; data: Correspondence }> {
    return this.fetchData("/correspondences", {
      method: "POST",
      body: JSON.stringify(correspondence),
    });
  }

  // Contacts API (placeholder for future implementation)
  async getContacts(): Promise<{ message: string; data: Contact[] }> {
    return this.fetchData("/contacts");
  }

  async createContact(
    contact: Omit<Contact, "id">,
  ): Promise<{ message: string; data: Contact }> {
    return this.fetchData("/contacts", {
      method: "POST",
      body: JSON.stringify(contact),
    });
  }

  // Flower Essences API
  async getFlowerEssences(
    search?: string,
    page = 1,
    limit = 50,
  ): Promise<{
    success: boolean;
    data: FlowerEssence[];
    pagination: {
      current: number;
      pages: number;
      total: number;
    };
  }> {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    return this.fetchData(`/flower-essences?${params.toString()}`);
  }

  async getFlowerEssence(id: string): Promise<{
    success: boolean;
    data: FlowerEssence;
  }> {
    return this.fetchData(`/flower-essences/${id}`);
  }

  async getRandomFlowerEssence(): Promise<{
    success: boolean;
    data: FlowerEssence;
  }> {
    return this.fetchData("/flower-essences/random");
  }

  async createFlowerEssence(
    flowerEssence: Omit<FlowerEssence, "_id" | "createdAt" | "updatedAt">,
  ): Promise<{
    success: boolean;
    data: FlowerEssence;
    message: string;
  }> {
    return this.fetchData("/flower-essences", {
      method: "POST",
      body: JSON.stringify(flowerEssence),
    });
  }

  async updateFlowerEssence(
    id: string,
    flowerEssence: Partial<
      Omit<FlowerEssence, "_id" | "createdAt" | "updatedAt">
    >,
  ): Promise<{
    success: boolean;
    data: FlowerEssence;
    message: string;
  }> {
    return this.fetchData(`/flower-essences/${id}`, {
      method: "PUT",
      body: JSON.stringify(flowerEssence),
    });
  }

  async deleteFlowerEssence(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.fetchData(`/flower-essences/${id}`, {
      method: "DELETE",
    });
  }

  // Tarot Cards API
  async getTarotCards(
    search?: string,
    suit?: string,
    page = 1,
    limit = 50,
  ): Promise<{
    success: boolean;
    data: TarotCard[];
    pagination: {
      current: number;
      pages: number;
      total: number;
    };
  }> {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (suit) params.append("suit", suit);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    return this.fetchData(`/tarot-cards?${params.toString()}`);
  }

  async getTarotCard(id: string): Promise<{
    success: boolean;
    data: TarotCard;
  }> {
    return this.fetchData(`/tarot-cards/${id}`);
  }

  async getRandomTarotCard(): Promise<{
    success: boolean;
    data: TarotCard;
  }> {
    return this.fetchData("/tarot-cards/random");
  }

  async createTarotCard(
    tarotCard: Omit<TarotCard, "_id" | "createdAt" | "updatedAt">,
  ): Promise<{
    success: boolean;
    data: TarotCard;
    message: string;
  }> {
    return this.fetchData("/tarot-cards", {
      method: "POST",
      body: JSON.stringify(tarotCard),
    });
  }

  async updateTarotCard(
    id: string,
    tarotCard: Partial<Omit<TarotCard, "_id" | "createdAt" | "updatedAt">>,
  ): Promise<{
    success: boolean;
    data: TarotCard;
    message: string;
  }> {
    return this.fetchData(`/tarot-cards/${id}`, {
      method: "PUT",
      body: JSON.stringify(tarotCard),
    });
  }

  async deleteTarotCard(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.fetchData(`/tarot-cards/${id}`, {
      method: "DELETE",
    });
  }

  // Astrology API
  async getPlanetaryPositions(birthData: BirthData): Promise<{
    success: boolean;
    data: {
      julianDay: number;
      inputDate: {
        year: number;
        month: number;
        day: number;
        hour: number;
      };
      planets: Record<string, PlanetPosition>;
    };
  }> {
    return this.fetchData("/astrology/planets", {
      method: "POST",
      body: JSON.stringify(birthData),
    });
  }

  async getHouses(birthData: BirthData): Promise<{
    success: boolean;
    data: {
      julianDay: number;
      inputDate: {
        year: number;
        month: number;
        day: number;
        hour: number;
      };
      location: {
        latitude: number;
        longitude: number;
      };
      houses: HouseData;
    };
  }> {
    return this.fetchData("/astrology/houses", {
      method: "POST",
      body: JSON.stringify({ ...birthData, houseSystem: "W" }),
    });
  }

  async getBirthChart(birthData: BirthData): Promise<{
    success: boolean;
    data: BirthChart;
  }> {
    return this.fetchData("/astrology/chart", {
      method: "POST",
      body: JSON.stringify({ ...birthData, houseSystem: "W" }),
    });
  }

  async getEphemerisInfo(): Promise<{
    success: boolean;
    data: EphemerisInfo;
  }> {
    return this.fetchData("/astrology/ephemeris-info");
  }

  async getCurrentChart(
    latitude: number,
    longitude: number,
    customDate?: {
      year: number;
      month: number;
      day: number;
      hour?: number;
      minute?: number;
      second?: number;
    },
  ): Promise<{
    success: boolean;
    data: {
      julianDay: number;
      currentTime: {
        year: number;
        month: number;
        day: number;
        hour: number;
        timestamp: string;
      };
      location: {
        latitude: number;
        longitude: number;
      };
      planets: Record<string, PlanetPosition>;
      houses: {
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
    };
  }> {
    const requestBody: {
      latitude: number;
      longitude: number;
      year?: number;
      month?: number;
      day?: number;
      hour?: number;
      minute?: number;
      second?: number;
    } = { latitude, longitude };
    if (customDate) {
      requestBody.year = customDate.year;
      requestBody.month = customDate.month;
      requestBody.day = customDate.day;
      if (customDate.hour !== undefined) requestBody.hour = customDate.hour;
      if (customDate.minute !== undefined)
        requestBody.minute = customDate.minute;
      if (customDate.second !== undefined)
        requestBody.second = customDate.second;
    }

    return this.fetchData("/astrology/current-chart", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });
  }

  // OPALE Lunar Phases API (IMCCE)
  async getLunarPhases(
    year: number,
    month: number,
  ): Promise<{
    response: {
      calendar: string;
      timescale: string;
      data: Array<{
        date: string;
        moonPhase: string;
      }>;
    };
  }> {
    try {
      const response = await fetch(
        `https://opale.imcce.fr/api/v1/phenomena/moonphases?year=${year}&month=${month}`,
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("OPALE API Error:", error);
      throw error;
    }
  }

  // OPALE Eclipses API (IMCCE)
  // 301 = Lunar eclipses, 10 = Solar eclipses
  async getEclipses(
    year: number,
    eclipseType: "lunar" | "solar" = "lunar",
  ): Promise<{
    response: {
      calendar: string;
      timescale: string;
      data: Array<{
        date?: string;
        datetime?: string;
        time?: string;
        eclipseType?: string;
        type?: string;
        [key: string]: any;
      }>;
    };
  }> {
    try {
      const eclipseCode = eclipseType === "lunar" ? "301" : "10";
      const response = await fetch(
        `https://opale.imcce.fr/api/v1/phenomena/eclipses/${eclipseCode}/${year}`,
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // The API returns different structures:
      // Lunar eclipses (301): response.lunareclipse (array)
      // Solar eclipses (10): response.data (array)
      let eclipseData: any[] = [];

      if (eclipseType === "lunar") {
        // Lunar eclipses are in response.lunareclipse
        if (
          data?.response?.lunareclipse &&
          Array.isArray(data.response.lunareclipse)
        ) {
          eclipseData = data.response.lunareclipse;
        }
      } else {
        // Solar eclipses are in response.data
        if (data?.response?.data && Array.isArray(data.response.data)) {
          eclipseData = data.response.data;
        }
      }

      if (eclipseData.length > 0) {
        console.log(
          `OPALE Eclipse API found ${eclipseData.length} ${eclipseType} eclipses`,
        );
        console.log(
          `OPALE Eclipse API response sample (${eclipseType}):`,
          JSON.stringify(eclipseData[0], null, 2).substring(0, 500),
        );
      } else {
        console.warn(
          `OPALE Eclipse API returned no ${eclipseType} eclipse data for year ${year}`,
        );
        console.log(
          "Full API response:",
          JSON.stringify(data, null, 2).substring(0, 1000),
        );
      }

      // Return in expected format
      return {
        response: {
          calendar: data.response?.calendar || data.calendar || "gregorian",
          timescale: data.response?.timescale || data.timescale || "utc",
          data: eclipseData,
        },
      };
    } catch (error) {
      console.error("OPALE Eclipses API Error:", error);
      throw error;
    }
  }

  // Get year-long ephemeris data for detecting ingresses and stations
  async getYearEphemeris(
    year: number,
    latitude?: number,
    longitude?: number,
    sampleInterval?: number,
    natalChart?: {
      year: number;
      month: number;
      day: number;
      hour: number;
      minute: number;
      second?: number;
      latitude: number;
      longitude: number;
    },
    options?: {
      moonMode?: boolean;
    },
  ): Promise<{
    success: boolean;
    data: {
      year: number;
      location: { latitude: number; longitude: number };
      sampleInterval: number;
      totalSamples: number;
      events?: Array<{
        type: "ingress" | "station" | "aspect";
        planet?: string;
        fromSign?: string;
        toSign?: string;
        stationType?: "retrograde" | "direct";
        planet1?: string;
        planet2?: string;
        aspectName?: "conjunct" | "opposition" | "square" | "trine" | "sextile";
        utcDateTime: string;
        degree?: number;
        degreeFormatted?: string;
        zodiacSignName?: string;
        isRetrograde?: boolean;
        orb?: number;
        planet1Position?: {
          degree: number;
          degreeFormatted: string;
          zodiacSignName: string;
        };
        planet2Position?: {
          degree: number;
          degreeFormatted: string;
          zodiacSignName: string;
        };
        isNatalTransit?: boolean;
        natalTargetType?: "planet" | "angle";
        natalTargetName?: string;
        refinedByFailsafe?: boolean;
      }>;
      samples?: Array<{
        date: Date;
        julianDay: number;
        timestamp: string;
        planets: Record<
          string,
          {
            longitude: number;
            speed: number;
            zodiacSign: number;
            zodiacSignName: string;
            degree: number;
            degreeFormatted: string;
            isRetrograde: boolean;
          }
        >;
      }>;
    };
  }> {
    type YearEphemerisResponse = Awaited<
      ReturnType<ApiService["getYearEphemeris"]>
    >;
    const requestBody: any = { year };
    if (latitude !== undefined) requestBody.latitude = latitude;
    if (longitude !== undefined) requestBody.longitude = longitude;
    if (sampleInterval !== undefined)
      requestBody.sampleInterval = sampleInterval;
    if (natalChart) requestBody.natalChart = natalChart;
    if (options?.moonMode) requestBody.moonMode = true;

    const inFlightKey = JSON.stringify(requestBody);
    const inFlight = this.yearEphemerisInFlight.get(inFlightKey);
    if (inFlight) {
      return inFlight as Promise<YearEphemerisResponse>;
    }

    const request = (async () => {
      const response = await this.fetchData<YearEphemerisResponse>(
        "/astrology/year-ephemeris",
        {
          method: "POST",
          body: JSON.stringify(requestBody),
          timeoutMs: YEAR_EPHEMERIS_TIMEOUT_MS,
        },
      );

      // Convert date strings back to Date objects for samples (if present)
      if (response.success && response.data?.samples) {
        response.data.samples = response.data.samples.map((sample: any) => ({
          ...sample,
          date: new Date(sample.timestamp),
        }));
      }

      return response;
    })().finally(() => {
      this.yearEphemerisInFlight.delete(inFlightKey);
    });

    this.yearEphemerisInFlight.set(inFlightKey, request);
    return request;
  }

  async fetchMonthlyElectionList(body: {
    latitude: number;
    longitude: number;
    year: number;
    month: number;
      utcOffsetMinutes?: number;
      includeVetoes?: boolean;
    }): Promise<{
    success: boolean;
    data: {
      monthLabel: string;
      year: number;
      month: number;
      bucketCount?: number;
      passedFilterCount?: number;
      filteredOutCount?: number;
      returnedCount?: number;
      vetoedTimes?: Array<{
        isoTime: string;
        dateLabel: string;
        timeLabel: string;
        veto: string;
      }>;
      /** @deprecated use bucketCount */
      eligibleCount?: number;
      notes: string[];
      times: Array<{
        score: number;
        isoTime: string;
        dateLabel: string;
        timeLabel: string;
        risingSign: string;
        isDayChart: boolean;
        chartSect: "day" | "night";
        ascRulerPlanet: string | null;
        ascRulerSign: string | null;
        ascRulerHouse: number | null;
        ascRulerDignity: string | null;
        moonSign: string | null;
        moonHouse: number | null;
        moonDignity: string | null;
        inSectBeneficPlanet: string;
        inSectBeneficSign: string | null;
        inSectBeneficHouse: number | null;
        inSectBeneficDignity: string | null;
        outOfSectMaleficPlanet: string;
        outOfSectMaleficSign: string | null;
        outOfSectMaleficHouse: number | null;
        outOfSectMaleficDignity: string | null;
        chart?: {
          planets: Record<string, PlanetPosition>;
          houses?: HouseData;
        };
        breakdown?: Array<{ id: string; delta: number; label: string }>;
      }>;
    };
  }> {
    return this.fetchData("/astrology/electional-month", {
      method: "POST",
      body: JSON.stringify(body),
      timeoutMs: 5 * 60 * 1000,
    });
  }

  async getNatalLots(
    birthData: BirthData,
    variantByLotId?: Record<string, string>,
  ): Promise<{
    success: boolean;
    data: {
      lots: Record<
        string,
        {
          id: string;
          name: string;
          longitude: number;
          sign: string;
          degreeWithinSign: number;
          wholeSignHouse: number;
          signRuler: string;
          formulaUsed: string;
          isDayChart: boolean;
        }
      >;
      sect: {
        isDayChart: boolean;
        chartSect: "day" | "night";
        sunDistanceToHorizonDeg: number;
        nearSectBoundary: boolean;
      };
    };
  }> {
    return this.fetchData("/astrology/natal-lots", {
      method: "POST",
      body: JSON.stringify({ ...birthData, variantByLotId }),
    });
  }

  async getZodiacalReleasingActive(
    birthData: BirthData,
    options?: { lotId?: string; atMs?: number; atIso?: string },
  ): Promise<{
    success: boolean;
    data: {
      lotId: string;
      releasingSign: string;
      active: {
        l1: ZrPeriod | null;
        l2: ZrPeriod | null;
        l3: ZrPeriod | null;
        l4: ZrPeriod | null;
      };
    };
  }> {
    return this.fetchData("/astrology/zodiacal-releasing/active", {
      method: "POST",
      body: JSON.stringify({ ...birthData, ...options }),
    });
  }

  async getZodiacalReleasingPeriods(
    birthData: BirthData,
    options: {
      level: number;
      lotId?: string;
      fromMs?: number;
      toMs?: number;
      parent?: { startMs: number; endMs: number; sign: string };
    },
  ): Promise<{
    success: boolean;
    data: { level: number; periods: ZrPeriod[] };
  }> {
    return this.fetchData("/astrology/zodiacal-releasing/periods", {
      method: "POST",
      body: JSON.stringify({ ...birthData, ...options }),
    });
  }
}

// Export a singleton instance
export const apiService = new ApiService();
export default apiService;
