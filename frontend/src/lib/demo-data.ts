export type Status = "verified" | "review" | "unverified" | "rejected";

export interface Project {
  id: string;
  name: string;
  location: string;
  region: string;
  category: string;
  start: string;
  end: string;
  status: "Active" | "Completed" | "Monitoring";
  cover: string;
  before: string;
  after: string;
  impactScore: number;
  description: string;
  objectives: string[];
  coords: [number, number];
  metrics: { label: string; value: string }[];
  milestones?: any[];
}

export interface Asset {
  id: string;
  projectId: string;
  projectName?: string;
  title: string;
  src: string;
  originalUrl?: string;
  type: "image" | "video";
  location: string;
  date: string;
  tags: string[];
  objects: string[];
  activities: string[];
  signals: string[];
  scene: string;
  confidence: number;
  status: Status;
  uploader: string;
  phase: "before" | "during" | "after";
  cloudinaryId: string;
  analysisStatus?: string;
  analysisError?: string | null;
}

// All initial datasets start empty; user creates their own data
export const projects: Project[] = [];
export const assets: Asset[] = [];
export const insights: any[] = [];
export const evidenceTrend: any[] = [];
export const notifications: any[] = [];

import greenBefore from "../assests/greenrise-before.png";
import greenAfter from "../assests/greenrise-after.png";
import water from "../assests/water.png";
import waterBefore from "../assests/water-before.png";
import solar from "../assests/solar.png";
import coastBefore from "../assests/coastal-before.png";
import coastAfter from "../assests/coastal-after.png";
import infra from "../assests/infra.png";

export const images: Record<string, string> = {
  greenBefore,
  greenAfter,
  water,
  waterBefore,
  solar,
  coastBefore,
  coastAfter,
  infra,
};

export const getProject = (id: string) => projects.find((p) => p.id === id);
export const getAsset = (id: string) => assets.find((a) => a.id === id);
export const projectAssets = (id: string) => assets.filter((a) => a.projectId === id);
export const verificationPct = (id: string) => {
  const a = projectAssets(id);
  if (!a.length) return 0;
  return Math.round((a.filter((x) => x.status === "verified").length / a.length) * 100);
};
