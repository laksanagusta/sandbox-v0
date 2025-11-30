import serviceHelper from "./general";

const DESK_API_BASE = `${
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5002"
}/api/v1/desk`;

export const workPaperApi = {
  // Work paper signatures endpoints
  getWorkPaperSignatures: async (options?: {
    page?: number;
    limit?: number;
    user_id?: string;
  }): Promise<any> => {
    const params = new URLSearchParams();

    if (options?.page) params.append("page", options.page.toString());
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.user_id) params.append("user_id", `eq ${options.user_id}`);

    const url = params.toString()
      ? `${DESK_API_BASE}/work-paper-signatures?${params.toString()}`
      : `${DESK_API_BASE}/work-paper-signatures`;

    return serviceHelper.fetchWithErrorHandling(url);
  },
};

export default workPaperApi;
