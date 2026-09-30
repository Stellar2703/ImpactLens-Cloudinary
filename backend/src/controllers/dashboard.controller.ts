import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export class DashboardController {
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const [
        totalMedia,
        activeProjects,
        media,
        projects,
        geographicProjects,
        totalVerified,
        totalReviews,
        totalStories,
        allProjects,
      ] = await Promise.all([
        prisma.mediaAsset.count(),
        prisma.project.count({ where: { status: { in: ['ACTIVE', 'MONITORING'] } } }),
        prisma.mediaAsset.findMany({ include: { aiMetadata: true }, orderBy: { uploadedAt: 'desc' }, take: 6 }),
        prisma.project.findMany({ orderBy: { updatedAt: 'desc' }, take: 5 }),
        prisma.project.findMany({ select: { latitude: true, longitude: true } }),
        prisma.verification.count({ where: { status: 'CONFIRMED' } }),
        prisma.verification.count({ where: { status: 'NEEDS_INSPECTION' } }),
        prisma.story.count(),
        prisma.project.findMany({ select: { category: true } }),
      ]);

      const aiInsights = media.reduce((sum, item) => {
        const signals = Array.isArray(item.aiMetadata?.impactSignals) ? item.aiMetadata.impactSignals : [];
        return sum + signals.length;
      }, 0);

      const potentialRisks = media.reduce((sum, item) => {
        const signals = Array.isArray(item.aiMetadata?.riskSignals) ? item.aiMetadata.riskSignals : [];
        return sum + signals.length;
      }, 0);

      const locations = geographicProjects.reduce(
        (sum, project) => sum + (project.latitude != null && project.longitude != null ? 1 : 0),
        0,
      );

      const catCount: Record<string, number> = {};
      for (const p of allProjects) {
        const cat = p.category || 'General';
        catCount[cat] = (catCount[cat] || 0) + 1;
      }
      const totalP = allProjects.length || 1;
      const categoryDistribution = Object.entries(catCount).map(([name, count]) => ({
        name,
        count,
        value: Math.round((count / totalP) * 100),
      }));

      return res.json({
        totalMedia,
        activeProjects,
        locations,
        aiInsights,
        potentialRisks,
        totalVerified,
        totalReviews,
        totalStories,
        categoryDistribution,
        recentProjects: projects,
        recentMedia: media,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const dashboardController = new DashboardController();
