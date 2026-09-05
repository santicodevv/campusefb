// Axios client configuration with JWT interceptors
import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { storage, isTokenExpired } from './storage';
import type { ApiError } from '@/shared/types';

// Create axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - Add JWT token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getAccessToken();

    if (token && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      const token = storage.getAccessToken();

      // If this is an auth endpoint (login/register/refresh), do NOT redirect.
      // Just let the error propagate so the form can display a friendly message.
      const isAuthRequest = originalRequest.url?.includes('/auth/');
      if (isAuthRequest) {
        return Promise.reject(error.response?.data || error);
      }

      // If no token or token expired, redirect to login
      if (!token || isTokenExpired(token)) {
        storage.clearAuth();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        const response = await axios.post<{ access_token: string }>(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const newToken = response.data.access_token;
        storage.setAccessToken(newToken);
        processQueue(null, newToken);

        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        storage.clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const apiError: ApiError = error.response?.data || {
      statusCode: error.response?.status || 500,
      message: error.message || 'An unexpected error occurred',
    };

    return Promise.reject(apiError);
  }
);

/** Friendly Spanish translations for specific backend error messages. */
const BACKEND_MESSAGE_MAP: Record<string, string> = {
  'User not registered': 'El usuario no está registrado en el sistema.',
  'Invalid credentials': 'Credenciales incorrectas, intenta de nuevo.',
  'User is inactive': 'Tu cuenta está desactivada. Contacta al administrador.',
  'User not found or inactive': 'El usuario no está registrado en el sistema.',
  'Unauthorized': 'No autorizado. Por favor, inicia sesión.',
};

/** Map of HTTP status codes to user-friendly Spanish messages for auth flows. */
const HTTP_STATUS_MESSAGES: Record<number, string> = {
  401: 'El usuario no está registrado en el sistema o la contraseña es incorrecta.',
  403: 'No tienes permiso para realizar esta acción.',
  404: 'El usuario no fue encontrado.',
  422: 'Los datos ingresados no son válidos.',
  429: 'Demasiados intentos. Por favor, espera un momento e inténtalo de nuevo.',
  500: 'Ocurrió un error en el servidor. Inténtalo más tarde.',
};

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    // Shape produced by our interceptor: { statusCode, message, error }
    if ('statusCode' in error) {
      const apiErr = error as ApiError;
      const rawMsg = Array.isArray(apiErr.message) ? apiErr.message[0] : apiErr.message;

      // 1. Try translating the exact backend message first
      if (rawMsg && BACKEND_MESSAGE_MAP[rawMsg]) {
        return BACKEND_MESSAGE_MAP[rawMsg];
      }
      // 2. Fall back to HTTP status code mapping
      if (apiErr.statusCode && HTTP_STATUS_MESSAGES[apiErr.statusCode]) {
        return HTTP_STATUS_MESSAGES[apiErr.statusCode];
      }
      return rawMsg ?? 'Ocurrió un error inesperado.';
    }

    // Raw AxiosError (interceptor bypass edge-case)
    if ('response' in error) {
      const axiosErr = error as { response?: { status?: number; data?: ApiError } };
      const status = axiosErr.response?.status;
      const rawMsg = axiosErr.response?.data?.message;
      const msgStr = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg;

      if (msgStr && BACKEND_MESSAGE_MAP[msgStr]) return BACKEND_MESSAGE_MAP[msgStr];
      if (status && HTTP_STATUS_MESSAGES[status]) return HTTP_STATUS_MESSAGES[status];
      if (msgStr) return msgStr;
    }

    // Network / timeout errors — hide technical details
    if ('message' in error) {
      const msg = (error as { message: string }).message;
      if (/status code/i.test(msg) || /network error/i.test(msg) || /timeout/i.test(msg)) {
        return 'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.';
      }
      return msg;
    }
  }
  return 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.';
}

export default api;
