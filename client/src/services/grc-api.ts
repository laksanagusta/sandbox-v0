import {
  GRCOverviewResponse,
  GRCUnitsResponse,
  GRCUnitDetailResponse,
  GRCCategoriesResponse,
} from "../../../shared/types";
import serviceHelper from "./general";
import { getApiBaseUrl } from "@/lib/env";

const GRC_API_BASE = `${getApiBaseUrl()}/api/v1/grc`;

export const grcApi = {
  getOverview: async (): Promise<GRCOverviewResponse> => {
    return serviceHelper.fetchWithErrorHandling(`${GRC_API_BASE}/overview`);
  },

  getUnits: async (options?: {
    category?: string;
    sort_by?: string;
    ascending?: boolean;
    page?: number;
    limit?: number;
  }): Promise<GRCUnitsResponse> => {
    const params = new URLSearchParams();
    if (options?.category) params.append("category", options.category);
    if (options?.sort_by) params.append("sort_by", options.sort_by);
    if (options?.ascending !== undefined)
      params.append("ascending", options.ascending.toString());
    if (options?.page) params.append("page", options.page.toString());
    if (options?.limit) params.append("limit", options.limit.toString());

    const url = `${GRC_API_BASE}/units?${params.toString()}`;
    return serviceHelper.fetchWithErrorHandling(url);
  },

  getUnitDetail: async (id: number | string): Promise<GRCUnitDetailResponse> => {
    return serviceHelper.fetchWithErrorHandling(`${GRC_API_BASE}/units/${id}`);
  },

  getComparison: async (ids: (number | string)[]): Promise<any> => {
    const params = new URLSearchParams();
    params.append("ids", ids.join(","));
    return serviceHelper.fetchWithErrorHandling(
      `${GRC_API_BASE}/compare?${params.toString()}`
    );
  },

  getCategories: async (): Promise<GRCCategoriesResponse> => {
    return serviceHelper.fetchWithErrorHandling(`${GRC_API_BASE}/categories`);
  },
};

export default grcApi;
