import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';

const projectSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(2000),
  type: z.string().trim().max(80).optional(),
  location: z.string().trim().max(200).optional(),
  category: z.string().trim().max(100).optional(),
});

export class ProjectsController {
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

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      type: project.type,
      location: project.location,
      latitude: project.latitude || 0,
      longitude: project.longitude || 0,
      startDate: new Date(project.startDate).toISOString().split('T')[0],
      status: project.status.toLowerCase(),
      progress: project.progress,
      category: project.category,
      mediaCount: media.length,
      locations: locations.size || 1,
      thumbnailUrl: media[0]?.cloudinaryUrl || '',
      aiInsights: media
        .flatMap((item: any) => Array.isArray(item.aiMetadata?.impactSignals) ? item.aiMetadata.impactSignals : [])
        .slice(0, 5),
      timeline: [],
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
        include: { media: { include: { aiMetadata: true } }, comparisons: true },
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
        include: { media: { include: { aiMetadata: true } }, comparisons: true },
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

      const persisted = await prisma.project.create({
        data: {
          id: projectId,
          name,
          description,
          type: type || 'ENVIRONMENTAL',
          location: location || 'Field Site',
          latitude: 12.0,
          longitude: 77.0,
          startDate: new Date(),
          status: 'ACTIVE',
          progress: 0,
          category: category || 'Initiative',
        },
        include: { media: { include: { aiMetadata: true } }, comparisons: true },
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
