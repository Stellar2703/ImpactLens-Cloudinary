import { cloudinary } from '../config/cloudinary';
import { Readable } from 'stream';

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  version: number;
  assetId: string;
  format: string;
  resourceType: string;
  bytes: number;
  width: number;
  height: number;
  transformations: string[];
}

export class CloudinaryService {
  /**
   * Upload buffer directly to Cloudinary
   */
  async uploadBuffer(
    buffer: Buffer,
    folder: string = 'impactlens',
    resourceType: 'image' | 'video' | 'auto' = 'auto'
  ): Promise<CloudinaryUploadResult> {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET ||
      process.env.CLOUDINARY_API_SECRET === 'sample_secret_key'
    ) {
      throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error || !result) {
            return reject(error || new Error('Upload to Cloudinary failed'));
          }
          resolve({
            publicId: result.public_id,
            secureUrl: result.secure_url,
            version: result.version,
            assetId: result.asset_id,
            format: result.format || 'jpg',
            resourceType: result.resource_type || 'image',
            bytes: result.bytes,
            width: result.width,
            height: result.height,
            transformations: [
              'q_auto',
              'f_auto',
              'w_400,h_300,c_fill',
              'ar_1:1,c_fill,g_auto',
              'ar_9:16,c_fill,g_auto',
            ],
          });
        }
      );

      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);
      stream.pipe(uploadStream);
    });
  }

  /**
   * Generates tailored transformation URLs
   */
  getTransformedUrl(
    publicId: string,
    preset: 'original' | 'optimized' | 'square' | 'portrait' | 'landscape' | 'thumbnail' | 'certified' | 'eco_focus' | 'video_preview'
  ): string {
    const transformations: Record<string, any> = {
      original: {},
      optimized: { quality: 'auto', fetch_format: 'auto' },
      square: { aspect_ratio: '1:1', crop: 'fill', gravity: 'auto', quality: 'auto', fetch_format: 'auto' },
      portrait: { aspect_ratio: '9:16', crop: 'fill', gravity: 'auto', quality: 'auto', fetch_format: 'auto' },
      landscape: { aspect_ratio: '16:9', crop: 'fill', gravity: 'auto', quality: 'auto', fetch_format: 'auto' },
      thumbnail: { width: 400, height: 300, crop: 'fill', gravity: 'auto', quality: 'auto', fetch_format: 'auto' },
      eco_focus: { width: 600, height: 600, crop: 'thumb', gravity: 'auto', quality: 'auto', fetch_format: 'auto' },
      video_preview: { effect: 'preview:duration_4', quality: 'auto', fetch_format: 'auto' },
      certified: {
        transformation: [
          { quality: 'auto', fetch_format: 'auto' },
          {
            overlay: {
              font_family: 'Arial',
              font_size: 20,
              font_weight: 'bold',
              text: 'IMPACTLENS VERIFIED EVIDENCE',
            },
            color: '#FFFFFF',
            background: '#059669',
            gravity: 'south_east',
            x: 16,
            y: 16,
          },
        ],
      },
    };

    return cloudinary.url(publicId, {
      secure: true,
      ...(transformations[preset] || { quality: 'auto', fetch_format: 'auto' }),
    });
  }

  /**
   * Generates dynamic Cloudinary side-by-side comparison URL
   */
  getComparisonUrl(beforePublicId: string, afterPublicId: string): string {
    return cloudinary.url(beforePublicId, {
      secure: true,
      transformation: [
        { width: 600, height: 400, crop: 'fill', gravity: 'auto', quality: 'auto', fetch_format: 'auto' },
      ],
    });
  }
}

export const cloudinaryService = new CloudinaryService();
