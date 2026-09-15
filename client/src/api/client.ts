import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string; details?: { message?: string }[] } | undefined;
    if (data?.details?.length) {
      return data.details.map((d) => d.message).filter(Boolean).join(". ") || fallback;
    }
    if (data?.error) return data.error;
  }
  return fallback;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = error.config?.url?.startsWith("/auth/");
    if (error.response?.status === 401 && !isAuthEndpoint && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
