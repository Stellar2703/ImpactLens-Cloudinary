import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { isDatabaseAvailable, prisma } from '../config/database';

const requirementSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).default(''),
  evidenceCategory: z.string().trim().min(1).max(80),
  required: z.boolean().optional(),
  targetDate: z.string().datetime().optional(),
});

const milestoneSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).default(''),
  targetDate: z.string().datetime().optional(),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD']).optional(),
});

export class ProjectIntelligenceController {
  private ensureDatabase() {
    if (!isDatabaseAvailable()) throw new Error('This workflow requires live database persistence.');
  }

  async getRequirements(req: Request, res: Response, next: NextFunction) {
    try {
      this.ensureDatabase();
      const requirements = await prisma.evidenceRequirement.findMany({
        where: { projectId: req.params.projectId },
        orderBy: { createdAt: 'asc' },
      });
      const media = await prisma.mediaAsset.findMany({
        where: { projectId: req.params.projectId },
        include: { aiMetadata: true, verifications: { orderBy: { createdAt: 'desc' }, take: 1 } },
      });
      res.json(requirements.map((requirement) => {
        const supporting = media.filter((asset) => {
          const corpus = JSON.stringify(asset.aiMetadata || {}).toLowerCase();
          return corpus.includes(requirement.evidenceCategory.toLowerCase()) || corpus.includes(requirement.title.toLowerCase());
        });
        return {
          ...requirement,
          supportingAssetCount: supporting.length,
          verifiedAssetCount: supporting.filter((asset) => ['CONFIRMED', 'confirmed'].includes(asset.verifications[0]?.status)).length,
          status: requirement.status,
        };
      }));
    } catch (err) { next(err); }
  }

  async createRequirement(req: Request, res: Response, next: NextFunction) {
    try {
      this.ensureDatabase();
      const parsed = requirementSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: 'Invalid evidence requirement', details: parsed.error.flatten().fieldErrors });
      const requirement = await prisma.evidenceRequirement.create({
        data: {
          projectId: req.params.projectId,
          title: parsed.data.title,
          description: parsed.data.description,
          evidenceCategory: parsed.data.evidenceCategory,
          required: parsed.data.required ?? true,
          targetDate: parsed.data.targetDate ? new Date(parsed.data.targetDate) : undefined,
        },
      });
      res.status(201).json(requirement);
    } catch (err) { next(err); }
  }

  async getMilestones(req: Request, res: Response, next: NextFunction) {
    try {
      this.ensureDatabase();
      const milestones = await prisma.milestone.findMany({
        where: { projectId: req.params.projectId },
        include: { mediaLinks: { include: { media: true } } },
        orderBy: [{ targetDate: 'asc' }, { createdAt: 'asc' }],
      });
      res.json(milestones);
    } catch (err) { next(err); }
  }

  async createMilestone(req: Request, res: Response, next: NextFunction) {
    try {
      this.ensureDatabase();
      const parsed = milestoneSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: 'Invalid milestone', details: parsed.error.flatten().fieldErrors });
      const milestone = await prisma.milestone.create({
        data: {
          projectId: req.params.projectId,
          title: parsed.data.title,
          description: parsed.data.description,
          status: parsed.data.status || 'PLANNED',
          targetDate: parsed.data.targetDate ? new Date(parsed.data.targetDate) : undefined,
        },
      });
      res.status(201).json(milestone);
    } catch (err) { next(err); }
  }
}

export const projectIntelligenceController = new ProjectIntelligenceController();
