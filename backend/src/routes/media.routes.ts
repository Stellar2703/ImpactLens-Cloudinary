import { Router } from 'express';
import multer from 'multer';
import { mediaController } from '../controllers/media.controller';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
  fileFilter: (_req, file, callback) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      callback(null, true);
      return;
    }

    callback(new Error('Only image and video files are supported'));
  },
});

router.get('/', (req, res, next) => mediaController.getMedia(req, res, next));
router.get('/cloudinary-status', (req, res, next) => mediaController.getCloudinaryStatus(req, res, next));
router.get('/:id/passport', (req, res, next) => mediaController.getEvidencePassport(req, res, next));
router.get('/:id/transformation', (req, res, next) => mediaController.getTransformation(req, res, next));
router.get('/:id', (req, res, next) => mediaController.getMediaById(req, res, next));
router.post('/upload', upload.single('media'), (req, res, next) => mediaController.uploadMedia(req, res, next));
router.post('/:id/analyze', (req, res, next) => mediaController.analyzeMedia(req, res, next));
router.post('/:id/verify', (req, res, next) => mediaController.verifyMedia(req, res, next));
router.delete('/:id', (req, res, next) => mediaController.deleteMedia(req, res, next));

export default router;
