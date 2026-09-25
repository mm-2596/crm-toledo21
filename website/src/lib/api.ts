import "server-only";
import type {
  PropertyDetailResponse,
  PropertyFilters,
  PropertyListResponse,
  PublicAgentProfile,
  PublicAgentSummary,
} from "./types";

const API_URL = process.env.CRM_API_URL || "http://localhost:4000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status} al llamar a ${path}`);
  }
  return res.json() as Promise<T>;
}

export function getProperties(filters: PropertyFilters = {}): Promise<PropertyListResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const qs = params.toString();
  return apiFetch<PropertyListResponse>(`/api/public/properties${qs ? `?${qs}` : ""}`);
}

export function getProperty(id: string): Promise<PropertyDetailResponse> {
  return apiFetch<PropertyDetailResponse>(`/api/public/properties/${id}`);
}

export function submitLead(data: { name: string; email?: string; phone?: string; message?: string; propertyId?: string; marketingConsent?: boolean }) {
  return apiFetch<{ ok: true }>(`/api/public/leads`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function agentLogin(email: string, password: string) {
  return apiFetch<{ token: string; agent: { id: string; name: string; email: string; role: string } }>(
    `/api/public/agent-login`,
    { method: "POST", body: JSON.stringify({ email, password }) },
  );
}

export function getAgentProperties(token: string, agentId: string) {
  return apiFetch<import("./types").PublicProperty[]>(`/api/properties?agentId=${agentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getAgents(): Promise<PublicAgentSummary[]> {
  return apiFetch<PublicAgentSummary[]>(`/api/public/agents`);
}

export function getAgent(id: string): Promise<PublicAgentProfile> {
  return apiFetch<PublicAgentProfile>(`/api/public/agents/${id}`);
}

export function submitAgentReview(
  agentId: string,
  data: { authorName: string; rating: number; comment: string },
) {
  return apiFetch<{ ok: true }>(`/api/public/agents/${agentId}/reviews`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
