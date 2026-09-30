import { Request, Response, NextFunction } from 'express';
import { isDatabaseAvailable, prisma } from '../config/database';

export async function getNotifications(_req: Request, res: Response, next: NextFunction) {
  try {
    if (!isDatabaseAvailable()) throw new Error('Notifications require live database persistence.');
    const events = await prisma.auditEvent.findMany({
      where: { eventType: { in: ['AI_ANALYSIS_COMPLETED', 'AI_ANALYSIS_FAILED', 'HUMAN_REVIEW_UPDATED', 'REPORT_GENERATED', 'COMPARISON_CREATED'] } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(events.map((event) => ({ id: event.id, type: event.eventType, title: event.eventType.replaceAll('_', ' '), description: event.description, createdAt: event.createdAt, mediaId: event.mediaId, projectId: event.projectId, reportId: event.reportId })));
  } catch (err) { next(err); }
}
