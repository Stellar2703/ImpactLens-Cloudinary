import { ReportData } from './mock-db';
import { prisma, isDatabaseAvailable } from '../config/database';
import { mediaService } from './media.service';

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

  async getAllReports(): Promise<ReportData[]> {
    const reports = await prisma.report.findMany({
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
      },
    });
    if (!persistedProject) {
      throw new Error(`Project "${projectId}" not found. Please create a project and upload evidence first.`);
    }

    const projectMedia = persistedProject.media.map((item) => mediaService.toMediaData(item));
    const verifiedMedia = projectMedia.filter((media) => ['confirmed', 'verified'].includes(media.verificationStatus));
    const locations = new Set(persistedProject.media.map((item) => `${item.latitude || ''}:${item.longitude || ''}`)).size;
    const reportId = `rep_${Date.now().toString().slice(-8)}`;
    const reportTitle = title || `${persistedProject.name} — Evidence Intelligence Report`;
    const summary = `Evidence report for ${persistedProject.name}. Synthesized from ${projectMedia.length} field media assets (${verifiedMedia.length} verified) across ${locations || 1} monitored location(s).`;

    const content = {
      statistics: [
        { label: 'Field Evidence Assets', value: String(projectMedia.length), change: '' },
        { label: 'Human-Reviewed Assets', value: String(verifiedMedia.length), change: '' },
        { label: 'Recorded Sites', value: String(locations || 1), change: '' },
        { label: 'Identified Signals', value: String(projectMedia.reduce((acc, m) => acc + (m.ai.tags?.length || 0), 0)), change: '' },
      ],
      timeline: projectMedia.slice(0, 10).map((m) => ({
        date: m.date,
        title: m.title,
        description: m.ai.description || 'Evidence recorded',
        mediaId: m.id,
      })),
      selectedEvidence: projectMedia.map((media) => media.id),
      aiObservations: projectMedia.flatMap((media) => media.ai.observations?.map((o: any) => o.label || o.detail) || []),
      sourceAssets: projectMedia.map((media) => media.id),
      limitations: [
        'This report summarizes observations visible in the uploaded evidence.',
        'It reflects recorded field imagery and human review decisions.',
      ],
    };

    const created = await prisma.report.create({
      data: {
        id: reportId,
        projectId,
        title: reportTitle,
        type,
        status: 'published',
        summary,
        content,
      },
      include: { project: true },
    });

    await prisma.auditEvent.create({
      data: {
        projectId,
        reportId,
        eventType: 'REPORT_GENERATED',
        actorType: 'USER',
        description: `Generated report "${reportTitle}" from ${projectMedia.length} evidence asset(s).`,
        metadata: { sourceMediaIds: content.sourceAssets },
      },
    });

    return this.toReportData(created);
  }
}

export const reportService = new ReportService();
