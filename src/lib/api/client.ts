// =============================================================================
// Exposure -- API Client
// Centralised HTTP client for all frontend-to-backend communication.
// Wraps fetch with consistent error handling, JSON serialization, and
// session cookie forwarding.
// =============================================================================

const BASE_URL = process.env.NEXT_PUBLIC_PLATFORM_URL || "";

// =============================================================================
// Types
// =============================================================================

/**
 * Standard API envelope returned by all Exposure API endpoints.
 * Matches the server-side `apiResponse` / `apiError` helpers in
 * `src/lib/utils/api.ts`.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  } | null;
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

// =============================================================================
// ApiError
// =============================================================================

/**
 * Typed error thrown by the API client when the server returns a non-2xx
 * response. Consumers can inspect `status` and `code` for programmatic
 * error handling (e.g. showing a 401 prompt to sign in).
 */
export class ApiError extends Error {
  public status: number;
  public code: string;
  public details?: Record<string, unknown>;

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code || "UNKNOWN";
    this.details = details;
  }
}

// =============================================================================
// ApiClient
// =============================================================================

class ApiClient {
  // ---------------------------------------------------------------------------
  // Core request method
  // ---------------------------------------------------------------------------

  private async request<T>(
    path: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const url = `${BASE_URL}/api${path}`;

    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      credentials: "include", // forward session cookies
    });

    // Attempt to parse the JSON body regardless of status so we can surface
    // the server's error message if one exists.
    let body: ApiResponse<T>;
    try {
      body = await res.json();
    } catch {
      // Response was not JSON (network error, 502, etc.)
      throw new ApiError(
        res.statusText || "Network error",
        res.status,
        "NETWORK_ERROR"
      );
    }

    if (!res.ok || !body.success) {
      throw new ApiError(
        body.error?.message || res.statusText || "Request failed",
        res.status,
        body.error?.code,
        body.error?.details
      );
    }

    return body;
  }

  // ---------------------------------------------------------------------------
  // Convenience methods
  // ---------------------------------------------------------------------------

  get<T>(path: string, init?: RequestInit) {
    return this.request<T>(path, { ...init, method: "GET" });
  }

  post<T>(path: string, body?: unknown, init?: RequestInit) {
    return this.request<T>(path, {
      ...init,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(path: string, body?: unknown, init?: RequestInit) {
    return this.request<T>(path, {
      ...init,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(path: string, body?: unknown, init?: RequestInit) {
    return this.request<T>(path, {
      ...init,
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string, init?: RequestInit) {
    return this.request<T>(path, { ...init, method: "DELETE" });
  }
}

// =============================================================================
// Singleton
// =============================================================================

export const api = new ApiClient();
