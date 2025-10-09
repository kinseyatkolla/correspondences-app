// API configuration
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://192.168.0.103:3000/api";

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

export interface BookOfShadowsEntry {
  _id: string;
  name: string;
  description: string;
  image?: string;
  category:
    | "numbers"
    | "colors"
    | "plants"
    | "planets"
    | "metals"
    | "aspects"
    | "zodiac-signs"
    | "houses"
    | "decans"
    | "moon-phases"
    | "seasons"
    | "weekdays"
    | "equinox-solstices"
    | "tarot"
    | "symbols"
    | "other";
  references: BookOfShadowsEntry[];
  content?: string;
  keywords?: string[];
  correspondences?: string[];
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
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
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
}

// Export a singleton instance
export const apiService = new ApiService();
export default apiService;
