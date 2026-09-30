import { Request, Response, NextFunction } from 'express';
import { isDatabaseAvailable, prisma } from '../config/database';

export async function getAnalytics(_req: Request, res: Response, next: NextFunction) {
  try {
    if (!isDatabaseAvailable()) throw new Error('Analytics requires live database persistence.');
    const [media, requirements, projects] = await Promise.all([
      prisma.mediaAsset.findMany({ include: { aiMetadata: true, verifications: { orderBy: { createdAt: 'desc' }, take: 1 } } }),
      prisma.evidenceRequirement.findMany(),
      prisma.project.findMany({ select: { id: true, name: true } }),
    ]);
    const verification = { pending: 0, confirmed: 0, falsePositive: 0, needsInspection: 0 };
    const analysis = { pending: 0, processing: 0, completed: 0, failed: 0 };
    const tags: Record<string, number> = {};
    for (const item of media) {
      const status = (item.verifications[0]?.status || 'PENDING').toLowerCase();
      if (status === 'confirmed') verification.confirmed += 1;
      else if (status === 'false_positive') verification.falsePositive += 1;
      else if (status === 'needs_inspection') verification.needsInspection += 1;
      else verification.pending += 1;
      const aiStatus = item.analysisStatus.toLowerCase() as keyof typeof analysis;
      if (aiStatus in analysis) analysis[aiStatus] += 1;
      for (const tag of ((item.aiMetadata?.tags as string[]) || [])) tags[tag] = (tags[tag] || 0) + 1;
    }
    res.json({
      evidenceCoverage: { projects: projects.length, media: media.length, verified: verification.confirmed },
      verification,
      analysis,
      projectEvidence: projects.map((project) => ({ ...project, assets: media.filter((item) => item.projectId === project.id).length })),
      evidenceGaps: requirements.filter((requirement) => requirement.status !== 'FULFILLED').map((requirement) => ({ id: requirement.id, projectId: requirement.projectId, title: requirement.title, status: requirement.status })),
      tagDistribution: Object.entries(tags).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count),
    });
  } catch (err) { next(err); }
}
