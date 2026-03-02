import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const SESSION_FLAG_KEY = 'medoflow_has_session';

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export const setAccessToken = (token: string) => {
  accessToken = token;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SESSION_FLAG_KEY, '1');
  }
};

export const getAccessToken = () => accessToken;

export const clearAccessToken = () => {
  accessToken = null;
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(SESSION_FLAG_KEY);
  }
};

export const hasSessionFlag = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!window.localStorage.getItem(SESSION_FLAG_KEY);
};

const api = axios.create({
  baseURL: `${baseURL}/api/v1`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            const { data } = await axios.post(
              `${baseURL}/api/v1/auth/refresh-token`,
              {},
              { withCredentials: true }
            );
            const token = data?.data?.accessToken;
            if (token) {
              setAccessToken(token);
              return token;
            }
            return null;
          } catch {
            clearAccessToken();
            return null;
          } finally {
            refreshPromise = null;
          }
        })();
      }

      const newToken = await refreshPromise;
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
