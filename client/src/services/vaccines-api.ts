import { CountriesResponse, VaccineRecommendationResponse } from "../../../shared/types";

const VACCINES_API_BASE = "http://localhost:5002/api/v1/vaccines";

// Get token from localStorage or context
const getAuthToken = (): string => {
  const authData = localStorage.getItem("authData");
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      return parsed.token || "";
    } catch {
      return "";
    }
  }
  return "";
};

// Generic fetch function with error handling
const fetchWithErrorHandling = async (url: string, options?: RequestInit) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API call failed:", error);
    throw error;
  }
};

export const vaccinesApi = {
  // Get countries with optional search and pagination
  getCountries: async (
    options?: {
      limit?: number;
      page?: number;
      search?: string;
    }
  ): Promise<CountriesResponse> => {
    const params = new URLSearchParams();

    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.page) params.append('page', options.page.toString());
    if (options?.search) {
      // Search both Indonesian and English country names
      params.append('country_name_id', `ilike ${options.search}`);
    }

    const url = params.toString()
      ? `${VACCINES_API_BASE}/countries?${params.toString()}`
      : `${VACCINES_API_BASE}/countries`;

    return fetchWithErrorHandling(url);
  },

  // Get vaccine recommendations for a specific country
  getVaccineRecommendations: async (
    countryCode: string,
    language: string = "en"
  ): Promise<VaccineRecommendationResponse> => {
    return fetchWithErrorHandling(
      `${VACCINES_API_BASE}/recommendations/${countryCode}?language=${language}`
    );
  },
};

export default vaccinesApi;