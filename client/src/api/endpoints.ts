import { api } from "./client";
import type {
  Activity,
  Contact,
  DashboardSummary,
  Deal,
  PipelineStage,
  Property,
  User,
  Valuation,
} from "./types";

export const ContactsApi = {
  list: (q?: string) => api.get<Contact[]>("/contacts", { params: { q } }).then((r) => r.data),
  get: (id: string) => api.get<Contact>(`/contacts/${id}`).then((r) => r.data),
  create: (data: Partial<Contact>) => api.post<Contact>("/contacts", data).then((r) => r.data),
  update: (id: string, data: Partial<Contact>) =>
    api.put<Contact>(`/contacts/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/contacts/${id}`),
};

export const PropertiesApi = {
  list: (params?: { q?: string; status?: string; city?: string }) =>
    api.get<Property[]>("/properties", { params }).then((r) => r.data),
  get: (id: string) => api.get<Property>(`/properties/${id}`).then((r) => r.data),
  create: (data: Partial<Property>) => api.post<Property>("/properties", data).then((r) => r.data),
  update: (id: string, data: Partial<Property>) =>
    api.put<Property>(`/properties/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/properties/${id}`),
};

export const PipelineApi = {
  stages: () => api.get<PipelineStage[]>("/pipeline/stages").then((r) => r.data),
  createDeal: (data: Partial<Deal>) => api.post<Deal>("/pipeline/deals", data).then((r) => r.data),
  moveDeal: (id: string, stageId: string) =>
    api.patch<Deal>(`/pipeline/deals/${id}/stage`, { stageId }).then((r) => r.data),
  closeDeal: (id: string, status: "GANADO" | "PERDIDO") =>
    api.patch<Deal>(`/pipeline/deals/${id}/close`, { status }).then((r) => r.data),
  removeDeal: (id: string) => api.delete(`/pipeline/deals/${id}`),
};

export const ActivitiesApi = {
  list: (pending?: boolean) =>
    api.get<Activity[]>("/activities", { params: { pending } }).then((r) => r.data),
  create: (data: Partial<Activity>) => api.post<Activity>("/activities", data).then((r) => r.data),
  complete: (id: string) => api.patch<Activity>(`/activities/${id}/complete`).then((r) => r.data),
  remove: (id: string) => api.delete(`/activities/${id}`),
};

export const DashboardApi = {
  summary: () => api.get<DashboardSummary>("/dashboard/summary").then((r) => r.data),
};

export const UsersApi = {
  list: () => api.get<User[]>("/users").then((r) => r.data),
};

export const ValuationsApi = {
  estimate: (data: {
    propertyId?: string | null;
    type: string;
    city: string;
    zone?: string | null;
    areaM2: number;
  }) => api.post<Valuation>("/valuations/estimate", data).then((r) => r.data),
  forProperty: (propertyId: string) =>
    api.get<Valuation[]>(`/valuations/property/${propertyId}`).then((r) => r.data),
};
