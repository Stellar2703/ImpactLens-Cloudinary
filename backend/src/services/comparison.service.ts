import crypto from 'node:crypto';
import { aiService } from './ai.service';
import { isDatabaseAvailable, prisma } from '../config/database';

export class ComparisonService {
  async getAllComparisons(projectId?: string) {
    if (!isDatabaseAvailable()) return [];
    const where = projectId ? { projectId } : {};
    const comparisons = await prisma.comparison.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { id: true, name: true, location: true } },
      },
    });

    const mediaIds = Array.from(
      new Set(comparisons.flatMap((c) => [c.beforeMediaId, c.afterMediaId]))
    );
    const mediaAssets = await prisma.mediaAsset.findMany({
      where: { id: { in: mediaIds } },
    });
    const mediaMap = new Map(mediaAssets.map((m) => [m.id, m]));

    return comparisons.map((cmp) => {
      const beforeMedia = mediaMap.get(cmp.beforeMediaId);
      const afterMedia = mediaMap.get(cmp.afterMediaId);
      return {
        id: cmp.id,
        projectId: cmp.projectId,
        projectName: cmp.project?.name || 'Project',
        label: cmp.label,
        analysis: cmp.analysis,
        before: {
          mediaId: cmp.beforeMediaId,
          url: beforeMedia?.cloudinaryUrl || '',
          date: beforeMedia?.capturedAt ? beforeMedia.capturedAt.toISOString().split('T')[0] : '',
          label: 'Baseline Assessment',
        },
        after: {
          mediaId: cmp.afterMediaId,
          url: afterMedia?.cloudinaryUrl || '',
          date: afterMedia?.capturedAt ? afterMedia.capturedAt.toISOString().split('T')[0] : '',
          label: 'Progress Monitoring',
        },
        createdAt: cmp.createdAt.toISOString(),
      };
    });
  }

  async getComparisonById(id: string) {
    if (!isDatabaseAvailable()) return null;
    const cmp = await prisma.comparison.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!cmp) return null;

    const [beforeMedia, afterMedia] = await Promise.all([
      prisma.mediaAsset.findUnique({ where: { id: cmp.beforeMediaId } }),
      prisma.mediaAsset.findUnique({ where: { id: cmp.afterMediaId } }),
    ]);

    return {
      id: cmp.id,
      projectId: cmp.projectId,
      projectName: cmp.project?.name || 'Project',
      label: cmp.label,
      analysis: cmp.analysis,
      before: {
        mediaId: cmp.beforeMediaId,
        url: beforeMedia?.cloudinaryUrl || '',
        date: beforeMedia?.capturedAt ? beforeMedia.capturedAt.toISOString().split('T')[0] : '',
        label: 'Baseline Assessment',
      },
      after: {
        mediaId: cmp.afterMediaId,
        url: afterMedia?.cloudinaryUrl || '',
        date: afterMedia?.capturedAt ? afterMedia.capturedAt.toISOString().split('T')[0] : '',
        label: 'Progress Monitoring',
      },
      createdAt: cmp.createdAt.toISOString(),
    };
  }

  async compareAssets(projectId: string, beforeMediaId: string, afterMediaId: string) {
    if (!isDatabaseAvailable()) {
      throw new Error('Comparison requires live database persistence.');
    }
    const [project, beforeMedia, afterMedia] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId } }),
      prisma.mediaAsset.findUnique({ where: { id: beforeMediaId } }),
      prisma.mediaAsset.findUnique({ where: { id: afterMediaId } }),
    ]);
    if (!project || !beforeMedia || !afterMedia) throw new Error('Project or comparison media not found');
    if (beforeMedia.projectId !== projectId || afterMedia.projectId !== projectId) {
      throw new Error('Both comparison assets must belong to the selected project');
    }

    const beforeUrl = beforeMedia.cloudinaryUrl;
    const afterUrl = afterMedia.cloudinaryUrl;

    const aiComparison = await aiService.compareMedia(beforeUrl, afterUrl, project?.type);

    const newComparison = {
      id: `cmp_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
      projectId: projectId || 'proj-001',
      before: {
        mediaId: beforeMediaId,
        url: beforeUrl,
        date: beforeMedia.capturedAt.toISOString().split('T')[0],
        label: 'Baseline Assessment',
      },
      after: {
        mediaId: afterMediaId,
        url: afterUrl,
        date: afterMedia.capturedAt.toISOString().split('T')[0],
        label: 'Progress Monitoring',
      },
      label: `${project?.name || 'Project'}: Multi-temporal Progression`,
      description: aiComparison.summary,
      detailedAnalysis: aiComparison,
      createdAt: new Date().toISOString(),
    };

    await prisma.comparison.create({
      data: {
        id: newComparison.id,
        projectId,
        beforeMediaId,
        afterMediaId,
        label: newComparison.label,
        analysis: {
          summary: aiComparison.summary,
          visibleChanges: aiComparison.visibleChanges,
          canopyOrStructuralDifference: aiComparison.canopyOrStructuralDifference,
          riskAssessment: aiComparison.riskAssessment,
          confidence: aiComparison.confidence,
          limitation: 'Visual comparison may be affected by camera angle, lighting, weather, framing, and other capture conditions.',
        },
      },
    });
    await prisma.auditEvent.create({
      data: {
        projectId,
        eventType: 'COMPARISON_CREATED',
        actorType: 'SYSTEM',
        description: 'Saved a comparison linked to two persisted media assets.',
        metadata: { beforeMediaId, afterMediaId },
      },
    });

    return newComparison;
  }
}

export const comparisonService = new ComparisonService();

