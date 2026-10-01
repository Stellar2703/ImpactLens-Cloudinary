import type { Asset, Project, Status } from "./demo-data";
import { images } from "./demo-data";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/$/, "");

type ApiError = { error?: string | { message?: string } };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiError;
    const message = typeof body.error === "string" ? body.error : body.error?.message;
    throw new Error(message || `Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

function toStatus(value: string): Status {
  if (value === "verified" || value === "confirmed") return "verified";
  if (value === "rejected" || value === "false_positive") return "rejected";
  if (value === "needs_inspection" || value === "review") return "review";
  return "unverified";
}

export function mapProject(project: any): Project {
  const media = Array.isArray(project.media) ? project.media : [];
  const first = media[0];
  const comparisons = Array.isArray(project.comparisons) ? project.comparisons : [];
  return {
    id: project.id,
    name: project.name,
    location: project.location || "Field Site",
    region: project.location?.split(", ").pop() || "Unknown",
    category: typeof project.category === "string" && project.category.trim() ? project.category : "Environment",
    start: project.startDate || "",
    end: project.endDate || "",
    status: project.status === "completed" ? "Completed" : project.status === "active" ? "Active" : "Monitoring",
    cover: project.thumbnailUrl || first?.cloudinaryUrl || "",
    before: comparisons[0]?.before?.url || project.thumbnailUrl || "",
    after: comparisons[0]?.after?.url || project.thumbnailUrl || "",
    impactScore: Math.max(0, Math.min(100, Number(project.progress || 0))),
    description: project.description || "",
    objectives: [],
    coords: [
      Math.max(5, Math.min(95, ((Number(project.longitude || 77) - 68) / 29) * 100)),
      Math.max(5, Math.min(95, ((36 - Number(project.latitude || 20)) / 30) * 100)),
    ],
    metrics: [
      { label: "Evidence assets", value: String(project.mediaCount || media.length || 0) },
      { label: "Locations", value: String(project.locations || 0) },
    ],
  };
}

export function mapMedia(media: any): Asset {
  const ai = media.ai || {};
  return {
    id: media.id,
    projectId: media.projectId,
    projectName: media.projectName,
    title: media.title,
    src: media.thumbnailUrl || media.fullUrl || "",
    originalUrl: media.fullUrl || media.thumbnailUrl || "",
    type: media.type === "video" ? "video" : "image",
    location: media.location || "Field Observation",
    date: media.date || "",
    tags: ai.tags || [],
    objects: ai.objects || [],
    activities: ai.activities || [],
    signals: [...(ai.impactSignals || []), ...(ai.riskSignals || [])],
    scene: ai.description || "Field observation",
    confidence: Number(ai.confidence || 0),
    status: toStatus(media.verificationStatus),
    uploader: "Field team",
    phase: "during",
    cloudinaryId: media.cloudinary?.publicId || "",
    analysisStatus: media.analysisStatus,
    analysisError: media.analysisError,
  };
}

export async function getProjects(): Promise<Project[]> {
  const data = await request<any[]>("/projects");
  return data.map(mapProject);
}

export async function createProject(input: {
  name: string;
  description: string;
  type?: string;
  location?: string;
  category?: string;
}): Promise<Project> {
  return mapProject(await request<any>("/projects", {
    method: "POST",
    body: JSON.stringify(input),
  }));
}

export async function getProject(id: string): Promise<Project> {
  return mapProject(await request<any>(`/projects/${encodeURIComponent(id)}`));
}

export async function getMedia(filters: { projectId?: string; type?: string; tag?: string } = {}): Promise<Asset[]> {
  const params = new URLSearchParams();
  if (filters.projectId && filters.projectId !== "all") params.set("projectId", filters.projectId);
  if (filters.type && filters.type !== "all") params.set("type", filters.type);
  if (filters.tag) params.set("tag", filters.tag);
  const data = await request<any[]>(`/media${params.size ? `?${params.toString()}` : ""}`);
  return data.map(mapMedia);
}

export async function getMediaById(id: string): Promise<Asset> {
  return mapMedia(await request<any>(`/media/${encodeURIComponent(id)}`));
}

export async function getEvidencePassport(id: string) {
  return request<any>(`/media/${encodeURIComponent(id)}/passport`);
}

export type EvidenceRequirement = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  evidenceCategory: string;
  required: boolean;
  status: string;
  targetDate?: string | null;
  supportingAssetCount: number;
  verifiedAssetCount: number;
};

export type Milestone = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  targetDate?: string | null;
  completedAt?: string | null;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD" | string;
  mediaLinks?: Array<{ media: { id: string; title: string; cloudinaryUrl: string; resourceType: string } }>;
};

export async function getEvidenceRequirements(projectId: string): Promise<EvidenceRequirement[]> {
  return request<EvidenceRequirement[]>(`/projects/${encodeURIComponent(projectId)}/evidence-requirements`);
}

export async function createEvidenceRequirement(projectId: string, input: {
  title: string;
  description?: string;
  evidenceCategory: string;
  targetDate?: string;
}): Promise<EvidenceRequirement> {
  return request<EvidenceRequirement>(`/projects/${encodeURIComponent(projectId)}/evidence-requirements`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getMilestones(projectId: string): Promise<Milestone[]> {
  return request<Milestone[]>(`/projects/${encodeURIComponent(projectId)}/milestones`);
}

export async function createMilestone(projectId: string, input: {
  title: string;
  description?: string;
  targetDate?: string;
  status?: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";
}): Promise<Milestone> {
  return request<Milestone>(`/projects/${encodeURIComponent(projectId)}/milestones`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function retryMediaAnalysis(id: string) {
  return request<any>(`/media/${encodeURIComponent(id)}/analyze`, { method: "POST" });
}

export async function getDashboardStats() {
  return request<{
    totalMedia: number;
    activeProjects: number;
    locations: number;
    aiInsights: number;
    potentialRisks: number;
    recentProjects: any[];
    recentMedia: any[];
  }>("/stats");
}

export async function uploadMedia(file: File, metadata: { projectId: string; title: string; location?: string }) {
  const body = new FormData();
  body.append("media", file);
  body.append("projectId", metadata.projectId);
  body.append("title", metadata.title);
  if (metadata.location) body.append("location", metadata.location);
  return mapMedia(await request<any>("/media/upload", { method: "POST", body }));
}

export async function verifyMedia(id: string, status: Status, comment?: string) {
  return request(`/media/${encodeURIComponent(id)}/verify`, {
    method: "POST",
    body: JSON.stringify({ status, comment }),
  });
}

export type VerificationStatus = "pending" | "confirmed" | "false_positive" | "needs_inspection";

export type Verification = {
  id: string;
  mediaId: string;
  mediaUrl: string;
  aiObservation: string;
  confidence: number;
  project: string;
  location: string;
  timestamp: string;
  status: VerificationStatus;
  category?: string;
};

export async function getVerifications(): Promise<Verification[]> {
  return request<Verification[]>("/verifications");
}

export async function updateVerification(
  id: string,
  update: { status: VerificationStatus; comment?: string },
): Promise<{ success: boolean; item: Partial<Verification> & { id: string } }> {
  return request<{ success: boolean; item: Partial<Verification> & { id: string } }>(`/verifications/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(update),
  });
}

export type CloudinaryPreset = {
  id: string;
  name: string;
  desc: string;
};

export type CloudinaryStatus = {
  status: "connected" | "degraded";
  mode?: "live" | "demo";
  message: string;
  cloudName?: string;
  apiKeyMasked?: string | null;
  isConfigured: boolean;
  fallbackActive?: boolean;
  presets?: CloudinaryPreset[];
  ping?: { status: string };
};

export async function getCloudinaryStatus(): Promise<CloudinaryStatus> {
  return request<CloudinaryStatus>("/media/cloudinary-status");
}

export async function updateCloudinaryConfig(input: {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}): Promise<CloudinaryStatus> {
  return request<CloudinaryStatus>("/media/cloudinary-config", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function resetCloudinaryConfig(): Promise<CloudinaryStatus> {
  return request<CloudinaryStatus>("/media/cloudinary-reset", {
    method: "POST",
  });
}

export type Report = {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  date: string;
  type: string;
  status: string;
  summary?: string;
  statistics?: Array<{ label: string; value: string; change?: string }>;
  timeline?: unknown[];
  selectedEvidence?: string[];
  sourceAssets?: string[];
  beforeAfter?: { before?: { url?: string }; after?: { url?: string } };
  aiObservations?: string[];
  limitations?: string[];
};

export async function getReports(): Promise<Report[]> {
  return request<Report[]>("/reports");
}

export async function getReport(id: string): Promise<Report> {
  return request<Report>(`/reports/${encodeURIComponent(id)}`);
}

export async function generateReport(input: { projectId: string; title?: string; type?: string }): Promise<Report> {
  return request<Report>("/reports/generate", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateReport(id: string, input: { title?: string; summary?: string; status?: string; content?: Record<string, unknown> }): Promise<Report> {
  return request<Report>(`/reports/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function getTransformation(id: string, preset: "original" | "optimized" | "square" | "portrait" | "landscape" | "thumbnail" = "optimized") {
  return request<{ mediaId: string; preset: string; sourceUrl: string; transformedUrl: string }>(`/media/${encodeURIComponent(id)}/transformation?preset=${preset}`);
}

export async function compareMedia(input: { projectId: string; beforeMediaId: string; afterMediaId: string }) {
  return request<any>("/comparisons", { method: "POST", body: JSON.stringify(input) });
}

export async function getAnalytics() { return request<any>("/analytics"); }
export async function getNotifications() { return request<any[]>("/notifications"); }
export async function getStories() { return request<any[]>("/stories"); }
export async function generateStory(input: { projectId: string; assetIds: string[]; type?: string; title?: string }) {
  return request<any>("/stories/generate", { method: "POST", body: JSON.stringify(input) });
}

export async function getHealth() {
  const baseUrl = API_BASE_URL.replace(/\/api$/, "");
  const response = await fetch(`${baseUrl}/health`);
  if (!response.ok) throw new Error(`Health check failed (${response.status})`);
  return response.json() as Promise<{
    status: string;
    service: string;
    timestamp: string;
    version: string;
    persistence: { mode: "live" | "degraded" | "demo"; label: string; durable: boolean; detail: string };
  }>;
}

export async function searchMedia(query: string, filters: { projectId?: string; type?: string; verificationStatus?: string; date?: string } = {}) {
  const params = new URLSearchParams({ q: query });
  if (filters.projectId && filters.projectId !== "all") params.set("projectId", filters.projectId);
  if (filters.type && filters.type !== "all") params.set("type", filters.type);
  if (filters.verificationStatus && filters.verificationStatus !== "all") params.set("verificationStatus", filters.verificationStatus);
  if (filters.date) params.set("date", filters.date);
  const results = await request<Array<{ asset: any; matchScore: number; matchReason: string }>>(`/search?${params}`);
  return results.map((result) => ({
    ...result,
    asset: mapMedia(result.asset),
  }));
}

export async function deleteProject(id: string): Promise<{ success: boolean; id: string }> {
  return request<{ success: boolean; id: string }>(`/projects/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function deleteMedia(id: string): Promise<{ success: boolean; id: string }> {
  return request<{ success: boolean; id: string }>(`/media/${encodeURIComponent(id)}`, { method: "DELETE" });
}
