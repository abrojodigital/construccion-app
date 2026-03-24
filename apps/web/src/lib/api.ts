import { useAuthStore } from '@/store/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  responseType?: 'json' | 'blob';
}

class ApiClient {
  private baseUrl: string;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, params, responseType = 'json' } = options;

    const token = useAuthStore.getState().accessToken;

    // Build URL with query params
    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers,
      },
    };

    if (body) {
      // Handle FormData differently
      if (body instanceof FormData) {
        delete (config.headers as Record<string, string>)['Content-Type'];
        config.body = body;
      } else {
        config.body = JSON.stringify(body);
      }
    }

    const response = await fetch(url, config);

    // Handle token refresh
    if (response.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry the request with new token
        const newToken = useAuthStore.getState().accessToken;
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${newToken}`,
        };
        const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, config);
        return this.handleResponse<T>(retryResponse);
      } else {
        // Logout if refresh fails
        useAuthStore.getState().logout();
        window.location.href = '/login';
        throw new Error('Session expired');
      }
    }

    return this.handleResponse<T>(response);
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    let data;

    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch {
      // Response is not valid JSON
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return {} as T;
    }

    if (!response.ok) {
      // Extract detailed validation errors if available
      let errorMessage = data.error?.message || data.message || `Error ${response.status}: ${response.statusText}`;

      // If there are validation errors, format them nicely
      if (data.error?.errors && Array.isArray(data.error.errors)) {
        const fieldErrors = data.error.errors
          .map((e: { field: string; message: string }) => `${e.field}: ${e.message}`)
          .join('\n');
        errorMessage = `${errorMessage}\n${fieldErrors}`;
      }

      console.error('API Error:', { status: response.status, url: response.url, error: data });
      throw new Error(errorMessage);
    }

    // Some endpoints return data directly, others wrap it in { data: ... }
    return (data.data !== undefined ? data.data : data) as T;
  }

  private async refreshToken(): Promise<boolean> {
    // Deduplica llamadas concurrentes: si ya hay un refresh en curso, reutiliza la misma promesa
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    this.refreshPromise = this._doRefresh().finally(() => {
      this.refreshPromise = null;
    });
    return this.refreshPromise;
  }

  private async _doRefresh(): Promise<boolean> {
    const refreshToken = useAuthStore.getState().refreshToken;

    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      useAuthStore.getState().setTokens(data.data.accessToken, data.data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  // HTTP methods
  get<T>(endpoint: string, options?: { params?: ApiOptions['params'] }) {
    return this.request<T>(endpoint, { params: options?.params });
  }

  post<T>(endpoint: string, body?: unknown, options?: Omit<ApiOptions, 'method' | 'body'>) {
    return this.request<T>(endpoint, { method: 'POST', body, ...options });
  }

  put<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  patch<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_URL);
