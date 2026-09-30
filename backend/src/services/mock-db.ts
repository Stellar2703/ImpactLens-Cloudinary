export interface ProjectData {
  id: string;
  name: string;
  description: string;
  type: string;
  location: string;
  latitude: number;
  longitude: number;
  startDate: string;
  status: string;
  progress: number;
  category: string;
  mediaCount: number;
  locations: number;
  thumbnailUrl: string;
  aiInsights: string[];
  timeline: any[];
  comparisons: any[];
  environmentalObservations: any[];
  risks: any[];
}

export interface MediaData {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  type: 'image' | 'video';
  thumbnailUrl: string;
  fullUrl: string;
  date: string;
  location: string;
  coordinates: { lat: number; lng: number };
  ai: {
    tags: string[];
    description: string;
    confidence: number;
    activity: string;
    activities?: string[];
    observations: any[];
    objects?: string[];
    impactSignals?: string[];
    riskSignals?: string[];
    analysisMode?: 'live_ai' | 'heuristic_fallback' | 'demo';
    provider?: string;
    model?: string;
    analyzedAt?: string;
    evidenceQuality?: 'unassessed' | 'low' | 'medium' | 'high';
  };
  cloudinary: {
    publicId: string;
    originalUrl: string;
    transformedUrl: string;
    format: string;
    width: number;
    height: number;
    bytes: number;
    transformations: string[];
  };
  analysisStatus?: string;
  analysisError?: string | null;
  verificationStatus: 'confirmed' | 'pending' | 'needs_inspection' | 'false_positive';
}

export interface VerificationData {
  id: string;
  mediaId: string;
  mediaUrl: string;
  aiObservation: string;
  confidence: number;
  project: string;
  location: string;
  timestamp: string;
  status: 'confirmed' | 'pending' | 'needs_inspection' | 'false_positive';
  category: string;
}

export interface ReportData {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  date: string;
  type: 'impact' | 'progress' | 'risk' | 'compliance';
  status: 'draft' | 'published' | 'review';
  summary: string;
  statistics: { label: string; value: string; change?: string }[];
  timeline: any[];
  selectedEvidence: string[];
  beforeAfter?: any;
  aiObservations: string[];
  sourceAssets: string[];
  limitations?: string[];
}

export interface StoryData {
  id: string;
  title: string;
  type: 'impact_story' | 'campaign_copy' | 'social_media';
  content: string;
  projectId: string;
  projectName: string;
  date: string;
  assetIds: string[];
  status: 'draft' | 'published';
}

// Clean in-memory stores (no mock entries)
export const mockProjects: ProjectData[] = [];
export const mockMedia: MediaData[] = [];
export const mockVerifications: VerificationData[] = [];
export const mockReports: ReportData[] = [];
export const mockStories: StoryData[] = [];
