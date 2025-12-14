import {
  CountriesResponse,
  VaccineRecommendationResponse,
} from "../../../shared/types";
import serviceHelper from "./general";
import { getApiBaseUrl } from "@/lib/env";

const VACCINES_API_BASE = `${getApiBaseUrl()}/api/v1/vaccines`;

export const vaccinesApi = {
  // Get countries with optional search and pagination
  getCountries: async (options?: {
    limit?: number;
    page?: number;
    search?: string;
  }): Promise<CountriesResponse> => {
    const params = new URLSearchParams();

    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.page) params.append("page", options.page.toString());
    if (options?.search) {
      // Search both Indonesian and English country names
      params.append("country_name_id", `ilike ${options.search}`);
    }

    const url = params.toString()
      ? `${VACCINES_API_BASE}/countries?${params.toString()}`
      : `${VACCINES_API_BASE}/countries`;

    return serviceHelper.fetchWithErrorHandling(url);
  },

  // Get vaccine recommendations for a specific country
  getVaccineRecommendations: async (
    countryCode: string,
    language: string = "en"
  ): Promise<VaccineRecommendationResponse> => {
    return serviceHelper.fetchWithErrorHandling(
      `${VACCINES_API_BASE}/recommendations/${countryCode}?language=${language}`
    );
  },
};

export default vaccinesApi;
