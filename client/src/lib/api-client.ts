interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;
  private identityUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5002";
    this.identityUrl =
      import.meta.env.VITE_API_IDENTITY_URL || "http://localhost:5001";
  }

  private getAuthToken(): string | null {
    return localStorage.getItem("auth_token");
  }

  private handleUnauthorized() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    window.location.href = "/login";
  }

  private buildUrl(endpoint: string, useIdentityApi: boolean = false): string {
    const baseUrl = useIdentityApi ? this.identityUrl : this.baseUrl;
    // Remove leading slash from endpoint to avoid double slashes
    const cleanEndpoint = endpoint.startsWith("/")
      ? endpoint.slice(1)
      : endpoint;
    return `${baseUrl}/${cleanEndpoint}`;
  }

  private async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {},
    useIdentityApi: boolean = false
  ): Promise<T> {
    const { skipAuth = false, ...fetchOptions } = options;

    // Default headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((fetchOptions.headers as Record<string, string>) || {}),
    };

    // Add Authorization header for authenticated requests
    if (!skipAuth) {
      let token = this.getAuthToken();
      
      // Retry mechanism: if no token found, wait a bit and check again
      // This handles race conditions where localStorage might not be immediately available
      if (!token) {
        console.warn("No token found on first attempt, retrying after delay...");
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
        token = this.getAuthToken();
      }
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else {
        // If token is still not found after retry, redirect to login
        console.error("No authentication token found after retry. Redirecting to login.");
        this.handleUnauthorized();
        throw new Error("Authentication required. Please login.");
      }
    }

    const url = this.buildUrl(endpoint, useIdentityApi);

    // Debug logging for authentication
    console.log("ApiClient request:", {
      url,
      method: fetchOptions.method || "GET",
      skipAuth,
      hasAuthHeader: !!headers.Authorization,
      authHeaderValue: headers.Authorization 
        ? `${headers.Authorization.substring(0, 20)}...` 
        : "NOT SET",
      allHeaders: Object.keys(headers),
      token: this.getAuthToken() ? "TOKEN EXISTS" : "NO TOKEN",
    });

    // Log the actual fetch options
    const fetchConfig = {
      ...fetchOptions,
      headers,
    };
    console.log("Fetch config:", {
      url,
      headers: { ...fetchConfig.headers }, // Clone to show actual values
      method: fetchConfig.method || "GET",
    });

    try {
      const response = await fetch(url, fetchConfig);

      // Handle 401 Unauthorized
      if (response.status === 401 && !skipAuth) {
        console.error("Received 401 Unauthorized - Details:", {
          url,
          endpoint,
          hadToken: !!this.getAuthToken(),
          timestamp: new Date().toISOString(),
        });
        const errorBody = await response.text().catch(() => "No error body");
        console.error("401 Response body:", errorBody);
        this.handleUnauthorized();
        throw new Error("Sesi Anda telah berakhir. Silakan login kembali.");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message ||
          `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      // Handle empty responses (e.g., 204 No Content)
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Authentication required")
      ) {
        throw error;
      }
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Auth API methods (no token required)
  async login(username: string, password: string) {
    return this.request(
      "api/public/v1/login",
      {
        method: "POST",
        body: JSON.stringify({ username, password }),
        skipAuth: true,
      },
      true // Use identity API
    );
  }

  // User API methods
  async getWhoami() {
    return this.request("api/v1/users/whoami", {}, true);
  }

  async getUsers(params?: {
    page?: number;
    limit?: number;
    sort?: string;
    search?: string;
  }) {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.sort) searchParams.append("sort", params.sort);
    if (params?.search) searchParams.append("search", params.search);

    const queryString = searchParams.toString();
    const endpoint = `api/v1/users${queryString ? `?${queryString}` : ""}`;

    return this.request(endpoint, {}, true);
  }

  async getOrganizations(params?: {
    page?: number;
    limit?: number;
    sort?: string;
    search?: string;
  }) {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.sort) searchParams.append("sort", params.sort);
    if (params?.search) searchParams.append("search", params.search);

    const queryString = searchParams.toString();
    const endpoint = `api/v1/organizations${
      queryString ? `?${queryString}` : ""
    }`;

    return this.request(endpoint, {}, true);
  }

  // Work Paper API methods
  async getWorkPapers(params?: {
    page?: number;
    limit?: number;
    sort?: string;
    id?: string;
    status?: string;
  }) {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.sort) searchParams.append("sort", params.sort);
    if (params?.id) searchParams.append("id", params.id);
    if (params?.status) searchParams.append("status", params.status);

    const queryString = searchParams.toString();
    const endpoint = `api/v1/desk/work-papers${
      queryString ? `?${queryString}` : ""
    }`;

    return this.request(endpoint);
  }

  async getWorkPaper(id: string) {
    return this.request(`api/v1/desk/work-papers/${id}`);
  }

  async createWorkPaper(data: {
    organization_id: string;
    year: number;
    semester: number;
    signers?: Array<{
      user_id: string;
      user_name: string;
      user_email: string;
      user_role: string;
      signature_type: "digital" | "manual" | "approval";
    }>;
  }) {
    return this.request("api/v1/desk/work-papers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async assignSignersToWorkPaper(
    workPaperId: string,
    signers: Array<{
      user_id: string;
      user_name: string;
      signature_type: "digital" | "manual" | "approval";
    }>
  ) {
    return this.request(
      `api/v1/desk/work-papers/${workPaperId}/assign-signers`,
      {
        method: "POST",
        body: JSON.stringify({ signers }),
      }
    );
  }

  async manageWorkPaperSigners(
    workPaperId: string,
    data: {
      action: "add" | "remove" | "replace";
      signers: Array<{
        user_id: string;
        user_name: string;
        user_email?: string;
        signature_type: "digital" | "manual" | "approval";
      }>;
    }
  ) {
    return this.request(`api/v1/desk/work-papers/${workPaperId}/signers`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async getWorkPaperSignatureStats(workPaperId: string) {
    return this.request(
      `api/v1/desk/work-papers/${workPaperId}/signature-stats`
    );
  }

  async getWorkPaperItems(params?: {
    page?: number;
    limit?: number;
    sort?: string;
    id?: string;
    work_paper_id?: string;
  }) {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.sort) searchParams.append("sort", params.sort);
    if (params?.id) searchParams.append("id", params.id);
    if (params?.work_paper_id)
      searchParams.append("work_paper_id", params.work_paper_id);

    const queryString = searchParams.toString();
    const endpoint = `api/v1/desk/work-paper-items${
      queryString ? `?${queryString}` : ""
    }`;

    return this.request(endpoint);
  }

  async getWorkPaperItem(id: string) {
    return this.request(`api/v1/desk/work-paper-items/${id}`);
  }

  // Business Trip API methods
  async getBusinessTrips(params?: {
    page?: number;
    limit?: number;
    sort?: string;
    activity_purpose?: string;
    status?: string;
  }) {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.sort) searchParams.append("sort", params.sort);
    if (params?.activity_purpose)
      searchParams.append("activity_purpose", params.activity_purpose);
    if (params?.status) searchParams.append("status", params.status);

    const queryString = searchParams.toString();
    const endpoint = `api/v1/business-trips${
      queryString ? `?${queryString}` : ""
    }`;

    return this.request(endpoint);
  }

  async getBusinessTrip(id: string) {
    return this.request(`api/v1/business-trips/${id}`);
  }

  async getBusinessTripWithAssignees(id: string) {
    return this.request(`api/v1/business-trips/${id}/with-assignees`);
  }

  async createBusinessTrip(data: any) {
    return this.request("api/v1/business-trips", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getBusinessTripDashboard(params?: {
    start_date?: string;
    end_date?: string;
    destination?: string;
    status?: string;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();

    if (params?.start_date)
      searchParams.append("start_date", params.start_date);
    if (params?.end_date) searchParams.append("end_date", params.end_date);
    if (params?.destination)
      searchParams.append("destination", params.destination);
    if (params?.status) searchParams.append("status", params.status);
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    const queryString = searchParams.toString();
    const endpoint = `api/v1/business-trips/dashboard${
      queryString ? `?${queryString}` : ""
    }`;

    return this.request(endpoint, {}, false);
  }

  // Vaccines API methods
  async getVaccineCountries(params?: {
    limit?: number;
    page?: number;
    country_name_id?: string;
  }) {
    const searchParams = new URLSearchParams();

    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.country_name_id)
      searchParams.append("country_name_id", params.country_name_id);

    const queryString = searchParams.toString();
    const endpoint = `api/v1/vaccines/countries${
      queryString ? `?${queryString}` : ""
    }`;

    return this.request(endpoint);
  }

  async getVaccineRecommendations(
    countryCode: string,
    language: string = "en"
  ) {
    return this.request(
      `api/v1/vaccines/recommendations/${countryCode}?language=${language}`
    );
  }

  // Generic request method for custom endpoints
  async get<T>(endpoint: string, useIdentityApi: boolean = false): Promise<T> {
    return this.request<T>(endpoint, {}, useIdentityApi);
  }

  async post<T>(
    endpoint: string,
    data: any,
    useIdentityApi: boolean = false
  ): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      useIdentityApi
    );
  }

  async put<T>(
    endpoint: string,
    data: any,
    useIdentityApi: boolean = false
  ): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      useIdentityApi
    );
  }

  async delete<T>(
    endpoint: string,
    useIdentityApi: boolean = false
  ): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: "DELETE",
      },
      useIdentityApi
    );
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export class for testing or custom instances
export { ApiClient };
