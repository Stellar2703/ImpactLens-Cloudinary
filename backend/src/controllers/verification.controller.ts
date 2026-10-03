import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';

const verificationUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'false_positive', 'needs_inspection']),
  comment: z.string().trim().max(1000).optional(),
});

export class VerificationController {
  async getVerifications(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Ensure any media assets without a verification record are queued as PENDING
      const unlinkedMedia = await prisma.mediaAsset.findMany({
        where: {
          verifications: { none: {} },
        },
        include: { aiMetadata: true, project: true },
      });

      for (const m of unlinkedMedia) {
        await prisma.verification.create({
          data: {
            mediaId: m.id,
            status: 'PENDING',
            category: 'Field Evidence Review',
            comment: m.aiMetadata?.description || 'AI field capture queued for provenance verification.',
          },
        });
      }

      // 2. Query verifications with optional status filtering
      const statusParam = (req.query.status as string)?.toLowerCase();
      const whereClause =
        statusParam === 'pending'
          ? { status: 'PENDING' }
          : statusParam === 'finalised' || statusParam === 'finalized'
          ? { status: { not: 'PENDING' } }
          : statusParam && statusParam !== 'all'
          ? { status: statusParam.toUpperCase() }
          : {};

      const items = await prisma.verification.findMany({
        where: whereClause,
        include: { media: { include: { project: true, aiMetadata: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return res.json(items.map((item) => ({
        id: item.id,
        mediaId: item.mediaId,
        mediaUrl: item.media.cloudinaryUrl,
        aiObservation: item.comment || item.media.aiMetadata?.description || 'Evidence requires review',
        confidence: Math.round((item.media.aiMetadata?.confidence || 0) * 100),
        project: item.media.project.name,
        location: item.media.project.location,
        timestamp: item.createdAt.toISOString(),
        status: item.status.toLowerCase(),
        category: item.category,
        comment: item.comment || undefined,
      })));
    } catch (err) {
      next(err);
    }
  }

  async updateVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = verificationUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid verification update', details: parsed.error.flatten() });
      }
      const { status, comment } = parsed.data;

      const existing = await prisma.verification.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: 'Verification item not found' });
      }

      const item = await prisma.verification.update({
        where: { id },
        data: { status: status.toUpperCase(), comment, reviewedAt: new Date() },
        include: { media: true },
      });

      await prisma.mediaAsset.update({
        where: { id: item.mediaId },
        data: { status: status.toUpperCase() },
      });

      await prisma.auditEvent.create({
        data: {
          mediaId: item.mediaId,
          eventType: 'HUMAN_REVIEW_UPDATED',
          actorType: 'USER',
          description: `Verification workspace status changed to ${status}.`,
          metadata: { verificationId: id, status, comment: comment || null },
        },
      });

      return res.json({
        success: true,
        item: { ...item, status: item.status.toLowerCase() },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const verificationController = new VerificationController();
