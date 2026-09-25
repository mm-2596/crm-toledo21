import { api } from "./client";
import type {
  Activity,
  AudienceInfo,
  Campaign,
  CampaignInput,
  CampaignSegment,
  AgentReview,
  Contact,
  DashboardSummary,
  Deal,
  PipelineStage,
  Property,
  PropertyImage,
  PropertyVideo,
  TeamMember,
  User,
  Valuation,
} from "./types";

export const AuthApi = {
  me: () => api.get<User>("/auth/me").then((r) => r.data),
  login: (data: { email: string; password: string }) => api.post<User>("/auth/login", data).then((r) => r.data),
  register: (data: { name: string; email: string; password: string; inviteCode: string }) =>
    api.post<User>("/auth/register", data).then((r) => r.data),
  logout: () => api.post("/auth/logout"),
};

export const ContactsApi = {
  list: (q?: string) => api.get<Contact[]>("/contacts", { params: { q } }).then((r) => r.data),
  get: (id: string) => api.get<Contact>(`/contacts/${id}`).then((r) => r.data),
  create: (data: Partial<Contact>) => api.post<Contact>("/contacts", data).then((r) => r.data),
  update: (id: string, data: Partial<Contact>) =>
    api.put<Contact>(`/contacts/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/contacts/${id}`),
  matches: (id: string) => api.get<Property[]>(`/contacts/${id}/matches`).then((r) => r.data),
  exportCsv: (consentOnly: boolean) =>
    api.get<Blob>("/contacts/export", { params: consentOnly ? { consent: 1 } : undefined, responseType: "blob" }).then((r) => r.data),
};

export const PropertiesApi = {
  list: (params?: { q?: string; status?: string; city?: string }) =>
    api.get<Property[]>("/properties", { params }).then((r) => r.data),
  get: (id: string) => api.get<Property>(`/properties/${id}`).then((r) => r.data),
  create: (data: Partial<Property>) => api.post<Property>("/properties", data).then((r) => r.data),
  update: (id: string, data: Partial<Property>) =>
    api.put<Property>(`/properties/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/properties/${id}`),
  uploadImage: (id: string, file: File) => {
    const form = new FormData();
    form.append("image", file);
    return api
      .post<PropertyImage>(`/properties/${id}/images`, form, { headers: { "Content-Type": undefined } })
      .then((r) => r.data);
  },
  removeImage: (id: string, imageId: string) => api.delete(`/properties/${id}/images/${imageId}`),
  uploadVideo: (id: string, file: File) => {
    const form = new FormData();
    form.append("video", file);
    return api
      .post<PropertyVideo>(`/properties/${id}/videos`, form, { headers: { "Content-Type": undefined } })
      .then((r) => r.data);
  },
  removeVideo: (id: string, videoId: string) => api.delete(`/properties/${id}/videos/${videoId}`),
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
  list: () => api.get<TeamMember[]>("/users").then((r) => r.data),
  get: (id: string) => api.get<TeamMember>(`/users/${id}`).then((r) => r.data),
  inviteCode: () => api.get<{ inviteCode: string | null }>("/users/invite-code").then((r) => r.data),
  update: (id: string, data: { role?: "ADMIN" | "AGENT"; active?: boolean }) =>
    api.patch<TeamMember>(`/users/${id}`, data).then((r) => r.data),
  updateProfile: (id: string, data: { jobTitle?: string | null; bio?: string | null; phone?: string | null }) =>
    api.patch<TeamMember>(`/users/${id}/profile`, data).then((r) => r.data),
  uploadPhoto: (id: string, file: File) => {
    const form = new FormData();
    form.append("photo", file);
    return api
      .post<TeamMember>(`/users/${id}/photo`, form, { headers: { "Content-Type": undefined } })
      .then((r) => r.data);
  },
  reviews: (id: string) => api.get<AgentReview[]>(`/users/${id}/reviews`).then((r) => r.data),
  pendingReviews: () =>
    api.get<(AgentReview & { agent: { id: string; name: string } })[]>(`/users/reviews/pending`).then((r) => r.data),
  approveReview: (reviewId: string, approved: boolean) =>
    api.patch<AgentReview>(`/users/reviews/${reviewId}`, { approved }).then((r) => r.data),
  removeReview: (reviewId: string) => api.delete(`/users/reviews/${reviewId}`),
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

export const CampaignsApi = {
  list: () => api.get<Campaign[]>("/campaigns").then((r) => r.data),
  get: (id: string) => api.get<Campaign>(`/campaigns/${id}`).then((r) => r.data),
  create: (data: CampaignInput) => api.post<Campaign>("/campaigns", data).then((r) => r.data),
  update: (id: string, data: CampaignInput) => api.put<Campaign>(`/campaigns/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/campaigns/${id}`),
  audience: (segment: CampaignSegment) =>
    api.post<AudienceInfo>("/campaigns/audience", { segment }).then((r) => r.data),
  sendTest: (id: string, email: string) => api.post(`/campaigns/${id}/test`, { email }),
  send: (id: string) => api.post<{ ok: true; recipients: number }>(`/campaigns/${id}/send`).then((r) => r.data),
};
