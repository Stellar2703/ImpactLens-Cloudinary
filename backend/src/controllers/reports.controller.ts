import { Request, Response, NextFunction } from 'express';
import { reportService } from '../services/report.service';
import { isDatabaseAvailable, prisma } from '../config/database';
import { z } from 'zod';

const updateReportSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  summary: z.string().trim().max(5000).optional(),
  content: z.record(z.any()).optional(),
  status: z.enum(['draft', 'review', 'published']).optional(),
});

export class ReportsController {
  async getReports(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined;
      const reports = await reportService.getAllReports(projectId);
      res.json(reports);
    } catch (err) {
      next(err);
    }
  }

  async getReportById(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await reportService.getReportById(req.params.id);
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      res.json(report);
    } catch (err) {
      next(err);
    }
  }

  async generateReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, title, type } = req.body;
      if (!projectId) {
        return res.status(400).json({ error: 'projectId is required' });
      }

      const report = await reportService.generateReport(projectId, title, type);
      res.status(201).json(report);
    } catch (err) {
      next(err);
    }

  }

  async updateReport(req: Request, res: Response, next: NextFunction) {
    try {
      if (!isDatabaseAvailable()) throw new Error('Report editing requires live database persistence.');
      const parsed = updateReportSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: 'Invalid report update', details: parsed.error.flatten() });
      const report = await prisma.report.update({
        where: { id: req.params.id },
        data: parsed.data,
        include: { project: true },
      });
      await prisma.auditEvent.create({
        data: {
          projectId: report.projectId,
          reportId: report.id,
          eventType: 'REPORT_UPDATED',
          actorType: 'USER',
          description: 'Report content updated before publication.',
        },
      });
      res.json(reportService.toReportData(report));
    } catch (err) {
      next(err);
    }
  }
}

export const reportsController = new ReportsController();
