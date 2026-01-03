import { getApiBaseUrl } from "@/lib/env";

const DESK_API_BASE = `${getApiBaseUrl()}/api/v1/desk`;

// Types
export interface WorkPaperTopic {
  id: string;
  name: string;
  description?: string;
  template_path?: string;
  template_version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ListTopicsResponse {
  data: WorkPaperTopic[];
  pagination: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  };
}

export interface ActiveTopicsResponse {
  data: WorkPaperTopic[];
}

export interface CreateTopicRequest {
  name: string;
  description?: string;
}

export interface UpdateTopicRequest {
  name: string;
  description?: string;
  is_active?: boolean;
}

// Helper function for authenticated requests
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("auth_token");
  if (!token) {
    throw new Error("Token tidak ditemukan. Silakan login kembali.");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
      window.location.href = "/login";
      throw new Error("Sesi Anda telah berakhir. Silakan login kembali.");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed: ${response.status}`);
  }

  return response.json();
};

export const workPaperTopicApi = {
  // List topics with pagination
  getTopics: async (options?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ListTopicsResponse> => {
    const params = new URLSearchParams();

    if (options?.page) params.append("page", options.page.toString());
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.search) params.append("search", options.search);

    const url = params.toString()
      ? `${DESK_API_BASE}/work-paper-topics?${params.toString()}`
      : `${DESK_API_BASE}/work-paper-topics`;

    return fetchWithAuth(url);
  },

  // Get all active topics (for dropdowns)
  getActiveTopics: async (): Promise<ActiveTopicsResponse> => {
    return fetchWithAuth(`${DESK_API_BASE}/work-paper-topics/active`);
  },

  // Get single topic by ID
  getTopic: async (id: string): Promise<{ data: WorkPaperTopic }> => {
    return fetchWithAuth(`${DESK_API_BASE}/work-paper-topics/${id}`);
  },

  // Create new topic
  createTopic: async (data: CreateTopicRequest): Promise<{ data: WorkPaperTopic }> => {
    return fetchWithAuth(`${DESK_API_BASE}/work-paper-topics`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Update topic
  updateTopic: async (id: string, data: UpdateTopicRequest): Promise<{ data: WorkPaperTopic }> => {
    return fetchWithAuth(`${DESK_API_BASE}/work-paper-topics/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Delete topic (soft delete)
  deleteTopic: async (id: string): Promise<void> => {
    return fetchWithAuth(`${DESK_API_BASE}/work-paper-topics/${id}`, {
      method: "DELETE",
    });
  },

  // Upload topic template (Excel file)
  uploadTopicTemplate: async (id: string, file: File): Promise<{ data: WorkPaperTopic }> => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      throw new Error("Token tidak ditemukan. Silakan login kembali.");
    }

    const formData = new FormData();
    formData.append("template", file);

    const response = await fetch(`${DESK_API_BASE}/work-paper-topics/${id}/template`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_data");
        window.location.href = "/login";
        throw new Error("Sesi Anda telah berakhir. Silakan login kembali.");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Upload failed: ${response.status}`);
    }

    return response.json();
  },

  // Download topic template
  downloadTopicTemplate: async (id: string): Promise<Blob> => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      throw new Error("Token tidak ditemukan. Silakan login kembali.");
    }

    const response = await fetch(`${DESK_API_BASE}/work-paper-topics/${id}/template`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_data");
        window.location.href = "/login";
        throw new Error("Sesi Anda telah berakhir. Silakan login kembali.");
      }
      if (response.status === 404) {
        throw new Error("Template tidak ditemukan.");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Download failed: ${response.status}`);
    }

    return response.blob();
  },

  // Delete topic template
  deleteTopicTemplate: async (id: string): Promise<void> => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      throw new Error("Token tidak ditemukan. Silakan login kembali.");
    }

    const response = await fetch(`${DESK_API_BASE}/work-paper-topics/${id}/template`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_data");
        window.location.href = "/login";
        throw new Error("Sesi Anda telah berakhir. Silakan login kembali.");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Delete failed: ${response.status}`);
    }
  },
};

export default workPaperTopicApi;
