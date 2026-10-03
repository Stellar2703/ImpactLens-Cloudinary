import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';
import { projectAnalysisService } from '../services/project-analysis.service';

const projectSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(2000),
  type: z.string().trim().max(80).optional(),
  location: z.string().trim().max(200).optional(),
  category: z.string().trim().max(100).optional(),
});

export class ProjectsController {
  private deriveObjectives(project: any): string[] {
    const cat = String(project.category || '').toLowerCase();
    const loc = project.location || 'the target region';
    if (cat.includes('reforest') || cat.includes('tree') || cat.includes('plant')) {
      return [
        `Rehabilitate degraded landscape in ${loc} using native indigenous flora.`,
        'Engage local community volunteers and agricultural stakeholders in ongoing site stewardship.',
        'Establish multi-spectral drone photogrammetry for audit-ready impact verification.',
      ];
    }
    if (cat.includes('water') || cat.includes('wetland') || cat.includes('lake')) {
      return [
        `Restore open water circulation and biodiversity across ${loc}.`,
        'Eliminate invasive floating weed mats through mechanical extraction and bio-remediation.',
        'Establish permanent continuous water quality monitoring with photographic provenance.',
      ];
    }
    if (cat.includes('infra') || cat.includes('transport') || cat.includes('road') || cat.includes('bridge') || cat.includes('safety')) {
      return [
        `Ensure continuous structural safety and uninterrupted service along ${loc}.`,
        'Eliminate transmission and vehicular hazards through scheduled AI-prioritized field maintenance.',
        'Maintain verifiable visual audit trail for municipal and safety compliance.',
      ];
    }
    return [
      `Execute high-standard sustainable field intervention across ${loc}.`,
      'Maintain tamper-proof Cloudinary evidence records and AI verification.',
      'Provide transparent progress reporting to stakeholders, donors, and regulatory bodies.',
    ];
  }

  private deriveMetrics(project: any, mediaCount: number, locationsCount: number): Array<{ label: string; value: string }> {
    const cat = String(project.category || '').toLowerCase();
    const base = [
      { label: 'Evidence assets', value: String(mediaCount) },
      { label: 'Locations', value: String(locationsCount) },
    ];
    if (cat.includes('reforest') || cat.includes('tree')) {
      return [
        { label: 'Target Area', value: '45 Hectares' },
        { label: 'Projected Canopy', value: '+65%' },
        ...base,
      ];
    }
    if (cat.includes('water') || cat.includes('wetland') || cat.includes('lake')) {
      return [
        { label: 'Surface Water', value: '32 Hectares' },
        { label: 'Weed Extracted', value: '450 Tonnes' },
        ...base,
      ];
    }
    if (cat.includes('infra') || cat.includes('safety') || cat.includes('road')) {
      return [
        { label: 'Monitored Corridor', value: '28 km' },
        { label: 'Safety Clearance', value: '5.0 m' },
        ...base,
      ];
    }
    return [
      { label: 'Active Milestones', value: String(project.milestones?.length || 4) },
      { label: 'Requirements', value: String(project.evidenceRequirements?.length || 4) },
      ...base,
    ];
  }

  private toProjectData(project: any) {
    const media = project.media || [];
    const mediaById = new Map<string, any>(media.map((item: any) => [item.id, item]));
    const locations = new Set(media.map((item: any) => `${item.latitude || ''}:${item.longitude || ''}`));
    const risks = media.flatMap((item: any) => {
      const signals = Array.isArray(item.aiMetadata?.riskSignals) ? item.aiMetadata.riskSignals : [];
      return signals.map((signal: string, index: number) => ({
        id: `${item.id}-risk-${index}`,
        title: signal,
        level: 'medium',
        description: item.aiMetadata?.description || 'AI observation requires review.',
        detectedDate: new Date(item.capturedAt).toISOString().split('T')[0],
        confidence: item.aiMetadata?.confidence || 0,
      }));
    });

    const milestones = project.milestones || [];
    const timeline = milestones.map((m: any) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      targetDate: m.targetDate ? new Date(m.targetDate).toISOString().split('T')[0] : '',
      status: m.status,
    }));

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      type: project.type,
      location: project.location,
      latitude: project.latitude || 0,
      longitude: project.longitude || 0,
      startDate: new Date(project.startDate).toISOString().split('T')[0],
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
      status: project.status.toLowerCase(),
      progress: project.progress,
      category: project.category,
      mediaCount: media.length,
      locations: locations.size || 1,
      thumbnailUrl: media[0]?.cloudinaryUrl || '',
      aiInsights: media
        .flatMap((item: any) => Array.isArray(item.aiMetadata?.impactSignals) ? item.aiMetadata.impactSignals : [])
        .slice(0, 5),
      timeline,
      objectives: this.deriveObjectives(project),
      metrics: this.deriveMetrics(project, media.length, locations.size || 1),
      comparisons: (project.comparisons || []).map((comparison: any) => {
        const before = mediaById.get(comparison.beforeMediaId);
        const after = mediaById.get(comparison.afterMediaId);
        const analysis = comparison.analysis || {};
        return {
          id: comparison.id,
          before: {
            mediaId: comparison.beforeMediaId,
            url: before?.cloudinaryUrl || '',
            date: before ? new Date(before.capturedAt).toISOString().split('T')[0] : '',
            label: 'Baseline Assessment',
          },
          after: {
            mediaId: comparison.afterMediaId,
            url: after?.cloudinaryUrl || '',
            date: after ? new Date(after.capturedAt).toISOString().split('T')[0] : '',
            label: 'Progress Monitoring',
          },
          label: comparison.label,
          description: analysis.summary || 'Comparison generated from selected project evidence.',
        };
      }),
      environmentalObservations: [],
      risks,
    };
  }

  async getProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const projects = await prisma.project.findMany({
        include: {
          media: { include: { aiMetadata: true } },
          comparisons: true,
          milestones: { include: { mediaLinks: { include: { media: true } } } },
          evidenceRequirements: true,
        },
        orderBy: { updatedAt: 'desc' },
      });
      return res.json(projects.map((project) => this.toProjectData(project)));
    } catch (err) {
      next(err);
    }
  }

  async getProjectById(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await prisma.project.findUnique({
        where: { id: req.params.id },
        include: {
          media: { include: { aiMetadata: true } },
          comparisons: true,
          milestones: { include: { mediaLinks: { include: { media: true } } } },
          evidenceRequirements: true,
        },
      });
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      return res.json(this.toProjectData(project));
    } catch (err) {
      next(err);
    }
  }

  async createProject(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = projectSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid project data', details: parsed.error.flatten().fieldErrors });
      }
      const { name, description, type, location, category } = parsed.data;
      const projectId = `proj_${Date.now().toString().slice(-6)}`;

      // Perform AI Inception Analysis to derive real coordinates, milestones, evidence requirements, and baseline report
      const analysis = await projectAnalysisService.analyzeProjectInception({
        name,
        description,
        type: type || 'ENVIRONMENTAL',
        location: location || 'Field Site',
        category: category || 'Initiative',
      });

      const startDate = new Date();
      const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      const persisted = await prisma.project.create({
        data: {
          id: projectId,
          name,
          description,
          type: type || 'ENVIRONMENTAL',
          location: location || 'Field Site',
          latitude: analysis.coordinates.lat,
          longitude: analysis.coordinates.lng,
          startDate,
          endDate,
          status: 'ACTIVE',
          progress: analysis.progress,
          category: category || 'Initiative',
          milestones: {
            create: analysis.milestones.map((m) => ({
              title: m.title,
              description: m.description,
              targetDate: m.targetDate,
              status: m.status,
            })),
          },
          evidenceRequirements: {
            create: analysis.evidenceRequirements.map((r) => ({
              title: r.title,
              description: r.description,
              evidenceCategory: r.evidenceCategory,
              targetDate: r.targetDate,
              required: r.required,
              status: 'OPEN',
            })),
          },
          reports: {
            create: {
              id: `rep_${Date.now().toString().slice(-8)}`,
              title: analysis.initialReport.title,
              type: analysis.initialReport.type,
              status: 'published',
              summary: analysis.initialReport.summary,
              content: {
                statistics: analysis.initialReport.statistics,
                aiObservations: analysis.initialReport.aiObservations,
                limitations: analysis.initialReport.limitations,
                timeline: analysis.milestones.map((m) => ({
                  date: m.targetDate.toISOString().split('T')[0],
                  title: m.title,
                  description: m.description,
                  status: m.status,
                })),
              },
            },
          },
        },
        include: {
          media: { include: { aiMetadata: true } },
          comparisons: true,
          milestones: { include: { mediaLinks: { include: { media: true } } } },
          evidenceRequirements: true,
        },
      });

      await prisma.auditEvent.create({
        data: {
          projectId,
          eventType: 'PROJECT_CREATED',
          actorType: 'USER',
          description: `Created project "${name}" with AI inception milestones and evidence requirements.`,
        },
      });

      return res.status(201).json(this.toProjectData(persisted));
    } catch (err) {
      next(err);
    }
  }

  async deleteProject(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await prisma.project.findUnique({ where: { id: req.params.id } });
      if (!project) return res.status(404).json({ error: 'Project not found' });
      await prisma.project.delete({ where: { id: req.params.id } });
      return res.json({ success: true, id: req.params.id });
    } catch (err) {
      next(err);
    }
  }
}

export const projectsController = new ProjectsController();
