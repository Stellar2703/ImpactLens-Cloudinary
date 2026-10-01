import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { MediaData } from './mock-db';
import { cloudinaryService, CloudinaryUploadResult } from './cloudinary.service';
import { aiService, StructuredAIAnalysis } from './ai.service';
import { prisma, isDatabaseAvailable, getPersistenceStatus } from '../config/database';

export class MediaService {
  toMediaData(media: any): MediaData {
    const metadata = media.aiMetadata;
    const tags = Array.isArray(metadata?.tags) ? metadata.tags : [];
    const activities = Array.isArray(metadata?.activities) ? metadata.activities : [];
    const objects = Array.isArray(metadata?.objects) ? metadata.objects : [];
    const impactSignals = Array.isArray(metadata?.impactSignals) ? metadata.impactSignals : [];
    const riskSignals = Array.isArray(metadata?.riskSignals) ? metadata.riskSignals : [];
    const verification = media.verifications?.[0];
    const verificationStatus = verification?.status
      ? verification.status.toLowerCase()
      : riskSignals.length > 0
        ? 'needs_inspection'
        : 'pending';

    const isCloudinaryHosted = typeof media.cloudinaryUrl === 'string' && media.cloudinaryUrl.includes('res.cloudinary.com');
    const thumbnailUrl = isCloudinaryHosted && media.cloudinaryPublicId
      ? cloudinaryService.getTransformedUrl(media.cloudinaryPublicId, 'thumbnail')
      : (media.cloudinaryUrl || '');

    return {
      id: media.id,
      projectId: media.projectId,
      projectName: media.project?.name || 'Unknown project',
      title: media.title,
      type: media.resourceType === 'video' ? 'video' : 'image',
      thumbnailUrl,
      fullUrl: media.cloudinaryUrl,
      date: new Date(media.capturedAt || media.uploadedAt || Date.now()).toISOString().split('T')[0],
      location: media.project?.location || 'Field Observation',
      coordinates: { lat: media.latitude || 0, lng: media.longitude || 0 },
      ai: {
        tags,
        description: metadata?.description || media.description || '',
        confidence: Math.round((metadata?.confidence || 0.85) * 100),
        activity: activities[0] || 'Field Observation',
        analysisMode: metadata?.analysisMode || 'live_ai',
        provider: metadata?.provider || 'ImpactLens AI Vision',
        model: metadata?.model || 'meta/llama-3.2-11b-vision-instruct',
        analyzedAt: metadata?.analyzedAt ? new Date(metadata.analyzedAt).toISOString() : undefined,
        activities,
        observations: riskSignals.concat(impactSignals).map((signal: string, index: number) => ({
          id: `${media.id}-observation-${index}`,
          type: riskSignals.includes(signal) ? 'risk' : 'progress',
          label: signal,
          detail: metadata?.description || media.description || '',
          confidence: Math.round((metadata?.confidence || 0.85) * 100),
        })),
        objects,
        impactSignals,
        riskSignals,
      },
      cloudinary: {
        publicId: media.cloudinaryPublicId,
        originalUrl: media.cloudinaryUrl,
        transformedUrl: media.cloudinaryUrl,
        format: media.format || 'jpg',
        width: media.width || 0,
        height: media.height || 0,
        bytes: media.fileSize || 0,
        transformations: ['optimized', 'thumbnail', 'square', 'portrait', 'landscape'],
      },
      analysisStatus: media.analysisStatus || 'COMPLETED',
      analysisError: media.analysisError,
      verificationStatus: verificationStatus as MediaData['verificationStatus'],
    };
  }

  async getAllMedia(filters?: { projectId?: string; tag?: string; type?: string }): Promise<MediaData[]> {
    const persisted = await prisma.mediaAsset.findMany({
      where: {
        ...(filters?.projectId && filters.projectId !== 'all' ? { projectId: filters.projectId } : {}),
        ...(filters?.type && filters.type !== 'all' ? { resourceType: filters.type } : {}),
      },
      include: {
        project: true,
        aiMetadata: true,
        verifications: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { uploadedAt: 'desc' },
    });
    const mapped = persisted.map((media) => this.toMediaData(media));
    return filters?.tag && filters.tag !== 'all'
      ? mapped.filter((media) => media.ai.tags.includes(filters.tag!))
      : mapped;
  }

  async getMediaById(id: string): Promise<MediaData | null> {
    const persisted = await prisma.mediaAsset.findUnique({
      where: { id },
      include: {
        project: true,
        aiMetadata: true,
        verifications: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    return persisted ? this.toMediaData(persisted) : null;
  }

  async deleteMedia(id: string) {
    const media = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!media) throw new Error('Media asset not found');
    await prisma.mediaAsset.delete({ where: { id } });
    return { success: true, id };
  }

  async getEvidencePassport(id: string) {
    const media = await prisma.mediaAsset.findUnique({
      where: { id },
      include: {
        project: true,
        aiMetadata: true,
        verifications: { orderBy: { createdAt: 'desc' } },
        auditEvents: { orderBy: { createdAt: 'asc' } },
        milestoneLinks: { include: { milestone: true } },
      },
    });
    if (!media) return null;
    const [comparisons, reports, stories] = await Promise.all([
      prisma.comparison.findMany({
        where: { OR: [{ beforeMediaId: id }, { afterMediaId: id }] },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.report.findMany({ where: { projectId: media.projectId }, orderBy: { createdAt: 'desc' } }),
      prisma.story.findMany({ where: { projectId: media.projectId }, orderBy: { createdAt: 'desc' } }),
    ]);
    const linkedReports = reports.filter((report) => {
      const sourceAssets = (report.content as any)?.sourceAssets;
      return Array.isArray(sourceAssets) && sourceAssets.includes(id);
    });
    const linkedStories = stories.filter((story) => Array.isArray(story.assetIds) && (story.assetIds as any[]).includes(id));
    return {
      media: this.toMediaData(media),
      source: {
        id: media.id,
        projectId: media.projectId,
        projectName: media.project?.name || 'Project',
        cloudinaryPublicId: media.cloudinaryPublicId,
        secureUrl: media.cloudinaryUrl,
        originalFilename: media.originalFilename,
        cloudinaryVersion: media.cloudinaryVersion,
        cloudinaryAssetId: media.cloudinaryAssetId,
        resourceType: media.resourceType,
        format: media.format,
        fileSize: media.fileSize,
        width: media.width,
        height: media.height,
        duration: media.duration,
        uploadedAt: media.uploadedAt,
        capturedAt: media.capturedAt,
        sha256: media.sha256,
        latitude: media.latitude,
        longitude: media.longitude,
        analysisStatus: media.analysisStatus,
        analysisError: media.analysisError,
      },
      analysis: media.aiMetadata,
      reviews: media.verifications,
      milestones: media.milestoneLinks.map((link) => link.milestone),
      derived: {
        comparisons,
        reports: linkedReports.map((report) => ({ id: report.id, title: report.title, status: report.status })),
        stories: linkedStories.map((story) => ({ id: story.id, title: story.title, status: story.status })),
        transformations: ['optimized', 'thumbnail', 'certified', 'eco_focus', 'square', 'portrait', 'landscape'].map((preset) => ({
          preset,
          derivedFrom: media.cloudinaryPublicId,
          url: cloudinaryService.getTransformedUrl(media.cloudinaryPublicId, preset as any, media.cloudinaryUrl),
        })),
      },
      auditEvents: media.auditEvents,
    };
  }

  private async saveBufferLocally(
    buffer: Buffer,
    mediaId: string,
    meta: {
      projectId: string;
      title: string;
      originalFilename?: string;
      resourceType?: 'image' | 'video';
    }
  ): Promise<CloudinaryUploadResult> {
    const isVideo = meta.resourceType === 'video' || (Boolean(meta.originalFilename) && /\.(mp4|mov|webm)$/i.test(meta.originalFilename || ''));
    const ext = meta.originalFilename ? path.extname(meta.originalFilename).replace('.', '') || (isVideo ? 'mp4' : 'jpg') : (isVideo ? 'mp4' : 'jpg');
    const filename = `${mediaId}.${ext}`;
    const uploadsDir = path.join(__dirname, '../../public/images/uploads');

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, filename);
    await fs.promises.writeFile(filePath, buffer);

    const relativeUrl = `http://localhost:5000/static/images/uploads/${filename}`;

    return {
      publicId: `local_${mediaId}`,
      secureUrl: relativeUrl,
      version: 1,
      assetId: `local_${mediaId}`,
      format: ext,
      resourceType: isVideo ? 'video' : 'image',
      bytes: buffer.length,
      width: 1920,
      height: 1080,
      transformations: [
        'q_auto',
        'f_auto',
        'w_400,h_300,c_fill',
        'ar_1:1,c_fill,g_auto',
        'ar_9:16,c_fill,g_auto',
      ],
    };
  }

  async uploadAndProcessMedia(
    buffer: Buffer,
    meta: {
      projectId: string;
      title: string;
      originalFilename?: string;
      location?: string;
      resourceType?: 'image' | 'video';
    }
  ): Promise<MediaData> {
    const project = await prisma.project.findUnique({ where: { id: meta.projectId } });
    if (!project) {
      throw new Error(`Project "${meta.projectId}" not found. Please select or create a project first.`);
    }

    // 1. Upload to Cloudinary with local storage fallback
    const mediaId = `m_${Date.now().toString().slice(-6)}`;
    let cldResult: CloudinaryUploadResult;

    if (cloudinaryService.isConfigured()) {
      try {
        cldResult = await cloudinaryService.uploadBuffer(
          buffer,
          `impactlens/projects/${project.id}/evidence/${mediaId}`,
          meta.resourceType || 'auto'
        );
      } catch (uploadErr) {
        console.warn('Cloudinary upload failed, using resilient local storage:', uploadErr);
        cldResult = await this.saveBufferLocally(buffer, mediaId, meta);
      }
    } else {
      cldResult = await this.saveBufferLocally(buffer, mediaId, meta);
    }

    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    // 2. Run Vision AI Model (with automatic resilient fallback)
    let aiAnalysis: StructuredAIAnalysis;
    let analysisStatus = 'COMPLETED';
    let analysisError: string | null = null;
    try {
      aiAnalysis = await aiService.analyzeMedia(cldResult.secureUrl, {
        title: meta.title,
        location: meta.location || project.location,
      });
    } catch (err: any) {
      console.warn('AI analysis encountered an error, applying fallback:', err?.message || err);
      aiAnalysis = aiService.generateHeuristicAnalysis({
        title: meta.title,
        location: meta.location || project.location,
      });
    }

    // 3. Persist MediaAsset & AIMetadata in PostgreSQL
    const createdAsset = await prisma.mediaAsset.create({
      data: {
        id: mediaId,
        projectId: project.id,
        cloudinaryPublicId: cldResult.publicId,
        cloudinaryUrl: cldResult.secureUrl,
        originalFilename: meta.originalFilename || meta.title,
        cloudinaryVersion: String(cldResult.version),
        cloudinaryAssetId: cldResult.assetId,
        resourceType: cldResult.resourceType || meta.resourceType || 'image',
        format: cldResult.format,
        fileSize: cldResult.bytes,
        width: cldResult.width,
        height: cldResult.height,
        sha256,
        title: meta.title,
        description: aiAnalysis.description,
        capturedAt: new Date(),
        latitude: project.latitude,
        longitude: project.longitude,
        status: aiAnalysis.riskSignals && aiAnalysis.riskSignals.length > 0 ? 'NEEDS_INSPECTION' : 'AWAITING_REVIEW',
        analysisStatus,
        analysisError,
        aiMetadata: {
          create: {
            objects: aiAnalysis.objects,
            activities: aiAnalysis.activities,
            tags: aiAnalysis.tags,
            locationClues: aiAnalysis.locationClues,
            impactSignals: aiAnalysis.impactSignals,
            riskSignals: aiAnalysis.riskSignals,
            description: aiAnalysis.description,
            confidence: aiAnalysis.confidence,
            analysisStatus: 'COMPLETED',
            analysisMode: aiAnalysis.analysisMode || 'live_ai',
            provider: aiAnalysis.provider,
            model: aiAnalysis.model,
            promptVersion: aiAnalysis.promptVersion,
            rawOutput: JSON.parse(JSON.stringify(aiAnalysis)),
            evidenceQuality: 'unassessed',
            analyzedAt: aiAnalysis.analyzedAt ? new Date(aiAnalysis.analyzedAt) : new Date(),
          },
        },
      },
      include: {
        project: true,
        aiMetadata: true,
        verifications: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    // 4. If risks detected, automatically add to real PostgreSQL verification queue
    if (aiAnalysis.riskSignals && aiAnalysis.riskSignals.length > 0) {
      await prisma.verification.create({
        data: {
          mediaId: createdAsset.id,
          status: 'NEEDS_INSPECTION',
          comment: aiAnalysis.riskSignals[0] || 'Potential hazard flagged by AI vision analysis.',
          category: 'Field Risk',
        },
      });
    }

    // 5. Create Audit Event in PostgreSQL
    await prisma.auditEvent.create({
      data: {
        mediaId: createdAsset.id,
        projectId: project.id,
        eventType: 'MEDIA_UPLOADED',
        actorType: 'USER',
        description: `Uploaded "${createdAsset.title}" to project "${project.name}". Cloudinary public ID: ${cldResult.publicId}.`,
        metadata: {
          cloudinaryPublicId: cldResult.publicId,
          resourceType: cldResult.resourceType,
          format: cldResult.format,
          provider: aiAnalysis.provider,
          model: aiAnalysis.model,
        },
      },
    });

    // Return refreshed record with all relations
    const finalAsset = await prisma.mediaAsset.findUnique({
      where: { id: createdAsset.id },
      include: {
        project: true,
        aiMetadata: true,
        verifications: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    return this.toMediaData(finalAsset || createdAsset);
  }

  async verifyMedia(mediaId: string, status: any, comment?: string) {
    const normalizedStatus = String(status).toUpperCase();
    const dbStatus =
      normalizedStatus === 'CONFIRMED' || normalizedStatus === 'VERIFIED'
        ? 'CONFIRMED'
        : normalizedStatus === 'FALSE_POSITIVE' || normalizedStatus === 'REJECTED'
          ? 'FALSE_POSITIVE'
          : normalizedStatus === 'NEEDS_INSPECTION' || normalizedStatus === 'REVIEW'
            ? 'NEEDS_INSPECTION'
            : 'PENDING';

    await prisma.mediaAsset.update({
      where: { id: mediaId },
      data: { status: dbStatus },
    });

    const existingVerification = await prisma.verification.findFirst({
      where: { mediaId },
      orderBy: { createdAt: 'desc' },
    });

    if (existingVerification) {
      await prisma.verification.update({
        where: { id: existingVerification.id },
        data: { status: dbStatus, comment: comment || existingVerification.comment, reviewedAt: new Date() },
      });
    } else {
      await prisma.verification.create({
        data: {
          mediaId,
          status: dbStatus,
          comment: comment || 'Verified by reviewer',
          category: 'Manual Review',
          reviewedAt: new Date(),
        },
      });
    }

    await prisma.auditEvent.create({
      data: {
        mediaId,
        eventType: 'HUMAN_REVIEW_UPDATED',
        actorType: 'USER',
        description: `Verification status updated to ${status}.`,
        metadata: { status: dbStatus, comment: comment || null },
      },
    });

    return { success: true, mediaId, status };
  }

  async analyzePersistedMedia(mediaId: string) {
    const media = await prisma.mediaAsset.findUnique({ where: { id: mediaId }, include: { project: true } });
    if (!media) return null;

    await prisma.mediaAsset.update({
      where: { id: mediaId },
      data: { analysisStatus: 'PROCESSING', analysisError: null },
    });
    try {
      const analysis = await aiService.analyzeMedia(media.cloudinaryUrl, {
        title: media.title,
        location: media.project?.location || 'Field Observation',
      });
      await prisma.aIMetadata.upsert({
        where: { mediaId },
        create: {
          mediaId,
          objects: analysis.objects,
          activities: analysis.activities,
          tags: analysis.tags,
          locationClues: analysis.locationClues,
          impactSignals: analysis.impactSignals,
          riskSignals: analysis.riskSignals,
          description: analysis.description,
          confidence: analysis.confidence,
          analysisStatus: 'COMPLETED',
          analysisMode: analysis.analysisMode || 'live_ai',
          provider: analysis.provider,
          model: analysis.model,
          promptVersion: analysis.promptVersion,
          rawOutput: JSON.parse(JSON.stringify(analysis)),
          analyzedAt: analysis.analyzedAt ? new Date(analysis.analyzedAt) : new Date(),
        },
        update: {
          objects: analysis.objects,
          activities: analysis.activities,
          tags: analysis.tags,
          locationClues: analysis.locationClues,
          impactSignals: analysis.impactSignals,
          riskSignals: analysis.riskSignals,
          description: analysis.description,
          confidence: analysis.confidence,
          analysisStatus: 'COMPLETED',
          analysisMode: analysis.analysisMode || 'live_ai',
          provider: analysis.provider,
          model: analysis.model,
          promptVersion: analysis.promptVersion,
          rawOutput: JSON.parse(JSON.stringify(analysis)),
          analyzedAt: analysis.analyzedAt ? new Date(analysis.analyzedAt) : new Date(),
        },
      });
      await prisma.mediaAsset.update({
        where: { id: mediaId },
        data: { analysisStatus: 'COMPLETED', analysisError: null },
      });
      await prisma.auditEvent.create({
        data: {
          mediaId,
          eventType: 'AI_ANALYSIS_COMPLETED',
          actorType: 'SYSTEM',
          description: 'AI analysis completed successfully.',
          metadata: { provider: analysis.provider || null, model: analysis.model || null },
        },
      });
      return analysis;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await prisma.mediaAsset.update({
        where: { id: mediaId },
        data: { analysisStatus: 'FAILED', analysisError: message },
      });
      await prisma.auditEvent.create({
        data: {
          mediaId,
          eventType: 'AI_ANALYSIS_FAILED',
          actorType: 'SYSTEM',
          description: 'AI analysis failed.',
          metadata: { error: message },
        },
      });
      throw error;
    }
  }
}

export const mediaService = new MediaService();
