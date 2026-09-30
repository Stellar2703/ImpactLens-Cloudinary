import { Request, Response, NextFunction } from 'express';
import { prisma, isDatabaseAvailable } from '../config/database';
import { StoryData } from '../services/mock-db';
import { z } from 'zod';

const storySchema = z.object({
  projectId: z.string().trim().min(1),
  type: z.enum(['impact_story', 'campaign_copy', 'social_media']).default('impact_story'),
  assetIds: z.array(z.string()).default([]),
  title: z.string().trim().max(200).optional(),
});

export class StoriesController {
  async getStories(req: Request, res: Response, next: NextFunction) {
    try {
      const [stories, projects] = await Promise.all([
        prisma.story.findMany({ orderBy: { createdAt: 'desc' } }),
        prisma.project.findMany({ select: { id: true, name: true } }),
      ]);
      const projectMap = new Map(projects.map((p) => [p.id, p.name]));
      return res.json(stories.map((story) => ({
        id: story.id,
        title: story.title,
        type: story.type,
        content: story.content,
        projectId: story.projectId,
        projectName: projectMap.get(story.projectId) || 'Project',
        date: story.createdAt.toISOString().split('T')[0],
        assetIds: story.assetIds,
        status: story.status,
      })));
    } catch (err) {
      next(err);
    }
  }

  async generateStory(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = storySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: 'Invalid story request', details: parsed.error.flatten() });
      const { projectId, type, assetIds, title } = parsed.data;
      if (!isDatabaseAvailable()) throw new Error('Story generation requires live database persistence.');
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) return res.status(404).json({ error: 'Project not found' });
      if (assetIds.length < 3 || assetIds.length > 5) {
        return res.status(400).json({ error: 'Select between 3 and 5 source media assets.' });
      }
      const assets = await prisma.mediaAsset.findMany({
        where: { id: { in: assetIds }, projectId },
        include: { aiMetadata: true },
      });
      if (assets.length !== assetIds.length) return res.status(400).json({ error: 'All source assets must belong to the selected project.' });

      let content = '';
      if (type === 'campaign_copy') {
        content = `Evidence from ${project.name} in ${project.location} documents ${assets.length} selected field observations. The source assets include: ${assets.map((asset) => asset.title).join(', ')}. Review the linked evidence before making outcome claims.`;
      } else if (type === 'social_media') {
        content = `Field evidence from ${project.name}, ${project.location}: ${assets.map((asset) => asset.aiMetadata?.description || asset.title).join(' ')} Source assets are linked for review.`;
      } else {
        content = `This evidence story for ${project.name} is based on ${assets.length} selected source assets. ${assets.map((asset) => asset.aiMetadata?.description || asset.title).join(' ')} This copy describes visible observations only and does not independently verify outcomes, measurements, causality, or completion.`;
      }

      const newStory: StoryData = {
        id: `story_${Date.now().toString().slice(-4)}`,
        title: title || `${project.name}: Groundwork to Living Proof`,
        type: type || 'impact_story',
        content,
        projectId: project.id,
        projectName: project.name,
        date: new Date().toISOString().split('T')[0],
        assetIds: assetIds || [],
        status: 'published',
      };

      await prisma.story.create({
        data: { id: newStory.id, projectId: project.id, title: newStory.title, type: newStory.type, content: newStory.content, assetIds, status: 'draft' },
      });
      newStory.status = 'draft';
      res.status(201).json(newStory);
    } catch (err) {
      next(err);
    }
  }
}

export const storiesController = new StoriesController();
