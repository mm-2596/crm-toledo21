import { api } from "./client";
import type {
  Lease,
  LeaseInput,
  Role,
  TeamOverviewUser,
  ContactSearch,
  ContactSearchInput,
  MatchesResponse,
  Visit,
  ActivityType,
  DwellingFile,
  DwellingResident,
  ResidentInput,
  Activity,
  AudienceInfo,
  Building,
  BuildingInput,
  Campaign,
  Dwelling,
  DwellingInput,
  Office,
  NotificationsResponse,
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
  list: (q?: string, filters?: { segment?: string; type?: string }) =>
    api.get<Contact[]>("/contacts", { params: { q, segment: filters?.segment || undefined, type: filters?.type || undefined } }).then((r) => r.data),
  get: (id: string) => api.get<Contact>(`/contacts/${id}`).then((r) => r.data),
  create: (data: Partial<Contact>) => api.post<Contact>("/contacts", data).then((r) => r.data),
  update: (id: string, data: Partial<Contact>) =>
    api.put<Contact>(`/contacts/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/contacts/${id}`),
  addSearch: (id: string, data: ContactSearchInput) => api.post<ContactSearch>(`/contacts/${id}/searches`, data).then((r) => r.data),
  updateSearch: (sid: string, data: ContactSearchInput) => api.put<ContactSearch>(`/contacts/searches/${sid}`, data).then((r) => r.data),
  removeSearch: (sid: string) => api.delete(`/contacts/searches/${sid}`),
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
  list: (pending?: boolean, mine?: boolean) =>
    api.get<Activity[]>("/activities", { params: { pending, mine: mine || undefined } }).then((r) => r.data),
  assign: (id: string, agentId: string | null) =>
    api.patch<Activity>(`/activities/${id}/assign`, { agentId }).then((r) => r.data),
  create: (data: Partial<Activity>) => api.post<Activity>("/activities", data).then((r) => r.data),
  complete: (id: string) => api.patch<Activity>(`/activities/${id}/complete`).then((r) => r.data),
  remove: (id: string) => api.delete(`/activities/${id}`),
};

export const DashboardApi = {
  summary: () => api.get<DashboardSummary>("/dashboard/summary").then((r) => r.data),
};

export const UsersApi = {
  assignable: () => api.get<{ id: string; name: string }[]>("/users/assignable").then((r) => r.data),
  list: () => api.get<TeamMember[]>("/users").then((r) => r.data),
  get: (id: string) => api.get<TeamMember>(`/users/${id}`).then((r) => r.data),
  inviteCode: () => api.get<{ inviteCode: string | null }>("/users/invite-code").then((r) => r.data),
  update: (id: string, data: { role?: Role; active?: boolean; office?: Office | null; canViewBuildings?: boolean }) =>
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

export const NotificationsApi = {
  list: () => api.get<NotificationsResponse>("/notifications").then((r) => r.data),
};

export const BuildingsApi = {
  list: (params?: { q?: string; office?: Office }) =>
    api.get<{ buildings: Building[]; noOffice: boolean }>("/buildings", { params }).then((r) => r.data),
  create: (data: BuildingInput) => api.post<Building>("/buildings", data).then((r) => r.data),
  update: (id: string, data: BuildingInput) => api.put<Building>(`/buildings/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/buildings/${id}`),
};

export const DwellingsApi = {
  create: (data: DwellingInput & { buildingId: string }) => api.post<Dwelling>("/dwellings", data).then((r) => r.data),
  update: (id: string, data: DwellingInput) => api.put<Dwelling>(`/dwellings/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/dwellings/${id}`),
  addResident: (dwellingId: string, data: ResidentInput) =>
    api.post<DwellingResident>(`/dwellings/${dwellingId}/residents`, data).then((r) => r.data),
  updateResident: (id: string, data: ResidentInput) =>
    api.put<DwellingResident>(`/dwellings/residents/${id}`, data).then((r) => r.data),
  removeResident: (id: string) => api.delete(`/dwellings/residents/${id}`),
  uploadFile: (dwellingId: string, file: File) => {
    const body = new FormData();
    body.append("file", file);
    return api
      .post<DwellingFile>(`/dwellings/${dwellingId}/files`, body, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data);
  },
  activities: (id: string) => api.get<Activity[]>(`/dwellings/${id}/activities`).then((r) => r.data),
  addActivity: (id: string, data: { type: ActivityType; description: string; dueDate?: string | null; hasTime?: boolean }) =>
    api.post<Activity>(`/dwellings/${id}/activities`, data).then((r) => r.data),
  fileUrl: (id: string) => `/api/dwellings/files/${id}`,
  removeFile: (id: string) => api.delete(`/dwellings/files/${id}`),
};

export const MatchesApi = {
  forProperty: (id: string) => api.get<MatchesResponse>(`/matches/property/${id}`).then((r) => r.data),
  forDwelling: (id: string) => api.get<MatchesResponse>(`/matches/dwelling/${id}`).then((r) => r.data),
};

export const VisitsApi = {
  list: (mine?: boolean) => api.get<Visit[]>("/visits", { params: { mine: mine ? 1 : undefined } }).then((r) => r.data),
  create: (data: { contactId: string; propertyId?: string; dwellingId?: string; when: string; location?: string | null; notes?: string | null }) =>
    api.post<Visit>("/visits", data).then((r) => r.data),
};

export const LeasesApi = {
  list: (params?: { q?: string; status?: string; office?: Office; endingWithin?: number }) =>
    api.get<Lease[]>("/leases", { params }).then((r) => r.data),
  get: (id: string) => api.get<Lease>(`/leases/${id}`).then((r) => r.data),
  create: (data: LeaseInput & { dwellingId: string }) => api.post<Lease>("/leases", data).then((r) => r.data),
  update: (id: string, data: LeaseInput) => api.put<Lease>(`/leases/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/leases/${id}`),
  uploadFile: (id: string, file: File) => {
    const body = new FormData();
    body.append("file", file);
    return api.post<DwellingFile>(`/leases/${id}/files`, body, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
  },
  fileUrl: (id: string) => `/api/leases/files/${id}`,
  removeFile: (id: string) => api.delete(`/leases/files/${id}`),
  activities: (id: string) => api.get<Activity[]>(`/leases/${id}/activities`).then((r) => r.data),
  addActivity: (id: string, data: { type: ActivityType; description: string; dueDate?: string | null; hasTime?: boolean }) =>
    api.post<Activity>(`/leases/${id}/activities`, data).then((r) => r.data),
};

export const TeamApi = {
  overview: (office?: Office) => api.get<{ users: TeamOverviewUser[] }>("/team/overview", { params: { office } }).then((r) => r.data.users),
};
