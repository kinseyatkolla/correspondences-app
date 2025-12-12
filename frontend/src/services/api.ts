// API configuration
import Constants from "expo-constants";

// Helper function to extract IP from various Expo Constants sources
function extractIpFromHost(host: string | undefined | null): string | null {
  if (!host) return null;

  // Remove protocol if present (exp://, http://, https://, etc.)
  const cleanHost = host.replace(/^[^:]+:\/\//, "");
  // Extract IP (everything before the port)
  const ip = cleanHost.split(":")[0];

  // Validate it's a proper IP address
  if (
    ip &&
    ip !== "localhost" &&
    ip !== "127.0.0.1" &&
    ip.match(/^\d+\.\d+\.\d+\.\d+$/)
  ) {
    return ip;
  }
  return null;
}

// Helper function to get the local IP address from Expo
function getLocalApiUrl(): string {
  // If environment variable is set, use it (required for production builds)
  if (process.env.EXPO_PUBLIC_API_URL) {
    if (__DEV__) {
      console.log(
        `📍 Using API URL from environment: ${process.env.EXPO_PUBLIC_API_URL}`
      );
    }
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // In production, EXPO_PUBLIC_API_URL must be set
  if (!__DEV__) {
    throw new Error(
      "EXPO_PUBLIC_API_URL environment variable is required for production builds. " +
        "Please set it in your eas.json build configuration."
    );
  }

  // Development-only: Try multiple methods to get the IP address
  const possibleHosts = [
    Constants.expoConfig?.hostUri,
    Constants.manifest?.hostUri,
    Constants.manifest2?.extra?.expoGo?.debuggerHost,
    // @ts-ignore - debuggerHost might exist
    Constants.debuggerHost,
  ];

  for (const host of possibleHosts) {
    const ip = extractIpFromHost(host);
    if (ip) {
      console.log(`📍 Detected local IP: ${ip} (from ${host})`);
      return `http://${ip}:3000/api`;
    }
  }

  // Debug: Log what Constants contains (for troubleshooting)
  console.log("🔍 Constants debug info:", {
    hasExpoConfig: !!Constants.expoConfig,
    hasManifest: !!Constants.manifest,
    hasManifest2: !!Constants.manifest2,
    expoConfigHostUri: Constants.expoConfig?.hostUri,
    manifestHostUri: Constants.manifest?.hostUri,
  });

  // Last resort fallback for development only
  console.warn(
    "⚠️ Could not detect local IP. Using fallback. " +
      "To fix this:\n" +
      "1. Find your computer's IP address (run: ifconfig on Mac/Linux or ipconfig on Windows)\n" +
      "2. Set EXPO_PUBLIC_API_URL environment variable: EXPO_PUBLIC_API_URL=http://YOUR_IP:3000/api\n" +
      "3. Or update the fallback IP in src/services/api.ts"
  );
  return "http://192.168.0.103:3000/api";
}

const API_BASE_URL = getLocalApiUrl();

// Log the API URL being used (only in development)
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
  uprightMeaning: string;
  reversedMeaning: string;
  description: string;
  astrologicalCorrespondence?: string;
  element?: string;
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

export interface LibraryItem {
  _id: string;
  name: string;
  sourceUrl?: string;
  image?: string;
  isbn?: string;
  description?: string;
  author?: string;
  publisher?: string;
  year?: number;
  mediaType:
    | "book"
    | "videolink"
    | "audiolink"
    | "article"
    | "website"
    | "other";
  createdAt: string;
  updatedAt: string;
}

export interface ISBNBookData {
  title: string;
  authors: string[];
  publisher: string;
  publishedDate: string;
  description: string;
  isbn: string;
  pageCount: number;
  categories: string[];
  imageLinks?: {
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
  };
  language: string;
  previewLink?: string;
}

export interface BookOfShadowsCorrespondence {
  _id: string;
  type: string;
  name: string;
  relationship: string;
  system: string;
  strength: string;
}

export interface BookOfShadowsEntry {
  _id: string;
  name: string;
  description: string;
  image?: string;
  wikiName?: string;
  category:
    | "number"
    | "color"
    | "element"
    | "planet"
    | "zodiacSign"
    | "house"
    | "modality"
    | "weekday"
    | "season"
    | "aspect"
    | "decan"
    | "tarotCard"
    | "flowerEssence"
    | "crystal"
    | "metal"
    | "symbol"
    | "other";
  references: BookOfShadowsEntry[];
  content?: string;
  keywords?: string[];
  correspondences?: BookOfShadowsCorrespondence[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// API service class
class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Generic fetch method with error handling
  private async fetchData<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      if (__DEV__) {
        console.log(`📡 API Request: ${options.method || "GET"} ${url}`);
      }

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
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
            `   4. Your firewall allows connections on port 3000`
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
    correspondence: Omit<Correspondence, "id">
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
    contact: Omit<Contact, "id">
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
    limit = 50
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
    flowerEssence: Omit<FlowerEssence, "_id" | "createdAt" | "updatedAt">
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
    >
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
    limit = 50
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
    tarotCard: Omit<TarotCard, "_id" | "createdAt" | "updatedAt">
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
    tarotCard: Partial<Omit<TarotCard, "_id" | "createdAt" | "updatedAt">>
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
      body: JSON.stringify(birthData),
    });
  }

  async getBirthChart(birthData: BirthData): Promise<{
    success: boolean;
    data: BirthChart;
  }> {
    return this.fetchData("/astrology/chart", {
      method: "POST",
      body: JSON.stringify(birthData),
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
    }
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
    const requestBody = { latitude, longitude };
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

  // Library API
  async getLibraryItems(
    search?: string,
    type?: string,
    page = 1,
    limit = 50
  ): Promise<{
    success: boolean;
    data: LibraryItem[];
    pagination: {
      current: number;
      pages: number;
      total: number;
    };
  }> {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (type) params.append("type", type);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    return this.fetchData(`/library?${params.toString()}`);
  }

  async getLibraryItem(id: string): Promise<{
    success: boolean;
    data: LibraryItem;
  }> {
    return this.fetchData(`/library/${id}`);
  }

  async getRandomLibraryItem(): Promise<{
    success: boolean;
    data: LibraryItem;
  }> {
    return this.fetchData("/library/random");
  }

  async createLibraryItem(
    libraryItem: Omit<LibraryItem, "_id" | "createdAt" | "updatedAt">
  ): Promise<{
    success: boolean;
    data: LibraryItem;
    message: string;
  }> {
    return this.fetchData("/library", {
      method: "POST",
      body: JSON.stringify(libraryItem),
    });
  }

  async updateLibraryItem(
    id: string,
    libraryItem: Partial<Omit<LibraryItem, "_id" | "createdAt" | "updatedAt">>
  ): Promise<{
    success: boolean;
    data: LibraryItem;
    message: string;
  }> {
    return this.fetchData(`/library/${id}`, {
      method: "PUT",
      body: JSON.stringify(libraryItem),
    });
  }

  async deleteLibraryItem(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.fetchData(`/library/${id}`, {
      method: "DELETE",
    });
  }

  // Book of Shadows API
  async getBookOfShadowsEntries(
    search?: string,
    category?: string,
    page = 1,
    limit = 50
  ): Promise<{
    success: boolean;
    data: BookOfShadowsEntry[];
    pagination: {
      current: number;
      pages: number;
      total: number;
    };
  }> {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (category) params.append("category", category);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    return this.fetchData(`/book-of-shadows?${params.toString()}`);
  }

  async getBookOfShadowsEntry(id: string): Promise<{
    success: boolean;
    data: BookOfShadowsEntry;
  }> {
    return this.fetchData(`/book-of-shadows/${id}`);
  }

  async getRandomBookOfShadowsEntry(): Promise<{
    success: boolean;
    data: BookOfShadowsEntry;
  }> {
    return this.fetchData("/book-of-shadows/random");
  }

  async getBookOfShadowsCategories(): Promise<{
    success: boolean;
    data: string[];
  }> {
    return this.fetchData("/book-of-shadows/categories");
  }

  async createBookOfShadowsEntry(
    bosEntry: Omit<BookOfShadowsEntry, "_id" | "createdAt" | "updatedAt">
  ): Promise<{
    success: boolean;
    data: BookOfShadowsEntry;
    message: string;
  }> {
    return this.fetchData("/book-of-shadows", {
      method: "POST",
      body: JSON.stringify(bosEntry),
    });
  }

  async updateBookOfShadowsEntry(
    id: string,
    bosEntry: Partial<
      Omit<BookOfShadowsEntry, "_id" | "createdAt" | "updatedAt">
    >
  ): Promise<{
    success: boolean;
    data: BookOfShadowsEntry;
    message: string;
  }> {
    return this.fetchData(`/book-of-shadows/${id}`, {
      method: "PUT",
      body: JSON.stringify(bosEntry),
    });
  }

  async deleteBookOfShadowsEntry(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.fetchData(`/book-of-shadows/${id}`, {
      method: "DELETE",
    });
  }

  // ISBN Lookup API
  async lookupISBN(isbn: string): Promise<{
    success: boolean;
    data: ISBNBookData;
    message?: string;
  }> {
    return this.fetchData(`/library/lookup-isbn/${isbn}`);
  }

  // Book Search API - search by title, author, and/or ISBN
  async searchBooks(params: {
    title?: string;
    author?: string;
    isbn?: string;
  }): Promise<{
    success: boolean;
    data: ISBNBookData[];
    message?: string;
  }> {
    const queryParams = new URLSearchParams();
    if (params.title && params.title.trim())
      queryParams.append("title", params.title.trim());
    if (params.author && params.author.trim())
      queryParams.append("author", params.author.trim());
    if (params.isbn && params.isbn.trim())
      queryParams.append("isbn", params.isbn.trim());

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/library/search-book?${queryString}`
      : "/library/search-book";

    return this.fetchData(endpoint);
  }

  // Wikipedia API
  async getWikipediaSummary(searchTerm: string): Promise<{
    success: boolean;
    data: {
      title: string;
      description?: string;
      extract: string;
      expandedExtract?: string;
      extract_html?: string;
      url: string;
      thumbnail?: string;
      thumbnailWidth?: number;
      thumbnailHeight?: number;
      originalimage?: string;
      originalimageWidth?: number;
      originalimageHeight?: number;
      coordinates?: {
        lat: number;
        lon: number;
      };
      section?: {
        title: string;
        content: string;
        anchor: string;
      };
      redirect?: {
        from: string;
        to: string;
      };
    };
  }> {
    return this.fetchData(
      `/wikipedia/summary?search=${encodeURIComponent(searchTerm)}`
    );
  }

  // OPALE Lunar Phases API (IMCCE)
  async getLunarPhases(
    year: number,
    month: number
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
        `https://opale.imcce.fr/api/v1/phenomena/moonphases?year=${year}&month=${month}`
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
    eclipseType: "lunar" | "solar" = "lunar"
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
        `https://opale.imcce.fr/api/v1/phenomena/eclipses/${eclipseCode}/${year}`
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
          `OPALE Eclipse API found ${eclipseData.length} ${eclipseType} eclipses`
        );
        console.log(
          `OPALE Eclipse API response sample (${eclipseType}):`,
          JSON.stringify(eclipseData[0], null, 2).substring(0, 500)
        );
      } else {
        console.warn(
          `OPALE Eclipse API returned no ${eclipseType} eclipse data for year ${year}`
        );
        console.log(
          "Full API response:",
          JSON.stringify(data, null, 2).substring(0, 1000)
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
    sampleInterval?: number
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
    const requestBody: any = { year };
    if (latitude !== undefined) requestBody.latitude = latitude;
    if (longitude !== undefined) requestBody.longitude = longitude;
    if (sampleInterval !== undefined)
      requestBody.sampleInterval = sampleInterval;

    const response = await this.fetchData("/astrology/year-ephemeris", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    // Convert date strings back to Date objects for samples (if present)
    if (response.success && response.data?.samples) {
      response.data.samples = response.data.samples.map((sample: any) => ({
        ...sample,
        date: new Date(sample.timestamp),
      }));
    }

    return response;
  }
}

// Export a singleton instance
export const apiService = new ApiService();
export default apiService;
