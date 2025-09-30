// API configuration
const API_BASE_URL = "http://192.168.0.42:3000/api";

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
}

// Export a singleton instance
export const apiService = new ApiService();
export default apiService;
