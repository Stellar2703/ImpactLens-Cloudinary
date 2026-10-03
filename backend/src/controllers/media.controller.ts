import { Request, Response, NextFunction } from 'express';
import fs from 'node:fs';
import path from 'node:path';
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
        cloudName !== 'your_cloudinary_cloud_name' &&
        apiKey !== 'your_cloudinary_api_key' &&
        apiSecret !== 'your_cloudinary_api_secret' &&
        apiSecret !== 'sample_secret_key'
      );

      const presets = [
        { id: 'optimized', name: 'Auto Optimization', desc: 'f_auto, q_auto for intelligent compression and WebP/AVIF delivery' },
        { id: 'thumbnail', name: 'Smart Thumbnail', desc: 'w_400, h_300 with smart subject gravity' },
        { id: 'certified', name: 'Certified Overlay', desc: 'Overlay: IMPACTLENS VERIFIED EVIDENCE badge' },
        { id: 'eco_focus', name: 'Eco Focus Crop', desc: '600x600 centered crop for inspection audit' },
        { id: 'portrait', name: 'Mobile / Story (9:16)', desc: '9:16 vertical crop for mobile dashboards' },
        { id: 'landscape', name: 'Executive Report (16:9)', desc: '16:9 widescreen presentation layout' },
        { id: 'square', name: 'Social / Feed (1:1)', desc: '1:1 ratio for stakeholder updates' },
      ];

      if (!isConfigured) {
        return res.json({
          status: 'degraded',
          mode: 'demo',
          message: 'Cloudinary credentials are not configured. Running in resilient local demonstration mode with local asset storage.',
          cloudName: (cloudName && cloudName !== 'your_cloudinary_cloud_name') ? cloudName : 'local_storage',
          isConfigured: false,
          fallbackActive: true,
          presets,
        });
      }

      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });

      const ping = await cloudinary.api.ping();
      res.json({
        status: 'connected',
        mode: 'live',
        message: 'Cloudinary API is fully authenticated and operational.',
        cloudName,
        apiKeyMasked: apiKey ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : null,
        ping,
        isConfigured: true,
        fallbackActive: false,
        presets,
      });
    } catch (err: any) {
      res.json({
        status: 'degraded',
        mode: 'demo',
        message: err.message || 'Failed to ping Cloudinary API. Operating in local fallback mode.',
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'local_storage',
        isConfigured: false,
        fallbackActive: true,
      });
    }
  }

  async updateCloudinaryConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({
        cloudName: z.string().trim().min(2, 'Cloud name is required'),
        apiKey: z.string().trim().min(4, 'API Key is required'),
        apiSecret: z.string().trim().min(6, 'API Secret is required'),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid credentials format',
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const { cloudName, apiKey, apiSecret } = parsed.data;

      // Reconfigure Cloudinary in memory
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });

      // Ping Cloudinary API to verify credentials
      let pingResult: any;
      try {
        pingResult = await cloudinary.api.ping();
      } catch (pingErr: any) {
        return res.status(400).json({
          success: false,
          error: pingErr?.message || 'Authentication with Cloudinary API failed. Check your Cloud Name, API Key, and API Secret.',
        });
      }

      // Update runtime process.env
      process.env.CLOUDINARY_CLOUD_NAME = cloudName;
      process.env.CLOUDINARY_API_KEY = apiKey;
      process.env.CLOUDINARY_API_SECRET = apiSecret;

      // Persist to backend/.env
      try {
        const envPath = path.join(__dirname, '../../.env');
        if (fs.existsSync(envPath)) {
          let envContent = fs.readFileSync(envPath, 'utf8');
          envContent = envContent.replace(/CLOUDINARY_CLOUD_NAME=.*/g, `CLOUDINARY_CLOUD_NAME=${cloudName}`);
          envContent = envContent.replace(/CLOUDINARY_API_KEY=.*/g, `CLOUDINARY_API_KEY=${apiKey}`);
          envContent = envContent.replace(/CLOUDINARY_API_SECRET=.*/g, `CLOUDINARY_API_SECRET=${apiSecret}`);
          fs.writeFileSync(envPath, envContent, 'utf8');
        }
      } catch (writeErr) {
        console.warn('Could not persist Cloudinary credentials to .env file:', writeErr);
      }

      return res.json({
        success: true,
        status: 'connected',
        mode: 'live',
        message: 'Cloudinary credentials verified and successfully connected!',
        cloudName,
        apiKeyMasked: `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`,
        isConfigured: true,
        ping: pingResult,
      });
    } catch (err) {
      next(err);
    }
  }

  async resetToDemoMode(req: Request, res: Response, next: NextFunction) {
    try {
      process.env.CLOUDINARY_CLOUD_NAME = 'your_cloudinary_cloud_name';
      process.env.CLOUDINARY_API_KEY = 'your_cloudinary_api_key';
      process.env.CLOUDINARY_API_SECRET = 'your_cloudinary_api_secret';

      cloudinary.config({
        cloud_name: 'your_cloudinary_cloud_name',
        api_key: 'your_cloudinary_api_key',
        api_secret: 'your_cloudinary_api_secret',
        secure: true,
      });

      try {
        const envPath = path.join(__dirname, '../../.env');
        if (fs.existsSync(envPath)) {
          let envContent = fs.readFileSync(envPath, 'utf8');
          envContent = envContent.replace(/CLOUDINARY_CLOUD_NAME=.*/g, `CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name`);
          envContent = envContent.replace(/CLOUDINARY_API_KEY=.*/g, `CLOUDINARY_API_KEY=your_cloudinary_api_key`);
          envContent = envContent.replace(/CLOUDINARY_API_SECRET=.*/g, `CLOUDINARY_API_SECRET=your_cloudinary_api_secret`);
          fs.writeFileSync(envPath, envContent, 'utf8');
        }
      } catch (writeErr) {
        console.warn('Could not persist reset to .env:', writeErr);
      }

      return res.json({
        success: true,
        status: 'degraded',
        mode: 'demo',
        message: 'Reset to local demonstration mode. Local storage is active.',
        isConfigured: false,
      });
    } catch (err) {
      next(err);
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
        transformedUrl: cloudinaryService.getTransformedUrl(media.source.cloudinaryPublicId, preset, media.source.secureUrl),
        derivedFrom: media.source.cloudinaryPublicId,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const mediaController = new MediaController();
