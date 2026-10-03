import { ReportData } from './mock-db';
import { prisma } from '../config/database';
import { projectAnalysisService } from './project-analysis.service';

export class ReportService {
  toReportData(report: any): ReportData {
    const content = (report.content || {}) as Partial<ReportData>;
    return {
      id: report.id,
      title: report.title,
      projectId: report.projectId,
      projectName: report.project?.name || 'Unknown project',
      date: new Date(report.createdAt).toISOString().split('T')[0],
      type: report.type,
      status: report.status,
      summary: report.summary,
      statistics: content.statistics || [],
      timeline: content.timeline || [],
      selectedEvidence: content.selectedEvidence || [],
      beforeAfter: content.beforeAfter,
      aiObservations: content.aiObservations || [],
      sourceAssets: content.sourceAssets || [],
      limitations: content.limitations || [],
    };
  }

  async getAllReports(projectId?: string): Promise<ReportData[]> {
    const reports = await prisma.report.findMany({
      where: projectId && projectId !== 'all' ? { projectId } : undefined,
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    });
    return reports.map((report) => this.toReportData(report));
  }

  async getReportById(id: string): Promise<ReportData | null> {
    const report = await prisma.report.findUnique({
      where: { id },
      include: { project: true },
    });
    return report ? this.toReportData(report) : null;
  }

  async generateReport(projectId: string, title?: string, type: any = 'impact'): Promise<ReportData> {
    const persistedProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        media: {
          include: {
            project: true,
            aiMetadata: true,
            verifications: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
        comparisons: true,
        milestones: true,
        evidenceRequirements: true,
      },
    });
    if (!persistedProject) {
      throw new Error(`Project "${projectId}" not found. Please create a project and upload evidence first.`);
    }

    const analysis = await projectAnalysisService.generateProjectReportAnalysis(persistedProject);
    const reportId = `rep_${Date.now().toString().slice(-8)}`;
    const reportTitle = title || analysis.title;

    const created = await prisma.report.create({
      data: {
        id: reportId,
        projectId,
        title: reportTitle,
        type: type || analysis.type,
        status: 'published',
        summary: analysis.summary,
        content: {
          statistics: analysis.statistics,
          timeline: analysis.timeline,
          selectedEvidence: persistedProject.media.map((item) => item.id),
          aiObservations: analysis.aiObservations,
          sourceAssets: persistedProject.media.map((item) => item.id),
          limitations: analysis.limitations,
        },
      },
      include: { project: true },
    });

    await prisma.auditEvent.create({
      data: {
        projectId,
        reportId,
        eventType: 'REPORT_GENERATED',
        actorType: 'USER',
        description: `Generated AI report "${reportTitle}" for ${persistedProject.name}.`,
        metadata: { sourceMediaIds: persistedProject.media.map((item) => item.id) },
      },
    });

    return this.toReportData(created);
  }
}

export const reportService = new ReportService();
