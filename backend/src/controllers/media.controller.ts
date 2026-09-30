import { Request, Response, NextFunction } from 'express';
import { mediaService } from '../services/media.service';
import { cloudinary } from '../config/cloudinary';
import { cloudinaryService } from '../services/cloudinary.service';
import { z } from 'zod';

const uploadMetadataSchema = z.object({
  projectId: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(200),
  location: z.string().trim().max(200).optional(),
  resourceType: z.enum(['image', 'video']).optional(),
});

export class MediaController {
  async getMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, tag, type } = req.query;
      const data = await mediaService.getAllMedia({
        projectId: projectId as string,
        tag: tag as string,
        type: type as string,
      });
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  async getMediaById(req: Request, res: Response, next: NextFunction) {
    try {
      const media = await mediaService.getMediaById(req.params.id);
      if (!media) {
        return res.status(404).json({ error: 'Media asset not found' });
      }

      res.json(media);
    } catch (err) {
      next(err);
    }
  }

  async deleteMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await mediaService.deleteMedia(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getEvidencePassport(req: Request, res: Response, next: NextFunction) {
    try {
      const passport = await mediaService.getEvidencePassport(req.params.id);
      if (!passport) return res.status(404).json({ error: 'Media asset not found' });
      res.json(passport);
    } catch (err) {
      next(err);
    }
  }

  async uploadMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'A media file is required' });
      }

      const metadata = uploadMetadataSchema.safeParse(req.body);
      if (!metadata.success) {
        return res.status(400).json({
          error: 'Invalid upload metadata',
          details: metadata.error.flatten().fieldErrors,
        });
      }

      const resourceType = metadata.data.resourceType || (file.mimetype.startsWith('video/') ? 'video' : 'image');

      const result = await mediaService.uploadAndProcessMedia(file.buffer, {
        projectId: metadata.data.projectId,
        title: metadata.data.title,
        originalFilename: file.originalname,
        location: metadata.data.location || 'Field Observation',
        resourceType,
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async analyzeMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const passport = await mediaService.getEvidencePassport(req.params.id);
      if (!passport) {
        return res.status(404).json({ error: 'Media asset not found' });
      }
      const analysis = await mediaService.analyzePersistedMedia(req.params.id);
      res.json(analysis);
    } catch (err) {
      next(err);
    }
  }

  async verifyMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, comment } = req.body;
      const validStatuses = ['confirmed', 'false_positive', 'needs_inspection', 'pending'];
      const normalizedStatus = (status || '').toLowerCase().replace(/_/g, '_');

      const result = await mediaService.verifyMedia(req.params.id, normalizedStatus, comment);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getCloudinaryStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      const isConfigured = Boolean(
        cloudName &&
        apiKey &&
        apiSecret &&
        apiSecret !== 'your_cloudinary_api_secret' &&
        apiSecret !== 'sample_secret_key'
      );

      if (!isConfigured) {
        return res.json({
          status: 'degraded',
          message: 'Cloudinary credentials are not configured on the backend.',
          cloudName: cloudName || 'not_configured',
          isConfigured: false,
        });
      }

      const ping = await cloudinary.api.ping();
      res.json({
        status: 'connected',
        message: 'Cloudinary API is fully authenticated and working!',
        cloudName,
        ping,
        isConfigured: true,
      });
    } catch (err: any) {
      res.json({
        status: 'degraded',
        message: err.message || 'Failed to ping Cloudinary API',
        isConfigured: false,
      });
    }

  }

  async getTransformation(req: Request, res: Response, next: NextFunction) {
    try {
      const preset = z.enum([
        'original',
        'optimized',
        'square',
        'portrait',
        'landscape',
        'thumbnail',
        'certified',
        'eco_focus',
        'video_preview',
      ]).parse(req.query.preset || 'optimized');
      const media = await mediaService.getEvidencePassport(req.params.id);
      if (!media) return res.status(404).json({ error: 'Media asset not found' });
      res.json({
        mediaId: req.params.id,
        preset,
        sourceUrl: media.source.secureUrl,
        transformedUrl: cloudinaryService.getTransformedUrl(media.source.cloudinaryPublicId, preset),
        derivedFrom: media.source.cloudinaryPublicId,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const mediaController = new MediaController();
