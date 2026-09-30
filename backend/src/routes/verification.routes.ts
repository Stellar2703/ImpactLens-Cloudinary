import { Router } from 'express';
import { verificationController } from '../controllers/verification.controller';

const router = Router();

router.get('/', (req, res, next) => verificationController.getVerifications(req, res, next));
router.patch('/:id', (req, res, next) => verificationController.updateVerification(req, res, next));

export default router;
