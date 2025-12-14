/**
 * Environment configuration utility
 * Centralized access to environment variables with type safety and defaults
 */

export const env = {
  /**
   * Base URL for the main API service
   * Default: http://localhost:5002
   */
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5002",

  /**
   * Base URL for the Identity/Auth API service
   * Default: http://localhost:5001
   */
  API_IDENTITY_URL: import.meta.env.VITE_API_IDENTITY_URL || "http://localhost:5001",
} as const;

/**
 * Get the base URL for the main API service
 */
export const getApiBaseUrl = (): string => {
  return env.API_BASE_URL;
};

/**
 * Get the base URL for the Identity API service
 */
export const getApiIdentityUrl = (): string => {
  return env.API_IDENTITY_URL;
};
